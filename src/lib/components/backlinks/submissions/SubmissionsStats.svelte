<script lang="ts">
	import type { SubmissionStats } from '$lib/types';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

	let { stats }: { stats: SubmissionStats } = $props();

	const successRate = $derived(
		stats.approved + stats.rejected > 0
			? Math.round((stats.approved / (stats.approved + stats.rejected)) * 100)
			: 0
	);
</script>

<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="text-sm font-medium text-muted-foreground">Total</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold">{stats.total}</div>
		</CardContent>
	</Card>

	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="text-sm font-medium text-muted-foreground">Approved</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold text-green-600">{stats.approved}</div>
		</CardContent>
	</Card>

	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="text-sm font-medium text-muted-foreground">Live</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold text-blue-600">{stats.live}</div>
		</CardContent>
	</Card>

	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold">{successRate}%</div>
		</CardContent>
	</Card>
</div>

