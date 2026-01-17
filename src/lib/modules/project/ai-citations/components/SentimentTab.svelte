<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { Badge } from '$lib/components/ui/badge';
	import { scaleUtc } from 'd3-scale';
	import { Area, AreaChart } from 'layerchart';
	import { curveNatural } from 'd3-shape';

	const sentimentStats = {
		positive: 68,
		neutral: 24,
		negative: 8
	};

	const generateSentimentData = () => {
		const data = [];
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(endDate.getDate() - 30);

		for (let i = 0; i < 30; i++) {
			const date = new Date(startDate);
			date.setDate(date.getDate() + i);
			data.push({
				date,
				positive: Math.random() * 20 + 50,
				neutral: Math.random() * 15 + 15,
				negative: Math.random() * 10 + 5
			});
		}
		return data;
	};

	const sentimentData = generateSentimentData();

	const chartConfig = {
		positive: { label: 'Positive', color: 'hsl(142, 76%, 36%)' },
		neutral: { label: 'Neutral', color: 'hsl(215, 20%, 65%)' },
		negative: { label: 'Negative', color: 'hsl(0, 84%, 60%)' }
	} satisfies Chart.ChartConfig;

	const recentMentions = [
		{
			id: 1,
			text: 'Vercel is the best platform for deploying Next.js applications...',
			sentiment: 'positive',
			source: 'ChatGPT',
			date: '2 hours ago'
		},
		{
			id: 2,
			text: 'When comparing deployment platforms, Vercel stands out for its...',
			sentiment: 'positive',
			source: 'Claude',
			date: '4 hours ago'
		},
		{
			id: 3,
			text: 'Vercel offers great performance, though pricing can be high...',
			sentiment: 'neutral',
			source: 'Gemini',
			date: '6 hours ago'
		}
	];

	function getSentimentColor(sentiment: string) {
		switch (sentiment) {
			case 'positive':
				return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
			case 'negative':
				return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
		}
	}
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-bold tracking-tight">Sentiment Analysis</h2>
		<p class="text-muted-foreground">How your brand is perceived across AI platforms</p>
	</div>

	<div class="grid gap-4 md:grid-cols-3">
		<Card.Root>
			<Card.Content class="pt-6">
				<div class="space-y-2">
					<p class="text-sm font-medium text-muted-foreground">Positive</p>
					<div class="flex items-baseline gap-2">
						<h3 class="text-3xl font-bold text-green-600">{sentimentStats.positive}%</h3>
					</div>
					<div class="w-full bg-secondary rounded-full h-2">
						<div
							class="bg-green-600 rounded-full h-2"
							style="width: {sentimentStats.positive}%"
						></div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Content class="pt-6">
				<div class="space-y-2">
					<p class="text-sm font-medium text-muted-foreground">Neutral</p>
					<div class="flex items-baseline gap-2">
						<h3 class="text-3xl font-bold text-gray-600">{sentimentStats.neutral}%</h3>
					</div>
					<div class="w-full bg-secondary rounded-full h-2">
						<div
							class="bg-gray-600 rounded-full h-2"
							style="width: {sentimentStats.neutral}%"
						></div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Content class="pt-6">
				<div class="space-y-2">
					<p class="text-sm font-medium text-muted-foreground">Negative</p>
					<div class="flex items-baseline gap-2">
						<h3 class="text-3xl font-bold text-red-600">{sentimentStats.negative}%</h3>
					</div>
					<div class="w-full bg-secondary rounded-full h-2">
						<div
							class="bg-red-600 rounded-full h-2"
							style="width: {sentimentStats.negative}%"
						></div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<Card.Root class="@container/card">
		<Card.Header>
			<Card.Title>Sentiment Trends</Card.Title>
			<Card.Description>Track sentiment changes over time</Card.Description>
		</Card.Header>
		<Card.Content class="px-2 pt-4 sm:px-6 sm:pt-6">
			<Chart.Container config={chartConfig} class="aspect-auto h-[300px] w-full">
				<AreaChart
					legend
					data={sentimentData}
					x="date"
					xScale={scaleUtc()}
					series={[
						{
							key: 'negative',
							label: 'Negative',
							color: chartConfig.negative.color
						},
						{
							key: 'neutral',
							label: 'Neutral',
							color: chartConfig.neutral.color
						},
						{
							key: 'positive',
							label: 'Positive',
							color: chartConfig.positive.color
						}
					]}
					seriesLayout="stack"
					props={{
						area: {
							curve: curveNatural,
							'fill-opacity': 0.6,
							line: { class: 'stroke-2' },
							motion: 'tween'
						},
						xAxis: {
							format: (v) => {
								return v.toLocaleDateString('en-US', {
									month: 'short',
									day: 'numeric'
								});
							}
						},
						yAxis: {
							format: (v) => `${v}%`,
							ticks: 5
						}
					}}
				>
					{#snippet marks({ series, getAreaProps })}
						<defs>
							{#each series as s}
								<linearGradient id="fillSentiment{s.key}" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stop-color={s.color} stop-opacity={0.8} />
									<stop offset="95%" stop-color={s.color} stop-opacity={0.1} />
								</linearGradient>
							{/each}
						</defs>
						{#each series as s, i (s.key)}
							<Area {...getAreaProps(s, i)} fill="url(#fillSentiment{s.key})" />
						{/each}
					{/snippet}
					{#snippet tooltip()}
						<Chart.Tooltip
							labelFormatter={(v: Date) => {
								return v.toLocaleDateString('en-US', {
									month: 'short',
									day: 'numeric',
									year: 'numeric'
								});
							}}
							indicator="line"
						/>
					{/snippet}
				</AreaChart>
			</Chart.Container>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Recent Mentions</Card.Title>
			<Card.Description>Latest citations with sentiment analysis</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			{#each recentMentions as mention}
				<div class="space-y-2 pb-4 border-b last:border-0">
					<div class="flex items-start justify-between gap-4">
						<p class="text-sm flex-1">{mention.text}</p>
						<Badge class={getSentimentColor(mention.sentiment)}>
							{mention.sentiment}
						</Badge>
					</div>
					<div class="flex items-center gap-2 text-xs text-muted-foreground">
						<span>{mention.source}</span>
						<span>•</span>
						<span>{mention.date}</span>
					</div>
				</div>
			{/each}
		</Card.Content>
	</Card.Root>
</div>
