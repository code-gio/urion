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
	import CompetitorModal from './CompetitorModal.svelte';
	import type { ProjectCompetitor } from '$lib/types/project-settings.js';
	import { toast } from 'svelte-sonner';
	import EditIcon from '@lucide/svelte/icons/edit';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';

	let {
		competitors = $bindable([]),
		workspaceId,
		projectId,
		canEdit = true,
		onSave
	}: {
		competitors?: ProjectCompetitor[];
		workspaceId: string;
		projectId: string;
		canEdit?: boolean;
		onSave?: () => void;
	} = $props();

	let editingCompetitor = $state<ProjectCompetitor | null>(null);
	let modalOpen = $state(false);
	let deletingCompetitor = $state<ProjectCompetitor | null>(null);
	let deleteModalOpen = $state(false);

	function openEditModal(competitor?: ProjectCompetitor) {
		editingCompetitor = competitor || null;
		modalOpen = true;
	}

	function openDeleteModal(competitor: ProjectCompetitor) {
		deletingCompetitor = competitor;
		deleteModalOpen = true;
	}

	async function handleDelete() {
		if (!deletingCompetitor) return;

		try {
			const response = await fetch(
				`/api/workspaces/${workspaceId}/projects/${projectId}/competitors?id=${deletingCompetitor.id}`,
				{
					method: 'DELETE'
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to delete competitor');
			}

			toast.success('Competitor deleted');
			competitors = competitors.filter((c) => c.id !== deletingCompetitor!.id);
			deleteModalOpen = false;
			deletingCompetitor = null;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to delete competitor');
		}
	}

	async function handleSave() {
		if (onSave) {
			onSave();
		}
		modalOpen = false;
		editingCompetitor = null;
	}
</script>

<div class="space-y-4">
	<div class="flex justify-between items-center">
		<h3 class="text-sm font-semibold">Competitors</h3>
		{#if canEdit}
			<Button size="sm" onclick={() => openEditModal()}>
				Add Competitor
			</Button>
		{/if}
	</div>

	{#if competitors.length === 0}
		<div class="text-center py-8 text-muted-foreground">
			<p>No competitors added yet</p>
			{#if canEdit}
				<Button size="sm" variant="outline" class="mt-2" onclick={() => openEditModal()}>
					Add your first competitor
				</Button>
			{/if}
		</div>
	{:else}
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Type</TableHead>
					<TableHead>Priority</TableHead>
					<TableHead>Website</TableHead>
					{#if canEdit}
						<TableHead class="w-[100px]">Actions</TableHead>
					{/if}
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each competitors as competitor}
					<TableRow>
						<TableCell class="font-medium">{competitor.name}</TableCell>
						<TableCell>
							<Badge variant="outline">{competitor.competitor_type}</Badge>
						</TableCell>
						<TableCell>
							<Badge variant="secondary">{competitor.priority}</Badge>
						</TableCell>
						<TableCell>
							{#if competitor.website_url}
								<a
									href={competitor.website_url}
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
									<Button size="sm" variant="ghost" onclick={() => openEditModal(competitor)}>
										<EditIcon class="h-4 w-4" />
									</Button>
									<Button
										size="sm"
										variant="ghost"
										onclick={() => openDeleteModal(competitor)}
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
	{/if}
</div>

<CompetitorModal
	bind:open={modalOpen}
	competitor={editingCompetitor}
	{workspaceId}
	{projectId}
	onSave={handleSave}
/>

<ConfirmDeleteModal
	bind:open={deleteModalOpen}
	title="Delete Competitor"
	description="Are you sure you want to delete this competitor? This action cannot be undone."
	onConfirm={handleDelete}
/>
