import { createAuthClient } from "better-auth/react";
import { emailOTPClient, siweClient } from "better-auth/client/plugins";
import { polarClient } from "@polar-sh/better-auth";
import { env } from "@/config";
import { locales } from "@/locales";

export const authClient = createAuthClient({
  baseURL: env.projectUrl,
  plugins: [emailOTPClient(), siweClient(), polarClient()],
  fetchOptions: {
    onError: async (context) => {
      const { response } = context;
      if (response.status === 429) {
        const retryAfter = response.headers.get("X-Retry-After");
        if (retryAfter) {
          const message = locales.errors.rateLimitRetryAfter.replace(
            "{seconds}",
            retryAfter
          );
          console.warn("Rate limit exceeded:", message);
        } else {
          console.warn("Rate limit exceeded:", locales.errors.rateLimitExceeded);
        }
      }
    },
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
