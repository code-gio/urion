<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import type { ProjectOffering } from '$lib/types/project-settings.js';
	import { toast } from 'svelte-sonner';

	let {
		open = $bindable(false),
		offering,
		workspaceId,
		projectId,
		onSave
	}: {
		open?: boolean;
		offering?: ProjectOffering | null;
		workspaceId: string;
		projectId: string;
		onSave?: () => void;
	} = $props();

	let name = $state(offering?.name || '');
	let offeringType = $state(offering?.offering_type || '');
	let description = $state(offering?.description || '');
	let pricingNotes = $state(offering?.pricing_notes || '');
	let url = $state(offering?.url || '');
	let isPrimary = $state(offering?.is_primary || false);
	let isSaving = $state(false);

	$effect(() => {
		if (offering) {
			name = offering.name;
			offeringType = offering.offering_type || '';
			description = offering.description || '';
			pricingNotes = offering.pricing_notes || '';
			url = offering.url || '';
			isPrimary = offering.is_primary;
		} else {
			name = '';
			offeringType = '';
			description = '';
			pricingNotes = '';
			url = '';
			isPrimary = false;
		}
	});

	async function handleSave() {
		if (!name.trim()) {
			toast.error('Name is required');
			return;
		}

		isSaving = true;

		try {
			const urlToUse = offering?.id
				? `/api/workspaces/${workspaceId}/projects/${projectId}/offerings?id=${offering.id}`
				: `/api/workspaces/${workspaceId}/projects/${projectId}/offerings`;

			const method = offering?.id ? 'PATCH' : 'POST';

			const response = await fetch(urlToUse, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: name.trim(),
					offering_type: offeringType.trim() || null,
					description: description.trim() || null,
					pricing_notes: pricingNotes.trim() || null,
					url: url.trim() || null,
					is_primary: isPrimary
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to save offering');
			}

			toast.success(offering?.id ? 'Offering updated' : 'Offering created');
			open = false;
			if (onSave) {
				onSave();
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to save offering');
		} finally {
			isSaving = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>{offering?.id ? 'Edit Offering' : 'Add Offering'}</Dialog.Title>
			<Dialog.Description>Add a product or service offering</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="name">Name *</Label>
				<Input id="name" bind:value={name} placeholder="Product or Service Name" required />
			</div>

			<div class="space-y-2">
				<Label for="offering-type">Type</Label>
				<Input
					id="offering-type"
					bind:value={offeringType}
					placeholder="service, product, plan, etc."
				/>
			</div>

			<div class="space-y-2">
				<Label for="description">Description</Label>
				<Textarea
					id="description"
					bind:value={description}
					placeholder="Describe this offering"
					rows="4"
				/>
			</div>

			<div class="space-y-2">
				<Label for="pricing-notes">Pricing Notes</Label>
				<Textarea
					id="pricing-notes"
					bind:value={pricingNotes}
					placeholder="Pricing information or notes"
					rows="3"
				/>
			</div>

			<div class="space-y-2">
				<Label for="url">URL</Label>
				<Input id="url" bind:value={url} placeholder="https://example.com/product" type="url" />
			</div>

			<div class="flex items-center space-x-2">
				<Checkbox id="is-primary" bind:checked={isPrimary} />
				<Label for="is-primary" class="cursor-pointer">Mark as primary offering</Label>
			</div>
		</div>

		<Dialog.Footer>
			<Dialog.Close asChild let:builder>
				<Button builders={[builder]} variant="outline" disabled={isSaving}>
					Cancel
				</Button>
			</Dialog.Close>
			<Button onclick={handleSave} disabled={isSaving || !name.trim()}>
				{isSaving ? 'Saving...' : offering?.id ? 'Update' : 'Create'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
