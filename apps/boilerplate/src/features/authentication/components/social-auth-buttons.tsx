import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";
import { routes } from "@/config";
import { locales } from "@/locales";
import { cn } from "@/lib/utils";
import { GitHubIcon, TwitterIcon } from "./icons";
import { SiweButton } from "./siwe-button";
import type { OAuthProvider } from "@/lib/auth/oauth";

interface SocialAuthButtonsProps {
  mode: "signin" | "signup";
  disabled?: boolean;
  callbackURL?: string;
  availableProviders?: OAuthProvider[];
}

export function SocialAuthButtons({ mode, disabled = false, callbackURL, availableProviders }: SocialAuthButtonsProps) {
  const [loading, setLoading] = useState(false);

  const isLoading = loading || disabled;

  const handleSocialAuth = async (provider: "github" | "twitter") => {
    setLoading(true);
    try {
      await signIn.social(
        {
          provider,
          callbackURL: callbackURL ?? routes.dashboard,
        },
        {
          onRequest: () => setLoading(true),
          onResponse: () => setLoading(false),
        }
      );
    } catch {
      setLoading(false);
    }
  };

  const authLabels = mode === "signin"
    ? {
        github: locales.SocialAuthButtons.signInWithGithub,
        twitter: locales.SocialAuthButtons.signInWithTwitter,
      }
    : {
        github: locales.SocialAuthButtons.signUpWithGithub,
        twitter: locales.SocialAuthButtons.signUpWithTwitter,
      };

  return (
    <>
      <div className="py-4 after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
        <span className="bg-card text-muted-foreground relative z-10 px-2">
          {locales.LoginForm.orContinueWith}
        </span>
      </div>

      <div className={cn("w-full gap-2 flex items-center justify-between flex-col")}>
        {availableProviders?.includes("github") && (
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={isLoading}
            onClick={() => handleSocialAuth("github")}
          >
            <GitHubIcon />
            {authLabels.github}
          </Button>
        )}

        {availableProviders?.includes("twitter") && (
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={isLoading}
            onClick={() => handleSocialAuth("twitter")}
          >
            <TwitterIcon />
            {authLabels.twitter}
          </Button>
        )}

        <SiweButton mode={mode} disabled={isLoading} callbackURL={callbackURL} />
      </div>
    </>
  );
}