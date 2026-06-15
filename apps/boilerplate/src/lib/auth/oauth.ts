import { env } from "@/config";

export type OAuthProvider = "github" | "twitter";

type OAuthCredentials = { clientId: string; clientSecret: string };

function readCredentials(
  clientId: string | undefined,
  clientSecret: string | undefined
): OAuthCredentials | null {
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

const githubCredentials = readCredentials(
  env.oauth.github.clientId,
  env.oauth.github.clientSecret
);
const twitterCredentials = readCredentials(
  env.oauth.twitter.clientId,
  env.oauth.twitter.clientSecret
);

export function getAvailableOAuthProviders(): OAuthProvider[] {
  const providers: OAuthProvider[] = [];
  if (githubCredentials) providers.push("github");
  if (twitterCredentials) providers.push("twitter");
  return providers;
}

export const socialProviders = {
  ...(githubCredentials && { github: githubCredentials }),
  ...(twitterCredentials && { twitter: twitterCredentials }),
};
