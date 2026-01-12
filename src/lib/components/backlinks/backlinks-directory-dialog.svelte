<script lang="ts">
  import type {
    GetBacklinkSitesParams,
    BacklinkSiteWithSubmission,
    BacklinkSite,
  } from "$lib/types";
  import { usePortal } from "$lib/stores/portal.svelte.js";
  import { get } from "$lib/api/client.js";
  import { toast } from "svelte-sonner";
  import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import BacklinkSiteList from "$lib/components/backlinks/directory/BacklinkSiteList.svelte";
  import BacklinkFilters from "$lib/components/backlinks/directory/BacklinkFilters.svelte";
  import BacklinkSearch from "$lib/components/backlinks/directory/BacklinkSearch.svelte";
  import BacklinkSiteModal from "$lib/components/backlinks/directory/BacklinkSiteModal.svelte";

  let { open = $bindable(false), onSubmissionAdded }: { open?: boolean; onSubmissionAdded?: () => void } = $props();

  const portal = usePortal();
  const project = $derived(portal.currentProject);
  const workspace = $derived(portal.currentWorkspace);

  let sites = $state<BacklinkSiteWithSubmission[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let total = $state(0);
  let limit = $state(20);
  let offset = $state(0);
  let hasInitialized = $state(false);
  let addingToProject = $state(false);

  let filters = $state<GetBacklinkSitesParams>({});
  let search = $state("");
  let selectedSite = $state<BacklinkSiteWithSubmission | null>(null);
  let selectedSubmission = $state<any>(null);
  let modalOpen = $state(false);

  async function loadSites(append = false) {
    if (!workspace || !project) return;

    loading = true;
    error = null;

    try {
      const params = new URLSearchParams();
      Object.entries({ ...filters, search, limit, offset }).forEach(
        ([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            if (Array.isArray(value)) {
              params.append(key, value.join(","));
            } else {
              params.append(key, String(value));
            }
          }
        }
      );

      const response = await get<{
        sites: BacklinkSiteWithSubmission[];
        total: number;
        limit: number;
        offset: number;
      }>(
        `/api/workspaces/${workspace.id}/projects/${project.id}/t/backlinks?${params.toString()}`
      );

      if (append) {
        sites = [...sites, ...response.sites];
      } else {
        sites = response.sites;
      }
      total = response.total;
    } catch (err) {
      error =
        err instanceof Error ? err.message : "Failed to load backlink sites";
      console.error("Error loading sites:", err);
    } finally {
      loading = false;
    }
  }

  async function handleViewDetails(site: BacklinkSiteWithSubmission) {
    selectedSite = site;
    selectedSubmission = site.submission;
    modalOpen = true;
  }

  async function handleAddToProject(site: BacklinkSiteWithSubmission) {
    if (!workspace || !project || addingToProject) return;

    addingToProject = true;
    
    try {
      const { post } = await import("$lib/api/client.js");
      const response = await post<{ submission: any }>(
        `/api/workspaces/${workspace.id}/projects/${project.id}/t/backlinks/submissions`,
        {
          backlink_site_id: site.id,
        }
      );

      // Update the site in the local array to reflect it now has a submission
      sites = sites.map(s => 
        s.id === site.id 
          ? { ...s, has_submission: true, submission: response.submission } as BacklinkSiteWithSubmission
          : s
      );

      // Update selected site if it's the same one
      if (selectedSite?.id === site.id) {
        selectedSite = { ...selectedSite, has_submission: true, submission: response.submission } as BacklinkSiteWithSubmission;
        selectedSubmission = response.submission;
      }

      // Notify parent component to reload
      onSubmissionAdded?.();
      
      modalOpen = false;
      
      toast.success('Site added to project successfully');
    } catch (err) {
      error =
        err instanceof Error ? err.message : "Failed to add site to project";
      console.error("Error adding site:", err);
      toast.error(error);
    } finally {
      addingToProject = false;
    }
  }

  function handleSearchChange(value: string) {
    search = value;
    offset = 0;
    loadSites(false);
  }

  function handleFiltersChange(newFilters: GetBacklinkSitesParams) {
    filters = newFilters;
    offset = 0;
    loadSites(false);
  }

  function handleFiltersReset() {
    filters = {};
    search = "";
    offset = 0;
    loadSites(false);
  }

  function handleLoadMore() {
    offset += limit;
    loadSites(true);
  }

  $effect(() => {
    if (open && workspace && project && !hasInitialized) {
      hasInitialized = true;
      loadSites(false);
    } else if (!open && hasInitialized) {
      // Reset hasInitialized when dialog closes so it reloads fresh data next time
      hasInitialized = false;
    }
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Content
    class="overflow-hidden p-0 md:max-h-[90vh] md:max-w-[1200px]"
    trapFocus={false}
  >
    <Dialog.Title class="sr-only">Backlink Directory</Dialog.Title>
    <Dialog.Description class="sr-only"
      >Browse and add backlink opportunities</Dialog.Description
    >
    <Sidebar.Provider class="items-start">
      <Sidebar.Root collapsible="none" class="hidden md:flex w-64">
        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupContent class="px-4 pb-4">
              <BacklinkFilters
                {filters}
                onChange={handleFiltersChange}
                onReset={handleFiltersReset}
              />
            </Sidebar.GroupContent>
          </Sidebar.Group>
        </Sidebar.Content>
      </Sidebar.Root>
      <main class="flex h-[600px] md:h-[80vh] flex-1 flex-col overflow-hidden">
        <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <div class="flex items-center justify-between w-full">
            <Breadcrumb.Root>
              <Breadcrumb.List>
                <Breadcrumb.Item>
                  <Breadcrumb.Page>Backlink Directory</Breadcrumb.Page>
                </Breadcrumb.Item>
              </Breadcrumb.List>
            </Breadcrumb.Root>
            <div class="flex items-center gap-4">
              <BacklinkSearch
                value={search}
                onChange={handleSearchChange}
                class="w-64"
              />

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
            addingToProject={addingToProject}
            onViewDetails={handleViewDetails}
            onAddToProject={handleAddToProject}
          />
          {#if !loading && sites.length > 0 && sites.length < total}
            <div class="flex justify-center">
              <Button variant="outline" onclick={handleLoadMore}>
                Load More ({sites.length} of {total})
              </Button>
            </div>
          {/if}
        </div>
      </main>
    </Sidebar.Provider>
  </Dialog.Content>
</Dialog.Root>

<BacklinkSiteModal
  site={selectedSite}
  submission={selectedSubmission}
  bind:open={modalOpen}
  addingToProject={addingToProject}
  onClose={() => {
    modalOpen = false;
    selectedSite = null;
    selectedSubmission = null;
  }}
  onAddToProject={handleAddToProject}
/>
