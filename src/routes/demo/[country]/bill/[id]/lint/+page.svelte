<script lang="ts">
	let { data } = $props();
	const lint = $derived(data.lint);

	const completenessPct = $derived(Math.round(lint.completeness * 100));
	const errorCount = $derived(lint.findings.filter((f) => f.severity === 'error').length);
	const warnCount = $derived(lint.findings.filter((f) => f.severity === 'warn').length);
	const infoCount = $derived(lint.findings.filter((f) => f.severity === 'info').length);

	function scoreClass(pct: number) {
		if (pct >= 90) return 'score-good';
		if (pct >= 70) return 'score-mid';
		return 'score-low';
	}

	function statusGlyph(status: string) {
		if (status === 'ok') return '✓';
		if (status === 'optional-missing') return '◦';
		if (status === 'invalid') return '✗';
		return '·';
	}
</script>

<div class="page">
	<section class="lint-view">
		<header class="lint-summary card">
			<div class="lint-summary-main">
				<div class="lint-score-block">
					<span class="lint-score-num {scoreClass(completenessPct)}">{completenessPct}<span class="pct">%</span></span>
					<span class="lint-score-label">completeness</span>
				</div>
				<dl class="lint-counts">
					<div><dt>errors</dt><dd class="cnt-err">{errorCount}</dd></div>
					<div><dt>warnings</dt><dd class="cnt-warn">{warnCount}</dd></div>
					<div><dt>notes</dt><dd class="cnt-info">{infoCount}</dd></div>
				</dl>
			</div>
			<p class="hint lint-hint">
				Each facet is a slice of the document scored against an
				expectation profile (<code>research/schema/profiles/{lint.docType}.ts</code>).
				Optional fields show as notes; their absence does not lower the score.
			</p>
		</header>

		<div class="facets">
			{#each lint.facets as facet (facet.id)}
				{@const pct = Math.round(facet.score * 100)}
				<article class="facet card">
					<header class="facet-head">
						<div class="facet-title">
							<h3>{facet.label}</h3>
							<span class="facet-score {scoreClass(pct)}">{pct}%</span>
							<span class="facet-meta">{facet.earned}/{facet.total} weighted</span>
						</div>
						<p class="facet-rationale">{facet.rationale}</p>
					</header>

					<div class="facet-body">
						<table class="exp-table">
							<thead>
								<tr>
									<th class="th-status"></th>
									<th>Expectation</th>
									<th class="th-xpath">XPath</th>
									<th class="th-w">w</th>
									<th class="th-count">matches</th>
								</tr>
							</thead>
							<tbody>
								{#each facet.expectations as exp (exp.id)}
									<tr class="exp-row exp-{exp.status}">
										<td class="exp-status" title={exp.status}>
											<span class="status-glyph">{statusGlyph(exp.status)}</span>
										</td>
										<td class="exp-id">
											<span class="mono">{exp.id}</span>
											{#if exp.kind !== 'presence'}
												<span class="exp-kind">{exp.kind}</span>
											{/if}
										</td>
										<td class="exp-xpath mono">{exp.xpath}</td>
										<td class="exp-w mono">{exp.weight}</td>
										<td class="exp-count mono">
											{exp.matchCount}{#if exp.value && exp.kind === 'enum'} <span class="exp-val">→ {exp.value}</span>{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>

						{#if facet.findings.length}
							<ul class="findings">
								{#each facet.findings as f, i (i)}
									<li class="finding sev-{f.severity}">
										<div class="finding-head">
											<span class="finding-sev">{f.severity}</span>
											<span class="finding-id mono">{f.expectation}</span>
										</div>
										<div class="finding-msg">{f.message}</div>
										<div class="finding-rationale">{f.rationale}</div>
										<code class="finding-xpath">{f.xpath}</code>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</article>
			{/each}
		</div>
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
	.hint {
		font-size: 11px;
		color: #6b7280;
		margin: 0 0 14px;
		line-height: 1.55;
		max-width: 60ch;
	}
	.mono { font-family: var(--font-mono); }

	.lint-view {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.lint-summary {
		padding: 16px 22px 14px;
	}
	.lint-summary-main {
		display: flex;
		align-items: center;
		gap: 32px;
		flex-wrap: wrap;
	}
	.lint-score-block {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}
	.lint-score-num {
		font-family: var(--font-heading);
		font-size: 38px;
		font-weight: 700;
		line-height: 1;
		padding: 4px 10px;
		border-radius: 6px;
	}
	.lint-score-num .pct {
		font-size: 18px;
		opacity: 0.7;
		margin-left: 2px;
	}
	.lint-score-label {
		font-family: var(--font-heading);
		font-size: 9.5px;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: #6b7280;
		margin-top: 6px;
	}
	.lint-counts {
		display: flex;
		gap: 22px;
		margin: 0;
	}
	.lint-counts > div {
		display: flex;
		flex-direction: column;
	}
	.lint-counts dt {
		font-family: var(--font-heading);
		font-size: 9.5px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #6b7280;
	}
	.lint-counts dd {
		margin: 4px 0 0;
		font-family: var(--font-mono);
		font-size: 22px;
		font-weight: 600;
	}
	.cnt-err { color: var(--color-deletion-800); }
	.cnt-warn { color: #92400e; }
	.cnt-info { color: #4b5563; }
	.lint-hint {
		margin-top: 14px;
		max-width: 80ch;
	}
	.lint-hint code {
		background: #f3f4f6;
		padding: 1px 5px;
		border-radius: 3px;
		font-size: 10.5px;
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

	.facets {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.facet {
		padding: 0;
		overflow: hidden;
	}
	.facet-head {
		padding: 14px 18px 12px;
		border-bottom: 1px solid #e5e7eb;
		background: #f9fafb;
	}
	.facet-title {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}
	.facet-title h3 {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 14px;
		font-weight: 600;
		color: #0a0f1c;
	}
	.facet-score {
		font-family: var(--font-mono);
		font-size: 11px;
		padding: 1px 7px;
		border-radius: 3px;
	}
	.facet-meta {
		font-family: var(--font-mono);
		font-size: 10.5px;
		color: #6b7280;
	}
	.facet-rationale {
		margin: 8px 0 0;
		font-size: 11.5px;
		color: #4b5563;
		line-height: 1.55;
		max-width: 80ch;
	}
	.facet-body {
		padding: 12px 16px 16px;
	}

	.exp-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 11px;
	}
	.exp-table th {
		text-align: left;
		font-family: var(--font-heading);
		font-size: 9.5px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #6b7280;
		font-weight: 600;
		padding: 4px 8px 6px;
		border-bottom: 1px solid #e5e7eb;
	}
	.exp-table td {
		padding: 5px 8px;
		border-bottom: 1px dotted #e5e7eb;
		vertical-align: top;
	}
	.th-status { width: 22px; }
	.th-w { width: 36px; text-align: right; }
	.th-count { width: 110px; }
	.th-xpath { width: 38%; }
	.exp-status {
		text-align: center;
		font-family: var(--font-mono);
		font-size: 13px;
		font-weight: 700;
	}
	.exp-ok .status-glyph { color: var(--color-addition-500); }
	.exp-missing .status-glyph { color: var(--color-deletion-500); }
	.exp-invalid .status-glyph { color: var(--color-deletion-500); }
	.exp-optional-missing .status-glyph { color: #9ca3af; }
	.exp-row.exp-missing { background: var(--color-deletion-50); }
	.exp-row.exp-invalid { background: var(--color-deletion-50); }
	.exp-row.exp-optional-missing { color: #6b7280; }
	.exp-id .mono {
		font-family: var(--font-mono);
		font-size: 11px;
		color: #1f2937;
	}
	.exp-kind {
		display: inline-block;
		font-family: var(--font-heading);
		font-size: 9px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #6b7280;
		padding: 0 4px;
		margin-left: 4px;
		background: #f3f4f6;
		border-radius: 2px;
	}
	.exp-xpath {
		font-size: 10.5px;
		color: #4b5563;
		word-break: break-all;
	}
	.exp-w {
		text-align: right;
		color: #6b7280;
	}
	.exp-count {
		font-size: 11px;
	}
	.exp-val {
		color: #4b5563;
	}

	.findings {
		list-style: none;
		padding: 0;
		margin: 14px 0 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.finding {
		padding: 10px 12px;
		border: 1px solid #e5e7eb;
		border-left-width: 3px;
		border-radius: 4px;
		background: #ffffff;
	}
	.finding.sev-error {
		border-left-color: var(--color-deletion-500);
		background: var(--color-deletion-50);
	}
	.finding.sev-warn {
		border-left-color: #fbbf24;
		background: #fffbeb;
	}
	.finding.sev-info {
		border-left-color: #9ca3af;
		background: #f9fafb;
	}
	.finding-head {
		display: flex;
		gap: 8px;
		align-items: baseline;
		margin-bottom: 4px;
	}
	.finding-sev {
		font-family: var(--font-heading);
		font-size: 9px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #6b7280;
	}
	.finding.sev-error .finding-sev { color: var(--color-deletion-800); }
	.finding.sev-warn .finding-sev { color: #92400e; }
	.finding-id {
		font-size: 11px;
		color: #1f2937;
	}
	.finding-msg {
		font-size: 12px;
		color: #1f2937;
		margin-bottom: 4px;
	}
	.finding-rationale {
		font-size: 11px;
		color: #4b5563;
		line-height: 1.55;
		margin-bottom: 6px;
	}
	.finding-xpath {
		display: inline-block;
		font-family: var(--font-mono);
		font-size: 10.5px;
		color: #6b7280;
		background: #f3f4f6;
		padding: 1px 5px;
		border-radius: 3px;
	}
</style>
