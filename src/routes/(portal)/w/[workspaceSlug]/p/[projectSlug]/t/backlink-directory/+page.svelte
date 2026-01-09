<script lang="ts">
	import type { ProjectPageData } from '$lib/types';
	import type {
		BacklinkSubmissionWithSite,
		BacklinkSubmission,
		SubmissionStatus,
		UpdateSubmissionRequest,
	} from '$lib/types';
	import { usePortal } from '$lib/stores/portal.svelte.js';
	import { get, post, patch, del } from '$lib/api/client.js';
	import { invalidateCachePattern } from '$lib/api/cache.js';
	import { invalidateAll } from '$app/navigation';
	import SubmissionList from '$lib/components/backlinks/submissions/SubmissionList.svelte';
	import SubmissionKanban from '$lib/components/backlinks/submissions/SubmissionKanban.svelte';
	import SubmissionsStats from '$lib/components/backlinks/submissions/SubmissionsStats.svelte';
	import UpdateStatusModal from '$lib/components/backlinks/submissions/UpdateStatusModal.svelte';
	import SubmissionDetailsDialog from '$lib/components/backlinks/submissions/SubmissionDetailsDialog.svelte';
	import BacklinksDirectoryDialog from '$lib/components/backlinks/backlinks-directory-dialog.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { toast } from 'svelte-sonner';
	import ListIcon from '@lucide/svelte/icons/list';
	import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
	import PlusIcon from '@lucide/svelte/icons/plus';

	let { data }: { data: ProjectPageData } = $props();

	const portal = usePortal();
	const project = $derived(portal.currentProject);
	const workspace = $derived(portal.currentWorkspace);

	let submissions = $state<BacklinkSubmissionWithSite[]>([]);
	let stats = $state(null);
	let loading = $state(false);
	let initialLoad = $state(true);
	let error = $state<string | null>(null);
	let statusFilter = $state<SubmissionStatus | undefined>(undefined);
	let viewMode = $state<'list' | 'kanban'>('list');
	let selectedSubmission = $state<BacklinkSubmission | null>(null);
	let updateModalOpen = $state(false);
	let directoryDialogOpen = $state(false);
	let detailsDialogOpen = $state(false);
	let selectedSubmissionId = $state<string | null>(null);

	async function loadSubmissions() {
		if (!workspace || !project) return;

		loading = true;
		error = null;

		try {
			const params = new URLSearchParams();
			if (statusFilter) {
				params.append('status', statusFilter);
			}
			// Add timestamp to bypass cache
			params.append('_t', Date.now().toString());

			const response = await get<{
				submissions: BacklinkSubmissionWithSite[];
				total: number;
				stats: any;
			}>(`/api/workspaces/${workspace.id}/projects/${project.id}/t/backlinks/submissions?${params.toString()}`);

			submissions = response.submissions;
			stats = response.stats;
			initialLoad = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load submissions';
			console.error('Error loading submissions:', err);
		} finally {
			loading = false;
		}
	}

	async function handleUpdateStatus(
		submission: BacklinkSubmission,
		status: SubmissionStatus
	) {
		selectedSubmission = submission;
		updateModalOpen = true;
	}

	async function handleUpdateSubmission(data: UpdateSubmissionRequest) {
		if (!workspace || !project || !selectedSubmission) return;

		try {
			await patch(
				`/api/workspaces/${workspace.id}/projects/${project.id}/t/backlinks/submissions/${selectedSubmission.id}`,
				data
			);
			toast.success('Submission updated successfully');
			updateModalOpen = false;
			selectedSubmission = null;
			await loadSubmissions();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to update submission');
			console.error('Error updating submission:', err);
		}
	}

	async function handleDelete(submission: BacklinkSubmission) {
		if (!workspace || !project) return;

		if (!confirm('Are you sure you want to delete this submission?')) {
			return;
		}

		try {
			await del(
				`/api/workspaces/${workspace.id}/projects/${project.id}/t/backlinks/submissions/${submission.id}`
			);
			// Invalidate cache for this endpoint
			invalidateCachePattern(`/api/workspaces/${workspace.id}/projects/${project.id}/t/backlinks/submissions`);
			toast.success('Submission deleted successfully');
			await loadSubmissions();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to delete submission');
			console.error('Error deleting submission:', err);
		}
	}

	function handleViewDetails(submission: BacklinkSubmission) {
		selectedSubmissionId = submission.id;
		detailsDialogOpen = true;
	}

	function handleDetailsDialogClose() {
		detailsDialogOpen = false;
		selectedSubmissionId = null;
	}

	function handleDetailsUpdate() {
		loadSubmissions();
	}

	function handleDetailsDelete() {
		if (workspace && project) {
			invalidateCachePattern(`/api/workspaces/${workspace.id}/projects/${project.id}/t/backlinks/submissions`);
		}
		loadSubmissions();
	}

	function handleSubmissionAdded() {
		if (workspace && project) {
			invalidateCachePattern(`/api/workspaces/${workspace.id}/projects/${project.id}/t/backlinks/submissions`);
		}
		loadSubmissions();
	}

	// Load once on mount
	$effect(() => {
		const workspaceId = workspace?.id;
		const projectId = project?.id;
		
		if (workspaceId && projectId && initialLoad) {
			loadSubmissions();
		}
	});
</script>

<div class="container mx-auto py-8 px-4">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold mb-2">My Submissions</h1>
			<p class="text-muted-foreground">
				Track and manage your backlink submissions for {project?.name || 'this project'}
			</p>
		</div>
		<Button onclick={() => (directoryDialogOpen = true)}>
			<PlusIcon class="size-4 mr-2" />
			Add Site
		</Button>
	</div>

	{#if error}
		<div class="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg">
			<p>{error}</p>
		</div>
	{/if}

	{#if stats}
		<div class="mb-6">
			<SubmissionsStats {stats} />
		</div>
	{/if}

	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<Tabs.Root value={statusFilter || 'all'} class="w-full">
				<Tabs.List>
					<Tabs.Trigger
						value="all"
						onclick={() => {
							statusFilter = undefined;
							loadSubmissions();
						}}
					>
						All
					</Tabs.Trigger>
					<Tabs.Trigger
						value="not_started"
						onclick={() => {
							statusFilter = 'not_started';
							loadSubmissions();
						}}
					>
						Not Started
					</Tabs.Trigger>
					<Tabs.Trigger
						value="in_progress"
						onclick={() => {
							statusFilter = 'in_progress';
							loadSubmissions();
						}}
					>
						In Progress
					</Tabs.Trigger>
					<Tabs.Trigger
						value="submitted"
						onclick={() => {
							statusFilter = 'submitted';
							loadSubmissions();
						}}
					>
						Submitted
					</Tabs.Trigger>
					<Tabs.Trigger
						value="approved"
						onclick={() => {
							statusFilter = 'approved';
							loadSubmissions();
						}}
					>
						Approved
					</Tabs.Trigger>
					<Tabs.Trigger
						value="rejected"
						onclick={() => {
							statusFilter = 'rejected';
							loadSubmissions();
						}}
					>
						Rejected
					</Tabs.Trigger>
				</Tabs.List>
			</Tabs.Root>

			<div class="flex gap-2">
				<Button
					variant={viewMode === 'list' ? 'default' : 'outline'}
					size="sm"
					onclick={() => (viewMode = 'list')}
				>
					<ListIcon class="size-4" />
				</Button>
				<Button
					variant={viewMode === 'kanban' ? 'default' : 'outline'}
					size="sm"
					onclick={() => (viewMode = 'kanban')}
				>
					<LayoutGridIcon class="size-4" />
				</Button>
			</div>
		</div>

		{#if viewMode === 'list'}
			<SubmissionList
				{submissions}
				loading={loading && initialLoad}
				onUpdateStatus={handleUpdateStatus}
				onViewDetails={handleViewDetails}
				onDelete={handleDelete}
			/>
		{:else}
			<SubmissionKanban
				{submissions}
				loading={loading && initialLoad}
				onUpdateStatus={handleUpdateStatus}
				onViewDetails={handleViewDetails}
			/>
		{/if}
	</div>
</div>

{#if selectedSubmission}
	<UpdateStatusModal
		submission={selectedSubmission}
		open={updateModalOpen}
		onClose={() => {
			updateModalOpen = false;
			selectedSubmission = null;
		}}
		onConfirm={handleUpdateSubmission}
	/>
{/if}

<BacklinksDirectoryDialog bind:open={directoryDialogOpen} onSubmissionAdded={handleSubmissionAdded} />

<SubmissionDetailsDialog
	submissionId={selectedSubmissionId}
	bind:open={detailsDialogOpen}
	onClose={handleDetailsDialogClose}
	onUpdate={handleDetailsUpdate}
	onDelete={handleDetailsDelete}
/>


