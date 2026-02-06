<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	// Redirect to the "original" version
	$effect(() => {
		const basePath = `/fake/${data.meta.id}/proyecto/${encodeURIComponent(data.billUri)}`;
		goto(`${basePath}/original`, { replaceState: true });
	});
</script>

<div class="flex items-center justify-center py-20">
	<p class="text-sm text-gray-400">Cargando...</p>
</div>
