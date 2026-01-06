<script lang="ts">
	import WorkspaceSidebar from "$lib/modules/workspace/components/nav/workspace-sidebar.svelte";
	import AutomaticBreadcrumbs from "$lib/components/shared/automatic-breadcrumbs.svelte";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { useWorkspace, initState } from "$lib/stores/index.js";
	import type { Workspace, WorkspaceRole, WorkspaceListItem } from "$lib/types";

	let { data, children } = $props();
	const { workspace, workspaces = [] } = $derived(data);

	// Initialize state if not already initialized (for parallel layouts)
	const states = initState();
	const workspaceState = useWorkspace();

	// Sync workspace state from server data
	$effect(() => {
		if (workspace) {
			workspaceState.syncWorkspace(workspace as Workspace, data.userRole as WorkspaceRole);
		}
		if (workspaces) {
			workspaceState.syncWorkspaceList(workspaces);
			// Also sync to user state for workspace switcher
			states.user.syncWorkspaces(workspaces);
		}
	});
</script>

<Sidebar.Provider>
	<WorkspaceSidebar />
	<Sidebar.Inset>
		<header
			class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
		>
			<div class="flex items-center gap-2 px-4">
				<Sidebar.Trigger class="-ms-1" />
				<Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
				<AutomaticBreadcrumbs />
			</div>
		</header>
		<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
			{@render children()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>

