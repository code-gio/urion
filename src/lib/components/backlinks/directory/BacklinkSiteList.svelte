<script lang="ts">
	import type { BacklinkSiteWithSubmission, BacklinkSite } from '$lib/types';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { LINK_TYPES, DIFFICULTY_LEVELS, getDRBadgeColor } from '$lib/types/backlinks';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import GlobeIcon from '@lucide/svelte/icons/globe';

	let {
		sites,
		loading = false,
		addingToProject = false,
		onViewDetails,
		onAddToProject,
	}: {
		sites: BacklinkSiteWithSubmission[];
		loading?: boolean;
		addingToProject?: boolean;
		onViewDetails?: (site: BacklinkSiteWithSubmission) => void;
		onAddToProject?: (site: BacklinkSiteWithSubmission) => void;
	} = $props();

	function getSiteIcon(site: BacklinkSiteWithSubmission) {
		// You can replace this with actual favicon fetching or use a default icon
		return null;
	}
</script>

{#if loading}
	<div class="space-y-3">
		{#each Array(8) as _}
			<div class="p-3 relative flex items-center gap-x-3 bg-card border border-border rounded-xl">
				<Skeleton class="size-9.5 rounded-lg" />
				<div class="grow space-y-2">
					<Skeleton class="h-4 w-3/4" />
					<Skeleton class="h-3 w-1/2" />
				</div>
				<Skeleton class="h-8 w-8 rounded-lg" />
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
	<div class="space-y-3">
		{#each sites as site (site.id)}
			{@const linkTypeInfo = LINK_TYPES[site.link_type] || LINK_TYPES.unknown}
			{@const difficultyInfo = site.difficulty_level ? DIFFICULTY_LEVELS[site.difficulty_level] : null}
			<div
				class="p-3 relative group flex items-center gap-x-3 bg-card border border-border rounded-xl hover:bg-accent/50 transition-colors"
			>
				<!-- Site Icon/Avatar -->
				<div
					class="size-9.5 flex items-center justify-center rounded-lg bg-muted border border-border shrink-0"
				>
					<GlobeIcon class="size-5 text-muted-foreground" />
				</div>

				<!-- Site Info -->
				<div class="grow truncate min-w-0">
					<div class="flex items-center gap-2 mb-1">
						<p class="block truncate text-sm font-semibold text-foreground">
							{site.name}
						</p>
						{#if site.is_verified}
							<Badge variant="secondary" class="shrink-0 text-xs">
								<CheckIcon class="size-3 mr-1" />
								Verified
							</Badge>
						{/if}
						{#if site.dr !== null}
							<Badge variant="outline" class="shrink-0 text-xs font-mono">
								DR: {site.dr}
							</Badge>
						{/if}
					</div>
					<div class="flex items-center gap-2 flex-wrap">
						<p class="block truncate text-xs text-muted-foreground">
							{site.description || 'No description available'}
						</p>
						{#if site.url}
							<a
								href={site.url}
								target="_blank"
								rel="noopener noreferrer"
								class="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0"
								onclick={(e) => e.stopPropagation()}
							>
								{new URL(site.url).hostname}
								<ExternalLinkIcon class="size-3" />
							</a>
						{/if}
					</div>
				
				</div>

				<!-- Actions -->
				<div class="flex items-center gap-2 shrink-0">
					<Button
						variant="ghost"
						onclick={(e) => {
							e.stopPropagation();
							onViewDetails?.(site);
						}}
					>
						<EyeIcon class="size-4 mr-2" />
						View Details
					</Button>
					{#if !site.has_submission}
						<Button
							variant="default"
							size="sm"
							disabled={addingToProject}
							onclick={(e) => {
								e.stopPropagation();
								onAddToProject?.(site);
							}}
						>
							{#if addingToProject}
								Adding...
							{:else}
								Add to Project
							{/if}
						</Button>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}

