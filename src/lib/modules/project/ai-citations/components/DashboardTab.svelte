<script lang="ts">
	import {
		MetricCard,
		VisibilityChart,
		CitationShareChart,
		CompetitorRankingsTable,
		TopSourcesTable
	} from '$lib/modules/project/ai-citations';
	import * as Select from '$lib/components/ui/select/index.js';

	let {
		selectedPlatform = $bindable('all'),
		selectedTimeframe = $bindable('7d')
	}: {
		selectedPlatform?: string;
		selectedTimeframe?: string;
	} = $props();

	const brandVisibility = '51.8%';
	const citationShare = '12.0%';
	const brandRanking = '#1';
	const closestCompetitor = 'Netlify';

	const generateVisibilityData = () => {
		const data = [];
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(endDate.getDate() - 180);

		for (let i = 0; i < 180; i++) {
			const date = new Date(startDate);
			date.setDate(date.getDate() + i);
			data.push({
				date,
				vercel: Math.random() * 30 + 40,
				netlify: Math.random() * 20 + 20,
				aws: Math.random() * 15 + 15,
				render: Math.random() * 10 + 10,
				heroku: Math.random() * 10 + 5
			});
		}
		return data;
	};

	const generateCitationData = () => {
		const data = [];
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(endDate.getDate() - 180);

		for (let i = 0; i < 180; i++) {
			const date = new Date(startDate);
			date.setDate(date.getDate() + i);
			data.push({
				date,
				citations: Math.random() * 5 + 10
			});
		}
		return data;
	};

	const visibilityData = generateVisibilityData();
	const citationData = generateCitationData();

	const competitors = [
		{ rank: 1, name: 'Vercel', logo: undefined, visibility: '51.8%', change: 2.3 },
		{ rank: 2, name: 'Netlify', logo: undefined, visibility: '36.9%', change: -1.2 },
		{ rank: 3, name: 'AWS Amplify', logo: undefined, visibility: '21.7%', change: 0.5 },
		{ rank: 4, name: 'Render', logo: undefined, visibility: '21.4%', change: 1.1 },
		{ rank: 5, name: 'Heroku', logo: undefined, visibility: '17.3%', change: -0.8 },
		{ rank: 6, name: 'Cloudflare Pages', logo: undefined, visibility: '14.9%', change: 0.3 }
	];

	const topSources = [
		{
			rank: 1,
			name: 'Wikipedia',
			domain: 'en.wikipedia.org',
			citations: 1690,
			url: 'https://wikipedia.org'
		},
		{ rank: 2, name: 'Medium', domain: 'medium.com', citations: 1153, url: 'https://medium.com' },
		{
			rank: 3,
			name: 'Aws',
			domain: 'aws.amazon.com',
			citations: 1115,
			url: 'https://aws.amazon.com'
		},
		{
			rank: 4,
			name: 'Cloud',
			domain: 'cloud.google.com',
			citations: 908,
			url: 'https://cloud.google.com'
		}
	];
</script>

<div class="space-y-6">
	<!-- Metrics Grid -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		<MetricCard
			title="Brand Visibility"
			value={brandVisibility}
			subtitle="Based on 1806 prompts simulated"
			change="+2.3%"
			changeType="positive"
		/>
		<MetricCard
			title="Citation Share"
			value={citationShare}
			subtitle="330 of 2925 citations"
			change="-0.5%"
			changeType="negative"
		/>
		<MetricCard
			title="Brand Ranking"
			value={brandRanking}
			subtitle="Market leader"
			change="→"
			changeType="neutral"
		/>
		<MetricCard
			title="Closest Competitor"
			value={closestCompetitor}
			subtitle="150 mentions"
			change="-14.9%"
			changeType="positive"
		/>
	</div>

	<!-- Main Content Grid: Left Column (Charts) and Right Column (Tables) -->
	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Left Column: Charts -->
		<div class="space-y-6">
			<VisibilityChart data={visibilityData} />
			<CitationShareChart data={citationData} />
		</div>

		<!-- Right Column: Tables -->
		<div class="space-y-6">
			<CompetitorRankingsTable {competitors} />
			<TopSourcesTable sources={topSources} />
		</div>
	</div>
</div>
