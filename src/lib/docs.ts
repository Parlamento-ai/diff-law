export interface DocEntry {
	slug: string;
	title: string;
	section: 'aknpp' | 'akn';
}

export const docs: DocEntry[] = [
	// AKN++ (on top)
	{ slug: 'aknpp/overview', title: 'Overview', section: 'aknpp' },
	{ slug: 'aknpp/changeset', title: 'The changeSet element', section: 'aknpp' },
	{ slug: 'aknpp/voting', title: 'The vote element', section: 'aknpp' },
	{ slug: 'aknpp/examples', title: 'Examples walkthrough', section: 'aknpp' },
	// AKN
	{ slug: 'akn/what-is-akn', title: 'What is Akoma Ntoso?', section: 'akn' },
	{ slug: 'akn/frbr', title: 'The FRBR model', section: 'akn' },
	{ slug: 'akn/document-types', title: 'Document types', section: 'akn' },
	{ slug: 'akn/structure', title: 'Common structure', section: 'akn' },
	{ slug: 'akn/metadata', title: 'Metadata', section: 'akn' },
	{ slug: 'akn/hierarchy', title: 'Legislative hierarchy', section: 'akn' },
	{ slug: 'akn/inline-elements', title: 'Inline elements', section: 'akn' },
	{ slug: 'akn/debates', title: 'Debates', section: 'akn' },
	{ slug: 'akn/naming-convention', title: 'Naming convention', section: 'akn' },
	{ slug: 'akn/national-profiles', title: 'National profiles', section: 'akn' }
];

/** Map from URL slug to actual filename on disk */
export const slugToFile: Record<string, string> = {
	'aknpp/overview': 'aknpp/01-overview.md',
	'aknpp/changeset': 'aknpp/02-changeset.md',
	'aknpp/voting': 'aknpp/03-voting.md',
	'aknpp/examples': 'aknpp/04-examples.md',
	'akn/what-is-akn': 'akn/01-what-is-akn.md',
	'akn/frbr': 'akn/02-frbr.md',
	'akn/document-types': 'akn/03-document-types.md',
	'akn/structure': 'akn/04-structure.md',
	'akn/metadata': 'akn/05-metadata.md',
	'akn/hierarchy': 'akn/06-hierarchy.md',
	'akn/inline-elements': 'akn/07-inline-elements.md',
	'akn/debates': 'akn/08-debates.md',
	'akn/naming-convention': 'akn/09-naming-convention.md',
	'akn/national-profiles': 'akn/10-national-profiles.md'
};
