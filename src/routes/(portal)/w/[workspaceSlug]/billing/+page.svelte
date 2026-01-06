<script lang="ts">
	import type { WorkspaceSettingsPageData } from '$lib/types';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';

	let { data, parent }: { data: WorkspaceSettingsPageData; parent: any } = $props();

	const workspace = $derived(parent?.workspace);
</script>

<div class="container mx-auto py-8 px-4 max-w-2xl">
	<h1 class="text-3xl font-bold mb-8">Billing</h1>

	<Card>
		<CardHeader>
			<CardTitle>Billing Information</CardTitle>
			<CardDescription>Manage your workspace billing and subscription</CardDescription>
		</CardHeader>
		<CardContent>
			<p class="text-muted-foreground">Billing management coming soon...</p>
		</CardContent>
	</Card>
</div>

