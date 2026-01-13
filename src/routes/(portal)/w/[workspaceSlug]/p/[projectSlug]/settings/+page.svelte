<script lang="ts">
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import SettingsTabsWrapper from '$lib/modules/settings/components/SettingsTabsWrapper.svelte';
	import {
		OverviewSection,
		WebsiteSection,
		BrandSection,
		SEOSection,
		CompetitorsSection,
		OfferingsSection,
		ContentRulesSection
	} from '$lib/modules/settings/components';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import PaletteIcon from '@lucide/svelte/icons/palette';
	import SearchIcon from '@lucide/svelte/icons/search';
	import UsersIcon from '@lucide/svelte/icons/users';
	import PackageIcon from '@lucide/svelte/icons/package';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import type { SettingsTab } from '$lib/types/project-settings.js';

	let { data }: { data: any } = $props();

	const workspace = $derived(data.workspace);
	const project = $derived(data.project);
	const canEdit = $derived(data.canEdit);

	// Get active tab from URL hash or default to overview
	let activeTab = $state<SettingsTab>('overview');

	$effect(() => {
		const hash = page.url.hash.replace('#', '');
		const tabMap: Record<string, SettingsTab> = {
			'overview': 'overview',
			'website': 'website',
			'brand': 'brand',
			'seo': 'seo',
			'competitors': 'competitors',
			'offerings': 'offerings',
			'content-rules': 'content_rules'
		};
		if (hash && tabMap[hash]) {
			activeTab = tabMap[hash];
		} else {
			activeTab = 'overview';
		}
	});

	// Tab configuration
	const tabs: Array<{ id: SettingsTab; label: string; icon: typeof SettingsIcon; route: string }> = [
		{ id: 'overview', label: 'Overview', icon: SettingsIcon, route: 'overview' },
		{ id: 'website', label: 'Website & Crawl', icon: GlobeIcon, route: 'website' },
		{ id: 'brand', label: 'Brand Voice', icon: PaletteIcon, route: 'brand' },
		{ id: 'seo', label: 'SEO Strategy', icon: SearchIcon, route: 'seo' },
		{ id: 'competitors', label: 'Competitors', icon: UsersIcon, route: 'competitors' },
		{ id: 'offerings', label: 'Offerings', icon: PackageIcon, route: 'offerings' },
		{ id: 'content_rules', label: 'Content Rules', icon: FileTextIcon, route: 'content-rules' }
	];

	// State for lazy-loaded data per tab
	let websiteData = $state<any>(null);
	let brandData = $state<any>(null);
	let seoData = $state<any>(null);
	let competitorsData = $state<any>(null);
	let offeringsData = $state<any>(null);
	let contentRulesData = $state<any>(null);
	let loadingStates = $state<Record<string, boolean>>({});

	// Lazy load data for each tab when activated
	async function loadTabData(tabId: SettingsTab) {
		if (loadingStates[tabId] || !workspace || !project) return;

		// Check if data already loaded
		if (
			(tabId === 'website' && websiteData) ||
			(tabId === 'brand' && brandData) ||
			(tabId === 'seo' && seoData) ||
			(tabId === 'competitors' && competitorsData) ||
			(tabId === 'offerings' && offeringsData) ||
			(tabId === 'content_rules' && contentRulesData)
		) {
			return;
		}

		loadingStates[tabId] = true;

		try {
			const baseUrl = `/api/workspaces/${workspace.id}/projects/${project.id}`;

			switch (tabId) {
				case 'website': {
					const [settingsRes, crawlSourcesRes] = await Promise.all([
						fetch(`${baseUrl}/settings`),
						fetch(`${baseUrl}/crawl-sources`)
					]);
					if (!settingsRes.ok) throw new Error('Failed to load settings');
					if (!crawlSourcesRes.ok) throw new Error('Failed to load crawl sources');
					websiteData = {
						settings: await settingsRes.json(),
						crawlSources: await crawlSourcesRes.json()
					};
					break;
				}
				case 'brand': {
					const res = await fetch(`${baseUrl}/settings`);
					if (!res.ok) throw new Error('Failed to load settings');
					brandData = { settings: await res.json() };
					break;
				}
				case 'seo': {
					const [clustersRes, keywordsRes, settingsRes] = await Promise.all([
						fetch(`${baseUrl}/topic-clusters`),
						fetch(`${baseUrl}/keywords`),
						fetch(`${baseUrl}/settings`)
					]);
					if (!clustersRes.ok) throw new Error('Failed to load topic clusters');
					if (!keywordsRes.ok) throw new Error('Failed to load keywords');
					if (!settingsRes.ok) throw new Error('Failed to load settings');
					const settings = await settingsRes.json();
					seoData = {
						clusters: await clustersRes.json(),
						keywords: await keywordsRes.json(),
						seoSettings: settings?.settings?.seo || {}
					};
					break;
				}
				case 'competitors': {
					const res = await fetch(`${baseUrl}/competitors`);
					if (!res.ok) throw new Error('Failed to load competitors');
					competitorsData = { competitors: await res.json() };
					break;
				}
				case 'offerings': {
					const res = await fetch(`${baseUrl}/offerings`);
					if (!res.ok) throw new Error('Failed to load offerings');
					offeringsData = { offerings: await res.json() };
					break;
				}
				case 'content_rules': {
					const res = await fetch(`${baseUrl}/content-rules`);
					if (!res.ok) throw new Error('Failed to load content rules');
					contentRulesData = { rules: await res.json() };
					break;
				}
				default:
					break;
			}
		} catch (error) {
			console.error(`Error loading ${tabId} data:`, error);
		} finally {
			loadingStates[tabId] = false;
		}
	}

	// Load data when tab becomes active (only on client side)
	$effect(() => {
		if (browser && activeTab && activeTab !== 'overview') {
			loadTabData(activeTab);
		}
	});

	// Initialize tab from URL hash on mount
	onMount(() => {
		if (browser && activeTab && activeTab !== 'overview') {
			loadTabData(activeTab);
		}
	});

	function handleTabChange(value: string) {
		activeTab = value as SettingsTab;
		// Update URL hash - map tab IDs to route names
		const routeMap: Partial<Record<SettingsTab, string>> = {
			'overview': 'overview',
			'website': 'website',
			'brand': 'brand',
			'seo': 'seo',
			'competitors': 'competitors',
			'offerings': 'offerings',
			'content_rules': 'content-rules'
		};
		window.location.hash = routeMap[value as SettingsTab] || value;
		loadTabData(value as SettingsTab);
	}
</script>

<SettingsTabsWrapper {canEdit}>
	<div class="flex flex-col h-full w-full">
		<Tabs.Root value={activeTab} onValueChange={handleTabChange} class="flex flex-col flex-1 w-full">
			<Tabs.List class="w-full border-b">
				{#each tabs as tab}
					{@const TabIcon = tab.icon}
					<Tabs.Trigger value={tab.id}>
						<TabIcon class="h-4 w-4 " />
						{tab.label}
					</Tabs.Trigger>
				{/each}
			</Tabs.List>

			<Tabs.Content value="overview" class="flex-1 overflow-y-auto p-6 w-full">
				<OverviewSection
					{workspace}
					{project}
					projectSettings={data.projectSettings}
					{canEdit}
				/>
			</Tabs.Content>

			<Tabs.Content value="website" class="flex-1 overflow-y-auto p-6 w-full">
				{#if loadingStates['website']}
					<div class="flex items-center justify-center py-12">
						<p class="text-muted-foreground">Loading website settings...</p>
					</div>
				{:else if websiteData}
					<WebsiteSection
						{workspace}
						{project}
						settings={websiteData.settings}
						crawlSources={websiteData.crawlSources}
						{canEdit}
					/>
				{:else}
					<div class="flex items-center justify-center py-12">
						<p class="text-muted-foreground">Click to load website settings</p>
					</div>
				{/if}
			</Tabs.Content>

			<Tabs.Content value="brand" class="flex-1 overflow-y-auto p-6 w-full">
				{#if loadingStates['brand']}
					<div class="flex items-center justify-center py-12">
						<p class="text-muted-foreground">Loading brand settings...</p>
					</div>
				{:else if brandData}
					<BrandSection
						{workspace}
						{project}
						settings={brandData.settings}
						{canEdit}
					/>
				{:else}
					<div class="flex items-center justify-center py-12">
						<p class="text-muted-foreground">Click to load brand settings</p>
					</div>
				{/if}
			</Tabs.Content>

			<Tabs.Content value="seo" class="flex-1 overflow-y-auto p-6 w-full">
				{#if loadingStates['seo']}
					<div class="flex items-center justify-center py-12">
						<p class="text-muted-foreground">Loading SEO settings...</p>
					</div>
				{:else if seoData}
					<SEOSection
						{workspace}
						{project}
						clusters={seoData.clusters}
						keywords={seoData.keywords}
						seoSettings={seoData.seoSettings}
						{canEdit}
					/>
				{:else}
					<div class="flex items-center justify-center py-12">
						<p class="text-muted-foreground">Click to load SEO settings</p>
					</div>
				{/if}
			</Tabs.Content>

			<Tabs.Content value="competitors" class="flex-1 overflow-y-auto p-6 w-full">
				{#if loadingStates['competitors']}
					<div class="flex items-center justify-center py-12">
						<p class="text-muted-foreground">Loading competitors...</p>
					</div>
				{:else if competitorsData}
					<CompetitorsSection
						{workspace}
						{project}
						competitors={competitorsData.competitors}
						{canEdit}
					/>
				{:else}
					<div class="flex items-center justify-center py-12">
						<p class="text-muted-foreground">Click to load competitors</p>
					</div>
				{/if}
			</Tabs.Content>

			<Tabs.Content value="offerings" class="flex-1 overflow-y-auto p-6 w-full">
				{#if loadingStates['offerings']}
					<div class="flex items-center justify-center py-12">
						<p class="text-muted-foreground">Loading offerings...</p>
					</div>
				{:else if offeringsData}
					<OfferingsSection
						{workspace}
						{project}
						offerings={offeringsData.offerings}
						{canEdit}
					/>
				{:else}
					<div class="flex items-center justify-center py-12">
						<p class="text-muted-foreground">Click to load offerings</p>
					</div>
				{/if}
			</Tabs.Content>

			<Tabs.Content value="content_rules" class="flex-1 overflow-y-auto p-6 w-full">
				{#if loadingStates['content_rules']}
					<div class="flex items-center justify-center py-12">
						<p class="text-muted-foreground">Loading content rules...</p>
					</div>
				{:else if contentRulesData}
					<ContentRulesSection
						{workspace}
						{project}
						rules={contentRulesData.rules}
						{canEdit}
					/>
				{:else}
					<div class="flex items-center justify-center py-12">
						<p class="text-muted-foreground">Click to load content rules</p>
					</div>
				{/if}
			</Tabs.Content>
		</Tabs.Root>
	</div>
</SettingsTabsWrapper>
