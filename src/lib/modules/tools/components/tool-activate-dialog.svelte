<script lang="ts">
	import type { Tool } from '$lib/types';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { toolsApi } from '$lib/api/tools-client.js';
	import { toast } from 'svelte-sonner';

	let {
		open = $bindable(false),
		tool,
		workspaceId,
		projectId,
		onActivated,
	}: {
		open?: boolean;
		tool: Tool;
		workspaceId: string;
		projectId: string;
		onActivated?: () => void;
	} = $props();

	let isActivating = $state(false);

	async function handleActivate() {
		isActivating = true;
		try {
			await toolsApi.activateToolBySlug(workspaceId, projectId, tool.slug, tool.default_config || {});
			toast.success(`${tool.name} activated successfully`);
			open = false;
			onActivated?.();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to activate tool');
		} finally {
			isActivating = false;
		}
	}
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Activate {tool.name}?</AlertDialog.Title>
			<AlertDialog.Description>
				This will activate {tool.name} for this project. You can configure it after activation.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={isActivating}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={handleActivate} disabled={isActivating}>
				{isActivating ? 'Activating...' : 'Activate'}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

