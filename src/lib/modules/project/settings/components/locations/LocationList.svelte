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
	import LocationModal from './LocationModal.svelte';
	import type { ProjectLocation } from '$lib/types/project-settings.js';
	import { toast } from 'svelte-sonner';
	import EditIcon from '@lucide/svelte/icons/edit';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';

	let {
		locations = $bindable([]),
		workspaceId,
		projectId,
		canEdit = true
	}: {
		locations?: ProjectLocation[];
		workspaceId: string;
		projectId: string;
		canEdit?: boolean;
	} = $props();

	let editingLocation = $state<ProjectLocation | null>(null);
	let modalOpen = $state(false);
	let deletingLocation = $state<ProjectLocation | null>(null);
	let deleteModalOpen = $state(false);

	function openEditModal(location?: ProjectLocation) {
		editingLocation = location || null;
		modalOpen = true;
	}

	function openDeleteModal(location: ProjectLocation) {
		deletingLocation = location;
		deleteModalOpen = true;
	}

	async function handleDelete() {
		if (!deletingLocation) return;

		try {
			const response = await fetch(
				`/api/workspaces/${workspaceId}/projects/${projectId}/locations?id=${deletingLocation.id}`,
				{
					method: 'DELETE'
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to delete location');
			}

			toast.success('Location deleted');
			locations = locations.filter((l) => l.id !== deletingLocation!.id);
			deleteModalOpen = false;
			deletingLocation = null;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to delete location');
		}
	}

	function handleSave(savedLocation: ProjectLocation) {
		const index = locations.findIndex((l) => l.id === savedLocation.id);
		if (index >= 0) {
			locations[index] = savedLocation;
		} else {
			locations = [savedLocation, ...locations];
		}
		modalOpen = false;
		editingLocation = null;
	}
</script>

<div class="space-y-4">
	<div class="flex justify-between items-center">
		<h3 class="text-sm font-semibold">Locations</h3>
		{#if canEdit}
			<Button size="sm" onclick={() => openEditModal()}>
				Add Location
			</Button>
		{/if}
	</div>

	{#if locations.length === 0}
		<div class="text-center py-8 text-muted-foreground">
			<p>No locations added yet</p>
			{#if canEdit}
				<Button size="sm" variant="outline" class="mt-2" onclick={() => openEditModal()}>
					Add your first location
				</Button>
			{/if}
		</div>
	{:else}
		<div class="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Address</TableHead>
						<TableHead>Contact</TableHead>
						<TableHead>Status</TableHead>
						{#if canEdit}
							<TableHead class="w-[100px]">Actions</TableHead>
						{/if}
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each locations as location}
						<TableRow>
							<TableCell class="font-medium">
								<div class="flex items-center gap-2">
									{location.name || 'Unnamed Location'}
									{#if location.is_primary}
										<Badge variant="secondary" class="text-xs">Primary</Badge>
									{/if}
								</div>
							</TableCell>
							<TableCell class="max-w-xs">
								{#if location.address_line1 || location.city}
									<div class="text-sm">
										{#if location.address_line1}
											<div>{location.address_line1}</div>
										{/if}
										{#if location.city || location.region || location.postal_code}
											<div class="text-muted-foreground">
												{location.city}{location.city && location.region ? ', ' : ''}{location.region}{location.postal_code ? ` ${location.postal_code}` : ''}
											</div>
										{/if}
										{#if location.country}
											<div class="text-muted-foreground">{location.country}</div>
										{/if}
									</div>
								{:else}
									<span class="text-muted-foreground">-</span>
								{/if}
							</TableCell>
							<TableCell>
								<div class="text-sm space-y-1">
									{#if location.phone}
										<div>{location.phone}</div>
									{/if}
									{#if location.email}
										<div class="text-muted-foreground">{location.email}</div>
									{/if}
									{#if !location.phone && !location.email}
										<span class="text-muted-foreground">-</span>
									{/if}
								</div>
							</TableCell>
							<TableCell>
								{#if location.lat && location.lng}
									<Badge variant="outline" class="flex items-center gap-1 w-fit">
										<MapPinIcon class="h-3 w-3" />
										Has coordinates
									</Badge>
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
											onclick={() => openEditModal(location)}
										>
											<EditIcon class="h-4 w-4" />
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onclick={() => openDeleteModal(location)}
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

	<LocationModal
		bind:open={modalOpen}
		location={editingLocation}
		{workspaceId}
		{projectId}
		onSave={handleSave}
	/>

	<ConfirmDeleteModal
		bind:open={deleteModalOpen}
		title="Delete Location"
		description="Are you sure you want to delete this location? This action cannot be undone."
		onConfirm={handleDelete}
	/>
</div>
