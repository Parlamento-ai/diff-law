import { parseBill, parseLinkedTimelineDocument } from '$lib/bill/parse';
import { billEntries, loadBill, loadLinkedDocs } from './loader';

export const prerender = true;

export function entries() {
	return billEntries();
}

export async function load({ params }) {
	const { country, id } = params;
	const doc = loadBill(country, id);
	const parsed = parseBill(doc.xml);
	const linked = loadLinkedDocs(doc);

	parsed.timeline = [
		...parsed.timeline,
		...linked.flatMap((d) =>
			parseLinkedTimelineDocument({
				xml: d.xml,
				origin: {
					type: d.source,
					nativeId: d.nativeId,
					title: d.title,
					href: `/demo/${d.country}/${d.type}/${d.nativeId}`
				}
			})
		)
	].sort((a, b) => {
		if (a.date !== b.date) return a.date < b.date ? -1 : 1;
		const sourceOrder = { bill: 0, citation: 1, amendment: 2, debate: 3 };
		const aSource = sourceOrder[a.origin?.type ?? 'bill'];
		const bSource = sourceOrder[b.origin?.type ?? 'bill'];
		if (aSource !== bSource) return aSource - bSource;
		return a.id.localeCompare(b.id);
	});

	const amendments = linked
		.filter((d) => d.source === 'amendment')
		.map((a) => ({
			country: a.country,
			type: a.type,
			nativeId: a.nativeId,
			title: a.title,
			publishedAt: a.publishedAt,
			lastActivityAt: a.lastActivityAt,
			relation: a.relation
		}));

	return { parsed, amendments };
}
