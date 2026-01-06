<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { setLastWorkspace } from '$lib/utils/redirect.js';

	let { data, children } = $props();

	// Store last workspace when navigating to a workspace
	$effect(() => {
		const path = $page.url.pathname;
		const workspaceMatch = path.match(/^\/w\/([^/]+)/);
		if (workspaceMatch) {
			setLastWorkspace(workspaceMatch[1]);
		}
	});
</script>

<div class="min-h-screen">
	{@render children()}
</div>

