import { z } from "zod";
import type { WorkspaceRole } from "$lib/types";

export const memberInviteSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Must be a valid email address")
    .max(100, "Email must be less than 100 characters")
    .transform((email) => email.toLowerCase().trim()),
  role: z.enum(["owner", "admin", "member", "viewer"] as const) as z.ZodType<WorkspaceRole>,
});

export type MemberInviteSchema = z.infer<typeof memberInviteSchema>;

