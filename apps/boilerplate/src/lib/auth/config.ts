import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { AUTH_CONSTANTS } from "@/lib/auth.constants";
import { prisma } from "@/lib/db";
import {
  onPasswordReset,
  sendResetPassword,
  sendVerificationEmail,
} from "./email-hooks";
import { loggerAdapter } from "./logger-adapter";
import { socialProviders } from "./oauth";
import { rateLimit } from "./rate-limit";
import { userConfig } from "./user-hooks";
import { emailOtpPlugin } from "./plugins/email-otp";
import { polarPlugin } from "./plugins/polar";
import { siwePlugin } from "./plugins/siwe";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  logger: loggerAdapter,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword,
    onPasswordReset,
    resetPasswordTokenExpiresIn: AUTH_CONSTANTS.PASSWORD_RESET_EXPIRES_IN_SECONDS,
  },
  emailVerification: {
    sendVerificationEmail,
    autoSignInAfterVerification: true,
  },
  user: userConfig,
  rateLimit,
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"],
    },
  },
  socialProviders,
  plugins: [emailOtpPlugin, siwePlugin, polarPlugin],
});
