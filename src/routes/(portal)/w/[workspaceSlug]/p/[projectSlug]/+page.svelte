<script lang="ts">
	import type { ProjectPageData } from '$lib/types';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { useProject } from '$lib/stores/index.js';

	let { data }: { data: ProjectPageData } = $props();

	const projectState = useProject();
	const project = $derived(projectState.current || data.project);
</script>

<div class="container mx-auto py-8 px-4">
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">{project?.name}</h1>
		<div class="flex items-center gap-2">
			<Badge variant="outline">{project?.status}</Badge>
			{#if project?.website_url}
				<a
					href={project.website_url}
					target="_blank"
					rel="noopener noreferrer"
					class="text-sm text-muted-foreground hover:underline"
				>
					{project.website_url}
				</a>
			{/if}
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		<Card class="cursor-pointer hover:shadow-lg transition-shadow">
			<CardHeader>
				<CardTitle>SEO</CardTitle>
				<CardDescription>Optimize your SEO</CardDescription>
			</CardHeader>
		</Card>

		<Card class="cursor-pointer hover:shadow-lg transition-shadow">
			<CardHeader>
				<CardTitle>Analytics</CardTitle>
				<CardDescription>View project analytics</CardDescription>
			</CardHeader>
		</Card>

		<Card class="cursor-pointer hover:shadow-lg transition-shadow">
			<CardHeader>
				<CardTitle>Files</CardTitle>
				<CardDescription>Manage project files</CardDescription>
			</CardHeader>
		</Card>

		<Card class="cursor-pointer hover:shadow-lg transition-shadow">
			<CardHeader>
				<CardTitle>Settings</CardTitle>
				<CardDescription>Configure project settings</CardDescription>
			</CardHeader>
		</Card>
	</div>
</div>

