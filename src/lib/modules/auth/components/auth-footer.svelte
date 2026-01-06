<script>
    import { siteConfig } from "$lib/config";
    import DarkModeToggle from "$lib/components/shared/dark-mode-toggle.svelte";
</script>

<footer class=" border-t border-border/40">
    <div class="w-full max-w-5xl py-2 mx-auto px-4 sm:px-6 lg:px-8">
        <!-- List -->
        <ul
            class="flex flex-wrap justify-center items-center whitespace-nowrap gap-3"
        >
            <li
                class="inline-flex items-center relative text-xs text-gray-500 pe-3.5 last:pe-0 last:after:hidden after:absolute after:top-1/2 after:end-0 after:inline-block after:size-[3px] after:bg-gray-400 after:rounded-full after:-translate-y-1/2 dark:text-neutral-500 dark:after:bg-neutral-600"
            >
                © 2024 {siteConfig.title}
            </li>
            <li
                class="inline-flex items-center relative text-xs text-gray-500 pe-3.5 last:pe-0 last:after:hidden after:absolute after:top-1/2 after:end-0 after:inline-block after:size-[3px] after:bg-gray-400 after:rounded-full after:-translate-y-1/2 dark:text-neutral-500 dark:after:bg-neutral-600"
            >
                <a
                    class="text-xs text-gray-500 underline-offset-4 hover:underline hover:text-gray-800 focus:outline-none focus:underline focus:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200 dark:focus:text-neutral-200"
                    href="#"
                >
                    Terms
                </a>
            </li>
            <li
                class="inline-flex items-center relative text-xs text-gray-500 pe-3.5 last:pe-0 last:after:hidden after:absolute after:top-1/2 after:end-0 after:inline-block after:size-[3px] after:bg-gray-400 after:rounded-full after:-translate-y-1/2 dark:text-neutral-500 dark:after:bg-neutral-600"
            >
                <a
                    class="text-xs text-gray-500 underline-offset-4 hover:underline hover:text-gray-800 focus:outline-none focus:underline focus:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200 dark:focus:text-neutral-200"
                    href="#"
                >
                    Privacy
                </a>
            </li>
            <li
                class="inline-flex items-center relative text-xs text-gray-500 pe-3.5 last:pe-0 last:after:hidden after:absolute after:top-1/2 after:inline-block after:size-[3px] after:bg-gray-400 after:rounded-full after:-translate-y-1/2 dark:text-neutral-500 dark:after:bg-neutral-600"
            >
                <a
                    class="text-xs text-gray-500 underline-offset-4 hover:underline hover:text-gray-800 focus:outline-none focus:underline focus:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200 dark:focus:text-neutral-200"
                    href="#"
                >
                    Your Privacy Choices
                </a>
            </li>
            <li
                class="inline-flex items-center relative text-xs text-gray-500 pe-3.5 last:pe-0 last:after:hidden after:absolute after:top-1/2 after:end-0 after:inline-block after:size-[3px] after:bg-gray-400 after:rounded-full after:-translate-y-1/2 dark:text-neutral-500 dark:after:bg-neutral-600"
            >
                <DarkModeToggle />
            </li>
        </ul>
        <!-- End List -->
    </div>
</footer>
<!-- ========== END FOOTER ========== -->

