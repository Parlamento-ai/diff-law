import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { getDb, schema } from '../../../db';
import { parseBill } from '$lib/bill/parse';

export type BillDoc = typeof schema.DocumentTable.$inferSelect;

export type LinkedDoc = {
	country: string;
	type: string;
	nativeId: string;
	title: string;
	xml: string;
	publishedAt: string | null;
	lastActivityAt: string | null;
	relation: string | null;
	source: 'amendment' | 'debate' | 'citation';
};

export function loadBill(country: string, id: string): BillDoc {
	const db = getDb();
	const doc = db
		.select()
		.from(schema.DocumentTable)
		.where(
			and(
				eq(schema.DocumentTable.countryCode, country),
				eq(schema.DocumentTable.type, 'bill'),
				eq(schema.DocumentTable.nativeId, id)
			)
		)
		.get();

	if (!doc) {
		throw error(404, `bill ${country}/${id} not found`);
	}
	return doc;
}

export function loadLinkedDocs(doc: BillDoc): LinkedDoc[] {
	const db = getDb();
	const parsed = parseBill(doc.xml);

	const incomingAmendments = db
		.select({
			country: schema.DocumentTable.countryCode,
			type: schema.DocumentTable.type,
			nativeId: schema.DocumentTable.nativeId,
			title: schema.DocumentTable.title,
			xml: schema.DocumentTable.xml,
			publishedAt: schema.DocumentTable.publishedAt,
			lastActivityAt: schema.DocumentTable.lastActivityAt,
			relation: schema.DocumentLinkTable.relation
		})
		.from(schema.DocumentLinkTable)
		.innerJoin(
			schema.DocumentTable,
			eq(schema.DocumentTable.id, schema.DocumentLinkTable.fromId)
		)
		.where(
			and(
				eq(schema.DocumentLinkTable.toId, doc.id),
				eq(schema.DocumentTable.type, 'amendment')
			)
		)
		.all();

	const billHrefs = [
		parsed.identification.frbrWork,
		parsed.identification.frbrExpression,
		parsed.identification.frbrManifestation
	].filter((href): href is string => Boolean(href));

	const relatedDebates = db
		.select({
			country: schema.DocumentTable.countryCode,
			type: schema.DocumentTable.type,
			nativeId: schema.DocumentTable.nativeId,
			title: schema.DocumentTable.title,
			xml: schema.DocumentTable.xml,
			publishedAt: schema.DocumentTable.publishedAt,
			lastActivityAt: schema.DocumentTable.lastActivityAt
		})
		.from(schema.DocumentTable)
		.where(
			and(
				eq(schema.DocumentTable.countryCode, doc.countryCode),
				eq(schema.DocumentTable.type, 'debate')
			)
		)
		.all()
		.filter((debate) => billHrefs.some((href) => debate.xml.includes(href)));

	const relatedCitations = db
		.select({
			country: schema.DocumentTable.countryCode,
			type: schema.DocumentTable.type,
			nativeId: schema.DocumentTable.nativeId,
			title: schema.DocumentTable.title,
			xml: schema.DocumentTable.xml,
			publishedAt: schema.DocumentTable.publishedAt,
			lastActivityAt: schema.DocumentTable.lastActivityAt
		})
		.from(schema.DocumentTable)
		.where(
			and(
				eq(schema.DocumentTable.countryCode, doc.countryCode),
				eq(schema.DocumentTable.type, 'citation')
			)
		)
		.all()
		.filter((citation) => billHrefs.some((href) => citation.xml.includes(href)));

	return [
		...incomingAmendments.map((d) => ({ ...d, source: 'amendment' as const })),
		...relatedDebates.map((d) => ({ ...d, relation: null, source: 'debate' as const })),
		...relatedCitations.map((d) => ({ ...d, relation: null, source: 'citation' as const }))
	];
}

export function billEntries() {
	const db = getDb();
	return db
		.select({
			country: schema.DocumentTable.countryCode,
			id: schema.DocumentTable.nativeId
		})
		.from(schema.DocumentTable)
		.where(eq(schema.DocumentTable.type, 'bill'))
		.all();
}
