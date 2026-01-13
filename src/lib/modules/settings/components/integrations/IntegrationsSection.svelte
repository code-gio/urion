<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import IntegrationList from '$lib/modules/project/settings/components/integrations/IntegrationList.svelte';
	import type { ProjectIntegration } from '$lib/types/project-settings.js';

	interface Props {
		workspace: any;
		project: any;
		integrations: ProjectIntegration[];
		canEdit: boolean;
	}

	let { workspace, project, integrations: initialIntegrations, canEdit }: Props = $props();

	let integrations = $state<ProjectIntegration[]>(initialIntegrations || []);

	$effect(() => {
		integrations = initialIntegrations || [];
	});
</script>

<div class="w-full max-w-4xl space-y-6">
	<div>
		<h1 class="text-2xl font-bold">Integrations</h1>
		<p class="text-muted-foreground">Manage third-party integrations</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Integration List</CardTitle>
			<CardDescription>Configure and manage your third-party integrations</CardDescription>
		</CardHeader>
		<CardContent>
			<IntegrationList
				bind:integrations={integrations}
				workspaceId={workspace.id}
				projectId={project.id}
				{canEdit}
			/>
		</CardContent>
	</Card>
</div>
