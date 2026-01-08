<script lang="ts">
  import type { Media } from "$lib/types/media";

  interface Props {
    folders: Media[];
    onNavigate: (index: number | null) => void;
  }

  let { folders, onNavigate }: Props = $props();
</script>

{#if folders.length > 0}
  <div class="flex items-center gap-2 text-sm">
    <button
      onclick={() => onNavigate(null)}
      class="hover:underline text-muted-foreground transition-colors"
    >
      Home
    </button>
    {#each folders as folder, index}
      <span class="text-muted-foreground">/</span>
      <button
        onclick={() => onNavigate(index)}
        class="hover:underline transition-colors {index < folders.length - 1
          ? 'text-muted-foreground'
          : 'text-foreground'}"
      >
        {folder.name}
      </button>
    {/each}
  </div>
{/if}
