<script lang="ts">
	import { page } from '$app/state';
	import PlusIcon from '~icons/lucide/plus';

	let { data, children } = $props();
	const doc = $derived(data.doc);
	const lint = $derived(data.lint);

	const completenessPct = $derived(Math.round(lint.completeness * 100));
	const errorCount = $derived(lint.findings.filter((f) => f.severity === 'error').length);
	const warnCount = $derived(lint.findings.filter((f) => f.severity === 'warn').length);

	function scoreClass(pct: number) {
		if (pct >= 90) return 'score-good';
		if (pct >= 70) return 'score-mid';
		return 'score-low';
	}

	const base = $derived(`/demo/${doc.countryCode}/bill/${doc.nativeId}`);
	const path = $derived(page.url.pathname);
	const activeTab = $derived<'document' | 'lint' | 'xml'>(
		path.endsWith('/lint') ? 'lint' : path.endsWith('/xml') ? 'xml' : 'document'
	);

	let titleExpanded = $state(false);
	let titleEl = $state<HTMLElement | null>(null);
	let titleTruncated = $state(false);

	$effect(() => {
		void doc.title;
		if (!titleEl || titleExpanded) return;
		titleTruncated = titleEl.scrollWidth > titleEl.clientWidth + 1;
	});
</script>

<svelte:head>
	<title>{doc.nativeId} — bill — research demo</title>
</svelte:head>

<div class="head-band">
	<header class="head">
		<div class="head-row" class:head-row-expanded={titleExpanded}>
			<h1
				class="head-title"
				class:head-title-expanded={titleExpanded}
				title={doc.title}
				bind:this={titleEl}
			><span class="head-id">{doc.nativeId}</span>{doc.title}</h1>
			{#if !titleExpanded && titleTruncated}
				<button
					type="button"
					class="head-title-toggle"
					onclick={() => (titleExpanded = true)}
					aria-expanded={false}
					aria-label="show more"
				><PlusIcon class="h-3 w-3" /></button>
			{/if}
		</div>
		{#if titleExpanded}
			<button
				type="button"
				class="head-title-collapse"
				onclick={() => (titleExpanded = false)}
				aria-expanded={true}
			>show less</button>
		{/if}
	</header>

	<nav class="bill-subnav" aria-label="Document views">
		<a
			href={base}
			class="subtab"
			class:subtab-active={activeTab === 'document'}
		>
			Document
		</a>
		<a
			href={`${base}/lint`}
			class="subtab"
			class:subtab-active={activeTab === 'lint'}
		>
			AKN lint
			<span class="tab-score {scoreClass(completenessPct)}">{completenessPct}%</span>
			{#if errorCount}<span class="tab-pip pip-err">{errorCount}</span>{/if}
			{#if warnCount}<span class="tab-pip pip-warn">{warnCount}</span>{/if}
		</a>
		<a
			href={`${base}/xml`}
			class="subtab"
			class:subtab-active={activeTab === 'xml'}
		>
			XML
		</a>
	</nav>
</div>

{@render children()}

<style>
	.head-band {
		background: #ffffff;
		border-bottom: 1px solid #e5e7eb;
	}
	.head {
		max-width: 72rem;
		margin: 0 auto;
		padding: 18px 16px 14px;
	}
	.head-row {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}
	.head-id {
		display: inline-block;
		font-family: var(--font-mono);
		font-size: 13px;
		font-weight: 500;
		line-height: 1;
		color: #4b5563;
		background: #f3f4f6;
		border: 1px solid #e5e7eb;
		border-radius: 4px;
		padding: 3px 7px;
		margin-right: 8px;
		letter-spacing: 0;
		vertical-align: 1px;
		white-space: nowrap;
	}
	.head-title {
		margin: 0;
		min-width: 0;
		flex: 1 1 auto;
		font-family: var(--font-heading);
		font-size: 14px;
		font-weight: 400;
		line-height: 1.4;
		color: #111827;
		letter-spacing: -0.005em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: clip;
	}
	.head-title-expanded {
		white-space: normal;
		overflow: visible;
	}
	.head-title-toggle {
		flex: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		background: transparent;
		border: none;
		padding: 0;
		color: #6b7280;
		cursor: pointer;
		line-height: 1;
		transition: color 0.1s ease;
	}
	.head-title-toggle :global(svg) {
		fill: #6b7280;
		transition: fill 0.1s ease;
	}
	.head-title-toggle:hover :global(svg) {
		fill: #111827;
	}
	.head-title-collapse {
		display: inline-block;
		margin: 6px 0 0 -6px;
		padding: 2px 6px;
		background: transparent;
		border: none;
		border-radius: 3px;
		font-family: var(--font-heading);
		font-size: 11px;
		font-weight: 500;
		color: #6b7280;
		cursor: pointer;
		line-height: 1;
		transition: background-color 0.1s ease, color 0.1s ease;
	}
	.head-title-collapse:hover {
		background: #f3f4f6;
		color: #111827;
	}

	.bill-subnav {
		display: flex;
		align-items: center;
		gap: 4px;
		max-width: 72rem;
		margin: 0 auto;
		padding: 0 16px;
		overflow-x: auto;
	}
	.subtab {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		padding: 8px 12px;
		font-family: var(--font-sans, inherit);
		font-size: 14px;
		font-weight: 500;
		color: #6b7280;
		cursor: pointer;
		text-decoration: none;
		transition: color 0.1s ease, border-color 0.1s ease;
		margin-bottom: -1px;
		white-space: nowrap;
	}
	.bill-subnav .subtab:first-of-type {
		margin-left: -12px;
	}
	.subtab:hover {
		color: #374151;
		border-bottom-color: #d1d5db;
	}
	.subtab-active {
		color: #111827;
		border-bottom-color: #111827;
	}
	.tab-score {
		font-family: var(--font-mono);
		font-size: 10.5px;
		padding: 1px 6px;
		border-radius: 3px;
		font-weight: 500;
		letter-spacing: 0;
	}
	.score-good {
		background: #ecfdf5;
		color: #065f46;
		border: 1px solid #6ee7b7;
	}
	.score-mid {
		background: #fef3c7;
		color: #92400e;
		border: 1px solid #fcd34d;
	}
	.score-low {
		background: var(--color-deletion-50);
		color: var(--color-deletion-800);
		border: 1px solid var(--color-deletion-500);
	}
	.tab-pip {
		font-family: var(--font-mono);
		font-size: 10px;
		padding: 0 5px;
		border-radius: 8px;
		font-weight: 500;
		letter-spacing: 0;
	}
	.pip-err {
		background: var(--color-deletion-500);
		color: #ffffff;
	}
	.pip-warn {
		background: #fbbf24;
		color: #78350f;
	}
</style>
