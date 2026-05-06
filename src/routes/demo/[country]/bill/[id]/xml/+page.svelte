<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	let { data } = $props();
	const doc = $derived(data.doc);
	const linkedDocs = $derived(data.linkedDocs);

	type XmlSource = { key: string; type: string; nativeId: string; title: string; xml: string };
	const xmlSources = $derived<XmlSource[]>([
		{ key: 'bill', type: 'bill', nativeId: doc.nativeId, title: doc.title, xml: doc.xml },
		...linkedDocs.map((d) => ({
			key: `${d.type}:${d.nativeId}`,
			type: d.type,
			nativeId: d.nativeId,
			title: d.title,
			xml: d.xml
		}))
	]);

	function searchParam(name: string) {
		return browser ? page.url.searchParams.get(name) : null;
	}

	const activeXmlKey = $derived<string>(
		(() => {
			const requested = searchParam('doc');
			if (!requested) return 'bill';
			return xmlSources.some((s) => s.key === requested) ? requested : 'bill';
		})()
	);
	const activeXmlSource = $derived(
		xmlSources.find((s) => s.key === activeXmlKey) ?? xmlSources[0]
	);

	function setXmlSource(key: string) {
		const url = new URL(page.url);
		if (key === 'bill') url.searchParams.delete('doc');
		else url.searchParams.set('doc', key);
		goto(url, { replaceState: false, keepFocus: true, noScroll: true });
	}

	let xmlCopied = $state(false);

	function copyXml() {
		navigator.clipboard.writeText(activeXmlSource.xml).then(() => {
			xmlCopied = true;
			setTimeout(() => (xmlCopied = false), 1500);
		});
	}

	function highlightXml(xml: string): string {
		const escaped = xml
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
		return escaped
			.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="xml-comment">$1</span>')
			.replace(
				/(&lt;\/?)([a-zA-Z_][\w:-]*)([^&]*?)(\/?&gt;)/g,
				(_match, open, tag, attrs, close) => {
					const attrsHl = attrs.replace(
						/([a-zA-Z_][\w:-]*)(=)(&quot;[^&]*?&quot;|"[^"]*?")/g,
						'<span class="xml-attr">$1</span>$2<span class="xml-val">$3</span>'
					);
					return `<span class="xml-bracket">${open}</span><span class="xml-tag">${tag}</span>${attrsHl}<span class="xml-bracket">${close}</span>`;
				}
			);
	}

	const xmlLineCount = $derived(activeXmlSource.xml.split('\n').length);
	const xmlGutter = $derived(
		Array.from({ length: xmlLineCount }, (_, i) => i + 1).join('\n')
	);
	const xmlGutterWidth = $derived(`${String(xmlLineCount).length}ch`);
</script>

<div class="page">
	<section class="xml-view">
		{#if xmlSources.length > 1}
			<nav class="xml-subtabs" aria-label="XML source">
				{#each xmlSources as src (src.key)}
					<button
						type="button"
						class="xml-subtab"
						class:xml-subtab-active={src.key === activeXmlKey}
						onclick={() => setXmlSource(src.key)}
						title={src.title}
					>
						<span class="xml-subtab-type">{src.type}</span>
						<span class="xml-subtab-id mono">{src.nativeId}</span>
					</button>
				{/each}
			</nav>
		{/if}
		<header class="xml-toolbar">
			<div class="xml-meta">
				<span class="xml-meta-label">raw XML</span>
				<span class="xml-meta-sep">·</span>
				<span class="mono">{(activeXmlSource.xml.length / 1024).toFixed(1)} KB</span>
				<span class="xml-meta-sep">·</span>
				<span class="mono">{activeXmlSource.xml.split('\n').length.toLocaleString()} lines</span>
			</div>
			<button type="button" class="xml-copy" onclick={copyXml}>
				{xmlCopied ? '✓ copied' : 'copy'}
			</button>
		</header>
		<pre class="xml-pre" style="--gutter-w: {xmlGutterWidth};"><span class="xml-gutter" aria-hidden="true">{xmlGutter}</span><code class="xml-code">{@html highlightXml(activeXmlSource.xml)}</code></pre>
	</section>
</div>

<style>
	.page {
		max-width: 72rem;
		margin: 0 auto;
		padding: 24px 16px 96px;
		font-family: var(--font-mono);
		font-size: 12.5px;
		line-height: 1.55;
		color: #1f2937;
	}
	.mono { font-family: var(--font-mono); }

	.xml-view {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.xml-subtabs {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
		padding: 0 0 4px;
	}
	.xml-subtab {
		display: inline-flex;
		align-items: baseline;
		gap: 6px;
		background: transparent;
		border: 1px solid #e5e7eb;
		border-radius: 999px;
		padding: 3px 10px;
		font-family: var(--font-heading);
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #6b7280;
		cursor: pointer;
		transition: background-color 0.1s ease, border-color 0.1s ease, color 0.1s ease;
	}
	.xml-subtab:hover {
		background: #f3f4f6;
		border-color: #d1d5db;
		color: #1f2937;
	}
	.xml-subtab-active {
		background: #1f2937;
		border-color: #1f2937;
		color: #ffffff;
	}
	.xml-subtab-active:hover {
		background: #1f2937;
		border-color: #1f2937;
		color: #ffffff;
	}
	.xml-subtab-id {
		font-family: var(--font-mono);
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 0;
		text-transform: none;
		color: inherit;
		opacity: 0.85;
	}
	.xml-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 6px 2px 2px;
	}
	.xml-meta {
		display: flex;
		gap: 8px;
		align-items: baseline;
		font-size: 11px;
		color: #6b7280;
	}
	.xml-meta-label {
		font-family: var(--font-heading);
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	.xml-meta-sep {
		color: #d1d5db;
	}
	.xml-copy {
		font-family: var(--font-heading);
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #6b7280;
		background: transparent;
		border: 1px solid #e5e7eb;
		border-radius: 4px;
		padding: 4px 10px;
		cursor: pointer;
		transition: background-color 0.1s ease, border-color 0.1s ease, color 0.1s ease;
	}
	.xml-copy:hover {
		background: #f3f4f6;
		border-color: #d1d5db;
		color: #1f2937;
	}
	.xml-pre {
		margin: 0;
		padding: 16px 0;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		font-family: var(--font-mono);
		font-size: 11.5px;
		line-height: 1.65;
		color: #334155;
		overflow: auto;
		tab-size: 2;
		display: grid;
		grid-template-columns: calc(var(--gutter-w, 4ch) + 28px) 1fr;
	}
	.xml-gutter {
		white-space: pre;
		text-align: right;
		padding: 0 12px 0 14px;
		color: #cbd5e1;
		user-select: none;
		border-right: 1px solid #e5e7eb;
	}
	.xml-code {
		white-space: pre;
		padding: 0 18px 0 14px;
		min-width: 0;
	}
	.xml-pre :global(.xml-bracket) { color: #94a3b8; }
	.xml-pre :global(.xml-tag) { color: #1e40af; }
	.xml-pre :global(.xml-attr) { color: #7c2d92; }
	.xml-pre :global(.xml-val) { color: #166534; }
	.xml-pre :global(.xml-comment) { color: #94a3b8; font-style: italic; }
</style>
