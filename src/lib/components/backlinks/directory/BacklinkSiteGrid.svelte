<script lang="ts">
	import type { BacklinkSiteWithSubmission } from '$lib/types';
	import BacklinkSiteCard from './BacklinkSiteCard.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Empty from '$lib/components/ui/empty/index.js';

	let {
		sites,
		loading = false,
		onViewDetails,
		onAddToProject,
	}: {
		sites: BacklinkSiteWithSubmission[];
		loading?: boolean;
		onViewDetails?: (site: BacklinkSiteWithSubmission) => void;
		onAddToProject?: (site: BacklinkSiteWithSubmission) => void;
	} = $props();
</script>

{#if loading}
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
		{#each Array(8) as _}
			<div class="border rounded-lg p-4 space-y-3">
				<Skeleton class="h-6 w-3/4" />
				<Skeleton class="h-4 w-full" />
				<Skeleton class="h-4 w-2/3" />
				<div class="flex gap-2">
					<Skeleton class="h-6 w-16" />
					<Skeleton class="h-6 w-16" />
				</div>
			</div>
		{/each}
	</div>
{:else if sites.length === 0}
	<Empty.Root>
		<Empty.Header>
			<Empty.Title>No backlink sites found</Empty.Title>
			<Empty.Description>
				Try adjusting your filters or search terms to find more results.
			</Empty.Description>
		</Empty.Header>
	</Empty.Root>
{:else}
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
		{#each sites as site (site.id)}
			<BacklinkSiteCard {site} {onViewDetails} {onAddToProject} />
		{/each}
	</div>
{/if}

