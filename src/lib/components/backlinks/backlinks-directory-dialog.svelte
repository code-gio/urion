<script lang="ts">
	import type { GetBacklinkSitesParams, BacklinkSiteWithSubmission, BacklinkSite } from '$lib/types';
	import { usePortal } from '$lib/stores/portal.svelte.js';
	import { get } from '$lib/api/client.js';
	import { invalidateAll } from '$app/navigation';
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import BacklinkSiteList from '$lib/components/backlinks/directory/BacklinkSiteList.svelte';
	import BacklinkFilters from '$lib/components/backlinks/directory/BacklinkFilters.svelte';
	import BacklinkSearch from '$lib/components/backlinks/directory/BacklinkSearch.svelte';
	import BacklinkSiteModal from '$lib/components/backlinks/directory/BacklinkSiteModal.svelte';

	let { open = $bindable(false) } = $props();

	const portal = usePortal();
	const project = $derived(portal.currentProject);
	const workspace = $derived(portal.currentWorkspace);

	let sites = $state<BacklinkSiteWithSubmission[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let total = $state(0);
	let limit = $state(25);
	let offset = $state(0);

	let filters = $state<GetBacklinkSitesParams>({});
	let search = $state('');
	let selectedSite = $state<BacklinkSite | null>(null);
	let selectedSubmission = $state(null);
	let modalOpen = $state(false);

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
		if (open && workspace && project) {
			loadSites();
		} else if (!open) {
			// Reset state when dialog closes
			sites = [];
			filters = {};
			search = '';
			offset = 0;
			error = null;
			selectedSite = null;
			selectedSubmission = null;
			modalOpen = false;
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="overflow-hidden p-0 md:max-h-[90vh] md:max-w-[1200px]"
		trapFocus={false}
	>
		<Dialog.Title class="sr-only">Backlink Directory</Dialog.Title>
		<Dialog.Description class="sr-only">Browse and add backlink opportunities</Dialog.Description>
		<Sidebar.Provider class="items-start">
			<Sidebar.Root collapsible="none" class="hidden md:flex w-64">
				<Sidebar.Content>
				
					<Sidebar.Group>
						<Sidebar.GroupContent class="px-4 pb-4">
							<BacklinkFilters {filters} onChange={handleFiltersChange} onReset={handleFiltersReset} />
						</Sidebar.GroupContent>
					</Sidebar.Group>
				</Sidebar.Content>
			</Sidebar.Root>
			<main class="flex h-[600px] md:h-[80vh] flex-1 flex-col overflow-hidden">
				<header
					class="flex h-16 shrink-0 items-center gap-2 border-b px-4"
				>
					<div class="flex items-center justify-between w-full">
						<Breadcrumb.Root>
							<Breadcrumb.List>
								<Breadcrumb.Item>
									<Breadcrumb.Page>Backlink Directory</Breadcrumb.Page>
								</Breadcrumb.Item>
							</Breadcrumb.List>
						</Breadcrumb.Root>
						<div class="flex items-center gap-4">
							<BacklinkSearch value={search} onChange={handleSearchChange} class="w-64" />

							<div class="text-sm text-muted-foreground">
								Showing {sites.length} of {total} sites
							</div>
						</div>
					</div>
				</header>
				<div class="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
					{#if error}
						<div class="p-4 bg-destructive/10 text-destructive rounded-lg">
							<p>{error}</p>
						</div>
					{/if}
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
			</main>
		</Sidebar.Provider>
	</Dialog.Content>
</Dialog.Root>

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
