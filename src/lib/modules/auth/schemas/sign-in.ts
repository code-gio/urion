import { z } from "zod";

export const signInSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .max(100, "Email must be less than 100 characters")
    .transform((email) => email.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters"),
});

export type SignInSchema = typeof signInSchema;

