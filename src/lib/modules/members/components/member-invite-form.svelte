<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
	import { toast } from 'svelte-sonner';
	import type { WorkspaceRole } from '$lib/types';
	import { memberInviteSchema } from '../schemas/member.js';

	let { workspaceId }: { workspaceId: string } = $props();

	let inviteEmail = $state('');
	let inviteRole = $state<WorkspaceRole>('member');
	let isInviting = $state(false);

	async function inviteMember() {
		if (!inviteEmail.trim() || !workspaceId) {
			toast.error('Please enter an email address');
			return;
		}

		// Validate with schema
		const validation = memberInviteSchema.safeParse({
			email: inviteEmail.trim(),
			role: inviteRole,
		});

		if (!validation.success) {
			const firstError = validation.error.issues[0];
			toast.error(firstError.message);
			return;
		}

		isInviting = true;

		try {
			const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
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
</script>

<Card>
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

