<script lang="ts">
	import { usePortal } from '$lib/stores/portal.svelte.js';
	import type { WorkspaceRole } from '$lib/types';

	let { data, children } = $props();

	const portal = usePortal();

	// Sync current workspace to store
	$effect(() => {
		if (data.workspace) {
			portal.setCurrentWorkspace(data.workspace.id, (data.userRole as WorkspaceRole) || null);
		} else {
			portal.setCurrentWorkspace(null);
		}
	});
</script>

{@render children()}

