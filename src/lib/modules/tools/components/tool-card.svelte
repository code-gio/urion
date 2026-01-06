<script lang="ts">
	import type { ToolWithActivation } from '$lib/types';
	import { Card, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { getInitials } from '$lib/utils.js';
	import ToolActivateDialog from './tool-activate-dialog.svelte';
	import ToolDeactivateDialog from './tool-deactivate-dialog.svelte';
	import CheckIcon from '@lucide/svelte/icons/check';

	let {
		tool,
		workspaceId,
		projectId,
		onActivated,
		onDeactivated,
	}: {
		tool: ToolWithActivation;
		workspaceId: string;
		projectId: string;
		onActivated?: () => void;
		onDeactivated?: () => void;
	} = $props();

	let activateDialogOpen = $state(false);
	let deactivateDialogOpen = $state(false);

	function handleToggleClick() {
		if (tool.is_activated) {
			deactivateDialogOpen = true;
		} else {
			activateDialogOpen = true;
		}
	}

	function handleActivated() {
		activateDialogOpen = false;
		onActivated?.();
	}

	function handleDeactivated() {
		deactivateDialogOpen = false;
		onDeactivated?.();
	}

	const toolInitials = $derived(getInitials(tool.name));
</script>

<Card class="p-5 flex flex-col">
	<!-- Header -->
	<div class="flex justify-between items-start ">
		<div class="flex items-center justify-center size-9.5 border rounded-lg overflow-hidden ">
			{#if tool.icon_url}
				<img src={tool.icon_url} alt={tool.name} class="shrink-0 size-full object-contain rounded" />
			{:else}
				<Avatar.Root class="size-full rounded-lg">
					<Avatar.Fallback class="text-xs font-medium rounded-lg">
						{toolInitials}
					</Avatar.Fallback>
				</Avatar.Root>
			{/if}
		</div>

		<Button
			type="button"
			variant={tool.is_activated ? 'secondary' : 'outline'}
			size="sm"
			onclick={handleToggleClick}
			class="text-xs"
		>
			{#if tool.is_activated}
				<CheckIcon class="size-3.5" />
				Activated
			{:else}
				Activate
			{/if}
		</Button>
	</div>
	<!-- End Header -->

	<!-- Body -->
	<CardHeader class="p-0">
		<CardTitle class="text-base">{tool.name}</CardTitle>
		<CardDescription >
			{tool.description || 'No description available.'}
		</CardDescription>
	</CardHeader>
	<!-- End Body -->
</Card>

<ToolActivateDialog
	bind:open={activateDialogOpen}
	{tool}
	{workspaceId}
	{projectId}
	onActivated={handleActivated}
/>

<ToolDeactivateDialog
	bind:open={deactivateDialogOpen}
	{tool}
	{workspaceId}
	{projectId}
	onDeactivated={handleDeactivated}
/>

