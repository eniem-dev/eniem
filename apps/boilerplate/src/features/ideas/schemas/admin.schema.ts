import { z } from "zod";
import { locales } from "@/locales";

const IdeaStatus = z.enum(["OPEN", "PLANNED", "DONE"], {
  message: locales.errors.ideaStatusInvalid,
});

export const updateIdeaStatusSchema = z.object({
  ideaId: z.string().cuid(locales.errors.ideaIdRequired),
  status: IdeaStatus,
});

export const setAdminResponseSchema = z.object({
  ideaId: z.string().cuid(locales.errors.ideaIdRequired),
  response: z
    .string()
    .max(2000, locales.errors.adminResponseTooLong)
    .nullable(),
});

export type UpdateIdeaStatusInput = z.infer<typeof updateIdeaStatusSchema>;
export type SetAdminResponseInput = z.infer<typeof setAdminResponseSchema>;
