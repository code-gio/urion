<script lang="ts">
  import NavDocuments from "./nav-workspace.svelte";
  import NavMain from "./nav-main.svelte";
  import NavSecondary from "../../shared/nav-secondary.svelte";
  import NavUser from "../../shared/nav-user.svelte";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import type { ComponentProps } from "svelte";
  import { siteConfig } from "$lib/config";
  import logo from "$lib/assets/logo.svg";
  import logoWhite from "$lib/assets/logo-white.svg";
  let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
  <Sidebar.Header>
    <a href="/" aria-label={siteConfig.title}>
      <img src={logo} alt={siteConfig.title} class="h-6 dark:hidden" />
      <img
        src={logoWhite}
        alt={siteConfig.title}
        class="hidden h-6 dark:block"
      />
    </a>
  </Sidebar.Header>
  <Sidebar.Content>
    <NavMain />
    <NavDocuments />
    <NavSecondary class="mt-auto" />
  </Sidebar.Content>
  <Sidebar.Footer>
    <NavUser />
  </Sidebar.Footer>
</Sidebar.Root>
