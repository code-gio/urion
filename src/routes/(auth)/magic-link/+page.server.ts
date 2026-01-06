// src/routes/magic-link/+page.server.ts
import { magicLinkSchema } from "$lib/modules/auth/schemas/magic-link.js";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types.js";
import { superValidate, fail } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { PUBLIC_APP_URL } from "$env/static/public";
import { isDevelopment } from "$lib/server/env";

import { AuthErrorMessages, type AuthErrorType } from "$lib/modules/auth/types/index";

const AUTH_FORM_ID = "magic-link-form";
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

// Store rate limiting data (use Redis in production)
const rateLimitStore = new Map<
  string,
  { count: number; timestamp: number; lastAttempt: number }
>();

export const load: PageServerLoad = async () => {
  // Don't pass initial data to avoid errors on initial load
  // According to Superforms docs: "If no data was posted or sent to superValidate,
  // no errors will be returned unless the errors option in superValidate is true"
  const form = await superValidate(zod4(magicLinkSchema), {
    id: AUTH_FORM_ID,
  });

  return {
    form,
  };
};

export const actions: Actions = {
  default: async (event) => {
    const {
      locals: { supabase },
      getClientAddress,
    } = event;

    const form = await superValidate(event, zod4(magicLinkSchema), {
      id: AUTH_FORM_ID,
    });

    if (!form.valid) {
      return fail(400, {
        form,
        type: "INVALID_EMAIL",
        message: AuthErrorMessages.INVALID_EMAIL,
      });
    }

    const { email } = form.data;
    const clientIp = getClientAddress();

    // Clean up expired rate limit entries
    cleanupExpiredRateLimits();

    try {
      // Check rate limiting
      const rateLimitCheck = await checkRateLimit(clientIp, email);
      if (!rateLimitCheck.allowed) {
        return fail(429, {
          form,
          type: "RATE_LIMITED",
          message: rateLimitCheck.message,
        });
      }

      // Determine the correct redirect URL
      // In development, prefer the actual request origin (localhost)
      // In production, use PUBLIC_APP_URL if set, otherwise use request origin
      let redirectUrl: string;
      
      if (isDevelopment) {
        // In development, always use the request origin to ensure localhost works
        const host = event.request.headers.get("host") || event.url.host;
        const protocol = host?.includes("localhost") ? "http:" : (event.url.protocol || "https:");
        const origin = `${protocol}//${host}`;
        redirectUrl = `${origin}/auth/callback`;
      } else {
        // In production, use PUBLIC_APP_URL if available, otherwise request origin
        redirectUrl = PUBLIC_APP_URL 
          ? `${PUBLIC_APP_URL}/auth/callback`
          : `${event.url.origin}/auth/callback`;
      }

      // Send magic link
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            last_sign_in_attempt: new Date().toISOString(),
            ip_address: clientIp,
          },
        },
      });

      // Always return success to prevent email enumeration
      if (error) {
        console.error("Magic link error:", error.message);
        await recordFailedAttempt(clientIp, email);
      } else {
        // Clear rate limiting only on actual success
        rateLimitStore.delete(getRateLimitKey(clientIp, email));
      }

      // Return generic success message regardless of whether email exists
      return {
        form,
        success: true,
        email,
        type: "success",
        message:
          "If an account exists with this email, you will receive a magic link shortly.",
      };
    } catch (error) {
      console.error("Magic link error:", error);
      await recordFailedAttempt(clientIp, email);

      return fail(500, {
        form,
        type: "SERVER_ERROR",
        message: AuthErrorMessages.SERVER_ERROR,
      });
    }
  },
};

async function checkRateLimit(
  clientIp: string,
  email: string
): Promise<{ allowed: boolean; message: string }> {
  const key = getRateLimitKey(clientIp, email);
  const now = Date.now();
  const rateLimit = rateLimitStore.get(key);

  if (!rateLimit) {
    return { allowed: true, message: "" };
  }

  // Check if we're still within the rate limit window
  if (now - rateLimit.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitStore.delete(key);
    return { allowed: true, message: "" };
  }

  // Check attempt count
  if (rateLimit.count >= MAX_ATTEMPTS) {
    const timeLeft = Math.ceil(
      (RATE_LIMIT_WINDOW - (now - rateLimit.timestamp)) / 1000 / 60
    );
    return {
      allowed: false,
      message: `Too many attempts. Please try again in ${timeLeft} minutes.`,
    };
  }

  // Check if minimum time between attempts has passed (1 minute)
  const timeSinceLastAttempt = now - rateLimit.lastAttempt;
  if (timeSinceLastAttempt < 60000) {
    const timeLeft = Math.ceil((60000 - timeSinceLastAttempt) / 1000);
    return {
      allowed: false,
      message: `Please wait ${timeLeft} seconds before requesting another magic link.`,
    };
  }

  return { allowed: true, message: "" };
}

async function recordFailedAttempt(
  clientIp: string,
  email: string
): Promise<void> {
  const key = getRateLimitKey(clientIp, email);
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current) {
    rateLimitStore.set(key, {
      count: 1,
      timestamp: now,
      lastAttempt: now,
    });
    return;
  }

  current.count += 1;
  current.lastAttempt = now;
}

function getRateLimitKey(clientIp: string, email: string): string {
  return `${clientIp}:${email.toLowerCase()}`;
}

function handleAuthError(form: any, error: Error) {
  console.error("Auth error:", error);

  let errorType: AuthErrorType = "SERVER_ERROR";
  let message: string = AuthErrorMessages.SERVER_ERROR;

  // Map common Supabase error messages to our error types
  switch (error.message) {
    case "Email rate limit exceeded":
      errorType = "RATE_LIMITED";
      message = AuthErrorMessages.RATE_LIMITED;
      break;
    case "User not found":
    case "Invalid email":
      errorType = "INVALID_EMAIL";
      message = "No account found with this email address";
      break;
    default:
      errorType = "SERVER_ERROR";
      message = AuthErrorMessages.SERVER_ERROR;
  }

  return fail(errorType === "RATE_LIMITED" ? 429 : 400, {
    form,
    type: errorType,
    message,
  });
}

// Cleanup old rate limit entries on-demand instead of using setInterval
// This prevents memory leaks in serverless environments
function cleanupExpiredRateLimits() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.timestamp > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(key);
    }
  }
}
