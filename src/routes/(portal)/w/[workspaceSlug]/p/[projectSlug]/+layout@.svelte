<script lang="ts">
	import ProjectSidebar from "$lib/modules/project/components/nav/project-sidebar.svelte";
	import AutomaticBreadcrumbs from "$lib/components/shared/automatic-breadcrumbs.svelte";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { useProject, useWorkspace, initState } from "$lib/stores/index.js";
	import type { Project, Workspace } from "$lib/types";

	let { data, children } = $props();
	const { project, workspace, projects = [] } = $derived(data);

	// Initialize state if not already initialized (for parallel layouts)
	const states = initState();
	const projectState = useProject();
	const workspaceState = useWorkspace();

	// Sync project state from server data
	$effect(() => {
		if (project) {
			projectState.syncProject(project as Project);
		}
		if (workspace && projects) {
			projectState.syncProjectList(workspace.id, projects as Project[]);
		}
	});
</script>

<Sidebar.Provider>
	<ProjectSidebar />
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
