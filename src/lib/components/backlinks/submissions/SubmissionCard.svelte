<script lang="ts">
	import type { BacklinkSubmissionWithSite, BacklinkSubmission, SubmissionStatus } from '$lib/types';
	import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { SUBMISSION_STATUSES, LINK_TYPES } from '$lib/types/backlinks';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	let {
		submission,
		onUpdateStatus,
		onViewDetails,
		onDelete,
	}: {
		submission: BacklinkSubmissionWithSite;
		onUpdateStatus?: (submission: BacklinkSubmission, status: SubmissionStatus) => void;
		onViewDetails?: (submission: BacklinkSubmission) => void;
		onDelete?: (submission: BacklinkSubmission) => void;
	} = $props();

	const statusInfo = $derived(SUBMISSION_STATUSES[submission.status] || SUBMISSION_STATUSES.not_started);
	const linkTypeInfo = $derived(
		submission.site ? LINK_TYPES[submission.site.link_type] || LINK_TYPES.unknown : null
	);

	function formatDate(date: string | null): string {
		if (!date) return 'N/A';
		return new Date(date).toLocaleDateString();
	}
</script>

<Card class="flex flex-col">
	<CardHeader class="pb-3">
		<div class="flex items-start justify-between gap-2">
			<CardTitle class="text-lg">{submission.site?.name || 'Unknown Site'}</CardTitle>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<Button variant="ghost" size="sm" class="h-8 w-8 p-0">
						<MoreVerticalIcon class="size-4" />
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					{#if onViewDetails}
						<DropdownMenu.Item onclick={() => onViewDetails(submission)}>
							View Details
						</DropdownMenu.Item>
					{/if}
					{#if onUpdateStatus}
						<DropdownMenu.Item onclick={() => onUpdateStatus?.(submission, 'in_progress')}>
							Mark as In Progress
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => onUpdateStatus?.(submission, 'submitted')}>
							Mark as Submitted
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => onUpdateStatus?.(submission, 'approved')}>
							Mark as Approved
						</DropdownMenu.Item>
					{/if}
					{#if onDelete}
						<DropdownMenu.Separator />
						<DropdownMenu.Item onclick={() => onDelete(submission)} class="text-destructive">
							Delete
						</DropdownMenu.Item>
					{/if}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
		<div class="flex items-center gap-2 mt-2">
			<Badge variant="outline" class="text-xs">
				{statusInfo.label}
			</Badge>
			{#if submission.is_live}
				<Badge variant="default" class="text-xs">Live</Badge>
			{/if}
			{#if linkTypeInfo}
				<Badge variant="secondary" class="text-xs">{linkTypeInfo.label}</Badge>
			{/if}
			{#if submission.site?.dr !== null}
				<Badge variant="outline" class="text-xs font-mono">DR: {submission.site.dr}</Badge>
			{/if}
		</div>
	</CardHeader>

	<CardContent class="flex-1 space-y-2 text-sm">
		{#if submission.backlink_url}
			<div>
				<div class="text-xs text-muted-foreground">Backlink URL</div>
				<a
					href={submission.backlink_url}
					target="_blank"
					rel="noopener noreferrer"
					class="text-xs text-primary hover:underline flex items-center gap-1"
				>
					{submission.backlink_url}
					<ExternalLinkIcon class="size-3" />
				</a>
			</div>
		{/if}

		<div class="grid grid-cols-2 gap-2 text-xs">
			<div>
				<div class="text-muted-foreground">Created</div>
				<div class="font-medium">{formatDate(submission.created_at)}</div>
			</div>
			{#if submission.submitted_at}
				<div>
					<div class="text-muted-foreground">Submitted</div>
					<div class="font-medium">{formatDate(submission.submitted_at)}</div>
				</div>
			{/if}
			{#if submission.approved_at}
				<div>
					<div class="text-muted-foreground">Approved</div>
					<div class="font-medium">{formatDate(submission.approved_at)}</div>
				</div>
			{/if}
		</div>

		{#if submission.notes}
			<div class="pt-2 border-t">
				<div class="text-xs text-muted-foreground">Notes</div>
				<p class="text-xs mt-1 line-clamp-2">{submission.notes}</p>
			</div>
		{/if}
	</CardContent>

	<CardFooter class="pt-4">
		<Button variant="outline" size="sm" class="w-full" onclick={() => onViewDetails?.(submission)}>
			View Details
		</Button>
	</CardFooter>
</Card>

