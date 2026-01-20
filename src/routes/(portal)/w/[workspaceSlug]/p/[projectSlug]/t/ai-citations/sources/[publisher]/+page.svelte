<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from '$lib/components/ui/table';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type {
		AICitationDetail,
		AICitationSourceDetailHeader,
		AICitationSourceQuery,
	} from '$lib/types/ai-citations.js';

	let { data }: { data: any } = $props();

	let header = $state<AICitationSourceDetailHeader | null>(null);
	let citations = $state<AICitationDetail[]>([]);
	let queries = $state<AICitationSourceQuery[]>([]);
	let loading = $state(false);
	let loadingQueries = $state(false);
	let error = $state<string | null>(null);
	let activeTab = $state<'citations' | 'queries'>('citations');
	let tabsReady = $state(!browser);

	async function loadCitations() {
		if (!data.citationsUrl) return;

		loading = true;
		error = null;

		try {
			const response = await fetch(data.citationsUrl);
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({
					message: 'Failed to load citations',
				}));
				throw new Error(errorData.message || `HTTP ${response.status}`);
			}

			const result = await response.json();
			header = result.header || null;
			citations = result.citations || [];
		} catch (err) {
			console.error('Error loading citations:', err);
			error = err instanceof Error ? err.message : 'Failed to load citations';
		} finally {
			loading = false;
		}
	}

	async function loadQueries() {
		if (!data.queriesUrl || loadingQueries) return;

		loadingQueries = true;

		try {
			const response = await fetch(data.queriesUrl);
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const result = await response.json();
			queries = result || [];
		} catch (err) {
			console.error('Error loading queries:', err);
		} finally {
			loadingQueries = false;
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

	function handleBack() {
		goto(`/w/${data.workspace.slug}/p/${data.project.slug}/t/ai-citations#sources`);
	}

	function handleViewQuery(renderedQuery: string) {
		// Navigate to queries tab with search
		goto(
			`/w/${data.workspace.slug}/p/${data.project.slug}/t/ai-citations#queries?search=${encodeURIComponent(renderedQuery)}`
		);
	}

	// Load data when component mounts
	$effect(() => {
		if (browser && data.citationsUrl) {
			loadCitations();
		}
	});

	// Load queries when queries tab becomes active
	$effect(() => {
		if (browser && activeTab === 'queries' && queries.length === 0) {
			loadQueries();
		}
	});

	// Ensure tabs are ready before rendering to prevent negative dimension calculations
	onMount(() => {
		if (browser) {
			// Use requestAnimationFrame to ensure DOM layout is complete
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					tabsReady = true;
				});
			});
		}
	});
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<Button variant="ghost" size="icon" onclick={handleBack}>
			<ArrowLeftIcon class="h-4 w-4" />
		</Button>
		<div class="flex-1">
			<h1 class="text-3xl font-bold tracking-tight">{data.publisher}</h1>
			<p class="text-muted-foreground">Source details and citations</p>
		</div>
	</div>

	<!-- Stats Header -->
	{#if header}
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
			<Card>
				<CardHeader class="pb-2">
					<CardDescription>Citations</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">{header.citations_count.toLocaleString()}</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader class="pb-2">
					<CardDescription>Claims</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">{header.claims_count.toLocaleString()}</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader class="pb-2">
					<CardDescription>Queries</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">{header.queries_count.toLocaleString()}</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader class="pb-2">
					<CardDescription>Last Seen</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="text-sm font-medium">{formatDate(header.last_seen_at)}</div>
				</CardContent>
			</Card>
		</div>
	{/if}

	<!-- Error State -->
	{#if error}
		<div class="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
			<p class="text-sm text-destructive">{error}</p>
			<Button variant="outline" size="sm" class="mt-2" onclick={loadCitations}>
				Retry
			</Button>
		</div>
	{/if}

	<!-- Tabs -->
	{#if tabsReady}
		<div class="w-full">
			<Tabs.Root value={activeTab} onValueChange={(v) => (activeTab = v as typeof activeTab)}>
				<Tabs.List class="w-full border-b">
					<Tabs.Trigger value="citations">Citations</Tabs.Trigger>
					<Tabs.Trigger value="queries">Queries</Tabs.Trigger>
				</Tabs.List>

		<!-- Citations Tab -->
		<Tabs.Content value="citations" class="mt-6">
			{#if loading}
				<div class="flex items-center justify-center py-12">
					<p class="text-muted-foreground">Loading citations...</p>
				</div>
			{:else if citations.length === 0}
				<div class="flex flex-col items-center justify-center py-12 text-center">
					<p class="text-muted-foreground">No citations found for this source</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each citations as citation}
						<Card>
							<CardContent class="pt-6">
								<div class="space-y-4">
									<div class="flex items-start justify-between">
										<div class="flex-1 space-y-2">
											<div class="flex items-center gap-2">
												<Badge variant="secondary">{citation.query_key}</Badge>
												<span class="text-sm text-muted-foreground">
													{formatDate(citation.run_finished_at)}
												</span>
											</div>
											<p class="text-sm font-medium">{citation.rendered_query}</p>
										</div>
										{#if citation.source_url}
											<a
												href={citation.source_url}
												target="_blank"
												rel="noopener noreferrer"
												class="text-muted-foreground hover:text-foreground"
											>
												<ExternalLinkIcon class="h-4 w-4" />
											</a>
										{/if}
									</div>
									{#if citation.snippet}
										<div class="rounded-md bg-muted p-3">
											<p class="text-sm">{citation.snippet}</p>
										</div>
									{/if}
									{#if citation.source_url}
										<div class="text-xs text-muted-foreground">
											<a
												href={citation.source_url}
												target="_blank"
												rel="noopener noreferrer"
												class="hover:underline"
											>
												{citation.source_url}
											</a>
										</div>
									{/if}
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			{/if}
		</Tabs.Content>

		<!-- Queries Tab -->
		<Tabs.Content value="queries" class="mt-6">
			{#if loadingQueries}
				<div class="flex items-center justify-center py-12">
					<p class="text-muted-foreground">Loading queries...</p>
				</div>
			{:else if queries.length === 0}
				<div class="flex flex-col items-center justify-center py-12 text-center">
					<p class="text-muted-foreground">No queries found for this source</p>
				</div>
			{:else}
				<div class="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Query Key</TableHead>
								<TableHead>Query</TableHead>
								<TableHead class="text-right">Citations</TableHead>
								<TableHead>Last Seen</TableHead>
								<TableHead class="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each queries as query}
								<TableRow>
									<TableCell>
										<Badge variant="secondary">{query.query_key}</Badge>
									</TableCell>
									<TableCell class="font-medium">{query.rendered_query}</TableCell>
									<TableCell class="text-right">
										{query.citations_count.toLocaleString()}
									</TableCell>
									<TableCell>{formatDate(query.last_seen_at)}</TableCell>
									<TableCell class="text-right">
										<Button
											variant="ghost"
											size="sm"
											onclick={() => handleViewQuery(query.rendered_query)}
										>
											View
										</Button>
									</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</div>
			{/if}
		</Tabs.Content>
			</Tabs.Root>
		</div>
	{/if}
</div>
