<script lang="ts">
	import WorkspaceNavMain from "./workspace-nav-main.svelte";
	import NavUser from "$lib/components/shared/nav-user.svelte";
	import WorkspaceSwitcher from "./workspace-switcher.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { ComponentProps } from "svelte";
	import { page } from "$app/state";

	let {
		ref = $bindable(null),
		collapsible = "icon",
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();

	// Guard: user is required
	const user = $derived(page.data?.user);
</script>

{#if user}
<Sidebar.Root {collapsible} {...restProps}>
	<Sidebar.Header>
		<WorkspaceSwitcher />
	</Sidebar.Header>
	<Sidebar.Content>
		<WorkspaceNavMain />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
{/if}

