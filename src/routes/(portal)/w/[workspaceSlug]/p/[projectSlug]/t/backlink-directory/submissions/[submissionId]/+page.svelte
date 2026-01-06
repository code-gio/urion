<script lang="ts">
	import type { ProjectPageData } from '$lib/types';
	import type { BacklinkSubmissionWithSite, UpdateSubmissionRequest } from '$lib/types/backlinks';
	import { usePortal } from '$lib/stores/portal.svelte.js';
	import { get, patch, del } from '$lib/api/client.js';
	import { invalidateAll, goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { SUBMISSION_STATUSES, LINK_TYPES } from '$lib/types/backlinks';
	import UpdateStatusModal from '$lib/components/backlinks/submissions/UpdateStatusModal.svelte';
	import AddNoteModal from '$lib/components/backlinks/submissions/AddNoteModal.svelte';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';

	let { data, params }: { data: ProjectPageData; params: { submissionId: string } } = $props();

	const portal = usePortal();
	const project = $derived(portal.currentProject);
	const workspace = $derived(portal.currentWorkspace);

	let submission = $state<BacklinkSubmissionWithSite | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let updateModalOpen = $state(false);
	let noteModalOpen = $state(false);
	let deleteDialogOpen = $state(false);

	async function loadSubmission() {
		if (!workspace || !project) return;

		loading = true;
		error = null;

		try {
			const response = await get<{ submission: BacklinkSubmissionWithSite }>(
				`/api/workspaces/${workspace.id}/projects/${project.id}/t/backlinks/submissions/${params.submissionId}`
			);
			submission = response.submission;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load submission';
			console.error('Error loading submission:', err);
		} finally {
			loading = false;
		}
	}

	async function handleUpdate(data: UpdateSubmissionRequest) {
		if (!workspace || !project || !submission) return;

		try {
			const response = await patch<{ submission: BacklinkSubmissionWithSite }>(
				`/api/workspaces/${workspace.id}/projects/${project.id}/t/backlinks/submissions/${submission.id}`,
				data
			);
			submission = response.submission;
			toast.success('Submission updated successfully');
			updateModalOpen = false;
			await invalidateAll();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to update submission');
			console.error('Error updating submission:', err);
		}
	}

	async function handleSaveNote(notes: string) {
		if (!workspace || !project || !submission) return;

		try {
			await handleUpdate({ notes });
			noteModalOpen = false;
		} catch (err) {
			// Error already handled in handleUpdate
		}
	}

	async function handleDelete() {
		if (!workspace || !project || !submission) return;

		try {
			await del(
				`/api/workspaces/${workspace.id}/projects/${project.id}/t/backlinks/submissions/${submission.id}`
			);
			toast.success('Submission deleted successfully');
			await invalidateAll();
			goto(`/w/${workspace?.slug}/p/${project?.slug}/t/backlink-directory/submissions`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to delete submission');
			console.error('Error deleting submission:', err);
		}
	}

	function formatDate(date: string | null): string {
		if (!date) return 'N/A';
		return new Date(date).toLocaleString();
	}

	$effect(() => {
		if (workspace && project) {
			loadSubmission();
		}
	});
</script>

<div class="container mx-auto py-8 px-4">
	<Button variant="ghost" onclick={() => goto(`/w/${workspace?.slug}/p/${project?.slug}/t/backlink-directory/submissions`)} class="mb-4">
		<ArrowLeftIcon class="size-4 mr-2" />
		Back to Submissions
	</Button>

	{#if loading}
		<div class="space-y-4">
			<div class="h-8 bg-muted animate-pulse rounded"></div>
			<div class="h-64 bg-muted animate-pulse rounded"></div>
		</div>
	{:else if error}
		<div class="p-4 bg-destructive/10 text-destructive rounded-lg">
			<p>{error}</p>
		</div>
	{:else if submission}
		<div class="space-y-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold mb-2">{submission.site?.name || 'Submission'}</h1>
					<div class="flex items-center gap-2">
						<Badge variant="outline">{SUBMISSION_STATUSES[submission.status as keyof typeof SUBMISSION_STATUSES]?.label || submission.status}</Badge>
						{#if submission.is_live}
							<Badge variant="default">Live</Badge>
						{/if}
					</div>
				</div>
				<div class="flex gap-2">
					<Button variant="outline" onclick={() => (updateModalOpen = true)}>Update Status</Button>
					<Button variant="outline" onclick={() => (noteModalOpen = true)}>Edit Notes</Button>
					<AlertDialog.Root bind:open={deleteDialogOpen}>
						<AlertDialog.Trigger>
							<Button variant="destructive">Delete</Button>
						</AlertDialog.Trigger>
						<AlertDialog.Content>
							<AlertDialog.Header>
								<AlertDialog.Title>Delete Submission</AlertDialog.Title>
								<AlertDialog.Description>
									Are you sure you want to delete this submission? This action cannot be undone.
								</AlertDialog.Description>
							</AlertDialog.Header>
							<AlertDialog.Footer>
								<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
								<AlertDialog.Action onclick={handleDelete}>Delete</AlertDialog.Action>
							</AlertDialog.Footer>
						</AlertDialog.Content>
					</AlertDialog.Root>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Site Information</CardTitle>
					</CardHeader>
					<CardContent class="space-y-2">
						<div>
							<div class="text-sm text-muted-foreground">Name</div>
							<div class="font-medium">{submission.site?.name || 'Unknown'}</div>
						</div>
						<div>
							<div class="text-sm text-muted-foreground">URL</div>
							<a
								href={submission.site?.url}
								target="_blank"
								rel="noopener noreferrer"
								class="text-sm text-primary hover:underline flex items-center gap-1"
							>
								{submission.site?.url}
								<ExternalLinkIcon class="size-3" />
							</a>
						</div>
						<div>
							<div class="text-sm text-muted-foreground">Domain Rating</div>
							<div class="font-medium">{submission.site?.dr !== null ? submission.site.dr : 'N/A'}</div>
						</div>
						<div>
							<div class="text-sm text-muted-foreground">Link Type</div>
							<Badge variant="outline">
								{LINK_TYPES[submission.site?.link_type as keyof typeof LINK_TYPES || 'unknown']?.label || 'Unknown'}
							</Badge>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Backlink Details</CardTitle>
					</CardHeader>
					<CardContent class="space-y-2">
						<div>
							<div class="text-sm text-muted-foreground">Your URL</div>
							<div class="font-medium">{submission.submitted_url || 'N/A'}</div>
						</div>
						{#if submission.backlink_url}
							<div>
								<div class="text-sm text-muted-foreground">Backlink URL</div>
								<a
									href={submission.backlink_url}
									target="_blank"
									rel="noopener noreferrer"
									class="text-sm text-primary hover:underline flex items-center gap-1"
								>
									{submission.backlink_url}
									<ExternalLinkIcon class="size-3" />
								</a>
							</div>
						{/if}
						{#if submission.anchor_text}
							<div>
								<div class="text-sm text-muted-foreground">Anchor Text</div>
								<div class="font-medium">{submission.anchor_text}</div>
							</div>
						{/if}
						{#if submission.account_username}
							<div>
								<div class="text-sm text-muted-foreground">Account Username</div>
								<div class="font-medium">{submission.account_username}</div>
							</div>
						{/if}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Timeline</CardTitle>
				</CardHeader>
				<CardContent class="space-y-2">
					<div class="flex justify-between">
						<span class="text-sm text-muted-foreground">Created</span>
						<span class="text-sm font-medium">{formatDate(submission.created_at)}</span>
					</div>
					{#if submission.started_at}
						<div class="flex justify-between">
							<span class="text-sm text-muted-foreground">Started</span>
							<span class="text-sm font-medium">{formatDate(submission.started_at)}</span>
						</div>
					{/if}
					{#if submission.submitted_at}
						<div class="flex justify-between">
							<span class="text-sm text-muted-foreground">Submitted</span>
							<span class="text-sm font-medium">{formatDate(submission.submitted_at)}</span>
						</div>
					{/if}
					{#if submission.approved_at}
						<div class="flex justify-between">
							<span class="text-sm text-muted-foreground">Approved</span>
							<span class="text-sm font-medium">{formatDate(submission.approved_at)}</span>
						</div>
					{/if}
					{#if submission.last_checked_at}
						<div class="flex justify-between">
							<span class="text-sm text-muted-foreground">Last Checked</span>
							<span class="text-sm font-medium">{formatDate(submission.last_checked_at)}</span>
						</div>
					{/if}
				</CardContent>
			</Card>

			{#if submission.referral_traffic || submission.conversion_count}
				<Card>
					<CardHeader>
						<CardTitle>Performance</CardTitle>
					</CardHeader>
					<CardContent class="grid grid-cols-2 gap-4">
						<div>
							<div class="text-sm text-muted-foreground">Referral Traffic</div>
							<div class="text-2xl font-bold">{(submission.referral_traffic || 0).toLocaleString()}</div>
						</div>
						<div>
							<div class="text-sm text-muted-foreground">Conversions</div>
							<div class="text-2xl font-bold">{(submission.conversion_count || 0).toLocaleString()}</div>
						</div>
					</CardContent>
				</Card>
			{/if}

			<Card>
				<CardHeader>
					<CardTitle>Notes</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-sm whitespace-pre-line">{submission.notes || 'No notes added yet.'}</p>
				</CardContent>
			</Card>
		</div>
	{/if}
</div>

{#if submission}
	<UpdateStatusModal
		submission={submission}
		open={updateModalOpen}
		onClose={() => (updateModalOpen = false)}
		onConfirm={handleUpdate}
	/>
	<AddNoteModal
		submission={submission}
		open={noteModalOpen}
		onClose={() => (noteModalOpen = false)}
		onSave={handleSaveNote}
	/>
{/if}

