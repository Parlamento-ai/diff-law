/**
 * Generate AKN 3.0 XML documents for the Boletín 15.480-13 (Ley 21.735) timeline.
 *
 * This creates a BILL-LEVEL timeline showing the project text at each stage:
 *   01-act-original.xml   — Mensaje Presidencial (350 articles, complete new law)
 *   02-bill.xml            — 1er Trámite + changeSet Mensaje→1er Trámite + voto Cámara
 *   03-amendment-1.xml     — 2do Trámite + changeSet 1er Trámite→Final + voto Senado
 *   04-amendment-2.xml     — 3er Trámite (sin cambios) + voto Cámara
 *   05-amendment-3.xml     — TC (sin cambios)
 *   06-act-final.xml       — Ley 21.735 publicada (79 permanent + 50 transitory articles)
 *
 * Usage: node scripts/ley-21735/generate-boletin-akn.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OFICIOS_DIR = join(__dirname, '../../research/2026-02-18/ley-21735/oficios');
const INFORMES_DIR = join(__dirname, '../../research/2026-02-18/ley-21735/informes');
const JSON_DIR = join(__dirname, '../../research/2026-02-18/ley-21735/json');
const RAW_DIR = join(__dirname, '../../research/2026-02-18/ley-21735/votes');
const OUT_DIR = join(__dirname, '../../research/2026-02-18/ley-21735/akn/boletin');

// ═══════════════════════════════════════════════════════
// Ordinal mapping (Spanish)
// ═══════════════════════════════════════════════════════

const ORDINALS = {
	'primero': 1, 'segundo': 2, 'tercero': 3, 'cuarto': 4, 'quinto': 5,
	'sexto': 6, 'séptimo': 7, 'septimo': 7, 'octavo': 8, 'noveno': 9,
	'décimo': 10, 'decimo': 10, 'undécimo': 11, 'undecimo': 11, 'duodécimo': 12, 'duodecimo': 12,
	'decimotercero': 13, 'decimocuarto': 14, 'decimoquinto': 15,
	'decimosexto': 16, 'decimoséptimo': 17, 'decimoseptimo': 17,
	'decimoctavo': 18, 'decimonoveno': 19,
	'vigésimo': 20, 'vigesimo': 20,
	// Compound (1er trámite style)
	'vigesimoprimero': 21, 'vigesimosegundo': 22, 'vigesimotercero': 23,
	'vigesimocuarto': 24, 'vigesimoquinto': 25, 'vigesimosexto': 26,
	'vigesimoséptimo': 27, 'vigesimoseptimo': 27, 'vigesimoctavo': 28,
	'vigesimonoveno': 29,
};

const TENS = {
	'vigésimo': 20, 'vigesimo': 20,
	'trigésimo': 30, 'trigesimo': 30,
	'cuadragésimo': 40, 'cuadragesimo': 40,
	'quincuagésimo': 50, 'quincuagesimo': 50,
	'sexagésimo': 60, 'sexagesimo': 60,
	'septuagésimo': 70, 'septuagesimo': 70,
};

const ONES = {
	'primero': 1, 'segundo': 2, 'tercero': 3, 'cuarto': 4, 'quinto': 5,
	'sexto': 6, 'séptimo': 7, 'septimo': 7, 'octavo': 8, 'noveno': 9,
};

function ordinalToNumber(text) {
	const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

	// Direct single-word match
	if (ORDINALS[lower] !== undefined) return ORDINALS[lower];

	// Two-word ordinal: "trigésimo primero", "cuadragésimo segundo", etc.
	const parts = lower.split(/\s+/);
	if (parts.length === 2 && TENS[parts[0]] !== undefined && ONES[parts[1]] !== undefined) {
		return TENS[parts[0]] + ONES[parts[1]];
	}

	// Tens only: "trigésimo", "cuadragésimo", "quincuagésimo"
	if (TENS[lower] !== undefined) return TENS[lower];

	console.warn(`  WARNING: Unknown ordinal "${text}"`);
	return null;
}

// ═══════════════════════════════════════════════════════
// Text utilities (from generate-akn.mjs)
// ═══════════════════════════════════════════════════════

function escapeXml(text) {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function slugify(name) {
	return name.trim()
		.toLowerCase()
		.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

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

// ═══════════════════════════════════════════════════════
// Oficio parser — extracts articles from plain text
// ═══════════════════════════════════════════════════════

/**
 * Parse articles from an oficio text file.
 * Returns { sections: [{ eId, heading, articles: [{ eId, num, text }] }] }
 *
 * Top-level permanent: `^Artículo\s+(\d+)[°º]?\.-`
 * Top-level transitory: `^Artículo\s+(ordinal)\.-`
 * Embedded (quoted): `^"Artículo ...` — SKIPPED
 */
function parseOficioArticles(text, skipUntil) {
	const lines = text.split('\n');
	let startIdx = 0;

	// Skip preamble until marker
	if (skipUntil) {
		for (let i = 0; i < lines.length; i++) {
			if (skipUntil.test(lines[i])) {
				startIdx = i;
				break;
			}
		}
	}

	const articles = [];
	let currentSection = { eId: 'sec_titulo_1', heading: 'Disposiciones Generales', articles: [] };
	const sections = [currentSection];
	let inTransitory = false;
	let sectionCount = 1;
	let foundFirstArticle = false; // Prevent preamble text from triggering markers
	let lastPermanentNum = 0; // Track sequential article numbering to reject embedded articles
	let lastTransitoryNum = 0; // Track sequential transitory numbering
	let ordinalBaseOffset = 0; // Offset for ordinals that follow numbered transitories

	// Regexes for article detection (handle smart quotes: " U+201C, " U+201D)
	const permanentRe = /^Artículo\s+(\d+)[°º]?\s*\.-/;
	const transitoryRe = /^Artículo\s+(.+?)\.-/;
	const titleRe = /^["\u201C\u201D]?Título\s+/i;
	const sectionRe = /^["\u201C\u201D]?(?:Párrafo|Capítulo)\s+/i;
	const transitoryMarker = /^["\u201C\u201D]?\s*(?:DISPOSICIONES\s+TRANSITORIAS|Disposiciones\s+transitorias)\b/i;

	let currentArticle = null;

	function flushArticle() {
		if (currentArticle) {
			currentArticle.text = currentArticle.text.trim();
			if (currentArticle.text) {
				currentSection.articles.push(currentArticle);
			}
			currentArticle = null;
		}
	}

	function ensureTransitorySection() {
		if (!sections.find(s => s.eId === 'sec_transitorio')) {
			sectionCount++;
			currentSection = { eId: `sec_transitorio`, heading: 'Disposiciones Transitorias', articles: [] };
			sections.push(currentSection);
		} else {
			currentSection = sections.find(s => s.eId === 'sec_transitorio');
		}
	}

	for (let i = startIdx; i < lines.length; i++) {
		const line = lines[i];

		// Stop at end markers
		if (/^\*{3,}/.test(line)) break;
		if (/^Hago presente a V\.E\./.test(line)) break;
		if (/^Dios guarde a V\.E\./.test(line)) break;

		// Skip lines that are quoted article starts (embedded in modification articles)
		if (/^["\u201C]Artículo\s+/.test(line)) {
			if (currentArticle) currentArticle.text += '\n' + line;
			continue;
		}

		// Detect transitory section (only after we've found at least one article)
		if (foundFirstArticle && transitoryMarker.test(line)) {
			flushArticle();
			inTransitory = true;
			sectionCount++;
			currentSection = { eId: `sec_transitorio`, heading: 'Disposiciones Transitorias', articles: [] };
			sections.push(currentSection);
			continue;
		}

		// Detect Título headers (create new section, but only for non-transitory)
		if (titleRe.test(line) && !inTransitory) {
			flushArticle();
			const heading = line.replace(/^"/, '').trim();
			sectionCount++;
			currentSection = { eId: `sec_titulo_${sectionCount}`, heading, articles: [] };
			sections.push(currentSection);
			continue;
		}

		// Detect numbered article
		const permMatch = line.match(permanentRe);
		if (permMatch) {
			const num = parseInt(permMatch[1]);

			if (inTransitory) {
				// Numbered transitory article (e.g., "Artículo 1°.-" after DISPOSICIONES TRANSITORIAS)
				flushArticle();
				lastTransitoryNum = num;
				ordinalBaseOffset = 0; // reset ordinal offset
				currentArticle = {
					eId: `art_t${num}`,
					num: `T${num}`,
					text: line,
				};
				continue;
			} else {
				// Permanent article — apply embedded article guard
				// Top-level bill articles are numbered sequentially, so a jump > 10 means embedded
				if (lastPermanentNum > 0 && num > lastPermanentNum + 10) {
					if (currentArticle) currentArticle.text += '\n' + line;
					continue;
				}
				flushArticle();
				foundFirstArticle = true;
				lastPermanentNum = num;
				currentArticle = {
					eId: `art_${permMatch[1]}`,
					num: permMatch[1],
					text: line,
				};
				continue;
			}
		}

		// Detect transitory article (ordinal names)
		if (inTransitory || transitoryMarker.test(lines[Math.max(0, i - 5)])) {
			// Only match if line starts with "Artículo " followed by a non-numeric word
			const transMatch = line.match(/^Artículo\s+(\S+(?:\s+\S+)?)\s*\.-/);
			if (transMatch) {
				let ordinalText = transMatch[1].replace(/\s*transitorio$/i, '').trim();
				// Strip trailing footnote numbers (doc extraction artifact: "primero17" → "primero")
				ordinalText = ordinalText.replace(/\d+$/, '').trim();
				// Skip if this looks like a numbered article
				if (!/^\d/.test(ordinalText)) {
					const ordNum = ordinalToNumber(ordinalText);
					if (ordNum !== null) {
						flushArticle();
						inTransitory = true; // ensure we're in transitory mode
						ensureTransitorySection();

						// Compute actual transitory number:
						// If ordinals follow a numbered sequence, offset by last numbered value
						if (ordinalBaseOffset === 0 && lastTransitoryNum > 0) {
							ordinalBaseOffset = lastTransitoryNum;
						}
						const transNum = ordinalBaseOffset + ordNum;
						lastTransitoryNum = transNum;

						currentArticle = {
							eId: `art_t${transNum}`,
							num: `T${transNum}`,
							text: line,
						};
						continue;
					}
				}
			}
		}

		// Otherwise, accumulate text
		if (currentArticle) {
			currentArticle.text += '\n' + line;
		}
	}

	flushArticle();

	// Remove empty sections
	return { sections: sections.filter(s => s.articles.length > 0) };
}

// ═══════════════════════════════════════════════════════
// LeyChile JSON parser (reused from generate-akn.mjs)
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

			// Check for transitory articles first (may or may not have "Transitorio" suffix)
			// Note: use [^\s.]+ instead of \w+ to match accented chars (vigésimo, trigésimo, etc.)
			const transMatch = cleanedText.match(/^(?:\s*)(?:Art[ií]culo|ARTICULO)\s+([a-záéíóúñü]+(?:\s+[a-záéíóúñü]+)?)\s+Transitorio/i)
				|| (/transitoria/i.test(parentTitle) && cleanedText.match(/^(?:\s*)(?:Art[ií]culo|ARTICULO)\s+([a-záéíóúñü]+(?:\s+[a-záéíóúñü]+)?)\s*[.\-]/i));
			if (transMatch) {
				const ordinalText = transMatch[1].trim();
				const num = ordinalToNumber(ordinalText);
				if (num !== null) {
					const eId = `art_t${num}`;
					articles.push({ type: 'article', eId, num: `T${num}`, text: cleanedText, title: parentTitle });
					if (item.h) articles.push(...collectArticles(item.h, parentTitle));
					continue;
				}
			}

			// Check for permanent articles
			const artMatch = cleanedText.match(/^(?:\s*)(?:Art[ií]culo|ARTICULO)\s+(\d+[°ºo]?\s*(?:bis|ter|qu[aá]ter|quinquies)?)/i);
			if (artMatch) {
				const artNum = artMatch[1].replace(/[°ºo]/g, '').trim();
				const eId = 'art_' + artNum.toLowerCase().replace(/\s+/g, '');
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
		const isTransitory = /transitoria/i.test(name);

		if ((isTitle || isTransitory) && item.h) {
			const articles = collectArticles(item.h, name);
			if (articles.length > 0) {
				const eId = isTransitory ? 'sec_transitorio' : `sec_titulo_${sections.length + 1}`;
				sections.push({ eId, heading: name, articles });
			}
			return;
		}

		if (item.h) {
			const articles = collectArticles(item.h, parentTitle || name);
			if (articles.length > 0) {
				const eId = `sec_titulo_${sections.length + 1}`;
				sections.push({ eId, heading: parentTitle || name || 'Disposiciones Generales', articles });
			}
		}
	}

	for (const item of data.html) {
		processItem(item);
	}

	if (sections.length === 0) {
		const allArticles = collectArticles(data.html, '');
		if (allArticles.length > 0) {
			sections.push({ eId: 'sec_titulo_1', heading: 'Disposiciones', articles: allArticles });
		}
	}

	return { sections };
}

// ═══════════════════════════════════════════════════════
// ChangeSet computation
// ═══════════════════════════════════════════════════════

function flattenArticles(sections) {
	const map = new Map(); // eId → { num, text }
	const order = []; // eId[] — preserves insertion order
	for (const sec of sections) {
		for (const art of sec.articles) {
			map.set(art.eId, { num: art.num, text: art.text });
			order.push(art.eId);
		}
	}
	return { map, order };
}

function normalizeForComparison(text) {
	return text
		.replace(/\s+/g, ' ')
		.replace(/\t/g, ' ')
		.replace(/[""\u201C\u201D]/g, '"')
		.replace(/['']/g, "'")
		.trim();
}

function computeChangeSet(oldSections, newSections) {
	const { map: oldMap, order: oldOrder } = flattenArticles(oldSections);
	const { map: newMap, order: newOrder } = flattenArticles(newSections);
	const changes = [];

	// 1. For each old article not in new → repeal
	for (const eId of oldOrder) {
		if (!newMap.has(eId)) {
			const old = oldMap.get(eId);
			changes.push({
				article: old.num,
				eId,
				type: 'repeal',
				oldText: old.text,
			});
		}
	}

	// 2. For each article in both, check if text changed → substitute
	for (const eId of oldOrder) {
		if (newMap.has(eId)) {
			const old = oldMap.get(eId);
			const now = newMap.get(eId);
			if (normalizeForComparison(old.text) !== normalizeForComparison(now.text)) {
				changes.push({
					article: now.num,
					eId,
					type: 'substitute',
					oldText: old.text,
					newText: now.text,
				});
			}
		}
	}

	// 3. For each new article not in old → insert
	let lastExistingEId = '';
	for (const eId of newOrder) {
		if (oldMap.has(eId)) {
			lastExistingEId = eId;
		} else {
			const now = newMap.get(eId);
			changes.push({
				article: now.num,
				eId,
				type: 'insert',
				newText: now.text,
				after: lastExistingEId,
			});
		}
	}

	return changes;
}

// ═══════════════════════════════════════════════════════
// AKN XML generation
// ═══════════════════════════════════════════════════════

function generateActXml(config) {
	const { name, frbr, title, preface, sections } = config;

	const sectionsXml = sections.map(sec => {
		const articlesXml = sec.articles.map(art => {
			const heading = art.num.startsWith('T')
				? `Artículo ${art.num.slice(1)}° transitorio`
				: `Artículo ${art.num}`;
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
  <act name="${escapeXml(name)}">
    <meta>
      <identification source="#congreso">
        <FRBRWork>
          <FRBRthis value="${escapeXml(frbr.work)}"/>
          <FRBRuri value="${escapeXml(frbr.work)}"/>
          <FRBRdate date="${escapeXml(frbr.date)}" name="publicación"/>
          <FRBRauthor href="/cl/org/congreso"/>
          <FRBRcountry value="cl"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="${escapeXml(frbr.expression)}"/>
          <FRBRuri value="${escapeXml(frbr.expression)}"/>
          <FRBRdate date="${escapeXml(frbr.expressionDate)}" name="versión"/>
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

function generateBillXml(config) {
	const { name, frbr, title, preface, changeSet, vote } = config;

	const changesXml = changeSet.changes.map(change => {
		if (change.type === 'substitute') {
			return `      <akndiff:articleChange article="${escapeXml(change.eId)}" type="substitute">
        <akndiff:old>${escapeXml(change.oldText)}</akndiff:old>
        <akndiff:new>${escapeXml(change.newText)}</akndiff:new>
      </akndiff:articleChange>`;
		}
		if (change.type === 'insert') {
			const afterAttr = change.after ? ` after="${escapeXml(change.after)}"` : '';
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

	let voteXml = '';
	if (vote) {
		voteXml = `\n      <akndiff:vote date="${escapeXml(vote.date)}" result="${escapeXml(vote.result)}"
        source="${escapeXml(vote.source)}">
        <akndiff:for count="${vote.forCount}"/>
        <akndiff:against count="${vote.againstCount}"/>
        <akndiff:abstain count="${vote.abstainCount}"/>
      </akndiff:vote>`;
	}

	return `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <bill name="${escapeXml(name)}">
    <meta>
      <identification source="#camara">
        <FRBRWork>
          <FRBRthis value="/cl/bill/ley-21735"/>
          <FRBRuri value="/cl/bill/ley-21735"/>
          <FRBRdate date="2024-01-24" name="aprobación"/>
          <FRBRauthor href="/cl/org/camara-diputados"/>
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
      <references source="#camara">
        <TLCOrganization eId="congreso" href="/cl/org/congreso" showAs="Congreso Nacional de Chile"/>
        <TLCOrganization eId="camara" href="/cl/org/camara-diputados" showAs="Cámara de Diputados"/>
      </references>
    </meta>
    <preface>
      <longTitle>
        <p><docTitle>${escapeXml(title)}</docTitle></p>
      </longTitle>
      <p>${escapeXml(preface)}</p>
    </preface>
    <body>
      <article eId="art_unico">
        <heading>Proyecto de ley aprobado por la Cámara de Diputados</heading>
        <content>
          <p>Boletín N° 15.480-13 — 1er Trámite Constitucional.</p>
        </content>
      </article>
    </body>
    <akndiff:changeSet
      base="${escapeXml(changeSet.base)}"
      result="${escapeXml(changeSet.result)}">
${changesXml}${voteXml}
    </akndiff:changeSet>
  </bill>
</akomaNtoso>`;
}

function generateAmendmentXml(config) {
	const { name, frbr, title, preface, description, changeSetBase, vote, changes } = config;

	let voteXml = '';
	if (vote) {
		if (vote.voters) {
			const forVoters = vote.voters.filter(v => v.vote === 'Si').map(v =>
				`          <akndiff:voter href="/cl/persona/${slugify(v.name)}" showAs="Sen. ${escapeXml(v.name)}"/>`
			).join('\n');
			const againstVoters = vote.voters.filter(v => v.vote === 'No').map(v =>
				`          <akndiff:voter href="/cl/persona/${slugify(v.name)}" showAs="Sen. ${escapeXml(v.name)}"/>`
			).join('\n');
			const abstainVoters = vote.voters.filter(v => v.vote === 'Abstencion').map(v =>
				`          <akndiff:voter href="/cl/persona/${slugify(v.name)}" showAs="Sen. ${escapeXml(v.name)}"/>`
			).join('\n');
			voteXml = `      <akndiff:vote date="${escapeXml(vote.date)}" result="${escapeXml(vote.result)}"
        source="${escapeXml(vote.source)}">
        <akndiff:for>
${forVoters}
        </akndiff:for>
        <akndiff:against>
${againstVoters}
        </akndiff:against>
        <akndiff:abstain>${abstainVoters ? '\n' + abstainVoters + '\n        ' : ''}</akndiff:abstain>
      </akndiff:vote>`;
		} else {
			voteXml = `      <akndiff:vote date="${escapeXml(vote.date)}" result="${escapeXml(vote.result)}"
        source="${escapeXml(vote.source)}">
        <akndiff:for count="${vote.forCount}"/>
        <akndiff:against count="${vote.againstCount}"/>
        <akndiff:abstain count="${vote.abstainCount}"/>
      </akndiff:vote>`;
		}
	}

	let refsXml = `        <TLCOrganization eId="congreso" href="/cl/org/congreso" showAs="Congreso Nacional de Chile"/>`;
	if (vote?.voters) {
		refsXml += `\n        <TLCOrganization eId="senado" href="/cl/org/senado" showAs="Senado de Chile"/>`;
		refsXml += '\n' + vote.voters.map(v =>
			`        <TLCPerson eId="${slugify(v.name)}" href="/cl/persona/${slugify(v.name)}" showAs="Sen. ${escapeXml(v.name)}"/>`
		).join('\n');
	}
	if (frbr.authorOrg) {
		refsXml += `\n        <TLCOrganization eId="${escapeXml(frbr.authorId)}" href="${escapeXml(frbr.authorHref)}" showAs="${escapeXml(frbr.authorOrg)}"/>`;
	}

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
				const afterAttr = change.after ? ` after="${escapeXml(change.after)}"` : '';
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

	let changeSetXml = '';
	if (changeSetBase && (vote || changesXml)) {
		changeSetXml = `
    <akndiff:changeSet
      base="${escapeXml(changeSetBase.base)}"
      result="${escapeXml(changeSetBase.result)}">
${changesXml}${changesXml && voteXml ? '\n' : ''}${voteXml}
    </akndiff:changeSet>`;
	}

	return `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <amendment name="${escapeXml(name)}">
    <meta>
      <identification source="#${escapeXml(frbr.authorId)}">
        <FRBRWork>
          <FRBRthis value="${escapeXml(frbr.work)}"/>
          <FRBRuri value="${escapeXml(frbr.work)}"/>
          <FRBRdate date="${escapeXml(frbr.date)}" name="${escapeXml(frbr.dateName)}"/>
          <FRBRauthor href="${escapeXml(frbr.authorHref)}"/>
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
      <references source="#${escapeXml(frbr.authorId)}">
${refsXml}
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
// Vote parsing (from generate-akn.mjs)
// ═══════════════════════════════════════════════════════

function parseVotes() {
	const xml = readFileSync(join(RAW_DIR, 'senado-votes.xml'), 'utf-8');
	const votes = [];
	const votoRegex = /<VOTO><PARLAMENTARIO>(.*?)<\/PARLAMENTARIO><SELECCION>(.*?)<\/SELECCION><\/VOTO>/g;
	let match;
	while ((match = votoRegex.exec(xml)) !== null) {
		votes.push({ name: match[1].trim(), vote: match[2].trim() });
	}
	return votes;
}

function parseCamaraVotes() {
	const xml = readFileSync(join(RAW_DIR, 'camara-votes.xml'), 'utf-8');
	const votacionRegex = /<Votacion>([\s\S]*?)<\/Votacion>/g;
	let primerTramiteGeneral = null;
	const tercerTramiteVotes = [];
	let match;

	while ((match = votacionRegex.exec(xml)) !== null) {
		const v = match[1];
		const tramiteMatch = v.match(/<Tramite\s+Codigo="(\d+)">/);
		const siMatch = v.match(/<TotalAfirmativos>(\d+)<\/TotalAfirmativos>/);
		const noMatch = v.match(/<TotalNegativos>(\d+)<\/TotalNegativos>/);
		const absMatch = v.match(/<TotalAbstenciones>(\d+)<\/TotalAbstenciones>/);
		const tipoMatch = v.match(/<Tipo\s+Codigo="\d+">(.*?)<\/Tipo>/);
		const fechaMatch = v.match(/<Fecha>(.*?)<\/Fecha>/);

		if (!tramiteMatch || !siMatch || !noMatch || !absMatch) continue;
		const tramiteCode = tramiteMatch[1];
		const tipo = tipoMatch ? tipoMatch[1].trim() : '';
		const fecha = fechaMatch ? fechaMatch[1].trim() : '';

		if (tramiteCode === '1' && tipo === 'General' && !primerTramiteGeneral) {
			primerTramiteGeneral = {
				si: parseInt(siMatch[1]), no: parseInt(noMatch[1]), abs: parseInt(absMatch[1]),
			};
		}
		if (tramiteCode === '3') {
			tercerTramiteVotes.push({
				fecha, si: parseInt(siMatch[1]), no: parseInt(noMatch[1]), abs: parseInt(absMatch[1]),
			});
		}
	}

	tercerTramiteVotes.sort((a, b) => a.fecha.localeCompare(b.fecha));
	const tercerTramiteGeneral = tercerTramiteVotes[0] || { si: 110, no: 38, abs: 0 };

	return {
		primerTramite: primerTramiteGeneral || { si: 84, no: 64, abs: 3 },
		tercerTramite: { si: tercerTramiteGeneral.si, no: tercerTramiteGeneral.no, abs: tercerTramiteGeneral.abs },
		tercerTramiteCount: tercerTramiteVotes.length,
	};
}

// ═══════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════

console.log('='.repeat(70));
console.log('GENERATING BOLETÍN 15.480-13 TIMELINE');
console.log('Ley 21.735 — Reforma de Pensiones');
console.log('='.repeat(70));

mkdirSync(OUT_DIR, { recursive: true });

// --- Parse sources ---

console.log('\n--- Parsing Mensaje ---');
const mensajeText = readFileSync(join(OFICIOS_DIR, 'mensaje.txt'), 'utf-8');
const mensaje = parseOficioArticles(mensajeText, /^["\u201C\u201D]?Título\s+I\b/i);
const mensajeArticleCount = mensaje.sections.reduce((s, sec) => s + sec.articles.length, 0);
console.log(`  Sections: ${mensaje.sections.length}`);
for (const sec of mensaje.sections) {
	console.log(`    ${sec.eId}: "${sec.heading}" — ${sec.articles.length} articles`);
}
console.log(`  Total articles: ${mensajeArticleCount}`);

console.log('\n--- Parsing 1er Trámite (Certificado Comisión Trabajo Cámara) ---');
const certificadoText = readFileSync(join(INFORMES_DIR, '02-informe-trabajo-camara-cert.txt'), 'utf-8');
const primerTramite = parseOficioArticles(certificadoText, /^["\u201C\u201D]?Título\s+I\b/i);
const primerArticleCount = primerTramite.sections.reduce((s, sec) => s + sec.articles.length, 0);
console.log(`  Sections: ${primerTramite.sections.length}`);
for (const sec of primerTramite.sections) {
	console.log(`    ${sec.eId}: "${sec.heading}" — ${sec.articles.length} articles`);
}
console.log(`  Total articles: ${primerArticleCount}`);

console.log('\n--- Parsing Ley 21.735 (LeyChile JSON) ---');
const leyChilePath = join(JSON_DIR, 'ley-21735-post.json');
const final = extractArticlesFromJson(leyChilePath);
const finalArticleCount = final.sections.reduce((s, sec) => s + sec.articles.length, 0);
console.log(`  Sections: ${final.sections.length}`);
for (const sec of final.sections) {
	console.log(`    ${sec.eId}: "${sec.heading}" — ${sec.articles.length} articles`);
}
console.log(`  Total articles: ${finalArticleCount}`);

// --- Compute changeSets ---

console.log('\n--- Computing changeSets ---');
const cs1 = computeChangeSet(mensaje.sections, primerTramite.sections);
const repeals1 = cs1.filter(c => c.type === 'repeal').length;
const subs1 = cs1.filter(c => c.type === 'substitute').length;
const inserts1 = cs1.filter(c => c.type === 'insert').length;
console.log(`  Mensaje → 1er Trámite (Certificado): ${cs1.length} changes (${repeals1} repeal, ${subs1} substitute, ${inserts1} insert)`);

const cs2 = computeChangeSet(primerTramite.sections, final.sections);
const repeals2 = cs2.filter(c => c.type === 'repeal').length;
const subs2 = cs2.filter(c => c.type === 'substitute').length;
const inserts2 = cs2.filter(c => c.type === 'insert').length;
console.log(`  1er Trámite (Certificado) → Final: ${cs2.length} changes (${repeals2} repeal, ${subs2} substitute, ${inserts2} insert)`);

// --- Parse votes ---

console.log('\n--- Parsing votes ---');
const senadoVoters = parseVotes();
console.log(`  Senado: ${senadoVoters.length} voters (${senadoVoters.filter(v => v.vote === 'Si').length} Sí, ${senadoVoters.filter(v => v.vote === 'No').length} No)`);

const camaraVotes = parseCamaraVotes();
console.log(`  Cámara 1er trámite: ${camaraVotes.primerTramite.si}-${camaraVotes.primerTramite.no}-${camaraVotes.primerTramite.abs}`);
console.log(`  Cámara 3er trámite: ${camaraVotes.tercerTramite.si}-${camaraVotes.tercerTramite.no}-${camaraVotes.tercerTramite.abs}`);

// --- FRBR URIs ---

const FRBR = {
	mensaje: {
		work: '/cl/bill/ley-21735',
		date: '2022-11-07',
		expression: '/cl/bill/ley-21735/spa@2022-11-07',
		expressionDate: '2022-11-07',
	},
	primerTramite: {
		work: '/cl/bill/ley-21735',
		date: '2024-01-24',
		expression: '/cl/bill/ley-21735/spa@2024-01-24',
		expressionDate: '2024-01-24',
	},
	final: {
		work: '/cl/act/ley-21735',
		date: '2025-03-26',
		expression: '/cl/act/ley-21735/spa@2025-03-26',
		expressionDate: '2025-03-26',
	},
};

const changeSetRef = {
	base: FRBR.mensaje.expression,
	result: FRBR.final.expression,
};

// --- Generate XMLs ---

console.log('\n--- Generating XMLs ---');

// 1. 01-act-original.xml — Mensaje (base state)
const xml01 = generateActXml({
	name: 'ley-21735-mensaje',
	frbr: FRBR.mensaje,
	title: 'Proyecto de Ley — Reforma de Pensiones (Mensaje)',
	preface: 'Mensaje de S.E. el Presidente de la República. Crea un nuevo Sistema Mixto de Pensiones y un Seguro Social en el pilar contributivo, mejora la Pensión Garantizada Universal y establece beneficios y modificaciones regulatorias que indica. Boletín N° 15.480-13.',
	sections: mensaje.sections,
});
writeFileSync(join(OUT_DIR, '01-act-original.xml'), xml01, 'utf-8');
console.log(`  01-act-original.xml: ${xml01.length} chars (${mensajeArticleCount} articles)`);

// 2. 02-bill.xml — 1er Trámite + changeSet Mensaje→1er Trámite + voto Cámara
const xml02 = generateBillXml({
	name: 'ley-21735-1er-tramite',
	frbr: FRBR.primerTramite,
	title: '1er Trámite Constitucional — Cámara de Diputados',
	preface: `La Cámara de Diputados reemplazó el texto original del Mensaje por un proyecto de ley con ${primerArticleCount} artículos (${primerTramite.sections.filter(s => !s.eId.includes('transitorio')).reduce((n, s) => n + s.articles.length, 0)} permanentes + ${primerTramite.sections.filter(s => s.eId.includes('transitorio')).reduce((n, s) => n + s.articles.length, 0)} transitorios). Fuente: Certificado Comisión de Trabajo y Seguridad Social.`,
	changeSet: {
		base: changeSetRef.base,
		result: changeSetRef.result,
		changes: cs1,
	},
	vote: {
		date: '2024-01-24',
		result: 'approved',
		source: '/cl/debate/camara-sesion-136-371',
		forCount: camaraVotes.primerTramite.si,
		againstCount: camaraVotes.primerTramite.no,
		abstainCount: camaraVotes.primerTramite.abs,
	},
});
writeFileSync(join(OUT_DIR, '02-bill.xml'), xml02, 'utf-8');
console.log(`  02-bill.xml: ${xml02.length} chars (${cs1.length} changes)`);

// 3. 03-amendment-1.xml — 2do Trámite + changeSet 1er→Final + voto Senado
const xml03 = generateAmendmentXml({
	name: 'ley-21735-2do-tramite',
	frbr: {
		work: '/cl/amendment/ley-21735/2do-tramite',
		date: '2025-01-27',
		dateName: 'aprobación',
		expression: '/cl/amendment/ley-21735/2do-tramite/spa@2025-01-27',
		authorId: 'senado',
		authorHref: '/cl/org/senado',
		authorOrg: 'Senado de Chile',
	},
	title: '2do Trámite Constitucional',
	preface: 'Aprobado en general y particular con modificaciones por el Senado.',
	description: `Sesión 98ª, legislatura 372ª. El Senado aprueba el proyecto en general y particular ` +
		`con modificaciones sustantivas, reestructurando el proyecto de ${primerArticleCount} (Certificado Cámara) a ${finalArticleCount} artículos. ` +
		`Votación en general: ${senadoVoters.filter(v => v.vote === 'Si').length} a favor, ` +
		`${senadoVoters.filter(v => v.vote === 'No').length} en contra.`,
	changeSetBase: changeSetRef,
	changes: cs2,
	vote: {
		date: '2025-01-27',
		result: 'approved',
		source: '/cl/debate/senado-sesion-98-372',
		voters: senadoVoters,
	},
});
writeFileSync(join(OUT_DIR, '03-amendment-1.xml'), xml03, 'utf-8');
console.log(`  03-amendment-1.xml: ${xml03.length} chars (${cs2.length} changes)`);

// 4. 04-amendment-2.xml — 3er Trámite (sin cambios) + voto Cámara
const xml04 = generateAmendmentXml({
	name: 'ley-21735-3er-tramite',
	frbr: {
		work: '/cl/amendment/ley-21735/3er-tramite',
		date: '2025-01-29',
		dateName: 'aprobación',
		expression: '/cl/amendment/ley-21735/3er-tramite/spa@2025-01-29',
		authorId: 'camara',
		authorHref: '/cl/org/camara-diputados',
		authorOrg: 'Cámara de Diputados',
	},
	title: '3er Trámite Constitucional',
	preface: 'La Cámara de Diputados aprueba las modificaciones del Senado.',
	description: `Sesión 134ª especial, legislatura 372ª (29/01/2025). La Cámara aprueba las enmiendas ` +
		`incorporadas por el Senado. Votación general: ${camaraVotes.tercerTramite.si}-${camaraVotes.tercerTramite.no}-${camaraVotes.tercerTramite.abs}. ` +
		`Se realizan ${camaraVotes.tercerTramiteCount} votaciones separadas sobre artículos con quórum especial. ` +
		`Se despacha al Ejecutivo y al Tribunal Constitucional.`,
	changeSetBase: changeSetRef,
	vote: {
		date: '2025-01-29',
		result: 'approved',
		source: '/cl/debate/camara-sesion-134-372',
		forCount: camaraVotes.tercerTramite.si,
		againstCount: camaraVotes.tercerTramite.no,
		abstainCount: camaraVotes.tercerTramite.abs,
	},
});
writeFileSync(join(OUT_DIR, '04-amendment-2.xml'), xml04, 'utf-8');
console.log(`  04-amendment-2.xml: ${xml04.length} chars`);

// 5. 05-amendment-3.xml — TC (sin cambios)
const xml05 = generateAmendmentXml({
	name: 'ley-21735-tc',
	frbr: {
		work: '/cl/amendment/ley-21735/tribunal-constitucional',
		date: '2025-03-10',
		dateName: 'fallo',
		expression: '/cl/amendment/ley-21735/tribunal-constitucional/spa@2025-03-10',
		authorId: 'tc',
		authorHref: '/cl/org/tribunal-constitucional',
		authorOrg: 'Tribunal Constitucional',
	},
	title: 'Control de Constitucionalidad',
	preface: 'El Tribunal Constitucional declara la constitucionalidad del proyecto.',
	description: `Rol N° 16189-25 CPR. Control preventivo de constitucionalidad. ` +
		`El requerimiento de inconstitucionalidad (Rol 16207-25 CPT) sobre el artículo 1, numeral 1, letra b) ` +
		`fue declarado inadmisible. El Presidente de la República comunica que no hará uso del veto (03/03/2025). ` +
		`Se oficia al Ejecutivo para promulgación (11/03/2025).`,
});
writeFileSync(join(OUT_DIR, '05-amendment-3.xml'), xml05, 'utf-8');
console.log(`  05-amendment-3.xml: ${xml05.length} chars`);

// 6. 06-act-final.xml — Ley 21.735 publicada
const xml06 = generateActXml({
	name: 'ley-21735',
	frbr: FRBR.final,
	title: 'Ley 21.735 — Reforma de Pensiones',
	preface: 'Crea un nuevo Sistema Mixto de Pensiones y un Seguro Social en el pilar contributivo, mejora la Pensión Garantizada Universal y establece beneficios y modificaciones regulatorias que indica. Publicada en el Diario Oficial el 26 de marzo de 2025.',
	sections: final.sections,
});
writeFileSync(join(OUT_DIR, '06-act-final.xml'), xml06, 'utf-8');
console.log(`  06-act-final.xml: ${xml06.length} chars (${finalArticleCount} articles)`);

console.log('\n' + '='.repeat(70));
console.log('DONE — Generated 6 XMLs in:');
console.log(`  ${OUT_DIR}`);
console.log('='.repeat(70));
