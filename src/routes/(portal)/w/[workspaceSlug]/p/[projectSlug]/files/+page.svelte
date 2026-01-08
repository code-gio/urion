<script lang="ts">
  import type { Media } from "$lib/types/media";
  import { invalidateAll, goto } from "$app/navigation";
  import { toast } from "svelte-sonner";
  import {
    MediaBreadcrumbs,
    MediaToolbar,
    MediaGrid,
    CreateFolderDialog,
    UploadDialog,
    MoveDialog,
  } from "$lib/modules/project/components/media";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";

  let { data } = $props();

  // State
  let folderStack = $state<Media[]>([]);
  let isCreateFolderOpen = $state(false);
  let isUploadOpen = $state(false);
  let isCreatingFolder = $state(false);
  let isUploading = $state(false);
  let viewMode = $state<"grid" | "list">("grid");
  let itemToDelete = $state<Media | null>(null);
  let isNavigating = $state(false);
  let itemToMove = $state<Media | null>(null);
  let isMoveDialogOpen = $state(false);

  // Derived
  const currentFolderId = $derived(folderStack.at(-1)?.id ?? null);
  const items = $derived(data.items || []);
  const isLoading = $derived(isNavigating);

  // Get all folders excluding the item being moved and its descendants
  const availableFolders = $derived(
    !itemToMove
      ? []
      : (() => {
          const moving = itemToMove;
          return items.filter((item) => {
            // Must be a folder
            if (item.type !== "folder") return false;

            // Can't move into itself
            if (item.id === moving.id) return false;

            // Can't move into current parent (already there)
            if (item.id === moving.parent_id) return false;

            // If moving a folder, can't move into its descendants
            if (moving.type === "folder") {
              return !item.path.startsWith(moving.path + "/");
            }

            return true;
          });
        })()
  );

  // Build folder stack from URL on mount
  $effect(() => {
    // This effect would need to reconstruct the folder stack
    // from the current URL folderId if needed
    // For now, we'll keep it simple and just use the current folder
  });

  async function handleFolderOpen(folder: Media) {
    isNavigating = true;
    folderStack = [...folderStack, folder];
    await goto(`?folderId=${folder.id}`, { keepFocus: true, noScroll: true });
    // Small delay to ensure data is loaded
    setTimeout(() => {
      isNavigating = false;
    }, 300);
  }

  async function handleBreadcrumbNavigate(index: number | null) {
    isNavigating = true;
    if (index === null) {
      folderStack = [];
      await goto("?", { keepFocus: true, noScroll: true });
    } else {
      folderStack = folderStack.slice(0, index + 1);
      const targetId = folderStack.at(-1)?.id;
      await goto(`?folderId=${targetId}`, { keepFocus: true, noScroll: true });
    }
    // Small delay to ensure data is loaded
    setTimeout(() => {
      isNavigating = false;
    }, 300);
  }

  async function handleCreateFolder(name: string) {
    isCreatingFolder = true;
    try {
      const formData = new FormData();
      formData.append("name", name);
      if (currentFolderId) {
        formData.append("parentId", currentFolderId);
      }

      const response = await fetch("?/createFolder", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.type === "success") {
        toast.success("Folder created successfully");
        await invalidateAll();
      } else {
        throw new Error(result.data?.error || "Failed to create folder");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create folder"
      );
      throw error;
    } finally {
      isCreatingFolder = false;
    }
  }

  async function handleUpload(files: File[]) {
    isUploading = true;
    let successCount = 0;
    let failCount = 0;

    try {
      const uploadPromises = files.map(async (file) => {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("workspaceId", data.workspace.id);
          formData.append("projectId", data.project.id);
          if (currentFolderId) {
            formData.append("parentId", currentFolderId);
          }

          const response = await fetch("/api/media/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Upload failed");
          }

          const result = await response.json();
          successCount++;
          return result;
        } catch (err) {
          failCount++;
          console.error(`Failed to upload ${file.name}:`, err);
          return null;
        }
      });

      await Promise.all(uploadPromises);

      // Show results
      if (successCount > 0) {
        toast.success(
          `${successCount} file${successCount > 1 ? "s" : ""} uploaded successfully`
        );
        await invalidateAll();
      }

      if (failCount > 0) {
        toast.error(
          `${failCount} file${failCount > 1 ? "s" : ""} failed to upload`
        );
      }
    } catch (error) {
      toast.error("Upload process failed");
      console.error("Upload error:", error);
      throw error;
    } finally {
      isUploading = false;
    }
  }

  async function handleDeleteMedia(item: Media) {
    itemToDelete = item;
  }

  async function handleRequestMove(item: Media) {
    itemToMove = item;
    isMoveDialogOpen = true;
  }

  async function handleMoveMedia(targetFolderId: string | null) {
    if (!itemToMove) return;

    try {
      const formData = new FormData();
      formData.append("mediaId", itemToMove.id);
      if (targetFolderId) {
        formData.append("newParentId", targetFolderId);
      }

      const response = await fetch("?/moveMedia", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.type === "success") {
        toast.success("Item moved successfully");
        await invalidateAll();
        itemToMove = null;
      } else {
        throw new Error(result.data?.error || "Failed to move item");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to move item");
    }
  }

  // Drag & drop handler (mantener para drag & drop directo)
  async function handleDragDropMove(itemId: string, targetFolderId: string | null) {
    const loadingToast = toast.loading("Moving item...");
    
    try {
      const formData = new FormData();
      formData.append("mediaId", itemId);
      if (targetFolderId) {
        formData.append("newParentId", targetFolderId);
      }

      const response = await fetch("?/moveMedia", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      toast.dismiss(loadingToast);

      if (result.type === "success") {
        toast.success("Item moved successfully");
        await invalidateAll();
      } else {
        throw new Error(result.data?.error || "Failed to move item");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error instanceof Error ? error.message : "Failed to move item");
    }
  }

  async function confirmDelete() {
    if (!itemToDelete) return;

    try {
      const formData = new FormData();
      formData.append("mediaId", itemToDelete.id);

      const response = await fetch("?/deleteMedia", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.type === "success") {
        toast.success(
          `${itemToDelete.type === "folder" ? "Folder" : "File"} deleted successfully`
        );
        await invalidateAll();
      } else {
        throw new Error(result.data?.error || "Failed to delete");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    } finally {
      itemToDelete = null;
    }
  }
</script>

<div class="container mx-auto py-8 px-4">
  <div class="space-y-6">
    <!-- Header -->
    <div class="space-y-1">
      <h1 class="text-3xl font-bold">Project Files</h1>
      <p class="text-muted-foreground">
        Upload and organize files for {data.project.name}
      </p>
    </div>

    <!-- Toolbar -->
    <MediaToolbar
      {viewMode}
      onCreateFolder={() => (isCreateFolderOpen = true)}
      onUpload={() => (isUploadOpen = true)}
      onViewModeChange={(mode) => (viewMode = mode)}
    />

    <!-- Breadcrumbs -->
    <MediaBreadcrumbs
      folders={folderStack}
      onNavigate={handleBreadcrumbNavigate}
    />

    <!-- Media Grid -->
    <MediaGrid
      {items}
      isLoading={isLoading}
      {viewMode}
      onItemOpen={handleFolderOpen}
      onItemDelete={handleDeleteMedia}
      onItemMove={handleDragDropMove}
      onItemRequestMove={handleRequestMove}
      onUpload={() => (isUploadOpen = true)}
      onCreateFolder={() => (isCreateFolderOpen = true)}
    />
  </div>
</div>

<!-- Create Folder Dialog -->
<CreateFolderDialog
  open={isCreateFolderOpen}
  onOpenChange={(open) => (isCreateFolderOpen = open)}
  onSubmit={handleCreateFolder}
  isSubmitting={isCreatingFolder}
/>

<!-- Upload Dialog -->
<UploadDialog
  open={isUploadOpen}
  onOpenChange={(open) => (isUploadOpen = open)}
  onSubmit={handleUpload}
  {isUploading}
  maxFileSize={100 * 1024 * 1024}
/>

<!-- Move Dialog -->
<MoveDialog
  open={isMoveDialogOpen}
  item={itemToMove}
  availableFolders={availableFolders}
  onOpenChange={(open) => {
    isMoveDialogOpen = open;
    if (!open) itemToMove = null;
  }}
  onMove={handleMoveMedia}
/>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root
  open={itemToDelete !== null}
  onOpenChange={(open) => !open && (itemToDelete = null)}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Are you sure?</AlertDialog.Title>
      <AlertDialog.Description>
        {#if itemToDelete?.type === "folder"}
          This will permanently delete the folder "{itemToDelete?.name}" and all
          its contents. This action cannot be undone.
        {:else}
          This will permanently delete "{itemToDelete?.name}". This action
          cannot be undone.
        {/if}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action onclick={confirmDelete}>Delete</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

