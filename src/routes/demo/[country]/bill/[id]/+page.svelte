<script lang="ts">
	import AknTerm from '$lib/bill/AknTerm.svelte';
	import BodyView from '$lib/bill/BodyView.svelte';
	import type { TimelineRow, Modification } from '$lib/bill/parse';

	let { data } = $props();
	const doc = $derived(data.doc);
	const parsed = $derived(data.parsed);
	const amendments = $derived(data.amendments);

	let selectedId = $state<string | null>(null);

	$effect(() => {
		if (!selectedId && parsed.timeline.length) {
			selectedId = parsed.timeline[0].id;
		}
	});

	const selectedRow = $derived<TimelineRow | undefined>(
		parsed.timeline.find((r) => r.id === selectedId)
	);

	const highlightedEids = $derived(
		new Set(
			(selectedRow?.modifications ?? [])
				.filter((m) => m.targetIsLocal)
				.map((m) => m.targetEid)
				.filter((x): x is string => Boolean(x))
		)
	);

	function selectEvent(id: string) {
		selectedId = id;
	}

	function scrollToSpan(eId: string) {
		const target = document.querySelector<HTMLElement>(`[data-eid="${eId}"]`);
		if (!target) return;
		target.scrollIntoView({ behavior: 'smooth', block: 'center' });
		target.classList.add('flash-highlight');
		setTimeout(() => target.classList.remove('flash-highlight'), 1200);
	}

	function rowTooltip(row: TimelineRow): string {
		const parts: string[] = [];
		if (row.origin?.type === 'amendment') {
			parts.push(`This event comes from linked amendment document ${row.origin.nativeId}.`);
		} else if (row.origin?.type === 'debate') {
			parts.push(`This event comes from linked debate document ${row.origin.nativeId}.`);
		} else if (row.origin?.type === 'citation') {
			parts.push(`This event comes from linked citation document ${row.origin.nativeId}.`);
		}
		if (row.lifecycle && row.step) {
			parts.push(
				`This event appears as both a <workflow>/<step> (the procedural fact: who did what) and a <lifecycle>/<eventRef> (the resulting new version of the bill).`
			);
		} else if (row.lifecycle) {
			parts.push(
				`This event comes from <lifecycle>/<eventRef>. It marks a new expression of the bill coming into being.`
			);
		} else if (row.step) {
			parts.push(
				`This is a procedural event from <workflow>/<step>. It records what happened, but did not produce a new version of the bill text.`
			);
		}
		if (row.modifications.length) {
			parts.push(
				`It is referenced by ${row.modifications.length} entrie(s) in <analysis>/<activeModifications> describing the textual changes it produced.`
			);
		}
		return parts.join(' ');
	}

	function kindLabel(k: TimelineRow['kind']): string {
		return k;
	}

	function splitDate(iso: string): { day: string; time: string | null } {
		if (!iso) return { day: '—', time: null };
		const m = iso.match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))/);
		if (m) return { day: m[1], time: m[2] };
		return { day: iso, time: null };
	}

	function wordCount(s: string | undefined): number {
		if (!s) return 0;
		return s.trim().split(/\s+/).filter(Boolean).length;
	}

	function changeDelta(mods: Modification[]): { added: number; removed: number } {
		let added = 0;
		let removed = 0;
		for (const m of mods) {
			if (m.kind === 'insertion') {
				added += wordCount(m.new);
			} else if (m.kind === 'repeal') {
				removed += wordCount(m.old);
			} else if (m.kind === 'substitution') {
				added += wordCount(m.new);
				removed += wordCount(m.old);
			}
		}
		return { added, removed };
	}

	function modKindGlyph(k: Modification['kind']) {
		switch (k) {
			case 'substitution':
				return '⇄';
			case 'insertion':
				return '+';
			case 'repeal':
				return '−';
			default:
				return '?';
		}
	}

	function modKindClass(k: Modification['kind']) {
		switch (k) {
			case 'substitution':
				return 'mod-sub';
			case 'insertion':
				return 'mod-ins';
			case 'repeal':
				return 'mod-rep';
			default:
				return 'mod-unk';
		}
	}

	type Seg =
		| { t: 'openTag'; tag: string; indent: number }
		| { t: 'attr'; name: string; value: string; indent: number }
		| { t: 'closeOpenTag'; selfClose: boolean; indent: number }
		| { t: 'tagLine'; tag: string; indent: number }
		| { t: 'closeLine'; tag: string; indent: number }
		| { t: 'comment'; text: string; indent: number }
		| { t: 'ellipsis'; text: string; indent: number };

	function buildProvenanceSnippet(row: TimelineRow): Seg[] {
		const lines: Seg[] = [];
		const scope = row.origin?.type ?? 'bill';
		const scopeRows = parsed.timeline.filter(
			(r) => (r.origin?.type ?? 'bill') === scope &&
				(r.origin?.nativeId ?? null) === (row.origin?.nativeId ?? null)
		);
		const eventRefSiblings = scopeRows.filter((r) => r.lifecycle && r.id !== row.id).length;
		const stepSiblings = scopeRows.filter((r) => r.step && r.id !== row.id).length;
		const modSiblings = scopeRows.reduce(
			(n, r) => n + (r.id === row.id ? 0 : r.modifications.length),
			0
		);

		if (row.origin) {
			lines.push({
				t: 'comment',
				indent: 0,
				text: `linked from ${row.origin.type} ${row.origin.nativeId}`
			});
		}

		lines.push({ t: 'tagLine', tag: 'lifecycle', indent: 0 });
		if (row.lifecycle) {
			lines.push({ t: 'openTag', tag: 'eventRef', indent: 1 });
			pushAttr(lines, 'date', row.lifecycle.date, 2);
			pushAttr(lines, 'refersTo', row.lifecycle.source, 2);
			pushAttr(lines, 'source', row.lifecycle.tlcEventId, 2);
			pushAttr(lines, 'eId', row.lifecycle.eId, 2);
			pushAttr(lines, 'showAs', row.lifecycle.showAs, 2);
			pushAttr(lines, 'chamber', row.lifecycle.chamber, 2);
			lines.push({ t: 'closeOpenTag', selfClose: true, indent: 1 });
			if (eventRefSiblings > 0) {
				lines.push({
					t: 'ellipsis',
					indent: 1,
					text: `... ${eventRefSiblings} other eventRef${eventRefSiblings === 1 ? '' : 's'}`
				});
			}
		} else {
			lines.push({
				t: 'comment',
				indent: 1,
				text: 'no eventRef referencing this event'
			});
		}
		lines.push({ t: 'closeLine', tag: 'lifecycle', indent: 0 });

		lines.push({ t: 'tagLine', tag: 'workflow', indent: 0 });
		if (row.step) {
			lines.push({ t: 'openTag', tag: 'step', indent: 1 });
			pushAttr(lines, 'date', row.step.date, 2);
			pushAttr(lines, 'refersTo', row.step.refersTo, 2);
			pushAttr(lines, 'source', row.step.source, 2);
			pushAttr(lines, 'by', row.step.agent, 2);
			pushAttr(lines, 'as', row.step.role, 2);
			pushAttr(lines, 'outcome', row.step.outcome, 2);
			pushAttr(lines, 'showAs', row.step.showAs, 2);
			lines.push({ t: 'closeOpenTag', selfClose: true, indent: 1 });
			if (stepSiblings > 0) {
				lines.push({
					t: 'ellipsis',
					indent: 1,
					text: `... ${stepSiblings} other step${stepSiblings === 1 ? '' : 's'}`
				});
			}
		} else {
			lines.push({
				t: 'comment',
				indent: 1,
				text: 'no step referencing this event'
			});
		}
		lines.push({ t: 'closeLine', tag: 'workflow', indent: 0 });

		lines.push({ t: 'tagLine', tag: 'analysis', indent: 0 });
		if (row.modifications.length) {
			lines.push({ t: 'tagLine', tag: 'activeModifications', indent: 1 });
			lines.push({
				t: 'comment',
				indent: 2,
				text: `${row.modifications.length} change${row.modifications.length === 1 ? '' : 's'} for this event — shown above`
			});
			if (modSiblings > 0) {
				lines.push({
					t: 'ellipsis',
					indent: 2,
					text: `... ${modSiblings} other change${modSiblings === 1 ? '' : 's'} on other events`
				});
			}
			lines.push({ t: 'closeLine', tag: 'activeModifications', indent: 1 });
		} else {
			lines.push({
				t: 'comment',
				indent: 1,
				text: 'no activeModifications referencing this event'
			});
		}
		lines.push({ t: 'closeLine', tag: 'analysis', indent: 0 });

		return lines;
	}

	function pushAttr(lines: Seg[], name: string, value: string | undefined, indent: number) {
		if (value === undefined || value === '') {
			lines.push({ t: 'comment', indent, text: `${name}: not set` });
		} else {
			lines.push({ t: 'attr', name, value, indent });
		}
	}

	function indentStr(n: number): string {
		return '  '.repeat(n);
	}

	const provenanceSnippet = $derived(selectedRow ? buildProvenanceSnippet(selectedRow) : []);
</script>

<div class="page">
	{#if parsed.warnings.length}
		<div class="warnings">
			{#each parsed.warnings as w (w)}
				<div class="warn-card">⚠ {w}</div>
			{/each}
		</div>
	{/if}

	<div class="cols">
		<aside class="timeline">
			<h2 class="eyebrow">Timeline</h2>
			<p class="hint">
				One row per event, joined across <AknTerm term="lifecycle" />,
				<AknTerm term="workflow" /> and <AknTerm term="analysis" /> via shared
				<AknTerm term="TLCEvent" /> ids.
			</p>

			{#if parsed.timeline.length}
				<ol class="spine">
					{#each parsed.timeline as row (row.id)}
						{@const selected = row.id === selectedId}
						{@const d = splitDate(row.date)}
						{@const delta = changeDelta(row.modifications)}
						<li class="row k-{row.kind}" class:selected>
							<button
								type="button"
								onclick={() => selectEvent(row.id)}
								title={`${row.label}${row.chamber ? ` · ${row.chamber}` : ''}\n\n${rowTooltip(row)}`}
							>
								<span class="content">
									<span class="row-head">
										<span class="date mono">{d.day}</span>
										{#if d.time}<span class="time mono">{d.time}</span>{/if}
										<span class="kind-tag">{kindLabel(row.kind)}</span>
									</span>
									<span class="label">{row.label}</span>
									{#if row.chamber || row.origin || row.modifications.length || row.warnings.length}
										<span class="meta">
											{#if row.chamber}<span class="meta-item chamber">{row.chamber}</span>{/if}
											{#if row.origin?.type && row.origin.type !== 'bill'}
												<span class="meta-item from">from {row.origin.type}</span>
											{/if}
											{#if row.modifications.length}
												<span class="meta-item delta" title="{row.modifications.length} change{row.modifications.length === 1 ? '' : 's'} · +{delta.added} / −{delta.removed} words">
													{#if delta.added || delta.removed}
														{#if delta.added}<span class="d-add">+{delta.added}</span>{/if}
														{#if delta.removed}<span class="d-rem">−{delta.removed}</span>{/if}
														<span class="d-unit">words</span>
													{:else}
														<span class="d-unit">{row.modifications.length} change{row.modifications.length === 1 ? '' : 's'}</span>
													{/if}
												</span>
											{/if}
											{#if row.warnings.length}
												<span class="meta-item warn" title={row.warnings.join('\n')}>⚠</span>
											{/if}
										</span>
									{/if}
								</span>
							</button>
						</li>
					{/each}
				</ol>
			{:else}
				<p class="empty">No events found in this bill.</p>
			{/if}
		</aside>

		<section class="detail">
			{#if selectedRow}
				<h2 class="eyebrow">Event detail</h2>

				{@const showAmendments =
					amendments.length &&
					(selectedRow.kind === 'amendment' ||
						selectedRow.lifecycle?.type === 'committee_report' ||
						selectedRow.lifecycle?.type === 'ponencia_report')}

				<div class="event">
					<div class="event-head">
						<span class="mono ink">{selectedRow.date || '—'}</span>
						{#if selectedRow.chamber}
							<span class="event-head-sep">·</span>
							<span class="muted">{selectedRow.chamber}</span>
						{/if}
						<span class="event-head-spacer"></span>
						{#if selectedRow.origin}
							<a
								class="src-badge src-linked"
								href="/demo/{doc.countryCode}/{selectedRow.origin.type}/{selectedRow.origin.nativeId}"
								title={selectedRow.origin.title ?? ''}
							>
								linked → <span class="mono">{selectedRow.origin.nativeId}</span>
							</a>
						{:else}
							<span class="src-badge src-internal">internal</span>
						{/if}
					</div>
					<div class="event-label">{selectedRow.label}</div>

						{#if selectedRow.modifications.length}
							<ul class="mods">
								{#each selectedRow.modifications as m, i (i)}
									<li class="mod-row {modKindClass(m.kind)}">
										<span class="mod-glyph" aria-hidden="true">{modKindGlyph(m.kind)}</span>
										<span class="mod-kind">{m.kind}</span>
										{#if m.targetEid}
											{@const external = !!m.targetHref && !m.targetHref.startsWith('#') && !m.targetIsLocal}
											<button
												type="button"
												class="eid-pill"
												class:eid-pill-external={external}
												disabled={!m.targetIsLocal}
												onclick={() => m.targetEid && m.targetIsLocal && scrollToSpan(m.targetEid)}
												title={m.targetIsLocal
													? 'scroll to span in body view'
													: (m.targetHref ?? 'target is in another document')}
											>
												{#if external}<span class="ext-glyph" aria-hidden="true">↗</span>{/if}
												<span class="ink">{m.targetEid}</span>
											</button>
										{/if}
										{#if m.old || m.new}
											<div class="diff">
												{#if m.old}<div class="diff-old">{m.old}</div>{/if}
												{#if m.new}<div class="diff-new">{m.new}</div>{/if}
											</div>
										{/if}
									</li>
								{/each}
							</ul>
						{/if}

						{#if showAmendments}
							<div class="linked-inline">
								<div class="linked-inline-head">
									linked <AknTerm term="amendment" /> documents
								</div>
								<ul class="amend-list">
									{#each amendments as a (a.nativeId)}
										<li>
											<a href="/demo/{a.country}/{a.type}/{a.nativeId}">
												<span class="mono ink">{a.nativeId}</span>
												<span class="amend-sep">—</span>
												<span>{a.title}</span>
											</a>
										</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if selectedRow.warnings.length}
							<div class="row-warnings">
								{#each selectedRow.warnings as w (w)}
									<div class="warn-card">⚠ {w}</div>
								{/each}
							</div>
						{/if}

						<details class="provenance">
							<summary>
								<span class="prov-caret" aria-hidden="true">▸</span>
								<span class="prov-label">source</span>
							</summary>

							<pre class="prov-xml"><code>{#each provenanceSnippet as seg, i (i)}{#if seg.t === 'tagLine'}{indentStr(seg.indent)}<span class="xml-bracket">{'<'}</span><span class="xml-tag">{seg.tag}</span><span class="xml-bracket">{'>'}</span>
{:else if seg.t === 'closeLine'}{indentStr(seg.indent)}<span class="xml-bracket">{'</'}</span><span class="xml-tag">{seg.tag}</span><span class="xml-bracket">{'>'}</span>
{:else if seg.t === 'openTag'}{indentStr(seg.indent)}<span class="xml-bracket">{'<'}</span><span class="xml-tag">{seg.tag}</span>
{:else if seg.t === 'closeOpenTag'}{indentStr(seg.indent)}<span class="xml-bracket">{seg.selfClose ? '/>' : '>'}</span>
{:else if seg.t === 'attr'}{indentStr(seg.indent)}<span class="xml-attr">{seg.name}</span><span class="xml-bracket">=</span><span class="xml-val">{'"' + seg.value + '"'}</span>
{:else if seg.t === 'comment'}{indentStr(seg.indent)}<span class="prov-comment">{'<!-- ' + seg.text + ' -->'}</span>
{:else if seg.t === 'ellipsis'}{indentStr(seg.indent)}<span class="prov-ellipsis">{seg.text}</span>
{/if}{/each}</code></pre>
					</details>
				</div>
			{:else}
				<p class="empty">Select an event from the timeline.</p>
			{/if}

			{#if parsed.body.length}
				<div class="body-tree">
					<BodyView nodes={parsed.body} {highlightedEids} />
				</div>
			{:else}
				<p class="empty">This bill has no &lt;body&gt; content recorded.</p>
			{/if}
		</section>
	</div>
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

	.warnings {
		margin-bottom: 14px;
	}
	.warn-card {
		background: #fffbeb;
		border: 1px solid #fcd34d;
		color: #78350f;
		padding: 6px 10px;
		font-family: var(--font-mono);
		font-size: 11px;
		border-radius: 4px;
		margin-top: 6px;
	}

	.cols {
		display: grid;
		grid-template-columns: 260px 1fr;
		gap: 28px;
		align-items: start;
	}

	.eyebrow {
		font-family: var(--font-heading);
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: #4b5563;
		margin: 0 0 8px;
	}
	.hint {
		font-size: 11px;
		color: #6b7280;
		margin: 0 0 14px;
		line-height: 1.55;
		max-width: 60ch;
	}

	.timeline {
		position: sticky;
		top: 96px;
	}
	.spine {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.row + .row {
		margin-top: 0;
	}
	.row button {
		display: block;
		width: 100%;
		text-align: left;
		background: none;
		border: none;
		padding: 8px 8px 10px 8px;
		cursor: pointer;
		font-family: inherit;
		font-size: inherit;
		color: inherit;
		position: relative;
		transition: background-color 0.1s ease;
	}
	.row button:hover {
		background: #f9fafb;
	}
	.row button:focus-visible {
		outline: 2px solid var(--color-brand);
		outline-offset: -2px;
		border-radius: 2px;
	}
	.row.selected button {
		background: #f1f5f9;
	}

	.content {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}
	.row-head {
		display: flex;
		gap: 8px;
		align-items: baseline;
		font-size: 10.5px;
		color: #64748b;
		flex-wrap: wrap;
	}
	.date {
		color: #475569;
		font-size: 10.5px;
		letter-spacing: 0;
		line-height: 1.4;
	}
	.time {
		color: #94a3b8;
		font-size: 10px;
	}
	.kind-tag {
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: 10px;
		font-weight: 400;
		text-transform: lowercase;
		letter-spacing: 0;
		color: #cbd5e1;
	}
	.row.selected .kind-tag {
		color: #94a3b8;
	}
	.label {
		font-family: var(--font-heading);
		font-size: 12px;
		line-height: 1.4;
		color: #1f2937;
		word-break: normal;
		overflow-wrap: anywhere;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.row.selected .label {
		color: #0a0f1c;
	}
	.meta {
		display: flex;
		gap: 4px 8px;
		align-items: center;
		flex-wrap: wrap;
		font-family: var(--font-heading);
		font-size: 9px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #94a3b8;
	}
	.meta-item {
		display: inline-flex;
		align-items: center;
	}
	.meta-item + .meta-item::before {
		content: '·';
		margin-right: 8px;
		color: #cbd5e1;
		font-weight: 400;
	}
	.meta-item.warn {
		color: var(--color-deletion-800);
		font-size: 11px;
		text-transform: none;
	}
	.meta-item.delta {
		gap: 3px;
		white-space: nowrap;
	}
	.d-add,
	.d-rem,
	.d-unit {
		font-family: inherit;
		font-size: inherit;
		font-weight: inherit;
		letter-spacing: inherit;
		text-transform: inherit;
	}
	.d-add { color: var(--color-addition-800, #166534); }
	.d-rem { color: var(--color-deletion-800, #991b1b); }
	.d-unit { color: inherit; }
	.row.selected .meta {
		color: #64748b;
	}

	.event {
		margin-bottom: 16px;
	}
	.event-head {
		display: flex;
		gap: 8px;
		align-items: center;
		font-size: 11px;
		color: #4b5563;
		margin-bottom: 10px;
	}
	.event-head-sep {
		color: #d1d5db;
	}
	.event-head-spacer {
		flex: 1;
	}

	.src-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-family: var(--font-heading);
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		padding: 3px 8px;
		border-radius: 3px;
		border: 1px solid transparent;
		text-decoration: none;
	}
	.src-internal {
		background: #f3f4f6;
		color: #4b5563;
		border-color: #e5e7eb;
	}
	.src-linked {
		background: #fef3c7;
		color: #92400e;
		border-color: #fde68a;
		cursor: pointer;
	}
	.src-linked:hover {
		background: #fde68a;
	}
	.src-linked .mono {
		text-transform: none;
		letter-spacing: 0;
		font-weight: 500;
	}

	.provenance {
		margin-top: 18px;
		border-top: 1px dotted #e5e7eb;
		padding-top: 12px;
	}
	.provenance > summary {
		list-style: none;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-family: var(--font-mono);
		font-size: 11px;
		color: #9ca3af;
		user-select: none;
	}
	.provenance > summary::-webkit-details-marker { display: none; }
	.provenance > summary:hover { color: #4b5563; }
	.prov-caret {
		display: inline-block;
		transition: transform 0.12s ease;
		font-size: 10px;
	}
	.provenance[open] > summary .prov-caret {
		transform: rotate(90deg);
	}
	.prov-xml {
		margin: 12px 0 0;
		padding: 12px 14px;
		background: #f8fafc;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		font-family: var(--font-mono);
		font-size: 11.5px;
		line-height: 1.6;
		color: #1f2937;
		white-space: pre-wrap;
		word-break: break-word;
		overflow-wrap: anywhere;
	}
	.prov-xml :global(.xml-bracket) { color: #94a3b8; }
	.prov-xml :global(.xml-tag) { color: #1e40af; }
	.prov-xml :global(.xml-attr) { color: #7c2d92; }
	.prov-xml :global(.xml-val) { color: #166534; }
	.prov-xml :global(.prov-comment) { color: #94a3b8; font-style: italic; }
	.prov-xml :global(.prov-ellipsis) { color: #94a3b8; }

	.linked-inline {
		margin-top: 16px;
		padding-top: 12px;
		border-top: 1px dotted #e5e7eb;
	}
	.linked-inline-head {
		font-family: var(--font-heading);
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #6b7280;
		margin-bottom: 8px;
	}
	.event-label {
		font-family: var(--font-mono);
		font-size: 14px;
		font-weight: 500;
		color: #0a0f1c;
		margin-bottom: 16px;
		line-height: 1.4;
	}

	.mods {
		list-style: none;
		padding: 0;
		margin: 0 0 4px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.mod-row {
		display: grid;
		grid-template-columns: 22px max-content 1fr;
		column-gap: 8px;
		row-gap: 6px;
		align-items: center;
		padding: 8px 10px 8px 8px;
		background: #ffffff;
		border: 1px solid #e5e7eb;
		border-left: 3px solid #9ca3af;
		border-radius: 4px;
		font-size: 11.5px;
	}
	.mod-row.mod-sub { border-left-color: #d97706; }
	.mod-row.mod-ins { border-left-color: var(--color-addition-500); }
	.mod-row.mod-rep { border-left-color: var(--color-deletion-500); }
	.mod-glyph {
		font-family: var(--font-mono);
		font-size: 14px;
		text-align: center;
		font-weight: 700;
		color: #4b5563;
	}
	.mod-row.mod-sub .mod-glyph { color: #d97706; }
	.mod-row.mod-ins .mod-glyph { color: var(--color-addition-500); }
	.mod-row.mod-rep .mod-glyph { color: var(--color-deletion-500); }
	.mod-kind {
		font-weight: 600;
		font-family: var(--font-heading);
		font-size: 11px;
		color: #1f2937;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.eid-pill {
		background: #f3f4f6;
		border: 1px solid #d1d5db;
		padding: 1px 6px;
		border-radius: 3px;
		font-family: var(--font-mono);
		font-size: 10.5px;
		color: #4b5563;
		cursor: pointer;
		transition: all 0.1s ease;
		justify-self: start;
	}
	.eid-pill:hover {
		background: var(--color-brand);
		border-color: var(--color-brand-dark);
		color: var(--color-brand-dark);
	}
	.eid-pill:disabled {
		cursor: default;
		border-style: dashed;
		opacity: 0.85;
	}
	.eid-pill:disabled:hover {
		background: #f3f4f6;
		border-color: #d1d5db;
		color: #4b5563;
	}
	.eid-pill .ink {
		color: #0a0f1c;
	}
	.eid-pill-external {
		background: #fff7ed;
		border-color: #fed7aa;
		border-style: dashed;
	}
	.eid-pill-external .ext-glyph {
		color: #c2410c;
		font-weight: 700;
		margin-right: 2px;
	}
	.eid-pill-external:disabled:hover {
		background: #fff7ed;
		border-color: #fed7aa;
	}
	.diff {
		grid-column: 1 / -1;
		font-family: var(--font-mono);
		font-size: 11px;
		line-height: 1.55;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.diff-old {
		color: var(--color-deletion-800);
		background: var(--color-deletion-50);
		border-left: 2px solid var(--color-deletion-500);
		padding: 4px 8px;
		border-radius: 0 3px 3px 0;
	}
	.diff-new {
		color: var(--color-addition-800);
		background: var(--color-addition-50);
		border-left: 2px solid var(--color-addition-500);
		padding: 4px 8px;
		border-radius: 0 3px 3px 0;
	}

	.amend-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.amend-list li {
		padding: 6px 0;
		border-bottom: 1px dotted #e5e7eb;
		font-size: 11.5px;
	}
	.amend-list li:last-child {
		border-bottom: none;
	}
	.amend-list a {
		color: var(--color-brand-dark);
		text-decoration: none;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		font-family: inherit;
		font-size: inherit;
		text-align: left;
		display: inline-flex;
		gap: 6px;
		align-items: baseline;
		flex-wrap: wrap;
	}
	.amend-list a:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.amend-sep {
		color: #d1d5db;
	}

	.body-tree {
		margin-top: 28px;
		padding-top: 24px;
		border-top: 1px solid #e5e7eb;
	}

	.muted { color: #6b7280; }
	.mono { font-family: var(--font-mono); }
	.ink { color: var(--color-brand-dark); }
	.empty {
		font-size: 12px;
		color: #9ca3af;
		font-style: italic;
		padding: 8px 0;
	}
	.row-warnings {
		margin-top: 14px;
	}

	@media (max-width: 900px) {
		.cols {
			grid-template-columns: 1fr;
		}
		.timeline {
			position: static;
		}
		.page {
			padding: 16px 16px 64px;
		}
	}
</style>
