<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import LocationList from '$lib/modules/project/settings/components/locations/LocationList.svelte';
	import type { ProjectLocation } from '$lib/types/project-settings.js';

	interface Props {
		workspace: any;
		project: any;
		locations: ProjectLocation[];
		canEdit: boolean;
	}

	let { workspace, project, locations: initialLocations, canEdit }: Props = $props();

	let locations = $state<ProjectLocation[]>(initialLocations || []);

	$effect(() => {
		locations = initialLocations || [];
	});
</script>

<Card>
	<CardHeader>
		<CardTitle>Locations</CardTitle>
		<CardDescription>Manage your physical business locations</CardDescription>
	</CardHeader>
	<CardContent>
		<LocationList
			bind:locations={locations}
			workspaceId={workspace.id}
			projectId={project.id}
			{canEdit}
		/>
	</CardContent>
</Card>
