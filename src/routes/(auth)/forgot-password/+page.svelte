<script lang="ts">
    import ForgotPasswordForm from "$lib/modules/auth/components/forgot-password-form.svelte";
    import * as Card from "$lib/components/ui/card";
    import type { PageData } from "./$types";
    let { data }: { data: PageData } = $props();
</script>

<Card.Root class="sm:w-[448px]">
    <Card.Header>
        <Card.Title class="text-center text-2xl">Forgot password?</Card.Title>
        <Card.Description class="text-center">
            Enter your email address and we'll send you a link to reset your
            password
        </Card.Description>
    </Card.Header>
    <Card.Content>
        <ForgotPasswordForm data={data.form} />
    </Card.Content>
</Card.Root>
