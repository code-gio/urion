// src/routes/+layout.server.ts
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({
  locals: { safeGetSession },
  cookies,
}) => {
  const { session, user } = await safeGetSession();

  // Only pass Supabase auth cookies to the client for SSR
  // This prevents exposing all cookies (including potentially sensitive ones) to client-side JS
  const supabaseCookies = cookies
    .getAll()
    .filter((cookie) => cookie.name.startsWith("sb-"));

  return {
    session,
    user,
    cookies: supabaseCookies,
  };
};
