<script lang="ts">
	import type { WorkspaceMemberWithProfile } from '$lib/types';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	let { member }: { member: WorkspaceMemberWithProfile } = $props();

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

<Card>
	<CardContent class="py-4 flex items-center justify-between">
		<div>
			<p class="font-medium">
				{member.profiles?.display_name || member.profiles?.full_name || member.profiles?.email || 'Unknown'}
			</p>
			<p class="text-sm text-muted-foreground">{member.profiles?.email || member.invited_email}</p>
		</div>
		<Badge variant={getRoleBadgeVariant(member.role)}>{member.role}</Badge>
	</CardContent>
</Card>

