import { Box, Text } from "ink";
import React, { useState } from "react";
import { Confirm, TextInput } from "../components/index.js";

interface OAuthProvider {
  clientId: string;
  clientSecret: string;
}

interface OAuthConfig {
  github?: OAuthProvider;
  twitter?: OAuthProvider;
}

interface OAuthSetupProps {
  onComplete: (config: OAuthConfig) => void;
}

type Step =
  | "github_enable"
  | "github_id"
  | "github_secret"
  | "twitter_enable"
  | "twitter_id"
  | "twitter_secret"
  | "done";

export const OAuthSetup = ({ onComplete }: OAuthSetupProps) => {
  const [step, setStep] = useState<Step>("github_enable");
  const [githubEnabled, setGithubEnabled] = useState(false);
  const [githubId, setGithubId] = useState("");
  const [githubSecret, setGithubSecret] = useState("");
  const [twitterEnabled, setTwitterEnabled] = useState(false);
  const [twitterId, setTwitterId] = useState("");
  const [twitterSecret, setTwitterSecret] = useState("");

  const handleGithubEnable = (confirmed: boolean) => {
    setGithubEnabled(confirmed);
    setStep(confirmed ? "github_id" : "twitter_enable");
  };

  const handleGithubIdSubmit = (value: string) => {
    setGithubId(value.trim());
    setStep("github_secret");
  };

  const handleGithubSecretSubmit = (value: string) => {
    setGithubSecret(value.trim());
    setStep("twitter_enable");
  };

  const handleTwitterEnable = (confirmed: boolean) => {
    setTwitterEnabled(confirmed);
    if (confirmed) {
      setStep("twitter_id");
    } else {
      setStep("done");
      finalize(false);
    }
  };

  const handleTwitterIdSubmit = (value: string) => {
    setTwitterId(value.trim());
    setStep("twitter_secret");
  };

  const handleTwitterSecretSubmit = (value: string) => {
    setTwitterSecret(value.trim());
    setStep("done");
    finalize(true, value.trim());
  };

  const finalize = (twitterDone: boolean, finalTwitterSecret?: string) => {
    const config: OAuthConfig = {};
    if (githubEnabled && githubId && githubSecret) {
      config.github = { clientId: githubId, clientSecret: githubSecret };
    }
    if (twitterDone && twitterId && finalTwitterSecret) {
      config.twitter = { clientId: twitterId, clientSecret: finalTwitterSecret };
    }
    onComplete(config);
  };

  return (
    <Box flexDirection="column">
      <Text bold color="magenta">
        OAuth Providers
      </Text>

      {step === "github_enable" && (
        <Confirm label="Enable GitHub OAuth?" onConfirm={handleGithubEnable} />
      )}

      {step !== "github_enable" && (
        <Text color={githubEnabled ? "green" : "yellow"}>
          {githubEnabled ? "✓" : "○"} GitHub: {githubEnabled ? "Enabled" : "Skipped"}
        </Text>
      )}

      {step === "github_id" && (
        <TextInput
          label="GitHub Client ID"
          value={githubId}
          onChange={setGithubId}
          onSubmit={handleGithubIdSubmit}
          placeholder="Ov23li..."
        />
      )}

      {step === "github_secret" && (
        <TextInput
          label="GitHub Client Secret"
          value={githubSecret}
          onChange={setGithubSecret}
          onSubmit={handleGithubSecretSubmit}
          placeholder="secret_..."
          mask="*"
        />
      )}

      {step !== "github_enable" &&
        step !== "github_id" &&
        step !== "github_secret" &&
        githubEnabled && (
          <Text color="green">✓ GitHub credentials configured</Text>
        )}

      {(step === "twitter_enable" ||
        step === "twitter_id" ||
        step === "twitter_secret" ||
        step === "done") && (
        <>
          {step === "twitter_enable" && (
            <Confirm label="Enable Twitter OAuth?" onConfirm={handleTwitterEnable} />
          )}

          {step !== "twitter_enable" && (
            <Text color={twitterEnabled ? "green" : "yellow"}>
              {twitterEnabled ? "✓" : "○"} Twitter: {twitterEnabled ? "Enabled" : "Skipped"}
            </Text>
          )}

          {step === "twitter_id" && (
            <TextInput
              label="Twitter Client ID"
              value={twitterId}
              onChange={setTwitterId}
              onSubmit={handleTwitterIdSubmit}
              placeholder="..."
            />
          )}

          {step === "twitter_secret" && (
            <TextInput
              label="Twitter Client Secret"
              value={twitterSecret}
              onChange={setTwitterSecret}
              onSubmit={handleTwitterSecretSubmit}
              placeholder="..."
              mask="*"
            />
          )}

          {step === "done" && twitterEnabled && (
            <Text color="green">✓ Twitter credentials configured</Text>
          )}
        </>
      )}
    </Box>
  );
};
