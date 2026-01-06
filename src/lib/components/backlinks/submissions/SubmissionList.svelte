<script lang="ts">
	import type { BacklinkSubmissionWithSite, BacklinkSubmission, SubmissionStatus } from '$lib/types';
	import { SUBMISSION_STATUSES } from '$lib/types/backlinks';
	import SubmissionCard from './SubmissionCard.svelte';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	let {
		submissions,
		onUpdateStatus,
		onViewDetails,
		onDelete,
	}: {
		submissions: BacklinkSubmissionWithSite[];
		onUpdateStatus?: (submission: BacklinkSubmission, status: SubmissionStatus) => void;
		onViewDetails?: (submission: BacklinkSubmission) => void;
		onDelete?: (submission: BacklinkSubmission) => void;
	} = $props();

	const groupedByStatus = $derived(() => {
		const groups = new Map<SubmissionStatus, BacklinkSubmissionWithSite[]>();
		Object.keys(SUBMISSION_STATUSES).forEach((status) => {
			groups.set(status as SubmissionStatus, []);
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

<div class="space-y-4">
	{#each Array.from(groupedByStatus().entries()) as [status, items]}
		{#if items.length > 0}
			<Collapsible.Root open={true} class="group/collapsible">
				<Collapsible.Trigger class="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md">
					<div class="flex items-center gap-2">
						<span class="text-sm font-semibold">
							{SUBMISSION_STATUSES[status].label} ({items.length})
						</span>
					</div>
					<ChevronDownIcon
						class="size-4 transition-transform group-data-[state=open]/collapsible:rotate-180"
					/>
				</Collapsible.Trigger>
				<Collapsible.Content class="pt-2">
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{#each items as submission (submission.id)}
							<SubmissionCard {submission} {onUpdateStatus} {onViewDetails} {onDelete} />
						{/each}
					</div>
				</Collapsible.Content>
			</Collapsible.Root>
		{/if}
	{/each}

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
</div>

