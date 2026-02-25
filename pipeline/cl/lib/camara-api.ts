/**
 * Cámara de Diputados API client — votes by bulletin
 * Source: opendata.camara.cl/wscamaradiputados.asmx
 *
 * Endpoints used:
 *   getVotaciones_Boletin?prmBoletin=XXXXX-XX  → list of vote IDs + summary
 *   getVotacion_Detalle?prmVotacionID=XXXXX    → individual vote detail
 *
 * All counts (si/no/abstencion/dispensados) come from the API's official
 * TotalAfirmativos/TotalNegativos/TotalAbstenciones/TotalDispensados fields.
 * The resultado comes from the API's <Resultado> field, NOT inferred.
 */
import { XMLParser } from 'fast-xml-parser';
import type { VotacionData } from '../types.js';
import { fetchWithRetry } from '../../shared/retry.js';

const CAMARA_BASE = 'https://opendata.camara.cl/wscamaradiputados.asmx';

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_'
});

/** Fetch all Cámara votes for a boletín (e.g., "15995-02") */
export async function fetchVotacionesCamara(boletin: string): Promise<VotacionData[]> {
	const url = `${CAMARA_BASE}/getVotaciones_Boletin?prmBoletin=${boletin}`;
	console.log(`  Fetching Cámara votes: ${url}`);

	const resp = await fetchWithRetry(url, { label: 'cámara votaciones' });
	if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching Cámara votaciones`);

	const xml = await resp.text();
	const parsed = parser.parse(xml);

	const votaciones = ensureArray(parsed?.Votaciones?.Votacion);
	if (votaciones.length === 0) return [];

	const results: VotacionData[] = [];

	for (const v of votaciones) {
		const votacionId = v.ID;
		if (!votacionId) continue;

		const detail = await fetchVotacionDetalle(String(votacionId));
		if (detail) {
			// Use date from the list (more reliable) if detail date is missing
			if (!detail.fecha && v.Fecha) {
				detail.fecha = parseIsoDate(v.Fecha);
			}
			results.push(detail);
		}
	}

	return results;
}

/** Fetch a single vote detail from the Cámara */
async function fetchVotacionDetalle(votacionId: string): Promise<VotacionData | null> {
	const url = `${CAMARA_BASE}/getVotacion_Detalle?prmVotacionID=${votacionId}`;

	try {
		const resp = await fetchWithRetry(url, { label: `cámara vote ${votacionId}` });
		if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

		const xml = await resp.text();
		const parsed = parser.parse(xml);

		const root = parsed?.Votacion || {};
		const votos = ensureArray(root?.Votos?.Voto);

		// Classify individual votes by Opcion code and text
		const forVoters: string[] = [];
		const againstVoters: string[] = [];
		const abstainVoters: string[] = [];

		for (const v of votos) {
			const dip = v.Diputado || {};
			const nombre = formatNombreCamara(dip);

			// Use @_Codigo for classification (0=En Contra, 1=Afirmativo, 2=Abstención, 3=Dispensado)
			const opcionCode = String(v.Opcion?.['@_Codigo'] ?? '');
			const opcionText = (v.Opcion?.['#text'] || v.Opcion || '').toString().toLowerCase();

			if (opcionCode === '1' || opcionText.includes('afirmativo'))
				forVoters.push(nombre);
			else if (opcionCode === '0' || opcionText.includes('contra'))
				againstVoters.push(nombre);
			else if (opcionCode === '2' || opcionText.includes('absten'))
				abstainVoters.push(nombre);
			// Code 3 / "dispensado" = excused, not a vote
		}

		// Official result from API <Resultado> field
		const resultadoText = textValue(root.Resultado).toLowerCase();
		let resultado: 'approved' | 'rejected';
		if (resultadoText.includes('aprobado')) {
			resultado = 'approved';
		} else if (resultadoText.includes('rechazado')) {
			resultado = 'rejected';
		} else {
			// Unexpected value — log warning but don't crash
			console.warn(`  Warning: Unknown Cámara Resultado "${resultadoText}" for vote ${votacionId}, falling back to vote count`);
			resultado = forVoters.length > againstVoters.length ? 'approved' : 'rejected';
		}

		return {
			fecha: parseIsoDate(root.Fecha || ''),
			sesion: root.Sesion?.Numero?.toString() || '',
			// Official counts from API (fallback to parsed voters only if API field missing)
			si: Number(root.TotalAfirmativos) || forVoters.length,
			no: Number(root.TotalNegativos) || againstVoters.length,
			abstencion: Number(root.TotalAbstenciones) || abstainVoters.length,
			dispensados: Number(root.TotalDispensados) || 0,
			resultado,
			chamber: 'camara',
			quorum: textValue(root.Quorum),
			tipoVotacion: textValue(root.Tipo),
			etapa: textValue(root.Tramite),
			tema: (typeof root.Articulo === 'string' ? root.Articulo : '') || '',
			votantes: {
				for: forVoters,
				against: againstVoters,
				abstain: abstainVoters
			}
		};
	} catch (err) {
		console.warn(`  Warning: Could not fetch Cámara vote ${votacionId}: ${(err as Error).message}`);
		return null;
	}
}

/**
 * Format a Cámara diputado name using all available fields.
 * API provides: Nombre, Apellido_Paterno, Apellido_Materno
 * Output: "Apellido_Paterno Inicial_Materno., Nombre" (e.g., "Acevedo S., María Candelaria")
 * Matches Senate convention for consistency.
 */
function formatNombreCamara(dip: Record<string, string>): string {
	const apellidoPaterno = (dip.Apellido_Paterno || '').trim();
	const apellidoMaterno = (dip.Apellido_Materno || '').trim();
	const nombre = (dip.Nombre || '').trim();

	const maternoInit = apellidoMaterno ? ` ${apellidoMaterno.charAt(0)}.` : '';

	if (apellidoPaterno && nombre) {
		return `${apellidoPaterno}${maternoInit}, ${nombre}`;
	}
	// Fallback: whatever we have
	return [nombre, apellidoPaterno].filter(Boolean).join(' ');
}

/**
 * Extract text value from an XML node that may be either a plain string
 * or an object with #text (when attributes are present).
 * e.g., <Resultado Codigo="1">Aprobado</Resultado> → "Aprobado"
 */
function textValue(node: unknown): string {
	if (!node) return '';
	if (typeof node === 'string') return node;
	if (typeof node === 'object' && node !== null && '#text' in node) {
		return String((node as Record<string, unknown>)['#text']);
	}
	return String(node);
}

/** Convert ISO datetime "2024-03-11T19:16:59" to "2024-03-11" */
function parseIsoDate(fecha: string): string {
	if (fecha.includes('T')) return fecha.split('T')[0];
	return fecha;
}

function ensureArray<T>(val: T | T[] | undefined): T[] {
	if (!val) return [];
	return Array.isArray(val) ? val : [val];
}
