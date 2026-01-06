// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./lib/types/database.types";

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient<Database>;
			safeGetSession: () => Promise<{
				session: import("@supabase/supabase-js").Session | null;
				user: import("@supabase/supabase-js").User | null;
			}>;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
