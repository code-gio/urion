<script lang="ts">
	import NavMain from "./nav-main.svelte";
	import NavUser from "$lib/components/shared/nav-user.svelte";
	import ProjectSwitcher from "./projet-switcher.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { ComponentProps } from "svelte";
	import { page } from "$app/state";
	import NavSecondary from "../../shared/nav-secondary.svelte";
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
		<ProjectSwitcher />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain />
		<NavSecondary class="mt-auto" />

	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
{/if}

