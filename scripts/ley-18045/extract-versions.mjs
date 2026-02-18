/**
 * Download all historical versions of Ley 18.045 (Ley de Mercado de Valores)
 * from the LeyChile JSON API.
 *
 * Ley 18.045 has 32 historical versions spanning 1981-2025, all available
 * via the versioned JSON API: get_norma_json?idNorma=29472&idVersion=YYYY-MM-DD
 *
 * Each version represents a change introduced by a modifying law (ley modificatoria).
 * The vigencias metadata from LeyChile provides the exact date ranges.
 *
 * Usage: node scripts/ley-18045/extract-versions.mjs
 * Requires: playwright (npx playwright install chromium)
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '../../research/2026-02-18/ley-18045/json');
mkdirSync(OUTPUT_DIR, { recursive: true });

const ID_NORMA = 29472;

async function fetchNormJson(page, idNorma, idVersion) {
	const versionParam = idVersion ? `&idVersion=${idVersion}` : '';
	const url = `https://nuevo.leychile.cl/servicios/Navegar/get_norma_json?idNorma=${idNorma}${versionParam}&idLey=&tipoVersion=&cve=&agrupa_partes=1&r=`;

	const result = await page.evaluate(async (apiUrl) => {
		try {
			const resp = await fetch(apiUrl);
			if (resp.ok) {
				const text = await resp.text();
				return { ok: true, data: text, length: text.length };
			}
			return { ok: false, status: resp.status, statusText: resp.statusText };
		} catch (e) {
			return { ok: false, error: String(e) };
		}
	}, url);

	return result;
}

async function main() {
	// Step 1: Check if we already have the current version with vigencias metadata
	const currentPath = join(OUTPUT_DIR, 'current.json');
	let vigencias;

	if (existsSync(currentPath)) {
		console.log('Loading cached current version for vigencias metadata...');
		const data = JSON.parse(readFileSync(currentPath, 'utf-8'));
		vigencias = data.metadatos?.vigencias;
	}

	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({
		userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
	});
	const page = await context.newPage();
	page.setDefaultTimeout(60_000);

	// Establish session
	console.log('Establishing session with LeyChile...');
	await page.goto(`https://www.bcn.cl/leychile/Navegar?idNorma=${ID_NORMA}`, {
		waitUntil: 'networkidle',
		timeout: 60_000
	});
	await page.waitForTimeout(3000);
	console.log('Session established.\n');

	// Step 2: Download current version to get vigencias if not cached
	if (!vigencias) {
		console.log('Fetching current version for vigencias metadata...');
		const current = await fetchNormJson(page, ID_NORMA, null);
		if (!current.ok) {
			console.error('Failed to fetch current version:', current);
			await browser.close();
			process.exit(1);
		}
		writeFileSync(currentPath, current.data, 'utf-8');
		console.log(`Saved current version: ${current.length} chars`);
		const data = JSON.parse(current.data);
		vigencias = data.metadatos?.vigencias;
	}

	if (!vigencias || vigencias.length === 0) {
		console.error('No vigencias found in metadata!');
		await browser.close();
		process.exit(1);
	}

	// Step 3: Extract version dates from vigencias (skip deferred/future versions)
	const versions = vigencias
		.filter(v => v.tipo_version !== '8') // Skip "Con Vigencia Diferida por Evento"
		.map(v => v.desde)
		.sort(); // Chronological order

	console.log(`\nFound ${versions.length} historical versions:`);
	versions.forEach((d, i) => console.log(`  ${String(i + 1).padStart(2)}. ${d}`));

	// Step 4: Download each version
	const results = [];
	let downloaded = 0;
	let skipped = 0;

	for (let i = 0; i < versions.length; i++) {
		const versionDate = versions[i];
		const num = String(i + 1).padStart(2, '0');
		const filename = `v${num}-${versionDate}.json`;
		const filepath = join(OUTPUT_DIR, filename);

		// Skip if already downloaded
		if (existsSync(filepath)) {
			const size = readFileSync(filepath).length;
			console.log(`  [${num}/${versions.length}] ${versionDate} — CACHED (${size} bytes)`);
			results.push({ version: versionDate, filename, ok: true, cached: true });
			skipped++;
			continue;
		}

		console.log(`  [${num}/${versions.length}] Fetching ${versionDate}...`);
		const result = await fetchNormJson(page, ID_NORMA, versionDate);

		if (result.ok) {
			writeFileSync(filepath, result.data, 'utf-8');
			console.log(`    Saved: ${filename} (${result.length} chars)`);
			results.push({ version: versionDate, filename, ok: true, length: result.length });
			downloaded++;
		} else {
			console.log(`    FAILED:`, result);
			results.push({ version: versionDate, filename, ok: false, error: result });
		}

		// Rate limiting: 1.5s between requests
		if (i < versions.length - 1) {
			await page.waitForTimeout(1500);
		}
	}

	await browser.close();

	// Summary
	console.log('\n' + '='.repeat(60));
	console.log(`DOWNLOAD SUMMARY — Ley 18.045 (idNorma ${ID_NORMA})`);
	console.log('='.repeat(60));
	console.log(`Total versions: ${versions.length}`);
	console.log(`Downloaded: ${downloaded}`);
	console.log(`Cached: ${skipped}`);
	console.log(`Failed: ${results.filter(r => !r.ok).length}`);

	if (results.some(r => !r.ok)) {
		console.log('\nFailed versions:');
		results.filter(r => !r.ok).forEach(r => console.log(`  ${r.version}: ${JSON.stringify(r.error)}`));
	}

	// Save version index for downstream processing
	const indexPath = join(OUTPUT_DIR, 'versions-index.json');
	writeFileSync(indexPath, JSON.stringify({
		idNorma: ID_NORMA,
		nombre: 'Ley 18.045 — Ley de Mercado de Valores',
		versions: versions.map((date, i) => ({
			index: i + 1,
			date,
			filename: `v${String(i + 1).padStart(2, '0')}-${date}.json`,
		}))
	}, null, 2), 'utf-8');
	console.log(`\nVersion index saved to: ${indexPath}`);
}

main().catch(console.error);
