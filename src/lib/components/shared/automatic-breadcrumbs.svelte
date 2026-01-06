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

		// Always add Dashboard as the first breadcrumb (links to root)
		items.push({
			href: "/",
			label: "Dashboard",
			isLast: false
		});

		// Detect workspace route: /w/:workspaceSlug
		const isWorkspaceRoute = segments[0] === "w" && segments.length >= 2;
		// Detect project route: /w/:workspaceSlug/p/:projectSlug
		const isProjectRoute = segments[0] === "w" && segments[1] && segments[2] === "p" && segments.length >= 4;

		// Build path progressively for each segment
		let currentPath = "";
		let segmentIndex = 0;

		// Handle workspace routes
		if (isWorkspaceRoute) {
			// Skip "w" segment, add workspace
			currentPath = `/w/${segments[1]}`;
			const workspaceSlug = segments[1];
			// Workspace is last if it's not a project route and there are no more segments
			const isWorkspaceLast = !isProjectRoute && segments.length === 2;

			items.push({
				href: currentPath,
				label: formatSlug(workspaceSlug),
				isLast: isWorkspaceLast
			});

			segmentIndex = 2; // Skip "w" and workspace slug

			// Handle project routes
			if (isProjectRoute) {
				// Skip "p" segment, add project
				currentPath = `/w/${workspaceSlug}/p/${segments[3]}`;
				const projectSlug = segments[3];
				// Project is last if there are no more segments after it
				const isProjectLast = segments.length === 4;

				items.push({
					href: currentPath,
					label: formatSlug(projectSlug),
					isLast: isProjectLast
				});

				segmentIndex = 4; // Skip "w", workspace slug, "p", and project slug
			}
		}

		// Process remaining segments (after workspace/project, or all segments for non-workspace routes)
		for (let i = segmentIndex; i < segments.length; i++) {
			const segment = segments[i];
			// Build path correctly based on whether we've already started a path
			if (currentPath) {
				currentPath += `/${segment}`;
			} else {
				currentPath = `/${segment}`;
			}
			const isLast = i === segments.length - 1;

			// Format label: capitalize and replace hyphens with spaces
			// Special handling for common route names
			let label = segment;
			if (segment === "dashboard") {
				label = "Dashboard";
			} else {
				label = formatSlug(segment);
			}

			items.push({
				href: currentPath,
				label,
				isLast
			});
		}

		return items;
	});

	function formatSlug(slug: string): string {
		return slug
			.split("-")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	}
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

