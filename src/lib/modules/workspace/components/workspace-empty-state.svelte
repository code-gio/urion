<script lang="ts">
	import WorkspaceCreateForm from './workspace-create-form.svelte';
</script>

<div class="flex flex-col items-center justify-center min-h-[60vh]">
	<h1 class="text-3xl font-bold mb-4">Welcome to Odeon Studio</h1>
	<p class="text-muted-foreground mb-8">Create your first workspace to get started</p>

	<div class="w-full max-w-md">
		<WorkspaceCreateForm />
	</div>
</div>

