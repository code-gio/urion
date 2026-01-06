<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		value = '',
		onChange,
		placeholder = 'Search backlink sites...',
		class: className = '',
	}: {
		value: string;
		onChange: (value: string) => void;
		placeholder?: string;
		class?: string;
	} = $props();

	let searchValue = $state(value);
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		searchValue = target.value;

		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		timeoutId = setTimeout(() => {
			onChange(searchValue);
		}, 300);
	}

	function handleClear() {
		searchValue = '';
		onChange('');
	}
</script>

<div class="relative {className}">
	<SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
	<Input
		type="text"
		placeholder={placeholder}
		value={searchValue}
		oninput={handleInput}
		class="pl-9 pr-9"
	/>
	{#if searchValue}
		<Button
			variant="ghost"
			size="sm"
			class="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
			onclick={handleClear}
		>
			<XIcon class="size-4" />
		</Button>
	{/if}
</div>

