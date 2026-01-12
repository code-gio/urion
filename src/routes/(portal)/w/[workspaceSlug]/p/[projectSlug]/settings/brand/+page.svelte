<script lang="ts">
	import { goto } from '$app/navigation';
	import { FormSection, MultiValueInput } from '$lib/modules/project/settings';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select/index.js';
	import { toast } from 'svelte-sonner';
	import type { ProjectSettingsRow, BrandSettings } from '$lib/types/project-settings.js';
	import { getContext } from 'svelte';

	let { data }: { data: any } = $props();

	const workspace = $derived(data.workspace);
	const project = $derived(data.project);
	const canEdit = $derived(data.canEdit);
	const settings = $derived(data.settings as ProjectSettingsRow | null);

	// Brand settings from JSONB
	let brandName = $state(settings?.settings?.brand?.brand_name || '');
	let voiceDescription = $state(settings?.settings?.brand?.voice_description || '');
	let toneTags = $state(settings?.settings?.brand?.tone_tags || []);
	let readingLevel = $state(settings?.settings?.brand?.reading_level || 'general');
	let pointOfView = $state(settings?.settings?.brand?.point_of_view || 'we');
	let spellingVariant = $state(settings?.settings?.brand?.spelling_variant || 'US');
	let doWords = $state(settings?.settings?.brand?.do_words || []);
	let dontWords = $state(settings?.settings?.brand?.dont_words || []);
	let requiredPhrases = $state(settings?.settings?.brand?.required_phrases || []);
	let prohibitedClaims = $state(settings?.settings?.brand?.prohibited_claims || []);
	let brandGuidelines = $state(settings?.settings?.brand?.examples?.good || '');
	let badExample = $state(settings?.settings?.brand?.examples?.bad || '');
	let isSaving = $state(false);
	let isDirty = $state(false);

	const readingLevelLabel = $derived(
		readingLevel === 'general' ? 'General' : readingLevel === 'professional' ? 'Professional' : 'Expert'
	);
	const pointOfViewLabel = $derived(pointOfView === 'we' ? 'We' : pointOfView === 'they' ? 'They' : 'You');
	const spellingVariantLabel = $derived(spellingVariant);

	// Track initial state
	$effect(() => {
		if (settings) {
			const brand = settings.settings?.brand || {};
			brandName = brand.brand_name || '';
			voiceDescription = brand.voice_description || '';
			toneTags = brand.tone_tags || [];
			readingLevel = brand.reading_level || 'general';
			pointOfView = brand.point_of_view || 'we';
			spellingVariant = brand.spelling_variant || 'US';
			doWords = brand.do_words || [];
			dontWords = brand.dont_words || [];
			requiredPhrases = brand.required_phrases || [];
			prohibitedClaims = brand.prohibited_claims || [];
			brandGuidelines = brand.examples?.good || '';
			badExample = brand.examples?.bad || '';
			isDirty = false;
		}
	});

	// Check if dirty
	$effect(() => {
		if (settings) {
			const brand = settings.settings?.brand || {};
			const initialBrandName = brand.brand_name || '';
			const initialVoiceDescription = brand.voice_description || '';
			const initialToneTags = brand.tone_tags || [];
			const initialReadingLevel = brand.reading_level || 'general';
			const initialPointOfView = brand.point_of_view || 'we';
			const initialSpellingVariant = brand.spelling_variant || 'US';
			const initialDoWords = brand.do_words || [];
			const initialDontWords = brand.dont_words || [];
			const initialRequiredPhrases = brand.required_phrases || [];
			const initialProhibitedClaims = brand.prohibited_claims || [];
			const initialBrandGuidelines = brand.examples?.good || '';
			const initialBadExample = brand.examples?.bad || '';

			isDirty =
				brandName !== initialBrandName ||
				voiceDescription !== initialVoiceDescription ||
				JSON.stringify(toneTags) !== JSON.stringify(initialToneTags) ||
				readingLevel !== initialReadingLevel ||
				pointOfView !== initialPointOfView ||
				spellingVariant !== initialSpellingVariant ||
				JSON.stringify(doWords) !== JSON.stringify(initialDoWords) ||
				JSON.stringify(dontWords) !== JSON.stringify(initialDontWords) ||
				JSON.stringify(requiredPhrases) !== JSON.stringify(initialRequiredPhrases) ||
				JSON.stringify(prohibitedClaims) !== JSON.stringify(initialProhibitedClaims) ||
				brandGuidelines !== initialBrandGuidelines ||
				badExample !== initialBadExample;
		}
	});

	async function saveSettings() {
		if (!workspace || !project || !canEdit) return;

		isSaving = true;

		try {
			// Merge brand settings
			const currentSettings = settings?.settings || {};
			const brandSettings: BrandSettings = {
				brand_name: brandName || undefined,
				voice_description: voiceDescription || undefined,
				tone_tags: toneTags.length > 0 ? toneTags : undefined,
				reading_level: readingLevel as 'general' | 'professional' | 'expert',
				point_of_view: pointOfView as 'we' | 'they' | 'you',
				spelling_variant: spellingVariant as 'US' | 'UK' | 'AU' | 'CA',
				do_words: doWords.length > 0 ? doWords : undefined,
				dont_words: dontWords.length > 0 ? dontWords : undefined,
				required_phrases: requiredPhrases.length > 0 ? requiredPhrases : undefined,
				prohibited_claims: prohibitedClaims.length > 0 ? prohibitedClaims : undefined,
				examples: {
					good: brandGuidelines || undefined,
					bad: badExample || undefined
				}
			};

			const response = await fetch(
				`/api/workspaces/${workspace.id}/projects/${project.id}/settings`,
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						settings: {
							...currentSettings,
							brand: brandSettings
						}
					})
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to update brand settings');
			}

		toast.success('Brand voice settings updated successfully');
		isDirty = false;
	} catch (error) {
		toast.error(error instanceof Error ? error.message : 'Failed to update brand settings');
	} finally {
		isSaving = false;
	}
}

	function resetForm() {
		if (settings) {
			const brand = settings.settings?.brand || {};
			brandName = brand.brand_name || '';
			voiceDescription = brand.voice_description || '';
			toneTags = brand.tone_tags || [];
			readingLevel = brand.reading_level || 'general';
			pointOfView = brand.point_of_view || 'we';
			spellingVariant = brand.spelling_variant || 'US';
			doWords = brand.do_words || [];
			dontWords = brand.dont_words || [];
			requiredPhrases = brand.required_phrases || [];
			prohibitedClaims = brand.prohibited_claims || [];
			brandGuidelines = brand.examples?.good || '';
			badExample = brand.examples?.bad || '';
			isDirty = false;
		}
	}

	// Register save and cancel handlers with parent SettingsShell
	const settingsShell = getContext<{
		setActions: (actions: {
			onSave?: () => void | Promise<void>;
			onCancel?: () => void;
			isDirty?: boolean;
			isSaving?: boolean;
		}) => void;
	}>('settings-shell');

	$effect(() => {
		if (canEdit && settingsShell) {
			settingsShell.setActions({
				onSave: saveSettings,
				onCancel: resetForm,
				isDirty,
				isSaving
			});
		}
	});
</script>

<div class="max-w-4xl space-y-6">
	<div>
		<h1 class="text-2xl font-bold">Brand Voice</h1>
		<p class="text-muted-foreground">Define your brand's voice, tone, and writing guidelines</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Brand Identity</CardTitle>
			<CardDescription>Core brand information and voice characteristics</CardDescription>
		</CardHeader>
		<CardContent class="space-y-6">
			<FormSection title="Brand Name" description="The name of your brand">
				<Input
					bind:value={brandName}
					placeholder="Your Brand Name"
					disabled={isSaving || !canEdit}
				/>
			</FormSection>

			<FormSection
				title="Voice Description"
				description="Describe your brand's voice and personality"
			>
				<Textarea
					bind:value={voiceDescription}
					placeholder="Our brand voice is professional yet approachable..."
					disabled={isSaving || !canEdit}
					rows="4"
				/>
			</FormSection>

			<FormSection
				title="Tone Tags"
				description="Keywords that describe your brand's tone (e.g., friendly, professional, casual)"
			>
				<MultiValueInput
					bind:values={toneTags}
					placeholder="friendly"
					disabled={!canEdit}
				/>
			</FormSection>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<FormSection title="Reading Level">
					<Select.Root type="single" bind:value={readingLevel} disabled={isSaving || !canEdit}>
						<Select.Trigger>
							{readingLevelLabel}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="general" label="General">General</Select.Item>
							<Select.Item value="professional" label="Professional">Professional</Select.Item>
							<Select.Item value="expert" label="Expert">Expert</Select.Item>
						</Select.Content>
					</Select.Root>
				</FormSection>

				<FormSection title="Point of View">
					<Select.Root type="single" bind:value={pointOfView} disabled={isSaving || !canEdit}>
						<Select.Trigger>
							{pointOfViewLabel}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="we" label="We">We</Select.Item>
							<Select.Item value="they" label="They">They</Select.Item>
							<Select.Item value="you" label="You">You</Select.Item>
						</Select.Content>
					</Select.Root>
				</FormSection>

				<FormSection title="Spelling Variant">
					<Select.Root type="single" bind:value={spellingVariant} disabled={isSaving || !canEdit}>
						<Select.Trigger>
							{spellingVariantLabel}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="US" label="US">US</Select.Item>
							<Select.Item value="UK" label="UK">UK</Select.Item>
							<Select.Item value="AU" label="AU">AU</Select.Item>
							<Select.Item value="CA" label="CA">CA</Select.Item>
						</Select.Content>
					</Select.Root>
				</FormSection>
			</div>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>Word Guidelines</CardTitle>
			<CardDescription>Words and phrases to use or avoid</CardDescription>
		</CardHeader>
		<CardContent class="space-y-6">
			<FormSection
				title="Do Words"
				description="Words and phrases that align with your brand voice"
			>
				<MultiValueInput bind:values={doWords} placeholder="innovative" disabled={!canEdit} />
			</FormSection>

			<FormSection
				title="Don't Words"
				description="Words and phrases to avoid in your content"
			>
				<MultiValueInput bind:values={dontWords} placeholder="cheap" disabled={!canEdit} />
			</FormSection>

			<FormSection
				title="Required Phrases"
				description="Phrases that must be included in certain contexts"
			>
				<MultiValueInput
					bind:values={requiredPhrases}
					placeholder="Terms and conditions apply"
					disabled={!canEdit}
				/>
			</FormSection>

			<FormSection
				title="Prohibited Claims"
				description="Claims that should never be made in your content"
			>
				<MultiValueInput
					bind:values={prohibitedClaims}
					placeholder="100% guaranteed"
					disabled={!canEdit}
				/>
			</FormSection>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>Examples</CardTitle>
			<CardDescription>Good and bad examples of your brand voice</CardDescription>
		</CardHeader>
		<CardContent class="space-y-6">
			<FormSection
				title="Good Example"
				description="An example of content that matches your brand voice"
			>
				<Textarea
					bind:value={brandGuidelines}
					placeholder="Example of good brand voice..."
					disabled={isSaving || !canEdit}
					rows="4"
				/>
			</FormSection>

			<FormSection
				title="Bad Example"
				description="An example of content that doesn't match your brand voice"
			>
				<Textarea
					bind:value={badExample}
					placeholder="Example of content to avoid..."
					disabled={isSaving || !canEdit}
					rows="4"
				/>
			</FormSection>
		</CardContent>
	</Card>
</div>
