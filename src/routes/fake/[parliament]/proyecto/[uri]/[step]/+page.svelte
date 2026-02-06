<script lang="ts">
	import { slide } from 'svelte/transition';
	import LawView from '$lib/components/law/LawView.svelte';
	import DiffView from '$lib/components/diff/DiffView.svelte';
	import { dur } from '$lib/utils/reduced-motion';

	let { data } = $props();

	const changedSet = $derived(new Set(data.changedArticleIds));
	const hasDiffs = $derived(data.diffs.length > 0);
	const hasAccumulatedDiffs = $derived(Object.keys(data.accumulatedDiffs).length > 0);
	const isNewLaw = $derived(data.isNewLaw ?? false);
	const hasLawContent = $derived(data.law.sections.length > 0);

	type ViewMode = 'diff' | 'result' | 'plain';
	let viewMode: ViewMode = $state('diff');

	const versionColorMap: Record<string, string> = {
		act: 'bg-addition-50 text-addition-800',
		bill: 'bg-blue-50 text-blue-800',
		amendment: 'bg-amber-50 text-amber-800'
	};
	const versionColor = $derived(versionColorMap[data.versionType] || 'bg-gray-50 text-gray-800');
</script>

<div class="flex gap-4">
	<!-- Law content -->
	<div class="flex-1 min-w-0 card-layout p-4 sm:p-6">
		<!-- Version badge -->
		<div class="mb-4 pb-3 space-y-2">
			<div class="flex items-center gap-2 flex-wrap">
				<span class="badge {versionColor}">{data.versionLabel}</span>
				<span class="text-xs text-gray-400 font-mono">{data.versionDate}</span>
				{#if data.versionAuthor}
					<span class="text-xs text-gray-400">— {data.versionAuthor}</span>
				{/if}
			</div>
			<div class="flex">
				<div class="flex border border-gray-200 rounded-md overflow-hidden text-xs">
					{#each [
						{ mode: 'diff' as ViewMode, label: 'Cambios', activeClass: 'bg-amber-50 text-amber-700' },
						{ mode: 'result' as ViewMode, label: 'Resultado', activeClass: 'bg-blue-50 text-blue-700' },
						{ mode: 'plain' as ViewMode, label: 'Ley', activeClass: 'bg-gray-100 text-gray-700' }
					] as { mode, label, activeClass }}
						<button
							onclick={() => viewMode = mode}
							disabled={!hasAccumulatedDiffs}
							class="px-3 py-1.5 font-medium transition-colors
								{!hasAccumulatedDiffs
									? 'text-gray-300 cursor-not-allowed'
									: viewMode === mode
										? activeClass
										: 'text-gray-400 hover:bg-gray-50'}"
						>
							{label}
						</button>
					{/each}
				</div>
			</div>
		</div>

		{#if isNewLaw && !hasLawContent}
			<div class="text-center py-12 text-gray-400">
				<p class="text-sm">Este proyecto de ley crea una nueva normativa.</p>
				<p class="text-xs mt-1">No modifica una ley existente.</p>
			</div>
		{:else}
			<LawView
				law={data.law}
				changedArticleIds={viewMode === 'plain' ? new Set() : changedSet}
				accumulatedDiffs={viewMode === 'plain' ? {} : data.accumulatedDiffs}
				cleanView={viewMode === 'result'}
				highlightColor="amber"
			/>
		{/if}
	</div>

	<!-- Diff panel (desktop) -->
	<aside class="hidden lg:block w-[360px] shrink-0">
		<div class="sticky top-20 card-layout max-h-[calc(100vh-6rem)] overflow-y-auto">
			<DiffView diffs={data.diffs} />
		</div>
	</aside>
</div>

<!-- Diff panel (mobile) -->
{#if hasDiffs}
	<div class="lg:hidden mt-4 card-layout" transition:slide={{ duration: dur(300) }}>
		<DiffView diffs={data.diffs} collapsed={true} />
	</div>
{/if}
