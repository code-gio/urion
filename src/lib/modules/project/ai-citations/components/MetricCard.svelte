<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";

  let {
    title,
    value,
    subtitle,
    change,
    changeType = "neutral",
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    change?: string;
    changeType?: "positive" | "negative" | "neutral";
  } = $props();

  const changeColorClass = $derived(
    changeType === "positive"
      ? "text-green-600"
      : changeType === "negative"
        ? "text-red-600"
        : "text-muted-foreground"
  );
</script>

<Card.Root>
  <Card.Content class="pt-6">
    <div class="space-y-2">
      <p class="text-sm font-medium text-muted-foreground">{title}</p>
      <div class="flex items-baseline gap-2">
        <h3 class="text-3xl font-bold tracking-tight">{value}</h3>
        {#if change}
          <span class="text-sm font-medium {changeColorClass}">
            {change}
          </span>
        {/if}
      </div>
      {#if subtitle}
        <p class="text-xs text-muted-foreground">{subtitle}</p>
      {/if}
    </div>
  </Card.Content>
</Card.Root>
