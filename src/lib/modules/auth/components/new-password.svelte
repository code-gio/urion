<script lang="ts">
  import { browser } from "$app/environment";
  import { Button } from "$lib/components/ui/button";
  import { toast } from "svelte-sonner";
  import Input from "$lib/components/ui/input/input.svelte";
  import Label from "$lib/components/ui/label/label.svelte";
  import { IconEye, IconEyeOff } from "@tabler/icons-svelte";
  import { goto } from "$app/navigation";
  import { changePasswordForm } from "$lib/modules/auth/schemas/change-password";

  let isRequestPassword = $state(false);
  let newpassword = $state("");
  let repeatPassword = $state("");
  let showPassword = $state(false);
  let showRepeatPassword = $state(false);
  let errors = $state<{ password?: string; repeat_password?: string }>({});

  function validatePassword() {
    const result = changePasswordForm.safeParse({
      password: newpassword,
      repeat_password: repeatPassword,
    });

    if (!result.success) {
      const fieldErrors: { password?: string; repeat_password?: string } = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as "password" | "repeat_password";
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      });
      errors = fieldErrors;
      return false;
    }

    errors = {};
    return true;
  }

  async function handleResetPassword() {
    if (!validatePassword()) {
      return;
    }

    // Only execute on client side
    if (!browser) return;

    try {
      isRequestPassword = true;

      const response = await fetch("/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newpassword }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to reset password");
      }

      toast.success("Reset password successfully");
      goto("/packs");
    } catch (error) {
      console.error("Error reset password:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to reset password"
      );
    } finally {
      isRequestPassword = false;
    }
  }

  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }

  function toggleRepeatPasswordVisibility() {
    showRepeatPassword = !showRepeatPassword;
  }
</script>

<div class="flex flex-col gap-3">
  <div class="space-y-2">
    <Label for="password">New password</Label>
    <div class="relative">
      <Input
        id="password"
        bind:value={newpassword}
        type={showPassword ? "text" : "password"}
        placeholder="Enter your password"
        autocomplete="new-password"
        required
        aria-invalid={errors.password ? "true" : undefined}
        aria-describedby={errors.password ? "password-error" : undefined}
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
    {#if errors.password}
      <p class="text-sm text-red-500" id="password-error" role="alert">
        {errors.password}
      </p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="repeat-password">Confirm password</Label>
    <div class="relative">
      <Input
        id="repeat-password"
        bind:value={repeatPassword}
        type={showRepeatPassword ? "text" : "password"}
        placeholder="Confirm your password"
        autocomplete="new-password"
        required
        aria-invalid={errors.repeat_password ? "true" : undefined}
        aria-describedby={errors.repeat_password
          ? "repeat-password-error"
          : undefined}
      />
      <Button
        size="icon"
        class="absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none"
        variant="ghost"
        onclick={toggleRepeatPasswordVisibility}
        aria-label={showRepeatPassword ? "Hide password" : "Show password"}
      >
        {#if showRepeatPassword}
          <IconEyeOff size={16} />
        {:else}
          <IconEye size={16} />
        {/if}
      </Button>
    </div>
    {#if errors.repeat_password}
      <p class="text-sm text-red-500" id="repeat-password-error" role="alert">
        {errors.repeat_password}
      </p>
    {/if}
  </div>

  <Button
    variant="default"
    class="bg-blue-500 hover:bg-blue-700 text-white mt-2 w-full"
    onclick={handleResetPassword}
    disabled={isRequestPassword}
  >
    {#if isRequestPassword}
      Resetting password...
    {:else}
      Reset Password
    {/if}
  </Button>
</div>

