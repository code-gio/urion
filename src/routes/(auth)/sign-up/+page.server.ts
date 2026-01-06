import type { PageServerLoad, Actions } from "./$types.js";
import { superValidate, setError, fail } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";

import { signUpSchema } from "$lib/modules/auth/schemas/sign-up.js";
import { AuthError } from "@supabase/supabase-js";
import {
  AuthErrorMessages,
  type AuthErrorType,
  type AuthResult,
} from "$lib/modules/auth/types/index.js";
import { handleAuthError, handleUnexpectedError } from "$lib/modules/auth/utils/auth-errors";
import { supabaseAdmin } from "$lib/modules/auth/server/auth.js";

const AUTH_FORM_ID = "sign-up-form";

export const load: PageServerLoad = async () => {
  return {
    form: await superValidate(zod4(signUpSchema), {
      id: AUTH_FORM_ID,
    }),
  };
};

export const actions: Actions = {
  default: async (event) => {
    const {
      locals: { supabase, safeGetSession },
    } = event;
    const form = await superValidate(event, zod4(signUpSchema), {
      id: AUTH_FORM_ID,
    });

    if (!form.valid) {
      return fail(400, {
        form,
        message: "Please check your input",
      });
    }

    const { email, password, firstName, lastName, username } = form.data;

    // Validate username after transformation (already lowercased and trimmed by schema)
    if (!username || typeof username !== 'string') {
      return setError(
        form,
        "username",
        "Username is required"
      );
    }

    const trimmedUsername = username.trim();
    
    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      return setError(
        form,
        "username",
        "Username must be between 3 and 30 characters"
      );
    }

    // Ensure username matches database constraint pattern
    // Database constraint likely requires: alphanumeric, underscore, hyphen, and possibly must start with letter
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      return setError(
        form,
        "username",
        "Username can only contain letters, numbers, underscores, and hyphens"
      );
    }

    // Many database constraints require username to start with a letter
    if (!/^[a-zA-Z]/.test(trimmedUsername)) {
      return setError(
        form,
        "username",
        "Username must start with a letter"
      );
    }

    // Ensure username doesn't end with underscore or hyphen (common constraint)
    if (/[_-]$/.test(trimmedUsername)) {
      return setError(
        form,
        "username",
        "Username cannot end with underscore or hyphen"
      );
    }

    // Ensure no consecutive special characters
    if (/[_-]{2,}/.test(trimmedUsername)) {
      return setError(
        form,
        "username",
        "Username cannot have consecutive underscores or hyphens"
      );
    }

    // Use the validated and trimmed username
    const validatedUsername = trimmedUsername;

    try {
      // Check if session exists
      const session = await safeGetSession();
      if (session && session.user) {
        return fail(400, {
          form,
          message: "You are already logged in",
        });
      }

      // IMPORTANT: Check username uniqueness BEFORE creating auth user
      // This prevents creating orphaned auth users if username is taken
      const { data: existingProfile, error: checkError } = await supabaseAdmin
        .from("profiles")
        .select("id, username")
        .eq("username", validatedUsername)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error checking username uniqueness:", checkError);
        return fail(500, {
          form,
          message: "Error checking username availability. Please try again.",
        });
      }

      if (existingProfile) {
        return setError(
          form,
          "username",
          "This username is already taken. Please choose another."
        );
      }

      // Attempt to sign up the user
      // According to Supabase docs, user metadata goes in options.data
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            username: validatedUsername,
          },
          emailRedirectTo: `${event.url.origin}/auth/callback`,
        },
      });

      if (authError) {
        const result = handleAuthError(form, authError);
        return fail(authError?.status || 500, {
          ...result,
          form,
        });
      }

      // Check for existing user (Supabase returns this if email already exists)
      if (authData.user && !authData.user.identities?.length) {
        return setError(
          form,
          "email",
          "An account with this email already exists"
        );
      }

      // If email confirmation is required, user might be null initially
      if (!authData.user) {
        return fail(500, {
          form,
          message: "Failed to create user account",
        });
      }

      // Database trigger will create the profile automatically
      // We just need to update it with the username after the trigger runs
      // Wait a moment for the trigger to complete, then update the profile
      await new Promise((resolve) => setTimeout(resolve, 100));

      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          username: validatedUsername,
          email,
          updated_at: new Date().toISOString(),
        })
        .eq("id", authData.user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        console.error("Error details:", JSON.stringify(profileError, null, 2));
        console.error("Attempted username:", validatedUsername);
        
        // Check if it's a username constraint violation
        if (profileError.message?.includes("profiles_username_check1") || 
            profileError.message?.includes("username") ||
            profileError.code === "23514") {
          // Extract more specific error message if available
          let errorMessage = "Username is invalid. Please choose a different username.";
          
          if (profileError.message?.includes("check constraint")) {
            errorMessage = "Username does not meet requirements. It must start with a letter and contain only letters, numbers, underscores, and hyphens.";
          }
          
          return setError(
            form,
            "username",
            errorMessage
          );
        }
        
        // For other profile errors, log but don't fail signup
        // User can update their profile later
        console.warn("Profile update failed, but user account was created:", profileError);
      }

      // If email confirmation is required, redirect to verify-email page
      // Otherwise, handle redirect like sign-in
      const requiresEmailConfirmation = !authData.session;

      if (requiresEmailConfirmation) {
        return {
          form,
          success: true,
          message: "Please check your email to verify your account",
          requiresVerification: true,
        };
      }

      // Auto-accept pending invitations if user is immediately logged in
      try {
        const { data: session } = await safeGetSession();
        if (session?.user?.email) {
          await supabase.rpc('accept_workspace_invitation', {
            user_uuid: session.user.id,
            user_email: session.user.email,
          });
        }
      } catch {
        // Silently fail
      }

      // Handle redirect
      const redirectTo = event.url.searchParams.get('redirect_to');
      if (redirectTo && redirectTo.startsWith('/')) {
        throw redirect(303, redirectTo);
      }

      // Smart redirect based on workspace count
      const { data: session } = await safeGetSession();
      if (session?.user) {
        const { data: workspaces } = await supabase.rpc('get_user_workspaces', {
          user_uuid: session.user.id,
        });

        if (!workspaces || workspaces.length === 0) {
          throw redirect(303, '/');
        }

        if (workspaces.length === 1) {
          throw redirect(303, `/w/${workspaces[0].workspace_slug}`);
        }
      }

      throw redirect(303, '/');
    } catch (error) {
      console.error("Signup error:", error);
      const result = handleUnexpectedError(form, error);
      return fail(500, {
        form,
        type: result.type,
        message: result.message,
      });
    }
  },
};

