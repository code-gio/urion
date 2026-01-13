<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { MultiValueInput } from '../index.js';
	import type { ProjectPersona } from '$lib/types/project-settings.js';
	import { toast } from 'svelte-sonner';

	let {
		open = $bindable(false),
		persona,
		workspaceId,
		projectId,
		onSave
	}: {
		open?: boolean;
		persona?: ProjectPersona | null;
		workspaceId: string;
		projectId: string;
		onSave?: (persona: ProjectPersona) => void;
	} = $props();

	let name = $state(persona?.name || '');
	let description = $state(persona?.description || '');
	let painPoints = $state(persona?.pain_points || []);
	let desiredOutcomes = $state(persona?.desired_outcomes || []);
	let objections = $state(persona?.objections || []);
	let vocabulary = $state(persona?.vocabulary || []);
	let isSaving = $state(false);

	$effect(() => {
		if (open) {
			if (persona) {
				name = persona.name;
				description = persona.description || '';
				painPoints = persona.pain_points || [];
				desiredOutcomes = persona.desired_outcomes || [];
				objections = persona.objections || [];
				vocabulary = persona.vocabulary || [];
			} else {
				name = '';
				description = '';
				painPoints = [];
				desiredOutcomes = [];
				objections = [];
				vocabulary = [];
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
			const urlToUse = persona?.id
				? `/api/workspaces/${workspaceId}/projects/${projectId}/personas?id=${persona.id}`
				: `/api/workspaces/${workspaceId}/projects/${projectId}/personas`;

			const method = persona?.id ? 'PATCH' : 'POST';

			const response = await fetch(urlToUse, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: name.trim(),
					description: description.trim() || null,
					pain_points: painPoints,
					desired_outcomes: desiredOutcomes,
					objections: objections,
					vocabulary: vocabulary
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to save persona');
			}

			const savedPersona = await response.json();
			toast.success(persona?.id ? 'Persona updated' : 'Persona created');
			open = false;

			if (onSave) {
				onSave(savedPersona);
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to save persona');
		} finally {
			isSaving = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-2xl max-h-[90vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>{persona?.id ? 'Edit Persona' : 'Add Persona'}</Dialog.Title>
			<Dialog.Description>Define your target audience persona</Dialog.Description>
		</Dialog.Header>

		<div class="w-full max-w-4xl">
			<form onsubmit={(e) => { e.preventDefault(); handleSave(); }}>
				<Field.Set>
					<Field.Legend>Persona Information</Field.Legend>
					<Field.Description>Define your target audience persona</Field.Description>
					<Field.Separator />
					<Field.Group>
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="name">Name *</Field.Label>
								<Field.Description>Name of the persona</Field.Description>
							</Field.Content>
							<Input id="name" bind:value={name} placeholder="e.g., Marketing Manager" required />
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="description">Description</Field.Label>
								<Field.Description>Brief description of this persona</Field.Description>
							</Field.Content>
							<Textarea
								id="description"
								bind:value={description}
								placeholder="Describe the persona..."
								rows="3"
								class="min-h-[80px] resize-none"
							/>
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="pain-points">Pain Points</Field.Label>
								<Field.Description>What problems or challenges does this persona face?</Field.Description>
							</Field.Content>
							<MultiValueInput
								bind:values={painPoints}
								placeholder="e.g., Limited budget, Time constraints"
							/>
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="desired-outcomes">Desired Outcomes</Field.Label>
								<Field.Description>What does this persona want to achieve?</Field.Description>
							</Field.Content>
							<MultiValueInput
								bind:values={desiredOutcomes}
								placeholder="e.g., Increase ROI, Save time"
							/>
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="objections">Objections</Field.Label>
								<Field.Description>Common objections or concerns this persona might have</Field.Description>
							</Field.Content>
							<MultiValueInput
								bind:values={objections}
								placeholder="e.g., Too expensive, Not sure if it works"
							/>
						</Field.Field>
						<Field.Separator />
						<Field.Field orientation="responsive">
							<Field.Content>
								<Field.Label for="vocabulary">Vocabulary</Field.Label>
								<Field.Description>Words and phrases this persona commonly uses</Field.Description>
							</Field.Content>
							<MultiValueInput
								bind:values={vocabulary}
								placeholder="e.g., ROI, KPI, Conversion rate"
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
				{isSaving ? 'Saving...' : persona?.id ? 'Update' : 'Create'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
