import { Box, Text } from "ink";
import React, { useState } from "react";
import { useConfig, type AppConfig } from "./config/index.js";
import { SectionHeader, StatusMessage, CompletedSteps } from "./components/index.js";
import {
  ProjectSetup,
  OAuthSetup,
  PaymentSetup,
  StorageSetup,
  AnalyticsSetup,
  CloneStep,
  EnvStep,
  GitStep,
  InstallStep,
} from "./steps/index.js";

type WizardStep =
  | "project"
  | "oauth"
  | "payment"
  | "storage"
  | "analytics"
  | "cloning"
  | "env"
  | "git"
  | "install"
  | "complete";

interface WizardProps {
  initialProjectName?: string;
  gitHost: string;
  onComplete: (config: AppConfig, destination: string) => void;
}

export const Wizard = ({ initialProjectName, gitHost, onComplete }: WizardProps) => {
  const [step, setStep] = useState<WizardStep>("project");
  const [projectDestination, setProjectDestination] = useState<string>("");
  const { config, setProject, setAuth, setAuthSecret, setOAuth, setPayment, setStorage, setWeb3, setAnalytics } =
    useConfig();

  const handleProjectComplete = (projectConfig: Parameters<typeof setProject>[0]) => {
    setProject(projectConfig);
    setStep("cloning");
  };

  const handleOAuthComplete = (result: { oauth: Parameters<typeof setOAuth>[0]; web3: Parameters<typeof setWeb3>[0]; authSecret: string }) => {
    setOAuth(result.oauth);
    setWeb3(result.web3);
    setAuthSecret(result.authSecret);
    setStep("payment");
  };

  const handlePaymentComplete = (paymentConfig: Parameters<typeof setPayment>[0]) => {
    setPayment(paymentConfig);
    setStep("storage");
  };

  const handleStorageComplete = (storageConfig: Parameters<typeof setStorage>[0]) => {
    setStorage(storageConfig);
    setStep("analytics");
  };

  const handleAnalyticsComplete = (analyticsConfig: Parameters<typeof setAnalytics>[0]) => {
    setAnalytics(analyticsConfig);
    setStep("env");
  };

  const handleCloneComplete = (destination: string) => {
    setProjectDestination(destination);
    // BetterAuth is always enabled - set it directly without a step
    setAuth({ enabled: true });
    setStep("oauth");
  };

  const handleEnvComplete = (_envPath: string) => {
    setStep("git");
  };

  const handleGitComplete = () => {
    setStep("install");
  };

  const handleInstallComplete = () => {
    setStep("complete");
    // Build final config with all collected values
    const finalConfig: AppConfig = {
      ...config,
    };
    onComplete(finalConfig, projectDestination);
  };

  return (
    <Box flexDirection="column">
      {step !== "project" && step !== "complete" && <CompletedSteps config={config} currentStep={step} />}

      {step === "project" && (
        <ProjectSetup initialName={initialProjectName} onComplete={handleProjectComplete} />
      )}

      {step === "cloning" && config.project && (
        <CloneStep
          projectName={config.project.name}
          gitHost={gitHost}
          onComplete={handleCloneComplete}
        />
      )}

      {step === "oauth" && <OAuthSetup onComplete={handleOAuthComplete} />}

      {step === "payment" && <PaymentSetup onComplete={handlePaymentComplete} />}

      {step === "storage" && <StorageSetup onComplete={handleStorageComplete} />}

      {step === "analytics" && <AnalyticsSetup onComplete={handleAnalyticsComplete} />}

      {step === "env" && (
        <EnvStep
          config={config}
          destination={projectDestination}
          onComplete={handleEnvComplete}
        />
      )}

      {step === "git" && (
        <GitStep
          destination={projectDestination}
          onComplete={handleGitComplete}
        />
      )}

      {step === "install" && (
        <InstallStep
          destination={projectDestination}
          onComplete={handleInstallComplete}
        />
      )}

      {step === "complete" && (
        <Box flexDirection="column" marginTop={1}>
          <SectionHeader title="Setup Complete" />
          <StatusMessage status="success">Project scaffolded successfully!</StatusMessage>
          <Box flexDirection="column" marginTop={1}>
            <StatusMessage status="success">Project: {config.project?.name}</StatusMessage>
            <StatusMessage status="success">Auth: BetterAuth enabled</StatusMessage>
            <StatusMessage status={config.oauth?.github ? "success" : "skip"}>
              GitHub OAuth: {config.oauth?.github ? "Configured" : "Skipped"}
            </StatusMessage>
            <StatusMessage status={config.oauth?.twitter ? "success" : "skip"}>
              Twitter OAuth: {config.oauth?.twitter ? "Configured" : "Skipped"}
            </StatusMessage>
            <StatusMessage status={config.payment?.enabled ? "success" : "skip"}>
              Payment (Polar): {config.payment?.enabled ? "Configured" : "Skipped"}
            </StatusMessage>
            <StatusMessage status={config.storage?.enabled ? "success" : "skip"}>
              Storage (DO Spaces): {config.storage?.enabled ? "Configured" : "Skipped"}
            </StatusMessage>
            <StatusMessage status={config.web3?.enabled ? "success" : "skip"}>
              Web3 (WalletConnect): {config.web3?.enabled ? "Configured" : "Skipped"}
            </StatusMessage>
            <StatusMessage status={config.analytics?.enabled ? "success" : "skip"}>
              Analytics: {config.analytics?.enabled ? config.analytics.provider : "Skipped"}
            </StatusMessage>
          </Box>
          <Box marginTop={1}>
            <Text dimColor>  cd {config.project?.name} && pnpm dev</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};
