<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { setContext } from 'svelte';

	let {
		canEdit = true,
		children
	}: {
		canEdit?: boolean;
		children: import('svelte').Snippet;
	} = $props();

	// Context will be set by child components
	let onSave: (() => void | Promise<void>) | undefined = $state();
	let onCancel: (() => void) | undefined = $state();
	let isDirty = $state(false);
	let isSaving = $state(false);

	// Expose context setter for child components
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

<div class="flex h-full flex-col w-full">
	<!-- Main Content -->
	<div class="flex-1 overflow-y-auto w-full">
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
