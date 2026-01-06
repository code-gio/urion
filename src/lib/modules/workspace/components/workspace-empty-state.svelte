<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import WorkspaceCreateDialog from './workspace-create-dialog.svelte';

	let dialogOpen = $state(false);
</script>

<div class="flex flex-col items-center justify-center min-h-[60vh]">
	<h1 class="text-3xl font-bold mb-4">Welcome to Odeon Studio</h1>
	<p class="text-muted-foreground mb-8">Create your first workspace to get started</p>

	<Button onclick={() => (dialogOpen = true)} size="lg">Create Workspace</Button>
</div>

<WorkspaceCreateDialog bind:open={dialogOpen} />

