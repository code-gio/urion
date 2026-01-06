<script lang="ts">
	import type { BacklinkSubmission } from '$lib/types';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';

	let {
		submission,
		open = false,
		onClose,
		onSave,
		loading = false,
	}: {
		submission: BacklinkSubmission;
		open?: boolean;
		onClose: () => void;
		onSave: (notes: string) => void;
		loading?: boolean;
	} = $props();

	let notes = $state(submission.notes || '');
</script>

<Dialog.Root bind:open onOpenChange={(open) => !open && onClose()}>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Add Note</Dialog.Title>
			<Dialog.Description>Add or update notes for this submission.</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="notes">Notes</Label>
				<Textarea id="notes" placeholder="Add your notes here..." bind:value={notes} rows={6} />
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={onClose} disabled={loading}>Cancel</Button>
			<Button onclick={() => onSave(notes)} disabled={loading}>
				{loading ? 'Saving...' : 'Save'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

