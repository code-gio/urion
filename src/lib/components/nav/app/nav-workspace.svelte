<script lang="ts">
	import { goto } from '$app/navigation';
	import PlusIcon from "@tabler/icons-svelte/icons/plus";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { Avatar, AvatarFallback } from "$lib/components/ui/avatar/index.js";
	import { usePortal } from "$lib/stores/portal.svelte.js";
	import { WorkspaceCreateDialog } from "$lib/modules/workspace/index.js";
	import { getInitials } from "$lib/utils.js";

	const portal = usePortal();
	const workspaces = $derived(portal.workspaces);
	let dialogOpen = $state(false);

	function handleWorkspaceSelect(workspaceSlug: string) {
		goto(`/w/${workspaceSlug}`);
	}
</script>

{#if workspaces.length > 0}
	<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
		<Sidebar.GroupLabel>Workspaces</Sidebar.GroupLabel>
		<Sidebar.Menu>
			{#each workspaces as workspace (workspace.id)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton onclick={() => handleWorkspaceSelect(workspace.slug)}>
						<Avatar class="size-6 rounded-md">
							<AvatarFallback class="rounded-md text-xs">
								{getInitials(workspace.name)}
							</AvatarFallback>
						</Avatar>
						<span>{workspace.name}</span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
			<Sidebar.MenuItem>
				<Sidebar.MenuButton onclick={() => (dialogOpen = true)}>
					<PlusIcon />
					<span>Add Workspace</span>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Group>
{/if}

<WorkspaceCreateDialog bind:open={dialogOpen} />
