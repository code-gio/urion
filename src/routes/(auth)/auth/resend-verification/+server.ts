import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { csrfProtection } from "$lib/utils/csrf";

const MAX_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

// Store rate limiting data (use Redis in production)
const rateLimitStore = new Map<
  string,
  { count: number; timestamp: number; lastAttempt: number }
>();

const resendSchema = z.object({
  email: z.string().email("Invalid email address"),
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

    // Validate email
    const validation = resendSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ message: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { email } = validation.data;
    const clientIp = getClientAddress();

    // Clean up expired rate limit entries
    cleanupExpiredRateLimits();

    // Check rate limiting
    const rateLimitCheck = checkRateLimit(clientIp, email);
    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({ message: rateLimitCheck.message }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: email,
    });

    if (resendError) {
      recordFailedAttempt(clientIp, email);
      return new Response(
        JSON.stringify({ message: "Failed to resend verification email" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Clear rate limiting on success
    rateLimitStore.delete(getRateLimitKey(clientIp, email));

    return json({ success: true });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

function checkRateLimit(
  clientIp: string,
  email: string
): { allowed: boolean; message: string } {
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
      message: `Please wait ${timeLeft} seconds before requesting another verification email.`,
    };
  }

  return { allowed: true, message: "" };
}

function recordFailedAttempt(clientIp: string, email: string): void {
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

function cleanupExpiredRateLimits() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.timestamp > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(key);
    }
  }
}