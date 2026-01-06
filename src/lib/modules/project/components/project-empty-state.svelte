<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import ProjectCreateForm from './project-create-form.svelte';

	let { workspaceId, onCreateClick }: { workspaceId: string; onCreateClick?: () => void } = $props();
</script>

<Card>
	<CardContent class="py-12 text-center">
		<p class="text-muted-foreground mb-4">No projects yet</p>
		{#if onCreateClick}
			<Button onclick={onCreateClick}>Create Your First Project</Button>
		{:else}
			<ProjectCreateForm {workspaceId} />
		{/if}
	</CardContent>
</Card>

