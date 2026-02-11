import { z } from "zod";
import { locales } from "@/locales";

export const loginSchema = z.object({
  email: z.email(locales.errors.invalidEmail),
  password: z.string().optional().or(z.literal("")),
  rememberMe: z.boolean().optional(),
  otp: z.string().optional(),
});

export const signupSchema = z
  .object({
    email: z.email(locales.errors.invalidEmail),
    password: z.string().optional().or(z.literal("")),
    passwordConfirmation: z.string().optional().or(z.literal("")),
    otp: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.password && data.password.length > 0) {
        return data.password.length >= 8;
      }
      return true;
    },
    {
      message: locales.errors.passwordTooShort,
      path: ["password"],
    }
  )
  .refine(
    (data) => {
      if (data.password && data.password.length > 0) {
        return data.password === data.passwordConfirmation;
      }
      return true;
    },
    {
      message: locales.errors.passwordMismatch,
      path: ["passwordConfirmation"],
    }
  );

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
