<script lang="ts">
	import { usePortal } from '$lib/stores/portal.svelte.js';

	let { data, children } = $props();

	const portal = usePortal();

	// Sync current project to store
	$effect(() => {
		if (data.project) {
			portal.setCurrentProject(data.project.id);
		} else {
			portal.setCurrentProject(null);
		}
	});
</script>

{@render children()}

