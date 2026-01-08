<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import {
    IconFolderPlus,
    IconLayoutGrid,
    IconList,
    IconUpload,
  } from "@tabler/icons-svelte";

  interface Props {
    viewMode: "grid" | "list";
    onCreateFolder: () => void;
    onUpload: () => void;
    onViewModeChange: (mode: "grid" | "list") => void;
  }

  let { viewMode, onCreateFolder, onUpload, onViewModeChange }: Props =
    $props();
</script>

<div class="flex flex-wrap items-center justify-between gap-3">
  <div class="flex gap-2">
    <Button variant="outline" onclick={onCreateFolder}>
      <IconFolderPlus class="mr-2 h-4 w-4" />
      Create Folder
    </Button>
    <Button onclick={onUpload}>
      <IconUpload class="mr-2 h-4 w-4" />
      Upload Files
    </Button>
  </div>
  <div class="flex gap-2">
    <Button
      variant={viewMode === "grid" ? "default" : "outline"}
      size="icon"
      onclick={() => onViewModeChange("grid")}
      aria-label="Grid view"
    >
      <IconLayoutGrid class="h-4 w-4" />
    </Button>
    <Button
      variant={viewMode === "list" ? "default" : "outline"}
      size="icon"
      onclick={() => onViewModeChange("list")}
      aria-label="List view"
    >
      <IconList class="h-4 w-4" />
    </Button>
  </div>
</div>
