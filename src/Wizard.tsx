import { Box, Text } from "ink";
import React, { useState } from "react";
import { useConfig, type AppConfig } from "./config/index.js";
import { SectionHeader, StatusMessage } from "./components/index.js";
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
  const [projectDestination, setProjectDestination] = useState<string>("");
  const { config, setProject, setAuth, setOAuth, setPayment, setStorage, setWeb3, setAnalytics } =
    useConfig();

  const handleProjectComplete = (projectConfig: Parameters<typeof setProject>[0]) => {
    setProject(projectConfig);
    setStep("cloning");
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
    setStep("env");
  };

  const handleCloneComplete = (destination: string) => {
    setProjectDestination(destination);
    setStep("auth");
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
      {step === "project" && (
        <ProjectSetup initialName={initialProjectName} onComplete={handleProjectComplete} />
      )}

      {step === "cloning" && config.project && (
        <CloneStep
          projectName={config.project.name}
          onComplete={handleCloneComplete}
        />
      )}

      {step === "auth" && <AuthSetup onComplete={handleAuthComplete} />}

      {step === "oauth" && <OAuthSetup onComplete={handleOAuthComplete} />}

      {step === "payment" && <PaymentSetup onComplete={handlePaymentComplete} />}

      {step === "storage" && <StorageSetup onComplete={handleStorageComplete} />}

      {step === "web3" && <Web3Setup onComplete={handleWeb3Complete} />}

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
          <Text dimColor>  cd {config.project?.name} && pnpm dev</Text>
        </Box>
      )}
    </Box>
  );
};
