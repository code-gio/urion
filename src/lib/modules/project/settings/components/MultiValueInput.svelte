<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Label } from '$lib/components/ui/label';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		values = $bindable([]),
		placeholder = 'Add item',
		label,
		description
	}: {
		values?: string[];
		placeholder?: string;
		label?: string;
		description?: string;
	} = $props();

	let inputValue = $state('');

	function addValue() {
		const trimmed = inputValue.trim();
		if (trimmed && !values.includes(trimmed)) {
			values = [...values, trimmed];
			inputValue = '';
		}
	}

	function removeValue(value: string) {
		values = values.filter((v) => v !== value);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addValue();
		}
	}

	function truncateText(text: string, maxLength: number = 20): string {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + '...';
	}
</script>

<div class="space-y-2">
	{#if label}
		<Label for="multi-value-input-{label}">{label}</Label>
	{/if}
	{#if description}
		<p class="text-sm text-muted-foreground">{description}</p>
	{/if}
	<div class="flex gap-2">
		<Input
			id={label ? `multi-value-input-${label}` : undefined}
			bind:value={inputValue}
			{placeholder}
			onkeydown={handleKeydown}
			onblur={addValue}
		/>
		<Button type="button" variant="outline" onclick={addValue}>
			Add
		</Button>
	</div>
	{#if values.length > 0}
		<div class="flex flex-wrap gap-2 mt-2">
			{#each values as value}
				{#if value.length > 20}
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Badge variant="secondary" class="flex items-center gap-1">
								{truncateText(value)}
								<button
									type="button"
									class="ml-1 rounded-full hover:bg-muted"
									onclick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										removeValue(value);
									}}
								>
									<XIcon class="h-3 w-3" />
								</button>
							</Badge>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p class="max-w-xs break-words">{value}</p>
						</Tooltip.Content>
					</Tooltip.Root>
				{:else}
					<Badge variant="secondary" class="flex items-center gap-1">
						{value}
						<button
							type="button"
							class="ml-1 rounded-full hover:bg-muted"
							onclick={() => removeValue(value)}
						>
							<XIcon class="h-3 w-3" />
						</button>
					</Badge>
				{/if}
			{/each}
		</div>
	{/if}
</div>
