<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';

	type CompetitorRanking = {
		rank: number;
		name: string;
		logo?: string;
		visibility: string;
		change?: number;
	};

	let {
		competitors = []
	}: {
		competitors?: CompetitorRanking[];
	} = $props();

	function getChangeColor(change?: number) {
		if (!change) return 'text-muted-foreground';
		return change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground';
	}

	function getChangeIcon(change?: number) {
		if (!change) return '';
		return change > 0 ? '↑' : change < 0 ? '↓' : '';
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Competitor Rankings</Card.Title>
		<Card.Description>Top competitors by visibility</Card.Description>
	</Card.Header>
	<Card.Content class="p-0">
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="border-b bg-muted/50">
					<tr>
						<th class="text-left p-4 font-medium text-sm">#</th>
						<th class="text-left p-4 font-medium text-sm">Competitor</th>
						<th class="text-right p-4 font-medium text-sm">Visibility</th>
						<th class="text-right p-4 font-medium text-sm">Change</th>
					</tr>
				</thead>
				<tbody>
					{#each competitors as competitor}
						<tr class="border-b last:border-0 hover:bg-muted/30 transition-colors">
							<td class="p-4">
								<div class="flex items-center justify-center w-6 h-6 rounded-full {competitor.rank === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} text-sm font-medium">
									{competitor.rank}
								</div>
							</td>
							<td class="p-4">
								<div class="flex items-center gap-3">
									<Avatar class="h-8 w-8">
										{#if competitor.logo}
											<AvatarImage src={competitor.logo} alt={competitor.name} />
										{/if}
										<AvatarFallback class="text-xs">
											{competitor.name.substring(0, 2).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<span class="font-medium">{competitor.name}</span>
									{#if competitor.rank === 1}
										<Badge variant="outline" class="text-xs">You</Badge>
									{/if}
								</div>
							</td>
							<td class="p-4 text-right font-semibold">
								{competitor.visibility}
							</td>
							<td class="p-4 text-right">
								{#if competitor.change}
									<span class="text-sm font-medium {getChangeColor(competitor.change)}">
										{getChangeIcon(competitor.change)} {Math.abs(competitor.change)}%
									</span>
								{:else}
									<span class="text-sm text-muted-foreground">-</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			{#if competitors.length === 0}
				<div class="py-12 text-center">
					<p class="text-muted-foreground">No competitor data available</p>
				</div>
			{/if}
		</div>
	</Card.Content>
</Card.Root>
