import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	loadParliamentManifest,
	loadAllDocuments
} from '$lib/server/parliament-loader';
import {
	parseActToLawState,
	parseBillChanges,
	applyChangesToLaw,
	computeLawDiffs,
	extractTargetActUri
} from '$lib/server/akn-diff-computer';
import { computeWordDiff } from '$lib/utils/word-diff';
import type { ArticleDiff, LawState, WordToken } from '$lib/types';

function serializeLawState(law: LawState) {
	return {
		title: law.title,
		preface: law.preface,
		sections: law.sections.map((s) => ({
			eId: s.eId,
			heading: s.heading,
			articles: s.articles.map((a) => ({
				eId: a.eId,
				heading: a.heading,
				content: a.content
			}))
		}))
	};
}

export const load: PageServerLoad = async ({ params, parent }) => {
	const parentData = await parent();
	const step = params.step;

	// If step is 'original', show the original law with no changes
	if (step === 'original') {
		// If there's no original law, this bill creates a new law (not modifying existing)
		// Redirect to the bill step instead
		if (!parentData.originalLaw) {
			// Find the bill in timeline and return empty state with message
			return {
				law: { title: 'Nueva Ley', preface: '', sections: [] },
				changedArticleIds: [],
				diffs: [],
				accumulatedDiffs: {},
				versionSlug: 'original',
				versionLabel: 'Sin ley base',
				versionType: 'act',
				versionDate: '',
				versionAuthor: '',
				isNewLaw: true
			};
		}
		return {
			law: serializeLawState(parentData.originalLaw),
			changedArticleIds: [],
			diffs: [],
			accumulatedDiffs: {},
			versionSlug: 'original',
			versionLabel: 'Ley Original',
			versionType: 'act',
			versionDate: '',
			versionAuthor: ''
		};
	}

	// Otherwise, find the document for this step and compute diffs
	const stepUri = decodeURIComponent(step);
	const manifest = await loadParliamentManifest();
	const docs = await loadAllDocuments(manifest);

	// Find the step in timeline
	const timelineEntry = parentData.fullTimeline.find((e: { uri: string }) => e.uri === stepUri);
	if (!timelineEntry) {
		error(404, 'Version not found');
	}

	// If no original law, this is a new law bill - show bill content without diffs
	if (!parentData.originalLaw) {
		return {
			law: { title: timelineEntry.title, preface: '', sections: [] },
			changedArticleIds: [],
			diffs: [],
			accumulatedDiffs: {},
			versionSlug: step,
			versionLabel: timelineEntry.title,
			versionType: timelineEntry.type,
			versionDate: timelineEntry.date,
			versionAuthor: timelineEntry.description || '',
			isNewLaw: true
		};
	}

	// Compute cumulative changes up to and including this step
	const changeDocs: string[] = [];
	for (const event of parentData.fullTimeline) {
		if (event.type === 'bill' || event.type === 'amendment') {
			changeDocs.push(event.uri);
		}
		if (event.uri === stepUri) break;
	}

	// Apply cumulative changes
	let cumulativeChanges: { base: string; result: string; changes: any[] } = {
		base: '',
		result: stepUri,
		changes: []
	};

	for (const docUri of changeDocs) {
		const doc = docs.get(docUri);
		if (doc) {
			const changes = parseBillChanges(doc, parentData.originalLaw);
			cumulativeChanges.changes.push(...changes.changes);
		}
	}

	const applied = applyChangesToLaw(parentData.originalLaw, cumulativeChanges);
	const computed = computeLawDiffs(parentData.originalLaw, cumulativeChanges);

	// Get current step's changes only for the diff panel
	const currentDoc = docs.get(stepUri);
	let currentDiffs: ArticleDiff[] = [];
	if (currentDoc) {
		const currentChanges = parseBillChanges(currentDoc, parentData.originalLaw);
		for (const change of currentChanges.changes) {
			const diff: ArticleDiff = {
				articleId: change.article,
				heading: findArticleHeading(applied.modifiedLaw, change.article) || change.article,
				changeType: change.type,
				oldText: change.oldText,
				newText: change.newText
			};
			if (change.type === 'substitute' && change.oldText && change.newText) {
				diff.wordDiff = computeWordDiff(change.oldText, change.newText);
			}
			currentDiffs.push(diff);
		}
	}

	return {
		law: serializeLawState(applied.modifiedLaw),
		changedArticleIds: [...applied.changedArticleIds],
		diffs: currentDiffs,
		accumulatedDiffs: computed.accumulatedDiffs,
		versionSlug: step,
		versionLabel: timelineEntry.title,
		versionType: timelineEntry.type,
		versionDate: timelineEntry.date,
		versionAuthor: timelineEntry.description || ''
	};
};

function findArticleHeading(law: LawState, eId: string): string | undefined {
	for (const sec of law.sections) {
		const art = sec.articles.find((a) => a.eId === eId);
		if (art) return art.heading;
	}
	return undefined;
}
