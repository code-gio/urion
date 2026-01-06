<script lang="ts">
	import { goto } from '$app/navigation';
	import { generateSlug } from '$lib/utils/slug.js';
	import { setLastWorkspace } from '$lib/utils/redirect.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { toast } from 'svelte-sonner';
	import { workspaceCreateSchema } from '../schemas/workspace.js';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	let workspaceName = $state('');
	let workspaceSlug = $derived(generateSlug(workspaceName));
	let isCreating = $state(false);

	$effect(() => {
		if (!open) {
			workspaceName = '';
		}
	});

	async function createWorkspace() {
		const trimmedName = workspaceName.trim();

		if (!trimmedName) {
			toast.error('Please enter a workspace name');
			return;
		}

		if (!workspaceSlug || workspaceSlug.length === 0) {
			toast.error('Workspace name must contain at least one letter or number');
			return;
		}

		// Validate with schema
		const validation = workspaceCreateSchema.safeParse({
			name: trimmedName,
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
					name: trimmedName,
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
			open = false;
			workspaceName = '';
			goto(`/w/${workspace.slug}`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to create workspace');
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
					createWorkspace();
				}}
			>
				<Dialog.Header>
					<Dialog.Title>Create New Workspace</Dialog.Title>
					<Dialog.Description>Start a new workspace for your team</Dialog.Description>
				</Dialog.Header>
				<div class="grid gap-4">
					<div class="grid gap-3">
						<Label for="workspace-name">Workspace Name</Label>
						<Input
							id="workspace-name"
							name="workspace-name"
							bind:value={workspaceName}
							placeholder="Acme Agency"
							disabled={isCreating}
							required
						/>
					</div>

					{#if workspaceSlug}
						<div class="grid gap-3">
							<Label>Slug</Label>
							<div class="p-2 bg-muted rounded-md text-sm font-mono">
								{workspaceSlug}
							</div>
						</div>
					{/if}
				</div>
				<Dialog.Footer class="mt-6">
					<Dialog.Close class={buttonVariants({ variant: 'outline' })}>Cancel</Dialog.Close>
					<Button type="submit" disabled={isCreating}>
						{isCreating ? 'Creating...' : 'Create Workspace'}
					</Button>
				</Dialog.Footer>
			</form>
		{/snippet}
	</Dialog.Content>
</Dialog.Root>

