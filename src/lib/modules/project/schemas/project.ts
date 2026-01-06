import { z } from "zod";

export const projectCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be less than 100 characters")
    .trim(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be less than 100 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    )
    .refine((slug) => !slug.startsWith("-") && !slug.endsWith("-"), {
      message: "Slug cannot start or end with a hyphen",
    })
    .refine((slug) => !slug.includes("--"), {
      message: "Slug cannot contain consecutive hyphens",
    }),
  website_url: z
    .union([
      z.string().url("Must be a valid URL").max(500, "URL must be less than 500 characters"),
      z.literal(""),
    ])
    .optional()
    .nullable(),
});

export type ProjectCreateSchema = z.infer<typeof projectCreateSchema>;

