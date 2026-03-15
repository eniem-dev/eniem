import { z } from "zod";
import { locales } from "@/locales";

export const createIdeaSchema = z.object({
  boardId: z.string().cuid(locales.errors.boardIdRequired),
  title: z
    .string()
    .min(1, locales.errors.ideaTitleRequired)
    .max(200, locales.errors.ideaTitleTooLong),
  description: z
    .string()
    .max(2000, locales.errors.ideaDescriptionTooLong)
    .optional(),
});

export const updateIdeaSchema = z.object({
  ideaId: z.string().cuid(locales.errors.ideaIdRequired),
  title: z
    .string()
    .min(1, locales.errors.ideaTitleRequired)
    .max(200, locales.errors.ideaTitleTooLong)
    .optional(),
  description: z
    .string()
    .max(2000, locales.errors.ideaDescriptionTooLong)
    .optional(),
});

export const deleteIdeaSchema = z.object({
  ideaId: z.string().cuid(locales.errors.ideaIdRequired),
});

export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;
export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>;
export type DeleteIdeaInput = z.infer<typeof deleteIdeaSchema>;
