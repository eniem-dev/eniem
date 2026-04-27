import { env } from "@/config";

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

export const socialProviders = {
  github: {
    clientId: env.oauth.github.clientId as string,
    clientSecret: env.oauth.github.clientSecret as string,
  },
  twitter: {
    clientId: env.oauth.twitter.clientId as string,
    clientSecret: env.oauth.twitter.clientSecret as string,
  },
};
