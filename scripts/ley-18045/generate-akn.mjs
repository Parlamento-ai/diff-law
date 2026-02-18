/**
 * Generate AKN 3.0 XML documents for the full version history of
 * Ley 18.045 — Ley de Mercado de Valores (1981-2025).
 *
 * Creates a timeline with 32 entries representing all historical versions.
 * Each version after the original includes a changeSet with article-level diffs.
 *
 * Structure:
 *   01-original.xml         — Original text (1981-10-22)
 *   02-amendment-1.xml      — DL 3.538 (1981-10-23)
 *   ...
 *   32-amendment-31.xml     — Ley 21.735 (2025-03-26)
 *   33-final.xml            — Current version (2025-03-26)
 *
 * Usage: node scripts/ley-18045/generate-akn.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_DIR = join(__dirname, '../../research/2026-02-18/ley-18045/json');
const AKN_DIR = join(__dirname, '../../research/2026-02-18/ley-18045/akn');
mkdirSync(AKN_DIR, { recursive: true });

// ═══════════════════════════════════════════════════════
// Modifying law metadata for each version
// ═══════════════════════════════════════════════════════

const VERSION_META = {
	'1981-10-22': { label: 'Texto Original', type: 'original' },
	'1981-10-23': { label: 'DL 3.538', desc: 'Crea la Superintendencia de Valores y Seguros' },
	'1981-10-31': { label: 'DFL 251', desc: 'Ley de Seguros' },
	'1981-12-31': { label: 'DFL 3', desc: 'Ley General de Bancos' },
	'1985-12-28': { label: 'Ley 18.482', desc: 'Incentivos al sector exportador' },
	'1987-10-20': { label: 'Ley 18.660', desc: 'Modifica Ley de Mercado de Valores' },
	'1989-12-21': { label: 'Ley 18.876', desc: 'Depósito y custodia de valores' },
	'1989-12-30': { label: 'Ley 18.899', desc: 'Deroga disposiciones legales' },
	'1993-06-01': { label: 'Ley 19.221', desc: 'Establece mayoría de edad a 18 años' },
	'1994-03-19': { label: 'Ley 19.301', desc: 'Gran reforma al mercado de capitales' },
	'1995-05-18': { label: 'Ley 19.389', desc: 'Modifica Ley de Mercado de Valores' },
	'1997-07-30': { label: 'Ley 19.506', desc: 'Modifica competencias SVS' },
	'1999-01-18': { label: 'Ley 19.601', desc: 'OPA y gobierno corporativo' },
	'1999-08-26': { label: 'Ley 19.623', desc: 'Modifica Ley de Mercado de Valores' },
	'2000-12-20': { label: 'Ley 19.705', desc: 'Regula OPAs y gobierno corporativo' },
	'2001-11-07': { label: 'Ley 19.768', desc: 'Reforma mercado de capitales (MK1)' },
	'2002-05-31': { label: 'Ley 19.806', desc: 'Adecuaciones reforma procesal penal' },
	'2007-06-05': { label: 'Ley 20.190', desc: 'Reforma mercado de capitales (MK2)' },
	'2009-04-28': { label: 'Ley 20.343', desc: 'Modifica Ley de Mercado de Valores' },
	'2010-01-01': { label: 'Ley 20.382', desc: 'Gobierno corporativo de empresas' },
	'2010-09-06': { label: 'Ley 20.345', desc: 'Compensación y liquidación de valores' },
	'2010-10-01': { label: 'Ley 20.448', desc: 'Reforma mercado de capitales (MK3)' },
	'2012-02-01': { label: 'Ley 20.552', desc: 'Modifica Ley de Mercado de Valores' },
	'2014-05-01': { label: 'Ley 20.712', desc: 'Administración de fondos de terceros' },
	'2014-10-10': { label: 'Ley 20.720', desc: 'Reorganización y liquidación de empresas' },
	'2020-10-19': { label: 'Ley 21.276', desc: 'Nuevo delito de uso de información privilegiada' },
	'2021-04-13': { label: 'Ley 21.314', desc: 'Transparencia mercado financiero' },
	'2022-02-01': { label: 'Ley 21.398', desc: 'Ley pro-consumidor' },
	'2022-06-13': { label: 'Ley 21.455', desc: 'Ley Marco de Cambio Climático' },
	'2023-08-17': { label: 'Ley 21.595', desc: 'Delitos económicos' },
	'2023-12-30': { label: 'Ley 21.641', desc: 'Modifica Ley de Mercado de Valores' },
	'2025-03-26': { label: 'Ley 21.735', desc: 'Reforma de Pensiones', type: 'final' },
};

// ═══════════════════════════════════════════════════════
// Text cleaning (shared with generate-akn.mjs from Ley 21.735)
// ═══════════════════════════════════════════════════════

function cleanLeyChileAnnotations(text) {
	let result = text;
	result = result.replace(
		/\n?\s*El (?:Art\.|art\.|artículo|Artículo|inciso)[^\n]*?(?:de la|del)\s+(?:LEY|DECRETO LEY|Ley|DFL|D\.?S\.?)\s+\d+[^\n]*?publicad[ao][^\n]*/gi,
		''
	);
	result = result.replace(
		/(?:LEY|Ley|DL|DFL|DECRETO LEY|D\.?S\.?)\s+\d+[A-Za-z]*(?:\s*\n\s*(?:Art\.?\s+[^\n]*|N[°ºo]\s*[^\n]*|D\.O\.?\s*[\d.]+))*\s*/gi,
		' '
	);
	result = result.replace(/D\.O\.?\s*[\dO]{2}[\.\dO]+/g, '');
	result = result.replace(/\s*INCI\s*S?O(?:S(?:OS)?|S)?\s+DEROGADOS?\b/gi, '');
	result = result.replace(/\s*IN\s*CISOS?\s+DEROGADOS?\b/gi, '');
	result = result.replace(/\s*INCISO(?:\s+FINAL)?\s*[-–]?\s*DEROGADOS?\b/gi, '');
	result = result.replace(/\s*INCISOS\s+DEROGADOS\b/gi, '');
	result = result.replace(/\s*(?:ARTICULO|ARTÍCULO)\s+DEROGADO\b/gi, '');
	result = result.replace(/^\s*DEROGADO:\s*/im, '');
	result = result.replace(/\s*NOTA\s*\d*\s*:?\s*$/gm, '');
	result = result.replace(/\nNOTA[^]*$/s, '');
	result = result.replace(/^\s*Art\.?\s+[\wáéíóúñÁÉÍÓÚÑ°º]+[^\n]*$/gm, '');
	result = result.replace(/\bGADO\b/g, '');
	result = result.replace(/\n{3,}/g, '\n\n');
	result = result.replace(/\s{2,}/g, ' ');
	result = result.replace(/\s+$/gm, '');
	return result.trim();
}

function stripHtmlEntities(html) {
	return html
		.replace(/<div[^>]*class="n[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
		.replace(/<span[^>]*class="n"[^>]*>[\s\S]*?<\/span>/gi, '')
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<div[^>]*class="p"[^>]*>/gi, '')
		.replace(/<\/div>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&#xF3;/g, 'ó').replace(/&#xE9;/g, 'é').replace(/&#xED;/g, 'í')
		.replace(/&#xE1;/g, 'á').replace(/&#xFA;/g, 'ú').replace(/&#xF1;/g, 'ñ')
		.replace(/&#xB0;/g, '°').replace(/&#xBA;/g, 'º').replace(/&#xAB;/g, '«')
		.replace(/&#xBB;/g, '»').replace(/&#xC1;/g, 'Á').replace(/&#xC9;/g, 'É')
		.replace(/&#xCD;/g, 'Í').replace(/&#xD3;/g, 'Ó').replace(/&#xDA;/g, 'Ú')
		.replace(/&#xD1;/g, 'Ñ')
		.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
		.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec)))
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

function escapeXml(text) {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

// ═══════════════════════════════════════════════════════
// Article extraction from LeyChile JSON
// ═══════════════════════════════════════════════════════

function extractArticlesFromJson(jsonPath) {
	const data = JSON.parse(readFileSync(jsonPath, 'utf-8'));
	const sections = [];
	const usedEIds = new Map();

	function collectArticles(items, parentTitle = '') {
		const articles = [];
		for (const item of items) {
			const estEntry = data.estructura?.find(e => e.i === item.i);
			const name = estEntry?.n || '';
			const isTitle = /^t[ií]tulo/i.test(name) || /^cap[ií]tulo/i.test(name) || /^p[aá]rrafo/i.test(name);

			const text = item.t ? stripHtmlEntities(item.t) : '';
			const cleanedText = cleanLeyChileAnnotations(text);
			const artMatch = cleanedText.match(/^(?:\s*)(?:Art[ií]culo|ARTICULO)\s+(\d+[°ºo]?\s*(?:bis|ter|qu[aá]ter|quinquies)?)/i);

			if (artMatch) {
				const artNum = artMatch[1].replace(/[°ºo]/g, '').trim();
				let eId = 'art_' + artNum.toLowerCase().replace(/\s+/g, '');
				const count = usedEIds.get(eId) || 0;
				usedEIds.set(eId, count + 1);
				if (count > 0) eId = eId + '_t' + count;
				articles.push({ type: 'article', eId, num: artNum, text: cleanedText, title: parentTitle });
			}

			if (item.h) {
				const childTitle = isTitle ? name : parentTitle;
				articles.push(...collectArticles(item.h, childTitle));
			}
		}
		return articles;
	}

	function processItem(item, parentTitle = '') {
		const estEntry = data.estructura?.find(e => e.i === item.i);
		const name = estEntry?.n || '';
		const isTitle = /^t[ií]tulo/i.test(name) || /^cap[ií]tulo/i.test(name);

		if (isTitle && item.h) {
			const articles = collectArticles(item.h, name);
			if (articles.length > 0) {
				const eId = 'sec_titulo_' + (sections.length + 1);
				sections.push({ eId, heading: name, articles });
			}
			return;
		}

		if (item.h) {
			const articles = collectArticles(item.h, parentTitle || name);
			if (articles.length > 0) {
				const titleForSection = parentTitle || name || 'Disposiciones Generales';
				const eId = 'sec_titulo_' + (sections.length + 1);
				sections.push({ eId, heading: titleForSection, articles });
			}
		}
	}

	for (const item of data.html) {
		processItem(item);
	}

	if (sections.length === 0) {
		const allArticles = collectArticles(data.html, '');
		if (allArticles.length > 0) {
			sections.push({
				eId: 'sec_titulo_1',
				heading: 'Disposiciones',
				articles: allArticles
			});
		}
	}

	return { sections };
}

// ═══════════════════════════════════════════════════════
// Diff computation
// ═══════════════════════════════════════════════════════

function buildArticleMap(sections) {
	const map = new Map();
	for (const sec of sections) {
		for (const art of sec.articles) {
			map.set(art.eId, art.text);
		}
	}
	return map;
}

function computeChanges(oldMap, newMap) {
	const changes = [];

	// Substitutes and inserts
	const newKeys = [...newMap.keys()];
	for (let i = 0; i < newKeys.length; i++) {
		const eId = newKeys[i];
		if (oldMap.has(eId)) {
			if (oldMap.get(eId) !== newMap.get(eId)) {
				changes.push({
					type: 'substitute',
					eId,
					oldText: oldMap.get(eId),
					newText: newMap.get(eId),
				});
			}
		} else {
			// Find the previous article for "after" reference
			const afterEId = i > 0 ? newKeys[i - 1] : '';
			changes.push({
				type: 'insert',
				eId,
				afterEId,
				newText: newMap.get(eId),
			});
		}
	}

	// Repeals
	for (const eId of oldMap.keys()) {
		if (!newMap.has(eId)) {
			changes.push({
				type: 'repeal',
				eId,
				oldText: oldMap.get(eId),
			});
		}
	}

	return changes;
}

// ═══════════════════════════════════════════════════════
// AKN XML generation
// ═══════════════════════════════════════════════════════

function generateActXml(config) {
	const { frbr, title, preface, sections } = config;

	const sectionsXml = sections.map(sec => {
		const articlesXml = sec.articles.map(art => {
			const heading = `Artículo ${art.num}`;
			return `      <article eId="${escapeXml(art.eId)}">
        <heading>${escapeXml(heading)}</heading>
        <content>
          <p>${escapeXml(art.text)}</p>
        </content>
      </article>`;
		}).join('\n');

		return `    <section eId="${escapeXml(sec.eId)}">
      <heading>${escapeXml(sec.heading)}</heading>
${articlesXml}
    </section>`;
	}).join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <act name="ley-18045">
    <meta>
      <identification source="#congreso">
        <FRBRWork>
          <FRBRthis value="/cl/act/ley-18045"/>
          <FRBRuri value="/cl/act/ley-18045"/>
          <FRBRdate date="1981-10-22" name="publicación"/>
          <FRBRauthor href="/cl/org/junta-de-gobierno"/>
          <FRBRcountry value="cl"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="${escapeXml(frbr.expression)}"/>
          <FRBRuri value="${escapeXml(frbr.expression)}"/>
          <FRBRdate date="${escapeXml(frbr.date)}" name="versión"/>
          <FRBRlanguage language="spa"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="${escapeXml(frbr.expression)}/main.xml"/>
          <FRBRformat value="application/akn+xml"/>
        </FRBRManifestation>
      </identification>
      <references source="#congreso">
        <TLCOrganization eId="congreso" href="/cl/org/congreso" showAs="Congreso Nacional de Chile"/>
      </references>
    </meta>
    <preface>
      <longTitle>
        <p><docTitle>${escapeXml(title)}</docTitle></p>
      </longTitle>
      <p>${escapeXml(preface)}</p>
    </preface>
    <body>
${sectionsXml}
    </body>
  </act>
</akomaNtoso>`;
}

function generateAmendmentXml(config) {
	const { frbr, title, preface, description, changes, prevExpression, nextExpression } = config;

	let changesXml = '';
	if (changes && changes.length > 0) {
		changesXml = changes.map(change => {
			if (change.type === 'substitute') {
				return `      <akndiff:articleChange article="${escapeXml(change.eId)}" type="substitute">
        <akndiff:old>${escapeXml(change.oldText)}</akndiff:old>
        <akndiff:new>${escapeXml(change.newText)}</akndiff:new>
      </akndiff:articleChange>`;
			}
			if (change.type === 'insert') {
				const afterAttr = change.afterEId ? ` after="${escapeXml(change.afterEId)}"` : '';
				return `      <akndiff:articleChange article="${escapeXml(change.eId)}" type="insert"${afterAttr}>
        <akndiff:new>${escapeXml(change.newText)}</akndiff:new>
      </akndiff:articleChange>`;
			}
			if (change.type === 'repeal') {
				return `      <akndiff:articleChange article="${escapeXml(change.eId)}" type="repeal">
        <akndiff:old>${escapeXml(change.oldText)}</akndiff:old>
      </akndiff:articleChange>`;
			}
			return '';
		}).join('\n');
	}

	const changeSetXml = `
    <akndiff:changeSet
      base="${escapeXml(prevExpression)}"
      result="${escapeXml(nextExpression)}">
${changesXml}
    </akndiff:changeSet>`;

	return `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <amendment name="mod-ley-18045">
    <meta>
      <identification source="#congreso">
        <FRBRWork>
          <FRBRthis value="/cl/amendment/ley-18045/${escapeXml(frbr.date)}"/>
          <FRBRuri value="/cl/amendment/ley-18045/${escapeXml(frbr.date)}"/>
          <FRBRdate date="${escapeXml(frbr.date)}" name="publicación"/>
          <FRBRauthor href="/cl/org/congreso"/>
          <FRBRcountry value="cl"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="${escapeXml(nextExpression)}"/>
          <FRBRuri value="${escapeXml(nextExpression)}"/>
          <FRBRdate date="${escapeXml(frbr.date)}" name="versión"/>
          <FRBRlanguage language="spa"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="${escapeXml(nextExpression)}/main.xml"/>
          <FRBRformat value="application/akn+xml"/>
        </FRBRManifestation>
      </identification>
      <references source="#congreso">
        <TLCOrganization eId="congreso" href="/cl/org/congreso" showAs="Congreso Nacional de Chile"/>
      </references>
    </meta>
    <preface>
      <longTitle>
        <p><docTitle>${escapeXml(title)}</docTitle></p>
      </longTitle>
      <p>${escapeXml(preface)}</p>
    </preface>
    <amendmentBody>
      <amendmentContent>
        <p>${escapeXml(description)}</p>
      </amendmentContent>
    </amendmentBody>${changeSetXml}
  </amendment>
</akomaNtoso>`;
}

// ═══════════════════════════════════════════════════════
// Main generation
// ═══════════════════════════════════════════════════════

console.log('='.repeat(70));
console.log('GENERATING AKN 3.0 XML DOCUMENTS');
console.log('Ley 18.045 — Ley de Mercado de Valores (1981-2025)');
console.log('='.repeat(70));

const index = JSON.parse(readFileSync(join(JSON_DIR, 'versions-index.json'), 'utf-8'));
const versions = index.versions;

let prevArticleMap = null;
let totalChanges = 0;
let fileCount = 0;

// File naming: 01-original.xml, 02-amendment-1.xml, ..., 32-amendment-31.xml, 33-final.xml
// The slug is derived by stripping the leading "NN-" prefix → "original", "amendment-1", "final"
// The timeline label comes from <docTitle> in the XML (prefaceTitle in the app)

for (let i = 0; i < versions.length; i++) {
	const v = versions[i];
	const meta = VERSION_META[v.date] || { label: v.date };
	const expression = `/cl/act/ley-18045/spa@${v.date}`;

	console.log(`\n--- [v${String(i + 1).padStart(2, '0')}] ${v.date}: ${meta.label} ---`);

	const extracted = extractArticlesFromJson(join(JSON_DIR, v.filename));
	const articleMap = buildArticleMap(extracted.sections);
	const artCount = extracted.sections.reduce((s, sec) => s + sec.articles.length, 0);
	console.log(`  Articles: ${artCount}, Sections: ${extracted.sections.length}`);

	if (i === 0) {
		// === ORIGINAL ACT ===
		fileCount++;
		const num = String(fileCount).padStart(2, '0');
		const filename = `${num}-original.xml`;
		const xml = generateActXml({
			frbr: { expression, date: v.date },
			title: meta.label,  // "Texto Original" — used as timeline label
			preface: 'Texto original publicado en el Diario Oficial el 22 de octubre de 1981.',
			sections: extracted.sections,
		});
		writeFileSync(join(AKN_DIR, filename), xml, 'utf-8');
		console.log(`  → ${filename}: ${xml.length} chars`);
	} else {
		// === AMENDMENT (changeSet from prev version) ===
		const changes = computeChanges(prevArticleMap, articleMap);
		totalChanges += changes.length;
		console.log(`  Changes: ${changes.length}`);

		fileCount++;
		const num = String(fileCount).padStart(2, '0');
		const amendIdx = i; // amendment-1 for v02, amendment-2 for v03, etc.
		const filename = `${num}-amendment-${amendIdx}.xml`;
		const prevExpression = `/cl/act/ley-18045/spa@${versions[i - 1].date}`;

		const xml = generateAmendmentXml({
			frbr: { date: v.date },
			title: meta.label,  // e.g. "Ley 19.301" — used as timeline label
			preface: meta.desc || `Modificación del ${v.date}.`,
			description: changes.length > 0
				? `${meta.label} modifica la Ley 18.045. ${changes.length} artículos afectados.`
				: `${meta.label}. Sin cambios detectables a nivel de artículo.`,
			changes,
			prevExpression,
			nextExpression: expression,
		});
		writeFileSync(join(AKN_DIR, filename), xml, 'utf-8');
		console.log(`  → ${filename}: ${xml.length} chars`);
	}

	// === FINAL ACT (after last amendment) ===
	if (i === versions.length - 1) {
		fileCount++;
		const num = String(fileCount).padStart(2, '0');
		const filename = `${num}-final.xml`;
		const xml = generateActXml({
			frbr: { expression, date: v.date },
			title: 'Versión Vigente',  // timeline label for final
			preface: `Última versión vigente. Modificada por ${meta.label} (${meta.desc || ''}).`,
			sections: extracted.sections,
		});
		writeFileSync(join(AKN_DIR, filename), xml, 'utf-8');
		console.log(`  → ${filename}: ${xml.length} chars`);
	}

	prevArticleMap = articleMap;
}

console.log('\n' + '='.repeat(70));
console.log('GENERATION COMPLETE');
console.log(`Files generated: ${fileCount}`);
console.log(`Total article changes across all transitions: ${totalChanges}`);
console.log(`Output directory: ${AKN_DIR}`);
console.log('='.repeat(70));
