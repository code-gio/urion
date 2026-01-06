<script lang="ts">
	import type { ProjectPageData } from '$lib/types';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';

	let { data, parent }: { data: ProjectPageData; parent: any } = $props();

	const project = $derived(parent?.project);
</script>

<div class="container mx-auto py-8 px-4">
	<h1 class="text-3xl font-bold mb-8">SEO Tool</h1>

	<Card>
		<CardHeader>
			<CardTitle>SEO Analysis for {project?.name}</CardTitle>
			<CardDescription>Optimize your website's search engine performance</CardDescription>
		</CardHeader>
		<CardContent>
			<p class="text-muted-foreground">SEO tools coming soon...</p>
		</CardContent>
	</Card>
</div>

