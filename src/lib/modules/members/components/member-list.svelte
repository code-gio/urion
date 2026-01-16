<script lang="ts">
	import type { WorkspaceMemberWithProfile } from '$lib/types';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import MemberCard from './member-card.svelte';

	let {
		members,
		pendingInvites,
	}: {
		members: WorkspaceMemberWithProfile[];
		pendingInvites: WorkspaceMemberWithProfile[];
	} = $props();

	
</script>

{#if pendingInvites.length > 0}
	<div class="mb-8">
		<h2 class="text-xl font-semibold mb-4">Pending Invitations</h2>
		<div class="space-y-2">
			{#each pendingInvites as invite}
				<MemberCard member={invite} />
			{/each}
		</div>
	</div>
{/if}

<div>
	<h2 class="text-xl font-semibold mb-4">Active Members</h2>
	{#if members.length === 0}
		<Card>
			<CardContent class="py-12 text-center">
				<p class="text-muted-foreground">No members yet</p>
			</CardContent>
		</Card>
	{:else}
		<div class="space-y-2">
			{#each members as member}
				<MemberCard {member} />
			{/each}
		</div>
	{/if}
</div>

