<script lang="ts">
	import { goto } from '$app/navigation';
	import { generateSlug } from '$lib/utils/slug.js';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { toast } from 'svelte-sonner';
	import type { Project } from '$lib/types';

	let { data }: { data: { projects: Project[]; workspace: any } } = $props();

	const workspace = $derived(data.workspace);

	let projectName = $state('');
	let projectSlug = $derived(generateSlug(projectName));
	let websiteUrl = $state('');
	let isCreating = $state(false);
	let showCreateForm = $state(false);

	async function createProject() {
		const trimmedName = projectName.trim();
		
		if (!trimmedName) {
			toast.error('Please enter a project name');
			return;
		}

		if (!workspace) {
			toast.error('Workspace not loaded. Please refresh the page.');
			return;
		}

		if (!projectSlug || projectSlug.length === 0) {
			toast.error('Project name must contain at least one letter or number');
			return;
		}

		isCreating = true;

		try {
			const response = await fetch(`/api/workspaces/${workspace.id}/projects`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					name: projectName.trim(),
					slug: projectSlug,
					website_url: websiteUrl || null,
				}),
			});

			if (!response.ok) {
				let errorMessage = 'Failed to create project';
				try {
					const errorData = await response.json();
					errorMessage = errorData.error || errorData.message || errorMessage;
				} catch {
					errorMessage = `Server error: ${response.status} ${response.statusText}`;
				}
				throw new Error(errorMessage);
			}

			const project = await response.json();
			toast.success('Project created successfully');
			goto(`p/${project.slug}`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to create project');
		} finally {
			isCreating = false;
			showCreateForm = false;
			projectName = '';
			websiteUrl = '';
		}
	}
</script>

<div class="container mx-auto py-8 px-4">
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-3xl font-bold mb-2">Projects</h1>
			<p class="text-muted-foreground">Manage your workspace projects</p>
		</div>
		<Button onclick={() => (showCreateForm = !showCreateForm)}>
			{showCreateForm ? 'Cancel' : 'Create Project'}
		</Button>
	</div>

	{#if showCreateForm}
		<Card class="mb-8">
			<CardHeader>
				<CardTitle>Create New Project</CardTitle>
				<CardDescription>Add a new project to your workspace</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<form
					onsubmit={(e) => {
						e.preventDefault();
						createProject();
					}}
					class="space-y-4"
				>
					<div class="space-y-2">
						<Label for="project-name">Project Name</Label>
						<Input
							id="project-name"
							bind:value={projectName}
							placeholder="My Website"
							disabled={isCreating}
							required
						/>
					</div>

					{#if projectSlug}
						<div class="space-y-2">
							<Label>Slug</Label>
							<div class="p-2 bg-muted rounded-md text-sm font-mono">
								{projectSlug}
							</div>
						</div>
					{/if}

					<div class="space-y-2">
						<Label for="website-url">Website URL (Optional)</Label>
						<Input
							id="website-url"
							bind:value={websiteUrl}
							placeholder="https://example.com"
							type="url"
							disabled={isCreating}
						/>
					</div>

					<Button type="submit" disabled={isCreating} class="w-full">
						{isCreating ? 'Creating...' : 'Create Project'}
					</Button>
				</form>
			</CardContent>
		</Card>
	{/if}

	{#if data.projects.length === 0}
		<Card>
			<CardContent class="py-12 text-center">
				<p class="text-muted-foreground mb-4">No projects yet</p>
				<Button onclick={() => (showCreateForm = true)}>Create Your First Project</Button>
			</CardContent>
		</Card>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each data.projects as project}
				<Card
					class="cursor-pointer hover:shadow-lg transition-shadow"
					onclick={() => goto(`p/${project.slug}`)}
				>
					<CardHeader>
						<CardTitle>{project.name}</CardTitle>
						<CardDescription>{project.website_url || 'No website URL'}</CardDescription>
					</CardHeader>
					<CardContent>
						<Badge variant="outline">{project.status}</Badge>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>

