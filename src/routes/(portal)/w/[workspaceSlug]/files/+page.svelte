<script lang="ts">
	import type { WorkspaceSettingsPageData } from '$lib/types';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';

	let { data, parent }: { data: WorkspaceSettingsPageData; parent: any } = $props();

	const workspace = $derived(parent?.workspace);
</script>

<div class="container mx-auto py-8 px-4">
	<h1 class="text-3xl font-bold mb-8">Files</h1>

	<Card>
		<CardHeader>
			<CardTitle>Workspace Files</CardTitle>
			<CardDescription>Manage files for {workspace?.name}</CardDescription>
		</CardHeader>
		<CardContent>
			<p class="text-muted-foreground">File management coming soon...</p>
		</CardContent>
	</Card>
</div>

