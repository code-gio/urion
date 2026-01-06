<script lang="ts">
	import { goto } from '$app/navigation';
	import { generateSlug } from '$lib/utils/slug.js';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { projectCreateSchema } from '../schemas/project.js';

	let { workspaceId }: { workspaceId: string } = $props();

	let projectName = $state('');
	let projectSlug = $derived(generateSlug(projectName));
	let websiteUrl = $state('');
	let isCreating = $state(false);

	async function createProject() {
		const trimmedName = projectName.trim();

		if (!trimmedName) {
			toast.error('Please enter a project name');
			return;
		}

		if (!workspaceId) {
			toast.error('Workspace not loaded. Please refresh the page.');
			return;
		}

		if (!projectSlug || projectSlug.length === 0) {
			toast.error('Project name must contain at least one letter or number');
			return;
		}

		// Validate with schema
		const validation = projectCreateSchema.safeParse({
			name: trimmedName,
			slug: projectSlug,
			website_url: websiteUrl || undefined,
		});

		if (!validation.success) {
			const firstError = validation.error.issues[0];
			toast.error(firstError.message);
			return;
		}

		isCreating = true;

		try {
			const response = await fetch(`/api/workspaces/${workspaceId}/projects`, {
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
			projectName = '';
			websiteUrl = '';
		}
	}
</script>

<Card>
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

