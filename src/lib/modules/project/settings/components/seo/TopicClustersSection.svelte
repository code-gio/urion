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
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { ConfirmDeleteModal } from '../index.js';
	import type { ProjectTopicCluster } from '$lib/types/project-settings.js';
	import { toast } from 'svelte-sonner';
	import EditIcon from '@lucide/svelte/icons/edit';
	import TrashIcon from '@lucide/svelte/icons/trash-2';

	let {
		clusters = $bindable([]),
		workspaceId,
		projectId,
		canEdit = true
	}: {
		clusters?: ProjectTopicCluster[];
		workspaceId: string;
		projectId: string;
		canEdit?: boolean;
	} = $props();

	let editingCluster = $state<ProjectTopicCluster | null>(null);
	let modalOpen = $state(false);
	let deletingCluster = $state<ProjectTopicCluster | null>(null);
	let deleteModalOpen = $state(false);

	let name = $state('');
	let description = $state('');
	let isPillar = $state(false);
	let notes = $state('');
	let isSaving = $state(false);

	function openEditModal(cluster?: ProjectTopicCluster) {
		if (cluster) {
			name = cluster.name;
			description = cluster.description || '';
			isPillar = cluster.is_pillar;
			notes = cluster.notes || '';
			editingCluster = cluster;
		} else {
			name = '';
			description = '';
			isPillar = false;
			notes = '';
			editingCluster = null;
		}
		modalOpen = true;
	}

	function openDeleteModal(cluster: ProjectTopicCluster) {
		deletingCluster = cluster;
		deleteModalOpen = true;
	}

	async function handleSave() {
		if (!name.trim()) {
			toast.error('Name is required');
			return;
		}

		isSaving = true;

		try {
			const urlToUse = editingCluster?.id
				? `/api/workspaces/${workspaceId}/projects/${projectId}/topic-clusters?id=${editingCluster.id}`
				: `/api/workspaces/${workspaceId}/projects/${projectId}/topic-clusters`;

			const method = editingCluster?.id ? 'PATCH' : 'POST';

			const response = await fetch(urlToUse, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: name.trim(),
					description: description.trim() || null,
					is_pillar: isPillar,
					notes: notes.trim() || null
				})
			});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to save topic cluster');
		}

		const savedCluster = await response.json();
		toast.success(editingCluster?.id ? 'Topic cluster updated' : 'Topic cluster created');
		
		// Update local array
		const index = clusters.findIndex(c => c.id === savedCluster.id);
		if (index >= 0) {
			clusters[index] = savedCluster;
		} else {
			clusters = [savedCluster, ...clusters];
		}
		
		modalOpen = false;
	} catch (error) {
		toast.error(error instanceof Error ? error.message : 'Failed to save topic cluster');
	} finally {
		isSaving = false;
	}
}

	async function handleDelete() {
		if (!deletingCluster) return;

		try {
			const response = await fetch(
				`/api/workspaces/${workspaceId}/projects/${projectId}/topic-clusters?id=${deletingCluster.id}`,
				{
					method: 'DELETE'
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to delete topic cluster');
			}

		toast.success('Topic cluster deleted');
		clusters = clusters.filter((c) => c.id !== deletingCluster!.id);
		deleteModalOpen = false;
		deletingCluster = null;
	} catch (error) {
		toast.error(error instanceof Error ? error.message : 'Failed to delete topic cluster');
	}
}

</script>

<div class="space-y-4">
	<div class="flex justify-between items-center">
		<h3 class="text-sm font-semibold">Topic Clusters</h3>
		{#if canEdit}
			<Button size="sm" onclick={() => openEditModal()}>
				Add Cluster
			</Button>
		{/if}
	</div>

	{#if clusters.length === 0}
		<div class="text-center py-8 text-muted-foreground">
			<p>No topic clusters configured</p>
			{#if canEdit}
				<Button size="sm" variant="outline" class="mt-2" onclick={() => openEditModal()}>
					Add your first cluster
				</Button>
			{/if}
		</div>
	{:else}
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Type</TableHead>
					<TableHead>Description</TableHead>
					{#if canEdit}
						<TableHead class="w-[100px]">Actions</TableHead>
					{/if}
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each clusters as cluster}
					<TableRow>
						<TableCell class="font-medium">{cluster.name}</TableCell>
						<TableCell>
							{#if cluster.is_pillar}
								<Badge>Pillar</Badge>
							{:else}
								<Badge variant="outline">Cluster</Badge>
							{/if}
						</TableCell>
						<TableCell class="text-sm text-muted-foreground">
							{cluster.description || '-'}
						</TableCell>
						{#if canEdit}
							<TableCell>
								<div class="flex gap-2">
									<Button size="sm" variant="ghost" onclick={() => openEditModal(cluster)}>
										<EditIcon class="h-4 w-4" />
									</Button>
									<Button size="sm" variant="ghost" onclick={() => openDeleteModal(cluster)}>
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

<Dialog.Root bind:open={modalOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>{editingCluster?.id ? 'Edit Topic Cluster' : 'Add Topic Cluster'}</Dialog.Title>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="cluster-name">Name *</Label>
				<Input id="cluster-name" bind:value={name} placeholder="Cluster Name" required />
			</div>

			<div class="space-y-2">
				<Label for="cluster-description">Description</Label>
				<Textarea
					id="cluster-description"
					bind:value={description}
					placeholder="Describe this topic cluster"
					rows="3"
				/>
			</div>

			<div class="flex items-center space-x-2">
				<Checkbox id="is-pillar" bind:checked={isPillar} />
				<Label for="is-pillar" class="cursor-pointer">Mark as pillar topic</Label>
			</div>

			<div class="space-y-2">
				<Label for="cluster-notes">Notes</Label>
				<Textarea id="cluster-notes" bind:value={notes} placeholder="Additional notes" rows="2" />
			</div>
		</div>

		<Dialog.Footer>
			<Dialog.Close>
				<Button variant="outline" disabled={isSaving}>
					Cancel
				</Button>
			</Dialog.Close>
			<Button onclick={handleSave} disabled={isSaving || !name.trim()}>
				{isSaving ? 'Saving...' : editingCluster?.id ? 'Update' : 'Create'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<ConfirmDeleteModal
	bind:open={deleteModalOpen}
	title="Delete Topic Cluster"
	description="Are you sure you want to delete this topic cluster? This action cannot be undone."
	onConfirm={handleDelete}
/>
