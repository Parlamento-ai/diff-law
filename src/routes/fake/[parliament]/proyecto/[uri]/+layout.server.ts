import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { loadParliamentMeta, loadBillWithDiffs } from '$lib/server/parliament-loader';
import type { TimelineEntry, DocumentType } from '$lib/types';

export const load: LayoutServerLoad = async ({ params }) => {
	try {
		const meta = await loadParliamentMeta(params.parliament);
		const billUri = decodeURIComponent(params.uri);
		const data = await loadBillWithDiffs(billUri);

		// Convert timeline events to TimelineEntry format for the Timeline component
		// Map parliament document types to the limited DocumentType set
		const typeMap: Record<string, DocumentType> = {
			act: 'act',
			bill: 'bill',
			amendment: 'amendment',
			// Non-change documents default to 'bill' for display purposes
			debate: 'bill',
			communication: 'bill',
			citation: 'bill',
			question: 'bill',
			judgment: 'bill',
			officialGazette: 'act'
		};

		// Add original law as first entry
		const timeline: TimelineEntry[] = [
			{
				slug: 'original',
				label: 'Ley Original',
				date: data.targetAct?.frbr.date || '',
				type: 'act',
				author: '',
				fileName: ''
			}
		];

		// Add timeline events (only bill and amendment produce changes)
		for (const event of data.timeline) {
			if (event.type === 'bill' || event.type === 'amendment') {
				timeline.push({
					slug: encodeURIComponent(event.uri),
					label: event.title,
					date: event.date,
					type: typeMap[event.type] || 'bill',
					author: event.description,
					fileName: ''
				});
			}
		}

		return {
			meta,
			billUri,
			entry: data.entry,
			timeline,
			// Pass along the full data for version pages
			originalLaw: data.originalLaw,
			relatedDocs: data.relatedDocs,
			fullTimeline: data.timeline
		};
	} catch (e) {
		console.error(e);
		error(404, 'Bill not found');
	}
};
