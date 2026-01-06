<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { WithoutChildren } from "$lib/utils.js";
	import type { ComponentProps } from "svelte";
	import { navSecondary } from "$lib/config.js";

	let {
		...restProps
	}: WithoutChildren<ComponentProps<typeof Sidebar.Group>> = $props();
</script>

<Sidebar.Group {...restProps}>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			{#each navSecondary as item (item.title)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton>
						{#snippet child({ props })}
							<a href={item.url} {...props}>
								{#if item.icon}
									<item.icon />
								{/if}
								<span>{item.title}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
