<script lang="ts">
    import MagicLinkForm from "$lib/modules/auth/components/magic-link-form.svelte";
    import Button from "$lib/components/ui/button/button.svelte";
    import * as Card from "$lib/components/ui/card";
    import type { PageData } from "./$types";
    let { data }: { data: PageData } = $props();
</script>

<Card.Root class="sm:w-[448px]">
    <Card.Header>
        <Card.Title class="text-center text-2xl"
            >Sign in via magic link</Card.Title
        >
        <Card.Description class="text-center">
            Enter your email and we'll send you a magic link to sign in.
        </Card.Description>
    </Card.Header>
    <Card.Content>
        <MagicLinkForm data={data.form} />
    </Card.Content>
</Card.Root>
