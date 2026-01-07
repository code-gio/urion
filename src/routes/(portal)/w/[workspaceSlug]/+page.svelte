<script lang="ts">
	import { goto } from '$app/navigation';
	import type { WorkspacePageData } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { usePortal } from '$lib/stores/portal.svelte.js';

	let { data }: { data: WorkspacePageData } = $props();

	const portal = usePortal();

	// Read from unified portal store
	const workspace = $derived(portal.currentWorkspace);
	// Use data.projects from server load which includes website_url and status
	const projects = $derived(data.projects || []);
	const hasProjects = $derived(projects.length > 0);
</script>

<div class="container mx-auto py-8 px-4">
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Welcome to {workspace?.name}</h1>
		<p class="text-muted-foreground">Your workspace dashboard</p>
	</div>

	{#if !hasProjects}
		<!-- Empty State -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
			<Card class="cursor-pointer hover:shadow-lg transition-shadow" onclick={() => goto('projects')}>
				<CardHeader>
					<CardTitle>Create First Project</CardTitle>
					<CardDescription>Start by creating your first project</CardDescription>
				</CardHeader>
				<CardContent>
					<Button class="w-full">Create Project</Button>
				</CardContent>
			</Card>

			<Card class="cursor-pointer hover:shadow-lg transition-shadow" onclick={() => goto('members')}>
				<CardHeader>
					<CardTitle>Invite Team Members</CardTitle>
					<CardDescription>Collaborate with your team</CardDescription>
				</CardHeader>
				<CardContent>
					<Button variant="outline" class="w-full">Invite Members</Button>
				</CardContent>
			</Card>
		</div>

		<!-- Progress Checklist -->
		<Card>
			<CardHeader>
				<CardTitle>Getting Started</CardTitle>
			</CardHeader>
			<CardContent class="space-y-2">
				<div class="flex items-center gap-2">
					<span class="text-green-500">✓</span>
					<span>Workspace created</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-muted-foreground">○</span>
					<span>Create first project</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-muted-foreground">○</span>
					<span>Invite team members</span>
				</div>
			</CardContent>
		</Card>
	{:else}
		<!-- Projects List -->
		<div class="mb-8">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-2xl font-semibold">Projects</h2>
				<Button onclick={() => goto('projects')}>View All</Button>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each projects.slice(0, 6) as project}
					<Card
						class="cursor-pointer hover:shadow-lg transition-shadow"
						onclick={() => goto(`/w/${workspace?.slug}/p/${project.slug}`)}
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
		</div>
	{/if}
</div>

