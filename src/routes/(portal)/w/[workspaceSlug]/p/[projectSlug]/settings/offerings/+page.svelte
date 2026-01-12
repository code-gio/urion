<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import OfferingList from '$lib/modules/project/settings/components/offerings/OfferingList.svelte';
	import type { ProjectOffering } from '$lib/types/project-settings.js';

	let { data }: { data: any } = $props();

	const workspace = $derived(data.workspace);
	const project = $derived(data.project);
	const canEdit = $derived(data.canEdit);
	let offerings = $state<ProjectOffering[]>(data.offerings || []);

	$effect(() => {
		offerings = data.offerings || [];
	});
</script>

<div class="max-w-4xl space-y-6">
	<div>
		<h1 class="text-2xl font-bold">Offerings</h1>
		<p class="text-muted-foreground">Manage your products and services</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Offering List</CardTitle>
			<CardDescription>Manage your list of products, services, and offerings</CardDescription>
		</CardHeader>
		<CardContent>
			<OfferingList
				bind:offerings={offerings}
				workspaceId={workspace.id}
				projectId={project.id}
				{canEdit}
			/>
		</CardContent>
	</Card>
</div>
