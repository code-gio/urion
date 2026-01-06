<script lang="ts">
  import "./layout.css";
  import favicon from "$lib/assets/favicon.svg";
  import { invalidate } from "$app/navigation";
  import { onMount } from "svelte";
  import { ModeWatcher } from "mode-watcher";
  import { Toaster } from "$lib/components/ui/sonner";
  let { data, children } = $props();
  let { supabase, session } = $derived(data);

  onMount(() => {
    // Listen for auth state changes
    const { data: authData } = supabase.auth.onAuthStateChange(
      (event, _session) => {
        // Invalidate the layout data when session changes
        if (_session?.expires_at !== session?.expires_at) {
          invalidate("supabase:auth");
        }
      }
    );

    // Set up automatic token refresh
    // Supabase automatically refreshes tokens 60 seconds before expiration
    // We set up an additional check to ensure refresh happens
    let refreshInterval: ReturnType<typeof setInterval> | null = null;

    if (session?.expires_at) {
      const setupRefreshTimer = () => {
        const expiresAt = session.expires_at! * 1000; // Convert to milliseconds
        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;

        // Refresh 5 minutes before expiration
        const refreshTime = Math.max(0, timeUntilExpiry - 5 * 60 * 1000);

        if (refreshTime > 0) {
          refreshInterval = setTimeout(async () => {
            const { data, error } = await supabase.auth.refreshSession();
            if (!error && data.session) {
              // Session refreshed successfully
              invalidate("supabase:auth");
            }
          }, refreshTime);
        }
      };

      setupRefreshTimer();
    }

    // Cleanup function
    return () => {
      authData.subscription.unsubscribe();
      if (refreshInterval) {
        clearTimeout(refreshInterval);
      }
    };
  });
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div class="h-dvh">
  <Toaster />
  <ModeWatcher />
  {@render children()}
</div>
