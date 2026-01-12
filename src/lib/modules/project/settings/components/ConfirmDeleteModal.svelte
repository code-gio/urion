<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Button } from '$lib/components/ui/button';

	let {
		open = $bindable(false),
		title = 'Delete Item',
		description = 'Are you sure you want to delete this item? This action cannot be undone.',
		onConfirm,
		isDeleting = false
	}: {
		open?: boolean;
		title?: string;
		description?: string;
		onConfirm?: () => void | Promise<void>;
		isDeleting?: boolean;
	} = $props();

	async function handleConfirm() {
		if (onConfirm) {
			await onConfirm();
		}
		open = false;
	}
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{title}</AlertDialog.Title>
			<AlertDialog.Description>{description}</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel asChild let:builder>
				<Button builders={[builder]} variant="outline" disabled={isDeleting}>
					Cancel
				</Button>
			</AlertDialog.Cancel>
			<AlertDialog.Action asChild let:builder>
				<Button builders={[builder]} variant="destructive" onclick={handleConfirm} disabled={isDeleting}>
					{isDeleting ? 'Deleting...' : 'Delete'}
				</Button>
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
