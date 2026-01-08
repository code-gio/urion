<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button";
  import { IconUpload, IconX } from "@tabler/icons-svelte";

  interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (files: File[]) => Promise<void>;
    isUploading?: boolean;
    maxFileSize?: number;
    maxFiles?: number;
    allowedFileTypes?: string[];
  }

  let {
    open,
    onOpenChange,
    onSubmit,
    isUploading = false,
    maxFileSize = 100 * 1024 * 1024,
    maxFiles = 5,
    allowedFileTypes = [],
  }: Props = $props();

  let selectedFiles = $state<File[]>([]);
  let isDragOver = $state(false);
  let error = $state<string | null>(null);

  function resetForm() {
    selectedFiles = [];
    error = null;
    isDragOver = false;
  }

  function handleFileInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles = Array.from(input.files);
      
      // Add new files to existing ones, up to maxFiles
      const combined = [...selectedFiles, ...newFiles];
      selectedFiles = combined.slice(0, maxFiles);
      
      if (combined.length > maxFiles) {
        error = `Maximum ${maxFiles} files allowed. Only the first ${maxFiles} were selected.`;
      } else {
        error = null;
      }
      
      // Reset input to allow selecting the same files again
      input.value = '';
    }
  }

  function removeFile(index: number) {
    selectedFiles = selectedFiles.filter((_, i) => i !== index);
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragOver = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;

    if (event.dataTransfer?.files) {
      const newFiles = Array.from(event.dataTransfer.files);
      
      // Add new files to existing ones, up to maxFiles
      const combined = [...selectedFiles, ...newFiles];
      selectedFiles = combined.slice(0, maxFiles);
      
      if (combined.length > maxFiles) {
        error = `Maximum ${maxFiles} files allowed. Only the first ${maxFiles} were selected.`;
      } else {
        error = null;
      }
    }
  }

  function validateFiles(files: File[]): { valid: boolean; error?: string } {
    if (files.length === 0) {
      return { valid: false, error: "No files selected" };
    }

    if (files.length > maxFiles) {
      return {
        valid: false,
        error: `Maximum ${maxFiles} files allowed`,
      };
    }

    for (const file of files) {
      if (file.size > maxFileSize) {
        return {
          valid: false,
          error: `File "${file.name}" exceeds maximum size of ${Math.round(maxFileSize / 1024 / 1024)}MB`,
        };
      }

      if (
        allowedFileTypes.length > 0 &&
        !allowedFileTypes.includes(file.type)
      ) {
        return {
          valid: false,
          error: `File type "${file.type}" is not allowed`,
        };
      }
    }

    return { valid: true };
  }

  async function handleSubmit() {
    const validation = validateFiles(selectedFiles);
    if (!validation.valid) {
      error = validation.error || "Validation failed";
      return;
    }

    try {
      error = null;
      await onSubmit(selectedFiles);
      resetForm();
      onOpenChange(false);
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to upload files";
    }
  }

  $effect(() => {
    if (open) {
      resetForm();
    }
  });
</script>

<Dialog.Root {open} {onOpenChange}>
  <Dialog.Content class="sm:max-w-[600px]">
    <Dialog.Header>
      <Dialog.Title>Upload Files</Dialog.Title>
      <Dialog.Description
        >Select files to upload to your media library.</Dialog.Description
      >
    </Dialog.Header>
    <div class="space-y-4">
      <div
        role="button"
        tabindex="0"
        class="border-2 border-dashed rounded-lg p-8 text-center transition-colors {isDragOver
          ? 'border-primary bg-primary/5'
          : 'border-border'}"
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={handleDrop}
      >
        <input
          type="file"
          multiple
          onchange={handleFileInputChange}
          class="hidden"
          id="file-upload-input"
          disabled={isUploading || selectedFiles.length >= maxFiles}
        />
        <label
          for="file-upload-input"
          class="cursor-pointer {selectedFiles.length >= maxFiles
            ? 'opacity-50 cursor-not-allowed'
            : ''}"
        >
          <IconUpload class="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p class="text-sm text-muted-foreground">
            {#if selectedFiles.length >= maxFiles}
              Maximum {maxFiles} files reached
            {:else}
              Drag and drop files here or click to browse
            {/if}
          </p>
          {#if maxFileSize}
            <p class="text-xs text-muted-foreground mt-2">
              Max file size: {Math.round(maxFileSize / 1024 / 1024)}MB • Max {maxFiles} files
            </p>
          {/if}
        </label>
      </div>

      {#if selectedFiles.length > 0}
        <div class="space-y-2">
          <p class="text-sm font-medium">
            Selected files ({selectedFiles.length}/{maxFiles}):
          </p>
          <div class="space-y-1 max-h-40 overflow-y-auto">
            {#each selectedFiles as file, index}
              <div
                class="flex items-center justify-between p-2 bg-muted rounded text-sm"
              >
                <span class="truncate flex-1">{file.name}</span>
                <span class="text-muted-foreground ml-2"
                  >{(file.size / 1024).toFixed(1)} KB</span
                >
                <button
                  type="button"
                  onclick={() => removeFile(index)}
                  class="ml-2 text-destructive hover:text-destructive/80"
                  disabled={isUploading}
                >
                  <IconX class="h-4 w-4" />
                </button>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if error}
        <p class="text-sm text-destructive">{error}</p>
      {/if}
    </div>
    <Dialog.Footer>
      <div class="flex w-full justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onclick={() => onOpenChange(false)}
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button
          onclick={handleSubmit}
          disabled={isUploading || selectedFiles.length === 0}
        >
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
      </div>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

