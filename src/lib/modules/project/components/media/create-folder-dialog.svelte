<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";

  interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (name: string) => Promise<void>;
    isSubmitting?: boolean;
  }

  let { open, onOpenChange, onSubmit, isSubmitting = false }: Props = $props();

  let folderName = $state("");
  let error = $state<string | null>(null);

  function resetForm() {
    folderName = "";
    error = null;
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const trimmed = folderName.trim();

    if (!trimmed) {
      error = "Folder name is required";
      return;
    }

    try {
      error = null;
      await onSubmit(trimmed);
      resetForm();
      onOpenChange(false);
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to create folder";
    }
  }

  $effect(() => {
    if (open) {
      resetForm();
    }
  });
</script>

<Dialog.Root {open} {onOpenChange}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>Create Folder</Dialog.Title>
      <Dialog.Description
        >Organize your media by creating nested folders.</Dialog.Description
      >
    </Dialog.Header>
    <form class="space-y-4" onsubmit={handleSubmit}>
      <div class="space-y-2">
        <Label for="folder-name">Folder name</Label>
        <Input
          id="folder-name"
          placeholder="e.g. Campaign Assets"
          bind:value={folderName}
          autocomplete="off"
          disabled={isSubmitting}
        />
        {#if error}
          <p class="text-xs text-destructive">{error}</p>
        {/if}
      </div>
      <Dialog.Footer>
        <div class="flex w-full justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onclick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </div>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

