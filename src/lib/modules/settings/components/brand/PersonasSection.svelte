<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import PersonaList from '$lib/modules/project/settings/components/personas/PersonaList.svelte';
	import type { ProjectPersona } from '$lib/types/project-settings.js';

	interface Props {
		workspace: any;
		project: any;
		personas: ProjectPersona[];
		canEdit: boolean;
	}

	let { workspace, project, personas: initialPersonas, canEdit }: Props = $props();

	let personas = $state<ProjectPersona[]>(initialPersonas || []);

	$effect(() => {
		personas = initialPersonas || [];
	});
</script>

<Card>
	<CardHeader>
		<CardTitle>Personas</CardTitle>
		<CardDescription>Define your target audience personas</CardDescription>
	</CardHeader>
	<CardContent>
		<PersonaList
			bind:personas={personas}
			workspaceId={workspace.id}
			projectId={project.id}
			{canEdit}
		/>
	</CardContent>
</Card>
