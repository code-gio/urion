<script lang="ts">
	import NavMain from "./nav-main.svelte";
	import NavUser from "$lib/components/shared/nav-user.svelte";
	import ProjectSwitcher from "./projet-switcher.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { ComponentProps } from "svelte";
	import type { Profile, Project } from "$lib/types";
	import type { User } from "@supabase/supabase-js";

	let {
		ref = $bindable(null),
		collapsible = "icon",
		user,
		profile = null,
		projects = [],
		workspaceId,
		currentProject = null,
		...restProps
	}: ComponentProps<typeof Sidebar.Root> & {
		user: User;
		profile?: Profile | null;
		projects?: Project[];
		workspaceId: string;
		currentProject?: Project | null;
	} = $props();
</script>

<Sidebar.Root {collapsible} {...restProps}>
	<Sidebar.Header>
		<ProjectSwitcher {projects} {workspaceId} {currentProject} />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser {user} {profile} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>

