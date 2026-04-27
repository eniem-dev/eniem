import { sendEmail } from "@/lib/email/send-email";
import { logger } from "@/lib/logger";

export type UserUrlToken = {
  user: { email: string; id?: string };
  url: string;
  token: string;
};

type UserEmailType = "password-reset" | "verification" | "delete-account";

async function sendUserEmail(
  type: UserEmailType,
  { user, url, token }: UserUrlToken
) {
  await sendEmail({ type, to: user.email, data: { url, token } });
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
  await sendEmail({ type: "otp", to: email, data: { otp } });
}
