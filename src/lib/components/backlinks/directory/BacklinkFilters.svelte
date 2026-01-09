<script lang="ts">
  import type {
    GetBacklinkSitesParams,
    BacklinkCategory,
    LinkType,
    Difficulty,
    CostType,
  } from "$lib/types";
  import { Button } from "$lib/components/ui/button";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { Label } from "$lib/components/ui/label";
  import {
    BACKLINK_CATEGORIES,
    LINK_TYPES,
    DIFFICULTY_LEVELS,
    COST_TYPES,
  } from "$lib/types/backlinks";
  import XIcon from "@lucide/svelte/icons/x";

  let {
    filters,
    onChange,
    onReset,
  }: {
    filters: GetBacklinkSitesParams;
    onChange: (filters: GetBacklinkSitesParams) => void;
    onReset: () => void;
  } = $props();

  let minDr = $state(0);
  let maxDr = $state(100);
  let categoryValue = $state("");
  let linkTypes = $state<string[]>([]);
  let costs = $state<string[]>([]);
  let difficulties = $state<string[]>([]);

  // Sync values when filters change (only from parent, not from local changes)
  let isInternalUpdate = false;

  $effect(() => {
    if (isInternalUpdate) {
      isInternalUpdate = false;
      return;
    }
    categoryValue = Array.isArray(filters.category)
      ? filters.category[0] || ""
      : filters.category || "";
    linkTypes = Array.isArray(filters.link_type)
      ? filters.link_type
      : filters.link_type
        ? [filters.link_type]
        : [];
    costs = Array.isArray(filters.cost)
      ? filters.cost
      : filters.cost
        ? [filters.cost]
        : [];
    difficulties = Array.isArray(filters.difficulty)
      ? filters.difficulty
      : filters.difficulty
        ? [filters.difficulty]
        : [];
    minDr = filters.min_dr || 0;
    maxDr = filters.max_dr || 100;
  });

  // Watch for category value changes and update filter
  $effect(() => {
    if (isInternalUpdate) return;
    const currentFilterValue = Array.isArray(filters.category)
      ? filters.category[0] || ""
      : filters.category || "";
    if (categoryValue !== currentFilterValue) {
      updateFilter("category", categoryValue || undefined);
    }
  });

  function updateFilter(key: keyof GetBacklinkSitesParams, value: any) {
    isInternalUpdate = true;
    onChange({ ...filters, [key]: value });
  }

  const categoryLabel = $derived(
    categoryValue
      ? BACKLINK_CATEGORIES[categoryValue as BacklinkCategory]?.label ||
          "All categories"
      : "All categories"
  );

  function toggleArrayFilter(
    key: "link_type" | "cost" | "difficulty",
    value: string,
    checked: boolean
  ) {
    const currentArray =
      key === "link_type"
        ? linkTypes
        : key === "cost"
          ? costs
          : difficulties;
    const newArray = checked
      ? [...currentArray, value]
      : currentArray.filter((v) => v !== value);

    if (key === "link_type") {
      linkTypes = newArray;
      updateFilter(
        key,
        newArray.length > 0
          ? newArray.length === 1
            ? newArray[0]
            : newArray
          : undefined
      );
    } else if (key === "cost") {
      costs = newArray;
      updateFilter(
        key,
        newArray.length > 0
          ? newArray.length === 1
            ? newArray[0]
            : newArray
          : undefined
      );
    } else {
      difficulties = newArray;
      updateFilter(
        key,
        newArray.length > 0
          ? newArray.length === 1
            ? newArray[0]
            : newArray
          : undefined
      );
    }
  }

  function hasActiveFilters() {
    return !!(
      filters.category ||
      (Array.isArray(filters.link_type)
        ? filters.link_type.length > 0
        : filters.link_type) ||
      (Array.isArray(filters.cost)
        ? filters.cost.length > 0
        : filters.cost) ||
      (Array.isArray(filters.difficulty)
        ? filters.difficulty.length > 0
        : filters.difficulty) ||
      (filters.min_dr && filters.min_dr > 0) ||
      (filters.max_dr && filters.max_dr < 100)
    );
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    {#if hasActiveFilters()}
      <Button variant="ghost" size="sm" onclick={onReset} class="h-7 text-xs">
        <XIcon class="size-3 mr-1" />
        Clear
      </Button>
    {/if}
  </div>

  <div class="space-y-4">
    <h3 class="text-sm font-semibold">Filters</h3>

    <!-- Category -->
    <div class="space-y-2">
      <label for="category-select" class="text-xs font-medium">Category</label>
      <Select.Root type="single" bind:value={categoryValue}>
        <Select.Trigger id="category-select" class="h-9 w-full">
          {categoryLabel}
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="" label="All categories"
            >All categories</Select.Item
          >
          {#each Object.entries(BACKLINK_CATEGORIES) as [key, { label }]}
            <Select.Item value={key} {label}>{label}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>

    <!-- Link Type (Checkboxes) -->
    <div class="space-y-2">
      <Label class="text-xs font-medium">Link Type</Label>
      <div class="space-y-2">
        {#each Object.entries(LINK_TYPES) as [key, { label }]}
          <div class="flex items-center space-x-2">
            <Checkbox
              id={`link-type-${key}`}
              checked={linkTypes.includes(key)}
              onCheckedChange={(checked) => {
                if (checked) {
                  linkTypes = [...linkTypes, key];
                } else {
                  linkTypes = linkTypes.filter((v) => v !== key);
                }
                updateFilter(
                  "link_type",
                  linkTypes.length > 0
                    ? linkTypes.length === 1
                      ? linkTypes[0]
                      : linkTypes
                    : undefined
                );
              }}
            />
            <Label
              for={`link-type-${key}`}
              class="text-xs font-normal cursor-pointer"
            >
              {label}
            </Label>
          </div>
        {/each}
      </div>
    </div>

    <!-- Cost (Checkboxes) -->
    <div class="space-y-2">
      <Label class="text-xs font-medium">Cost</Label>
      <div class="space-y-2">
        {#each Object.entries(COST_TYPES) as [key, { label }]}
          <div class="flex items-center space-x-2">
            <Checkbox
              id={`cost-${key}`}
              checked={costs.includes(key)}
              onCheckedChange={(checked) => {
                if (checked) {
                  costs = [...costs, key];
                } else {
                  costs = costs.filter((v) => v !== key);
                }
                updateFilter(
                  "cost",
                  costs.length > 0
                    ? costs.length === 1
                      ? costs[0]
                      : costs
                    : undefined
                );
              }}
            />
            <Label
              for={`cost-${key}`}
              class="text-xs font-normal cursor-pointer"
            >
              {label}
            </Label>
          </div>
        {/each}
      </div>
    </div>

    <!-- Difficulty (Checkboxes) -->
    <div class="space-y-2">
      <Label class="text-xs font-medium">Difficulty</Label>
      <div class="space-y-2">
        {#each Object.entries(DIFFICULTY_LEVELS) as [key, { label }]}
          <div class="flex items-center space-x-2">
            <Checkbox
              id={`difficulty-${key}`}
              checked={difficulties.includes(key)}
              onCheckedChange={(checked) => {
                if (checked) {
                  difficulties = [...difficulties, key];
                } else {
                  difficulties = difficulties.filter((v) => v !== key);
                }
                updateFilter(
                  "difficulty",
                  difficulties.length > 0
                    ? difficulties.length === 1
                      ? difficulties[0]
                      : difficulties
                    : undefined
                );
              }}
            />
            <Label
              for={`difficulty-${key}`}
              class="text-xs font-normal cursor-pointer"
            >
              {label}
            </Label>
          </div>
        {/each}
      </div>
    </div>

    <!-- DR Range -->
    <div class="space-y-2">
      <label for="dr-min-input" class="text-xs font-medium">DR Range</label>
      <div class="flex items-center gap-2">
        <input
          id="dr-min-input"
          type="number"
          min="0"
          max="100"
          bind:value={minDr}
          oninput={(e) => {
            const val = parseInt((e.target as HTMLInputElement).value);
            minDr = isNaN(val) ? 0 : Math.max(0, Math.min(100, val));
            updateFilter("min_dr", minDr > 0 ? minDr : undefined);
          }}
          class="h-9 w-20 rounded-md border border-input bg-background px-2 text-xs"
          placeholder="Min"
        />
        <span class="text-xs text-muted-foreground">-</span>
        <input
          type="number"
          min="0"
          max="100"
          bind:value={maxDr}
          oninput={(e) => {
            const val = parseInt((e.target as HTMLInputElement).value);
            maxDr = isNaN(val) ? 100 : Math.max(0, Math.min(100, val));
            updateFilter("max_dr", maxDr < 100 ? maxDr : undefined);
          }}
          class="h-9 w-20 rounded-md border border-input bg-background px-2 text-xs"
          placeholder="Max"
        />
      </div>
    </div>
  </div>
</div>
