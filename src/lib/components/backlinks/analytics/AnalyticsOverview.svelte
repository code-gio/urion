<script lang="ts">
	import type { SubmissionAnalytics } from '$lib/types';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

	let { analytics }: { analytics: SubmissionAnalytics } = $props();
</script>

<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="text-sm font-medium text-muted-foreground">Total Submissions</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold">{analytics.overview.total_submissions}</div>
		</CardContent>
	</Card>

	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="text-sm font-medium text-muted-foreground">Approved</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold text-green-600">{analytics.overview.approved}</div>
		</CardContent>
	</Card>

	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="text-sm font-medium text-muted-foreground">Live Backlinks</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold text-blue-600">{analytics.overview.live_backlinks}</div>
		</CardContent>
	</Card>

	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold">{analytics.overview.success_rate}%</div>
		</CardContent>
	</Card>
</div>

