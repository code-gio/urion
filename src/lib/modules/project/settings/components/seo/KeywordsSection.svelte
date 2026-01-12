<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import * as Select from '$lib/components/ui/select/index.js';
	import { ConfirmDeleteModal } from '../index.js';
	import KeywordBulkAddModal from './KeywordBulkAddModal.svelte';
	import type { ProjectKeyword, KeywordIntent, ProjectTopicCluster } from '$lib/types/project-settings.js';
	import { toast } from 'svelte-sonner';
	import TrashIcon from '@lucide/svelte/icons/trash-2';

	let {
		keywords = $bindable([]),
		clusters = [],
		workspaceId,
		projectId,
		canEdit = true,
		onSave
	}: {
		keywords?: ProjectKeyword[];
		clusters?: ProjectTopicCluster[];
		workspaceId: string;
		projectId: string;
		canEdit?: boolean;
		onSave?: () => void;
	} = $props();

	let searchTerm = $state('');
	let filterCluster = $state('');
	let filterIntent = $state('');
	let filterLocale = $state('');
	let filterPriority = $state('');
	let bulkModalOpen = $state(false);
	let deletingKeyword = $state<ProjectKeyword | null>(null);
	let deleteModalOpen = $state(false);
	let selectedKeywords = $state<Set<string>>(new Set());

	const clusterFilterLabel = $derived(
		filterCluster
			? clusters.find((c) => c.id === filterCluster)?.name || 'All clusters'
			: 'All clusters'
	);
	const intentFilterLabel = $derived(
		filterIntent
			? filterIntent === 'informational'
				? 'Informational'
				: filterIntent === 'commercial'
					? 'Commercial'
					: filterIntent === 'transactional'
						? 'Transactional'
						: filterIntent === 'navigational'
							? 'Navigational'
							: filterIntent === 'local'
								? 'Local'
								: 'Unknown'
			: 'All intents'
	);
	const priorityFilterLabel = $derived(filterPriority ? `Priority ${filterPriority}` : 'All priorities');

	const filteredKeywords = $derived(
		keywords.filter((kw) => {
			if (searchTerm && !kw.keyword.toLowerCase().includes(searchTerm.toLowerCase())) {
				return false;
			}
			if (filterCluster && kw.cluster_id !== filterCluster) {
				return false;
			}
			if (filterIntent && kw.intent !== filterIntent) {
				return false;
			}
			if (filterLocale && kw.locale !== filterLocale) {
				return false;
			}
			if (filterPriority && kw.priority.toString() !== filterPriority) {
				return false;
			}
			return true;
		})
	);

	function toggleSelection(keywordId: string) {
		if (selectedKeywords.has(keywordId)) {
			selectedKeywords.delete(keywordId);
		} else {
			selectedKeywords.add(keywordId);
		}
		selectedKeywords = new Set(selectedKeywords);
	}

	function openDeleteModal(keyword: ProjectKeyword) {
		deletingKeyword = keyword;
		deleteModalOpen = true;
	}

	async function handleDelete() {
		if (!deletingKeyword) return;

		try {
			const response = await fetch(
				`/api/workspaces/${workspaceId}/projects/${projectId}/keywords?id=${deletingKeyword.id}`,
				{
					method: 'DELETE'
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to delete keyword');
			}

			toast.success('Keyword deleted');
			keywords = keywords.filter((k) => k.id !== deletingKeyword!.id);
			deleteModalOpen = false;
			deletingKeyword = null;
			if (onSave) {
				onSave();
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to delete keyword');
		}
	}

	async function assignToCluster(selected: { value: string } | null) {
		const clusterId = selected?.value || null;
		if (selectedKeywords.size === 0) {
			toast.error('Please select keywords to assign');
			return;
		}

		try {
			const updates = Array.from(selectedKeywords).map((id) =>
				fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/keywords?id=${id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ cluster_id: clusterId })
				})
			);

			await Promise.all(updates);
			toast.success(`Assigned ${selectedKeywords.size} keywords to cluster`);
			selectedKeywords = new Set();
			if (onSave) {
				onSave();
			}
		} catch (error) {
			toast.error('Failed to assign keywords');
		}
	}

	const assignClusterLabel = $derived('Assign to cluster');
</script>

<div class="space-y-4">
	<div class="flex justify-between items-center">
		<h3 class="text-sm font-semibold">Keywords</h3>
		{#if canEdit}
			<div class="flex gap-2">
				<Button size="sm" variant="outline" onclick={() => (bulkModalOpen = true)}>
					Bulk Import
				</Button>
			</div>
		{/if}
	</div>

	<div class="flex gap-2 flex-wrap">
		<Input
			bind:value={searchTerm}
			placeholder="Search keywords..."
			class="max-w-xs"
		/>
		<Select.Root type="single" bind:value={filterCluster}>
			<Select.Trigger class="w-[180px]">
				{clusterFilterLabel}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="" label="All clusters">All clusters</Select.Item>
				{#each clusters as cluster}
					<Select.Item value={cluster.id} label={cluster.name}>{cluster.name}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
		<Select.Root type="single" bind:value={filterIntent}>
			<Select.Trigger class="w-[180px]">
				{intentFilterLabel}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="" label="All intents">All intents</Select.Item>
				<Select.Item value="informational" label="Informational">Informational</Select.Item>
				<Select.Item value="commercial" label="Commercial">Commercial</Select.Item>
				<Select.Item value="transactional" label="Transactional">Transactional</Select.Item>
				<Select.Item value="navigational" label="Navigational">Navigational</Select.Item>
				<Select.Item value="local" label="Local">Local</Select.Item>
				<Select.Item value="unknown" label="Unknown">Unknown</Select.Item>
			</Select.Content>
		</Select.Root>
		<Select.Root type="single" bind:value={filterPriority}>
			<Select.Trigger class="w-[150px]">
				{priorityFilterLabel}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="" label="All priorities">All priorities</Select.Item>
				<Select.Item value="1" label="Priority 1">Priority 1</Select.Item>
				<Select.Item value="2" label="Priority 2">Priority 2</Select.Item>
				<Select.Item value="3" label="Priority 3">Priority 3</Select.Item>
				<Select.Item value="4" label="Priority 4">Priority 4</Select.Item>
				<Select.Item value="5" label="Priority 5">Priority 5</Select.Item>
			</Select.Content>
		</Select.Root>
	</div>

	{#if selectedKeywords.size > 0 && canEdit}
		<div class="flex items-center gap-2 p-2 bg-muted rounded-md">
			<span class="text-sm">{selectedKeywords.size} selected</span>
			<Select.Root
				type="single"
				onSelectedChange={(selected) => assignToCluster(selected)}
			>
				<Select.Trigger class="w-[200px]">
					{assignClusterLabel}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="" label="Unassign">Unassign</Select.Item>
					{#each clusters as cluster}
						<Select.Item value={cluster.id} label={cluster.name}>{cluster.name}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<Button size="sm" variant="outline" onclick={() => (selectedKeywords = new Set())}>
				Clear Selection
			</Button>
		</div>
	{/if}

	{#if filteredKeywords.length === 0}
		<div class="text-center py-8 text-muted-foreground">
			<p>No keywords found</p>
		</div>
	{:else}
		<Table>
			<TableHeader>
				<TableRow>
					{#if canEdit}
						<TableHead class="w-[50px]"></TableHead>
					{/if}
					<TableHead>Keyword</TableHead>
					<TableHead>Cluster</TableHead>
					<TableHead>Intent</TableHead>
					<TableHead>Locale</TableHead>
					<TableHead>Priority</TableHead>
					<TableHead>Target Page</TableHead>
					{#if canEdit}
						<TableHead class="w-[100px]">Actions</TableHead>
					{/if}
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each filteredKeywords as keyword}
					<TableRow>
						{#if canEdit}
							<TableCell>
								<input
									type="checkbox"
									checked={selectedKeywords.has(keyword.id)}
									onchange={() => toggleSelection(keyword.id)}
								/>
							</TableCell>
						{/if}
						<TableCell class="font-medium">{keyword.keyword}</TableCell>
						<TableCell>
							{#if keyword.cluster_id}
								{@const cluster = clusters.find((c) => c.id === keyword.cluster_id)}
								{#if cluster}
									<Badge variant="outline">{cluster.name}</Badge>
								{:else}
									<span class="text-sm text-muted-foreground">-</span>
								{/if}
							{:else}
								<span class="text-sm text-muted-foreground">-</span>
							{/if}
						</TableCell>
						<TableCell>
							<Badge variant="secondary">{keyword.intent}</Badge>
						</TableCell>
						<TableCell>{keyword.locale || '-'}</TableCell>
						<TableCell>
							<Badge variant="outline">{keyword.priority}</Badge>
						</TableCell>
						<TableCell class="text-sm text-muted-foreground">
							{keyword.target_page_url || '-'}
						</TableCell>
						{#if canEdit}
							<TableCell>
								<Button size="sm" variant="ghost" onclick={() => openDeleteModal(keyword)}>
									<TrashIcon class="h-4 w-4" />
								</Button>
							</TableCell>
						{/if}
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	{/if}
</div>

<KeywordBulkAddModal
	bind:open={bulkModalOpen}
	{workspaceId}
	{projectId}
	onSave={() => {
		if (onSave) {
			onSave();
		}
	}}
/>

<ConfirmDeleteModal
	bind:open={deleteModalOpen}
	title="Delete Keyword"
	description="Are you sure you want to delete this keyword? This action cannot be undone."
	onConfirm={handleDelete}
/>
