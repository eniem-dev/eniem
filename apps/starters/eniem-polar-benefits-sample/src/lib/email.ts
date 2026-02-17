import { Resend } from "resend";
import { render } from "@react-email/render";
import { env } from "@/config";
import { AUTH_CONSTANTS } from "./auth.constants";
import {
  OtpEmail,
  VerificationEmail,
  PasswordResetEmail,
  DeleteAccountEmail,
} from "@/components/emails";

interface SendEmailOptions {
  to: string;
  subject: string;
  template: React.ReactElement;
  debugInfo?: Record<string, string>;
}

async function sendEmail({ to, subject, template, debugInfo }: SendEmailOptions) {
  if (env.isDevelopment) {
    const text = await render(template, { plainText: true });
    console.log(`\n=== EMAIL ===`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    if (debugInfo) {
      Object.entries(debugInfo).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
    }
    console.log(`---`);
    console.log(text);
    console.log(`=============\n`);
    return { success: true };
  }

  const resend = new Resend(env.email.resendApiKey);
  const { error } = await resend.emails.send({
    from: env.email.fromAddress,
    to,
    subject,
    react: template,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return { success: true };
}

export async function sendOtpEmail(email: string, otp: string) {
  return sendEmail({
    to: email,
    subject: "Your verification code",
    template: OtpEmail({
      otp,
      expiresInSeconds: AUTH_CONSTANTS.OTP_EXPIRES_IN_SECONDS,
      brandLogoUrl: env.email.brandLogoUrl,
    }),
    debugInfo: { OTP: otp },
  });
}

export async function sendVerificationEmail(email: string, token: string, url: string) {
  return sendEmail({
    to: email,
    subject: "Verify your email",
    template: VerificationEmail({ url, brandLogoUrl: env.email.brandLogoUrl }),
    debugInfo: { Token: token, "Verification Link": url },
  });
}

export async function sendPasswordResetEmail(email: string, token: string, url: string) {
  return sendEmail({
    to: email,
    subject: "Reset your password",
    template: PasswordResetEmail({
      url,
      expiresInSeconds: AUTH_CONSTANTS.PASSWORD_RESET_EXPIRES_IN_SECONDS,
      brandLogoUrl: env.email.brandLogoUrl,
    }),
    debugInfo: { Token: token, "Reset Link": url },
  });
}

export async function sendDeleteAccountEmail(email: string, token: string, url: string) {
  return sendEmail({
    to: email,
    subject: "Confirm account deletion",
    template: DeleteAccountEmail({
      url,
      brandLogoUrl: env.email.brandLogoUrl,
    }),
    debugInfo: { Token: token, "Confirmation Link": url },
  });
}

export async function addContact(email: string, firstName?: string, lastName?: string) {
  const resend = new Resend(env.email.resendApiKey);
  return resend.contacts.create({
    email: email,
    firstName: firstName,
    lastName: lastName,
  });
}
