<script lang="ts">
	import type { AppPageData } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { WorkspaceCreateDialog, WorkspaceCard, WorkspaceEmptyState } from '$lib/modules/workspace';
	import { usePortal } from '$lib/stores/portal.svelte.js';

	let { data }: { data: AppPageData } = $props();

	const portal = usePortal();

	// Workspaces are already synced from parent layout via `me` payload
	// Just read from stores - no need to sync again
	const workspaces = $derived(portal.workspaces);

	let dialogOpen = $state(false);
</script>

<div class="container mx-auto py-8 px-4 max-w-6xl">
	{#if workspaces.length === 0}
		<WorkspaceEmptyState />
	{:else}
		<div>
			<div class="mb-8 flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold mb-2">Select Workspace</h1>
					<p class="text-muted-foreground">Choose a workspace to continue</p>
				</div>
				<Button onclick={() => (dialogOpen = true)}>Create Workspace</Button>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each workspaces as workspace}
					<WorkspaceCard {workspace} />
				{/each}
			</div>
		</div>
	{/if}
</div>

<WorkspaceCreateDialog bind:open={dialogOpen} />
