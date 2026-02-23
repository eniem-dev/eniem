import { Box } from "ink";
import React, { useState } from "react";
import { Confirm, TextInput, SectionHeader, StatusMessage } from "../components/index.js";
import type { OAuthConfig, Web3Config } from "../config/types.js";

interface AuthSetupResult {
  oauth: OAuthConfig;
  web3: Web3Config;
  authSecret: string;
}

interface OAuthSetupProps {
  onComplete: (config: AuthSetupResult) => void;
}

type Step =
  | "github_enable"
  | "github_id"
  | "github_secret"
  | "twitter_enable"
  | "twitter_id"
  | "twitter_secret"
  | "web3_enable"
  | "web3_projectId"
  | "auth_secret"
  | "done";

export const OAuthSetup = ({ onComplete }: OAuthSetupProps) => {
  const [step, setStep] = useState<Step>("github_enable");
  const [githubEnabled, setGithubEnabled] = useState(false);
  const [githubId, setGithubId] = useState("");
  const [githubSecret, setGithubSecret] = useState("");
  const [twitterEnabled, setTwitterEnabled] = useState(false);
  const [twitterId, setTwitterId] = useState("");
  const [twitterSecret, setTwitterSecret] = useState("");
  const [web3Enabled, setWeb3Enabled] = useState(false);
  const [web3ProjectId, setWeb3ProjectId] = useState("");
  const [authSecret, setAuthSecret] = useState("");

  const handleGithubEnable = (confirmed: boolean) => {
    setGithubEnabled(confirmed);
    setStep(confirmed ? "github_id" : "twitter_enable");
  };

  const handleGithubIdSubmit = (value: string) => {
    if (!value.trim()) return;
    setGithubId(value.trim());
    setStep("github_secret");
  };

  const handleGithubSecretSubmit = (value: string) => {
    if (!value.trim()) return;
    setGithubSecret(value.trim());
    setStep("twitter_enable");
  };

  const handleTwitterEnable = (confirmed: boolean) => {
    setTwitterEnabled(confirmed);
    setStep(confirmed ? "twitter_id" : "web3_enable");
  };

  const handleTwitterIdSubmit = (value: string) => {
    if (!value.trim()) return;
    setTwitterId(value.trim());
    setStep("twitter_secret");
  };

  const handleTwitterSecretSubmit = (value: string) => {
    if (!value.trim()) return;
    setTwitterSecret(value.trim());
    setStep("web3_enable");
  };

  const handleWeb3Enable = (confirmed: boolean) => {
    setWeb3Enabled(confirmed);
    setStep(confirmed ? "web3_projectId" : "auth_secret");
  };

  const handleWeb3ProjectIdSubmit = (value: string) => {
    if (!value.trim()) return;
    setWeb3ProjectId(value.trim());
    setStep("auth_secret");
  };

  const handleAuthSecretSubmit = (value: string) => {
    const secret = value.trim();
    setAuthSecret(secret);
    setStep("done");
    finalize(secret);
  };

  const finalize = (finalAuthSecret: string) => {
    const oauth: OAuthConfig = {};
    if (githubEnabled && githubId && githubSecret) {
      oauth.github = { clientId: githubId, clientSecret: githubSecret };
    }
    if (twitterEnabled && twitterId && twitterSecret) {
      oauth.twitter = { clientId: twitterId, clientSecret: twitterSecret };
    }
    const web3: Web3Config = {
      enabled: web3Enabled,
      walletConnectProjectId: web3Enabled ? web3ProjectId : undefined,
    };
    onComplete({ oauth, web3, authSecret: finalAuthSecret });
  };

  // Helper to check if we've passed a certain step
  const stepOrder: Step[] = [
    "github_enable", "github_id", "github_secret",
    "twitter_enable", "twitter_id", "twitter_secret",
    "web3_enable", "web3_projectId",
    "auth_secret", "done"
  ];
  const currentStepIndex = stepOrder.indexOf(step);
  const isPast = (s: Step) => currentStepIndex > stepOrder.indexOf(s);

  return (
    <Box flexDirection="column">
      <SectionHeader title="OAuth Providers" />

      {/* GitHub section */}
      {step === "github_enable" && (
        <Confirm label="Enable GitHub OAuth?" onConfirm={handleGithubEnable} />
      )}

      {isPast("github_enable") && (
        <StatusMessage status={githubEnabled ? "success" : "skip"}>
          GitHub: {githubEnabled ? "Enabled" : "Skipped"}
        </StatusMessage>
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

      {isPast("github_secret") && githubEnabled && (
        <StatusMessage status="success">GitHub credentials configured</StatusMessage>
      )}

      {/* Twitter section */}
      {step === "twitter_enable" && (
        <Confirm label="Enable Twitter OAuth?" onConfirm={handleTwitterEnable} />
      )}

      {isPast("twitter_enable") && (
        <StatusMessage status={twitterEnabled ? "success" : "skip"}>
          Twitter: {twitterEnabled ? "Enabled" : "Skipped"}
        </StatusMessage>
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

      {isPast("twitter_secret") && twitterEnabled && (
        <StatusMessage status="success">Twitter credentials configured</StatusMessage>
      )}

      {/* Web3 section */}
      {step === "web3_enable" && (
        <Confirm label="Enable WalletConnect?" onConfirm={handleWeb3Enable} />
      )}

      {isPast("web3_enable") && (
        <StatusMessage status={web3Enabled ? "success" : "skip"}>
          WalletConnect: {web3Enabled ? "Enabled" : "Skipped"}
        </StatusMessage>
      )}

      {step === "web3_projectId" && (
        <TextInput
          label="WalletConnect Project ID"
          value={web3ProjectId}
          onChange={setWeb3ProjectId}
          onSubmit={handleWeb3ProjectIdSubmit}
          placeholder="Get from cloud.walletconnect.com"
        />
      )}

      {isPast("web3_projectId") && web3Enabled && (
        <StatusMessage status="success">Project ID configured</StatusMessage>
      )}

      {/* Auth secret section */}
      {step === "auth_secret" && (
        <TextInput
          label="Auth secret (leave empty to auto-generate)"
          value={authSecret}
          onChange={setAuthSecret}
          onSubmit={handleAuthSecretSubmit}
          placeholder="Press enter to auto-generate"
          mask="*"
        />
      )}

      {step === "done" && (
        <StatusMessage status="success">
          Secret: {authSecret ? "***" : "(auto-generated)"}
        </StatusMessage>
      )}
    </Box>
  );
};
