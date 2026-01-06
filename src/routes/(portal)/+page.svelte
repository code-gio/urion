<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { generateSlug } from '$lib/utils/slug.js';
	import { setLastWorkspace } from '$lib/utils/redirect.js';
	import type { AppPageData, WorkspaceListItem } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { toast } from 'svelte-sonner';

	let { data }: { data: AppPageData } = $props();

	let workspaceName = $state('');
	let workspaceSlug = $derived(generateSlug(workspaceName));
	let isCreating = $state(false);

	async function createWorkspace() {
		if (!workspaceName.trim() || !workspaceSlug) {
			toast.error('Please enter a workspace name');
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

	function selectWorkspace(workspace: WorkspaceListItem) {
		setLastWorkspace(workspace.slug);
		goto(`/w/${workspace.slug}`);
	}

	function getRoleBadgeVariant(role: string) {
		switch (role) {
			case 'owner':
				return 'default';
			case 'admin':
				return 'secondary';
			case 'member':
				return 'outline';
			default:
				return 'outline';
		}
	}
</script>

<div class="container mx-auto py-8 px-4 max-w-6xl">
	{#if data.workspaces.length === 0}
		<!-- Empty State: Create First Workspace -->
		<div class="flex flex-col items-center justify-center min-h-[60vh]">
			<h1 class="text-3xl font-bold mb-4">Welcome to Odeon Studio</h1>
			<p class="text-muted-foreground mb-8">Create your first workspace to get started</p>

			<Card class="w-full max-w-md">
				<CardHeader>
					<CardTitle>Create Your Workspace</CardTitle>
					<CardDescription>Get started by creating your first workspace</CardDescription>
				</CardHeader>
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

					<Button onclick={createWorkspace} disabled={isCreating} class="w-full">
						{isCreating ? 'Creating...' : 'Create Workspace'}
					</Button>
				</CardContent>
			</Card>
		</div>
	{:else}
		<!-- Workspace Switcher -->
		<div>
			<div class="mb-8">
				<h1 class="text-3xl font-bold mb-2">Select Workspace</h1>
				<p class="text-muted-foreground">Choose a workspace to continue</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
				{#each data.workspaces as workspace}
					<Card
						class="cursor-pointer hover:shadow-lg transition-shadow"
						onclick={() => selectWorkspace(workspace)}
					>
						<CardHeader>
							<div class="flex items-center justify-between">
								<CardTitle>{workspace.name}</CardTitle>
								<Badge variant={getRoleBadgeVariant(workspace.role)}>
									{workspace.role}
								</Badge>
							</div>
							<CardDescription>{workspace.slug}</CardDescription>
						</CardHeader>
						<CardContent>
							<!-- TODO: Add project count and member count stats -->
						</CardContent>
					</Card>
				{/each}
			</div>

			<!-- Create New Workspace Card -->
			<Card class="border-dashed">
				<CardHeader>
					<CardTitle>Create New Workspace</CardTitle>
					<CardDescription>Start a new workspace for your team</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="space-y-2">
						<Label for="new-workspace-name">Workspace Name</Label>
						<Input
							id="new-workspace-name"
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

					<Button onclick={createWorkspace} disabled={isCreating} variant="outline">
						{isCreating ? 'Creating...' : 'Create Workspace'}
					</Button>
				</CardContent>
			</Card>
		</div>
	{/if}
</div>
