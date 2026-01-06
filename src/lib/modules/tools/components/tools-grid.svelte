<script lang="ts">
	import type { ToolWithActivation } from '$lib/types';
	import ToolCard from './tool-card.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';

	let {
		tools,
		workspaceId,
		projectId,
		loading = false,
		onToolActivated,
		onToolDeactivated,
	}: {
		tools: ToolWithActivation[];
		workspaceId: string;
		projectId: string;
		loading?: boolean;
		onToolActivated?: () => void;
		onToolDeactivated?: () => void;
	} = $props();
</script>

{#if loading}
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each Array(6) as _}
			<div class="p-5 space-y-4 flex flex-col bg-white border border-gray-200 rounded-xl dark:bg-neutral-800 dark:border-neutral-700">
				<Skeleton class="h-9.5 w-9.5 rounded-lg" />
				<Skeleton class="h-6 w-3/4" />
				<Skeleton class="h-4 w-full" />
				<Skeleton class="h-10 w-full" />
			</div>
		{/each}
	</div>
{:else if tools.length === 0}
	<div class="text-center py-12">
		<p class="text-gray-500 dark:text-neutral-500">No tools available</p>
	</div>
{:else}
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each tools as tool (tool.id)}
			<ToolCard
				{tool}
				{workspaceId}
				{projectId}
				onActivated={onToolActivated}
				onDeactivated={onToolDeactivated}
			/>
		{/each}
	</div>
{/if}

