import { z } from "zod";
import { locales } from "@/locales";

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export const createBoardSchema = z.object({
  name: z
    .string()
    .min(1, locales.errors.boardNameRequired)
    .max(100, locales.errors.boardNameTooLong),
  slug: z
    .string()
    .min(3, locales.errors.boardSlugTooShort)
    .max(50, locales.errors.boardSlugTooLong)
    .regex(SLUG_REGEX, locales.errors.boardSlugInvalid),
  description: z
    .string()
    .max(500, locales.errors.boardDescriptionTooLong)
    .optional(),
});

export const updateBoardSchema = z.object({
  boardId: z.string().cuid(locales.errors.boardIdRequired),
  name: z
    .string()
    .min(1, locales.errors.boardNameRequired)
    .max(100, locales.errors.boardNameTooLong)
    .optional(),
  description: z
    .string()
    .max(500, locales.errors.boardDescriptionTooLong)
    .optional(),
});

export const deleteBoardSchema = z.object({
  boardId: z.string().cuid(locales.errors.boardIdRequired),
});

export const restoreBoardSchema = z.object({
  boardId: z.string().cuid(locales.errors.boardIdRequired),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
export type DeleteBoardInput = z.infer<typeof deleteBoardSchema>;
export type RestoreBoardInput = z.infer<typeof restoreBoardSchema>;
