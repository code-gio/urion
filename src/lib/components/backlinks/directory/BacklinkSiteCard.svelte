<script lang="ts">
	import type { BacklinkSiteWithSubmission, BacklinkSite } from '$lib/types';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { LINK_TYPES, DIFFICULTY_LEVELS, getDRBadgeColor, getDRLabel } from '$lib/types/backlinks';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';

	let {
		site,
		onViewDetails,
		onAddToProject,
	}: {
		site: BacklinkSiteWithSubmission;
		onViewDetails?: (site: BacklinkSite) => void;
		onAddToProject?: (site: BacklinkSite) => void;
	} = $props();

	const drColor = $derived(getDRBadgeColor(site.dr));
	const linkTypeInfo = $derived(LINK_TYPES[site.link_type] || LINK_TYPES.unknown);
	const difficultyInfo = $derived(
		site.difficulty_level ? DIFFICULTY_LEVELS[site.difficulty_level] : null
	);
</script>

<Card class="flex flex-col h-full">
	<CardHeader class="pb-3">
		<div class="flex items-start justify-between gap-2">
			<CardTitle class="text-lg leading-tight">{site.name}</CardTitle>
			{#if site.is_verified}
				<Badge variant="secondary" class="shrink-0">
					<CheckIcon class="size-3 mr-1" />
					Verified
				</Badge>
			{/if}
		</div>
		<CardDescription class="text-sm text-muted-foreground line-clamp-2">
			{site.description || 'No description available'}
		</CardDescription>
		<a
			href={site.url}
			target="_blank"
			rel="noopener noreferrer"
			class="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1"
		>
			{site.url}
			<ExternalLinkIcon class="size-3" />
		</a>
	</CardHeader>

	<CardContent class="flex-1 space-y-3">
		<div class="flex flex-wrap items-center gap-2">
			{#if site.dr !== null}
				<Badge variant="outline" class="font-mono">
					DR: {site.dr}
				</Badge>
			{/if}
			<Badge variant="outline" class="text-xs">
				{linkTypeInfo.label}
			</Badge>
			{#if difficultyInfo}
				<Badge variant="outline" class="text-xs">
					{difficultyInfo.label}
				</Badge>
			{/if}
		</div>

		{#if site.tags && site.tags.length > 0}
			<div class="flex flex-wrap gap-1">
				{#each site.tags.slice(0, 3) as tag}
					<Badge variant="secondary" class="text-xs">
						{tag}
					</Badge>
				{/each}
				{#if site.tags.length > 3}
					<Badge variant="secondary" class="text-xs">
						+{site.tags.length - 3}
					</Badge>
				{/if}
			</div>
		{/if}

		{#if site.has_submission && site.submission}
			<div class="pt-2 border-t">
				<div class="text-xs text-muted-foreground">
					Status: <span class="font-medium">{site.submission.status}</span>
				</div>
			</div>
		{/if}
	</CardContent>

	<CardFooter class="flex gap-2 pt-4">
		<Button variant="outline" size="sm" class="flex-1" onclick={() => onViewDetails?.(site)}>
			View Details
		</Button>
		{#if site.has_submission}
			<Button variant="secondary" size="sm" class="flex-1" disabled>
				<CheckIcon class="size-4 mr-1" />
				Added
			</Button>
		{:else}
			<Button variant="default" size="sm" class="flex-1" onclick={() => onAddToProject?.(site)}>
				Add to Project
			</Button>
		{/if}
	</CardFooter>
</Card>

