<script lang="ts">
	import type { ProjectPageData } from '$lib/types';
	import { ToolsGrid } from '$lib/modules/tools';
	import { toolsApi } from '$lib/api/tools-client.js';
	import { usePortal } from '$lib/stores/portal.svelte.js';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: ProjectPageData } = $props();

	const portal = usePortal();
	const project = $derived(portal.currentProject);
	const workspace = $derived(portal.currentWorkspace);

	let tools = $state<any[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadTools() {
		if (!workspace || !project) return;

		loading = true;
		error = null;

		try {
			const response = await toolsApi.getProjectTools(workspace.id, project.id, {
				filter: 'all',
			});
			tools = response.tools;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load tools';
			console.error('Error loading tools:', err);
		} finally {
			loading = false;
		}
	}

	function handleToolActivated() {
		loadTools();
		invalidateAll();
	}

	function handleToolDeactivated() {
		loadTools();
		invalidateAll();
	}

	$effect(() => {
		if (workspace && project) {
			loadTools();
		}
	});
</script>

<div class="container mx-auto ">
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Tools & Integrations</h1>
		<p class="text-muted-foreground">
			Connect and manage tools for {project?.name || 'this project'}
		</p>
	</div>

	{#if error}
		<div class="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg">
			<p>{error}</p>
		</div>
	{/if}

	{#if workspace && project}
		<ToolsGrid
			tools={tools}
			workspaceId={workspace.id}
			projectId={project.id}
			{loading}
			onToolActivated={handleToolActivated}
			onToolDeactivated={handleToolDeactivated}
		/>
	{/if}
</div>

