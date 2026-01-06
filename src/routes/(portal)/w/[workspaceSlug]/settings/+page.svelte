<script lang="ts">
	import type { WorkspaceSettingsPageData } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';

	let { data, parent }: { data: WorkspaceSettingsPageData; parent: any } = $props();

	const workspace = $derived(parent?.workspace);

	let workspaceName = $state(workspace?.name || '');
	let isSaving = $state(false);

	async function saveSettings() {
		if (!workspace) return;

		isSaving = true;

		try {
			const response = await fetch(`/api/workspaces/${workspace.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: workspaceName.trim(),
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to update workspace');
			}

			toast.success('Workspace settings updated successfully');
			// Refresh page data
			goto('.', { invalidateAll: true });
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update workspace');
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="container mx-auto py-8 px-4 max-w-2xl">
	<h1 class="text-3xl font-bold mb-8">Workspace Settings</h1>

	<Card>
		<CardHeader>
			<CardTitle>General Settings</CardTitle>
			<CardDescription>Update your workspace information</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="space-y-2">
				<Label for="workspace-name">Workspace Name</Label>
				<Input
					id="workspace-name"
					bind:value={workspaceName}
					placeholder="My Workspace"
					disabled={isSaving}
				/>
			</div>

			<div class="space-y-2">
				<Label>Workspace URL</Label>
				<div class="p-2 bg-muted rounded-md text-sm font-mono">
					portal.urion.ai/w/{workspace?.slug}
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

