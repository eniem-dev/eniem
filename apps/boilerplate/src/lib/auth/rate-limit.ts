import type { BetterAuthOptions } from "better-auth";

export const rateLimit: BetterAuthOptions["rateLimit"] = {
  enabled: true,
  window: 60,
  max: 100,
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
};
