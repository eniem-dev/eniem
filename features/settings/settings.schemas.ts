import { z } from "zod";
import { locales } from "@/locales";
import { env } from "@/config";

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, locales.errors.nameRequired)
    .max(50, locales.errors.displayNameTooLong)
    .optional(),
  email: z.email(locales.errors.invalidEmail).optional(),
});

export const updateDisplayNameSchema = z.object({
  displayName: z
    .string()
    .min(1, locales.errors.nameRequired)
    .max(50, locales.errors.displayNameTooLong),
});

export const updateEmailSchema = z.object({
  email: z.email(locales.errors.invalidEmail),
});

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, locales.errors.currentPasswordRequired),
    newPassword: z.string().min(8, locales.errors.passwordTooShort),
    confirmPassword: z.string().min(1, locales.errors.confirmPasswordRequired),
    revokeOtherSessions: z.boolean().optional(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: locales.errors.passwordMismatch,
    path: ["confirmPassword"],
  });

export const updateImageSchema = () =>
  z.object({
    image: z
      .any()
      .refine((file) => {
        if (!file || file.size === 0) return false;
        return file.type?.startsWith("image/");
      }, locales.errors.fileRequired)
      .refine((file) => file.size <= env.upload.maxFileSizeBytes, {
        message: locales.errors.fileTooLarge,
      }),
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateDisplayNameInput = z.infer<typeof updateDisplayNameSchema>;
export type UpdateEmailInput = z.infer<typeof updateEmailSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type UpdateImageInput = z.infer<ReturnType<typeof updateImageSchema>>;
