<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import SiteHeader from "$lib/components/site-header.svelte";
	import { setLastWorkspace } from '$lib/utils/redirect.js';
	import { initState } from '$lib/stores/state-provider.svelte.js';
	import type { Profile, WorkspaceListItem } from '$lib/types';
	import { page } from '$app/state';

	let { data, children } = $props();

	// Initialize state classes
	const states = initState();

	// Sync user state from server data
	$effect(() => {
		if (data.profile) {
			states.user.syncProfile(data.profile as Profile);
		}
	});

	// Sync workspaces from page data if available
	$effect(() => {
		const pageData = page.data as { workspaces?: unknown[] } | undefined;
		if (pageData?.workspaces) {
			states.user.syncWorkspaces(pageData.workspaces as WorkspaceListItem[]);
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
</script>

<Sidebar.Provider
	style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
>
	<AppSidebar variant="inset" />
	<Sidebar.Inset>
		<SiteHeader />
		<div class="flex flex-1 flex-col">
			<div class="@container/main flex flex-1 flex-col gap-2">
				<div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
					{@render children()}

				</div>
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
