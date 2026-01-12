<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import type { ProjectCrawlSource, CrawlSourceType } from '$lib/types/project-settings.js';
	import { toast } from 'svelte-sonner';

	let {
		open = $bindable(false),
		source,
		workspaceId,
		projectId,
		onSave
	}: {
		open?: boolean;
		source?: ProjectCrawlSource | null;
		workspaceId: string;
		projectId: string;
		onSave?: (source: ProjectCrawlSource) => void;
	} = $props();

	let sourceType = $state<CrawlSourceType>(source?.source_type || 'sitemap');
	let url = $state(source?.url || '');
	let isPrimary = $state(source?.is_primary || false);
	let respectRobots = $state(source?.respect_robots ?? true);
	let notes = $state(source?.notes || '');
	let isSaving = $state(false);

	const sourceTypeLabel = $derived(
		sourceType === 'sitemap'
			? 'Sitemap'
			: sourceType === 'robots'
				? 'Robots.txt'
				: sourceType === 'rss'
					? 'RSS Feed'
					: sourceType === 'url_list'
						? 'URL List'
						: sourceType === 'docs'
							? 'Documentation'
							: sourceType === 'api'
								? 'API'
								: 'Other'
	);

	$effect(() => {
		if (source) {
			sourceType = source.source_type;
			url = source.url;
			isPrimary = source.is_primary;
			respectRobots = source.respect_robots;
			notes = source.notes || '';
		} else {
			sourceType = 'sitemap';
			url = '';
			isPrimary = false;
			respectRobots = true;
			notes = '';
		}
	});

	async function handleSave() {
		if (!url.trim()) {
			toast.error('URL is required');
			return;
		}

		isSaving = true;

		try {
			const urlToUse = source?.id
				? `/api/workspaces/${workspaceId}/projects/${projectId}/crawl-sources?id=${source.id}`
				: `/api/workspaces/${workspaceId}/projects/${projectId}/crawl-sources`;

			const method = source?.id ? 'PATCH' : 'POST';

			const response = await fetch(urlToUse, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					source_type: sourceType,
					url: url.trim(),
					is_primary: isPrimary,
					respect_robots: respectRobots,
					notes: notes.trim() || null
				})
			});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to save crawl source');
		}

		const savedSource = await response.json();
		toast.success(source?.id ? 'Crawl source updated' : 'Crawl source created');
		open = false;
		
		if (onSave) {
			onSave(savedSource);
		}
	} catch (error) {
		toast.error(error instanceof Error ? error.message : 'Failed to save crawl source');
	} finally {
		isSaving = false;
	}
}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>{source?.id ? 'Edit Crawl Source' : 'Add Crawl Source'}</Dialog.Title>
			<Dialog.Description>Configure a source for crawling your website</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="source-type">Source Type</Label>
				<Select.Root type="single" bind:value={sourceType}>
					<Select.Trigger id="source-type">
						{sourceTypeLabel}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="sitemap" label="Sitemap">Sitemap</Select.Item>
						<Select.Item value="robots" label="Robots.txt">Robots.txt</Select.Item>
						<Select.Item value="rss" label="RSS Feed">RSS Feed</Select.Item>
						<Select.Item value="url_list" label="URL List">URL List</Select.Item>
						<Select.Item value="docs" label="Documentation">Documentation</Select.Item>
						<Select.Item value="api" label="API">API</Select.Item>
						<Select.Item value="other" label="Other">Other</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>

			<div class="space-y-2">
				<Label for="url">URL</Label>
				<Input id="url" bind:value={url} placeholder="https://example.com/sitemap.xml" type="url" />
			</div>

			<div class="flex items-center space-x-2">
				<Checkbox id="is-primary" bind:checked={isPrimary} />
				<Label for="is-primary" class="cursor-pointer">Mark as primary source for this type</Label>
			</div>

			<div class="flex items-center space-x-2">
				<Checkbox id="respect-robots" bind:checked={respectRobots} />
				<Label for="respect-robots" class="cursor-pointer">Respect robots.txt</Label>
			</div>

			<div class="space-y-2">
				<Label for="notes">Notes (Optional)</Label>
				<Textarea id="notes" bind:value={notes} placeholder="Additional notes about this source" />
			</div>
		</div>

		<Dialog.Footer>
			<Dialog.Close>
				<Button variant="outline" disabled={isSaving}>
					Cancel
				</Button>
			</Dialog.Close>
			<Button onclick={handleSave} disabled={isSaving || !url.trim()}>
				{isSaving ? 'Saving...' : source?.id ? 'Update' : 'Create'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
