import { z } from "zod";

export const signUpSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters")
    .regex(
      /^[a-zA-Z\s-']+$/,
      "First name can only contain letters, spaces, hyphens, and apostrophes"
    ),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters")
    .regex(
      /^[a-zA-Z\s-']+$/,
      "Last name can only contain letters, spaces, hyphens, and apostrophes"
    ),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens"
    )
    .transform((username) => username.toLowerCase().trim())
    .refine((username) => username.length >= 3, {
      message: "Username must be at least 3 characters after trimming",
    })
    .refine((username) => /^[a-zA-Z0-9_-]+$/.test(username), {
      message: "Username can only contain letters, numbers, underscores, and hyphens",
    })
    .refine((username) => /^[a-zA-Z]/.test(username), {
      message: "Username must start with a letter",
    })
    .refine((username) => !/[_-]$/.test(username), {
      message: "Username cannot end with underscore or hyphen",
    })
    .refine((username) => !/[_-]{2,}/.test(username), {
      message: "Username cannot have consecutive underscores or hyphens",
    }),
  email: z
    .string()
    .email("Invalid email address")
    .max(100, "Email must be less than 100 characters")
    .transform((email) => email.toLowerCase().trim()),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(100, "Password must be less than 100 characters"),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
    path: ["agreeToTerms"],
  }),
});

export type SignUpSchema = typeof signUpSchema;

