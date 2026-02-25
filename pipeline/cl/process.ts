#!/usr/bin/env tsx
/**
 * Pipeline CLI — Generate AKN Diff XMLs from a Chilean boletín number
 *
 * Usage:
 *   npx tsx pipeline/cl/process.ts <número-boletín> [--phase=N] [--out=DIR] [--auto]
 *
 * Examples:
 *   npx tsx pipeline/cl/process.ts 17370
 *   npx tsx pipeline/cl/process.ts 15480 --phase=6
 *   npx tsx pipeline/cl/process.ts 17370 --auto          # non-interactive mode
 *   npx tsx pipeline/cl/process.ts 17370 --out=pipeline/data/cl/ley-17370
 */
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve, relative } from 'path';
import { discover } from './phases/1-discover.js';
import { configure } from './phases/2-configure.js';
import { download } from './phases/3-download.js';
import { extract } from './phases/4-extract.js';
import { parse } from './phases/5-parse.js';
import { generate } from './phases/6-generate.js';
import type { Discovery, PipelineConfig } from './types.js';
import type { ParsedDocuments } from './phases/5-parse.js';
import type { StepResult, PipelineManifest } from '../shared/types.js';
import { loadJson, formatReport } from '../shared/report.js';

// --- CLI argument parsing ---

function parseArgs(): { boletin: string; startPhase: number; outDir: string; auto: boolean } {
	const args = process.argv.slice(2);

	if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
		console.log(`
Pipeline Chile — AKN Diff Generator

Usage:
  npx tsx pipeline/cl/process.ts <número-boletín> [options]

Options:
  --phase=N    Start from phase N (1-6, default: 1)
  --out=DIR    Output directory (default: pipeline/data/cl/<boletín>)
  --auto       Non-interactive mode (skip prompts, use safe defaults)
  -h, --help   Show this help

Examples:
  npx tsx pipeline/cl/process.ts 17370
  npx tsx pipeline/cl/process.ts 15480 --phase=6
`);
		process.exit(0);
	}

	const boletin = args[0].replace(/[^\d]/g, ''); // strip non-digits
	if (!boletin) {
		console.error('Error: provide a boletín number (e.g., 17370)');
		process.exit(1);
	}

	let startPhase = 1;
	let outDir = '';
	let auto = false;

	for (const arg of args.slice(1)) {
		if (arg.startsWith('--phase=')) {
			startPhase = parseInt(arg.split('=')[1], 10);
			if (isNaN(startPhase) || startPhase < 1 || startPhase > 6) {
				console.error('Error: --phase must be 1-6');
				process.exit(1);
			}
		} else if (arg.startsWith('--out=')) {
			outDir = arg.split('=')[1];
		} else if (arg === '--auto') {
			auto = true;
		}
	}

	if (!outDir) {
		outDir = join('pipeline', 'data', 'cl', boletin);
	}

	return { boletin, startPhase, outDir: resolve(outDir), auto };
}

// --- Main ---

async function main(): Promise<void> {
	const { boletin, startPhase, outDir, auto } = parseArgs();

	console.log(`\n╔══════════════════════════════════════╗`);
	console.log(`║  Pipeline Chile — Boletín ${boletin.padEnd(10)}║`);
	console.log(`╚══════════════════════════════════════╝`);
	console.log(`  Output: ${outDir}`);
	console.log(`  Starting from phase: ${startPhase}`);
	if (auto) console.log(`  Mode: --auto (non-interactive)`);

	if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

	const startTime = Date.now();
	const allResults: StepResult[] = [];

	// Phase 1: DISCOVER
	let discovery: Discovery;
	if (startPhase <= 1) {
		const t0 = Date.now();
		discovery = await discover(boletin, outDir);
		allResults.push({ step: 1, id: 'discover', name: 'Discover', status: 'PASS', detail: `boletín ${boletin}`, elapsed: Date.now() - t0 });
	} else {
		console.log('\n=== Phase 1: DISCOVER (loading cached) ===');
		discovery = loadJson(join(outDir, 'discovery.json'), 'discovery.json');
	}

	// Phase 2: CONFIGURE
	let config: PipelineConfig;
	if (startPhase <= 2) {
		const t0 = Date.now();
		config = await configure(discovery, outDir, { auto });
		allResults.push({ step: 2, id: 'configure', name: 'Configure', status: 'PASS', detail: config.slug, elapsed: Date.now() - t0 });
	} else {
		console.log('\n=== Phase 2: CONFIGURE (loading cached) ===');
		config = loadJson(join(outDir, 'config.json'), 'config.json');
	}

	// Phase 3: DOWNLOAD
	if (startPhase <= 3) {
		const t0 = Date.now();
		await download(config, outDir);
		allResults.push({ step: 3, id: 'download', name: 'Download', status: 'PASS', detail: `${config.documentos.length} docs`, elapsed: Date.now() - t0 });
	} else {
		console.log('\n=== Phase 3: DOWNLOAD (skipped) ===');
	}

	// Phase 4: EXTRACT
	if (startPhase <= 4) {
		const t0 = Date.now();
		await extract(outDir);
		allResults.push({ step: 4, id: 'extract', name: 'Extract', status: 'PASS', detail: '', elapsed: Date.now() - t0 });
	} else {
		console.log('\n=== Phase 4: EXTRACT (skipped) ===');
	}

	// Phase 5: PARSE
	let parsed: ParsedDocuments;
	if (startPhase <= 5) {
		const t0 = Date.now();
		parsed = await parse(config, outDir);
		allResults.push({ step: 5, id: 'parse', name: 'Parse', status: 'PASS', detail: '', elapsed: Date.now() - t0 });
	} else {
		console.log('\n=== Phase 5: PARSE (loading cached) ===');
		parsed = loadJson(join(outDir, 'articles.json'), 'articles.json');
	}

	// Phase 6: GENERATE
	const t0Gen = Date.now();
	const generated = await generate(config, discovery, parsed, outDir);
	allResults.push({ step: 6, id: 'generate', name: 'Generate', status: 'PASS', detail: `${generated.length} AKN files`, elapsed: Date.now() - t0Gen });

	const totalElapsed = Date.now() - startTime;
	const aknDir = join(outDir, 'akn');
	const relAknDir = relative(resolve('.'), aknDir);

	const manifest: PipelineManifest = {
		country: 'cl',
		slug: config.slug,
		title: config.titulo,
		aknFiles: generated,
		elapsed: totalElapsed,
		results: allResults
	};

	const report = formatReport(manifest);
	console.log(report);

	const reportPath = join(outDir, 'pipeline-report.txt');
	writeFileSync(reportPath, report, 'utf-8');
	console.log(`\nReport saved: ${reportPath}`);
	console.log(`\n  Generated ${generated.length} AKN files in ${relAknDir}/`);
	console.log(`\n  To register in the viewer, add to src/lib/server/boletin-loader.ts:`);
	console.log(`    '${config.slug}': '${relAknDir}'`);

	const fail = allResults.filter((r) => r.status === 'FAIL').length;
	if (fail > 0) process.exit(1);
}

main().catch((err) => {
	console.error('\nPipeline failed:', err.message || err);
	process.exit(1);
});
