<script lang="ts">
	import { goto } from '$app/navigation';
	import type { ProjectPageData } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
	import { toast } from 'svelte-sonner';
	import type { ProjectStatus } from '$lib/types';

	let { data, parent }: { data: ProjectPageData; parent: any } = $props();

	const workspace = $derived(parent?.workspace);
	const project = $derived(parent?.project);

	let projectName = $state(project?.name || '');
	let websiteUrl = $state(project?.website_url || '');
	let projectStatus = $state<ProjectStatus>(project?.status || 'active');
	let isSaving = $state(false);

	async function saveSettings() {
		if (!workspace || !project) return;

		isSaving = true;

		try {
			const response = await fetch(`/api/workspaces/${workspace.id}/projects/${project.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: projectName.trim(),
					website_url: websiteUrl || null,
					status: projectStatus,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to update project');
			}

			toast.success('Project settings updated successfully');
			// Refresh page data
			goto('.', { invalidateAll: true });
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update project');
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="container mx-auto py-8 px-4 max-w-2xl">
	<h1 class="text-3xl font-bold mb-8">Project Settings</h1>

	<Card>
		<CardHeader>
			<CardTitle>General Settings</CardTitle>
			<CardDescription>Update your project information</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="space-y-2">
				<Label for="project-name">Project Name</Label>
				<Input
					id="project-name"
					bind:value={projectName}
					placeholder="My Project"
					disabled={isSaving}
				/>
			</div>

			<div class="space-y-2">
				<Label for="website-url">Website URL</Label>
				<Input
					id="website-url"
					bind:value={websiteUrl}
					placeholder="https://example.com"
					type="url"
					disabled={isSaving}
				/>
			</div>

			<div class="space-y-2">
				<Label for="project-status">Status</Label>
				<Select bind:value={projectStatus} disabled={isSaving}>
					<SelectTrigger id="project-status">
						<SelectValue placeholder="Select status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="active">Active</SelectItem>
						<SelectItem value="archived">Archived</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div class="space-y-2">
				<Label>Project URL</Label>
				<div class="p-2 bg-muted rounded-md text-sm font-mono">
					portal.urion.ai/w/{workspace?.slug}/p/{project?.slug}
				</div>
			</div>

			<div class="flex justify-end gap-2">
				<Button onclick={saveSettings} disabled={isSaving}>
					{isSaving ? 'Saving...' : 'Save Changes'}
				</Button>
			</div>
		</CardContent>
	</Card>
</div>

