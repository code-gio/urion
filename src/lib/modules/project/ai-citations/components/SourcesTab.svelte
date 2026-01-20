<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import * as Select from '$lib/components/ui/select/index.js';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from '$lib/components/ui/table';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import type { AICitationSource } from '$lib/types/ai-citations.js';

	interface Props {
		workspace: any;
		project: any;
	}

	let { workspace, project }: Props = $props();

	let sources = $state<AICitationSource[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let timeRange = $state<'7d' | '14d' | '30d'>('7d');
	let queryKey = $state<string | null>(null);
	let searchQuery = $state('');
	let sortBy = $state<'citations' | 'claims' | 'queries' | 'last_seen'>('citations');
	let sortOrder = $state<'asc' | 'desc'>('desc');

	const timeRangeLabel = $derived(
		timeRange === '7d' ? 'Last 7 days' : timeRange === '14d' ? 'Last 14 days' : 'Last 30 days'
	);

	const daysValue = $derived(timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30);

	// Filtered and sorted sources
	const filteredSources = $derived.by(() => {
		let filtered = sources;

		// Apply search filter
		if (searchQuery.trim()) {
			const search = searchQuery.toLowerCase();
			filtered = filtered.filter((source) =>
				source.publisher.toLowerCase().includes(search)
			);
		}

		// Apply sorting
		filtered = [...filtered].sort((a, b) => {
			let comparison = 0;
			switch (sortBy) {
				case 'citations':
					comparison = a.citations_count - b.citations_count;
					break;
				case 'claims':
					comparison = a.claims_count - b.claims_count;
					break;
				case 'queries':
					comparison = a.queries_count - b.queries_count;
					break;
				case 'last_seen':
					comparison =
						new Date(a.last_seen_at).getTime() - new Date(b.last_seen_at).getTime();
					break;
			}
			return sortOrder === 'asc' ? comparison : -comparison;
		});

		return filtered;
	});

	async function loadSources() {
		if (!workspace || !project) return;

		loading = true;
		error = null;

		try {
			const params = new URLSearchParams({
				days: daysValue.toString(),
			});
			if (queryKey) {
				params.append('query_key', queryKey);
			}

			const url = `/api/workspaces/${workspace.id}/projects/${project.id}/t/ai-citations/sources?${params.toString()}`;
			const response = await fetch(url);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: 'Failed to load sources' }));
				throw new Error(errorData.message || `HTTP ${response.status}`);
			}

			const data = await response.json();
			sources = data || [];
		} catch (err) {
			console.error('Error loading sources:', err);
			error = err instanceof Error ? err.message : 'Failed to load sources';
			sources = [];
		} finally {
			loading = false;
		}
	}

	function handleViewSource(publisher: string) {
		const encoded = encodeURIComponent(publisher);
		goto(`/w/${workspace.slug}/p/${project.slug}/t/ai-citations/sources/${encoded}`);
	}

	function handleSort(column: typeof sortBy) {
		if (sortBy === column) {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = column;
			sortOrder = 'desc';
		}
	}

	function formatDate(dateString: string): string {
		if (!dateString) return 'Never';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	function getDomainUrl(publisher: string): string {
		// Add protocol if missing
		if (publisher.startsWith('http://') || publisher.startsWith('https://')) {
			return publisher;
		}
		return `https://${publisher}`;
	}

	// Load sources when component mounts or filters change
	$effect(() => {
		if (browser && workspace && project) {
			// Trigger reload when timeRange, queryKey, or workspace/project changes
			daysValue; // Track daysValue dependency
			queryKey; // Track queryKey dependency
			loadSources();
		}
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold tracking-tight">Sources</h2>
			<p class="text-muted-foreground">
				Most cited sources referencing your brand
			</p>
		</div>
	</div>

	<!-- Filters -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center">
		<div class="flex gap-2 flex-1">
			<Select.Root type="single" bind:value={timeRange}>
				<Select.Trigger class="w-[180px]">
					{timeRangeLabel}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="7d" label="Last 7 days">Last 7 days</Select.Item>
					<Select.Item value="14d" label="Last 14 days">Last 14 days</Select.Item>
					<Select.Item value="30d" label="Last 30 days">Last 30 days</Select.Item>
				</Select.Content>
			</Select.Root>

			<Input
				type="text"
				placeholder="Search domains..."
				bind:value={searchQuery}
				class="max-w-sm"
			/>
		</div>
	</div>

	<!-- Error State -->
	{#if error}
		<div class="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
			<p class="text-sm text-destructive">{error}</p>
			<Button variant="outline" size="sm" class="mt-2" onclick={loadSources}>
				Retry
			</Button>
		</div>
	{/if}

	<!-- Loading State -->
	{#if loading}
		<div class="flex items-center justify-center py-12">
			<p class="text-muted-foreground">Loading sources...</p>
		</div>
			{:else if filteredSources.length === 0 && !error}
		<!-- Empty State -->
		<div class="flex flex-col items-center justify-center py-12 text-center space-y-4">
			<p class="text-muted-foreground text-lg font-medium">
				{#if searchQuery}
					No sources found matching "{searchQuery}"
				{:else}
					No sources found for the selected time range
				{/if}
			</p>
			<div class="text-sm text-muted-foreground space-y-2 max-w-md">
				{#if !searchQuery}
					<p>This could mean:</p>
					<ul class="list-disc list-inside text-left space-y-1">
						<li>No citation jobs have completed successfully yet</li>
						<li>No citations exist for the selected time range ({timeRange})</li>
						<li>RPC functions may need to be created (check database migration)</li>
					</ul>
					<p class="pt-2">Try:</p>
					<ul class="list-disc list-inside text-left space-y-1">
						<li>Adjusting the time range (try 30 days)</li>
						<li>Waiting for citation jobs to complete</li>
						<li>Checking that citation data exists in the database</li>
					</ul>
				{:else}
					<p>Try adjusting your search query or clearing the search filter.</p>
				{/if}
			</div>
		</div>
	{:else}
		<!-- Sources Table -->
		<div class="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead
							class="cursor-pointer hover:bg-muted/50"
							onclick={() => handleSort('citations')}
						>
							<div class="flex items-center gap-2">
								Source
								{#if sortBy === 'citations'}
									<span class="text-xs text-muted-foreground">
										{sortOrder === 'asc' ? '↑' : '↓'}
									</span>
								{/if}
							</div>
						</TableHead>
						<TableHead
							class="cursor-pointer hover:bg-muted/50 text-right"
							onclick={() => handleSort('citations')}
						>
							<div class="flex items-center justify-end gap-2">
								Citations
								{#if sortBy === 'citations'}
									<span class="text-xs text-muted-foreground">
										{sortOrder === 'asc' ? '↑' : '↓'}
									</span>
								{/if}
							</div>
						</TableHead>
						<TableHead
							class="cursor-pointer hover:bg-muted/50 text-right"
							onclick={() => handleSort('claims')}
						>
							<div class="flex items-center justify-end gap-2">
								Claims
								{#if sortBy === 'claims'}
									<span class="text-xs text-muted-foreground">
										{sortOrder === 'asc' ? '↑' : '↓'}
									</span>
								{/if}
							</div>
						</TableHead>
						<TableHead
							class="cursor-pointer hover:bg-muted/50 text-right"
							onclick={() => handleSort('queries')}
						>
							<div class="flex items-center justify-end gap-2">
								Queries
								{#if sortBy === 'queries'}
									<span class="text-xs text-muted-foreground">
										{sortOrder === 'asc' ? '↑' : '↓'}
									</span>
								{/if}
							</div>
						</TableHead>
						<TableHead
							class="cursor-pointer hover:bg-muted/50"
							onclick={() => handleSort('last_seen')}
						>
							<div class="flex items-center gap-2">
								Last Seen
								{#if sortBy === 'last_seen'}
									<span class="text-xs text-muted-foreground">
										{sortOrder === 'asc' ? '↑' : '↓'}
									</span>
								{/if}
							</div>
						</TableHead>
						<TableHead class="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each filteredSources as source}
						<TableRow>
							<TableCell class="font-medium">
								<div class="flex items-center gap-2">
									{source.publisher}
									<a
										href={getDomainUrl(source.publisher)}
										target="_blank"
										rel="noopener noreferrer"
										class="text-muted-foreground hover:text-foreground"
										onclick={(e) => e.stopPropagation()}
									>
										<ExternalLinkIcon class="h-4 w-4" />
									</a>
								</div>
							</TableCell>
							<TableCell class="text-right">
								{source.citations_count.toLocaleString()}
							</TableCell>
							<TableCell class="text-right">
								{source.claims_count.toLocaleString()}
							</TableCell>
							<TableCell class="text-right">
								{source.queries_count.toLocaleString()}
							</TableCell>
							<TableCell>{formatDate(source.last_seen_at)}</TableCell>
							<TableCell class="text-right">
								<Button
									variant="ghost"
									size="sm"
									onclick={() => handleViewSource(source.publisher)}
								>
									<EyeIcon class="h-4 w-4 mr-2" />
									View
								</Button>
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</div>
	{/if}
</div>
