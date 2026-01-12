<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import type { ProjectContentRule } from '$lib/types/project-settings.js';
	import { toast } from 'svelte-sonner';

	let {
		open = $bindable(false),
		rule,
		workspaceId,
		projectId,
		onSave
	}: {
		open?: boolean;
		rule?: ProjectContentRule | null;
		workspaceId: string;
		projectId: string;
		onSave?: () => void;
	} = $props();

	let ruleScope = $state<'path_prefix' | 'path_regex' | 'exact_url'>(
		rule?.rule_scope || 'path_prefix'
	);
	let pattern = $state(rule?.pattern || '');
	let allowAiEdit = $state(rule?.allow_ai_edit ?? null);
	let allowAiGenerate = $state(rule?.allow_ai_generate ?? null);
	let allowIndex = $state(rule?.allow_index ?? null);
	let notes = $state(rule?.notes || '');
	let isSaving = $state(false);
	let regexError = $state<string | null>(null);

	const ruleScopeLabel = $derived(
		ruleScope === 'path_prefix'
			? 'Path Prefix'
			: ruleScope === 'path_regex'
				? 'Path Regex'
				: 'Exact URL'
	);

	$effect(() => {
		if (rule) {
			ruleScope = rule.rule_scope;
			pattern = rule.pattern;
			allowAiEdit = rule.allow_ai_edit;
			allowAiGenerate = rule.allow_ai_generate;
			allowIndex = rule.allow_index;
			notes = rule.notes || '';
		} else {
			ruleScope = 'path_prefix';
			pattern = '';
			allowAiEdit = null;
			allowAiGenerate = null;
			allowIndex = null;
			notes = '';
		}
		regexError = null;
	});

	// Validate regex when pattern or scope changes
	$effect(() => {
		if (ruleScope === 'path_regex' && pattern) {
			try {
				new RegExp(pattern);
				regexError = null;
			} catch (e) {
				regexError = e instanceof Error ? e.message : 'Invalid regex pattern';
			}
		} else {
			regexError = null;
		}
	});

	function handlePreset(preset: {
		rule_scope: 'path_prefix' | 'path_regex' | 'exact_url';
		pattern: string;
		allow_ai_edit: boolean | null;
		allow_ai_generate: boolean | null;
		allow_index: boolean | null;
		notes: string | null;
	}) {
		ruleScope = preset.rule_scope;
		pattern = preset.pattern;
		allowAiEdit = preset.allow_ai_edit;
		allowAiGenerate = preset.allow_ai_generate;
		allowIndex = preset.allow_index;
		notes = preset.notes || '';
	}

	async function handleSave() {
		if (!pattern.trim()) {
			toast.error('Pattern is required');
			return;
		}

		if (ruleScope === 'path_regex' && regexError) {
			toast.error('Invalid regex pattern: ' + regexError);
			return;
		}

		isSaving = true;

		try {
			const urlToUse = rule?.id
				? `/api/workspaces/${workspaceId}/projects/${projectId}/content-rules?id=${rule.id}`
				: `/api/workspaces/${workspaceId}/projects/${projectId}/content-rules`;

			const method = rule?.id ? 'PATCH' : 'POST';

			const response = await fetch(urlToUse, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					rule_scope: ruleScope,
					pattern: pattern.trim(),
					allow_ai_edit: allowAiEdit,
					allow_ai_generate: allowAiGenerate,
					allow_index: allowIndex,
					notes: notes.trim() || null
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to save content rule');
			}

			toast.success(rule?.id ? 'Content rule updated' : 'Content rule created');
			open = false;
			if (onSave) {
				onSave();
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to save content rule');
		} finally {
			isSaving = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>{rule?.id ? 'Edit Content Rule' : 'Add Content Rule'}</Dialog.Title>
			<Dialog.Description>Define rules for content management and AI usage</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="rule-scope">Rule Scope *</Label>
				<Select.Root type="single" bind:value={ruleScope}>
					<Select.Trigger id="rule-scope">
						{ruleScopeLabel}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="path_prefix" label="Path Prefix">Path Prefix</Select.Item>
						<Select.Item value="path_regex" label="Path Regex">Path Regex</Select.Item>
						<Select.Item value="exact_url" label="Exact URL">Exact URL</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>

			<div class="space-y-2">
				<Label for="pattern">Pattern *</Label>
				<Input
					id="pattern"
					bind:value={pattern}
					placeholder={ruleScope === 'path_prefix'
						? '/legal/'
						: ruleScope === 'path_regex'
							? '^/blog/.*'
							: 'https://example.com/page'}
					required
				/>
				{#if ruleScope === 'path_regex'}
					<p class="text-xs text-muted-foreground">Enter a valid regex pattern</p>
					{#if regexError}
						<p class="text-xs text-destructive">{regexError}</p>
					{/if}
				{:else if ruleScope === 'path_prefix'}
					<p class="text-xs text-muted-foreground">Enter a path prefix (e.g., /legal/)</p>
				{:else}
					<p class="text-xs text-muted-foreground">Enter the exact URL</p>
				{/if}
			</div>

			<div class="space-y-3">
				<div class="flex items-center space-x-2">
					{@const aiEditChecked = allowAiEdit === true}
					<Checkbox
						id="allow-ai-edit"
						checked={aiEditChecked}
						onCheckedChange={(checked) => {
							allowAiEdit = checked ? true : null;
						}}
					/>
					<Label for="allow-ai-edit" class="cursor-pointer">Allow AI to edit content</Label>
				</div>

				<div class="flex items-center space-x-2">
					{@const aiGenerateChecked = allowAiGenerate === true}
					<Checkbox
						id="allow-ai-generate"
						checked={aiGenerateChecked}
						onCheckedChange={(checked) => {
							allowAiGenerate = checked ? true : null;
						}}
					/>
					<Label for="allow-ai-generate" class="cursor-pointer">Allow AI to generate content</Label>
				</div>

				<div class="flex items-center space-x-2">
					{@const indexChecked = allowIndex === true}
					<Checkbox
						id="allow-index"
						checked={indexChecked}
						onCheckedChange={(checked) => {
							allowIndex = checked ? true : null;
						}}
					/>
					<Label for="allow-index" class="cursor-pointer">Allow indexing (noindex if unchecked)</Label>
				</div>
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
			<Button onclick={handleSave} disabled={isSaving || !pattern.trim() || !!regexError}>
				{isSaving ? 'Saving...' : rule?.id ? 'Update' : 'Create'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
