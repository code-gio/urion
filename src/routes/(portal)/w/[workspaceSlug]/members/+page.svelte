<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
	import { toast } from 'svelte-sonner';
	import type { MembersPageData, WorkspaceMemberWithProfile, WorkspaceRole } from '$lib/types';

	let { data, parent }: { data: MembersPageData; parent: any } = $props();

	const workspace = $derived(parent?.workspace);
	const userRole = $derived(parent?.userRole);

	let inviteEmail = $state('');
	let inviteRole = $state<WorkspaceRole>('member');
	let isInviting = $state(false);
	let showInviteForm = $state(false);

	const canManageMembers = $derived(
		userRole === 'owner' || userRole === 'admin'
	);

	async function inviteMember() {
		if (!inviteEmail.trim() || !workspace) {
			toast.error('Please enter an email address');
			return;
		}

		isInviting = true;

		try {
			const response = await fetch(`/api/workspaces/${workspace.id}/members`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email: inviteEmail.trim(),
					role: inviteRole,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to invite member');
			}

			toast.success('Invitation sent successfully');
			showInviteForm = false;
			inviteEmail = '';
			inviteRole = 'member';
			// Refresh page data
			goto('.', { invalidateAll: true });
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to invite member');
		} finally {
			isInviting = false;
		}
	}

	function getRoleBadgeVariant(role: string) {
		switch (role) {
			case 'owner':
				return 'default';
			case 'admin':
				return 'secondary';
			case 'member':
				return 'outline';
			default:
				return 'outline';
		}
	}
</script>

<div class="container mx-auto py-8 px-4">
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-3xl font-bold mb-2">Team Members</h1>
			<p class="text-muted-foreground">Manage your workspace team</p>
		</div>
		{#if canManageMembers}
			<Button onclick={() => (showInviteForm = !showInviteForm)}>
				{showInviteForm ? 'Cancel' : 'Invite Member'}
			</Button>
		{/if}
	</div>

	{#if showInviteForm && canManageMembers}
		<Card class="mb-8">
			<CardHeader>
				<CardTitle>Invite Team Member</CardTitle>
				<CardDescription>Send an invitation to join this workspace</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="space-y-2">
					<Label for="invite-email">Email Address</Label>
					<Input
						id="invite-email"
						bind:value={inviteEmail}
						placeholder="colleague@example.com"
						type="email"
						disabled={isInviting}
					/>
				</div>

				<div class="space-y-2">
					<Label for="invite-role">Role</Label>
					<Select bind:value={inviteRole} disabled={isInviting}>
						<SelectTrigger id="invite-role">
							<SelectValue placeholder="Select role" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="member">Member</SelectItem>
							<SelectItem value="admin">Admin</SelectItem>
							<SelectItem value="viewer">Viewer</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<Button onclick={inviteMember} disabled={isInviting} class="w-full">
					{isInviting ? 'Sending...' : 'Send Invitation'}
				</Button>
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
							<div>
								<p class="font-medium">{invite.invited_email}</p>
								<p class="text-sm text-muted-foreground">
									Invited by {invite.profiles?.full_name || invite.profiles?.email || 'Unknown'}
								</p>
							</div>
							<Badge variant="outline">{invite.role}</Badge>
						</CardContent>
					</Card>
				{/each}
			</div>
		</div>
	{/if}

	<div>
		<h2 class="text-xl font-semibold mb-4">Active Members</h2>
		{#if data.members.length === 0}
			<Card>
				<CardContent class="py-12 text-center">
					<p class="text-muted-foreground">No members yet</p>
				</CardContent>
			</Card>
		{:else}
			<div class="space-y-2">
				{#each data.members as member}
					<Card>
						<CardContent class="py-4 flex items-center justify-between">
							<div>
								<p class="font-medium">
									{member.profiles?.display_name || member.profiles?.full_name || member.profiles?.email || 'Unknown'}
								</p>
								<p class="text-sm text-muted-foreground">{member.profiles?.email}</p>
							</div>
							<Badge variant={getRoleBadgeVariant(member.role)}>{member.role}</Badge>
						</CardContent>
					</Card>
				{/each}
			</div>
		{/if}
	</div>
</div>

