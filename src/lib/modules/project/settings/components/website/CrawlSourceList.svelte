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
	import CrawlSourceModal from './CrawlSourceModal.svelte';
	import type { ProjectCrawlSource } from '$lib/types/project-settings.js';
	import { toast } from 'svelte-sonner';
	import EditIcon from '@lucide/svelte/icons/edit';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';

	let {
		sources = $bindable([]),
		workspaceId,
		projectId,
		canEdit = true,
		onSave
	}: {
		sources?: ProjectCrawlSource[];
		workspaceId: string;
		projectId: string;
		canEdit?: boolean;
		onSave?: () => void;
	} = $props();

	let editingSource = $state<ProjectCrawlSource | null>(null);
	let modalOpen = $state(false);
	let deletingSource = $state<ProjectCrawlSource | null>(null);
	let deleteModalOpen = $state(false);

	function openEditModal(source?: ProjectCrawlSource) {
		editingSource = source || null;
		modalOpen = true;
	}

	function openDeleteModal(source: ProjectCrawlSource) {
		deletingSource = source;
		deleteModalOpen = true;
	}

	async function handleDelete() {
		if (!deletingSource) return;

		try {
			const response = await fetch(
				`/api/workspaces/${workspaceId}/projects/${projectId}/crawl-sources?id=${deletingSource.id}`,
				{
					method: 'DELETE'
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to delete crawl source');
			}

			toast.success('Crawl source deleted');
			sources = sources.filter((s) => s.id !== deletingSource!.id);
			deleteModalOpen = false;
			deletingSource = null;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to delete crawl source');
		}
	}

	function handleSave(savedSource: ProjectCrawlSource) {
		// Update local array
		const index = sources.findIndex(s => s.id === savedSource.id);
		if (index >= 0) {
			// Update existing
			sources[index] = savedSource;
		} else {
			// Add new
			sources = [savedSource, ...sources];
		}
		modalOpen = false;
		editingSource = null;
	}
</script>

<div class="space-y-4">
	<div class="flex justify-between items-center">
		<h3 class="text-sm font-semibold">Crawl Sources</h3>
		{#if canEdit}
			<Button size="sm" onclick={() => openEditModal()}>
				Add Source
			</Button>
		{/if}
	</div>

	{#if sources.length === 0}
		<div class="text-center py-8 text-muted-foreground">
			<p>No crawl sources configured</p>
			{#if canEdit}
				<Button size="sm" variant="outline" class="mt-2" onclick={() => openEditModal()}>
					Add your first source
				</Button>
			{/if}
		</div>
	{:else}
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Type</TableHead>
					<TableHead>URL</TableHead>
					<TableHead>Status</TableHead>
					{#if canEdit}
						<TableHead class="w-[100px]">Actions</TableHead>
					{/if}
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each sources as source}
					<TableRow>
						<TableCell>
							<Badge variant="outline">{source.source_type}</Badge>
						</TableCell>
						<TableCell>
							<a
								href={source.url}
								target="_blank"
								rel="noopener noreferrer"
								class="text-sm text-primary hover:underline flex items-center gap-1"
							>
								{source.url}
								<ExternalLinkIcon class="h-3 w-3" />
							</a>
						</TableCell>
						<TableCell>
							{#if source.is_primary}
								<Badge>Primary</Badge>
							{:else}
								<span class="text-sm text-muted-foreground">-</span>
							{/if}
						</TableCell>
						{#if canEdit}
							<TableCell>
								<div class="flex gap-2">
									<Button
										size="sm"
										variant="ghost"
										onclick={() => openEditModal(source)}
									>
										<EditIcon class="h-4 w-4" />
									</Button>
									<Button
										size="sm"
										variant="ghost"
										onclick={() => openDeleteModal(source)}
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

<CrawlSourceModal
	bind:open={modalOpen}
	source={editingSource}
	{workspaceId}
	{projectId}
	onSave={handleSave}
/>

<ConfirmDeleteModal
	bind:open={deleteModalOpen}
	title="Delete Crawl Source"
	description="Are you sure you want to delete this crawl source? This action cannot be undone."
	onConfirm={handleDelete}
/>
