<script lang="ts">
	import type { SubmissionAnalytics } from '$lib/types';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

	let { recent_activity }: { recent_activity: SubmissionAnalytics['recent_activity'] } = $props();

	const maxValue = $derived(
		Math.max(
			...recent_activity.map((item) => Math.max(item.submitted, item.approved, item.rejected)),
			1
		)
	);
</script>

<Card>
	<CardHeader>
		<CardTitle>Progress Over Time</CardTitle>
	</CardHeader>
	<CardContent>
		<div class="space-y-4">
			{#if recent_activity.length === 0}
				<div class="text-center text-muted-foreground py-8">No activity data available</div>
			{:else}
				<div class="space-y-2">
					{#each recent_activity as item}
						{@const submittedHeight = (item.submitted / maxValue) * 100}
						{@const approvedHeight = (item.approved / maxValue) * 100}
						{@const rejectedHeight = (item.rejected / maxValue) * 100}
						<div class="flex items-end gap-1">
							<div class="flex-1 space-y-1">
								<div class="text-xs text-muted-foreground">
									{new Date(item.date).toLocaleDateString()}
								</div>
								<div class="flex gap-1 h-20">
									{#if item.submitted > 0}
										<div
											class="flex-1 bg-blue-500 rounded-t transition-all"
											style="height: {submittedHeight}%"
											title="{item.submitted} submitted"
										></div>
									{/if}
									{#if item.approved > 0}
										<div
											class="flex-1 bg-green-500 rounded-t transition-all"
											style="height: {approvedHeight}%"
											title="{item.approved} approved"
										></div>
									{/if}
									{#if item.rejected > 0}
										<div
											class="flex-1 bg-red-500 rounded-t transition-all"
											style="height: {rejectedHeight}%"
											title="{item.rejected} rejected"
										></div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
				<div class="flex gap-4 text-xs text-muted-foreground pt-2">
					<div class="flex items-center gap-1">
						<div class="w-3 h-3 bg-blue-500 rounded"></div>
						Submitted
					</div>
					<div class="flex items-center gap-1">
						<div class="w-3 h-3 bg-green-500 rounded"></div>
						Approved
					</div>
					<div class="flex items-center gap-1">
						<div class="w-3 h-3 bg-red-500 rounded"></div>
						Rejected
					</div>
				</div>
			{/if}
		</div>
	</CardContent>
</Card>

