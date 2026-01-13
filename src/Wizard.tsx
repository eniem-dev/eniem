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
} from "./steps/index.js";

type WizardStep =
  | "project"
  | "auth"
  | "oauth"
  | "payment"
  | "storage"
  | "web3"
  | "analytics"
  | "complete";

interface WizardProps {
  initialProjectName?: string;
  onComplete: (config: AppConfig) => void;
}

export const Wizard = ({ initialProjectName, onComplete }: WizardProps) => {
  const [step, setStep] = useState<WizardStep>("project");
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
    setStep("complete");
    // Build final config with all collected values
    const finalConfig: AppConfig = {
      ...config,
      analytics: analyticsConfig,
    };
    onComplete(finalConfig);
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

      {step === "complete" && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold color="green">
            ✓ Configuration complete!
          </Text>
          <Text dimColor>Project: {config.project?.name}</Text>
        </Box>
      )}
    </Box>
  );
};
