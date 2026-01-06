<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { generateSlug } from '$lib/utils/slug.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { toast } from 'svelte-sonner';
	import { projectCreateSchema } from '../schemas/project.js';
	import { useWorkspace, useProject } from '$lib/stores/index.js';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	const workspaceState = useWorkspace();
	const projectState = useProject();

	const workspaceId = $derived(workspaceState.current?.id || '');
	const workspaceSlug = $derived(workspaceState.current?.slug || '');

	const workspaceSlugFromPath = $derived.by(() => {
		const pathname = page.url.pathname;
		const match = pathname.match(/^\/w\/([^/]+)/);
		return match ? match[1] : '';
	});

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
			const project = await projectState.createProject(
				workspaceId,
				trimmedName,
				projectSlug,
				websiteUrl || null
			);

			toast.success('Project created successfully');
			open = false;
			projectName = '';
			websiteUrl = '';
			
			const slug = workspaceSlug || workspaceSlugFromPath;
			if (slug) {
				goto(`/w/${slug}/p/${project.slug}`);
			} else {
				goto(`p/${project.slug}`);
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to create project');
		} finally {
			isCreating = false;
		}
	}

</script>

<Dialog.Root bind:open={open}>
	<Dialog.Content class="sm:max-w-[425px]">
		{#snippet children()}
			<form
				onsubmit={(e) => {
					e.preventDefault();
					createProject();
				}}
			>
				<Dialog.Header>
					<Dialog.Title>Create New Project</Dialog.Title>
					<Dialog.Description>Add a new project to your workspace</Dialog.Description>
				</Dialog.Header>
				<div class="grid gap-4 ">
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
			</form>
		{/snippet}
	</Dialog.Content>
</Dialog.Root>

