<script lang="ts">
	import { page } from '$app/state';

	let { data, children } = $props();

	const activeSlug = $derived(page.params.slug || '');

	const aknppDocs = $derived(data.docs.filter((d: any) => d.section === 'aknpp'));
	const aknDocs = $derived(data.docs.filter((d: any) => d.section === 'akn'));
</script>

<div class="max-w-7xl mx-auto px-4 py-4">
	<!-- Breadcrumbs -->
	<nav class="text-xs font-mono text-gray-400 mb-4 flex items-center gap-1.5">
		<a href="/" class="hover:text-gray-600 transition-colors">Inicio</a>
		<svg class="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
		<span class="text-gray-700 font-medium">Docs</span>
	</nav>

	<div class="flex gap-6">
		<!-- Sidebar navigation -->
		<aside class="hidden lg:block w-56 shrink-0">
			<div class="sticky top-20 space-y-3">
				<!-- AKN++ section -->
				<div class="rounded-[10px] border border-addition-200 bg-addition-50 p-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
					<h3 class="text-xs font-bold font-mono uppercase tracking-wider text-addition-800 px-2 py-1 mb-1">
						AKN++
					</h3>
					<ul class="space-y-0.5">
						{#each aknppDocs as doc (doc.slug)}
							<li>
								<a
									href="/docs/{doc.slug}"
									class="block px-2 py-1.5 text-sm rounded-md transition-colors
										{activeSlug === doc.slug
											? 'bg-addition-200/60 text-addition-800 font-medium'
											: 'text-addition-800/70 hover:text-addition-800 hover:bg-addition-100'}"
								>
									{doc.title}
								</a>
							</li>
						{/each}
					</ul>
				</div>

				<!-- AKN section -->
				<div class="card-layout p-3">
					<h3 class="text-xs font-bold font-mono uppercase tracking-wider text-gray-500 px-2 py-1 mb-1">
						Akoma Ntoso
					</h3>
					<ul class="space-y-0.5">
						{#each aknDocs as doc (doc.slug)}
							<li>
								<a
									href="/docs/{doc.slug}"
									class="block px-2 py-1.5 text-sm rounded-md transition-colors
										{activeSlug === doc.slug
											? 'bg-gray-100 text-gray-900 font-medium'
											: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
								>
									{doc.title}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</aside>

		<!-- Mobile nav -->
		<div class="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] p-2 z-10 overflow-x-auto">
			<div class="flex gap-1.5 px-2">
				{#each data.docs as doc (doc.slug)}
					<a
						href="/docs/{doc.slug}"
						class="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap
							{activeSlug === doc.slug
								? (doc.section === 'aknpp' ? 'bg-addition-50 text-addition-800' : 'bg-gray-100 text-gray-800')
								: 'text-gray-500 hover:bg-gray-50'}"
					>
						{doc.title}
					</a>
				{/each}
			</div>
		</div>

		<!-- Content -->
		<div class="flex-1 min-w-0 pb-16 lg:pb-0">
			{@render children()}
		</div>
	</div>
</div>
