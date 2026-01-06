<script lang="ts">
	import type { SubmissionAnalytics } from '$lib/types';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { BACKLINK_CATEGORIES } from '$lib/types/backlinks';

	let { by_category }: { by_category: SubmissionAnalytics['by_category'] } = $props();

	const total = $derived(by_category.reduce((sum, item) => sum + item.count, 0));
</script>

<Card>
	<CardHeader>
		<CardTitle>By Category</CardTitle>
	</CardHeader>
	<CardContent>
		<div class="space-y-3">
			{#each by_category as item}
				{@const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0}
				<div class="space-y-1">
					<div class="flex items-center justify-between text-sm">
						<div class="flex items-center gap-2">
							<span>{BACKLINK_CATEGORIES[item.category]?.icon || '📦'}</span>
							<span class="font-medium">{BACKLINK_CATEGORIES[item.category]?.label || item.category}</span>
						</div>
						<div class="text-muted-foreground">
							{item.count} ({percentage}%)
						</div>
					</div>
					<div class="h-2 bg-muted rounded-full overflow-hidden">
						<div
							class="h-full bg-primary transition-all"
							style="width: {percentage}%"
						></div>
					</div>
					<div class="text-xs text-muted-foreground">
						{item.approved} approved, {item.rejected} rejected
					</div>
				</div>
			{/each}
		</div>
	</CardContent>
</Card>

