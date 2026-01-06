<script lang="ts">
	import * as Collapsible from "$lib/components/ui/collapsible/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import { page } from "$app/state";
	import { resolveProjectNav } from "$lib/config.js";

	const pathname = $derived(page.url.pathname);
	const workspaceSlug = $derived.by(() => {
		const match = pathname.match(/^\/w\/([^/]+)/);
		return match ? match[1] : "";
	});
	const projectSlug = $derived.by(() => {
		const match = pathname.match(/^\/w\/[^/]+\/p\/([^/]+)/);
		return match ? match[1] : "";
	});

	const navMain = $derived.by(() => {
		if (workspaceSlug && projectSlug) {
			return resolveProjectNav(workspaceSlug, projectSlug);
		}
		return [];
	});

	function isActive(itemUrl: string): boolean {
		if (itemUrl === "/") return pathname === "/";
		return pathname === itemUrl || pathname.startsWith(itemUrl + "/");
	}
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>Platform</Sidebar.GroupLabel>
	<Sidebar.Menu>
		{#each navMain as item (item.title)}
			{#if item.items && item.items.length > 0}
				<Collapsible.Root open={isActive(item.url)} class="group/collapsible">
					{#snippet child({ props })}
						<Sidebar.MenuItem {...props}>
							<Collapsible.Trigger>
								{#snippet child({ props })}
									<Sidebar.MenuButton {...props} tooltipContent={item.title}>
										{#if item.icon}
											<item.icon />
										{/if}
										<span>{item.title}</span>
										<ChevronRightIcon
											class="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
										/>
									</Sidebar.MenuButton>
								{/snippet}
							</Collapsible.Trigger>
							<Collapsible.Content>
								<Sidebar.MenuSub>
									{#each item.items ?? [] as subItem (subItem.title)}
										<Sidebar.MenuSubItem>
											<Sidebar.MenuSubButton>
												{#snippet child({ props })}
													<a href={subItem.url} {...props}>
														<span>{subItem.title}</span>
													</a>
												{/snippet}
											</Sidebar.MenuSubButton>
										</Sidebar.MenuSubItem>
									{/each}
								</Sidebar.MenuSub>
							</Collapsible.Content>
						</Sidebar.MenuItem>
					{/snippet}
				</Collapsible.Root>
			{:else}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton tooltipContent={item.title} isActive={isActive(item.url)}>
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
			{/if}
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
