import { billEntries, loadBill, loadLinkedDocs } from '../loader';

export const prerender = true;

export function entries() {
	return billEntries();
}

export async function load({ params }) {
	const { country, id } = params;
	const doc = loadBill(country, id);
	const linkedDocs = loadLinkedDocs(doc).map((d) => ({
		type: d.type,
		nativeId: d.nativeId,
		title: d.title,
		xml: d.xml
	}));
	return { linkedDocs };
}
