import type { AknNode, GenericAknDocument } from '$lib/types/explorer';
import type { LawState, Section, Article, ArticleChange, ChangeSet, WordToken, ArticleDiff } from '$lib/types';
import { findNode, findAllNodes, extractTextFromNode } from '$lib/utils/akn-helpers';
import { computeWordDiff } from '$lib/utils/word-diff';

/**
 * Parse an AKN act document into a LawState
 */
export function parseActToLawState(doc: GenericAknDocument): LawState {
	const body = findNode(doc.root, 'body');
	const preface = findNode(doc.root, 'preface');
	const longTitle = preface ? findNode(preface, 'longTitle') : undefined;

	const sections: Section[] = [];

	if (body) {
		const sectionNodes = findAllNodes(body, 'section');

		for (const secNode of sectionNodes) {
			const heading = findNode(secNode, 'heading');
			const articles: Article[] = [];

			const articleNodes = findAllNodes(secNode, 'article');
			for (const artNode of articleNodes) {
				const artHeading = findNode(artNode, 'heading');
				const content = findNode(artNode, 'content');

				articles.push({
					eId: artNode.attributes['eId'] || '',
					heading: artHeading ? extractTextFromNode(artHeading) : '',
					content: content ? extractTextFromNode(content) : ''
				});
			}

			sections.push({
				eId: secNode.attributes['eId'] || '',
				heading: heading ? extractTextFromNode(heading) : '',
				articles
			});
		}
	}

	return {
		title: longTitle ? extractTextFromNode(longTitle) : '',
		preface: preface ? extractTextFromNode(preface) : '',
		sections
	};
}

/**
 * Extract the target act URI from a bill's preface
 */
export function extractTargetActUri(doc: GenericAknDocument): string | null {
	const preface = findNode(doc.root, 'preface');
	if (!preface) return null;

	const refs = findAllNodes(preface, 'ref');
	for (const ref of refs) {
		const href = ref.attributes['href'] || '';
		if (href.includes('/act/')) {
			return href;
		}
	}
	return null;
}

/**
 * Parse a bill document to extract proposed changes
 */
export function parseBillChanges(billDoc: GenericAknDocument, actLaw: LawState): ChangeSet {
	const body = findNode(billDoc.root, 'body');
	const changes: ArticleChange[] = [];

	if (!body) {
		return { base: '', result: '', changes };
	}

	const articleNodes = findAllNodes(body, 'article');

	for (const artNode of articleNodes) {
		const content = findNode(artNode, 'content');
		if (!content) continue;

		const contentText = extractTextFromNode(content);

		// Find which article this change refers to
		const refs = findAllNodes(content, 'ref');
		let targetArticleId = '';
		for (const ref of refs) {
			const href = ref.attributes['href'] || '';
			const match = href.match(/#(art_\d+\w*)/);
			if (match) {
				targetArticleId = match[1];
				break;
			}
		}

		// Determine change type based on content
		const modNode = findNode(content, 'mod');
		const insNode = findNode(content, 'ins');

		if (insNode) {
			// This is an insertion of a new article
			const newText = extractTextFromNode(insNode);
			// Extract the new article ID from the text (e.g., "Article 5 bis")
			const newArtMatch = contentText.match(/Article\s+(\d+)\s*(bis|ter|quater)?/i);
			const newArticleId = newArtMatch
				? `art_${newArtMatch[1]}${newArtMatch[2] || ''}`
				: artNode.attributes['eId'] || '';

			changes.push({
				article: newArticleId,
				type: 'insert',
				newText: cleanModText(newText),
				after: targetArticleId
			});
		} else if (modNode) {
			// This is a substitution
			const newText = extractTextFromNode(modNode);

			// Find the original text from the act
			const originalArticle = findArticleInLaw(actLaw, targetArticleId);
			const oldText = originalArticle?.content || '';

			changes.push({
				article: targetArticleId,
				type: 'substitute',
				oldText,
				newText: cleanModText(newText)
			});
		}
	}

	return {
		base: extractTargetActUri(billDoc) || '',
		result: billDoc.frbr.workUri,
		changes
	};
}

/**
 * Clean modification text by removing the article number prefix
 */
function cleanModText(text: string): string {
	// Remove patterns like "Article 1. Type of rice. " at the beginning
	return text.replace(/^["']?Article\s+\d+\s*(bis|ter|quater)?\.\s*/i, '').replace(/["']$/g, '').trim();
}

/**
 * Find an article in the law state by eId
 */
function findArticleInLaw(law: LawState, eId: string): Article | undefined {
	for (const sec of law.sections) {
		const art = sec.articles.find((a) => a.eId === eId);
		if (art) return art;
	}
	return undefined;
}

/**
 * Apply a change set to a law state and return the modified state
 */
export function applyChangesToLaw(law: LawState, changeSet: ChangeSet): {
	modifiedLaw: LawState;
	changedArticleIds: Set<string>;
} {
	// Deep clone the law
	const modifiedLaw: LawState = {
		title: law.title,
		preface: law.preface,
		sections: law.sections.map((sec) => ({
			eId: sec.eId,
			heading: sec.heading,
			articles: sec.articles.map((art) => ({ ...art }))
		}))
	};

	const changedArticleIds = new Set<string>();

	for (const change of changeSet.changes) {
		switch (change.type) {
			case 'substitute': {
				const art = findArticleInLaw(modifiedLaw, change.article);
				if (art && change.newText) {
					art.content = change.newText;
					changedArticleIds.add(change.article);
				}
				break;
			}
			case 'insert': {
				if (!change.newText) break;
				const newArticle: Article = {
					eId: change.article,
					heading: formatArticleHeading(change.article),
					content: change.newText
				};
				for (const sec of modifiedLaw.sections) {
					const idx = sec.articles.findIndex((a) => a.eId === change.after);
					if (idx !== -1) {
						sec.articles.splice(idx + 1, 0, newArticle);
						changedArticleIds.add(change.article);
						break;
					}
				}
				break;
			}
			case 'repeal': {
				for (const sec of modifiedLaw.sections) {
					const idx = sec.articles.findIndex((a) => a.eId === change.article);
					if (idx !== -1) {
						sec.articles.splice(idx, 1);
						changedArticleIds.add(change.article);
						break;
					}
				}
				break;
			}
		}
	}

	return { modifiedLaw, changedArticleIds };
}

function formatArticleHeading(eId: string): string {
	const match = eId.match(/^art_(\d+)(\w*)$/);
	if (match) {
		const num = match[1];
		const suffix = match[2] ? ` ${match[2]}` : '';
		return `Article ${num}${suffix}.`;
	}
	return eId;
}

/**
 * Compute diffs between original and modified law
 */
export function computeLawDiffs(
	originalLaw: LawState,
	changeSet: ChangeSet
): {
	diffs: ArticleDiff[];
	accumulatedDiffs: Record<string, WordToken[]>;
} {
	const diffs: ArticleDiff[] = [];
	const accumulatedDiffs: Record<string, WordToken[]> = {};

	for (const change of changeSet.changes) {
		const originalArticle = findArticleInLaw(originalLaw, change.article);

		const diff: ArticleDiff = {
			articleId: change.article,
			heading: originalArticle?.heading || formatArticleHeading(change.article),
			changeType: change.type,
			oldText: change.oldText,
			newText: change.newText
		};

		if (change.type === 'substitute' && change.oldText && change.newText) {
			const wordDiff = computeWordDiff(change.oldText, change.newText);
			diff.wordDiff = wordDiff;
			accumulatedDiffs[change.article] = wordDiff;
		} else if (change.type === 'insert' && change.newText) {
			const insertedTokens = change.newText
				.split(/\s+/)
				.filter(Boolean)
				.map((text) => ({ text, type: 'added' as const }));
			diff.wordDiff = insertedTokens;
			accumulatedDiffs[change.article] = insertedTokens;
		} else if (change.type === 'repeal' && change.oldText) {
			const removedTokens = change.oldText
				.split(/\s+/)
				.filter(Boolean)
				.map((text) => ({ text, type: 'removed' as const }));
			diff.wordDiff = removedTokens;
			accumulatedDiffs[change.article] = removedTokens;
		}

		diffs.push(diff);
	}

	return { diffs, accumulatedDiffs };
}
