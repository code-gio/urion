<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import { page } from "$app/state";
	import { getInitials } from "$lib/utils.js";

	const pathname = $derived(page.url.pathname);
	const workspaceSlug = $derived.by(() => {
		const match = pathname.match(/^\/w\/([^/]+)/);
		return match ? match[1] : "";
	});
	const projectSlug = $derived.by(() => {
		const match = pathname.match(/^\/w\/[^/]+\/p\/([^/]+)/);
		return match ? match[1] : "";
	});

	// Get activated tools from page data
	const activatedTools = $derived(page.data?.activatedTools || []);

	const toolsBasePath = $derived(
		workspaceSlug && projectSlug ? `/w/${workspaceSlug}/p/${projectSlug}/t` : ""
	);

	function isActive(toolUrl: string): boolean {
		return pathname === toolUrl || pathname.startsWith(toolUrl + "/");
	}
</script>

{#if activatedTools.length > 0}
	<Sidebar.Group>
		<Sidebar.GroupLabel>Active Tools</Sidebar.GroupLabel>
		<Sidebar.Menu>
			{#each activatedTools as tool (tool.id)}
				{@const toolUrl = `${toolsBasePath}/${tool.slug}`}
				{@const toolInitials = getInitials(tool.name)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton tooltipContent={tool.name} isActive={isActive(toolUrl)}>
						{#snippet child({ props })}
							<a href={toolUrl} {...props}>
								{#if tool.icon_url}
									<img
										src={tool.icon_url}
										alt={tool.name}
										class="size-4 shrink-0 rounded"
									/>
								{:else}
									<Avatar.Root class="size-4 rounded">
										<Avatar.Fallback class="text-[10px] font-medium">
											{toolInitials}
										</Avatar.Fallback>
									</Avatar.Root>
								{/if}
								<span>{tool.name}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.Group>
{/if}

