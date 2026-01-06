<script lang="ts">
	import { goto } from '$app/navigation';
	import { setLastWorkspace } from '$lib/utils/redirect.js';
	import type { WorkspaceListItem } from '$lib/types';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	let { workspace }: { workspace: WorkspaceListItem } = $props();

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

	function selectWorkspace() {
		setLastWorkspace(workspace.slug);
		goto(`/w/${workspace.slug}`);
	}
</script>

<Card
	class="cursor-pointer hover:shadow-lg transition-shadow"
	onclick={selectWorkspace}
>
	<CardHeader>
		<div class="flex items-center justify-between">
			<CardTitle>{workspace.name}</CardTitle>
			<Badge variant={getRoleBadgeVariant(workspace.role)}>
				{workspace.role}
			</Badge>
		</div>
		<CardDescription>{workspace.slug}</CardDescription>
	</CardHeader>
	<CardContent>
		<!-- TODO: Add project count and member count stats -->
	</CardContent>
</Card>

