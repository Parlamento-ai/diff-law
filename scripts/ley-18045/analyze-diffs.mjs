/**
 * Analyze article-level diffs between consecutive versions of Ley 18.045.
 * Quick analysis script to understand the scale of changes.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, '../../research/2026-02-18/ley-18045/json');

function stripHtml(html) {
	return html
		.replace(/<div[^>]*class="n[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
		.replace(/<span[^>]*class="n"[^>]*>[\s\S]*?<\/span>/gi, '')
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<div[^>]*class="p"[^>]*>/gi, '')
		.replace(/<\/div>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
		.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec)))
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

function cleanAnnotations(text) {
	let r = text;
	r = r.replace(/\n?\s*El (?:Art\.|art\.|artículo|Artículo|inciso)[^\n]*?(?:de la|del)\s+(?:LEY|DECRETO LEY|Ley|DFL|D\.?S\.?)\s+\d+[^\n]*?publicad[ao][^\n]*/gi, '');
	r = r.replace(/(?:LEY|Ley|DL|DFL|DECRETO LEY|D\.?S\.?)\s+\d+[A-Za-z]*(?:\s*\n\s*(?:Art\.?\s+[^\n]*|N[°ºo]\s*[^\n]*|D\.O\.?\s*[\d.]+))*\s*/gi, ' ');
	r = r.replace(/D\.O\.?\s*[\dO]{2}[\..\dO]+/g, '');
	r = r.replace(/\s*INCI\s*S?O(?:S(?:OS)?|S)?\s+DEROGADOS?\b/gi, '');
	r = r.replace(/\s*IN\s*CISOS?\s+DEROGADOS?\b/gi, '');
	r = r.replace(/\s*INCISO(?:\s+FINAL)?\s*[-–]?\s*DEROGADOS?\b/gi, '');
	r = r.replace(/\s*(?:ARTICULO|ARTÍCULO)\s+DEROGADO\b/gi, '');
	r = r.replace(/^\s*DEROGADO:\s*/im, '');
	r = r.replace(/\s*NOTA\s*\d*\s*:?\s*$/gm, '');
	r = r.replace(/\nNOTA[^]*$/s, '');
	r = r.replace(/^\s*Art\.?\s+[\wáéíóúñÁÉÍÓÚÑ°º]+[^\n]*$/gm, '');
	r = r.replace(/\bGADO\b/g, '');
	r = r.replace(/\n{3,}/g, '\n\n');
	r = r.replace(/\s{2,}/g, ' ');
	r = r.replace(/\s+$/gm, '');
	return r.trim();
}

function extractArticles(jsonPath) {
	const data = JSON.parse(readFileSync(jsonPath, 'utf-8'));
	const articles = new Map();
	const usedEIds = new Map();

	function collect(items) {
		for (const item of items) {
			if (item.t) {
				const text = cleanAnnotations(stripHtml(item.t));
				const match = text.match(/^(?:\s*)(?:Art[ií]culo|ARTICULO)\s+(\d+[°ºo]?\s*(?:bis|ter|qu[aá]ter|quinquies)?)/i);
				if (match) {
					const artNum = match[1].replace(/[°ºo]/g, '').trim();
					let eId = 'art_' + artNum.toLowerCase().replace(/\s+/g, '');
					const count = usedEIds.get(eId) || 0;
					usedEIds.set(eId, count + 1);
					if (count > 0) eId = eId + '_t' + count;
					articles.set(eId, text);
				}
			}
			if (item.h) collect(item.h);
		}
	}
	collect(data.html || []);
	return articles;
}

const index = JSON.parse(readFileSync(join(DIR, 'versions-index.json'), 'utf-8'));
let prevArticles = null;
let totalChanges = 0;
const transitions = [];

for (const v of index.versions) {
	const articles = extractArticles(join(DIR, v.filename));

	if (prevArticles) {
		let subs = 0, ins = 0, reps = 0;
		for (const [eId, text] of articles) {
			if (prevArticles.has(eId)) {
				if (prevArticles.get(eId) !== text) subs++;
			} else {
				ins++;
			}
		}
		for (const eId of prevArticles.keys()) {
			if (!articles.has(eId)) reps++;
		}
		const total = subs + ins + reps;
		totalChanges += total;
		transitions.push({ from: index.versions[v.index - 2].date, to: v.date, subs, ins, reps, total });
		console.log(`v${String(v.index).padStart(2, '0')} ${v.date} | ${String(articles.size).padStart(3)} arts | ${String(total).padStart(3)} changes (sub=${subs} ins=${ins} rep=${reps})`);
	} else {
		console.log(`v${String(v.index).padStart(2, '0')} ${v.date} | ${String(articles.size).padStart(3)} arts | ORIGINAL`);
	}

	prevArticles = articles;
}

console.log(`\nTotal transitions: ${transitions.length}`);
console.log(`Total article changes: ${totalChanges}`);
console.log(`Transitions with 0 changes: ${transitions.filter(t => t.total === 0).length}`);
console.log(`\nTransitions with 0 changes:`);
transitions.filter(t => t.total === 0).forEach(t => console.log(`  ${t.from} → ${t.to}`));
