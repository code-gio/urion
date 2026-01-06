import { z } from "zod";

export const resentEmailSchema = z.object({
  email: z.email(),
});

export type ResentEmailSchema = typeof resentEmailSchema;

