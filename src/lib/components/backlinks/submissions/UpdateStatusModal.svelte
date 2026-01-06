<script lang="ts">
	import type { BacklinkSubmission, UpdateSubmissionRequest, SubmissionStatus } from '$lib/types';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Select from '$lib/components/ui/select/index.js';
	import { SUBMISSION_STATUSES } from '$lib/types/backlinks';
	import { validateURL } from '$lib/utils/validation.js';

	let {
		submission,
		open = false,
		onClose,
		onConfirm,
		loading = false,
	}: {
		submission: BacklinkSubmission;
		open?: boolean;
		onClose: () => void;
		onConfirm: (data: UpdateSubmissionRequest) => void;
		loading?: boolean;
	} = $props();

	let status = $state<SubmissionStatus>(submission.status);
	let backlinkUrl = $state(submission.backlink_url || '');
	let anchorText = $state(submission.anchor_text || '');
	let accountUsername = $state(submission.account_username || '');
	let accountEmail = $state(submission.account_email || '');
	let notes = $state(submission.notes || '');
	let isLive = $state(submission.is_live || false);
	let error = $state<string | null>(null);

	const statusLabel = $derived(SUBMISSION_STATUSES[status]?.label || status);

	function handleSubmit() {
		error = null;

		// Validate URLs if provided
		if (backlinkUrl && status === 'approved') {
			try {
				validateURL(backlinkUrl);
			} catch (err) {
				error = err instanceof Error ? err.message : 'Invalid backlink URL';
				return;
			}
		}

		const data: UpdateSubmissionRequest = {
			status,
			is_live: isLive,
			...(backlinkUrl && { backlink_url: backlinkUrl }),
			...(anchorText && { anchor_text: anchorText }),
			...(accountUsername && { account_username: accountUsername }),
			...(accountEmail && { account_email: accountEmail }),
			...(notes && { notes }),
		};

		onConfirm(data);
	}

	function resetForm() {
		status = submission.status;
		backlinkUrl = submission.backlink_url || '';
		anchorText = submission.anchor_text || '';
		accountUsername = submission.account_username || '';
		accountEmail = submission.account_email || '';
		notes = submission.notes || '';
		isLive = submission.is_live || false;
		error = null;
	}
</script>

<Dialog.Root bind:open onOpenChange={(open) => !open && onClose()}>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Update Submission Status</Dialog.Title>
			<Dialog.Description>Update the status and details of this backlink submission.</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			{#if error}
				<div class="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>
			{/if}

			<div class="space-y-2">
				<Label for="status">Status</Label>
				<Select.Root
					type="single"
					bind:value={status}
					onSelectedChange={(selected) => {
						if (selected?.value) status = selected.value as SubmissionStatus;
					}}
				>
					<Select.Trigger id="status">
						{statusLabel}
					</Select.Trigger>
					<Select.Content>
						{#each Object.entries(SUBMISSION_STATUSES) as [key, { label }]}
							<Select.Item value={key} {label}>{label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			{#if status === 'approved' || status === 'submitted'}
				<div class="space-y-2">
					<Label for="backlink-url">Backlink URL</Label>
					<Input
						id="backlink-url"
						type="url"
						placeholder="https://example.com/backlink"
						bind:value={backlinkUrl}
					/>
				</div>

				<div class="space-y-2">
					<Label for="anchor-text">Anchor Text</Label>
					<Input id="anchor-text" placeholder="Link text" bind:value={anchorText} />
				</div>
			{/if}

			<div class="space-y-2">
				<Label for="account-username">Account Username</Label>
				<Input id="account-username" placeholder="Username used" bind:value={accountUsername} />
			</div>

			<div class="space-y-2">
				<Label for="account-email">Account Email</Label>
				<Input id="account-email" type="email" placeholder="Email used" bind:value={accountEmail} />
			</div>

			<div class="space-y-2">
				<Label for="notes">Notes</Label>
				<Textarea id="notes" placeholder="Add notes..." bind:value={notes} rows={4} />
			</div>

			<div class="flex items-center space-x-2">
				<Checkbox id="is-live" checked={isLive} onCheckedChange={(checked) => (isLive = !!checked)} />
				<Label for="is-live" class="text-sm font-normal cursor-pointer">Mark as live</Label>
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={onClose} disabled={loading}>Cancel</Button>
			<Button onclick={handleSubmit} disabled={loading}>
				{loading ? 'Updating...' : 'Update'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

