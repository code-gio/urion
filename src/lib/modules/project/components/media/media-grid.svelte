<script lang="ts">
  import type { Media } from "$lib/types/media";
  import MediaItem from "./media-item.svelte";
  import { Card, CardContent } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { IconUpload, IconFolderPlus } from "@tabler/icons-svelte";

  interface Props {
    items: Media[];
    isLoading: boolean;
    viewMode?: "grid" | "list";
    onItemOpen?: (item: Media) => void;
    onItemDelete?: (item: Media) => void;
    onItemMove?: (itemId: string, targetFolderId: string | null) => void;
    onItemRequestMove?: (item: Media) => void;
    onUpload?: () => void;
    onCreateFolder?: () => void;
    selectable?: boolean;
  }

  let {
    items,
    isLoading,
    viewMode = "grid",
    onItemOpen,
    onItemDelete,
    onItemMove,
    onItemRequestMove,
    onUpload,
    onCreateFolder,
    selectable = false,
  }: Props = $props();

  // Sort: folders first, then files, both alphabetically
  const sortedItems = $derived(
    [...items].sort((a, b) => {
      // Folders before files
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      // Alphabetically within each type
      return a.name.localeCompare(b.name);
    })
  );
</script>

{#if isLoading}
  <Card>
    <CardContent class="flex items-center justify-center py-12">
      <div class="text-center">
        <div
          class="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
        ></div>
        <p class="text-muted-foreground">Loading media...</p>
      </div>
    </CardContent>
  </Card>
{:else if items.length === 0}
  <Card>
    <CardContent class="flex items-center justify-center py-16">
      <div class="text-center max-w-md">
        <div class="mb-4">
          <IconUpload
            class="h-16 w-16 mx-auto text-muted-foreground opacity-50"
          />
        </div>
        <h3 class="text-lg font-semibold mb-2">No media files yet</h3>
        <p class="text-sm text-muted-foreground mb-6">
          Get started by uploading your first file or creating a folder to
          organize your media.
        </p>
        <div class="flex gap-3 justify-center">
          {#if onUpload}
            <Button onclick={onUpload} variant="default">
              <IconUpload class="mr-2 h-4 w-4" />
              Upload Files
            </Button>
          {/if}
          {#if onCreateFolder}
            <Button onclick={onCreateFolder} variant="outline">
              <IconFolderPlus class="mr-2 h-4 w-4" />
              Create Folder
            </Button>
          {/if}
        </div>
      </div>
    </CardContent>
  </Card>
{:else if viewMode === "grid"}
  <!-- Grid View -->
  <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
    {#each sortedItems as item (item.id)}
      <MediaItem
        {item}
        onOpen={onItemOpen}
        onDelete={onItemDelete}
        onMove={onItemMove}
        onRequestMove={onItemRequestMove}
        {selectable}
        {viewMode}
      />
    {/each}
  </div>
{:else}
  <!-- List View -->
  <div class="space-y-1">
    {#each sortedItems as item (item.id)}
      <MediaItem
        {item}
        onOpen={onItemOpen}
        onDelete={onItemDelete}
        onMove={onItemMove}
        onRequestMove={onItemRequestMove}
        {selectable}
        {viewMode}
      />
    {/each}
  </div>
{/if}

