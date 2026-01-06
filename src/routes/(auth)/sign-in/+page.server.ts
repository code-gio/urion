// src/routes/sign-in/+page.server.ts
import { signInSchema } from "$lib/modules/auth/schemas/sign-in.js";
import { redirect, type RequestEvent } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types.js";
import { superValidate, setError, fail } from "sveltekit-superforms";
import { AuthError } from "@supabase/supabase-js";
import {
  AuthErrorMessages,
  type AuthErrorType,
  type AuthResult,
} from "$lib/modules/auth/types/index";
import { zod4 } from "sveltekit-superforms/adapters";
import { handleAuthError } from "$lib/modules/auth/utils/auth-errors";
import { RateLimiter, RateLimitPresets } from "$lib/utils/rate-limit";

const AUTH_FORM_ID = "sign-in-form";

// Initialize rate limiter
const rateLimiter = new RateLimiter(RateLimitPresets.signIn);

export const load: PageServerLoad = async () => {
  const form = await superValidate(zod4(signInSchema), {
    id: AUTH_FORM_ID,
  });

  return { form };
};

export const actions: Actions = {
  default: async (event: RequestEvent) => {
    const {
      locals: { supabase, safeGetSession },
      getClientAddress,
    } = event;

    const clientIp = getClientAddress();

    // Clean up expired rate limit entries
    rateLimiter.cleanup();

    // Check rate limiting
    const rateLimitResult = rateLimiter.check(clientIp);
    if (!rateLimitResult.allowed) {
      return fail(429, {
        form: await superValidate(event, zod4(signInSchema), {
          id: AUTH_FORM_ID,
        }),
        type: "RATE_LIMITED" as AuthErrorType,
        message: rateLimitResult.message,
      });
    }

    const form = await superValidate(event, zod4(signInSchema), {
      id: AUTH_FORM_ID,
    });

    if (!form.valid) {
      return fail(400, {
        form,
        type: "INVALID_EMAIL",
        message: "Please check your input and try again",
      });
    }

    const { email, password } = form.data;

    try {
      const session = await safeGetSession();
      if (session?.user) {
        return fail(400, {
          form,
          type: "ALREADY_LOGGED_IN",
          message: AuthErrorMessages.ALREADY_LOGGED_IN,
        });
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

      if (authError) {
        rateLimiter.recordAttempt(clientIp);
        return handleAuthError(form, authError);
      }

      // Clear rate limit on successful login
      rateLimiter.clear(clientIp);

      // Auto-accept pending invitations
      try {
        const { data: user } = await safeGetSession();
        if (user?.email) {
          await supabase.rpc('accept_workspace_invitation', {
            user_uuid: user.id,
            user_email: user.email,
          });
        }
      } catch {
        // Silently fail - invitations can be accepted later
      }

      // Handle redirect
      const redirectTo = event.url.searchParams.get('redirect_to');
      if (redirectTo && redirectTo.startsWith('/')) {
        throw redirect(303, redirectTo);
      }

      // Smart redirect based on workspace count
      const { supabase: supabaseClient } = event.locals;
      const { data: user } = await event.locals.safeGetSession();
      if (user) {
        const { data: workspaces } = await supabaseClient.rpc('get_user_workspaces', {
          user_uuid: user.id,
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
      console.error("Unexpected error during authentication:", error);
      return fail(500, {
        form,
        type: "SERVER_ERROR",
        message: AuthErrorMessages.SERVER_ERROR,
      });
    }
  },
};
