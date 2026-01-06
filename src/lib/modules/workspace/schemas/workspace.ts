import { z } from "zod";

export const workspaceCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(100, "Workspace name must be less than 100 characters")
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
});

export type WorkspaceCreateSchema = z.infer<typeof workspaceCreateSchema>;

