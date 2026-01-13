<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import CompetitorList from '$lib/modules/project/settings/components/competitors/CompetitorList.svelte';
	import type { ProjectCompetitor } from '$lib/types/project-settings.js';

	interface Props {
		workspace: any;
		project: any;
		competitors: ProjectCompetitor[];
		canEdit: boolean;
	}

	let { workspace, project, competitors: initialCompetitors, canEdit }: Props = $props();

	let competitors = $state<ProjectCompetitor[]>(initialCompetitors || []);

	// Sync competitors when prop changes
	$effect(() => {
		competitors = initialCompetitors || [];
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
