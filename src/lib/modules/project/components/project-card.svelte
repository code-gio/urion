<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Project } from '$lib/types';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	let { project, workspaceSlug }: { project: Project; workspaceSlug?: string } = $props();

	function handleClick() {
		if (workspaceSlug) {
			goto(`/w/${workspaceSlug}/p/${project.slug}`);
		} else {
			goto(`p/${project.slug}`);
		}
	}
</script>

<Card
	class="cursor-pointer hover:shadow-lg transition-shadow"
	onclick={handleClick}
>
	<CardHeader>
		<CardTitle>{project.name}</CardTitle>
		<CardDescription>{project.website_url || 'No website URL'}</CardDescription>
	</CardHeader>
	<CardContent>
		<Badge variant="outline">{project.status}</Badge>
	</CardContent>
</Card>

