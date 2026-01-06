<script lang="ts">
  import { browser } from "$app/environment";
  import { signInSchema, type SignInSchema } from "$lib/modules/auth/schemas/sign-in";
  import { Field, FieldContent, FieldLabel, FieldError } from "$lib/components/ui/field";
  import { Input } from "$lib/components/ui/input";
  import {
    type SuperValidated,
    type Infer,
    superForm,
  } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";
  import Button from "$lib/components/ui/button/button.svelte";
  import { IconEye, IconEyeOff } from "@tabler/icons-svelte";
  import { toast } from "svelte-sonner";
  import { AuthErrorMessages } from "$lib/modules/auth/types";
  import { goto } from "$app/navigation";

  let { data }: { data: SuperValidated<Infer<SignInSchema>> } = $props();

  let showPassword = $state(false);
  let isSubmitting = $state(false);

  const form = superForm(data, {
    validators: zod4Client(signInSchema),
    validationMethod: "onblur",
    onSubmit: () => {
      isSubmitting = true;
    },
    onResult: async ({ result }) => {
      isSubmitting = false;

      // Only show toasts and navigate on client side
      if (!browser) return;

      if (result.type === "failure") {
        toast.error(result.data?.message || AuthErrorMessages.SERVER_ERROR, {
          description:
            "Please try again or contact support if the problem persists.",
        });
        return;
      }

      if (result.type === "success") {
        // Server-side redirect will handle navigation
        toast.success("Successfully signed in", {
          description: "Redirecting...",
        });
      }
    },
  });

  const { form: formData, enhance, errors, touched } = form;

  // Only show errors if field has been touched
  function shouldShowError(field: string): boolean {
    return $touched && $touched[field] === true;
  }

  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }
</script>

<form
  method="POST"
  use:enhance
  class="space-y-3"
  aria-label="Sign in form"
  novalidate
>
  <Field>
    <FieldContent>
      <FieldLabel for="email">Email</FieldLabel>
      <Input
        id="email"
        bind:value={$formData.email}
        type="email"
        placeholder="you@email.com"
        autocomplete="email"
        required
        aria-invalid={$errors.email ? "true" : undefined}
        aria-describedby={$errors.email ? "email-error" : undefined}
      />
    </FieldContent>
    <FieldError id="email-error" errors={shouldShowError("email") && $errors.email ? [{ message: $errors.email }] : undefined} />
  </Field>

  <Field>
    <FieldContent>
      <div class="flex w-full items-center justify-between">
        <FieldLabel for="password">Password</FieldLabel>
        <Button
          variant="link"
          class="text-sm hover:underline focus:ring-2 focus:ring-primary-500"
          href="/forgot-password"
        >
          Forgot password?
        </Button>
      </div>
      <div class="relative">
        <Input
          id="password"
          bind:value={$formData.password}
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          autocomplete="current-password"
          required
          aria-invalid={$errors.password ? "true" : undefined}
          aria-describedby={$errors.password ? "password-error" : undefined}
        />
        <Button
          size="icon"
          class="absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none"
          variant="ghost"
          onclick={togglePasswordVisibility}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {#if showPassword}
            <IconEyeOff size={16} />
          {:else}
            <IconEye size={16} />
          {/if}
        </Button>
      </div>
    </FieldContent>
    <FieldError id="password-error" errors={shouldShowError("password") && $errors.password ? [{ message: $errors.password }] : undefined} />
  </Field>

  <Button disabled={isSubmitting} class="w-full" type="submit">
    {#if isSubmitting}
      Signing in...
    {:else}
      Sign in
    {/if}
  </Button>
</form>

