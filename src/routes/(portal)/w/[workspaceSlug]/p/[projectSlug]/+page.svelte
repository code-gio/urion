<script lang="ts">
	import type { ProjectPageData } from '$lib/types';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	let { data }: { data: ProjectPageData } = $props();
</script>

<div class="container mx-auto py-8 px-4">
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">{data.project?.name}</h1>
		<div class="flex items-center gap-2">
			<Badge variant="outline">{data.project?.status}</Badge>
			{#if data.project?.website_url}
				<a
					href={data.project.website_url}
					target="_blank"
					rel="noopener noreferrer"
					class="text-sm text-muted-foreground hover:underline"
				>
					{data.project.website_url}
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

