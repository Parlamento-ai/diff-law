/**
 * Generate AKN 3.0 XML documents for Ley 21.735 (Reforma de Pensiones).
 *
 * For each modified norm, generates 7 documents representing the full
 * legislative process:
 *   01-act-original.xml   — pre-reform version of the norm
 *   02-bill.xml            — Mensaje Presidencial (07/11/2022) with changeSet
 *   03-amendment-1.xml     — 1er Trámite: C. Diputados (24/01/2024)
 *   04-amendment-2.xml     — 2do Trámite: Senado (27/01/2025) with nominal vote
 *   05-amendment-3.xml     — 3er Trámite: C. Diputados (29/01/2025)
 *   06-amendment-4.xml     — Tribunal Constitucional (10/03/2025)
 *   07-act-final.xml       — Ley Promulgada (26/03/2025)
 *
 * Usage: node scripts/ley-21735/generate-akn.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_DIR = join(__dirname, '../../research/2026-02-18/ley-21735/json');
const DIFF_DIR = join(__dirname, '../../research/2026-02-18/ley-21735/diff');
const RAW_DIR = join(__dirname, '../../research/2026-02-18/ley-21735/votes');
const AKN_DIR = join(__dirname, '../../research/2026-02-18/ley-21735/akn');

// ═══════════════════════════════════════════════════════
// Text cleaning
// ═══════════════════════════════════════════════════════

function cleanLeyChileAnnotations(text) {
	let result = text;

	// === Step 1: Remove annotation SENTENCES (must come before inline annotation removal) ===
	// "El Art. XXX de la LEY NNNNN, publicada el DD.MM.YYYY, dispuso que..."
	// "El inciso Xº del artículo segundo de la LEY 18.964, publicada el 10.03.1990, dispuso que..."
	// These are standalone paragraphs/sentences at the end of articles
	result = result.replace(
		/\n?\s*El (?:Art\.|art\.|artículo|Artículo|inciso)[^\n]*?(?:de la|del)\s+(?:LEY|DECRETO LEY|Ley|DFL|D\.?S\.?)\s+\d+[^\n]*?publicad[ao][^\n]*/gi,
		''
	);

	// === Step 2: Remove multi-line inline annotations that can split words ===
	// "disLEY 18964\nArt. Primero\nN° 2 b)\nD.O. 10.03.1990pondrá" → "dispondrá"
	// "pensión deDL 3626\n\nD.O. 21.02.1981 sobrevivencia" → "pensión de sobrevivencia"
	// IMPORTANT: D.O. pattern must NOT use [^\n]* — the legal text continues on the same line!
	result = result.replace(
		/(?:LEY|Ley|DL|DFL|DECRETO LEY|D\.?S\.?)\s+\d+[A-Za-z]*(?:\s*\n\s*(?:Art\.?\s+[^\n]*|N[°ºo]\s*[^\n]*|D\.O\.?\s*[\d.]+))*\s*/gi,
		' '
	);

	// === Step 3: Remove ALL D.O. date references (always editorial annotations) ===
	// Handles: "D.O. 28.02.2002", "D.O.19.03.1994", "D.O.18.O5.1995" (typo with O vs 0)
	result = result.replace(/D\.O\.?\s*[\dO]{2}[\.\dO]+/g, '');

	// === Step 4: Remove standalone markers ===
	// Handle split words from annotation removal: "INCI SO", "INCI SOS", "IN CISOS", "INCIS O"
	result = result.replace(/\s*INCI\s*S?O(?:S(?:OS)?|S)?\s+DEROGADOS?\b/gi, '');
	result = result.replace(/\s*IN\s*CISOS?\s+DEROGADOS?\b/gi, '');
	result = result.replace(/\s*INCISO(?:\s+FINAL)?\s*[-–]?\s*DEROGADOS?\b/gi, '');
	result = result.replace(/\s*INCISOS\s+DEROGADOS\b/gi, '');
	result = result.replace(/\s*(?:ARTICULO|ARTÍCULO)\s+DEROGADO\b/gi, '');
	result = result.replace(/^\s*DEROGADO:\s*/im, '');

	// === Step 5: Remove NOTA markers and blocks ===
	result = result.replace(/\s*NOTA\s*\d*\s*:?\s*$/gm, '');
	result = result.replace(/\nNOTA[^]*$/s, '');

	// === Step 6: Standalone Art. reference lines ===
	result = result.replace(/^\s*Art\.?\s+[\wáéíóúñÁÉÍÓÚÑ°º]+[^\n]*$/gm, '');

	// === Step 7: Remove "GADO" fragments from split "DEROGADO" ===
	result = result.replace(/\bGADO\b/g, '');

	// === Cleanup ===
	result = result.replace(/\n{3,}/g, '\n\n');
	result = result.replace(/\s{2,}/g, ' ');
	result = result.replace(/\s+$/gm, '');
	return result.trim();
}

function stripHtmlEntities(html) {
	return html
		// FIRST: Remove inline annotation elements BEFORE converting </div> to \n
		// These are embedded within words and would fragment text if </div> → \n
		// NOTA divs: <div class="n rnp" id="rnp69"><a href="#np69">NOTA 1:</a></div>
		.replace(/<div[^>]*class="n[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
		// LEY/DL annotation spans: <span class="n" id="n_67">LEY 19768<br>...<br>D.O. ...</span>
		.replace(/<span[^>]*class="n"[^>]*>[\s\S]*?<\/span>/gi, '')
		// Now safe to process remaining HTML
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
	// Track used eIds globally to prevent duplicates across sections
	const usedEIds = new Map(); // eId → count

	function collectArticles(items, parentTitle = '', sectionIdx = 0) {
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

				// Deduplicate eIds: transitory articles reuse numbers from main law
				const count = usedEIds.get(eId) || 0;
				usedEIds.set(eId, count + 1);
				if (count > 0) {
					eId = eId + '_t' + count;
				}

				articles.push({ type: 'article', eId, num: artNum, text: cleanedText, title: parentTitle });
			}

			// Recurse into children regardless
			if (item.h) {
				const childTitle = isTitle ? name : parentTitle;
				articles.push(...collectArticles(item.h, childTitle, sectionIdx));
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
			return null;
		}

		// For non-title top-level items that have children with articles
		if (item.h) {
			const articles = collectArticles(item.h, parentTitle || name);
			if (articles.length > 0) {
				// Check if any article titles are known
				const titleForSection = parentTitle || name || 'Disposiciones Generales';
				const eId = 'sec_titulo_' + (sections.length + 1);
				sections.push({ eId, heading: titleForSection, articles });
			}
		}

		return null;
	}

	for (const item of data.html) {
		processItem(item);
	}

	// Handle flat structures: collect articles directly at top level
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

	return { sections, metadatos: data.metadatos };
}

// ═══════════════════════════════════════════════════════
// AKN XML generation
// ═══════════════════════════════════════════════════════

function generateActXml(config) {
	const { name, frbr, title, preface, sections } = config;

	const sectionsXml = sections.map(sec => {
		const articlesXml = sec.articles.map(art => {
			const heading = `Artículo ${art.num}`;
			// Split content: first line is usually the heading, rest is the content
			const lines = art.text.split('\n');
			const contentLines = lines.slice(0); // Keep all lines as content
			const content = contentLines.join('\n').trim();

			return `      <article eId="${escapeXml(art.eId)}">
        <heading>${escapeXml(heading)}</heading>
        <content>
          <p>${escapeXml(content)}</p>
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
	const { name, frbr, title, preface, targetRef, changeSet } = config;

	// Generate article changes (text is already cleaned by extractArticlesFromJson pipeline)
	const changesXml = changeSet.changes.map(change => {
		const eId = 'art_' + change.article.toLowerCase().replace(/\s+/g, '');

		if (change.type === 'substitute') {
			return `      <akndiff:articleChange article="${escapeXml(eId)}" type="substitute">
        <akndiff:old>${escapeXml(change.oldText)}</akndiff:old>
        <akndiff:new>${escapeXml(change.newText)}</akndiff:new>
      </akndiff:articleChange>`;
		}

		if (change.type === 'insert') {
			const artNum = parseInt(change.article);
			const afterEId = artNum > 1 ? `art_${artNum - 1}` : '';
			return `      <akndiff:articleChange article="${escapeXml(eId)}" type="insert"${afterEId ? ` after="${escapeXml(afterEId)}"` : ''}>
        <akndiff:new>${escapeXml(change.newText)}</akndiff:new>
      </akndiff:articleChange>`;
		}

		if (change.type === 'repeal') {
			return `      <akndiff:articleChange article="${escapeXml(eId)}" type="repeal">
        <akndiff:old>${escapeXml(change.oldText)}</akndiff:old>
      </akndiff:articleChange>`;
		}

		return '';
	}).join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
            xmlns:akndiff="http://parlamento.ai/ns/akndiff/1.0">
  <bill name="${escapeXml(name)}">
    <meta>
      <identification source="#presidencia">
        <FRBRWork>
          <FRBRthis value="/cl/bill/ley-21735"/>
          <FRBRuri value="/cl/bill/ley-21735"/>
          <FRBRdate date="2022-11-07" name="presentación"/>
          <FRBRauthor href="/cl/org/presidencia"/>
          <FRBRcountry value="cl"/>
        </FRBRWork>
        <FRBRExpression>
          <FRBRthis value="/cl/bill/ley-21735/spa@2022-11-07"/>
          <FRBRuri value="/cl/bill/ley-21735/spa@2022-11-07"/>
          <FRBRdate date="2022-11-07" name="mensaje"/>
          <FRBRlanguage language="spa"/>
        </FRBRExpression>
        <FRBRManifestation>
          <FRBRthis value="/cl/bill/ley-21735/spa@2022-11-07/main.xml"/>
          <FRBRformat value="application/akn+xml"/>
        </FRBRManifestation>
      </identification>
      <references source="#presidencia">
        <TLCOrganization eId="congreso" href="/cl/org/congreso" showAs="Congreso Nacional de Chile"/>
        <TLCOrganization eId="presidencia" href="/cl/org/presidencia" showAs="Presidencia de la República"/>
      </references>
    </meta>
    <preface>
      <longTitle>
        <p>Ley 21.735: <docTitle>${escapeXml(title)}</docTitle></p>
      </longTitle>
      <p>Mensaje de S.E. el Presidente de la República.</p>
      <p>Modifica ${escapeXml(targetRef)}.</p>
      <p>Boletín N° 15.480-13.</p>
    </preface>
    <body>
      <article eId="art_unico">
        <heading>Artículo modificatorio</heading>
        <content>
          <p>${escapeXml(preface)}</p>
        </content>
      </article>
    </body>
    <akndiff:changeSet
      base="${escapeXml(changeSet.base)}"
      result="${escapeXml(changeSet.result)}">
${changesXml}
    </akndiff:changeSet>
  </bill>
</akomaNtoso>`;
}

/**
 * Generate an amendment XML representing a legislative stage.
 * May have an empty changeSet (no article changes) but with a vote,
 * or no changeSet at all (e.g., Tribunal Constitucional).
 */
function generateAmendmentXml(config) {
	const { name, frbr, title, preface, description, changeSetBase, vote, changes } = config;

	let voteXml = '';
	if (vote) {
		if (vote.voters) {
			// Nominal vote with individual voter names
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
			// Aggregate vote (count only, no individual names)
			voteXml = `      <akndiff:vote date="${escapeXml(vote.date)}" result="${escapeXml(vote.result)}"
        source="${escapeXml(vote.source)}">
        <akndiff:for count="${vote.forCount}"/>
        <akndiff:against count="${vote.againstCount}"/>
        <akndiff:abstain count="${vote.abstainCount}"/>
      </akndiff:vote>`;
		}
	}

	// References: include senators for nominal votes
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

	// Generate article change XML (same format as bill changeSet)
	let changesXml = '';
	if (changes && changes.length > 0) {
		changesXml = changes.map(change => {
			const eId = 'art_' + change.article.toLowerCase().replace(/\s+/g, '');
			if (change.type === 'substitute') {
				return `      <akndiff:articleChange article="${escapeXml(eId)}" type="substitute">
        <akndiff:old>${escapeXml(change.oldText)}</akndiff:old>
        <akndiff:new>${escapeXml(change.newText)}</akndiff:new>
      </akndiff:articleChange>`;
			}
			if (change.type === 'insert') {
				const artNum = parseInt(change.article);
				const afterEId = artNum > 1 ? `art_${artNum - 1}` : '';
				return `      <akndiff:articleChange article="${escapeXml(eId)}" type="insert"${afterEId ? ` after="${escapeXml(afterEId)}"` : ''}>
        <akndiff:new>${escapeXml(change.newText)}</akndiff:new>
      </akndiff:articleChange>`;
			}
			if (change.type === 'repeal') {
				return `      <akndiff:articleChange article="${escapeXml(eId)}" type="repeal">
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

function slugify(name) {
	return name.trim()
		.toLowerCase()
		.normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove diacritics
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

// ═══════════════════════════════════════════════════════
// Vote parsing
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
				si: parseInt(siMatch[1]),
				no: parseInt(noMatch[1]),
				abs: parseInt(absMatch[1]),
			};
		}

		if (tramiteCode === '3') {
			tercerTramiteVotes.push({
				fecha,
				si: parseInt(siMatch[1]),
				no: parseInt(noMatch[1]),
				abs: parseInt(absMatch[1]),
			});
		}
	}

	// Sort 3er trámite votes by timestamp to find the earliest (the general vote)
	tercerTramiteVotes.sort((a, b) => a.fecha.localeCompare(b.fecha));
	const tercerTramiteGeneral = tercerTramiteVotes[0] || { si: 110, no: 38, abs: 0 };

	return {
		primerTramite: primerTramiteGeneral || { si: 84, no: 64, abs: 3 },
		tercerTramite: { si: tercerTramiteGeneral.si, no: tercerTramiteGeneral.no, abs: tercerTramiteGeneral.abs },
		tercerTramiteCount: tercerTramiteVotes.length,
	};
}

// ═══════════════════════════════════════════════════════
// Norm configurations
// ═══════════════════════════════════════════════════════

const NORMS = [
	{
		slug: 'dl-3500',
		dirName: 'dl-3500',
		normTitle: 'DL 3.500 — Establece Nuevo Sistema de Pensiones',
		targetRef: 'el Decreto Ley N° 3.500 de 1980',
		reformArticle: 67,
		// Articles attributed to the 2do trámite (Senado modifications/additions).
		// These were heavily rewritten or entirely new in the Senate's version.
		// All other changes stay in the bill changeSet.
		senadoArticles: new Set([
			'98 bis', '160', '161', '162', '163', '164', '165', '165 bis', '166 bis', '168'
		]),
		frbr: {
			work: '/cl/act/dl-3500',
			date: '1980-11-13',
			preExpression: '/cl/act/dl-3500/spa@2025-03-25',
			preExpressionDate: '2025-03-25',
			postExpression: '/cl/act/dl-3500/spa@2025-03-26',
			postExpressionDate: '2025-03-26',
		}
	},
	{
		slug: 'dfl-5-2003',
		dirName: 'dfl-5-2003',
		normTitle: 'DFL 5/2003 — Ley General de Cooperativas',
		targetRef: 'el DFL N° 5 de 2003 del Ministerio de Economía',
		reformArticle: 72,
		frbr: {
			work: '/cl/act/dfl-5-2003',
			date: '2003-08-08',
			preExpression: '/cl/act/dfl-5-2003/spa@2025-03-25',
			preExpressionDate: '2025-03-25',
			postExpression: '/cl/act/dfl-5-2003/spa@2025-03-26',
			postExpressionDate: '2025-03-26',
		}
	},
	{
		slug: 'ley-18045',
		dirName: 'ley-18045',
		normTitle: 'Ley 18.045 — Ley de Mercado de Valores',
		targetRef: 'la Ley N° 18.045 de Mercado de Valores',
		reformArticle: 73,
		frbr: {
			work: '/cl/act/ley-18045',
			date: '1981-10-22',
			preExpression: '/cl/act/ley-18045/spa@2025-03-25',
			preExpressionDate: '2025-03-25',
			postExpression: '/cl/act/ley-18045/spa@2025-03-26',
			postExpressionDate: '2025-03-26',
		}
	},
	{
		slug: 'dfl-28',
		dirName: 'dfl-28',
		normTitle: 'DFL 28/1981 — Estatuto del Personal de la Superintendencia de AFP',
		targetRef: 'el DFL N° 28 de 1981 del Ministerio del Trabajo',
		reformArticle: 74,
		// Art. 74 was entirely new from the Senado (Cámara's version didn't modify DFL 28)
		senadoArticles: new Set(['7']),
		frbr: {
			work: '/cl/act/dfl-28',
			date: '1981-06-02',
			preExpression: '/cl/act/dfl-28/spa@2025-03-25',
			preExpressionDate: '2025-03-25',
			postExpression: '/cl/act/dfl-28/spa@2025-03-26',
			postExpressionDate: '2025-03-26',
		}
	},
	{
		slug: 'ley-20880',
		dirName: 'ley-20880',
		normTitle: 'Ley 20.880 — Sobre Probidad en la Función Pública',
		targetRef: 'la Ley N° 20.880 sobre Probidad en la Función Pública',
		reformArticle: 75,
		// Art. 75 was entirely new from the Senado (Cámara's version didn't modify Ley 20.880)
		senadoArticles: new Set(['4', '7', '26']),
		frbr: {
			work: '/cl/act/ley-20880',
			date: '2016-01-05',
			preExpression: '/cl/act/ley-20880/spa@2025-03-25',
			preExpressionDate: '2025-03-25',
			postExpression: '/cl/act/ley-20880/spa@2025-03-26',
			postExpressionDate: '2025-03-26',
		}
	},
];

// ═══════════════════════════════════════════════════════
// Main generation
// ═══════════════════════════════════════════════════════

console.log('='.repeat(70));
console.log('GENERATING AKN 3.0 XML DOCUMENTS');
console.log('Ley 21.735 - Reforma de Pensiones');
console.log('='.repeat(70));

const votes = parseVotes();
console.log(`\nParsed ${votes.length} senator votes (${votes.filter(v => v.vote === 'Si').length} Sí, ${votes.filter(v => v.vote === 'No').length} No)`);

// Parse Cámara aggregate votes
const camaraVotes = parseCamaraVotes();
console.log(`Parsed Cámara votes:`);
console.log(`  1er trámite (24/01/2024): ${camaraVotes.primerTramite.si}-${camaraVotes.primerTramite.no}-${camaraVotes.primerTramite.abs}`);
console.log(`  3er trámite (29/01/2025): ${camaraVotes.tercerTramite.si}-${camaraVotes.tercerTramite.no}-${camaraVotes.tercerTramite.abs} (${camaraVotes.tercerTramiteCount} votaciones)`);

for (const norm of NORMS) {
	console.log(`\n--- ${norm.normTitle} ---`);

	const preJsonPath = join(JSON_DIR, `${norm.slug}-pre.json`);
	const postJsonPath = join(JSON_DIR, `${norm.slug}-post.json`);
	const changesPath = join(DIFF_DIR, `${norm.slug}-changes.json`);

	if (!existsSync(preJsonPath) || !existsSync(postJsonPath)) {
		console.log(`  SKIP: Missing JSON files for ${norm.slug}`);
		continue;
	}

	if (!existsSync(changesPath)) {
		console.log(`  SKIP: No changes found for ${norm.slug}`);
		continue;
	}

	const changes = JSON.parse(readFileSync(changesPath, 'utf-8'));
	if (changes.length === 0) {
		console.log(`  SKIP: No article changes for ${norm.slug}`);
		continue;
	}

	// Extract articles from pre and post versions
	const preSections = extractArticlesFromJson(preJsonPath);
	const postSections = extractArticlesFromJson(postJsonPath);

	console.log(`  Pre-reform: ${preSections.sections.length} sections, ${preSections.sections.reduce((s, sec) => s + sec.articles.length, 0)} articles`);
	console.log(`  Post-reform: ${postSections.sections.length} sections, ${postSections.sections.reduce((s, sec) => s + sec.articles.length, 0)} articles`);
	console.log(`  Changes: ${changes.length}`);

	// Build text maps from extracted articles (consistent pipeline)
	// This ensures act XML and bill changeSet use IDENTICAL text processing
	const preTextMap = new Map();
	for (const sec of preSections.sections) {
		for (const art of sec.articles) {
			preTextMap.set(art.eId, art.text);
		}
	}
	const postTextMap = new Map();
	for (const sec of postSections.sections) {
		for (const art of sec.articles) {
			postTextMap.set(art.eId, art.text);
		}
	}

	// Fix change text to use consistent pipeline (same as act articles)
	const fixedChanges = changes.map(c => {
		const eId = 'art_' + c.article.toLowerCase().replace(/\s+/g, '');
		return {
			...c,
			oldText: c.oldText ? (preTextMap.get(eId) || c.oldText) : undefined,
			newText: c.newText ? (postTextMap.get(eId) || c.newText) : undefined,
		};
	});

	// Split changes between bill and 2do trámite (Senado) if applicable
	const senadoArticles = norm.senadoArticles || new Set();
	const billChanges = fixedChanges.filter(c => !senadoArticles.has(c.article));
	const senadoChanges = fixedChanges.filter(c => senadoArticles.has(c.article));

	if (senadoChanges.length > 0) {
		console.log(`  Split: ${billChanges.length} bill + ${senadoChanges.length} senado = ${fixedChanges.length} total`);
	}

	// Create output directory
	const outDir = join(AKN_DIR, norm.dirName);
	mkdirSync(outDir, { recursive: true });

	const changeSetRef = {
		base: norm.frbr.preExpression,
		result: norm.frbr.postExpression,
	};

	// 1. Generate 01-act-original.xml (pre-reform)
	const originalXml = generateActXml({
		name: norm.slug,
		frbr: {
			work: norm.frbr.work,
			date: norm.frbr.date,
			expression: norm.frbr.preExpression,
			expressionDate: norm.frbr.preExpressionDate,
		},
		title: norm.normTitle,
		preface: `Versión vigente antes de la reforma de pensiones (Ley 21.735).`,
		sections: preSections.sections,
	});
	writeFileSync(join(outDir, '01-act-original.xml'), originalXml, 'utf-8');
	console.log(`  01-act-original.xml: ${originalXml.length} chars`);

	// 2. Generate 02-bill.xml — Mensaje Presidencial (07/11/2022)
	// Contains the full changeSet but NO vote
	const billXml = generateBillXml({
		name: `ley-21735-mod-${norm.slug}`,
		frbr: norm.frbr,
		title: 'Crea un Nuevo Sistema Mixto de Pensiones',
		preface: `Introdúcense las siguientes modificaciones en ${norm.targetRef}.`,
		targetRef: norm.targetRef,
		changeSet: {
			base: norm.frbr.preExpression,
			result: norm.frbr.postExpression,
			changes: billChanges,
		},
	});
	writeFileSync(join(outDir, '02-bill.xml'), billXml, 'utf-8');
	console.log(`  02-bill.xml: ${billXml.length} chars`);

	// 3. Generate 03-amendment-1.xml — 1er Trámite: C. Diputados (24/01/2024)
	const amend1Xml = generateAmendmentXml({
		name: `ley-21735-1er-tramite`,
		frbr: {
			work: '/cl/amendment/ley-21735/1er-tramite',
			date: '2024-01-24',
			dateName: 'aprobación',
			expression: '/cl/amendment/ley-21735/1er-tramite/spa@2024-01-24',
			authorId: 'camara',
			authorHref: '/cl/org/camara-diputados',
			authorOrg: 'Cámara de Diputados',
		},
		title: '1er Trámite Constitucional',
		preface: 'Aprobado en general y particular por la Cámara de Diputados.',
		description: `Sesión 136ª, legislatura 371ª. La Cámara aprueba el proyecto en general (84-64-3) ` +
			`y en votación particular los artículos del proyecto con quórum especial. ` +
			`Se despacha al Senado como Cámara Revisora.`,
		changeSetBase: changeSetRef,
		vote: {
			date: '2024-01-24',
			result: 'approved',
			source: '/cl/debate/camara-sesion-136-371',
			forCount: camaraVotes.primerTramite.si,
			againstCount: camaraVotes.primerTramite.no,
			abstainCount: camaraVotes.primerTramite.abs,
		},
	});
	writeFileSync(join(outDir, '03-amendment-1.xml'), amend1Xml, 'utf-8');
	console.log(`  03-amendment-1.xml: ${amend1Xml.length} chars`);

	// 4. Generate 04-amendment-2.xml — 2do Trámite: Senado (27/01/2025)
	const amend2Xml = generateAmendmentXml({
		name: `ley-21735-2do-tramite`,
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
			`con modificaciones. Votación en general: ${votes.filter(v => v.vote === 'Si').length} a favor, ` +
			`${votes.filter(v => v.vote === 'No').length} en contra. Se envía oficio de modificaciones a la Cámara de Origen.`,
		changeSetBase: changeSetRef,
		changes: senadoChanges,
		vote: {
			date: '2025-01-27',
			result: 'approved',
			source: '/cl/debate/senado-sesion-98-372',
			voters: votes,
		},
	});
	writeFileSync(join(outDir, '04-amendment-2.xml'), amend2Xml, 'utf-8');
	console.log(`  04-amendment-2.xml: ${amend2Xml.length} chars`);

	// 5. Generate 05-amendment-3.xml — 3er Trámite: C. Diputados (29/01/2025)
	const amend3Xml = generateAmendmentXml({
		name: `ley-21735-3er-tramite`,
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
	writeFileSync(join(outDir, '05-amendment-3.xml'), amend3Xml, 'utf-8');
	console.log(`  05-amendment-3.xml: ${amend3Xml.length} chars`);

	// 6. Generate 06-amendment-4.xml — Tribunal Constitucional (10/03/2025)
	const amend4Xml = generateAmendmentXml({
		name: `ley-21735-tc`,
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
		// No changeSet, no vote — just metadata
	});
	writeFileSync(join(outDir, '06-amendment-4.xml'), amend4Xml, 'utf-8');
	console.log(`  06-amendment-4.xml: ${amend4Xml.length} chars`);

	// 7. Generate 07-act-final.xml — Ley Promulgada (26/03/2025)
	const finalXml = generateActXml({
		name: norm.slug,
		frbr: {
			work: norm.frbr.work,
			date: norm.frbr.date,
			expression: norm.frbr.postExpression,
			expressionDate: norm.frbr.postExpressionDate,
		},
		title: norm.normTitle,
		preface: `Versión posterior a la reforma de pensiones (Ley 21.735, publicada en el Diario Oficial el 26/03/2025).`,
		sections: postSections.sections,
	});
	writeFileSync(join(outDir, '07-act-final.xml'), finalXml, 'utf-8');
	console.log(`  07-act-final.xml: ${finalXml.length} chars`);
}

console.log('\n' + '='.repeat(70));
console.log('GENERATION COMPLETE');
console.log('='.repeat(70));

// List generated directories
console.log('\nGenerated directories:');
for (const norm of NORMS) {
	const outDir = join(AKN_DIR, norm.dirName);
	if (existsSync(outDir)) {
		console.log(`  ${norm.dirName}/`);
	}
}
