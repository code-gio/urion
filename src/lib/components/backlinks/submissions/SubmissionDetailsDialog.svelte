<script lang="ts">
	import type { BacklinkSubmissionWithSite, BacklinkSubmission, UpdateSubmissionRequest } from '$lib/types';
	import { usePortal } from '$lib/stores/portal.svelte.js';
	import { get, patch, del } from '$lib/api/client.js';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { SUBMISSION_STATUSES, LINK_TYPES } from '$lib/types/backlinks';
	import UpdateStatusModal from './UpdateStatusModal.svelte';
	import AddNoteModal from './AddNoteModal.svelte';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		submissionId,
		open = $bindable(false),
		onClose,
		onUpdate,
		onDelete,
	}: {
		submissionId: string | null;
		open?: boolean;
		onClose?: () => void;
		onUpdate?: () => void;
		onDelete?: () => void;
	} = $props();

	const portal = usePortal();
	const project = $derived(portal.currentProject);
	const workspace = $derived(portal.currentWorkspace);

	let submission = $state<BacklinkSubmissionWithSite | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let updateModalOpen = $state(false);
	let noteModalOpen = $state(false);
	let deleteDialogOpen = $state(false);
	let submittedUrl = $state('');
	let isEditingSubmittedUrl = $state(false);
	let savingSubmittedUrl = $state(false);

	async function loadSubmission() {
		if (!workspace || !project || !submissionId) return;

		loading = true;
		error = null;

		try {
			const response = await get<{ submission: BacklinkSubmissionWithSite }>(
				`/api/workspaces/${workspace.id}/projects/${project.id}/t/backlinks/submissions/${submissionId}`
			);
			submission = response.submission;
			submittedUrl = submission.submitted_url || submission.submission_page_url || '';
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
			// Update submittedUrl state if submission_page_url was updated
			if (data.submission_page_url !== undefined) {
				submittedUrl = submission.submitted_url || submission.submission_page_url || '';
			}
			toast.success('Submission updated successfully');
			updateModalOpen = false;
			await invalidateAll();
			onUpdate?.();
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
			deleteDialogOpen = false;
			open = false;
			onDelete?.();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to delete submission');
			console.error('Error deleting submission:', err);
		}
	}

	async function handleSaveSubmittedUrl() {
		if (!workspace || !project || !submission) return;

		savingSubmittedUrl = true;
		try {
			await handleUpdate({ submission_page_url: submittedUrl || undefined });
			isEditingSubmittedUrl = false;
		} catch (err) {
			// Error already handled in handleUpdate
		} finally {
			savingSubmittedUrl = false;
		}
	}

	function handleCancelEditSubmittedUrl() {
		submittedUrl = submission?.submitted_url || submission?.submission_page_url || '';
		isEditingSubmittedUrl = false;
	}

	function formatDate(date: string | null): string {
		if (!date) return 'N/A';
		return new Date(date).toLocaleString();
	}

	$effect(() => {
		if (open && submissionId) {
			loadSubmission();
		} else if (!open) {
			// Reset state when dialog closes
			submission = null;
			error = null;
			updateModalOpen = false;
			noteModalOpen = false;
			deleteDialogOpen = false;
			submittedUrl = '';
			isEditingSubmittedUrl = false;
		}
	});

	// Sync submittedUrl when submission changes
	$effect(() => {
		if (submission && !isEditingSubmittedUrl) {
			submittedUrl = submission.submitted_url || submission.submission_page_url || '';
		}
	});
</script>

<Dialog.Root bind:open onOpenChange={(isOpen) => !isOpen && onClose?.()}>
	<Dialog.Content class="max-w-4xl max-h-[90vh] overflow-y-auto">
		{#if loading}
			<Dialog.Header>
				<Dialog.Title>Loading...</Dialog.Title>
				<Dialog.Description>Loading submission details</Dialog.Description>
			</Dialog.Header>
			<div class="space-y-4 py-4">
				<div class="h-8 bg-muted animate-pulse rounded"></div>
				<div class="h-64 bg-muted animate-pulse rounded"></div>
			</div>
		{:else if error}
			<Dialog.Header>
				<Dialog.Title>Error</Dialog.Title>
				<Dialog.Description>Failed to load submission</Dialog.Description>
			</Dialog.Header>
			<div class="p-4 bg-destructive/10 text-destructive rounded-lg">
				<p>{error}</p>
			</div>
		{:else if submission}
			<Dialog.Header>
				<Dialog.Title>{submission.site?.name || 'Submission'}</Dialog.Title>
				<Dialog.Description>
					<div class="flex items-center gap-2 mt-2">
						<Badge variant="outline">
							{SUBMISSION_STATUSES[submission.status as keyof typeof SUBMISSION_STATUSES]?.label ||
								submission.status}
						</Badge>
						{#if submission.is_live}
							<Badge variant="default">Live</Badge>
						{/if}
					</div>
				</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-0 ">

				<!-- Site Information -->
				<div class="py-4 space-y-3">
					<div class="space-y-3">
						<div>
							<div class="text-sm text-muted-foreground mb-1">Name</div>
							<div class="font-medium">{submission.site?.name || 'Unknown'}</div>
						</div>
						<div>
							<div class="text-sm text-muted-foreground mb-1">URL</div>
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
							<div class="text-sm text-muted-foreground mb-1">Domain Rating</div>
							<div class="font-medium">
								{submission.site?.dr !== null ? submission.site.dr : 'N/A'}
							</div>
						</div>
						<div>
							<div class="text-sm text-muted-foreground mb-1">Link Type</div>
							<Badge variant="outline">
								{LINK_TYPES[submission.site?.link_type as keyof typeof LINK_TYPES || 'unknown']
									?.label || 'Unknown'}
							</Badge>
						</div>
					</div>
				</div>

				<Separator />

				<!-- Backlink Details -->
				<div class="py-4 space-y-3">
					<h3 class="text-sm font-semibold">Backlink Details</h3>
					<div class="space-y-3">
						<div>
							<Label for="submitted-url" class="text-sm text-muted-foreground mb-1">Your URL</Label>
							{#if isEditingSubmittedUrl}
								<div class="flex gap-2">
									<Input
										id="submitted-url"
										type="url"
										placeholder="https://example.com/page"
										bind:value={submittedUrl}
										class="flex-1"
										disabled={savingSubmittedUrl}
									/>
									<Button
										size="sm"
										onclick={handleSaveSubmittedUrl}
										disabled={savingSubmittedUrl}
									>
										<CheckIcon class="size-4" />
									</Button>
									<Button
										variant="outline"
										size="sm"
										onclick={handleCancelEditSubmittedUrl}
										disabled={savingSubmittedUrl}
									>
										<XIcon class="size-4" />
									</Button>
								</div>
							{:else}
								{@const url = submission.submitted_url || submission.submission_page_url}
								<div class="flex items-center gap-2">
									{#if url}
										<a
											href={url}
											target="_blank"
											rel="noopener noreferrer"
											class="text-xs text-primary hover:underline flex items-center gap-1 flex-1"
										>
											{url}
											<ExternalLinkIcon class="size-3" />
										</a>
									{:else}
										<div class="text-xs font-medium flex-1">N/A</div>
									{/if}
									<Button
										variant="ghost"
										size="sm"
										onclick={() => (isEditingSubmittedUrl = true)}
									>
										Edit
									</Button>
								</div>
							{/if}
						</div>
						{#if submission.backlink_url}
							<div>
								<div class="text-sm text-muted-foreground mb-1">Backlink URL</div>
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
								<div class="text-sm text-muted-foreground mb-1">Anchor Text</div>
								<div class="font-medium">{submission.anchor_text}</div>
							</div>
						{/if}
						{#if submission.account_username}
							<div>
								<div class="text-sm text-muted-foreground mb-1">Account Username</div>
								<div class="font-medium">{submission.account_username}</div>
							</div>
						{/if}
					</div>
				</div>

				<Separator />

				<!-- Timeline -->
				<div class="py-4 space-y-3">
					<h3 class="text-sm font-semibold">Timeline</h3>
					<div class="space-y-2">
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
					</div>
				</div>

				{#if submission.referral_traffic || submission.conversion_count}
					<Separator />
					<!-- Performance -->
					<div class="py-4 space-y-3">
						<h3 class="text-sm font-semibold">Performance</h3>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<div class="text-sm text-muted-foreground mb-1">Referral Traffic</div>
								<div class="text-2xl font-bold">
									{(submission.referral_traffic || 0).toLocaleString()}
								</div>
							</div>
							<div>
								<div class="text-sm text-muted-foreground mb-1">Conversions</div>
								<div class="text-2xl font-bold">
									{(submission.conversion_count || 0).toLocaleString()}
								</div>
							</div>
						</div>
					</div>
				{/if}

				<Separator />

				<!-- Notes -->
				<div class="py-4 space-y-3">
					<h3 class="text-sm font-semibold">Notes</h3>
					<p class="text-sm whitespace-pre-line text-muted-foreground">
						{submission.notes || 'No notes added yet.'}
					</p>
				</div>
			</div>

			<Dialog.Footer>
				<Button variant="outline" onclick={() => onClose?.()}>Close</Button>
				<Button variant="outline" onclick={() => (updateModalOpen = true)}>
					Update Status
				</Button>
				<Button variant="outline" onclick={() => (noteModalOpen = true)}>
					Edit Notes
				</Button>
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
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>

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

