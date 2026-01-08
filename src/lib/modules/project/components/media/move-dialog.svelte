<script lang="ts">
  import type { Media } from "$lib/types/media";
  import * as Dialog from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button";
  import { IconFolder, IconHome } from "@tabler/icons-svelte";
  import { ScrollArea } from "$lib/components/ui/scroll-area";

  interface Props {
    open: boolean;
    item: Media | null;
    availableFolders: Media[];
    onOpenChange: (open: boolean) => void;
    onMove: (targetFolderId: string | null) => void;
  }

  let { open, item, availableFolders, onOpenChange, onMove }: Props = $props();

  function handleMoveToRoot() {
    onMove(null);
    onOpenChange(false);
  }

  function handleMoveToFolder(folderId: string) {
    onMove(folderId);
    onOpenChange(false);
  }
</script>

<Dialog.Root {open} {onOpenChange}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Move "{item?.name}"</Dialog.Title>
      <Dialog.Description>
        Select the destination folder for this {item?.type === "folder"
          ? "folder"
          : "file"}.
      </Dialog.Description>
    </Dialog.Header>

    <ScrollArea class="max-h-[400px] pr-4">
      <div class="space-y-1">
        <!-- Root/Principal option -->
        <Button
          variant="ghost"
          class="w-full justify-start"
          onclick={handleMoveToRoot}
        >
          <IconHome class="mr-2 h-4 w-4 text-blue-500" />
          <div class="flex flex-col items-start">
            <span class="font-medium">Root</span>
            <span class="text-xs text-muted-foreground">Main directory</span>
          </div>
        </Button>

        <!-- Available folders -->
        {#if availableFolders.length === 0}
          <div class="py-8 text-center text-sm text-muted-foreground">
            No other folders available
          </div>
        {:else}
          {#each availableFolders as folder (folder.id)}
            <Button
              variant="ghost"
              class="w-full justify-start"
              onclick={() => handleMoveToFolder(folder.id)}
            >
              <IconFolder class="mr-2 h-4 w-4 text-yellow-500" />
              <div class="flex flex-col items-start">
                <span class="font-medium">{folder.name}</span>
                <span class="text-xs text-muted-foreground">{folder.path}</span>
              </div>
            </Button>
          {/each}
        {/if}
      </div>
    </ScrollArea>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => onOpenChange(false)}>
        Cancel
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
