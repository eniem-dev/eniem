import { prisma } from "@/lib/db";
import { resend } from "@/lib/email/resend-client";
import { logger } from "@/lib/logger";

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

export async function addNewsletterContact(input: {
  email: string;
  firstName?: string;
  lastName?: string;
}): Promise<{ success: true; data: { id: string } } | { success: false; error: string }> {
  const { data, error } = await resend.contacts.create({
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: { id: data?.id ?? "" } };
}

export async function saveEmailToProvider(email: string): Promise<void> {
  const result = await addNewsletterContact({ email });
  if (!result.success) {
    logger.error("Failed to add contact to email provider", { email, error: result.error });
    throw new Error(`Failed to add contact: ${result.error}`);
  }
}
