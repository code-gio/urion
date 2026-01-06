<script lang="ts">
	import { goto } from '$app/navigation';
	import { generateSlug } from '$lib/utils/slug.js';
	import { setLastWorkspace } from '$lib/utils/redirect.js';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { workspaceCreateSchema } from '../schemas/workspace.js';

	let workspaceName = $state('');
	let workspaceSlug = $derived(generateSlug(workspaceName));
	let isCreating = $state(false);

	let { variant = 'default', showTitle = true, showDescription = true } = $props();

	async function createWorkspace() {
		if (!workspaceName.trim() || !workspaceSlug) {
			toast.error('Please enter a workspace name');
			return;
		}

		// Validate with schema
		const validation = workspaceCreateSchema.safeParse({
			name: workspaceName.trim(),
			slug: workspaceSlug,
		});

		if (!validation.success) {
			const firstError = validation.error.issues[0];
			toast.error(firstError.message);
			return;
		}

		isCreating = true;

		try {
			const response = await fetch('/api/workspaces', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					name: workspaceName.trim(),
					slug: workspaceSlug,
				}),
			});

			if (!response.ok) {
				let errorMessage = 'Failed to create workspace';
				try {
					const errorData = await response.json();
					errorMessage = errorData.error || errorData.message || errorMessage;
				} catch {
					errorMessage = `Server error: ${response.status} ${response.statusText}`;
				}
				throw new Error(errorMessage);
			}

			const { workspace } = await response.json();
			setLastWorkspace(workspace.slug);
			toast.success('Workspace created successfully');
			goto(`/w/${workspace.slug}`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to create workspace');
		} finally {
			isCreating = false;
		}
	}
</script>

<Card class={variant === 'dashed' ? 'border-dashed' : ''}>
	{#if showTitle}
		<CardHeader>
			<CardTitle>
				{variant === 'dashed' ? 'Create New Workspace' : 'Create Your Workspace'}
			</CardTitle>
			{#if showDescription}
				<CardDescription>
					{variant === 'dashed'
						? 'Start a new workspace for your team'
						: 'Get started by creating your first workspace'}
				</CardDescription>
			{/if}
		</CardHeader>
	{/if}
	<CardContent class="space-y-4">
		<div class="space-y-2">
			<Label for="workspace-name">Workspace Name</Label>
			<Input
				id="workspace-name"
				bind:value={workspaceName}
				placeholder="Acme Agency"
				disabled={isCreating}
			/>
		</div>

		{#if workspaceSlug}
			<div class="space-y-2">
				<Label>Slug</Label>
				<div class="p-2 bg-muted rounded-md text-sm font-mono">
					{workspaceSlug}
				</div>
			</div>
		{/if}

		<Button onclick={createWorkspace} disabled={isCreating} variant={variant === 'dashed' ? 'outline' : 'default'} class="w-full">
			{isCreating ? 'Creating...' : 'Create Workspace'}
		</Button>
	</CardContent>
</Card>

