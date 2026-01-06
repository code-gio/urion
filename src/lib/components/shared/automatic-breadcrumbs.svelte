<script lang="ts">
	import { page } from "$app/state";
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";

	// Generate breadcrumb items from the current pathname
	const breadcrumbs = $derived.by(() => {
		const pathname = page.url.pathname;
		const segments = pathname.split("/").filter(Boolean);

		// If we're at the root, return empty array
		if (segments.length === 0) {
			return [];
		}

		// Build breadcrumb items
		const items: Array<{ href: string; label: string; isLast: boolean }> = [];

		// Build path progressively for each segment
		let currentPath = "";
		segments.forEach((segment, index) => {
			currentPath += `/${segment}`;
			const isLast = index === segments.length - 1;

			// Format label: capitalize and replace hyphens with spaces
			// Special handling for common route names
			let label = segment;
			if (segment === "dashboard") {
				label = "Dashboard";
			} else {
				label = segment
					.split("-")
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(" ");
			}

			items.push({
				href: currentPath,
				label,
				isLast
			});
		});

		return items;
	});
</script>

<Breadcrumb.Root>
	<Breadcrumb.List>
		{#each breadcrumbs as item, index}
			{#if index > 0}
				<Breadcrumb.Separator class="hidden md:block" />
			{/if}
			<Breadcrumb.Item class={item.isLast ? "" : "hidden md:block"}>
				{#if item.isLast}
					<Breadcrumb.Page>{item.label}</Breadcrumb.Page>
				{:else}
					<Breadcrumb.Link href={item.href}>{item.label}</Breadcrumb.Link>
				{/if}
			</Breadcrumb.Item>
		{/each}
	</Breadcrumb.List>
</Breadcrumb.Root>

