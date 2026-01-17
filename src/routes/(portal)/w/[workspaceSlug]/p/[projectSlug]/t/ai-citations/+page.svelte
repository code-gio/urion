<script lang="ts">
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import {
    DashboardTab,
    QueriesTab,
    SentimentTab,
    SourcesTab,
    SettingsTab,
  } from "$lib/modules/project/ai-citations";
  import { CompetitorsSection } from "$lib/modules/settings/components";
  import { page } from "$app/state";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";
  import SearchIcon from "@lucide/svelte/icons/search";
  import UsersIcon from "@lucide/svelte/icons/users";
  import SmileIcon from "@lucide/svelte/icons/smile";
  import BookOpenIcon from "@lucide/svelte/icons/book-open";
  import SettingsIcon from "@lucide/svelte/icons/settings";

  type AICitationsTab =
    | "dashboard"
    | "queries"
    | "competitors"
    | "sentiment"
    | "sources"
    | "settings";

  let { data }: { data: any } = $props();

  let activeTab = $state<AICitationsTab>("dashboard");
  let selectedPlatform = $state("all");
  let selectedTimeframe = $state("7d");

  // Lazy loading state for competitors
  let competitorsData = $state<any>(null);
  let loadingCompetitors = $state(false);

  const platformLabel = $derived(
    selectedPlatform === "all"
      ? "All Platforms"
      : selectedPlatform === "chatgpt"
        ? "ChatGPT"
        : selectedPlatform === "claude"
          ? "Claude"
          : selectedPlatform === "gemini"
            ? "Gemini"
            : "Perplexity"
  );

  const timeframeLabel = $derived(
    selectedTimeframe === "7d"
      ? "Last 7 days"
      : selectedTimeframe === "30d"
        ? "Last 30 days"
        : "Last 90 days"
  );

  $effect(() => {
    if (browser) {
      const hash = page.url.hash.replace("#", "");
      const validTabs: AICitationsTab[] = [
        "dashboard",
        "queries",
        "competitors",
        "sentiment",
        "sources",
        "settings",
      ];
      if (hash && validTabs.includes(hash as AICitationsTab)) {
        activeTab = hash as AICitationsTab;
      }
    }
  });

  function handleTabChange(value: string) {
    activeTab = value as AICitationsTab;
    if (browser) {
      window.location.hash = value;
    }
  }

  const tabs: Array<{
    id: AICitationsTab;
    label: string;
    icon: typeof LayoutDashboardIcon;
  }> = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
    { id: "queries", label: "Queries", icon: SearchIcon },
    { id: "competitors", label: "Competitors", icon: UsersIcon },
    { id: "sentiment", label: "Sentiment", icon: SmileIcon },
    { id: "sources", label: "Sources", icon: BookOpenIcon },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  // Lazy load competitors data
  async function loadCompetitorsData() {
    if (loadingCompetitors || competitorsData) return;

    loadingCompetitors = true;
    try {
      const baseUrl = `/api/workspaces/${data.workspace.id}/projects/${data.project.id}`;
      const res = await fetch(`${baseUrl}/competitors`);
      if (!res.ok) throw new Error("Failed to load competitors");
      competitorsData = { competitors: await res.json() };
    } catch (error) {
      console.error("Error loading competitors:", error);
    } finally {
      loadingCompetitors = false;
    }
  }

  // Load data when competitors tab becomes active
  $effect(() => {
    if (browser && activeTab === "competitors") {
      loadCompetitorsData();
    }
  });

  // Initialize if competitors tab is active on mount
  onMount(() => {
    if (browser && activeTab === "competitors") {
      loadCompetitorsData();
    }
  });
</script>

<div class="container mx-auto p-6 space-y-6">
  <!-- Header with filters -->
  <div
    class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
  >
    <div>
      <h1 class="text-3xl font-bold tracking-tight">AI Citations</h1>
      <p class="text-muted-foreground mt-1">
        Track your brand visibility across AI platforms
      </p>
    </div>
    {#if activeTab === "dashboard"}
      <div class="flex gap-2">
        <Select.Root type="single" bind:value={selectedPlatform}>
          <Select.Trigger class="w-[180px]">
            {platformLabel}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all" label="All Platforms"
              >All Platforms</Select.Item
            >
            <Select.Item value="chatgpt" label="ChatGPT">ChatGPT</Select.Item>
            <Select.Item value="claude" label="Claude">Claude</Select.Item>
            <Select.Item value="gemini" label="Gemini">Gemini</Select.Item>
            <Select.Item value="perplexity" label="Perplexity"
              >Perplexity</Select.Item
            >
          </Select.Content>
        </Select.Root>
        <Select.Root type="single" bind:value={selectedTimeframe}>
          <Select.Trigger class="w-[160px]">
            {timeframeLabel}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="7d" label="Last 7 days">Last 7 days</Select.Item
            >
            <Select.Item value="30d" label="Last 30 days"
              >Last 30 days</Select.Item
            >
            <Select.Item value="90d" label="Last 90 days"
              >Last 90 days</Select.Item
            >
          </Select.Content>
        </Select.Root>
      </div>
    {/if}
  </div>

  <!-- Tabs -->
  <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
    <Tabs.List class="w-full border-b">
      {#each tabs as tab}
        {@const TabIcon = tab.icon}
        <Tabs.Trigger value={tab.id}>
          <TabIcon class="h-4 w-4" />
          {tab.label}
        </Tabs.Trigger>
      {/each}
    </Tabs.List>

    <Tabs.Content value="dashboard" class="mt-6">
      <DashboardTab bind:selectedPlatform bind:selectedTimeframe />
    </Tabs.Content>

    <Tabs.Content value="queries" class="mt-6">
      <QueriesTab
        queries={data.queries}
        canEdit={data.canEdit}
        workspaceId={data.workspace.id}
        projectId={data.project.id}
      />
    </Tabs.Content>

    <Tabs.Content value="competitors" class="mt-6">
      {#if loadingCompetitors}
        <div class="flex items-center justify-center py-12">
          <p class="text-muted-foreground">Loading competitors...</p>
        </div>
      {:else if competitorsData}
        <CompetitorsSection
          workspace={data.workspace}
          project={data.project}
          competitors={competitorsData.competitors}
          canEdit={data.canEdit}
        />
      {:else}
        <div class="flex items-center justify-center py-12">
          <p class="text-muted-foreground">Click to load competitors</p>
        </div>
      {/if}
    </Tabs.Content>

    <Tabs.Content value="sentiment" class="mt-6">
      <SentimentTab />
    </Tabs.Content>

    <Tabs.Content value="sources" class="mt-6">
      <SourcesTab />
    </Tabs.Content>

    <Tabs.Content value="settings" class="mt-6">
      <SettingsTab />
    </Tabs.Content>
  </Tabs.Root>
</div>
