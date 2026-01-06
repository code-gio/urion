<script lang="ts">
	import type { BacklinkSite, BacklinkSubmission } from '$lib/types';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import {
		LINK_TYPES,
		DIFFICULTY_LEVELS,
		COST_TYPES,
		BACKLINK_CATEGORIES,
		getDRBadgeColor,
		getDRLabel,
	} from '$lib/types/backlinks';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import CheckIcon from '@lucide/svelte/icons/check';

	let {
		site,
		submission,
		open = false,
		onClose,
		onAddToProject,
	}: {
		site: BacklinkSite | null;
		submission: BacklinkSubmission | null;
		open?: boolean;
		onClose: () => void;
		onAddToProject?: (site: BacklinkSite) => void;
	} = $props();

	const drColor = $derived(site ? getDRBadgeColor(site.dr) : 'gray');
	const drLabel = $derived(site ? getDRLabel(site.dr) : 'Unknown');
	const linkTypeInfo = $derived(site ? LINK_TYPES[site.link_type] || LINK_TYPES.unknown : null);
	const difficultyInfo = $derived(
		site && site.difficulty_level ? DIFFICULTY_LEVELS[site.difficulty_level] : null
	);
	const costTypeInfo = $derived(site && site.cost_type ? COST_TYPES[site.cost_type] : null);
	const categoryInfo = $derived(
		site ? BACKLINK_CATEGORIES[site.category] || BACKLINK_CATEGORIES.other : null
	);
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-2xl max-h-[90vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title class="text-2xl">{site?.name}</Dialog.Title>
			<Dialog.Description>
				<a
					href={site?.url}
					target="_blank"
					rel="noopener noreferrer"
					class="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
				>
					{site?.url}
					<ExternalLinkIcon class="size-3" />
				</a>
			</Dialog.Description>
		</Dialog.Header>

		{#if site}
			<div class="space-y-6 py-4">
				<!-- Overview -->
				<div class="space-y-3">
					<h3 class="text-sm font-semibold">Overview</h3>
					<p class="text-sm text-muted-foreground">{site.description || 'No description available'}</p>
				</div>

				<Separator />

				<!-- Metrics -->
				<div class="space-y-3">
					<h3 class="text-sm font-semibold">SEO Metrics</h3>
					<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div>
							<div class="text-xs text-muted-foreground">Domain Rating</div>
							<div class="text-lg font-semibold">
								{site.dr !== null ? site.dr : 'N/A'}
							</div>
							<div class="text-xs text-muted-foreground">{drLabel}</div>
						</div>
						{#if linkTypeInfo}
							<div>
								<div class="text-xs text-muted-foreground">Link Type</div>
								<Badge variant="outline" class="mt-1">
									{linkTypeInfo.label}
								</Badge>
							</div>
						{/if}
						{#if site.traffic}
							<div>
								<div class="text-xs text-muted-foreground">Traffic</div>
								<div class="text-lg font-semibold">{site.traffic}</div>
							</div>
						{/if}
						{#if site.user_rating}
							<div>
								<div class="text-xs text-muted-foreground">Rating</div>
								<div class="text-lg font-semibold">{site.user_rating.toFixed(1)}</div>
							</div>
						{/if}
					</div>
				</div>

				<Separator />

				<!-- Submission Info -->
				<div class="space-y-3">
					<h3 class="text-sm font-semibold">Submission Information</h3>
					<div class="grid grid-cols-2 gap-4 text-sm">
						{#if categoryInfo}
							<div>
								<div class="text-xs text-muted-foreground">Category</div>
								<div class="font-medium">{categoryInfo.label}</div>
							</div>
						{/if}
						{#if difficultyInfo}
							<div>
								<div class="text-xs text-muted-foreground">Difficulty</div>
								<Badge variant="outline" class="mt-1">
									{difficultyInfo.label}
								</Badge>
							</div>
						{/if}
						{#if site.estimated_time_minutes}
							<div>
								<div class="text-xs text-muted-foreground">Time Required</div>
								<div class="font-medium">~{site.estimated_time_minutes} minutes</div>
							</div>
						{/if}
						{#if site.typical_approval_time}
							<div>
								<div class="text-xs text-muted-foreground">Approval Time</div>
								<div class="font-medium">{site.typical_approval_time}</div>
							</div>
						{/if}
						<div>
							<div class="text-xs text-muted-foreground">Registration</div>
							<div class="font-medium">
								{site.requires_registration ? 'Required' : 'Not required'}
							</div>
						</div>
						<div>
							<div class="text-xs text-muted-foreground">Approval</div>
							<div class="font-medium">
								{site.instant_approval ? 'Instant' : site.requires_approval ? 'Required' : 'Not required'}
							</div>
						</div>
						{#if costTypeInfo}
							<div>
								<div class="text-xs text-muted-foreground">Cost</div>
								<div class="font-medium">{costTypeInfo.label}</div>
							</div>
						{/if}
					</div>
				</div>

				{#if site.submission_instructions}
					<Separator />
					<div class="space-y-3">
						<h3 class="text-sm font-semibold">Submission Instructions</h3>
						<div class="text-sm text-muted-foreground whitespace-pre-line">
							{site.submission_instructions}
						</div>
					</div>
				{/if}

				{#if site.tags && site.tags.length > 0}
					<Separator />
					<div class="space-y-3">
						<h3 class="text-sm font-semibold">Tags</h3>
						<div class="flex flex-wrap gap-2">
							{#each site.tags as tag}
								<Badge variant="secondary">{tag}</Badge>
							{/each}
						</div>
					</div>
				{/if}

				{#if submission}
					<Separator />
					<div class="space-y-3">
						<h3 class="text-sm font-semibold">Your Submission</h3>
						<div class="text-sm">
							<div class="text-muted-foreground">Status:</div>
							<Badge variant="outline" class="mt-1">{submission.status}</Badge>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<Dialog.Footer>
			{#if site?.submission_url}
				<Button variant="outline" onclick={() => window.open(site.submission_url, '_blank')}>
					<ExternalLinkIcon class="size-4 mr-2" />
					View Submission URL
				</Button>
			{/if}
			<Button variant="outline" onclick={onClose}>Close</Button>
			{#if !submission && onAddToProject}
				<Button onclick={() => onAddToProject(site!)}>
					<CheckIcon class="size-4 mr-2" />
					Add to Project
				</Button>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

