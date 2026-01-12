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
	import OfferingModal from './OfferingModal.svelte';
	import type { ProjectOffering } from '$lib/types/project-settings.js';
	import { toast } from 'svelte-sonner';
	import EditIcon from '@lucide/svelte/icons/edit';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';

	let {
		offerings = $bindable([]),
		workspaceId,
		projectId,
		canEdit = true
	}: {
		offerings?: ProjectOffering[];
		workspaceId: string;
		projectId: string;
		canEdit?: boolean;
	} = $props();

	let editingOffering = $state<ProjectOffering | null>(null);
	let modalOpen = $state(false);
	let deletingOffering = $state<ProjectOffering | null>(null);
	let deleteModalOpen = $state(false);

	function openEditModal(offering?: ProjectOffering) {
		editingOffering = offering || null;
		modalOpen = true;
	}

	function openDeleteModal(offering: ProjectOffering) {
		deletingOffering = offering;
		deleteModalOpen = true;
	}

	async function handleDelete() {
		if (!deletingOffering) return;

		try {
			const response = await fetch(
				`/api/workspaces/${workspaceId}/projects/${projectId}/offerings?id=${deletingOffering.id}`,
				{
					method: 'DELETE'
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to delete offering');
			}

			toast.success('Offering deleted');
			offerings = offerings.filter((o) => o.id !== deletingOffering!.id);
			deleteModalOpen = false;
			deletingOffering = null;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to delete offering');
		}
	}

	function handleSave(savedOffering: ProjectOffering) {
		const index = offerings.findIndex((o) => o.id === savedOffering.id);
		if (index >= 0) {
			offerings[index] = savedOffering;
		} else {
			offerings = [savedOffering, ...offerings];
		}
		modalOpen = false;
		editingOffering = null;
	}
</script>

<div class="space-y-4">
	<div class="flex justify-between items-center">
		<h3 class="text-sm font-semibold">Offerings</h3>
		{#if canEdit}
			<Button size="sm" onclick={() => openEditModal()}>
				Add Offering
			</Button>
		{/if}
	</div>

	{#if offerings.length === 0}
		<div class="text-center py-8 text-muted-foreground">
			<p>No offerings added yet</p>
			{#if canEdit}
				<Button size="sm" variant="outline" class="mt-2" onclick={() => openEditModal()}>
					Add your first offering
				</Button>
			{/if}
		</div>
	{:else}
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Type</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>URL</TableHead>
					{#if canEdit}
						<TableHead class="w-[100px]">Actions</TableHead>
					{/if}
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each offerings as offering}
					<TableRow>
						<TableCell class="font-medium">{offering.name}</TableCell>
						<TableCell>
							{#if offering.offering_type}
								<Badge variant="outline">{offering.offering_type}</Badge>
							{:else}
								<span class="text-sm text-muted-foreground">-</span>
							{/if}
						</TableCell>
						<TableCell>
							{#if offering.is_primary}
								<Badge>Primary</Badge>
							{:else}
								<span class="text-sm text-muted-foreground">-</span>
							{/if}
						</TableCell>
						<TableCell>
							{#if offering.url}
								<a
									href={offering.url}
									target="_blank"
									rel="noopener noreferrer"
									class="text-sm text-primary hover:underline flex items-center gap-1"
								>
									Visit
									<ExternalLinkIcon class="h-3 w-3" />
								</a>
							{:else}
								<span class="text-sm text-muted-foreground">-</span>
							{/if}
						</TableCell>
						{#if canEdit}
							<TableCell>
								<div class="flex gap-2">
									<Button size="sm" variant="ghost" onclick={() => openEditModal(offering)}>
										<EditIcon class="h-4 w-4" />
									</Button>
									<Button size="sm" variant="ghost" onclick={() => openDeleteModal(offering)}>
										<TrashIcon class="h-4 w-4" />
									</Button>
								</div>
							</TableCell>
						{/if}
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	{/if}
</div>

<OfferingModal
	bind:open={modalOpen}
	offering={editingOffering}
	{workspaceId}
	{projectId}
	onSave={handleSave}
/>

<ConfirmDeleteModal
	bind:open={deleteModalOpen}
	title="Delete Offering"
	description="Are you sure you want to delete this offering? This action cannot be undone."
	onConfirm={handleDelete}
/>
