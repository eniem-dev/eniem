"use server";

import { publicly } from "@/lib/handler";
import { newsletterSchema } from "../schemas/newsletter.schema";
import { locales } from "@/locales";
import { logger } from "@/lib/logger";
import { saveEmailToDatabase } from "../services/newsletter.service";

export const subscribeToNewsletterAction = publicly
  .input(newsletterSchema)
  .action(async ({ input: { email } }) => {
    try {
      logger.info("Collecting email for newsletter", { email });

      // Method 1: Save to database (default)
      await saveEmailToDatabase(email);

      // Method 2: Save to email provider (Resend)
      // Uncomment to send emails to your email marketing provider
      // await saveEmailToProvider(email);

      logger.info("Email collected successfully", { email });
      return { success: true, message: locales.LandingPage.newsletter.success };
    } catch {
      throw new Error(locales.LandingPage.newsletter.error);
    }
  });
