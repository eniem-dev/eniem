import { betterAuth } from "better-auth";
import { emailOTP, siwe } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { verifyMessage } from "viem";
import { generateSiweNonce } from "viem/siwe";
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";

import {
  sendOtpEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendDeleteAccountEmail,
} from "./email";
import { logger } from "./logger";
import { env } from "@/config";
import { prisma } from "./db";
import { polarClient } from "./polar";
// eslint-disable-next-line no-restricted-imports -- auth.ts is the integration point between BetterAuth and Polar subscription features
import { syncSubscription, getCheckoutProducts } from "@/features/subscription";
import { AUTH_CONSTANTS } from "./auth.constants";

export { AUTH_CONSTANTS };

export type OAuthProvider = "github" | "twitter";

export function getAvailableOAuthProviders(): OAuthProvider[] {
  const providers: OAuthProvider[] = [];
  if (env.oauth.github.clientId && env.oauth.github.clientSecret) {
    providers.push("github");
  }
  if (env.oauth.twitter.clientId && env.oauth.twitter.clientSecret) {
    providers.push("twitter");
  }
  return providers;
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  logger: {
    level: "info",
    log: (level, message, ...args) => {
      switch (level) {
        case "error":
          logger.error(message, { metadata: args });
          break;
        case "warn":
          logger.warn(message, { metadata: args });
          break;
        case "info":
          logger.info(message, { metadata: args });
          break;
        default:
          logger.log(message, { metadata: args });
          break;
      }
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url, token }) => {
      await sendPasswordResetEmail(user.email, token, url);
    },
    onPasswordReset: async ({ user }) => {
      logger.info("Password reset successful", {
        userId: user.id,
        email: user.email,
      });
    },
    resetPasswordTokenExpiresIn: AUTH_CONSTANTS.PASSWORD_RESET_EXPIRES_IN_SECONDS,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      await sendVerificationEmail(user.email, token, url);
    },
    autoSignInAfterVerification: true,
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user, url, token }) => {
        // verification email must be sent to the current user email to approve the change
        await sendVerificationEmail(user.email, token, url);
      },
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url, token }) => {
        await sendDeleteAccountEmail(user.email, token, url);
      },
      afterDelete: async (user) => {
        logger.info("User deleted, cleaning up Polar customer", { userId: user.id });
        try {
          await polarClient.customers.deleteExternal({ externalId: user.id });
          logger.info("Polar customer deleted successfully", { userId: user.id });
        } catch (error) {
          logger.error("Failed to delete Polar customer", {
            userId: user.id,
            error: error instanceof Error ? error.message : error,
          });
        }
      },
    },
  },

  rateLimit: {
    enabled: true, // Enable rate limiting in all environments
    window: 60, // 60 seconds window
    max: 100, // max 100 requests per window
    storage: "database",
    modelName: "rateLimit",
    customRules: {
      "/sign-in/email": {
        window: 10,
        max: 3,
      },
      "/sign-up/email": {
        window: 10,
        max: 3,
      },
      "/email-otp/send-verification-otp": {
        window: 60,
        max: 3,
      },
      "/sign-in/email-otp": {
        window: 10,
        max: 3,
      },
    },
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"],
    },
  },
  socialProviders: {
    github: {
      clientId: env.oauth.github.clientId as string,
      clientSecret: env.oauth.github.clientSecret as string,
    },
    twitter: {
      clientId: env.oauth.twitter.clientId as string,
      clientSecret: env.oauth.twitter.clientSecret as string,
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        await sendOtpEmail(email, otp);
      },
      otpLength: AUTH_CONSTANTS.OTP_LENGTH,
      expiresIn: AUTH_CONSTANTS.OTP_EXPIRES_IN_SECONDS,
      allowedAttempts: AUTH_CONSTANTS.OTP_MAX_ATTEMPTS,
    }),
    siwe({
      domain: new URL(env.projectUrl).hostname,
      emailDomainName: new URL(env.projectUrl).hostname,
      anonymous: true,
      getNonce: async () => {
        return generateSiweNonce();
      },
      verifyMessage: async ({ message, signature, address }) => {
        try {
          const isValid = await verifyMessage({
            address: address as `0x${string}`,
            message,
            signature: signature as `0x${string}`,
          });
          return isValid;
        } catch (error) {
          logger.error("SIWE verification failed", { error, address });
          return false;
        }
      },
    }),
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: getCheckoutProducts(env.payment.polarServer),
          successUrl: "/success?checkout_id={CHECKOUT_ID}",
          authenticatedUsersOnly: true,
        }),
        portal(),
        usage(),
        webhooks({
          secret: env.payment.polarWebhookSecret,
          onCustomerStateChanged: async (payload) => {
            const { externalId, activeSubscriptions } = payload.data;
            logger.info("Polar: Customer state changed", { externalId, payload });

            if (externalId) {
              await syncSubscription(externalId, activeSubscriptions || []);
            }

            logger.info("Polar: Customer state changed", { payload });
          },
          onOrderPaid: async (payload) => {
            logger.info("Polar: Order paid", {
              orderId: payload.data.id,
              userId: payload.data.customer?.externalId,
              product: payload.data.product.name,
            });
          },
          onPayload: async (payload) => {
            logger.info("Polar: Webhook received", { payload });
          },
        }),
      ],
    }),
  ],
});
