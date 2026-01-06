<script lang="ts">
  import SignInForm from "$lib/modules/auth/components/sign-in-form.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Card from "$lib/components/ui/card";
  import { IconSparkles } from "@tabler/icons-svelte";
  import type { PageData } from "./$types";
  let { data }: { data: PageData } = $props();
</script>

<Card.Root class="sm:w-[448px]">
  <Card.Header>
    <Card.Title class="text-center text-2xl">Sign In</Card.Title>
    <Card.Description class="text-center">
      Don't have an account yet?
      <Button variant="link" href="/sign-up" class="p-0">Sign up here</Button>
    </Card.Description>
  </Card.Header>
  <Card.Content class="space-y-5">
    <Button href="/magic-link" class="w-full" variant="outline">
      <IconSparkles />
      Sign in with magic link
    </Button>
    <div
      class="before:muted-foreground after:muted-foreground flex items-center text-xs uppercase text-muted-foreground before:me-6 before:flex-1 before:border-t after:ms-6 after:flex-1 after:border-t dark:before:border-muted-foreground dark:after:border-muted-foreground"
    >
      Or
    </div>

    <SignInForm data={data.form} />
  </Card.Content>
</Card.Root>
