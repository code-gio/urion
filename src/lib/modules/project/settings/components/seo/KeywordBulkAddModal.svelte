<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select/index.js';
	import type { KeywordIntent } from '$lib/types/project-settings.js';
	import { toast } from 'svelte-sonner';

	let {
		open = $bindable(false),
		workspaceId,
		projectId,
		onSave
	}: {
		open?: boolean;
		workspaceId: string;
		projectId: string;
		onSave?: (keywords: any[]) => void;
	} = $props();

	let keywordsText = $state('');
	let intent = $state<KeywordIntent>('unknown');
	let locale = $state('');
	let priority = $state(3);
	let isSaving = $state(false);

	const intentLabel = $derived(
		intent === 'informational'
			? 'Informational'
			: intent === 'commercial'
				? 'Commercial'
				: intent === 'transactional'
					? 'Transactional'
					: intent === 'navigational'
						? 'Navigational'
						: intent === 'local'
							? 'Local'
							: 'Unknown'
	);
	const localeLabel = $derived(locale || 'Any');
	const priorityLabel = $derived(`${priority} - ${priority === 1 ? 'Lowest' : priority === 2 ? 'Low' : priority === 3 ? 'Medium' : priority === 4 ? 'High' : 'Highest'}`);

	async function handleImport() {
		const keywords = keywordsText
			.split('\n')
			.map((k) => k.trim())
			.filter((k) => k.length > 0);

		if (keywords.length === 0) {
			toast.error('Please enter at least one keyword');
			return;
		}

		isSaving = true;

		try {
			const response = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/keywords`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					keywords: keywords,
					intent,
					locale: locale || null,
					priority
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to import keywords');
			}

		const result = await response.json();
		toast.success(`Imported ${result.length} keywords`);
		keywordsText = '';
		open = false;
		if (onSave) {
			onSave(result);
		}
	} catch (error) {
		toast.error(error instanceof Error ? error.message : 'Failed to import keywords');
	} finally {
		isSaving = false;
	}
}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>Bulk Import Keywords</Dialog.Title>
			<Dialog.Description>Paste keywords, one per line</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="keywords">Keywords (one per line) *</Label>
				<Textarea
					id="keywords"
					bind:value={keywordsText}
					placeholder="keyword 1&#10;keyword 2&#10;keyword 3"
					rows="10"
				/>
			</div>

			<div class="grid grid-cols-3 gap-4">
				<div class="space-y-2">
					<Label for="intent">Intent</Label>
					<Select.Root type="single" bind:value={intent}>
						<Select.Trigger id="intent">
							{intentLabel}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="unknown" label="Unknown">Unknown</Select.Item>
							<Select.Item value="informational" label="Informational">Informational</Select.Item>
							<Select.Item value="commercial" label="Commercial">Commercial</Select.Item>
							<Select.Item value="transactional" label="Transactional">Transactional</Select.Item>
							<Select.Item value="navigational" label="Navigational">Navigational</Select.Item>
							<Select.Item value="local" label="Local">Local</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>

				<div class="space-y-2">
					<Label for="locale">Locale</Label>
					<Select.Root type="single" bind:value={locale}>
						<Select.Trigger id="locale">
							{localeLabel}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="" label="Any">Any</Select.Item>
							<Select.Item value="en" label="en">en</Select.Item>
							<Select.Item value="en-US" label="en-US">en-US</Select.Item>
							<Select.Item value="es" label="es">es</Select.Item>
							<Select.Item value="fr" label="fr">fr</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>

				<div class="space-y-2">
					<Label for="priority">Priority</Label>
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
		</div>

		<Dialog.Footer>
			<Dialog.Close>
				<Button variant="outline" disabled={isSaving}>
					Cancel
				</Button>
			</Dialog.Close>
			<Button onclick={handleImport} disabled={isSaving || !keywordsText.trim()}>
				{isSaving ? 'Importing...' : 'Import Keywords'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
