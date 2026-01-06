import { z } from "zod";

export const magicLinkSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(100, "Email must be less than 100 characters")
    .transform((email) => email.toLowerCase().trim()),
});

export type MagicLinkSchema = typeof magicLinkSchema;

