<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import AppSidebar from "$lib/components/nav/app/app-sidebar.svelte";
	import WorkspaceSidebar from "$lib/components/nav/workspace/workspace-sidebar.svelte";
	import ProjectSidebar from "$lib/components/nav/project/project-sidebar.svelte";
	import SiteHeader from "$lib/components/nav/site-header.svelte";
	import { setLastWorkspace } from '$lib/utils/redirect.js';
	import { setPortalState, usePortal } from '$lib/stores/portal.svelte.js';
	import { page } from '$app/state';

	let { data, children } = $props();

	// Initialize portal state (idempotent)
	const portal = setPortalState();

	// Hydrate store from me payload (simplified - single call)
	$effect(() => {
		if (data.me) {
			portal.hydrate(data.me);
		}
	});

	// Store last workspace when navigating to a workspace
	$effect(() => {
		const path = page.url.pathname;
		const workspaceMatch = path.match(/^\/w\/([^/]+)/);
		if (workspaceMatch) {
			setLastWorkspace(workspaceMatch[1]);
		}
	});

	// Determine which sidebar to show based on current route
	const getSidebarType = (pathname: string): 'app' | 'workspace' | 'project' => {
		const segments = pathname.split("/").filter(Boolean);
		
		// Project route: /w/[workspaceSlug]/p/[projectSlug]
		const isProjectRoute = segments[0] === "w" && segments[1] && segments[2] === "p" && segments.length >= 4;
		if (isProjectRoute) {
			return 'project';
		}
		
		// Workspace route: /w/[workspaceSlug]
		const isWorkspaceRoute = segments[0] === "w" && segments.length >= 2;
		if (isWorkspaceRoute) {
			return 'workspace';
		}
		
		// Default to app sidebar
		return 'app';
	};

	const sidebarType = $derived(getSidebarType(page.url.pathname));
</script>

<Sidebar.Provider
	style="--header-height: calc(var(--spacing) * 12);"
>
	{#if sidebarType === 'project'}
		<ProjectSidebar variant="inset" />
	{:else if sidebarType === 'workspace'}
		<WorkspaceSidebar variant="inset" />
	{:else}
		<AppSidebar variant="inset" />
	{/if}
	<Sidebar.Inset>
		<SiteHeader />
		<div class="flex flex-1 flex-col">
			<div class="@container/main flex flex-1 flex-col gap-2">
				<div class="flex flex-col gap-4 p-6 md:gap-6 md:p-8 ">
					{@render children()}

				</div>
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
