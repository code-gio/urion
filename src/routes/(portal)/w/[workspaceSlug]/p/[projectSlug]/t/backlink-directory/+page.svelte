<script lang="ts">
	import type { ProjectPageData } from '$lib/types';
	import type { GetBacklinkSitesParams, BacklinkSiteWithSubmission, BacklinkSite } from '$lib/types';
	import { usePortal } from '$lib/stores/portal.svelte.js';
	import { get } from '$lib/api/client.js';
	import { invalidateAll } from '$app/navigation';
	import BacklinkSiteList from '$lib/components/backlinks/directory/BacklinkSiteList.svelte';
	import BacklinkFilters from '$lib/components/backlinks/directory/BacklinkFilters.svelte';
	import BacklinkSearch from '$lib/components/backlinks/directory/BacklinkSearch.svelte';
	import BacklinkSiteModal from '$lib/components/backlinks/directory/BacklinkSiteModal.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import FilterIcon from '@lucide/svelte/icons/filter';

	let { data }: { data: ProjectPageData } = $props();

	const portal = usePortal();
	const project = $derived(portal.currentProject);
	const workspace = $derived(portal.currentWorkspace);

	let sites = $state<BacklinkSiteWithSubmission[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let total = $state(0);
	let limit = $state(25);
	let offset = $state(0);

	let filters = $state<GetBacklinkSitesParams>({});
	let search = $state('');
	let selectedSite = $state<BacklinkSite | null>(null);
	let selectedSubmission = $state(null);
	let modalOpen = $state(false);
	let filtersOpen = $state(false);

	async function loadSites() {
		if (!workspace || !project) return;

		loading = true;
		error = null;

		try {
			const params = new URLSearchParams();
			Object.entries({ ...filters, search, limit, offset }).forEach(([key, value]) => {
				if (value !== undefined && value !== null && value !== '') {
					if (Array.isArray(value)) {
						params.append(key, value.join(','));
					} else {
						params.append(key, String(value));
					}
				}
			});

			const response = await get<{
				sites: BacklinkSiteWithSubmission[];
				total: number;
				limit: number;
				offset: number;
			}>(`/api/workspaces/${workspace.id}/projects/${project.id}/t/backlinks?${params.toString()}`);

			sites = response.sites;
			total = response.total;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load backlink sites';
			console.error('Error loading sites:', err);
		} finally {
			loading = false;
		}
	}

	async function handleViewDetails(site: BacklinkSite) {
		if (!workspace || !project) return;

		try {
			const response = await get<{ site: BacklinkSite; submission: any }>(
				`/api/workspaces/${workspace.id}/projects/${project.id}/t/backlinks/s/${site.id}`
			);
			selectedSite = response.site;
			selectedSubmission = response.submission;
			modalOpen = true;
		} catch (err) {
			console.error('Error loading site details:', err);
		}
	}

	async function handleAddToProject(site: BacklinkSite) {
		if (!workspace || !project) return;

		try {
			const { post } = await import('$lib/api/client.js');
			await post(`/api/workspaces/${workspace.id}/projects/${project.id}/t/backlinks/submissions`, {
				backlink_site_id: site.id,
			});
			await invalidateAll();
			await loadSites();
			modalOpen = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to add site to project';
			console.error('Error adding site:', err);
		}
	}

	function handleSearchChange(value: string) {
		search = value;
		offset = 0;
		loadSites();
	}

	function handleFiltersChange(newFilters: GetBacklinkSitesParams) {
		filters = newFilters;
		offset = 0;
		loadSites();
	}

	function handleFiltersReset() {
		filters = {};
		search = '';
		offset = 0;
		loadSites();
	}

	$effect(() => {
		if (workspace && project) {
			loadSites();
		}
	});
</script>

<div class="container ">
	<div class="mb-6">
		<div class="flex items-center justify-between mb-4">
			<div>
				<h1 class="text-3xl font-bold mb-2">Backlink Directory</h1>
				<p class="text-muted-foreground">
					Browse and add backlink opportunities for {project?.name || 'this project'}
				</p>
			</div>
			<a href="/w/{workspace?.slug}/p/{project?.slug}/t/backlink-directory/submissions">
				<Button variant="outline">
					My Submissions
				</Button>
			</a>
		</div>
	</div>

	{#if error}
		<div class="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg">
			<p>{error}</p>
		</div>
	{/if}

	<div class="flex gap-4">
		<!-- Filters Sidebar (Desktop) -->
		<aside class="hidden lg:block w-64 shrink-0">
			<div class="sticky top-4 space-y-4">
				<BacklinkSearch value={search} onChange={handleSearchChange} />
				<BacklinkFilters {filters} onChange={handleFiltersChange} onReset={handleFiltersReset} />
			</div>
		</aside>

		<!-- Main Content -->
		<div class="flex-1 space-y-4">
			<!-- Mobile Search and Filter Button -->
			<div class="lg:hidden flex gap-2 items-center">
				<BacklinkSearch value={search} onChange={handleSearchChange} class="flex-1" />
				<Sheet.Root bind:open={filtersOpen}>
					<Sheet.Trigger>
						<Button variant="outline" size="icon">
							<FilterIcon class="size-4" />
						</Button>
					</Sheet.Trigger>
					<Sheet.Content side="left" class="w-80">
						<Sheet.Header>
							<Sheet.Title>Filters</Sheet.Title>
						</Sheet.Header>
						<div class="mt-4 space-y-4">
							<BacklinkFilters {filters} onChange={handleFiltersChange} onReset={handleFiltersReset} />
						</div>
					</Sheet.Content>
				</Sheet.Root>
			</div>

			<div class="text-sm text-muted-foreground">
				Showing {sites.length} of {total} sites
			</div>

			<BacklinkSiteList
				{sites}
				{loading}
				onViewDetails={handleViewDetails}
				onAddToProject={handleAddToProject}
			/>

			{#if !loading && sites.length > 0 && offset + limit < total}
				<div class="flex justify-center">
					<Button
						variant="outline"
						onclick={() => {
							offset += limit;
							loadSites();
						}}
					>
						Load More
					</Button>
				</div>
			{/if}
		</div>
	</div>
</div>

{#if selectedSite}
	<BacklinkSiteModal
		site={selectedSite}
		submission={selectedSubmission}
		open={modalOpen}
		onClose={() => {
			modalOpen = false;
			selectedSite = null;
			selectedSubmission = null;
		}}
		onAddToProject={handleAddToProject}
	/>
{/if}

