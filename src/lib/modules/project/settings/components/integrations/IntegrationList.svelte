<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { ConfirmDeleteModal } from '../index.js';
	import IntegrationModal from './IntegrationModal.svelte';
	import type { ProjectIntegration, IntegrationType } from '$lib/types/project-settings.js';
	import { toast } from 'svelte-sonner';
	import EditIcon from '@lucide/svelte/icons/edit';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import PlugIcon from '@lucide/svelte/icons/plug';

	let {
		integrations = $bindable([]),
		workspaceId,
		projectId,
		canEdit = true
	}: {
		integrations?: ProjectIntegration[];
		workspaceId: string;
		projectId: string;
		canEdit?: boolean;
	} = $props();

	let editingIntegration = $state<ProjectIntegration | null>(null);
	let modalOpen = $state(false);
	let deletingIntegration = $state<ProjectIntegration | null>(null);
	let deleteModalOpen = $state(false);

	function openEditModal(integration?: ProjectIntegration) {
		editingIntegration = integration || null;
		modalOpen = true;
	}

	function openDeleteModal(integration: ProjectIntegration) {
		deletingIntegration = integration;
		deleteModalOpen = true;
	}

	async function handleDelete() {
		if (!deletingIntegration) return;

		try {
			const response = await fetch(
				`/api/workspaces/${workspaceId}/projects/${projectId}/integrations?id=${deletingIntegration.id}`,
				{
					method: 'DELETE'
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to delete integration');
			}

			toast.success('Integration deleted');
			integrations = integrations.filter((i) => i.id !== deletingIntegration!.id);
			deleteModalOpen = false;
			deletingIntegration = null;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to delete integration');
		}
	}

	function handleSave(savedIntegration: ProjectIntegration) {
		const index = integrations.findIndex((i) => i.id === savedIntegration.id);
		if (index >= 0) {
			integrations[index] = savedIntegration;
		} else {
			integrations = [savedIntegration, ...integrations];
		}
		modalOpen = false;
		editingIntegration = null;
	}

	const integrationTypeLabels: Record<IntegrationType, string> = {
		analytics: 'Analytics',
		crm: 'CRM',
		cms: 'CMS',
		ads: 'Ads',
		email: 'Email',
		payment: 'Payment',
		support: 'Support',
		ab_testing: 'A/B Testing',
		other: 'Other'
	};
</script>

<div class="space-y-4">
	<div class="flex justify-between items-center">
		<h3 class="text-sm font-semibold">Integrations</h3>
		{#if canEdit}
			<Button size="sm" onclick={() => openEditModal()}>
				Add Integration
			</Button>
		{/if}
	</div>

	{#if integrations.length === 0}
		<div class="text-center py-8 text-muted-foreground">
			<p>No integrations added yet</p>
			{#if canEdit}
				<Button size="sm" variant="outline" class="mt-2" onclick={() => openEditModal()}>
					Add your first integration
				</Button>
			{/if}
		</div>
	{:else}
		<div class="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Provider</TableHead>
						<TableHead>Type</TableHead>
						<TableHead>Account ID</TableHead>
						<TableHead>Status</TableHead>
						{#if canEdit}
							<TableHead class="w-[100px]">Actions</TableHead>
						{/if}
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each integrations as integration}
						<TableRow>
							<TableCell class="font-medium">
								<div class="flex items-center gap-2">
									<PlugIcon class="h-4 w-4 text-muted-foreground" />
									{integration.provider}
								</div>
							</TableCell>
							<TableCell>
								<Badge variant="outline">
									{integrationTypeLabels[integration.integration_type] || integration.integration_type}
								</Badge>
							</TableCell>
							<TableCell>
								{#if integration.external_account_id}
									<span class="text-sm font-mono text-muted-foreground">
										{integration.external_account_id}
									</span>
								{:else}
									<span class="text-muted-foreground">-</span>
								{/if}
							</TableCell>
							<TableCell>
								<Badge variant={integration.status === 'active' ? 'default' : 'secondary'}>
									{integration.status}
								</Badge>
							</TableCell>
							{#if canEdit}
								<TableCell>
									<div class="flex items-center gap-2">
										<Button
											size="sm"
											variant="ghost"
											onclick={() => openEditModal(integration)}
										>
											<EditIcon class="h-4 w-4" />
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onclick={() => openDeleteModal(integration)}
										>
											<TrashIcon class="h-4 w-4" />
										</Button>
									</div>
								</TableCell>
							{/if}
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</div>
	{/if}

	<IntegrationModal
		bind:open={modalOpen}
		integration={editingIntegration}
		{workspaceId}
		{projectId}
		onSave={handleSave}
	/>

	<ConfirmDeleteModal
		bind:open={deleteModalOpen}
		title="Delete Integration"
		description="Are you sure you want to delete this integration? This action cannot be undone."
		onConfirm={handleDelete}
	/>
</div>
