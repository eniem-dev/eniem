import { render } from "@react-email/render";
import { env } from "@/config";
import { AUTH_CONSTANTS } from "../auth.constants";
import { logger } from "../logger";
import {
  OtpEmail,
  VerificationEmail,
  PasswordResetEmail,
  DeleteAccountEmail,
} from "@/components/emails";
import { getResend } from "./resend-client";
import type { EmailMessage, EmailResult } from "./types";

interface RenderedMessage {
  subject: string;
  template: React.ReactElement;
  debugInfo: Record<string, string>;
}

function renderMessage(msg: EmailMessage): RenderedMessage {
  switch (msg.type) {
    case "otp":
      return {
        subject: "Your verification code",
        template: OtpEmail({
          otp: msg.data.otp,
          expiresInSeconds: AUTH_CONSTANTS.OTP_EXPIRES_IN_SECONDS,
          brandLogoUrl: env.email.brandLogoUrl,
        }),
        debugInfo: { OTP: msg.data.otp },
      };
    case "verification":
      return {
        subject: "Verify your email",
        template: VerificationEmail({
          url: msg.data.url,
          brandLogoUrl: env.email.brandLogoUrl,
        }),
        debugInfo: { Token: msg.data.token, "Verification Link": msg.data.url },
      };
    case "password-reset":
      return {
        subject: "Reset your password",
        template: PasswordResetEmail({
          url: msg.data.url,
          expiresInSeconds: AUTH_CONSTANTS.PASSWORD_RESET_EXPIRES_IN_SECONDS,
          brandLogoUrl: env.email.brandLogoUrl,
        }),
        debugInfo: { Token: msg.data.token, "Reset Link": msg.data.url },
      };
    case "delete-account":
      return {
        subject: "Confirm account deletion",
        template: DeleteAccountEmail({
          url: msg.data.url,
          brandLogoUrl: env.email.brandLogoUrl,
        }),
        debugInfo: { Token: msg.data.token, "Confirmation Link": msg.data.url },
      };
  }
}

export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  const { subject, template, debugInfo } = renderMessage(msg);

  if (env.isDevelopment) {
    const text = await render(template, { plainText: true });
    logger.info("email.dev", {
      to: msg.to,
      type: msg.type,
      subject,
      ...debugInfo,
      body: text,
    });
    return { success: true };
  }

  const { error } = await getResend().emails.send({
    from: env.email.fromAddress,
    to: msg.to,
    subject,
    react: template,
  });

  return error
    ? { success: false, error: { code: "send_failed", message: error.message } }
    : { success: true };
}
