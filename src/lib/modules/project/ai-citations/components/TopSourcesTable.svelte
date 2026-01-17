<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';

	type TopSource = {
		rank: number;
		name: string;
		domain: string;
		citations: number;
		url?: string;
	};

	let {
		sources = []
	}: {
		sources?: TopSource[];
	} = $props();

	function formatNumber(num: number): string {
		if (num >= 1000) {
			return (num / 1000).toFixed(1) + 'k';
		}
		return num.toString();
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Top Sources</Card.Title>
		<Card.Description>Most cited sources from your content</Card.Description>
		<Card.Action>
			<Button variant="ghost" size="sm">View All</Button>
		</Card.Action>
	</Card.Header>
	<Card.Content class="p-0">
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="border-b bg-muted/50">
					<tr>
						<th class="text-left p-4 font-medium text-sm">#</th>
						<th class="text-left p-4 font-medium text-sm">Source</th>
						<th class="text-right p-4 font-medium text-sm">Citations</th>
						<th class="text-right p-4 font-medium text-sm"></th>
					</tr>
				</thead>
				<tbody>
					{#each sources as source}
						<tr class="border-b last:border-0 hover:bg-muted/30 transition-colors">
							<td class="p-4">
								<span class="text-sm text-muted-foreground">{source.rank}</span>
							</td>
							<td class="p-4">
								<div class="flex items-center gap-3">
									<Avatar class="h-8 w-8">
										<AvatarFallback class="text-xs bg-primary/10">
											{source.name.substring(0, 1).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div>
										<p class="font-medium text-sm">{source.name}</p>
										<p class="text-xs text-muted-foreground">{source.domain}</p>
									</div>
								</div>
							</td>
							<td class="p-4 text-right font-semibold">
								{formatNumber(source.citations)}
							</td>
							<td class="p-4 text-right">
								{#if source.url}
									<Button variant="ghost" size="icon" class="h-8 w-8" href={source.url} target="_blank">
										<ExternalLinkIcon class="h-4 w-4" />
									</Button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			{#if sources.length === 0}
				<div class="py-12 text-center">
					<p class="text-muted-foreground">No source data available</p>
				</div>
			{/if}
		</div>
	</Card.Content>
</Card.Root>
