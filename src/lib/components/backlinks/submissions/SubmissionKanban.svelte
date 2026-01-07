<script lang="ts">
	import type { BacklinkSubmissionWithSite, BacklinkSubmission, SubmissionStatus } from '$lib/types';
	import { SUBMISSION_STATUSES } from '$lib/types/backlinks';
	import SubmissionCard from './SubmissionCard.svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton';

	let {
		submissions,
		loading = false,
		onUpdateStatus,
		onViewDetails,
	}: {
		submissions: BacklinkSubmissionWithSite[];
		loading?: boolean;
		onUpdateStatus?: (submission: BacklinkSubmission, status: SubmissionStatus) => void;
		onViewDetails?: (submission: BacklinkSubmission) => void;
	} = $props();

	const statusColumns: SubmissionStatus[] = [
		'not_started',
		'in_progress',
		'submitted',
		'approved',
		'rejected',
	];

	const groupedByStatus = $derived(() => {
		const groups = new Map<SubmissionStatus, BacklinkSubmissionWithSite[]>();
		statusColumns.forEach((status) => {
			groups.set(status, []);
		});
		submissions.forEach((submission) => {
			const status = submission.status;
			const group = groups.get(status) || [];
			group.push(submission);
			groups.set(status, group);
		});
		return groups;
	});
</script>

{#if loading}
	<div class="flex gap-4 overflow-x-auto pb-4">
		{#each statusColumns as status}
			<div class="flex-shrink-0 w-80">
				<div class="mb-2">
					<Skeleton class="h-5 w-32" />
				</div>
				<div class="space-y-2 min-h-[200px]">
					{#each Array(3) as _}
						<div class="border rounded-lg p-4 space-y-3">
							<Skeleton class="h-6 w-3/4" />
							<div class="flex gap-2">
								<Skeleton class="h-5 w-20" />
								<Skeleton class="h-5 w-16" />
							</div>
							<Skeleton class="h-4 w-full" />
							<Skeleton class="h-4 w-2/3" />
							<div class="grid grid-cols-2 gap-2">
								<Skeleton class="h-4 w-full" />
								<Skeleton class="h-4 w-full" />
							</div>
							<Skeleton class="h-9 w-full mt-4" />
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
{:else}
	<div class="flex gap-4 overflow-x-auto pb-4">
		{#each statusColumns as status}
			{@const items = groupedByStatus().get(status) || []}
			<div class="flex-shrink-0 w-80">
				<div class="mb-2">
					<h3 class="text-sm font-semibold">
						{SUBMISSION_STATUSES[status].label} ({items.length})
					</h3>
				</div>
				<div class="space-y-2 min-h-[200px]">
					{#if items.length === 0}
						<div class="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-md">
							No items
						</div>
					{:else}
						{#each items as submission (submission.id)}
							<SubmissionCard {submission} {onUpdateStatus} {onViewDetails} />
						{/each}
					{/if}
				</div>
			</div>
		{/each}
	</div>

	{#if submissions.length === 0}
		<Empty.Root>
			<Empty.Header>
				<Empty.Title>No submissions yet</Empty.Title>
				<Empty.Description>
					Start tracking backlink sites by adding them to your project.
				</Empty.Description>
			</Empty.Header>
		</Empty.Root>
	{/if}
{/if}

