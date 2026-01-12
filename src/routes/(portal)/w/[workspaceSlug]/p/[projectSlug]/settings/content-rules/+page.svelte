<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import ContentRuleList from '$lib/modules/project/settings/components/content-rules/ContentRuleList.svelte';
	import type { ProjectContentRule } from '$lib/types/project-settings.js';

	let { data }: { data: any } = $props();

	const workspace = $derived(data.workspace);
	const project = $derived(data.project);
	const canEdit = $derived(data.canEdit);
	let rules = $state<ProjectContentRule[]>(data.rules || []);

	$effect(() => {
		rules = data.rules || [];
	});
</script>

<div class="max-w-4xl space-y-6">
	<div>
		<h1 class="text-2xl font-bold">Content Rules</h1>
		<p class="text-muted-foreground">Define rules for content management, AI usage, and indexing</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Content Rules</CardTitle>
			<CardDescription>
				Configure rules that control AI editing, content generation, and search engine indexing for
				specific paths or URLs
			</CardDescription>
		</CardHeader>
		<CardContent>
			<ContentRuleList
				bind:rules={rules}
				workspaceId={workspace.id}
				projectId={project.id}
				{canEdit}
			/>
		</CardContent>
	</Card>
</div>
