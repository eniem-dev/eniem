import { sendEmail } from "@/lib/email/send-email";
import type { EmailMessage } from "@/lib/email/types";
import { ServerError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export type UserUrlToken = {
  user: { email: string; id?: string };
  url: string;
  token: string;
};

type UserEmailType = "password-reset" | "verification" | "delete-account";

async function sendRequiredAuthEmail(msg: EmailMessage): Promise<void> {
  const result = await sendEmail(msg);

  if (result.success) {
    return;
  }

  logger.error("auth.email.delivery_failed", {
    type: msg.type,
    to: msg.to,
    error: result.error,
  });

  throw new ServerError(`Failed to send ${msg.type} email`);
}

async function sendUserEmail(
  type: UserEmailType,
  { user, url, token }: UserUrlToken
) {
  await sendRequiredAuthEmail({ type, to: user.email, data: { url, token } });
}

export const sendResetPassword = (p: UserUrlToken) =>
  sendUserEmail("password-reset", p);

export const sendVerificationEmail = (p: UserUrlToken) =>
  sendUserEmail("verification", p);

export const sendChangeEmailVerification = (p: UserUrlToken) =>
  sendUserEmail("verification", p);

export const sendDeleteAccountVerification = (p: UserUrlToken) =>
  sendUserEmail("delete-account", p);

export async function onPasswordReset({
  user,
}: {
  user: { id: string; email: string };
}) {
  logger.info("Password reset successful", {
    userId: user.id,
    email: user.email,
  });
}

export async function sendOtp({
  email,
  otp,
}: {
  email: string;
  otp: string;
}) {
  await sendRequiredAuthEmail({ type: "otp", to: email, data: { otp } });
}
