<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { ConfirmDeleteModal } from '../index.js';
	import PersonaModal from './PersonaModal.svelte';
	import type { ProjectPersona } from '$lib/types/project-settings.js';
	import { toast } from 'svelte-sonner';
	import EditIcon from '@lucide/svelte/icons/edit';
	import TrashIcon from '@lucide/svelte/icons/trash-2';

	let {
		personas = $bindable([]),
		workspaceId,
		projectId,
		canEdit = true
	}: {
		personas?: ProjectPersona[];
		workspaceId: string;
		projectId: string;
		canEdit?: boolean;
	} = $props();

	let editingPersona = $state<ProjectPersona | null>(null);
	let modalOpen = $state(false);
	let deletingPersona = $state<ProjectPersona | null>(null);
	let deleteModalOpen = $state(false);

	function openEditModal(persona?: ProjectPersona) {
		editingPersona = persona || null;
		modalOpen = true;
	}

	function openDeleteModal(persona: ProjectPersona) {
		deletingPersona = persona;
		deleteModalOpen = true;
	}

	async function handleDelete() {
		if (!deletingPersona) return;

		try {
			const response = await fetch(
				`/api/workspaces/${workspaceId}/projects/${projectId}/personas?id=${deletingPersona.id}`,
				{
					method: 'DELETE'
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to delete persona');
			}

			toast.success('Persona deleted');
			personas = personas.filter((p) => p.id !== deletingPersona!.id);
			deleteModalOpen = false;
			deletingPersona = null;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to delete persona');
		}
	}

	function handleSave(savedPersona: ProjectPersona) {
		const index = personas.findIndex((p) => p.id === savedPersona.id);
		if (index >= 0) {
			personas[index] = savedPersona;
		} else {
			personas = [savedPersona, ...personas];
		}
		modalOpen = false;
		editingPersona = null;
	}
</script>

<div class="space-y-4">
	<div class="flex justify-between items-center">
		<h3 class="text-sm font-semibold">Personas</h3>
		{#if canEdit}
			<Button size="sm" onclick={() => openEditModal()}>
				Add Persona
			</Button>
		{/if}
	</div>

	{#if personas.length === 0}
		<div class="text-center py-8 text-muted-foreground">
			<p>No personas added yet</p>
			{#if canEdit}
				<Button size="sm" variant="outline" class="mt-2" onclick={() => openEditModal()}>
					Add your first persona
				</Button>
			{/if}
		</div>
	{:else}
		<div class="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Description</TableHead>
						<TableHead>Pain Points</TableHead>
						<TableHead>Desired Outcomes</TableHead>
						{#if canEdit}
							<TableHead class="w-[100px]">Actions</TableHead>
						{/if}
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each personas as persona}
						<TableRow>
							<TableCell class="font-medium">{persona.name}</TableCell>
							<TableCell class="max-w-xs truncate">{persona.description || '-'}</TableCell>
							<TableCell>
								{#if persona.pain_points && persona.pain_points.length > 0}
									<span class="text-sm text-muted-foreground">
										{persona.pain_points.length} point{persona.pain_points.length !== 1 ? 's' : ''}
									</span>
								{:else}
									<span class="text-muted-foreground">-</span>
								{/if}
							</TableCell>
							<TableCell>
								{#if persona.desired_outcomes && persona.desired_outcomes.length > 0}
									<span class="text-sm text-muted-foreground">
										{persona.desired_outcomes.length} outcome{persona.desired_outcomes.length !== 1 ? 's' : ''}
									</span>
								{:else}
									<span class="text-muted-foreground">-</span>
								{/if}
							</TableCell>
							{#if canEdit}
								<TableCell>
									<div class="flex items-center gap-2">
										<Button
											size="sm"
											variant="ghost"
											onclick={() => openEditModal(persona)}
										>
											<EditIcon class="h-4 w-4" />
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onclick={() => openDeleteModal(persona)}
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

	<PersonaModal
		bind:open={modalOpen}
		persona={editingPersona}
		{workspaceId}
		{projectId}
		onSave={handleSave}
	/>

	<ConfirmDeleteModal
		bind:open={deleteModalOpen}
		title="Delete Persona"
		description="Are you sure you want to delete this persona? This action cannot be undone."
		onConfirm={handleDelete}
	/>
</div>
