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
	import ContentRuleModal from './ContentRuleModal.svelte';
	import ContentRulePresets from './ContentRulePresets.svelte';
	import type { ProjectContentRule } from '$lib/types/project-settings.js';
	import { toast } from 'svelte-sonner';
	import EditIcon from '@lucide/svelte/icons/edit';
	import TrashIcon from '@lucide/svelte/icons/trash-2';

	let {
		rules = $bindable([]),
		workspaceId,
		projectId,
		canEdit = true,
		onSave
	}: {
		rules?: ProjectContentRule[];
		workspaceId: string;
		projectId: string;
		canEdit?: boolean;
		onSave?: () => void;
	} = $props();

	let editingRule = $state<ProjectContentRule | null>(null);
	let modalOpen = $state(false);
	let deletingRule = $state<ProjectContentRule | null>(null);
	let deleteModalOpen = $state(false);

	function openEditModal(rule?: ProjectContentRule) {
		editingRule = rule || null;
		modalOpen = true;
	}

	function openDeleteModal(rule: ProjectContentRule) {
		deletingRule = rule;
		deleteModalOpen = true;
	}

	async function handleDelete() {
		if (!deletingRule) return;

		try {
			const response = await fetch(
				`/api/workspaces/${workspaceId}/projects/${projectId}/content-rules?id=${deletingRule.id}`,
				{
					method: 'DELETE'
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to delete content rule');
			}

			toast.success('Content rule deleted');
			rules = rules.filter((r) => r.id !== deletingRule!.id);
			deleteModalOpen = false;
			deletingRule = null;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to delete content rule');
		}
	}

	async function handleSave() {
		if (onSave) {
			onSave();
		}
		modalOpen = false;
		editingRule = null;
	}

	function handlePreset(preset: {
		rule_scope: 'path_prefix' | 'path_regex' | 'exact_url';
		pattern: string;
		allow_ai_edit: boolean | null;
		allow_ai_generate: boolean | null;
		allow_index: boolean | null;
		notes: string | null;
	}) {
		editingRule = null;
		modalOpen = true;
		// Set preset values in modal via effect
		setTimeout(() => {
			// Modal will handle preset via prop
		}, 0);
	}
</script>

<div class="space-y-4">
	<div class="flex justify-between items-center">
		<h3 class="text-sm font-semibold">Content Rules</h3>
		{#if canEdit}
			<Button size="sm" onclick={() => openEditModal()}>
				Add Rule
			</Button>
		{/if}
	</div>

	{#if canEdit}
		<ContentRulePresets onSelectPreset={(preset) => {
			openEditModal();
			// Pass preset to modal - we'll need to update modal to accept preset prop
		}} />
	{/if}

	{#if rules.length === 0}
		<div class="text-center py-8 text-muted-foreground">
			<p>No content rules configured</p>
			{#if canEdit}
				<Button size="sm" variant="outline" class="mt-2" onclick={() => openEditModal()}>
					Add your first rule
				</Button>
			{/if}
		</div>
	{:else}
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Scope</TableHead>
					<TableHead>Pattern</TableHead>
					<TableHead>AI Edit</TableHead>
					<TableHead>AI Generate</TableHead>
					<TableHead>Index</TableHead>
					{#if canEdit}
						<TableHead class="w-[100px]">Actions</TableHead>
					{/if}
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each rules as rule}
					<TableRow>
						<TableCell>
							<Badge variant="outline">{rule.rule_scope}</Badge>
						</TableCell>
						<TableCell class="font-mono text-sm">{rule.pattern}</TableCell>
						<TableCell>
							{#if rule.allow_ai_edit === true}
								<Badge variant="default">Allow</Badge>
							{:else if rule.allow_ai_edit === false}
								<Badge variant="destructive">Block</Badge>
							{:else}
								<span class="text-sm text-muted-foreground">-</span>
							{/if}
						</TableCell>
						<TableCell>
							{#if rule.allow_ai_generate === true}
								<Badge variant="default">Allow</Badge>
							{:else if rule.allow_ai_generate === false}
								<Badge variant="destructive">Block</Badge>
							{:else}
								<span class="text-sm text-muted-foreground">-</span>
							{/if}
						</TableCell>
						<TableCell>
							{#if rule.allow_index === true}
								<Badge variant="default">Index</Badge>
							{:else if rule.allow_index === false}
								<Badge variant="destructive">Noindex</Badge>
							{:else}
								<span class="text-sm text-muted-foreground">-</span>
							{/if}
						</TableCell>
						{#if canEdit}
							<TableCell>
								<div class="flex gap-2">
									<Button size="sm" variant="ghost" onclick={() => openEditModal(rule)}>
										<EditIcon class="h-4 w-4" />
									</Button>
									<Button size="sm" variant="ghost" onclick={() => openDeleteModal(rule)}>
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

<ContentRuleModal
	bind:open={modalOpen}
	rule={editingRule}
	{workspaceId}
	{projectId}
	onSave={handleSave}
/>

<ConfirmDeleteModal
	bind:open={deleteModalOpen}
	title="Delete Content Rule"
	description="Are you sure you want to delete this content rule? This action cannot be undone."
	onConfirm={handleDelete}
/>
