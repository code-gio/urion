<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { getContext, setContext } from 'svelte';
	import type { SettingsTab } from '$lib/types/project-settings.js';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import PaletteIcon from '@lucide/svelte/icons/palette';
	import SearchIcon from '@lucide/svelte/icons/search';
	import UsersIcon from '@lucide/svelte/icons/users';
	import PackageIcon from '@lucide/svelte/icons/package';
	import FileTextIcon from '@lucide/svelte/icons/file-text';

	let {
		canEdit = true,
		children
	}: {
		canEdit?: boolean;
		children: import('svelte').Snippet;
	} = $props();

	// Context will be set by child pages
	let onSave: (() => void | Promise<void>) | undefined = $state();
	let onCancel: (() => void) | undefined = $state();
	let isDirty = $state(false);
	let isSaving = $state(false);

	// Expose context setter for child pages
	setContext('settings-shell', {
		setActions: (actions: {
			onSave?: () => void | Promise<void>;
			onCancel?: () => void;
			isDirty?: boolean;
			isSaving?: boolean;
		}) => {
			onSave = actions.onSave;
			onCancel = actions.onCancel;
			isDirty = actions.isDirty ?? false;
			isSaving = actions.isSaving ?? false;
		}
	});

	const workspaceSlug = $derived.by(() => {
		const match = page.url.pathname.match(/^\/w\/([^/]+)/);
		return match ? match[1] : '';
	});

	const projectSlug = $derived.by(() => {
		const match = page.url.pathname.match(/^\/w\/[^/]+\/p\/([^/]+)/);
		return match ? match[1] : '';
	});

	const tabs: Array<{ id: SettingsTab; label: string; icon: typeof SettingsIcon; route: string }> = [
		{ id: 'overview', label: 'Overview', icon: SettingsIcon, route: 'overview' },
		{ id: 'website', label: 'Website & Crawl', icon: GlobeIcon, route: 'website' },
		{ id: 'brand', label: 'Brand Voice', icon: PaletteIcon, route: 'brand' },
		{ id: 'seo', label: 'SEO Strategy', icon: SearchIcon, route: 'seo' },
		{ id: 'competitors', label: 'Competitors', icon: UsersIcon, route: 'competitors' },
		{ id: 'offerings', label: 'Offerings', icon: PackageIcon, route: 'offerings' },
		{ id: 'content_rules', label: 'Content Rules', icon: FileTextIcon, route: 'content-rules' }
	];

	const activeTab = $derived.by(() => {
		const path = page.url.pathname;
		const match = path.match(/\/settings\/([^/]+)/);
		if (match) {
			const route = match[1];
			return tabs.find((t) => t.route === route)?.id || 'overview';
		}
		return 'overview';
	});

	function navigateToTab(tab: SettingsTab) {
		const tabConfig = tabs.find((t) => t.id === tab);
		if (tabConfig && workspaceSlug && projectSlug) {
			window.location.href = `/w/${workspaceSlug}/p/${projectSlug}/settings/${tabConfig.route}`;
		}
	}

	async function handleSave() {
		if (onSave) {
			await onSave();
		}
	}

	function handleCancel() {
		if (onCancel) {
			onCancel();
		}
	}
</script>

<div class="flex h-full">
	<!-- Sidebar Navigation -->
	<aside class="w-64 border-r bg-muted/40 p-4">
		<div class="mb-6">
			<h2 class="text-lg font-semibold">Settings</h2>
			<p class="text-sm text-muted-foreground">Configure your project</p>
		</div>
		<nav class="space-y-1">
			{#each tabs as tab}
				{@const TabIcon = tab.icon}
				<button
					type="button"
					class="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground {activeTab === tab.id
						? 'bg-accent text-accent-foreground'
						: 'text-muted-foreground'}"
					onclick={() => navigateToTab(tab.id)}
				>
					<TabIcon class="h-4 w-4" />
					<span>{tab.label}</span>
				</button>
			{/each}
		</nav>
	</aside>

	<!-- Main Content -->
	<div class="flex-1 flex flex-col overflow-hidden">
		<div class="flex-1 overflow-y-auto p-6">
			{@render children()}
		</div>

		<!-- Sticky Footer with Save/Cancel -->
		{#if canEdit && (isDirty || onSave)}
			<div class="border-t bg-background p-4">
				<div class="flex justify-end gap-2">
					{#if onCancel}
						<Button variant="outline" onclick={handleCancel} disabled={isSaving}>
							Cancel
						</Button>
					{/if}
					{#if onSave}
						<Button onclick={handleSave} disabled={isSaving || !isDirty}>
							{isSaving ? 'Saving...' : 'Save Changes'}
						</Button>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
