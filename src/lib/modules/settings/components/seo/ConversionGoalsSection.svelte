<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import ConversionGoalList from '$lib/modules/project/settings/components/conversion-goals/ConversionGoalList.svelte';
	import type { ProjectConversionGoal } from '$lib/types/project-settings.js';

	interface Props {
		workspace: any;
		project: any;
		goals: ProjectConversionGoal[];
		canEdit: boolean;
	}

	let { workspace, project, goals: initialGoals, canEdit }: Props = $props();

	let goals = $state<ProjectConversionGoal[]>(initialGoals || []);

	$effect(() => {
		goals = initialGoals || [];
	});
</script>

<Card>
	<CardHeader>
		<CardTitle>Conversion Goals</CardTitle>
		<CardDescription>Track and manage conversion goals and events</CardDescription>
	</CardHeader>
	<CardContent>
		<ConversionGoalList
			bind:goals={goals}
			workspaceId={workspace.id}
			projectId={project.id}
			{canEdit}
		/>
	</CardContent>
</Card>
