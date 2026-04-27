import { sendEmail } from "@/lib/email/send-email";
import { logger } from "@/lib/logger";

type UserUrlToken = {
  user: { email: string; id?: string };
  url: string;
  token: string;
};

export async function sendResetPassword({ user, url, token }: UserUrlToken) {
  await sendEmail({ type: "password-reset", to: user.email, data: { url, token } });
}

export async function onPasswordReset({ user }: { user: { id: string; email: string } }) {
  logger.info("Password reset successful", {
    userId: user.id,
    email: user.email,
  });
}

export async function sendVerificationEmail({ user, url, token }: UserUrlToken) {
  await sendEmail({ type: "verification", to: user.email, data: { url, token } });
}

export async function sendChangeEmailVerification({ user, url, token }: UserUrlToken) {
  await sendEmail({ type: "verification", to: user.email, data: { url, token } });
}

export async function sendDeleteAccountVerification({ user, url, token }: UserUrlToken) {
  await sendEmail({ type: "delete-account", to: user.email, data: { url, token } });
}

export async function sendOtp({ email, otp }: { email: string; otp: string }) {
  await sendEmail({ type: "otp", to: email, data: { otp } });
}
