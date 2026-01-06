import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { changePasswordForm } from "$lib/modules/auth/schemas/change-password";
import { z } from "zod";
import { csrfProtection } from "$lib/utils/csrf";

const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

// Store rate limiting data (use Redis in production)
const rateLimitStore = new Map<
  string,
  { count: number; timestamp: number }
>();

// Server-side validation schema (we only receive password, not repeat)
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password must be less than 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
});

export const POST: RequestHandler = async (event) => {
  // CSRF Protection
  const csrfError = csrfProtection(event);
  if (csrfError) return csrfError;

  try {
    const body = await event.request.json();
    const {
      locals: { supabase },
      getClientAddress,
    } = event;

    const clientIp = getClientAddress();

    // Clean up expired rate limit entries
    cleanupExpiredRateLimits();

    // Check rate limiting
    const rateLimitCheck = checkRateLimit(clientIp);
    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({ message: rateLimitCheck.message }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate password
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return new Response(
        JSON.stringify({
          message: firstError.message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { password } = validation.data;

    const { data, error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      recordFailedAttempt(clientIp);
      return new Response(
        JSON.stringify({ message: "Failed to update password" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Clear rate limiting on success
    rateLimitStore.delete(clientIp);

    return json({ success: true });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

function checkRateLimit(
  clientIp: string
): { allowed: boolean; message: string } {
  const now = Date.now();
  const rateLimit = rateLimitStore.get(clientIp);

  if (!rateLimit) {
    return { allowed: true, message: "" };
  }

  // Check if we're still within the rate limit window
  if (now - rateLimit.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitStore.delete(clientIp);
    return { allowed: true, message: "" };
  }

  // Check attempt count
  if (rateLimit.count >= MAX_ATTEMPTS) {
    const timeLeft = Math.ceil(
      (RATE_LIMIT_WINDOW - (now - rateLimit.timestamp)) / 1000 / 60
    );
    return {
      allowed: false,
      message: `Too many password reset attempts. Please try again in ${timeLeft} minutes.`,
    };
  }

  return { allowed: true, message: "" };
}

function recordFailedAttempt(clientIp: string): void {
  const now = Date.now();
  const current = rateLimitStore.get(clientIp);

  if (!current) {
    rateLimitStore.set(clientIp, {
      count: 1,
      timestamp: now,
    });
    return;
  }

  current.count += 1;
}

function cleanupExpiredRateLimits() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.timestamp > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(key);
    }
  }
}
