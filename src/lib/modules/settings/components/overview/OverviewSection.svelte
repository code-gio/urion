<script lang="ts">
	import { getContext } from 'svelte';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select/index.js';
	import { toast } from 'svelte-sonner';
	import type { ProjectStatus } from '$lib/types';
	import type { ProjectSettingsRow } from '$lib/types/project-settings.js';

	interface Props {
		workspace: any;
		project: any;
		projectSettings: ProjectSettingsRow | null;
		canEdit: boolean;
	}

	let { workspace, project, projectSettings, canEdit }: Props = $props();

	let projectName = $state(project?.name || '');
	let websiteUrl = $state(project?.website_url || '');
	let projectStatus = $state<ProjectStatus>(project?.status || 'active');
	let industry = $state(projectSettings?.industry || '');
	let primaryLanguage = $state(projectSettings?.primary_language || '');
	let targetCountries = $state(projectSettings?.target_countries?.join(', ') || '');
	let isSaving = $state(false);
	let isDirty = $state(false);

	const statusLabel = $derived(projectStatus === 'active' ? 'Active' : 'Archived');

	// Track initial state
	$effect(() => {
		if (project) {
			projectName = project.name || '';
			websiteUrl = project.website_url || '';
			projectStatus = project.status || 'active';
		}
		if (projectSettings) {
			industry = projectSettings.industry || '';
			primaryLanguage = projectSettings.primary_language || '';
			targetCountries = projectSettings.target_countries?.join(', ') || '';
		}
		isDirty = false;
	});

	// Check if dirty
	$effect(() => {
		if (project) {
			const projectDirty =
				projectName !== (project.name || '') ||
				websiteUrl !== (project.website_url || '') ||
				projectStatus !== project.status;

			const settingsDirty =
				industry !== (projectSettings?.industry || '') ||
				primaryLanguage !== (projectSettings?.primary_language || '') ||
				targetCountries !== (projectSettings?.target_countries?.join(', ') || '');

			isDirty = projectDirty || settingsDirty;
		}
	});

	async function saveSettings() {
		if (!workspace || !project || !canEdit) return;

		isSaving = true;

		try {
			// Update project basic info
			const projectResponse = await fetch(`/api/workspaces/${workspace.id}/projects/${project.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: projectName.trim(),
					website_url: websiteUrl || null,
					status: projectStatus
				})
			});

			if (!projectResponse.ok) {
				const error = await projectResponse.json();
				throw new Error(error.error || 'Failed to update project');
			}

			// Update project settings
			const countriesArray = targetCountries
				.split(',')
				.map((c) => c.trim())
				.filter((c) => c.length > 0);

			const settingsResponse = await fetch(`/api/workspaces/${workspace.id}/projects/${project.id}/settings`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					industry: industry.trim() || null,
					primary_language: primaryLanguage.trim() || null,
					target_countries: countriesArray
				})
			});

			if (!settingsResponse.ok) {
				const error = await settingsResponse.json();
				throw new Error(error.error || 'Failed to update project settings');
			}

			toast.success('Project settings updated successfully');
			isDirty = false;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update project');
		} finally {
			isSaving = false;
		}
	}

	function resetForm() {
		if (project) {
			projectName = project.name || '';
			websiteUrl = project.website_url || '';
			projectStatus = project.status || 'active';
		}
		if (projectSettings) {
			industry = projectSettings.industry || '';
			primaryLanguage = projectSettings.primary_language || '';
			targetCountries = projectSettings.target_countries?.join(', ') || '';
		}
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

	// Update context reactively when isDirty or isSaving changes
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
		<h1 class="text-2xl font-bold">Overview</h1>
		<p class="text-muted-foreground">Basic project information and settings</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>General Settings</CardTitle>
			<CardDescription>Update your project information</CardDescription>
		</CardHeader>
		<CardContent>
			<Field.Set>
				<Field.Legend>Project Details</Field.Legend>
				<Field.Description>Basic information about your project</Field.Description>
				<Field.Separator />
				<Field.Group>
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label for="project-name">Project Name</Field.Label>
							<Field.Description>Name of your project</Field.Description>
						</Field.Content>
						<Input
							id="project-name"
							bind:value={projectName}
							placeholder="My Project"
							disabled={isSaving || !canEdit}
						/>
					</Field.Field>
					<Field.Separator />
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label for="website-url">Website URL</Field.Label>
							<Field.Description>Your project's website URL</Field.Description>
						</Field.Content>
						<Input
							id="website-url"
							bind:value={websiteUrl}
							placeholder="https://example.com"
							type="url"
							disabled={isSaving || !canEdit}
						/>
					</Field.Field>
					<Field.Separator />
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label for="project-status">Status</Field.Label>
							<Field.Description>Project status</Field.Description>
						</Field.Content>
						<Select.Root
							type="single"
							bind:value={projectStatus}
							disabled={isSaving || !canEdit}
						>
							<Select.Trigger id="project-status">
								{statusLabel}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="active" label="Active">Active</Select.Item>
								<Select.Item value="archived" label="Archived">Archived</Select.Item>
							</Select.Content>
						</Select.Root>
					</Field.Field>
				</Field.Group>
			</Field.Set>

			<Field.Set>
				<Field.Legend>Project Metadata</Field.Legend>
				<Field.Description>Industry, language, and target markets for your project</Field.Description>
				<Field.Separator />
				<Field.Group>
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label for="industry">Industry</Field.Label>
							<Field.Description>Industry sector (e.g., SaaS, E-commerce, Healthcare)</Field.Description>
						</Field.Content>
						<Input
							id="industry"
							bind:value={industry}
							placeholder="e.g., SaaS, E-commerce, Healthcare"
							disabled={isSaving || !canEdit}
						/>
					</Field.Field>
					<Field.Separator />
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label for="primary-language">Primary Language</Field.Label>
							<Field.Description>Main language code (e.g., en-US, es-ES)</Field.Description>
						</Field.Content>
						<Input
							id="primary-language"
							bind:value={primaryLanguage}
							placeholder="e.g., en-US, es-ES"
							disabled={isSaving || !canEdit}
						/>
					</Field.Field>
					<Field.Separator />
					<Field.Field orientation="responsive">
						<Field.Content>
							<Field.Label for="target-countries">Target Countries</Field.Label>
							<Field.Description>Countries where your project operates (comma-separated)</Field.Description>
						</Field.Content>
						<Input
							id="target-countries"
							bind:value={targetCountries}
							placeholder="e.g., US, MX, ES"
							disabled={isSaving || !canEdit}
						/>
					</Field.Field>
				</Field.Group>
			</Field.Set>

			<Field.Set>
				<Field.Legend>Project URL</Field.Legend>
				<Field.Description>The unique URL for this project</Field.Description>
				<Field.Separator />
				<Field.Group>
					<Field.Field orientation="responsive">
						<div class="p-3 bg-muted rounded-md text-sm font-mono">
							portal.urion.ai/w/{workspace?.slug}/p/{project?.slug}
						</div>
					</Field.Field>
				</Field.Group>
			</Field.Set>
		</CardContent>
	</Card>
</div>
