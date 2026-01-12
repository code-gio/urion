<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select/index.js';
	import { MultiValueInput } from '../index.js';
	import type { ProjectCompetitor, CompetitorType } from '$lib/types/project-settings.js';
	import { toast } from 'svelte-sonner';

	let {
		open = $bindable(false),
		competitor,
		workspaceId,
		projectId,
		onSave
	}: {
		open?: boolean;
		competitor?: ProjectCompetitor | null;
		workspaceId: string;
		projectId: string;
		onSave?: () => void;
	} = $props();

	let name = $state(competitor?.name || '');
	let websiteUrl = $state(competitor?.website_url || '');
	let competitorType = $state<CompetitorType>(competitor?.competitor_type || 'other');
	let positioning = $state(competitor?.positioning || '');
	let differentiators = $state(competitor?.differentiators || []);
	let notes = $state(competitor?.notes || '');
	let priority = $state(competitor?.priority || 3);
	let isSaving = $state(false);

	const competitorTypeLabel = $derived(
		competitorType === 'direct'
			? 'Direct'
			: competitorType === 'indirect'
				? 'Indirect'
				: competitorType === 'serp'
					? 'SERP'
					: competitorType === 'content'
						? 'Content'
						: competitorType === 'tool'
							? 'Tool'
							: competitorType === 'marketplace'
								? 'Marketplace'
								: 'Other'
	);
	const priorityLabel = $derived(`${priority} - ${priority === 1 ? 'Lowest' : priority === 2 ? 'Low' : priority === 3 ? 'Medium' : priority === 4 ? 'High' : 'Highest'}`);

	$effect(() => {
		if (competitor) {
			name = competitor.name;
			websiteUrl = competitor.website_url || '';
			competitorType = competitor.competitor_type;
			positioning = competitor.positioning || '';
			differentiators = competitor.differentiators || [];
			notes = competitor.notes || '';
			priority = competitor.priority;
		} else {
			name = '';
			websiteUrl = '';
			competitorType = 'other';
			positioning = '';
			differentiators = [];
			notes = '';
			priority = 3;
		}
	});

	async function handleSave() {
		if (!name.trim()) {
			toast.error('Name is required');
			return;
		}

		isSaving = true;

		try {
			const urlToUse = competitor?.id
				? `/api/workspaces/${workspaceId}/projects/${projectId}/competitors?id=${competitor.id}`
				: `/api/workspaces/${workspaceId}/projects/${projectId}/competitors`;

			const method = competitor?.id ? 'PATCH' : 'POST';

			const response = await fetch(urlToUse, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: name.trim(),
					website_url: websiteUrl.trim() || null,
					competitor_type: competitorType,
					positioning: positioning.trim() || null,
					differentiators,
					notes: notes.trim() || null,
					priority
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to save competitor');
			}

			toast.success(competitor?.id ? 'Competitor updated' : 'Competitor created');
			open = false;
			if (onSave) {
				onSave();
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to save competitor');
		} finally {
			isSaving = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>{competitor?.id ? 'Edit Competitor' : 'Add Competitor'}</Dialog.Title>
			<Dialog.Description>Track and analyze your competitors</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="name">Name *</Label>
				<Input id="name" bind:value={name} placeholder="Competitor Name" required />
			</div>

			<div class="space-y-2">
				<Label for="website-url">Website URL</Label>
				<Input id="website-url" bind:value={websiteUrl} placeholder="https://example.com" type="url" />
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="competitor-type">Type</Label>
					<Select.Root type="single" bind:value={competitorType}>
						<Select.Trigger id="competitor-type">
							{competitorTypeLabel}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="direct" label="Direct">Direct</Select.Item>
							<Select.Item value="indirect" label="Indirect">Indirect</Select.Item>
							<Select.Item value="serp" label="SERP">SERP</Select.Item>
							<Select.Item value="content" label="Content">Content</Select.Item>
							<Select.Item value="tool" label="Tool">Tool</Select.Item>
							<Select.Item value="marketplace" label="Marketplace">Marketplace</Select.Item>
							<Select.Item value="other" label="Other">Other</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>

				<div class="space-y-2">
					<Label for="priority">Priority (1-5)</Label>
					<Select.Root type="single" bind:value={priority}>
						<Select.Trigger id="priority">
							{priorityLabel}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value={1} label="1 - Lowest">1 - Lowest</Select.Item>
							<Select.Item value={2} label="2 - Low">2 - Low</Select.Item>
							<Select.Item value={3} label="3 - Medium">3 - Medium</Select.Item>
							<Select.Item value={4} label="4 - High">4 - High</Select.Item>
							<Select.Item value={5} label="5 - Highest">5 - Highest</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="positioning">Positioning</Label>
				<Textarea
					id="positioning"
					bind:value={positioning}
					placeholder="How this competitor positions themselves in the market"
					rows="3"
				/>
			</div>

			<div class="space-y-2">
				<Label>Differentiators</Label>
				<MultiValueInput
					bind:values={differentiators}
					placeholder="Unique feature or advantage"
				/>
			</div>

			<div class="space-y-2">
				<Label for="notes">Notes</Label>
				<Textarea id="notes" bind:value={notes} placeholder="Additional notes" rows="3" />
			</div>
		</div>

		<Dialog.Footer>
			<Dialog.Close asChild let:builder>
				<Button builders={[builder]} variant="outline" disabled={isSaving}>
					Cancel
				</Button>
			</Dialog.Close>
			<Button onclick={handleSave} disabled={isSaving || !name.trim()}>
				{isSaving ? 'Saving...' : competitor?.id ? 'Update' : 'Create'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
