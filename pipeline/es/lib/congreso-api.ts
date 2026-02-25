/**
 * Congreso de los Diputados — Open Data votaciones client
 *
 * Scrapes the votaciones page for a legislatura/date to find JSON vote files,
 * then downloads and parses them to find the final ("de conjunto") vote for a law.
 *
 * Optimized: checks HTML text for keywords BEFORE downloading JSONs,
 * and searches multiple dates in parallel.
 *
 * API: https://www.congreso.es/es/opendata/votaciones
 */

/** A group of initiatives voted on the same plenary date, each with its expediente */
export interface InitiativeGroup {
	title: string; // "Proyecto de Ley Orgánica de..."
	expediente: string; // "121/000007" extracted from <a class="n_exp">
	jsonUrls: string[]; // Vote JSON URLs within this group
}

export interface CongresoVote {
	sessionNumber: number;
	voteNumber: number;
	date: string; // "19/11/2020"
	titulo: string; // "Dictámenes de Comisiones..."
	textoExpediente: string; // "Proyecto de Ley Orgánica por la que se modifica..."
	tituloSubGrupo: string; // "Votación de conjunto." or enmienda specific
	totales: { afavor: number; enContra: number; abstenciones: number; presentes: number };
	votaciones: Array<{ diputado: string; grupo: string; voto: string }>;
}

/** Legislaturas con rangos de fechas */
const LEGISLATURAS: Array<{ num: number; roman: string; desde: string; hasta: string }> = [
	{ num: 15, roman: 'XV', desde: '2023-08-17', hasta: '2099-12-31' },
	{ num: 14, roman: 'XIV', desde: '2020-01-03', hasta: '2023-08-17' },
	{ num: 13, roman: 'XIII', desde: '2019-05-21', hasta: '2019-09-24' },
	{ num: 12, roman: 'XII', desde: '2016-07-19', hasta: '2019-02-27' },
	{ num: 11, roman: 'XI', desde: '2016-01-13', hasta: '2016-05-03' },
	{ num: 10, roman: 'X', desde: '2011-12-13', hasta: '2015-10-27' }
];

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; parlamento-ai/1.0)' };

/** Determina legislatura (numeral romano) por fecha YYYY-MM-DD */
export function getLegislatura(date: string): string | null {
	for (const leg of LEGISLATURAS) {
		if (date >= leg.desde && date < leg.hasta) return leg.roman;
	}
	return null;
}

/** Convierte YYYY-MM-DD a DD/MM/YYYY para la URL del Congreso */
function toCongresoDate(isoDate: string): string {
	const [y, m, d] = isoDate.split('-');
	return `${d}/${m}/${y}`;
}

interface VotePage {
	html: string;
	urls: string[];
	groups: InitiativeGroup[];
}

/**
 * Fetch votaciones page for a legislatura/date.
 * Returns both raw HTML (for keyword pre-filtering) and extracted JSON URLs.
 */
export async function fetchVotePage(legislatura: string, date: string): Promise<VotePage | null> {
	const congresoDate = toCongresoDate(date);
	const url =
		`https://www.congreso.es/es/opendata/votaciones?` +
		`p_p_id=votaciones&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view` +
		`&targetLegislatura=${legislatura}&targetDate=${congresoDate}`;

	const res = await fetch(url, { headers: HEADERS });
	if (!res.ok) return null;

	const html = await res.text();
	const re = /href="(\/webpublica\/opendata\/votaciones\/[^"]*\.json)"/g;
	const urls: string[] = [];
	let m;
	while ((m = re.exec(html)) !== null) {
		urls.push(`https://www.congreso.es${m[1]}`);
	}

	if (urls.length === 0) return null;
	const groups = parseInitiativeGroups(html);
	return { html, urls, groups };
}

/** Descarga un JSON de votacion y lo parsea */
export async function fetchVote(url: string): Promise<CongresoVote> {
	const res = await fetch(url, { headers: HEADERS });
	if (!res.ok) throw new Error(`Congreso API ${res.status}: ${url}`);
	const json = (await res.json()) as Record<string, unknown>;
	return parseVoteJson(json);
}

/**
 * Check if the HTML page text contains our keywords.
 * The Congreso page shows vote titles/expedientes directly in the HTML,
 * so we can pre-filter dates WITHOUT downloading any JSONs.
 */
export function htmlContainsKeywords(html: string, keywords: string[]): boolean {
	const normalized = normalize(html);
	return keywords.every((kw) => normalized.includes(kw));
}

/**
 * Find the final ("de conjunto") vote for a law from a set of JSON URLs.
 * Downloads all JSONs, filters by title keywords, picks the best match.
 */
export async function findFinalVoteFromUrls(
	urls: string[],
	keywords: string[]
): Promise<CongresoVote | null> {
	// Download all vote JSONs in parallel with concurrency limit
	const CONCURRENCY = 15;
	const votes: CongresoVote[] = [];

	for (let i = 0; i < urls.length; i += CONCURRENCY) {
		const batch = urls.slice(i, i + CONCURRENCY);
		const results = await Promise.allSettled(batch.map((u) => fetchVote(u)));
		for (const r of results) {
			if (r.status === 'fulfilled') votes.push(r.value);
		}
	}

	// Filter votes whose textoExpediente matches the law title
	const matching = votes.filter((v) => {
		const texto = normalize(v.textoExpediente);
		return keywords.every((kw) => texto.includes(kw));
	});

	if (matching.length === 0) return null;

	// Only accept "votación de conjunto" (final vote on the whole law).
	// Other vote types (enmiendas, artículos separados) are partial and unreliable.
	const conjunto = matching.find((v) => isConjuntoVote(v));
	return conjunto ?? null;
}

/**
 * Parse initiative groups from the Congreso votaciones HTML page.
 *
 * The HTML contains expediente links (<a class="n_exp">) and section titles
 * (<h5 class="con_est">). We extract groups of {expediente, title, jsonUrls}
 * so we can match votes by expediente rather than keyword matching.
 */
export function parseInitiativeGroups(html: string): InitiativeGroup[] {
	// Find expediente anchors — class="n_exp" can appear before or after the href
	// Real HTML: <a href="..._iniciativas_id=121/000062" class="n_exp" target="_blank">
	const expRe = /<a\s[^>]*_iniciativas_id=(\d{3}\/\d{6})[^>]*class="n_exp"[^>]*>|<a\s[^>]*class="n_exp"[^>]*_iniciativas_id=(\d{3}\/\d{6})[^>]*>/g;
	// Find initiative titles: only <h5> (not <h6> which are sub-items like "Enmienda 134")
	const titleRe = /<h5\s+class="con_est">([\s\S]*?)<\/h5>/g;
	// Find JSON URLs
	const jsonRe = /href="(\/webpublica\/opendata\/votaciones\/[^"]*\.json)"/g;

	// Collect all matches with their positions
	interface HtmlToken {
		type: 'expediente' | 'title' | 'json';
		pos: number;
		value: string;
	}
	const tokens: HtmlToken[] = [];

	let m: RegExpExecArray | null;
	while ((m = expRe.exec(html)) !== null) {
		tokens.push({ type: 'expediente', pos: m.index, value: m[1] || m[2] });
	}
	while ((m = titleRe.exec(html)) !== null) {
		tokens.push({ type: 'title', pos: m.index, value: m[1].replace(/<[^>]+>/g, '').trim() });
	}
	while ((m = jsonRe.exec(html)) !== null) {
		tokens.push({ type: 'json', pos: m.index, value: `https://www.congreso.es${m[1]}` });
	}

	// Sort by position in HTML
	tokens.sort((a, b) => a.pos - b.pos);

	// Build groups: each expediente starts a new group, collect titles and JSONs
	const groups: InitiativeGroup[] = [];
	let currentTitle = '';

	for (const token of tokens) {
		if (token.type === 'title') {
			currentTitle = token.value;
		} else if (token.type === 'expediente') {
			groups.push({
				title: currentTitle,
				expediente: token.value,
				jsonUrls: []
			});
		} else if (token.type === 'json' && groups.length > 0) {
			groups[groups.length - 1].jsonUrls.push(token.value);
		}
	}

	return groups;
}

/**
 * Find the appropriate vote within a group's JSON URLs based on rango.
 *
 * - Ley Orgánica → "votación de conjunto" (required by parliamentary rules)
 * - Ley ordinaria → "dictamen", then "enmiendas del Senado", then single vote
 */
export async function findVoteInGroup(
	urls: string[],
	rango: string
): Promise<CongresoVote | null> {
	if (urls.length === 0) return null;

	const CONCURRENCY = 15;
	const votes: CongresoVote[] = [];

	for (let i = 0; i < urls.length; i += CONCURRENCY) {
		const batch = urls.slice(i, i + CONCURRENCY);
		const results = await Promise.allSettled(batch.map((u) => fetchVote(u)));
		for (const r of results) {
			if (r.status === 'fulfilled') votes.push(r.value);
		}
	}

	const isOrganica = normalize(rango).includes('organica');

	if (isOrganica) {
		// Ley Orgánica requires "votación de conjunto"
		return votes.find((v) => isConjuntoVote(v)) ?? null;
	}

	// Ley ordinaria: prefer dictamen, then enmiendas del Senado, then single vote
	const dictamen = votes.find((v) => normalize(v.tituloSubGrupo).includes('dictamen'));
	if (dictamen) return dictamen;

	// "Enmiendas del Senado" — "senado" can be in titulo OR tituloSubGrupo
	const enmiendasSenado = votes.find((v) => {
		const titulo = normalize(v.titulo);
		const sub = normalize(v.tituloSubGrupo);
		const hasSenado = sub.includes('senado') || titulo.includes('senado');
		const hasEnmienda = sub.includes('enmienda') || titulo.includes('enmienda');
		return hasSenado && hasEnmienda;
	});
	if (enmiendasSenado) return enmiendasSenado;

	// If there's exactly one vote in the group, use it
	if (votes.length === 1) return votes[0];

	return null;
}

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Detect if a vote is a "votación de conjunto".
 * Some votes have this in tituloSubGrupo, others in textoExpediente (when tituloSubGrupo is empty).
 */
function isConjuntoVote(v: CongresoVote): boolean {
	const sub = normalize(v.tituloSubGrupo);
	if (sub.includes('conjunto')) return true;
	// Fallback: check textoExpediente (e.g. "Votación de conjunto del Proyecto de Ley Orgánica...")
	if (!v.tituloSubGrupo.trim()) {
		const texto = normalize(v.textoExpediente);
		if (texto.includes('votacion de conjunto')) return true;
	}
	return false;
}

/**
 * Get a descriptive vote type label.
 * Uses tituloSubGrupo if available, otherwise extracts from textoExpediente.
 */
export function getVoteTypeLabel(v: CongresoVote): string {
	if (v.tituloSubGrupo.trim()) return v.tituloSubGrupo;
	if (isConjuntoVote(v)) return 'Votación de conjunto';
	const texto = normalize(v.textoExpediente);
	if (texto.includes('enmienda')) return 'Enmiendas del Senado';
	if (texto.includes('dictamen')) return 'Dictamen';
	return '';
}

function normalize(s: string): string {
	return s
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}

const STOP_WORDS = new Set([
	'de', 'del', 'la', 'el', 'los', 'las', 'por', 'que', 'para', 'con',
	'una', 'uno', 'se', 'en', 'al', 'ley', 'real', 'decreto', 'organica',
	'articulo', 'disposicion', 'proyecto', 'enero', 'febrero', 'marzo',
	'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre',
	'noviembre', 'diciembre'
]);

/**
 * Extract meaningful keywords from a BOE law title.
 *
 * Strategy: strip the law's own "Ley X/YYYY, de DD de MES," preamble,
 * keep numbers (e.g. "2006" is very distinctive), and use the substantive
 * description for matching against Congreso textoExpediente.
 */
export function extractKeywords(title: string): string[] {
	let t = normalize(title);

	// Strip leading law identifier + date: "ley organica 3/2020, de 29 de diciembre, "
	t = t.replace(/^[^,]*,\s*de\s+\d+\s+de\s+\w+,\s*/, '');

	// Split keeping both words and number sequences
	const tokens = t
		.replace(/[^a-z0-9\s]/g, ' ')
		.split(/\s+/)
		.filter((w) => w.length > 1 && !STOP_WORDS.has(w));

	// Prioritize: numbers first (very distinctive), then longer words
	const numbers = tokens.filter((w) => /\d/.test(w));
	const words = tokens.filter((w) => !/\d/.test(w) && w.length > 3);

	return [...numbers.slice(0, 3), ...words.slice(0, 4)].slice(0, 5);
}

function parseVoteJson(json: Record<string, unknown>): CongresoVote {
	const info = json.informacion as Record<string, unknown> | undefined;
	const votacionesArr = json.votaciones as Array<Record<string, unknown>> | undefined;

	return {
		sessionNumber: Number(info?.sesion ?? 0),
		voteNumber: Number(info?.numeroVotacion ?? 0),
		date: String(info?.fecha ?? ''),
		titulo: String(info?.titulo ?? ''),
		textoExpediente: String(info?.textoExpediente ?? ''),
		tituloSubGrupo: String(info?.tituloSubGrupo ?? ''),
		totales: {
			afavor: Number((json.totales as Record<string, unknown>)?.afavor ?? 0),
			enContra: Number((json.totales as Record<string, unknown>)?.enContra ?? 0),
			abstenciones: Number((json.totales as Record<string, unknown>)?.abstenciones ?? 0),
			presentes: Number((json.totales as Record<string, unknown>)?.presentes ?? 0)
		},
		votaciones:
			votacionesArr?.map((v) => ({
				diputado: String(v.diputado ?? ''),
				grupo: String(v.grupo ?? ''),
				voto: String(v.voto ?? '')
			})) ?? []
	};
}
