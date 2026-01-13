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
	import ConversionGoalModal from './ConversionGoalModal.svelte';
	import type { ProjectConversionGoal } from '$lib/types/project-settings.js';
	import { toast } from 'svelte-sonner';
	import EditIcon from '@lucide/svelte/icons/edit';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import TargetIcon from '@lucide/svelte/icons/target';

	let {
		goals = $bindable([]),
		workspaceId,
		projectId,
		canEdit = true
	}: {
		goals?: ProjectConversionGoal[];
		workspaceId: string;
		projectId: string;
		canEdit?: boolean;
	} = $props();

	let editingGoal = $state<ProjectConversionGoal | null>(null);
	let modalOpen = $state(false);
	let deletingGoal = $state<ProjectConversionGoal | null>(null);
	let deleteModalOpen = $state(false);

	function openEditModal(goal?: ProjectConversionGoal) {
		editingGoal = goal || null;
		modalOpen = true;
	}

	function openDeleteModal(goal: ProjectConversionGoal) {
		deletingGoal = goal;
		deleteModalOpen = true;
	}

	async function handleDelete() {
		if (!deletingGoal) return;

		try {
			const response = await fetch(
				`/api/workspaces/${workspaceId}/projects/${projectId}/conversion-goals?id=${deletingGoal.id}`,
				{
					method: 'DELETE'
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to delete conversion goal');
			}

			toast.success('Conversion goal deleted');
			goals = goals.filter((g) => g.id !== deletingGoal!.id);
			deleteModalOpen = false;
			deletingGoal = null;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to delete conversion goal');
		}
	}

	function handleSave(savedGoal: ProjectConversionGoal) {
		const index = goals.findIndex((g) => g.id === savedGoal.id);
		if (index >= 0) {
			goals[index] = savedGoal;
		} else {
			goals = [savedGoal, ...goals];
		}
		modalOpen = false;
		editingGoal = null;
	}
</script>

<div class="space-y-4">
	<div class="flex justify-between items-center">
		<h3 class="text-sm font-semibold">Conversion Goals</h3>
		{#if canEdit}
			<Button size="sm" onclick={() => openEditModal()}>
				Add Goal
			</Button>
		{/if}
	</div>

	{#if goals.length === 0}
		<div class="text-center py-8 text-muted-foreground">
			<p>No conversion goals added yet</p>
			{#if canEdit}
				<Button size="sm" variant="outline" class="mt-2" onclick={() => openEditModal()}>
					Add your first goal
				</Button>
			{/if}
		</div>
	{:else}
		<div class="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Type</TableHead>
						<TableHead>Event</TableHead>
						<TableHead>Value</TableHead>
						<TableHead>Status</TableHead>
						{#if canEdit}
							<TableHead class="w-[100px]">Actions</TableHead>
						{/if}
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each goals as goal}
						<TableRow>
							<TableCell class="font-medium">
								<div class="flex items-center gap-2">
									{goal.name}
									{#if goal.is_primary}
										<Badge variant="secondary" class="text-xs">Primary</Badge>
									{/if}
								</div>
							</TableCell>
							<TableCell>
								{#if goal.goal_type}
									<Badge variant="outline">{goal.goal_type}</Badge>
								{:else}
									<span class="text-muted-foreground">-</span>
								{/if}
							</TableCell>
							<TableCell>
								{#if goal.event_name}
									<span class="text-sm font-mono">{goal.event_name}</span>
								{:else}
									<span class="text-muted-foreground">-</span>
								{/if}
							</TableCell>
							<TableCell>
								{#if goal.value !== null}
									<span class="text-sm">{goal.value}</span>
								{:else}
									<span class="text-muted-foreground">-</span>
								{/if}
							</TableCell>
							<TableCell>
								<Badge variant="outline" class="flex items-center gap-1 w-fit">
									<TargetIcon class="h-3 w-3" />
									Active
								</Badge>
							</TableCell>
							{#if canEdit}
								<TableCell>
									<div class="flex items-center gap-2">
										<Button
											size="sm"
											variant="ghost"
											onclick={() => openEditModal(goal)}
										>
											<EditIcon class="h-4 w-4" />
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onclick={() => openDeleteModal(goal)}
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

	<ConversionGoalModal
		bind:open={modalOpen}
		goal={editingGoal}
		{workspaceId}
		{projectId}
		onSave={handleSave}
	/>

	<ConfirmDeleteModal
		bind:open={deleteModalOpen}
		title="Delete Conversion Goal"
		description="Are you sure you want to delete this conversion goal? This action cannot be undone."
		onConfirm={handleDelete}
	/>
</div>
