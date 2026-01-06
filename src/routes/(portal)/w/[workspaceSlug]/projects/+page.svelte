<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { ProjectCreateDialog } from '$lib/modules/project/components/index.js';
	import { usePortal } from '$lib/stores/portal.svelte.js';
	import type { Project } from '$lib/types';

	let { data }: { data: { projects: Project[]; workspace: any } } = $props();

	const portal = usePortal();

	// Read from unified portal store
	const workspace = $derived(portal.currentWorkspace);
	const workspaceId = $derived(workspace?.id || '');
	const projects = $derived(portal.currentWorkspaceProjects);
	let dialogOpen = $state(false);
</script>

<div class="container mx-auto py-8 px-4">
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-3xl font-bold mb-2">Projects</h1>
			<p class="text-muted-foreground">Manage your workspace projects</p>
		</div>
		<Button onclick={() => (dialogOpen = true)}>
			Create Project
		</Button>
	</div>

	{#if projects.length === 0}
		<Card>
			<CardContent class="py-12 text-center">
				<p class="text-muted-foreground mb-4">No projects yet</p>
				<Button onclick={() => (dialogOpen = true)}>Create Your First Project</Button>
			</CardContent>
		</Card>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each projects as project}
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

<ProjectCreateDialog {workspaceId} bind:open={dialogOpen} />

