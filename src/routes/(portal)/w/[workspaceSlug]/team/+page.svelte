<script lang="ts">
  import { goto } from "$app/navigation";
  import { invalidateAll } from "$app/navigation";
  import { Button } from "$lib/components/ui/button";
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Badge } from "$lib/components/ui/badge";
  import * as Select from "$lib/components/ui/select/index.js";
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "$lib/components/ui/dialog";
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "$lib/components/ui/dropdown-menu";
  import { toast } from "svelte-sonner";
  import type { WorkspaceMemberWithProfile, WorkspaceRole } from "$lib/types";
  import type { PageData } from "./$types";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import Edit2Icon from "@lucide/svelte/icons/edit-2";

  let { data }: { data: PageData } = $props();

  const workspace = $derived(data.workspace);
  const userRole = $derived(data.userRole);

  let memberEmail = $state("");
  let memberRole = $state<WorkspaceRole>("member");
  let isAdding = $state(false);
  let showAddDialog = $state(false);
  let selectedUser = $state<{
    id: string;
    email: string;
    full_name: string | null;
    display_name: string | null;
    avatar_url: string | null;
    isMember?: boolean;
  } | null>(null);
  let searchQuery = $state("");
  let searchResults = $state<
    Array<{
      id: string;
      email: string;
      full_name: string | null;
      display_name: string | null;
      avatar_url: string | null;
      isMember?: boolean;
    }>
  >([]);
  let isSearching = $state(false);
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;

  const memberRoleLabel = $derived(
    memberRole === "owner"
      ? "Owner"
      : memberRole === "admin"
        ? "Admin"
        : memberRole === "member"
          ? "Member"
          : "Viewer"
  );

  let editingMember = $state<WorkspaceMemberWithProfile | null>(null);
  let editingRole = $state<WorkspaceRole>("member");
  let isUpdatingRole = $state(false);

  const editingRoleLabel = $derived(
    editingRole === "owner"
      ? "Owner"
      : editingRole === "admin"
        ? "Admin"
        : editingRole === "member"
          ? "Member"
          : "Viewer"
  );

  let deletingMember = $state<WorkspaceMemberWithProfile | null>(null);
  let isDeleting = $state(false);

  let memberFilterQuery = $state("");

  const canManageMembers = $derived(
    userRole === "owner" || userRole === "admin"
  );

  const filteredMembers = $derived.by(() => {
    if (!memberFilterQuery.trim()) {
      return data.members;
    }

    const query = memberFilterQuery.toLowerCase();
    return data.members.filter((member) => {
      const displayName = getMemberDisplayName(member).toLowerCase();
      const email = (member.profiles?.email || "").toLowerCase();
      const role = member.role.toLowerCase();

      return (
        displayName.includes(query) ||
        email.includes(query) ||
        role.includes(query)
      );
    });
  });

  async function searchUsers() {
    if (searchQuery.trim().length < 2 || !workspace) {
      searchResults = [];
      return;
    }

    isSearching = true;
    try {
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(searchQuery)}&workspaceId=${workspace.id}`
      );
      if (response.ok) {
        searchResults = await response.json();
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      isSearching = false;
    }
  }

  function handleSearchInput() {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
      searchUsers();
    }, 300);
  }

  function selectUser(user: typeof selectedUser) {
    if (user?.isMember) {
      toast.error("This user is already a member of this workspace");
      return;
    }
    selectedUser = user;
    searchQuery = user?.email || "";
    searchResults = [];
  }

  async function addMember() {
    if (!selectedUser || !workspace) {
      toast.error("Please select a user");
      return;
    }

    isAdding = true;

    try {
      const response = await fetch(`/api/workspaces/${workspace.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          email: selectedUser.email,
          role: memberRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add member");
      }

      toast.success("Member added successfully");
      showAddDialog = false;
      selectedUser = null;
      searchQuery = "";
      memberRole = "member";
      await invalidateAll();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add member"
      );
    } finally {
      isAdding = false;
    }
  }

  function openEditRoleDialog(member: WorkspaceMemberWithProfile) {
    showAddDialog = false;
    editingMember = member;
    editingRole = member.role;
  }

  async function updateMemberRole() {
    if (!editingMember || !workspace) return;

    isUpdatingRole = true;

    try {
      const response = await fetch(
        `/api/workspaces/${workspace.id}/members/${editingMember.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: editingRole,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update member role");
      }

      toast.success("Member role updated successfully");
      editingMember = null;
      await invalidateAll();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update member role"
      );
    } finally {
      isUpdatingRole = false;
    }
  }

  function openDeleteDialog(member: WorkspaceMemberWithProfile) {
    deletingMember = member;
  }

  async function deleteMember() {
    if (!deletingMember || !workspace) return;

    isDeleting = true;

    try {
      const response = await fetch(
        `/api/workspaces/${workspace.id}/members/${deletingMember.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove member");
      }

      toast.success("Member removed successfully");
      deletingMember = null;
      await invalidateAll();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove member"
      );
    } finally {
      isDeleting = false;
    }
  }

  async function cancelInvite(inviteId: string) {
    if (!workspace) return;

    try {
      const response = await fetch(
        `/api/workspaces/${workspace.id}/members/${inviteId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel invitation");
      }

      toast.success("Invitation cancelled");
      await invalidateAll();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel invitation"
      );
    }
  }

  function getRoleBadgeVariant(role: string) {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      case "member":
        return "outline";
      default:
        return "outline";
    }
  }

  function canEditMember(member: WorkspaceMemberWithProfile): boolean {
    if (!canManageMembers) return false;
    
    // El owner no puede ser editado/eliminado por nadie
    if (member.role === "owner") return false;
    
    // Los admins solo pueden editar members y viewers, no otros admins ni owners
    if (userRole === "admin" && (member.role === "admin" || member.role === "owner")) {
      return false;
    }
    
    return true;
  }

  function getMemberDisplayName(member: WorkspaceMemberWithProfile): string {
    return (
      member.profiles?.display_name ||
      member.profiles?.full_name ||
      member.profiles?.email ||
      member.invited_email ||
      "Unknown"
    );
  }
</script>

<div class="container mx-auto py-8 px-4">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-3xl font-bold mb-2">Team Members</h1>
      <p class="text-muted-foreground">Manage your workspace team</p>
    </div>
    {#if canManageMembers}
      <Button onclick={() => (showAddDialog = true)}>Add Member</Button>
    {/if}
  </div>

  {#if data.workspaceOwner}
    <Card class="mb-8">
      <CardHeader>
        <CardTitle>Workspace Owner</CardTitle>
        <CardDescription
          >The creator and owner of this workspace</CardDescription
        >
      </CardHeader>
      <CardContent class="py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            {#if data.workspaceOwner.avatar_url}
              <img
                src={data.workspaceOwner.avatar_url}
                alt={data.workspaceOwner.display_name ||
                  data.workspaceOwner.full_name ||
                  "Owner"}
                class="w-10 h-10 rounded-full"
              />
            {:else}
              <div
                class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"
              >
                <span class="text-sm font-medium">
                  {(
                    data.workspaceOwner.display_name ||
                    data.workspaceOwner.full_name ||
                    data.workspaceOwner.email ||
                    "O"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </span>
              </div>
            {/if}
            <div>
              <p class="font-medium">
                {data.workspaceOwner.display_name ||
                  data.workspaceOwner.full_name ||
                  data.workspaceOwner.email ||
                  "Unknown"}
              </p>
              <p class="text-sm text-muted-foreground">
                {data.workspaceOwner.email}
              </p>
            </div>
          </div>
          <Badge variant="default">Owner</Badge>
        </div>
      </CardContent>
    </Card>
  {/if}

  {#if data.pendingInvites.length > 0}
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-4">Pending Invitations</h2>
      <div class="space-y-2">
        {#each data.pendingInvites as invite}
          <Card>
            <CardContent class="py-4 flex items-center justify-between">
              <div class="flex-1">
                <p class="font-medium">{invite.invited_email}</p>
                <p class="text-sm text-muted-foreground">
                  Invited by {invite.profiles?.full_name ||
                    invite.profiles?.email ||
                    "Unknown"}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <Badge variant="outline">{invite.role}</Badge>
                {#if canManageMembers}
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" size="icon">
                        <MoreVerticalIcon class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onclick={() => cancelInvite(invite.id)}>
                        <Trash2Icon class="mr-2 h-4 w-4" />
                        Cancel Invitation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                {/if}
              </div>
            </CardContent>
          </Card>
        {/each}
      </div>
    </div>
  {/if}

  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold">Active Members</h2>
      {#if data.members.length > 0}
        <div class="w-64">
          <Input
            bind:value={memberFilterQuery}
            placeholder="Search members..."
            type="text"
            class="h-9"
          />
        </div>
      {/if}
    </div>
    {#if data.members.length === 0}
      <Card>
        <CardContent class="py-12 text-center">
          <p class="text-muted-foreground mb-4">No members yet</p>
          <Button onclick={() => (showAddDialog = true)} variant="outline">
            Add your first member
          </Button>
        </CardContent>
      </Card>
    {:else}
      <Card>
        <CardContent class="p-0">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b bg-muted/50">
                <tr>
                  <th class="text-left p-4 font-medium">Member</th>
                  <th class="text-left p-4 font-medium">Email</th>
                  <th class="text-left p-4 font-medium">Role</th>
                  <th class="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each filteredMembers as member, index}
                  <tr
                    class="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td class="p-4">
                      <div class="flex items-center gap-3">
                        {#if member.profiles?.avatar_url}
                          <img
                            src={member.profiles.avatar_url}
                            alt={getMemberDisplayName(member)}
                            class="w-10 h-10 rounded-full"
                          />
                        {:else}
                          <div
                            class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"
                          >
                            <span class="text-sm font-medium">
                              {getMemberDisplayName(member)
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                        {/if}
                        <div>
                          <p class="font-medium">
                            {getMemberDisplayName(member)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td class="p-4">
                      <p class="text-sm text-muted-foreground">
                        {member.profiles?.email || "-"}
                      </p>
                    </td>
                    <td class="p-4">
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.role}
                      </Badge>
                    </td>
                    <td class="p-4 text-right">
                      {#if canEditMember(member)}
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" size="icon">
                              <MoreVerticalIcon class="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onclick={() => openEditRoleDialog(member)}
                            >
                              <Edit2Icon class="mr-2 h-4 w-4" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              class="text-destructive"
                              onclick={() => openDeleteDialog(member)}
                            >
                              <Trash2Icon class="mr-2 h-4 w-4" />
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      {:else}
                        <span class="text-sm text-muted-foreground">-</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
            {#if filteredMembers.length === 0 && memberFilterQuery}
              <div class="py-12 text-center border-t">
                <p class="text-muted-foreground">
                  No members found matching "{memberFilterQuery}"
                </p>
              </div>
            {/if}
          </div>
        </CardContent>
      </Card>
    {/if}
  </div>
</div>

<Dialog
  open={editingMember !== null}
  onOpenChange={(open) => !open && (editingMember = null)}
>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Change Member Role</DialogTitle>
      <DialogDescription>
        Update the role for {editingMember
          ? getMemberDisplayName(editingMember)
          : ""}
      </DialogDescription>
    </DialogHeader>
    <div class="space-y-4 py-4">
      <div class="space-y-2">
        <Label for="edit-member-role">Role</Label>
        <Select.Root
          type="single"
          bind:value={editingRole}
          disabled={isUpdatingRole}
        >
          <Select.Trigger id="edit-member-role">
            {editingRoleLabel}
          </Select.Trigger>
          <Select.Content>
            {#if userRole === "owner"}
              <Select.Item value="owner" label="Owner">Owner</Select.Item>
            {/if}
            <Select.Item value="admin" label="Admin">Admin</Select.Item>
            <Select.Item value="member" label="Member">Member</Select.Item>
            <Select.Item value="viewer" label="Viewer">Viewer</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
    </div>
    <DialogFooter>
      <Button
        variant="outline"
        onclick={() => (editingMember = null)}
        disabled={isUpdatingRole}
      >
        Cancel
      </Button>
      <Button onclick={updateMemberRole} disabled={isUpdatingRole}>
        {isUpdatingRole ? "Updating..." : "Update Role"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

<Dialog
  open={showAddDialog}
  onOpenChange={(open) => !open && (showAddDialog = false)}
>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add Team Member</DialogTitle>
      <DialogDescription>
        Search and select a user to add to this workspace
      </DialogDescription>
    </DialogHeader>
    <div class="space-y-4 py-4">
      <div class="space-y-2">
        <Label for="add-member-search">Search User</Label>
        <div class="relative">
          <Input
            id="add-member-search"
            bind:value={searchQuery}
            oninput={handleSearchInput}
            placeholder="Search by email or name..."
            type="text"
            disabled={isAdding}
            autocomplete="off"
          />
          {#if selectedUser}
            <div
              class="mt-2 p-3 bg-muted rounded-md flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                {#if selectedUser.avatar_url}
                  <img
                    src={selectedUser.avatar_url}
                    alt={selectedUser.display_name ||
                      selectedUser.full_name ||
                      selectedUser.email}
                    class="w-8 h-8 rounded-full"
                  />
                {:else}
                  <div
                    class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
                  >
                    <span class="text-xs font-medium">
                      {(
                        selectedUser.display_name ||
                        selectedUser.full_name ||
                        selectedUser.email
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                {/if}
                <div>
                  <p class="text-sm font-medium">
                    {selectedUser.display_name ||
                      selectedUser.full_name ||
                      selectedUser.email}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {selectedUser.email}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onclick={() => {
                  selectedUser = null;
                  searchQuery = "";
                }}
              >
                Change
              </Button>
            </div>
          {:else if searchResults.length > 0}
            <div
              class="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-60 overflow-auto"
            >
              {#each searchResults as user}
                <button
                  type="button"
                  class="w-full p-3 hover:bg-accent flex items-center gap-3 text-left {user.isMember
                    ? 'opacity-60 cursor-not-allowed'
                    : ''}"
                  onclick={() => selectUser(user)}
                  disabled={user.isMember}
                >
                  {#if user.avatar_url}
                    <img
                      src={user.avatar_url}
                      alt={user.display_name || user.full_name || user.email}
                      class="w-8 h-8 rounded-full"
                    />
                  {:else}
                    <div
                      class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
                    >
                      <span class="text-xs font-medium">
                        {(user.display_name || user.full_name || user.email)
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                  {/if}
                  <div class="flex-1">
                    <p class="text-sm font-medium">
                      {user.display_name || user.full_name || user.email}
                    </p>
                    <p class="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  {#if user.isMember}
                    <Badge variant="secondary" class="text-xs"
                      >Already member</Badge
                    >
                  {/if}
                </button>
              {/each}
            </div>
          {:else if isSearching}
            <div
              class="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg p-3"
            >
              <p class="text-sm text-muted-foreground">Searching...</p>
            </div>
          {:else if searchQuery.length >= 2}
            <div
              class="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg p-3"
            >
              <p class="text-sm text-muted-foreground">No users found</p>
            </div>
          {/if}
        </div>
      </div>

      <div class="space-y-2">
        <Label for="add-member-role">Role</Label>
        <Select.Root type="single" bind:value={memberRole} disabled={isAdding}>
          <Select.Trigger id="add-member-role">
            {memberRoleLabel}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="member" label="Member">Member</Select.Item>
            <Select.Item value="admin" label="Admin">Admin</Select.Item>
            <Select.Item value="viewer" label="Viewer">Viewer</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
    </div>
    <DialogFooter>
      <Button
        variant="outline"
        onclick={() => (showAddDialog = false)}
        disabled={isAdding}
      >
        Cancel
      </Button>
      <Button onclick={addMember} disabled={isAdding || !selectedUser}>
        {isAdding ? "Adding..." : "Add Member"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

<Dialog
  open={deletingMember !== null}
  onOpenChange={(open) => !open && (deletingMember = null)}
>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Remove Member</DialogTitle>
      <DialogDescription>
        Are you sure you want to remove {deletingMember
          ? getMemberDisplayName(deletingMember)
          : ""}
        from this workspace? This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button
        variant="outline"
        onclick={() => (deletingMember = null)}
        disabled={isDeleting}
      >
        Cancel
      </Button>
      <Button
        variant="destructive"
        onclick={deleteMember}
        disabled={isDeleting}
      >
        {isDeleting ? "Removing..." : "Remove Member"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
