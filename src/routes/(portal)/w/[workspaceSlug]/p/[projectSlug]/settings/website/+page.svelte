<script lang="ts">
	import { goto } from '$app/navigation';
	import { FormSection, MultiValueInput } from '$lib/modules/project/settings';
	import CrawlSourceList from '$lib/modules/project/settings/components/website/CrawlSourceList.svelte';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import type { ProjectSettingsRow, ProjectCrawlSource } from '$lib/types/project-settings.js';
	import { getContext } from 'svelte';

	let { data }: { data: any } = $props();

	const workspace = $derived(data.workspace);
	const project = $derived(data.project);
	const canEdit = $derived(data.canEdit);
	const settings = $derived(data.settings as ProjectSettingsRow | null);
	const crawlSources = $derived(data.crawlSources as ProjectCrawlSource[]);

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
			goto('.', { invalidateAll: true });
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
		// Reload page to refresh crawl sources
		goto('.', { invalidateAll: true });
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

	if (canEdit && settingsShell) {
		settingsShell.setActions({
			onSave: saveSettings,
			onCancel: resetForm,
			isDirty,
			isSaving
		});
	}
</script>

<div class="max-w-4xl space-y-6">
	<div>
		<h1 class="text-2xl font-bold">Website & Crawl Sources</h1>
		<p class="text-muted-foreground">Configure your website identity and crawling sources</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Website Identity</CardTitle>
			<CardDescription>Basic information about your website</CardDescription>
		</CardHeader>
		<CardContent class="space-y-6">
			<FormSection
				title="Canonical Domain"
				description="The primary domain for your website (e.g., example.com)"
			>
				<Input
					bind:value={canonicalDomain}
					placeholder="example.com"
					disabled={isSaving || !canEdit}
				/>
			</FormSection>

			<FormSection
				title="Primary Language"
				description="The main language code for your website (e.g., en, es, fr)"
			>
				<Input
					bind:value={primaryLanguage}
					placeholder="en"
					disabled={isSaving || !canEdit}
					maxlength="10"
				/>
			</FormSection>

			<FormSection
				title="Languages"
				description="All languages your website supports (e.g., en-US, es-ES)"
			>
				<MultiValueInput
					bind:values={languages}
					placeholder="en-US"
					disabled={!canEdit}
				/>
			</FormSection>

			<FormSection
				title="Target Countries"
				description="Countries where your website primarily operates"
			>
				<MultiValueInput
					bind:values={targetCountries}
					placeholder="US"
					disabled={!canEdit}
				/>
			</FormSection>
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
