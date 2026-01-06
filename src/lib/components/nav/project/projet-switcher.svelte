<script lang="ts">
	import { goto } from '$app/navigation';
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { useSidebar } from "$lib/components/ui/sidebar/index.js";
	import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import FolderIcon from "@lucide/svelte/icons/folder";
	import { ProjectCreateDialog } from "$lib/modules/project/components/index.js";
	import { usePortal } from "$lib/stores/portal.svelte.js";
	import type { Project } from "$lib/types";

	const sidebar = useSidebar();
	const portal = usePortal();
	let dialogOpen = $state(false);

	// Get workspace ID and projects from portal store
	const workspaceId = $derived(portal.currentWorkspaceId || '');
	const projects = $derived(portal.currentWorkspaceProjects);
	const currentProject = $derived(portal.currentProject);

	const activeProject = $derived(currentProject || projects[0] || null);
	const displayName = $derived(activeProject?.name || 'No projects');
	const displayStatus = $derived(activeProject?.status || '');

	function handleProjectSelect(project: Project) {
		const workspaceSlug = portal.currentWorkspace?.slug;
		if (workspaceSlug) {
			goto(`/w/${workspaceSlug}/p/${project.slug}`);
		}
	}

	function handleCreateProject() {
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
							<FolderIcon class="size-4" />
						</div>
						<div class="grid flex-1 text-start text-sm leading-tight">
							<span class="truncate font-medium">
								{displayName}
							</span>
							{#if displayStatus}
								<span class="truncate text-xs capitalize">{displayStatus}</span>
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
				<DropdownMenu.Label class="text-muted-foreground text-xs">Projects</DropdownMenu.Label>
				{#if projects.length === 0}
					<DropdownMenu.Item disabled class="gap-2 p-2">
						<div class="flex size-6 items-center justify-center rounded-md border">
							<FolderIcon class="size-3.5 shrink-0" />
						</div>
						<span class="text-muted-foreground">No projects yet</span>
					</DropdownMenu.Item>
				{:else}
					{#each projects as project, index (project.id)}
						<DropdownMenu.Item 
							onSelect={() => handleProjectSelect(project)} 
							class="gap-2 p-2"
						>
							<div class="flex size-6 items-center justify-center rounded-md border">
								<FolderIcon class="size-3.5 shrink-0" />
							</div>
							{project.name}
							<DropdownMenu.Shortcut>⌘{index + 1}</DropdownMenu.Shortcut>
						</DropdownMenu.Item>
					{/each}
				{/if}
				<DropdownMenu.Separator />
				<DropdownMenu.Item onSelect={handleCreateProject} class="gap-2 p-2">
					<div
						class="flex size-6 items-center justify-center rounded-md border bg-transparent"
					>
						<PlusIcon class="size-4" />
					</div>
					<div class="text-muted-foreground font-medium">Add project</div>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>

{#if workspaceId}
	<ProjectCreateDialog bind:open={dialogOpen} />
{/if}
