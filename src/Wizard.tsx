import { Box, Text } from "ink";
import React, { useState } from "react";
import { useConfig, type AppConfig } from "./config/index.js";
import {
  ProjectSetup,
  AuthSetup,
  OAuthSetup,
  PaymentSetup,
  StorageSetup,
  Web3Setup,
  AnalyticsSetup,
  CloneStep,
  EnvStep,
  GitStep,
  InstallStep,
} from "./steps/index.js";

type WizardStep =
  | "project"
  | "auth"
  | "oauth"
  | "payment"
  | "storage"
  | "web3"
  | "analytics"
  | "cloning"
  | "env"
  | "git"
  | "install"
  | "complete";

interface WizardProps {
  initialProjectName?: string;
  onComplete: (config: AppConfig, destination: string) => void;
}

export const Wizard = ({ initialProjectName, onComplete }: WizardProps) => {
  const [step, setStep] = useState<WizardStep>("project");
  const [cloneError, setCloneError] = useState<string>("");
  const [projectDestination, setProjectDestination] = useState<string>("");
  const { config, setProject, setAuth, setOAuth, setPayment, setStorage, setWeb3, setAnalytics } =
    useConfig();

  const handleProjectComplete = (projectConfig: Parameters<typeof setProject>[0]) => {
    setProject(projectConfig);
    setStep("auth");
  };

  const handleAuthComplete = (authConfig: Parameters<typeof setAuth>[0]) => {
    setAuth(authConfig);
    setStep("oauth");
  };

  const handleOAuthComplete = (oauthConfig: Parameters<typeof setOAuth>[0]) => {
    setOAuth(oauthConfig);
    setStep("payment");
  };

  const handlePaymentComplete = (paymentConfig: Parameters<typeof setPayment>[0]) => {
    setPayment(paymentConfig);
    setStep("storage");
  };

  const handleStorageComplete = (storageConfig: Parameters<typeof setStorage>[0]) => {
    setStorage(storageConfig);
    setStep("web3");
  };

  const handleWeb3Complete = (web3Config: Parameters<typeof setWeb3>[0]) => {
    setWeb3(web3Config);
    setStep("analytics");
  };

  const handleAnalyticsComplete = (analyticsConfig: Parameters<typeof setAnalytics>[0]) => {
    setAnalytics(analyticsConfig);
    setStep("cloning");
  };

  const handleCloneComplete = (destination: string) => {
    setProjectDestination(destination);
    setStep("env");
  };

  const handleEnvComplete = (_envPath: string) => {
    setStep("git");
  };

  const handleEnvError = (error: string) => {
    // For now just log - could add retry UI later
    console.error("Env generation failed:", error);
  };

  const handleGitComplete = () => {
    setStep("install");
  };

  const handleGitError = (error: string) => {
    // For now just log - could add retry UI later
    console.error("Git init failed:", error);
  };

  const handleInstallComplete = () => {
    setStep("complete");
    // Build final config with all collected values
    const finalConfig: AppConfig = {
      ...config,
    };
    onComplete(finalConfig, projectDestination);
  };

  const handleInstallError = (error: string) => {
    // For now just log - could add retry UI later
    console.error("pnpm install failed:", error);
  };

  const handleCloneError = (error: string) => {
    setCloneError(error);
  };

  return (
    <Box flexDirection="column">
      {step === "project" && (
        <ProjectSetup initialName={initialProjectName} onComplete={handleProjectComplete} />
      )}

      {step === "auth" && <AuthSetup onComplete={handleAuthComplete} />}

      {step === "oauth" && <OAuthSetup onComplete={handleOAuthComplete} />}

      {step === "payment" && <PaymentSetup onComplete={handlePaymentComplete} />}

      {step === "storage" && <StorageSetup onComplete={handleStorageComplete} />}

      {step === "web3" && <Web3Setup onComplete={handleWeb3Complete} />}

      {step === "analytics" && <AnalyticsSetup onComplete={handleAnalyticsComplete} />}

      {step === "cloning" && config.project && (
        <CloneStep
          projectName={config.project.name}
          onComplete={handleCloneComplete}
          onError={handleCloneError}
        />
      )}

      {step === "env" && (
        <EnvStep
          config={config}
          destination={projectDestination}
          onComplete={handleEnvComplete}
          onError={handleEnvError}
        />
      )}

      {step === "git" && (
        <GitStep
          destination={projectDestination}
          onComplete={handleGitComplete}
          onError={handleGitError}
        />
      )}

      {step === "install" && (
        <InstallStep
          destination={projectDestination}
          onComplete={handleInstallComplete}
          onError={handleInstallError}
        />
      )}

      {step === "complete" && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold color="green">
            ✓ Project scaffolded successfully!
          </Text>
          <Text dimColor>Project: {config.project?.name}</Text>
        </Box>
      )}
    </Box>
  );
};
