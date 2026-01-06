<script lang="ts">
	import { goto } from '$app/navigation';
	import { setLastWorkspace } from '$lib/utils/redirect.js';
	import { page } from '$app/state';
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { useSidebar } from "$lib/components/ui/sidebar/index.js";
	import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import BuildingIcon from "@lucide/svelte/icons/building";
	import { WorkspaceCreateDialog } from "$lib/modules/workspace/components/index.js";
	import { usePortal } from "$lib/stores/portal.svelte.js";
	import type { WorkspaceListItem } from "$lib/types";

	const sidebar = useSidebar();
	const portal = usePortal();
	let dialogOpen = $state(false);

	// Get workspaces from portal store
	const workspaces = $derived(portal.workspaces);
	const currentWorkspace = $derived(portal.currentWorkspace);

	const activeWorkspace = $derived(currentWorkspace || workspaces[0] || null);
	const displayName = $derived(activeWorkspace?.name || 'No workspaces');
	const displayRole = $derived(activeWorkspace?.role || '');

	function handleWorkspaceSelect(workspace: WorkspaceListItem) {
		setLastWorkspace(workspace.slug);
		goto(`/w/${workspace.slug}`);
	}

	function handleCreateWorkspace() {
		dialogOpen = true;
	}
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton
						{...props}
						size="lg"
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
					>
						<div
							class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
						>
							<BuildingIcon class="size-4" />
						</div>
						<div class="grid flex-1 text-start text-sm leading-tight">
							<span class="truncate font-medium">
								{displayName}
							</span>
							{#if displayRole}
								<span class="truncate text-xs capitalize">{displayRole}</span>
							{/if}
						</div>
						<ChevronsUpDownIcon class="ms-auto" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
				align="start"
				side={sidebar.isMobile ? "bottom" : "right"}
				sideOffset={4}
			>
				<DropdownMenu.Label class="text-muted-foreground text-xs">Workspaces</DropdownMenu.Label>
				{#if workspaces.length === 0}
					<DropdownMenu.Item disabled class="gap-2 p-2">
						<div class="flex size-6 items-center justify-center rounded-md border">
							<BuildingIcon class="size-3.5 shrink-0" />
						</div>
						<span class="text-muted-foreground">No workspaces yet</span>
					</DropdownMenu.Item>
				{:else}
					{#each workspaces as workspace, index (workspace.id)}
						<DropdownMenu.Item 
							onSelect={() => handleWorkspaceSelect(workspace)} 
							class="gap-2 p-2"
						>
							<div class="flex size-6 items-center justify-center rounded-md border">
								<BuildingIcon class="size-3.5 shrink-0" />
							</div>
							{workspace.name}
							<DropdownMenu.Shortcut>⌘{index + 1}</DropdownMenu.Shortcut>
						</DropdownMenu.Item>
					{/each}
				{/if}
				<DropdownMenu.Separator />
				<DropdownMenu.Item onSelect={handleCreateWorkspace} class="gap-2 p-2">
					<div
						class="flex size-6 items-center justify-center rounded-md border bg-transparent"
					>
						<PlusIcon class="size-4" />
					</div>
					<div class="text-muted-foreground font-medium">Add workspace</div>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>

<WorkspaceCreateDialog bind:open={dialogOpen} />

