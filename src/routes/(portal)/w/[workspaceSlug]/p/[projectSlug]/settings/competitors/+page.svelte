<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import CompetitorList from '$lib/modules/project/settings/components/competitors/CompetitorList.svelte';
	import type { ProjectCompetitor } from '$lib/types/project-settings.js';

	let { data }: { data: any } = $props();

	const workspace = $derived(data.workspace);
	const project = $derived(data.project);
	const canEdit = $derived(data.canEdit);
	let competitors = $state<ProjectCompetitor[]>(data.competitors || []);

	// Sync competitors when data changes
	$effect(() => {
		competitors = data.competitors || [];
	});
</script>

<div class="max-w-4xl space-y-6">
	<div>
		<h1 class="text-2xl font-bold">Competitors</h1>
		<p class="text-muted-foreground">Track and analyze your competitors</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Competitor List</CardTitle>
			<CardDescription>Manage your list of competitors for analysis and tracking</CardDescription>
		</CardHeader>
		<CardContent>
			<CompetitorList
				bind:competitors={competitors}
				workspaceId={workspace.id}
				projectId={project.id}
				{canEdit}
			/>
		</CardContent>
	</Card>
</div>
