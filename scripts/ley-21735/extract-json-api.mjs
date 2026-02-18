/**
 * Extract pre-reform and post-reform versions of all modified norms
 * using the LeyChile JSON API (nuevo.leychile.cl/servicios/Navegar/get_norma_json).
 *
 * This API supports versioning via ?idVersion=YYYY-MM-DD and returns
 * the full structured content of the norm.
 *
 * Usage: node scripts/ley-21735/extract-json-api.mjs
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '../../research/2026-02-18/ley-21735/json');
mkdirSync(OUTPUT_DIR, { recursive: true });

const PRE_REFORM_DATE = '2025-03-25';
// Post-reform: no idVersion param = current/latest version

const NORMS = [
	{ slug: 'dl-3500', id: 7147, name: 'DL 3.500' },
	{ slug: 'ley-21419', id: 1171923, name: 'Ley 21.419' },
	{ slug: 'ley-20255', id: 243202, name: 'Ley 20.255' },
	{ slug: 'ley-19728', id: 185994, name: 'Ley 19.728' },
	{ slug: 'ley-17322', id: 28919, name: 'Ley 17.322' },
	{ slug: 'dfl-5-2003', id: 221322, name: 'DFL 5/2003' },
	{ slug: 'ley-18045', id: 29472, name: 'Ley 18.045' },
	{ slug: 'dfl-28', id: 4115, name: 'DFL 28/1981' },
	{ slug: 'ley-20880', id: 1086062, name: 'Ley 20.880' },
	{ slug: 'ley-20712', id: 1060349, name: 'Ley 20.712' },
	{ slug: 'dfl-251', id: 5765, name: 'DFL 251/1931' },
	{ slug: 'ley-18833', id: 30082, name: 'Ley 18.833' },
];

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
	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({
		userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
	});
	const page = await context.newPage();
	page.setDefaultTimeout(60_000);

	// First navigate to LeyChile to establish session/cookies
	console.log('Establishing session...');
	await page.goto('https://www.bcn.cl/leychile/Navegar?idNorma=7147', {
		waitUntil: 'networkidle',
		timeout: 60_000
	});
	await page.waitForTimeout(3000);
	console.log('Session established.\n');

	const results = {};

	for (const norm of NORMS) {
		console.log(`\n=== ${norm.name} (${norm.slug}, id=${norm.id}) ===`);

		// Pre-reform version
		console.log(`  Fetching pre-reform (${PRE_REFORM_DATE})...`);
		const pre = await fetchNormJson(page, norm.id, PRE_REFORM_DATE);
		if (pre.ok) {
			writeFileSync(join(OUTPUT_DIR, `${norm.slug}-pre.json`), pre.data, 'utf-8');
			console.log(`  Pre-reform saved: ${pre.length} chars`);
		} else {
			console.log(`  Pre-reform FAILED:`, pre);
		}

		// Post-reform version (current)
		console.log('  Fetching post-reform (current)...');
		const post = await fetchNormJson(page, norm.id, null);
		if (post.ok) {
			writeFileSync(join(OUTPUT_DIR, `${norm.slug}-post.json`), post.data, 'utf-8');
			console.log(`  Post-reform saved: ${post.length} chars`);
		} else {
			console.log(`  Post-reform FAILED:`, post);
		}

		// Quick comparison
		if (pre.ok && post.ok) {
			const same = pre.data === post.data;
			console.log(`  Versions ${same ? 'IDENTICAL ⚠️' : 'DIFFER ✅'} (${pre.length} vs ${post.length})`);
		}

		results[norm.slug] = {
			preOk: pre.ok,
			postOk: post.ok,
			preLength: pre.ok ? pre.length : 0,
			postLength: post.ok ? post.length : 0,
			identical: pre.ok && post.ok && pre.data === post.data
		};

		// Small delay between requests
		await page.waitForTimeout(1000);
	}

	// Summary
	console.log('\n\n========== EXTRACTION SUMMARY ==========');
	for (const [slug, r] of Object.entries(results)) {
		const status = r.identical ? 'IDENTICAL ⚠️' : (r.preOk && r.postOk ? 'DIFFER ✅' : 'FAILED ❌');
		console.log(`  ${slug}: pre=${r.preLength}, post=${r.postLength} → ${status}`);
	}

	await browser.close();
}

main().catch(console.error);
