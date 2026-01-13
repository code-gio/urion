<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Checkbox from '$lib/components/ui/checkbox/index.js';
	import type { ProjectConversionGoal } from '$lib/types/project-settings.js';
	import { toast } from 'svelte-sonner';

	let {
		open = $bindable(false),
		goal,
		workspaceId,
		projectId,
		onSave
	}: {
		open?: boolean;
		goal?: ProjectConversionGoal | null;
		workspaceId: string;
		projectId: string;
		onSave?: (goal: ProjectConversionGoal) => void;
	} = $props();

	let name = $state(goal?.name || '');
	let goalType = $state(goal?.goal_type || '');
	let eventName = $state(goal?.event_name || '');
	let isPrimary = $state(goal?.is_primary || false);
	let value = $state(goal?.value?.toString() || '');
	let notes = $state(goal?.notes || '');
	let isSaving = $state(false);

	$effect(() => {
		if (open) {
			if (goal) {
				name = goal.name;
				goalType = goal.goal_type || '';
				eventName = goal.event_name || '';
				isPrimary = goal.is_primary || false;
				value = goal.value?.toString() || '';
				notes = goal.notes || '';
			} else {
				name = '';
				goalType = '';
				eventName = '';
				isPrimary = false;
				value = '';
				notes = '';
			}
		}
	});

	async function handleSave() {
		if (!name.trim()) {
			toast.error('Name is required');
			return;
		}

		isSaving = true;

		try {
			const urlToUse = goal?.id
				? `/api/workspaces/${workspaceId}/projects/${projectId}/conversion-goals?id=${goal.id}`
				: `/api/workspaces/${workspaceId}/projects/${projectId}/conversion-goals`;

			const method = goal?.id ? 'PATCH' : 'POST';

			const payload: any = {
				name: name.trim(),
				goal_type: goalType.trim() || null,
				event_name: eventName.trim() || null,
				is_primary: isPrimary,
				notes: notes.trim() || null
			};

			if (value.trim()) {
				const valueNum = parseFloat(value);
				if (!isNaN(valueNum)) {
					payload.value = valueNum;
				} else {
					payload.value = null;
				}
			} else {
				payload.value = null;
			}

			const response = await fetch(urlToUse, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to save conversion goal');
			}

			const savedGoal = await response.json();
			toast.success(goal?.id ? 'Conversion goal updated' : 'Conversion goal created');
			open = false;

			if (onSave) {
				onSave(savedGoal);
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to save conversion goal');
		} finally {
			isSaving = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>{goal?.id ? 'Edit Conversion Goal' : 'Add Conversion Goal'}</Dialog.Title>
			<Dialog.Description>Track conversion goals and events</Dialog.Description>
		</Dialog.Header>

		<div class="w-full max-w-4xl">
			<form onsubmit={(e) => { e.preventDefault(); handleSave(); }}>
				<Field.Set>
					<Field.Legend>Goal Information</Field.Legend>
					<Field.Description>Define conversion goals and tracking events</Field.Description>
					<Field.Separator />
					<Field.Group>
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="goal-name">Name *</Field.Label>
								<Field.Description>Name of the conversion goal</Field.Description>
							</Field.Content>
							<Input id="goal-name" bind:value={name} placeholder="e.g., Purchase, Sign Up" required />
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="goal-type">Goal Type</Field.Label>
								<Field.Description>Type of conversion goal</Field.Description>
							</Field.Content>
							<Input id="goal-type" bind:value={goalType} placeholder="e.g., purchase, signup, download" />
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="event-name">Event Name</Field.Label>
								<Field.Description>Analytics event name to track</Field.Description>
							</Field.Content>
							<Input id="event-name" bind:value={eventName} placeholder="e.g., purchase_completed" />
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="is-primary-goal">Primary Goal</Field.Label>
								<Field.Description>Mark this as the primary conversion goal</Field.Description>
							</Field.Content>
							<div class="flex items-center space-x-2">
								<Checkbox.Root id="is-primary-goal" bind:checked={isPrimary} />
								<label for="is-primary-goal" class="text-sm">Primary goal</label>
							</div>
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="goal-value">Value</Field.Label>
								<Field.Description>Monetary value of this conversion (optional)</Field.Description>
							</Field.Content>
							<Input id="goal-value" bind:value={value} placeholder="0.00" type="text" inputmode="decimal" />
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="goal-notes">Notes</Field.Label>
								<Field.Description>Additional notes about this goal</Field.Description>
							</Field.Content>
							<Textarea
								id="goal-notes"
								bind:value={notes}
								placeholder="Additional notes..."
								rows="3"
								class="min-h-[80px] resize-none"
							/>
						</Field.Field>
					</Field.Group>
				</Field.Set>
			</form>
		</div>

		<Dialog.Footer>
			<Dialog.Close>
				<Button variant="outline" disabled={isSaving}>
					Cancel
				</Button>
			</Dialog.Close>
			<Button onclick={handleSave} disabled={isSaving || !name.trim()}>
				{isSaving ? 'Saving...' : goal?.id ? 'Update' : 'Create'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
