<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import TopicClustersSection from '$lib/modules/project/settings/components/seo/TopicClustersSection.svelte';
	import KeywordsSection from '$lib/modules/project/settings/components/seo/KeywordsSection.svelte';
	import SEOGuidelinesSection from '$lib/modules/project/settings/components/seo/SEOGuidelinesSection.svelte';
	import { toast } from 'svelte-sonner';
	import type {
		ProjectTopicCluster,
		ProjectKeyword,
		SeoSettings,
		ProjectConversionGoal
	} from '$lib/types/project-settings.js';
	import { getContext } from 'svelte';
	import ConversionGoalsSection from './ConversionGoalsSection.svelte';

	interface Props {
		workspace: any;
		project: any;
		clusters: ProjectTopicCluster[];
		keywords: ProjectKeyword[];
		seoSettings: SeoSettings;
		goals?: ProjectConversionGoal[];
		canEdit: boolean;
	}

	let { workspace, project, clusters: initialClusters, keywords: initialKeywords, seoSettings: initialSeoSettings, goals = [], canEdit }: Props = $props();

	let clusters = $state<ProjectTopicCluster[]>(initialClusters || []);
	let keywords = $state<ProjectKeyword[]>(initialKeywords || []);
	let currentSeoSettings = $state(initialSeoSettings);

	// Sync clusters and keywords when props change
	$effect(() => {
		clusters = initialClusters || [];
		keywords = initialKeywords || [];
		currentSeoSettings = initialSeoSettings;
	});

	let isSaving = $state(false);
	let isDirty = $state(false);

	$effect(() => {
		currentSeoSettings = initialSeoSettings;
		isDirty = false;
	});

	$effect(() => {
		// Check if SEO settings changed
		isDirty = JSON.stringify(currentSeoSettings) !== JSON.stringify(initialSeoSettings);
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
			isDirty = false;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update SEO settings');
		} finally {
			isSaving = false;
		}
	}

	function resetForm() {
		currentSeoSettings = initialSeoSettings;
		isDirty = false;
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

<div class="w-full space-y-6">
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

	<ConversionGoalsSection {workspace} {project} {goals} {canEdit} />
</div>
