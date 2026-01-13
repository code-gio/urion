<script lang="ts">
	import { MultiValueInput } from '$lib/modules/project/settings';
	import CrawlSourceList from '$lib/modules/project/settings/components/website/CrawlSourceList.svelte';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { toast } from 'svelte-sonner';
	import type { ProjectSettingsRow, ProjectCrawlSource } from '$lib/types/project-settings.js';
	import { getContext } from 'svelte';

	interface Props {
		workspace: any;
		project: any;
		settings: ProjectSettingsRow | null;
		crawlSources: ProjectCrawlSource[];
		canEdit: boolean;
	}

	let { workspace, project, settings, crawlSources: initialCrawlSources, canEdit }: Props = $props();

	let crawlSources = $state<ProjectCrawlSource[]>(initialCrawlSources || []);

	// Sync crawlSources when prop changes
	$effect(() => {
		crawlSources = initialCrawlSources || [];
	});

	// Site settings from JSONB
	let canonicalDomain = $state(settings?.settings?.site?.canonical_domain || '');
	let languages = $state(settings?.settings?.site?.languages || []);
	let targetCountries = $state(settings?.target_countries || []);
	let primaryLanguage = $state(settings?.primary_language || '');
	let isSaving = $state(false);
	let isDirty = $state(false);

	// Track initial state
	$effect(() => {
		if (settings) {
			canonicalDomain = settings.settings?.site?.canonical_domain || '';
			languages = settings.settings?.site?.languages || [];
			targetCountries = settings.target_countries || [];
			primaryLanguage = settings.primary_language || '';
			isDirty = false;
		}
	});

	// Check if dirty
	$effect(() => {
		if (settings) {
			const initialCanonical = settings.settings?.site?.canonical_domain || '';
			const initialLanguages = settings.settings?.site?.languages || [];
			const initialCountries = settings.target_countries || [];
			const initialPrimaryLang = settings.primary_language || '';

			isDirty =
				canonicalDomain !== initialCanonical ||
				JSON.stringify(languages) !== JSON.stringify(initialLanguages) ||
				JSON.stringify(targetCountries) !== JSON.stringify(initialCountries) ||
				primaryLanguage !== initialPrimaryLang;
		}
	});

	async function saveSettings() {
		if (!workspace || !project || !canEdit) return;

		isSaving = true;

		try {
			// Merge site settings
			const currentSettings = settings?.settings || {};
			const siteSettings = {
				...currentSettings.site,
				canonical_domain: canonicalDomain || undefined,
				languages: languages.length > 0 ? languages : undefined
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
							site: siteSettings
						},
						primary_language: primaryLanguage || null,
						target_countries: targetCountries
					})
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to update settings');
			}

			toast.success('Website settings updated successfully');
			isDirty = false;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update settings');
		} finally {
			isSaving = false;
		}
	}

	function resetForm() {
		if (settings) {
			canonicalDomain = settings.settings?.site?.canonical_domain || '';
			languages = settings.settings?.site?.languages || [];
			targetCountries = settings.target_countries || [];
			primaryLanguage = settings.primary_language || '';
			isDirty = false;
		}
	}

	function handleCrawlSourceSave() {
		// Refresh only crawl sources data
		toast.success('Crawl source saved');
	}

	// Register save and cancel handlers with parent
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

<div class="w-full max-w-4xl space-y-6">
	<div>
		<h1 class="text-2xl font-bold">Website & Crawl Sources</h1>
		<p class="text-muted-foreground">Configure your website identity and crawling sources</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Website Identity</CardTitle>
			<CardDescription>Basic information about your website</CardDescription>
		</CardHeader>
		<CardContent>
			<Field.Set>
				<Field.Legend>Website Configuration</Field.Legend>
				<Field.Description>Configure your website identity and language settings</Field.Description>
				<Field.Separator />
				<Field.Group>
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label for="canonical-domain">Canonical Domain</Field.Label>
							<Field.Description>The primary domain for your website (e.g., example.com)</Field.Description>
						</Field.Content>
						<Input
							id="canonical-domain"
							bind:value={canonicalDomain}
							placeholder="example.com"
							disabled={isSaving || !canEdit}
						/>
					</Field.Field>
					<Field.Separator />
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label for="primary-language">Primary Language</Field.Label>
							<Field.Description>The main language code for your website (e.g., en, es, fr)</Field.Description>
						</Field.Content>
						<Input
							id="primary-language"
							bind:value={primaryLanguage}
							placeholder="en"
							disabled={isSaving || !canEdit}
							maxlength="10"
						/>
					</Field.Field>
					<Field.Separator />
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label for="languages">Languages</Field.Label>
							<Field.Description>All languages your website supports (e.g., en-US, es-ES)</Field.Description>
						</Field.Content>
						<MultiValueInput
							bind:values={languages}
							placeholder="en-US"
							disabled={!canEdit}
						/>
					</Field.Field>
					<Field.Separator />
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label for="target-countries">Target Countries</Field.Label>
							<Field.Description>Countries where your website primarily operates</Field.Description>
						</Field.Content>
						<MultiValueInput
							bind:values={targetCountries}
							placeholder="US"
							disabled={!canEdit}
						/>
					</Field.Field>
				</Field.Group>
			</Field.Set>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>Crawl Sources</CardTitle>
			<CardDescription>Configure sources for crawling your website content</CardDescription>
		</CardHeader>
		<CardContent>
			<CrawlSourceList
				bind:sources={crawlSources}
				workspaceId={workspace.id}
				projectId={project.id}
				{canEdit}
				onSave={handleCrawlSourceSave}
			/>
		</CardContent>
	</Card>
</div>
