import type { PageServerLoad, Actions } from "./$types.js";
import { superValidate, fail } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { forgotPasswordSchema } from "$lib/modules/auth/schemas/forgot-password.js";
import { AuthErrorMessages, type AuthErrorType } from "$lib/modules/auth/types/index";
import { AuthError } from "@supabase/supabase-js";

const AUTH_FORM_ID = "forgot-password-form";
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW = 30 * 60 * 1000; // 30 minutes

// Store rate limiting data (use Redis in production)
const rateLimitStore = new Map<
  string,
  { count: number; timestamp: number; lastAttempt: number }
>();

export const load: PageServerLoad = async () => {
  const form = await superValidate(zod4(forgotPasswordSchema), {
    id: AUTH_FORM_ID,
  });

  return { form };
};

export const actions: Actions = {
  default: async (event) => {
    const {
      locals: { supabase },
      getClientAddress,
      url,
    } = event;

    const form = await superValidate(event, zod4(forgotPasswordSchema), {
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

      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${url.origin}/reset-password/confirm`,
      });

      if (error) {
        console.error("Password reset error:", error.message);

        // Check for Supabase rate limiting - safe to expose since it doesn't reveal email existence
        if (
          error.message.includes("For security purposes") ||
          error.message.includes("rate limit") ||
          error.message.toLowerCase().includes("too many requests")
        ) {
          await recordFailedAttempt(clientIp, email);
          return fail(429, {
            form,
            type: "RATE_LIMITED",
            message: error.message,
          });
        }

        // For other errors (like user not found), return generic success to prevent enumeration
        await recordFailedAttempt(clientIp, email);
      } else {
        // Clear rate limiting only on actual success
        rateLimitStore.delete(getRateLimitKey(clientIp, email));
      }

      // Return generic success message for non-rate-limit scenarios
      return {
        form,
        success: true,
        type: "success",
        message:
          "If an account exists with this email, you will receive a password reset link shortly.",
      };
    } catch (error) {
      console.error("Password reset error:", error);
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

  // Check minimum time between attempts (2 minutes)
  const timeSinceLastAttempt = now - rateLimit.lastAttempt;
  if (timeSinceLastAttempt < 120000) {
    const timeLeft = Math.ceil((120000 - timeSinceLastAttempt) / 1000);
    return {
      allowed: false,
      message: `Please wait ${timeLeft} seconds before requesting another reset email.`,
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

function handleAuthError(form: any, error: AuthError) {
  console.error("Auth error:", error);

  let errorType: AuthErrorType = "SERVER_ERROR";
  let message: string = AuthErrorMessages.SERVER_ERROR;

  switch (error.message) {
    case "Email rate limit exceeded":
      errorType = "RATE_LIMITED";
      message = "Too many reset attempts. Please try again later.";
      break;
    case "User not found":
      errorType = "INVALID_EMAIL";
      message = "No account found with this email address";
      break;
    case "Email already in use":
      errorType = "EMAIL_IN_USE";
      message = AuthErrorMessages.EMAIL_IN_USE;
      break;
    default:
      errorType = "SERVER_ERROR";
      message = "Unable to send reset email. Please try again later.";
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
