<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import ContentRuleList from '$lib/modules/project/settings/components/content-rules/ContentRuleList.svelte';
	import type { ProjectContentRule } from '$lib/types/project-settings.js';

	interface Props {
		workspace: any;
		project: any;
		rules: ProjectContentRule[];
		canEdit: boolean;
	}

	let { workspace, project, rules: initialRules, canEdit }: Props = $props();

	let rules = $state<ProjectContentRule[]>(initialRules || []);

	$effect(() => {
		rules = initialRules || [];
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
