<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Button } from '$lib/components/ui/button';

	let {
		open = $bindable(false),
		title = 'Delete Item',
		description = 'Are you sure you want to delete this item? This action cannot be undone.',
		onConfirm
	}: {
		open?: boolean;
		title?: string;
		description?: string;
		onConfirm?: () => void | Promise<void>;
	} = $props();

	let isDeleting = $state(false);

	async function handleConfirm() {
		if (onConfirm && !isDeleting) {
			isDeleting = true;
			try {
				await onConfirm();
				open = false;
			} catch (error) {
				console.error('Delete error:', error);
			} finally {
				isDeleting = false;
			}
		}
	}
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{title}</AlertDialog.Title>
			<AlertDialog.Description>{description}</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={isDeleting}>
				Cancel
			</AlertDialog.Cancel>
			<AlertDialog.Action onclick={handleConfirm} disabled={isDeleting} class="bg-destructive hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 text-white shadow-xs">
				{isDeleting ? 'Deleting...' : 'Delete'}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
