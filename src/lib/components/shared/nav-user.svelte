<script lang="ts">
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { useSidebar } from "$lib/components/ui/sidebar/index.js";
	import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
	import LogOutIcon from "@lucide/svelte/icons/log-out";
	import { getInitials } from "$lib/utils";
	import { usePortal } from "$lib/stores/portal.svelte.js";
	import { page } from "$app/state";
	import { resolveUserNav } from "$lib/config";
	import { goto } from "$app/navigation";

	const sidebar = useSidebar();
	const portal = usePortal();

	// Get user from page data (fallback if state not synced yet)
	const user = $derived(page.data?.user);
	const profile = $derived(portal.profile);

	const displayName = $derived(
		profile?.display_name || profile?.full_name || user?.email?.split("@")[0] || "User"
	);
	const email = $derived(profile?.email || user?.email || "");
	const avatarUrl = $derived(profile?.avatar_url || null);
	const initials = $derived(getInitials(displayName));

	const userNavItems = $derived(resolveUserNav());
</script>

{#if user}
<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton
						size="lg"
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						{...props}
					>
						<Avatar.Root class="size-8 rounded-lg">
							{#if avatarUrl}
								<Avatar.Image src={avatarUrl} alt={displayName} />
							{/if}
							<Avatar.Fallback class="rounded-lg">{initials}</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-start text-sm leading-tight">
							<span class="truncate font-medium">{displayName}</span>
							{#if email}
								<span class="truncate text-xs">{email}</span>
							{/if}
						</div>
						<ChevronsUpDownIcon class="ms-auto size-4" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
				side={sidebar.isMobile ? "bottom" : "right"}
				align="end"
				sideOffset={4}
			>
				<DropdownMenu.Label class="p-0 font-normal">
					<div class="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
						<Avatar.Root class="size-8 rounded-lg">
							{#if avatarUrl}
								<Avatar.Image src={avatarUrl} alt={displayName} />
							{/if}
							<Avatar.Fallback class="rounded-lg">{initials}</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-start text-sm leading-tight">
							<span class="truncate font-medium">{displayName}</span>
							{#if email}
								<span class="truncate text-xs">{email}</span>
							{/if}
						</div>
					</div>
				</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Group>
					{#each userNavItems as item}
						<DropdownMenu.Item onclick={() => item.url && goto(item.url)}>
							{#if item.icon}
								<item.icon />
							{/if}
							{item.title}
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Group>
				<DropdownMenu.Separator />
				<DropdownMenu.Item>
					<LogOutIcon />
					Log out
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
{/if}
