<script lang="ts">
	import type { ProjectPageData } from '$lib/types';
	import type { SubmissionAnalytics, BacklinkSubmissionWithSite } from '$lib/types';
	import { usePortal } from '$lib/stores/portal.svelte.js';
	import { get } from '$lib/api/client.js';
	import AnalyticsOverview from '$lib/components/backlinks/analytics/AnalyticsOverview.svelte';
	import MetricsCards from '$lib/components/backlinks/analytics/MetricsCards.svelte';
	import CategoryBreakdown from '$lib/components/backlinks/analytics/CategoryBreakdown.svelte';
	import ProgressChart from '$lib/components/backlinks/analytics/ProgressChart.svelte';
	import PerformanceTable from '$lib/components/backlinks/analytics/PerformanceTable.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';

	let { data }: { data: ProjectPageData } = $props();

	const portal = usePortal();
	const project = $derived(portal.currentProject);
	const workspace = $derived(portal.currentWorkspace);

	let analytics = $state<SubmissionAnalytics | null>(null);
	let topPerformers = $state<BacklinkSubmissionWithSite[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadAnalytics() {
		if (!workspace || !project) return;

		loading = true;
		error = null;

		try {
			const [analyticsData, submissionsData] = await Promise.all([
				get<SubmissionAnalytics>(
					`/api/workspaces/${workspace.id}/projects/${project.id}/t/backlinks/submissions/stats`
				),
				get<{ submissions: BacklinkSubmissionWithSite[] }>(
					`/api/workspaces/${workspace.id}/projects/${project.id}/t/backlinks/submissions?limit=100`
				),
			]);

			analytics = analyticsData;
			topPerformers = submissionsData.submissions;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load analytics';
			console.error('Error loading analytics:', err);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (workspace && project) {
			loadAnalytics();
		}
	});
</script>

<div class="container mx-auto py-8 px-4">
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Backlink Analytics</h1>
		<p class="text-muted-foreground">
			Track your backlink building performance for {project?.name || 'this project'}
		</p>
	</div>

	{#if loading}
		<div class="space-y-6">
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				{#each Array(4) as _}
					<Skeleton class="h-24" />
				{/each}
			</div>
			<Skeleton class="h-64" />
		</div>
	{:else if error}
		<div class="p-4 bg-destructive/10 text-destructive rounded-lg">
			<p>{error}</p>
		</div>
	{:else if analytics}
		<div class="space-y-6">
			<AnalyticsOverview {analytics} />

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<ProgressChart recent_activity={analytics.recent_activity} />
				<CategoryBreakdown by_category={analytics.by_category} />
			</div>

			<MetricsCards metrics={analytics.metrics} />

			<div class="space-y-4">
				<h2 class="text-2xl font-bold">Top Performing Backlinks</h2>
				<PerformanceTable {submissions}={topPerformers} />
			</div>
		</div>
	{/if}
</div>

