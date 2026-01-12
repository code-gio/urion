<script lang="ts">
	import { FormSection } from '../index.js';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { MultiValueInput } from '../index.js';
	import type { SeoSettings } from '$lib/types/project-settings.js';

	let {
		settings = $bindable({} as SeoSettings),
		canEdit = true
	}: {
		settings?: SeoSettings;
		canEdit?: boolean;
	} = $props();

	let canonicalStrategy = $state(settings?.canonical_strategy || '');
	let urlStructureRules = $state(settings?.url_structure_rules || '');
	let schemaOrgTypes = $state(settings?.schema_org_types || []);
	let internalLinkingGuidelines = $state(settings?.internal_linking_guidelines || '');
	let noindexPatterns = $state(settings?.noindex_patterns || []);
	let notes = $state(settings?.notes || '');

	$effect(() => {
		if (settings) {
			canonicalStrategy = settings.canonical_strategy || '';
			urlStructureRules = settings.url_structure_rules || '';
			schemaOrgTypes = settings.schema_org_types || [];
			internalLinkingGuidelines = settings.internal_linking_guidelines || '';
			noindexPatterns = settings.noindex_patterns || [];
			notes = settings.notes || '';
		}
	});

	// Update settings when values change
	$effect(() => {
		settings = {
			...settings,
			canonical_strategy: canonicalStrategy || undefined,
			url_structure_rules: urlStructureRules || undefined,
			schema_org_types: schemaOrgTypes.length > 0 ? schemaOrgTypes : undefined,
			internal_linking_guidelines: internalLinkingGuidelines || undefined,
			noindex_patterns: noindexPatterns.length > 0 ? noindexPatterns : undefined,
			notes: notes || undefined
		};
	});
</script>

<div class="space-y-6">
	<FormSection
		title="Canonical Strategy"
		description="Guidelines for canonical URLs and duplicate content handling"
	>
		<Textarea
			bind:value={canonicalStrategy}
			placeholder="Describe your canonical URL strategy..."
			disabled={!canEdit}
			rows="3"
		/>
	</FormSection>

	<FormSection
		title="URL Structure Rules"
		description="Rules and patterns for URL structure"
	>
		<Textarea
			bind:value={urlStructureRules}
			placeholder="Define URL structure rules..."
			disabled={!canEdit}
			rows="3"
		/>
	</FormSection>

	<FormSection
		title="Schema.org Types"
		description="Schema.org types to use (e.g., Article, Product, Organization)"
	>
		<MultiValueInput bind:values={schemaOrgTypes} placeholder="Article" disabled={!canEdit} />
	</FormSection>

	<FormSection
		title="Internal Linking Guidelines"
		description="Guidelines for internal linking structure"
	>
		<Textarea
			bind:value={internalLinkingGuidelines}
			placeholder="Describe internal linking guidelines..."
			disabled={!canEdit}
			rows="3"
		/>
	</FormSection>

	<FormSection
		title="Noindex Patterns"
		description="URL patterns that should not be indexed"
	>
		<MultiValueInput bind:values={noindexPatterns} placeholder="/admin/*" disabled={!canEdit} />
	</FormSection>

	<FormSection title="Notes" description="Additional SEO notes and guidelines">
		<Textarea bind:value={notes} placeholder="Additional notes..." disabled={!canEdit} rows="4" />
	</FormSection>
</div>
