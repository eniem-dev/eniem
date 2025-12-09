"use server";

import { actionClient } from "@/lib/safe-action.server";
import { newsletterSchema } from "../schemas/newsletter.schema";
import { prisma } from "@/lib/db";
import { locales } from "@/locales";
import { logger } from "@/lib/logger";

const isDuplicateEmailError = (error: unknown): boolean => {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    (error as any).code === "P2002"
  );
};

export const subscribeAction = actionClient
  .inputSchema(newsletterSchema)
  .action(async ({ parsedInput: { email } }) => {
    try {
      logger.info("Collecting email for landing page", { email });

      await prisma.collectedEmail.create({ data: { email } });

      logger.info("Email collected successfully", { email });
      return { success: true, message: locales.LandingPage.newsletter.success };
    } catch (error: unknown) {
      if (isDuplicateEmailError(error)) {
        logger.info("Email already subscribed", { email });
        return {
          success: true,
          message: locales.LandingPage.newsletter.alreadySubscribed,
        };
      }

      logger.error("Email collection failed", { email, error });
      throw new Error(locales.LandingPage.newsletter.error);
    }
  });
