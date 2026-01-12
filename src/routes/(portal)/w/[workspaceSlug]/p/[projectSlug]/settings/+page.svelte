<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	const workspaceSlug = $derived.by(() => {
		const match = page.url.pathname.match(/^\/w\/([^/]+)/);
		return match ? match[1] : '';
	});

	const projectSlug = $derived.by(() => {
		const match = page.url.pathname.match(/^\/w\/[^/]+\/p\/([^/]+)/);
		return match ? match[1] : '';
	});

	// Redirect to overview
	$effect(() => {
		if (workspaceSlug && projectSlug) {
			goto(`/w/${workspaceSlug}/p/${projectSlug}/settings/overview`, { replaceState: true });
		}
	});
</script>
