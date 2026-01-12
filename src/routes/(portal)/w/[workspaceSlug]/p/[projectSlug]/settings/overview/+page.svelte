<script lang="ts">
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { FormSection } from '$lib/modules/project/settings';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select/index.js';
	import { toast } from 'svelte-sonner';
	import type { ProjectStatus } from '$lib/types';

	let { data }: { data: any } = $props();

	const workspace = $derived(data.workspace);
	const project = $derived(data.project);
	const canEdit = $derived(data.canEdit);

	let projectName = $state(project?.name || '');
	let websiteUrl = $state(project?.website_url || '');
	let projectStatus = $state<ProjectStatus>(project?.status || 'active');
	let isSaving = $state(false);
	let isDirty = $state(false);

	const statusLabel = $derived(projectStatus === 'active' ? 'Active' : 'Archived');

	// Track initial state
	$effect(() => {
		if (project) {
			projectName = project.name || '';
			websiteUrl = project.website_url || '';
			projectStatus = project.status || 'active';
			isDirty = false;
		}
	});

	// Check if dirty
	$effect(() => {
		if (project) {
			isDirty =
				projectName !== (project.name || '') ||
				websiteUrl !== (project.website_url || '') ||
				projectStatus !== project.status;
		}
	});

	async function saveSettings() {
		if (!workspace || !project || !canEdit) return;

		isSaving = true;

		try {
			const response = await fetch(`/api/workspaces/${workspace.id}/projects/${project.id}`, {
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

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to update project');
			}

			toast.success('Project settings updated successfully');
			goto('.', { invalidateAll: true });
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

	if (canEdit && settingsShell) {
		settingsShell.setActions({
			onSave: saveSettings,
			onCancel: resetForm,
			isDirty,
			isSaving
		});
	}
</script>

<div class="max-w-3xl space-y-6">
	<div>
		<h1 class="text-2xl font-bold">Overview</h1>
		<p class="text-muted-foreground">Basic project information and settings</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>General Settings</CardTitle>
			<CardDescription>Update your project information</CardDescription>
		</CardHeader>
		<CardContent class="space-y-6">
			<FormSection title="Project Details" description="Basic information about your project">
				<div class="space-y-4">
					<div class="space-y-2">
						<Label for="project-name">Project Name</Label>
						<Input
							id="project-name"
							bind:value={projectName}
							placeholder="My Project"
							disabled={isSaving || !canEdit}
						/>
					</div>

					<div class="space-y-2">
						<Label for="website-url">Website URL</Label>
						<Input
							id="website-url"
							bind:value={websiteUrl}
							placeholder="https://example.com"
							type="url"
							disabled={isSaving || !canEdit}
						/>
					</div>

					<div class="space-y-2">
						<Label for="project-status">Status</Label>
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
					</div>
				</div>
			</FormSection>

			<FormSection title="Project URL" description="The unique URL for this project">
				<div class="p-3 bg-muted rounded-md text-sm font-mono">
					portal.urion.ai/w/{workspace?.slug}/p/{project?.slug}
				</div>
			</FormSection>
		</CardContent>
	</Card>
</div>
