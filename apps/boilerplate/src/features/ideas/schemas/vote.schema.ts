import { z } from "zod";
import { locales } from "@/locales";

export const toggleVoteSchema = z.object({
  ideaId: z.string().cuid(locales.errors.ideaIdRequired),
});

export type ToggleVoteInput = z.infer<typeof toggleVoteSchema>;
