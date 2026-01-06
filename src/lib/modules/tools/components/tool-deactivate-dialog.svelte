<script lang="ts">
	import type { ToolWithActivation } from '$lib/types';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { toolsApi } from '$lib/api/tools-client.js';
	import { toast } from 'svelte-sonner';

	let {
		open = $bindable(false),
		tool,
		workspaceId,
		projectId,
		onDeactivated,
	}: {
		open?: boolean;
		tool: ToolWithActivation;
		workspaceId: string;
		projectId: string;
		onDeactivated?: () => void;
	} = $props();

	let isDeactivating = $state(false);

	async function handleDeactivate() {
		if (!tool.activation) return;

		isDeactivating = true;
		try {
			await toolsApi.deactivateTool(workspaceId, projectId, tool.id);
			toast.success(`${tool.name} deactivated successfully`);
			open = false;
			onDeactivated?.();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to deactivate tool');
		} finally {
			isDeactivating = false;
		}
	}
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Deactivate {tool.name}?</AlertDialog.Title>
			<AlertDialog.Description>
				This will permanently remove {tool.name} from this project. This action cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={isDeactivating}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={handleDeactivate} disabled={isDeactivating}>
				{isDeactivating ? 'Deactivating...' : 'Deactivate'}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

