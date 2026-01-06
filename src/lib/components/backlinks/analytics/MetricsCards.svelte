<script lang="ts">
	import type { SubmissionAnalytics } from '$lib/types';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

	let { metrics }: { metrics: SubmissionAnalytics['metrics'] } = $props();
</script>

<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="text-sm font-medium text-muted-foreground">Avg Domain Rating</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold">{metrics.avg_dr.toFixed(1)}</div>
		</CardContent>
	</Card>

	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="text-sm font-medium text-muted-foreground">Total Referral Traffic</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold">{metrics.total_referral_traffic.toLocaleString()}</div>
		</CardContent>
	</Card>

	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="text-sm font-medium text-muted-foreground">Total Conversions</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold">{metrics.total_conversions.toLocaleString()}</div>
		</CardContent>
	</Card>

	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="text-sm font-medium text-muted-foreground">Avg Approval Time</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold">{metrics.avg_approval_time_days.toFixed(1)}</div>
			<div class="text-xs text-muted-foreground">days</div>
		</CardContent>
	</Card>
</div>

