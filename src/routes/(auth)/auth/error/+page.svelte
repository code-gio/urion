<script lang="ts">
    import Button from "$lib/components/ui/button/button.svelte";
    import * as Card from "$lib/components/ui/card";
</script>

<Card.Root class="sm:w-[448px]">
    <Card.Header>
        <Card.Title class="text-center text-2xl text-red-600 "
            >Authentication Error</Card.Title
        >
        <Card.Description class="text-center">
            There was an error during the sign-in process. Please try again.
        </Card.Description>
    </Card.Header>
    <Card.Content>
        <Button href="/sign-in" class="w-full">Go to Sign In</Button>
    </Card.Content>
</Card.Root>
