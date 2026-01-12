<script lang="ts">
	import { SettingsShell } from '$lib/modules/project/settings';
	import { page } from '$app/state';

	let { data, children }: { data: any; children: any } = $props();

	const currentPath = $derived(page.url.pathname);
</script>

<SettingsShell canEdit={data.canEdit}>
	{@render children()}
</SettingsShell>
