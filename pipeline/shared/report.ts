/**
 * Shared pipeline report utilities — loadJson, pad, fmtTime, formatReport
 * Used by CL, EU, US, and ES pipelines
 */
import { existsSync, readFileSync } from 'node:fs';
import type { PipelineManifest } from './types.js';

export function loadJson<T>(path: string, label: string): T {
	if (!existsSync(path)) {
		throw new Error(`${label} not found at ${path} — run earlier phases first`);
	}
	return JSON.parse(readFileSync(path, 'utf-8'));
}

export function pad(s: string, n: number): string {
	return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

export function fmtTime(ms: number): string {
	return (ms / 1000).toFixed(1) + 's';
}

export function formatReport(manifest: PipelineManifest): string {
	const BAR = '\u2550'.repeat(55);
	const lines: string[] = [];

	lines.push(BAR);
	lines.push(`  ${manifest.country.toUpperCase()} AKN Pipeline: ${manifest.slug}`);
	lines.push(`  Title: ${manifest.title}`);
	lines.push(BAR);

	for (const r of manifest.results) {
		const status = `[${r.status}]`;
		const stepLabel = `${r.step}. ${r.name}`;
		lines.push(
			`  ${pad(status, 6)}  ${pad(stepLabel, 22)} ${pad(r.detail, 35)} ${fmtTime(r.elapsed)}`
		);
	}

	if (manifest.crossChecks && manifest.crossChecks.length > 0) {
		lines.push('');
		lines.push('  Cross-checks:');
		for (const c of manifest.crossChecks) {
			const detail = c.detail ? ` ${c.detail}` : '';
			lines.push(`  [${c.status}]  ${c.name}${detail}`);
		}
	}

	const pass = manifest.results.filter((r) => r.status === 'PASS').length;
	const fail = manifest.results.filter((r) => r.status === 'FAIL').length;
	const warn = manifest.results.filter((r) => r.status === 'WARN').length;

	lines.push('');
	lines.push(`  RESULT: ${pass} pass, ${fail} fail, ${warn} warn (${fmtTime(manifest.elapsed)})`);
	lines.push(BAR);

	return lines.join('\n');
}
