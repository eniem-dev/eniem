import { z } from "zod";
import { locales } from "@/locales";

export const newsletterSchema = z.object({
  email: z.email(locales.errors.invalidEmail),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
