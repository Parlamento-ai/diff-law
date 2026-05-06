import { analyzeAknDocument } from '$lib/aknlint/analyze';
import { billProfile } from '../../../../../../research/schema/profiles/bill';
import { loadBill } from './loader';

export const prerender = true;

export async function load({ params }) {
	const { country, id } = params;
	const doc = loadBill(country, id);
	const lint = analyzeAknDocument(doc.xml, billProfile);
	return { doc, lint };
}
