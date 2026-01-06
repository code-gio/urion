import { z } from "zod";

export const profileUpdateSchema = z.object({
  full_name: z
    .string()
    .max(100, "Full name must be less than 100 characters")
    .optional()
    .nullable(),
  display_name: z
    .string()
    .max(50, "Display name must be less than 50 characters")
    .optional()
    .nullable(),
  bio: z
    .string()
    .max(500, "Bio must be less than 500 characters")
    .optional()
    .nullable(),
  avatar_url: z
    .string()
    .url("Must be a valid URL")
    .max(500, "Avatar URL must be less than 500 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type ProfileUpdateSchema = z.infer<typeof profileUpdateSchema>;

