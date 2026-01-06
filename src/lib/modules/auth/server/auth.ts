import { createClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_URL } from "$env/static/public";
import { SUPABASE_SERVICE_ROLE_KEY } from "$env/static/private";

/**
 * Supabase Admin Client for server-side auth operations
 * 
 * This client uses the service role key and bypasses Row Level Security (RLS).
 * Use this only for server-side operations that require admin privileges,
 * such as checking username uniqueness or updating user profiles.
 * 
 * ⚠️ NEVER expose this client to the client-side code.
 */
export const supabaseAdmin = createClient(
  PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

