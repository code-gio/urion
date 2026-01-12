<script lang="ts">
	let {
		title,
		description,
		children
	}: {
		title: string;
		description?: string;
		children: import('svelte').Snippet;
	} = $props();
</script>

<div class="space-y-4">
	<div>
		<h3 class="text-base font-semibold">{title}</h3>
		{#if description}
			<p class="text-sm text-muted-foreground mt-1">{description}</p>
		{/if}
	</div>
	<div class="space-y-4">
		{@render children()}
	</div>
</div>
