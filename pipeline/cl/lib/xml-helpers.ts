/**
 * XML helper utilities for AKN generation
 * Consolidated from patterns in scripts/ley-17370/generate-akn.mjs etc.
 */
import { escapeXml } from '../../shared/xml.js';

export { escapeXml, buildArticlesXml, today } from '../../shared/xml.js';

/** Convert a full name like "De Urresti V., Alfonso" to a slug like "de-urresti-alfonso" */
function nameToSlug(name: string): string {
	return name
		.split(',')[0]
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/ /g, '-');
}

/** Build XML for a list of voters (for/against/abstain) */
export function buildVoterXml(
	voters: string[],
	type: 'for' | 'against' | 'abstain',
	chamber: 'senador' | 'diputado' = 'senador'
): string {
	if (voters.length === 0) return `        <akndiff:${type}/>`;
	const inner = voters
		.map((v) => {
			const slug = nameToSlug(v);
			return `          <akndiff:voter href="/cl/${chamber}/${slug}" showAs="${escapeXml(v)}"/>`;
		})
		.join('\n');
	return `        <akndiff:${type}>\n${inner}\n        </akndiff:${type}>`;
}
