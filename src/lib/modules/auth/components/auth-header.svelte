<script>
  import { siteConfig } from "$lib/config";
  import logo from "$lib/assets/logo.svg";
  import logoWhite from "$lib/assets/logo-white.svg";
</script>

<header
  class="flex flex-wrap md:justify-start md:flex-nowrap z-50 bg-white border-b border-gray-200 dark:bg-neutral-900 dark:border-neutral-700"
>
  <div
    class="max-w-340 flex justify-center basis-full items-center w-full mx-auto py-4 px-4 sm:px-6 lg:px-8"
  >
    <!-- Logo -->
    <a href="/" aria-label={siteConfig.title}>
      <img
        src={logo}
        alt={siteConfig.title}
        class="h-6 dark:hidden"
      />
      <img
        src={logoWhite}
        alt={siteConfig.title}
        class="hidden h-6 dark:block"
      />
    </a>
    <!-- End Logo -->
  </div>
</header>

