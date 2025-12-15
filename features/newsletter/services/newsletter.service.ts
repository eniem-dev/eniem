import { prisma } from "@/lib/db";
import { addContact } from "@/lib/email";
import { logger } from "@/lib/logger";
import { locales } from "@/locales";

const isDuplicateEmailError = (error: unknown): boolean => {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
};

export async function saveEmailToDatabase(email: string): Promise<void> {
  try {
    await prisma.collectedEmail.create({ data: { email } });
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      logger.info("Email already exists in database", { email });
    }
    throw error;
  }
}
export async function saveEmailToProvider(email: string): Promise<void> {
  const { error } = await addContact(email);
  if (error) {
    logger.error("Failed to add contact to email provider", { email, error });
    throw new Error(`Failed to add contact: ${error.message}`);
  }
}
