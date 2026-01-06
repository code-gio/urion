<script lang="ts">
	import { goto } from '$app/navigation';
	import { generateSlug } from '$lib/utils/slug.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { toast } from 'svelte-sonner';
	import { projectCreateSchema } from '../schemas/project.js';

	let { workspaceId, open = $bindable(false) }: { workspaceId: string; open?: boolean } = $props();

	let projectName = $state('');
	let projectSlug = $derived(generateSlug(projectName));
	let websiteUrl = $state('');
	let isCreating = $state(false);

	$effect(() => {
		if (!open) {
			projectName = '';
			websiteUrl = '';
		}
	});

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
			open = false;
			projectName = '';
			websiteUrl = '';
			goto(`p/${project.slug}`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to create project');
		} finally {
			isCreating = false;
		}
	}

</script>

<Dialog.Root bind:open={open}>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			createProject();
		}}
	>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Create New Project</Dialog.Title>
				<Dialog.Description>Add a new project to your workspace</Dialog.Description>
			</Dialog.Header>
			<div class="grid gap-4">
				<div class="grid gap-3">
					<Label for="project-name">Project Name</Label>
					<Input
						id="project-name"
						name="project-name"
						bind:value={projectName}
						placeholder="My Website"
						disabled={isCreating}
						required
					/>
				</div>

				{#if projectSlug}
					<div class="grid gap-3">
						<Label>Slug</Label>
						<div class="p-2 bg-muted rounded-md text-sm font-mono">
							{projectSlug}
						</div>
					</div>
				{/if}

				<div class="grid gap-3">
					<Label for="website-url">Website URL (Optional)</Label>
					<Input
						id="website-url"
						name="website-url"
						bind:value={websiteUrl}
						placeholder="https://example.com"
						type="url"
						disabled={isCreating}
					/>
				</div>
			</div>
			<Dialog.Footer>
				<Dialog.Close class={buttonVariants({ variant: 'outline' })}>Cancel</Dialog.Close>
				<Button type="submit" disabled={isCreating}>
					{isCreating ? 'Creating...' : 'Create Project'}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</form>
</Dialog.Root>

