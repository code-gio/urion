import type { RequestEvent } from "@sveltejs/kit";

/**
 * CSRF Protection Utility
 *
 * SvelteKit form actions have built-in CSRF protection, but API endpoints
 * (+server.ts) do not. This utility provides origin-based CSRF protection
 * for API routes.
 */

/**
 * Verify that the request origin matches the expected origin
 * @param event - SvelteKit request event
 * @param allowApiToken - If true, allows requests with valid API token header
 * @returns true if origin is valid, false otherwise
 */
export function verifyCsrfToken(event: RequestEvent, allowApiToken: boolean = false): boolean {
  // Only check for state-changing methods
  const method = event.request.method.toUpperCase();
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    return true; // GET, HEAD, OPTIONS are safe
  }

  // If API token is allowed, check for valid token header
  if (allowApiToken) {
    const apiToken = event.request.headers.get("x-api-token");
    // TODO: Implement API token validation if needed
    // For now, we'll rely on session-based auth for API endpoints
  }

  const origin = event.request.headers.get("origin");
  const host = event.request.headers.get("host");

  // If no origin header, check referer as fallback
  if (!origin) {
    const referer = event.request.headers.get("referer");
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const expectedHost = event.url.host;
        return refererUrl.host === expectedHost;
      } catch {
        return false;
      }
    }
    // For authenticated API requests, allow if user is authenticated
    // This allows programmatic API access while still protecting against CSRF
    // The session check in the endpoint handler provides the security
    return false;
  }

  // Check if origin matches the expected host
  try {
    const originUrl = new URL(origin);
    const expectedHost = event.url.host;
    return originUrl.host === expectedHost;
  } catch {
    return false;
  }
}

/**
 * Middleware function to protect API endpoints from CSRF attacks
 * Returns an error response if CSRF check fails
 * @param event - SvelteKit request event
 * @param allowApiToken - If true, allows requests with valid API token header
 */
export function csrfProtection(event: RequestEvent, allowApiToken: boolean = false): Response | null {
  if (!verifyCsrfToken(event, allowApiToken)) {
    return new Response(
      JSON.stringify({
        message: "Invalid request origin. CSRF validation failed.",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  return null;
}

/**
 * Check if the request is from the same origin
 * Useful for additional security checks
 */
export function isSameOrigin(event: RequestEvent): boolean {
  const origin = event.request.headers.get("origin");
  if (!origin) return false;

  try {
    const originUrl = new URL(origin);
    return originUrl.host === event.url.host;
  } catch {
    return false;
  }
}
