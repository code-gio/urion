<script lang="ts">
  import type { Media } from "$lib/types/media";
  import {
    IconFolder,
    IconFile,
    IconTrash,
    IconFileTypePdf,
    IconFileTypeDoc,
    IconFileZip,
    IconVideo,
    IconMusic,
    IconPhoto,
    IconDotsVertical,
    IconFolderOpen,
  } from "@tabler/icons-svelte";
  import { formatFileSize } from "$lib/utils/media";
  import { Button } from "$lib/components/ui/button";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";

  interface Props {
    item: Media;
    onOpen?: (item: Media) => void;
    onDelete?: (item: Media) => void;
    onMove?: (itemId: string, targetFolderId: string | null) => void;
    onRequestMove?: (item: Media) => void; // Nueva prop para abrir el diálogo
    selectable?: boolean;
    viewMode?: "grid" | "list";
  }

  let {
    item,
    onOpen,
    onDelete,
    onMove,
    onRequestMove,
    selectable = false,
    viewMode = "grid",
  }: Props = $props();

  let isDragging = $state(false);
  let isDropTarget = $state(false);

  function handleClick() {
    if (item.type === "folder" && onOpen) {
      onOpen(item);
    } else if (selectable && onOpen) {
      onOpen(item);
    }
  }

  function handleDelete(e: MouseEvent) {
    e.stopPropagation();
    if (onDelete) {
      onDelete(item);
    }
  }

  function handleRequestMove(e: MouseEvent) {
    e.stopPropagation();
    if (onRequestMove) {
      onRequestMove(item);
    }
  }

  function handleDragStart(e: DragEvent) {
    if (!e.dataTransfer) return;
    isDragging = true;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify(item));
  }

  function handleDragEnd() {
    isDragging = false;
  }

  function handleDragOver(e: DragEvent) {
    // Only allow drop on folders
    if (item.type === "folder") {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move";
      }
    }
  }

  function handleDragEnter(e: DragEvent) {
    if (item.type === "folder") {
      e.preventDefault();
      isDropTarget = true;
    }
  }

  function handleDragLeave() {
    isDropTarget = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    isDropTarget = false;

    if (item.type !== "folder" || !onMove) return;

    try {
      const data = e.dataTransfer?.getData("application/json");
      if (!data) return;

      const droppedItem = JSON.parse(data) as Media;

      // Don't allow dropping into itself
      if (droppedItem.id === item.id) return;

      // Don't allow dropping a folder into its own descendants
      if (droppedItem.type === "folder" && item.path.startsWith(droppedItem.path)) {
        return;
      }

      onMove(droppedItem.id, item.id);
    } catch (err) {
      console.error("Drop error:", err);
    }
  }

  function getFileIcon(fileType: string) {
    switch (fileType) {
      case "image":
        return IconPhoto;
      case "video":
        return IconVideo;
      case "audio":
        return IconMusic;
      case "pdf":
        return IconFileTypePdf;
      case "doc":
        return IconFileTypeDoc;
      case "archive":
        return IconFileZip;
      default:
        return IconFile;
    }
  }

  const FileIcon = $derived(
    item.type === "folder" ? IconFolder : getFileIcon(item.file_type)
  );
</script>

{#if viewMode === "grid"}
  <!-- Grid View -->
  <div
    role="button"
    tabindex="0"
    draggable="true"
    ondragstart={handleDragStart}
    ondragend={handleDragEnd}
    ondragover={handleDragOver}
    ondragenter={handleDragEnter}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    class="group relative border rounded-lg overflow-hidden hover:shadow-lg transition-all bg-card {selectable
      ? 'cursor-pointer'
      : ''} {isDragging ? 'opacity-50' : ''} {isDropTarget && item.type === 'folder'
      ? 'ring-2 ring-primary bg-primary/5'
      : ''}"
  >
    <button onclick={handleClick} class="w-full text-left">
      {#if item.type === "folder"}
        <div
          class="flex flex-col items-center gap-3 p-6 hover:bg-accent transition-colors"
        >
          <IconFolder class="h-16 w-16 text-yellow-500" />
          <span class="text-sm font-medium truncate w-full text-center"
            >{item.name}</span
          >
        </div>
      {:else}
        <div
          class="aspect-square bg-muted flex items-center justify-center relative overflow-hidden"
        >
          {#if item.file_type === "image" && item.public_url}
            <img
              src={item.public_url}
              alt={item.name}
              class="w-full h-full object-cover"
            />
          {:else}
            <div class="flex flex-col items-center justify-center p-4">
              <FileIcon
                class="h-16 w-16 mb-2 {item.file_type === 'pdf'
                  ? 'text-red-500'
                  : item.file_type === 'doc'
                    ? 'text-blue-500'
                    : item.file_type === 'archive'
                      ? 'text-amber-500'
                      : item.file_type === 'video'
                        ? 'text-purple-500'
                        : item.file_type === 'audio'
                          ? 'text-green-500'
                          : 'text-muted-foreground'}"
              />
            </div>
          {/if}
        </div>
        <div class="p-3 border-t">
          <p class="text-sm font-medium truncate" title={item.name}>
            {item.name}
          </p>
          {#if item.size}
            <p class="text-xs text-muted-foreground mt-1">
              {formatFileSize(item.size)}
            </p>
          {/if}
        </div>
      {/if}
    </button>

    <!-- Options Menu -->
    {#if onDelete || onRequestMove}
      <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button
              size="icon"
              variant="ghost"
              class="h-8 w-8"
              onclick={(e) => e.stopPropagation()}
            >
              <IconDotsVertical class="h-4 w-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end" side="bottom" sideOffset={4}>
            {#if onRequestMove}
              <DropdownMenu.Item onclick={handleRequestMove}>
                <IconFolderOpen class="mr-2 h-4 w-4" />
                Move to...
              </DropdownMenu.Item>
            {/if}
            {#if onDelete}
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                onclick={handleDelete}
                class="text-destructive focus:text-destructive"
              >
                <IconTrash class="mr-2 h-4 w-4" />
                Delete
              </DropdownMenu.Item>
            {/if}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    {/if}
  </div>
{:else}
  <!-- List View -->
  <div
    role="button"
    tabindex="0"
    draggable="true"
    ondragstart={handleDragStart}
    ondragend={handleDragEnd}
    ondragover={handleDragOver}
    ondragenter={handleDragEnter}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    class="group flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors {selectable
      ? 'cursor-pointer'
      : ''} {isDragging ? 'opacity-50' : ''} {isDropTarget && item.type === 'folder'
      ? 'ring-2 ring-primary bg-primary/5'
      : ''}"
  >
    <button
      onclick={handleClick}
      class="flex items-center gap-3 flex-1 min-w-0"
    >
      {#if item.type === "folder"}
        <IconFolder class="h-8 w-8 text-yellow-500 flex-shrink-0" />
      {:else}
        {#if item.file_type === "image" && item.public_url}
          <img
            src={item.public_url}
            alt={item.name}
            class="h-8 w-8 object-cover rounded flex-shrink-0"
          />
        {:else}
          <FileIcon
            class="h-8 w-8 flex-shrink-0 {item.file_type === 'pdf'
              ? 'text-red-500'
              : item.file_type === 'doc'
                ? 'text-blue-500'
                : item.file_type === 'archive'
                  ? 'text-amber-500'
                  : item.file_type === 'video'
                    ? 'text-purple-500'
                    : item.file_type === 'audio'
                      ? 'text-green-500'
                      : 'text-muted-foreground'}"
          />
        {/if}
      {/if}

      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium truncate">{item.name}</p>
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{item.type === "folder" ? "Folder" : item.file_type}</span>
          {#if item.size}
            <span>•</span>
            <span>{formatFileSize(item.size)}</span>
          {/if}
        </div>
      </div>
    </button>

    <!-- Options Menu -->
    {#if onDelete || onRequestMove}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <Button
            size="icon"
            variant="ghost"
            class="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 flex-shrink-0"
            onclick={(e) => e.stopPropagation()}
          >
            <IconDotsVertical class="h-4 w-4" />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" side="bottom" sideOffset={4}>
          {#if onRequestMove}
            <DropdownMenu.Item onclick={handleRequestMove}>
              <IconFolderOpen class="mr-2 h-4 w-4" />
              Move to...
            </DropdownMenu.Item>
          {/if}
          {#if onDelete}
            <DropdownMenu.Separator />
            <DropdownMenu.Item
              onclick={handleDelete}
              class="text-destructive focus:text-destructive"
            >
              <IconTrash class="mr-2 h-4 w-4" />
              Delete
            </DropdownMenu.Item>
          {/if}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    {/if}
  </div>
{/if}

