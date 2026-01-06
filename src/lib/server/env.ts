import { z } from "zod";
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_PUBLISHABLE_KEY,
} from "$env/static/public";
import { SUPABASE_SERVICE_ROLE_KEY } from "$env/static/private";

/**
 * Environment variable validation schema
 *
 * This ensures all required environment variables are present and properly formatted
 * at build/startup time, preventing runtime errors from misconfiguration.
 */

const envSchema = z.object({
  // Public Supabase configuration
  PUBLIC_SUPABASE_URL: z
    .string()
    .url({ message: "PUBLIC_SUPABASE_URL must be a valid URL" })
    .startsWith("https://", "PUBLIC_SUPABASE_URL must use HTTPS"),

  PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "PUBLIC_SUPABASE_PUBLISHABLE_KEY is required"),
  // Private Supabase configuration
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
});

/**
 * Validated environment variables
 * This will throw an error at startup if validation fails
 */
export const env = (() => {
  try {
    return envSchema.parse({
      PUBLIC_SUPABASE_URL,
      PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      SUPABASE_SERVICE_ROLE_KEY,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((err: z.ZodIssue) => `  - ${err.path.join(".")}: ${err.message}`)
        .join("\n");

      throw new Error(
        `❌ Environment variable validation failed:\n\n${errorMessages}\n\nPlease check your .env file and ensure all required variables are set correctly.`
      );
    }
    throw error;
  }
})();

/**
 * Type-safe environment variables
 * Use this throughout your app instead of importing from $env directly
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Helper to check if we're in development mode
 */
export const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Helper to check if we're in production mode
 */
export const isProduction = process.env.NODE_ENV === "production";
