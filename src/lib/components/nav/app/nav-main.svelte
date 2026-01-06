<script lang="ts">
	import { goto } from '$app/navigation';
	import CirclePlusFilledIcon from "@tabler/icons-svelte/icons/circle-plus-filled";
	import MailIcon from "@tabler/icons-svelte/icons/mail";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { Icon } from "@tabler/icons-svelte";
	import { navAppRoot } from "$lib/config.js";


	function handleNavClick(url: string) {
		if (url) {
			goto(url);
		}
	}
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>Platform</Sidebar.GroupLabel>
	<Sidebar.GroupContent class="flex flex-col gap-2">
		<Sidebar.Menu>
			{#each navAppRoot as item (item.title)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton tooltipContent={item.title}>
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
