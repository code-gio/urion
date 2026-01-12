<script lang="ts">
	import { goto } from '$app/navigation';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import TopicClustersSection from '$lib/modules/project/settings/components/seo/TopicClustersSection.svelte';
	import KeywordsSection from '$lib/modules/project/settings/components/seo/KeywordsSection.svelte';
	import SEOGuidelinesSection from '$lib/modules/project/settings/components/seo/SEOGuidelinesSection.svelte';
	import { toast } from 'svelte-sonner';
	import type {
		ProjectTopicCluster,
		ProjectKeyword,
		SeoSettings,
		ProjectSettingsRow
	} from '$lib/types/project-settings.js';
	import { getContext } from 'svelte';

	let { data }: { data: any } = $props();

	const workspace = $derived(data.workspace);
	const project = $derived(data.project);
	const canEdit = $derived(data.canEdit);
	const clusters = $derived(data.clusters as ProjectTopicCluster[]);
	const keywords = $derived(data.keywords as ProjectKeyword[]);
	const seoSettings = $derived(data.seoSettings as SeoSettings);

	let isSaving = $state(false);
	let isDirty = $state(false);
	let currentSeoSettings = $state(seoSettings);

	$effect(() => {
		currentSeoSettings = seoSettings;
		isDirty = false;
	});

	$effect(() => {
		// Check if SEO settings changed
		isDirty = JSON.stringify(currentSeoSettings) !== JSON.stringify(seoSettings);
	});

	async function saveSettings() {
		if (!workspace || !project || !canEdit) return;

		isSaving = true;

		try {
			// Get current settings
			const settingsResponse = await fetch(
				`/api/workspaces/${workspace.id}/projects/${project.id}/settings`
			);
			const currentSettings = await settingsResponse.json();

			// Merge SEO settings
			const updatedSettings = {
				...currentSettings.settings,
				seo: currentSeoSettings
			};

			const response = await fetch(
				`/api/workspaces/${workspace.id}/projects/${project.id}/settings`,
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						settings: updatedSettings
					})
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to update SEO settings');
			}

			toast.success('SEO settings updated successfully');
			goto('.', { invalidateAll: true });
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update SEO settings');
		} finally {
			isSaving = false;
		}
	}

	function resetForm() {
		currentSeoSettings = seoSettings;
		isDirty = false;
	}

	function handleSave() {
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

<div class="max-w-6xl space-y-6">
	<div>
		<h1 class="text-2xl font-bold">SEO Strategy</h1>
		<p class="text-muted-foreground">Manage topic clusters, keywords, and SEO guidelines</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Topic Clusters</CardTitle>
			<CardDescription>Organize your content into topic clusters and pillars</CardDescription>
		</CardHeader>
		<CardContent>
			<TopicClustersSection
				bind:clusters={clusters}
				workspaceId={workspace.id}
				projectId={project.id}
				{canEdit}
				onSave={handleSave}
			/>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>Keywords</CardTitle>
			<CardDescription>Manage keywords, assign to clusters, and set target pages</CardDescription>
		</CardHeader>
		<CardContent>
			<KeywordsSection
				bind:keywords={keywords}
				{clusters}
				workspaceId={workspace.id}
				projectId={project.id}
				{canEdit}
				onSave={handleSave}
			/>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>SEO Guidelines</CardTitle>
			<CardDescription>Define SEO guidelines and best practices</CardDescription>
		</CardHeader>
		<CardContent>
			<SEOGuidelinesSection bind:settings={currentSeoSettings} {canEdit} />
		</CardContent>
	</Card>
</div>
