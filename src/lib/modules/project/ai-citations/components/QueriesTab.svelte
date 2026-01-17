<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { Switch } from "$lib/components/ui/switch";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Label } from "$lib/components/ui/label";
  import * as Select from "$lib/components/ui/select/index.js";
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "$lib/components/ui/dropdown-menu";
  import SearchIcon from "@lucide/svelte/icons/search";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import MoreVerticalIcon from "@lucide/svelte/icons/more-vertical";
  import Edit2Icon from "@lucide/svelte/icons/edit-2";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import { toast } from "svelte-sonner";
  import { invalidate } from "$app/navigation";
  import type { ProjectQuery } from "$lib/types/project-queries";

  let {
    queries = [],
    canEdit = false,
    workspaceId,
    projectId,
  }: {
    queries?: ProjectQuery[];
    canEdit?: boolean;
    workspaceId: string;
    projectId: string;
  } = $props();

  // Local reactive state for queries
  let localQueries = $state<ProjectQuery[]>([]);

  // Sync local state with prop changes
  $effect(() => {
    localQueries = [...queries];
  });

  let searchQuery = $state("");
  let showAddDialog = $state(false);
  let showEditDialog = $state(false);
  let showDeleteDialog = $state(false);
  let editingQuery = $state<ProjectQuery | null>(null);
  let deletingQuery = $state<ProjectQuery | null>(null);

  // Pagination state
  let currentPage = $state(1);
  let itemsPerPage = $state(10);

  // Form state
  let formQueryText = $state("");
  let formQueryKey = $state("geo_audit");
  let formTopic = $state("");
  let formLocation = $state("");
  let formTags = $state<string[]>([]);
  let formIsActive = $state(true);
  let isSaving = $state(false);

  const filteredQueries = $derived(
    localQueries.filter((query) => {
      if (!searchQuery.trim()) return true;
      const search = searchQuery.toLowerCase();
      return (
        query.query_text.toLowerCase().includes(search) ||
        query.query_key.toLowerCase().includes(search) ||
        query.topic?.toLowerCase().includes(search) ||
        query.location?.toLowerCase().includes(search) ||
        query.tags.some((tag) => tag.toLowerCase().includes(search))
      );
    })
  );

  // Pagination derived values
  const totalPages = $derived(Math.ceil(filteredQueries.length / itemsPerPage));
  const paginatedQueries = $derived(
    filteredQueries.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    )
  );

  // Reset to page 1 when search changes
  $effect(() => {
    if (searchQuery) {
      currentPage = 1;
    }
  });

  const queryKeyLabel = $derived(
    formQueryKey === "geo_audit"
      ? "Geo Audit"
      : formQueryKey === "pricing_scan"
        ? "Pricing Scan"
        : formQueryKey === "brand_mentions"
          ? "Brand Mentions"
          : formQueryKey === "competitor_analysis"
            ? "Competitor Analysis"
            : "Custom"
  );

  function getQueryKeyColor(key: string) {
    switch (key) {
      case "geo_audit":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "pricing_scan":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "brand_mentions":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "competitor_analysis":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  }

  function openAddDialog() {
    formQueryText = "";
    formQueryKey = "geo_audit";
    formTopic = "";
    formLocation = "";
    formTags = [];
    formIsActive = true;
    editingQuery = null;
    showAddDialog = true;
  }

  function openEditDialog(query: ProjectQuery) {
    formQueryText = query.query_text;
    formQueryKey = query.query_key;
    formTopic = query.topic || "";
    formLocation = query.location || "";
    formTags = query.tags;
    formIsActive = query.is_active;
    editingQuery = query;
    showEditDialog = true;
  }

  function openDeleteDialog(query: ProjectQuery) {
    deletingQuery = query;
    showDeleteDialog = true;
  }

  async function handleSave() {
    if (!formQueryText.trim()) {
      toast.error("Query text is required");
      return;
    }

    if (formQueryText.length > 500) {
      toast.error("Query text must be less than 500 characters");
      return;
    }

    isSaving = true;

    try {
      const url = editingQuery
        ? `/api/workspaces/${workspaceId}/projects/${projectId}/queries?id=${editingQuery.id}`
        : `/api/workspaces/${workspaceId}/projects/${projectId}/queries`;

      const method = editingQuery ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query_text: formQueryText.trim(),
          query_key: formQueryKey,
          topic: formTopic.trim() || null,
          location: formLocation.trim() || null,
          tags: formTags,
          is_active: formIsActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save query");
      }

      const savedQuery = await response.json();
      
      // Update local state optimistically
      if (editingQuery) {
        localQueries = localQueries.map(q => q.id === savedQuery.id ? savedQuery : q);
      } else {
        localQueries = [savedQuery, ...localQueries];
      }

      toast.success(
        editingQuery
          ? "Query updated successfully"
          : "Query created successfully"
      );
      showAddDialog = false;
      showEditDialog = false;
      // Invalidate with a dependency key to avoid losing tab state
      await invalidate((url) => url.pathname.includes('/t/ai-citations'));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save query"
      );
    } finally {
      isSaving = false;
    }
  }

  async function handleDelete() {
    if (!deletingQuery) return;

    isSaving = true;

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/queries?id=${deletingQuery.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete query");
      }

      // Update local state optimistically
      localQueries = localQueries.filter(q => q.id !== deletingQuery!.id);

      toast.success("Query deleted successfully");
      showDeleteDialog = false;
      deletingQuery = null;
      // Invalidate with a dependency key to avoid losing tab state
      await invalidate((url) => url.pathname.includes('/t/ai-citations'));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete query"
      );
    } finally {
      isSaving = false;
    }
  }

  async function toggleActive(query: ProjectQuery) {
    if (!canEdit) return;

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/queries?id=${query.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_active: !query.is_active,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update query");
      }

      // Update local state optimistically
      localQueries = localQueries.map(q => 
        q.id === query.id ? { ...q, is_active: !q.is_active } : q
      );

      toast.success(query.is_active ? "Query deactivated" : "Query activated");
      // Invalidate with a dependency key to avoid losing tab state
      await invalidate((url) => url.pathname.includes('/t/ai-citations'));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update query"
      );
    }
  }

  function addTag() {
    const input = document.getElementById("tag-input") as HTMLInputElement;
    const tag = input?.value.trim();
    if (tag && !formTags.includes(tag)) {
      formTags = [...formTags, tag];
      input.value = "";
    }
  }

  function removeTag(tag: string) {
    formTags = formTags.filter((t) => t !== tag);
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }

  function nextPage() {
    if (currentPage < totalPages) {
      currentPage++;
    }
  }

  function prevPage() {
    if (currentPage > 1) {
      currentPage--;
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold tracking-tight">Manual Queries</h2>
      <p class="text-muted-foreground">
        Custom queries help tailor competitor and market analysis to your
        specific needs
      </p>
    </div>
    {#if canEdit}
      <Button onclick={openAddDialog}>
        <PlusIcon class="h-4 w-4 mr-2" />
        Add Query
      </Button>
    {/if}
  </div>

  <div class="relative">
    <SearchIcon
      class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
    />
    <Input
      bind:value={searchQuery}
      placeholder="Search queries..."
      class="pl-9"
    />
  </div>

  <!-- Results info and items per page -->
  <div class="flex items-center justify-between">
    <p class="text-sm text-muted-foreground">
      Showing {paginatedQueries.length > 0
        ? (currentPage - 1) * itemsPerPage + 1
        : 0} to {Math.min(currentPage * itemsPerPage, filteredQueries.length)} of
      {filteredQueries.length}
      {filteredQueries.length === 1 ? "query" : "queries"}
    </p>
    <div class="flex items-center gap-2">
      <span class="text-sm text-muted-foreground">Items per page:</span>
      <select
        bind:value={itemsPerPage}
        class="border rounded px-2 py-1 text-sm"
        onchange={() => (currentPage = 1)}
      >
        <option value={5}>5</option>
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
      </select>
    </div>
  </div>

  <Card.Root>
    <Card.Content class="p-0">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b bg-muted/50">
            <tr>
              <th class="text-left p-4 font-medium text-sm">Query</th>
              <th class="text-left p-4 font-medium text-sm">Type</th>
              <th class="text-left p-4 font-medium text-sm">Details</th>
              <th class="text-center p-4 font-medium text-sm">Status</th>
              {#if canEdit}
                <th class="text-right p-4 font-medium text-sm">Actions</th>
              {/if}
            </tr>
          </thead>
          <tbody>
            {#each paginatedQueries as query}
              <tr
                class="border-b last:border-0 hover:bg-muted/30 transition-colors"
              >
                <td class="p-4 max-w-md">
                  <p class="font-medium">{query.query_text}</p>
                  {#if query.tags.length > 0}
                    <div class="flex gap-1 mt-2 flex-wrap">
                      {#each query.tags as tag}
                        <Badge variant="outline" class="text-xs">{tag}</Badge>
                      {/each}
                    </div>
                  {/if}
                </td>
                <td class="p-4">
                  <Badge class={getQueryKeyColor(query.query_key)}>
                    {query.query_key
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Badge>
                </td>
                <td class="p-4">
                  <div class="text-sm space-y-1">
                    {#if query.topic}
                      <p class="text-muted-foreground">
                        <span class="font-medium">Topic:</span>
                        {query.topic}
                      </p>
                    {/if}
                    {#if query.location}
                      <p class="text-muted-foreground">
                        <span class="font-medium">Location:</span>
                        {query.location}
                      </p>
                    {/if}
                    {#if !query.topic && !query.location}
                      <span class="text-muted-foreground">-</span>
                    {/if}
                  </div>
                </td>
                <td class="p-4 text-center">
                  <Switch
                    checked={query.is_active}
                    onCheckedChange={() => toggleActive(query)}
                    disabled={!canEdit}
                  />
                </td>
                {#if canEdit}
                  <td class="p-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" size="icon">
                          <MoreVerticalIcon class="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onclick={() => openEditDialog(query)}>
                          <Edit2Icon class="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          class="text-destructive"
                          onclick={() => openDeleteDialog(query)}
                        >
                          <Trash2Icon class="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                {/if}
              </tr>
            {/each}
            {#if paginatedQueries.length === 0}
              <tr>
                <td colspan="5" class="p-12 text-center">
                  <p class="text-muted-foreground">
                    {searchQuery
                      ? "No queries found matching your search"
                      : "No queries yet"}
                  </p>
                  {#if canEdit && !searchQuery}
                    <Button
                      variant="outline"
                      class="mt-4"
                      onclick={openAddDialog}
                    >
                      <PlusIcon class="h-4 w-4 mr-2" />
                      Add your first query
                    </Button>
                  {/if}
                </td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Pagination Controls -->
  {#if filteredQueries.length > 0 && totalPages > 1}
    <div class="flex items-center justify-between">
      <div class="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onclick={prevPage}
          disabled={currentPage === 1}
        >
          Previous
        </Button>

        <!-- Page numbers -->
        <div class="flex gap-1">
          {#each Array.from({ length: totalPages }, (_, i) => i + 1) as page}
            {#if page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)}
              <Button
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onclick={() => goToPage(page)}
                class="w-10"
              >
                {page}
              </Button>
            {:else if page === currentPage - 2 || page === currentPage + 2}
              <span class="px-2 flex items-center">...</span>
            {/if}
          {/each}
        </div>

        <Button
          variant="outline"
          size="sm"
          onclick={nextPage}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  {/if}
</div>

<!-- Add/Edit Dialog -->
<Dialog.Root
  open={showAddDialog || showEditDialog}
  onOpenChange={(open) =>
    !open && ((showAddDialog = false), (showEditDialog = false))}
>
  <Dialog.Content class="max-w-2xl">
    <Dialog.Header>
      <Dialog.Title>{editingQuery ? "Edit Query" : "Add Query"}</Dialog.Title>
      <Dialog.Description>
        {editingQuery
          ? "Update your custom query settings"
          : "Create a custom query for targeted analysis"}
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4 py-4">
      <div class="space-y-2">
        <Label for="query-text">
          Query Text *
          <span class="text-xs text-muted-foreground ml-2">
            ({formQueryText.length}/500)
          </span>
        </Label>
        <Textarea
          id="query-text"
          bind:value={formQueryText}
          placeholder="e.g., best deployment platform for Next.js"
          rows={3}
          maxlength={500}
          required
        />
        {#if formQueryText.length > 300}
          <p class="text-xs text-yellow-600">
            ⚠️ Queries over 300 characters may produce less accurate results
          </p>
        {/if}
      </div>

      <div class="space-y-2">
        <Label for="query-key">Query Type</Label>
        <Select.Root type="single" bind:value={formQueryKey}>
          <Select.Trigger id="query-key">
            {queryKeyLabel}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="geo_audit" label="Geo Audit"
              >Geo Audit</Select.Item
            >
            <Select.Item value="pricing_scan" label="Pricing Scan"
              >Pricing Scan</Select.Item
            >
            <Select.Item value="brand_mentions" label="Brand Mentions"
              >Brand Mentions</Select.Item
            >
            <Select.Item
              value="competitor_analysis"
              label="Competitor Analysis"
            >
              Competitor Analysis
            </Select.Item>
            <Select.Item value="custom" label="Custom">Custom</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="topic">Topic (Optional)</Label>
          <Input
            id="topic"
            bind:value={formTopic}
            placeholder="e.g., Deployment"
          />
        </div>

        <div class="space-y-2">
          <Label for="location">Location (Optional)</Label>
          <Input
            id="location"
            bind:value={formLocation}
            placeholder="e.g., United States"
          />
        </div>
      </div>

      <div class="space-y-2">
        <Label for="tag-input">Tags (Optional)</Label>
        <div class="flex gap-2">
          <Input
            id="tag-input"
            placeholder="Add a tag and press Enter"
            onkeydown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <Button type="button" variant="outline" onclick={addTag}>Add</Button>
        </div>
        {#if formTags.length > 0}
          <div class="flex gap-2 flex-wrap mt-2">
            {#each formTags as tag}
              <Badge
                variant="secondary"
                class="cursor-pointer"
                onclick={() => removeTag(tag)}
              >
                {tag}
                <span class="ml-1">×</span>
              </Badge>
            {/each}
          </div>
        {/if}
      </div>

      <div class="flex items-center space-x-2">
        <Switch id="is-active" bind:checked={formIsActive} />
        <Label for="is-active" class="cursor-pointer">
          Active (inactive queries are ignored in analysis)
        </Label>
      </div>
    </div>

    <Dialog.Footer>
      <Button
        variant="outline"
        onclick={() => ((showAddDialog = false), (showEditDialog = false))}
        disabled={isSaving}
      >
        Cancel
      </Button>
      <Button onclick={handleSave} disabled={isSaving || !formQueryText.trim()}>
        {isSaving
          ? "Saving..."
          : editingQuery
            ? "Update Query"
            : "Create Query"}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<Dialog.Root
  open={showDeleteDialog}
  onOpenChange={(open) =>
    !open && ((showDeleteDialog = false), (deletingQuery = null))}
>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Delete Query</Dialog.Title>
      <Dialog.Description>
        Deleting a query permanently removes it from this project's analysis
        history. This action cannot be undone.
      </Dialog.Description>
    </Dialog.Header>

    {#if deletingQuery}
      <div class="py-4">
        <p class="text-sm font-medium mb-2">Query to delete:</p>
        <p class="text-sm text-muted-foreground bg-muted p-3 rounded-md">
          {deletingQuery.query_text}
        </p>
      </div>
    {/if}

    <Dialog.Footer>
      <Button
        variant="outline"
        onclick={() => ((showDeleteDialog = false), (deletingQuery = null))}
        disabled={isSaving}
      >
        Cancel
      </Button>
      <Button variant="destructive" onclick={handleDelete} disabled={isSaving}>
        {isSaving ? "Deleting..." : "Delete Query"}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
