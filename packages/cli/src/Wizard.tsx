import { Box, Text, useApp } from "ink";
import React, { useState, useEffect, useRef } from "react";
import { useConfig, type AppConfig } from "./config/index.js";
import { SectionHeader, StatusMessage, CompletedSteps, Spinner } from "./components/index.js";
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
  BrandStep,
} from "./steps/index.js";
import { ensureSshAgent } from "./lib/ssh.js";

type WizardStep =
  | "project"
  | "check_ssh"
  | "oauth"
  | "payment"
  | "storage"
  | "analytics"
  | "cloning"
  | "env"
  | "git"
  | "install"
  | "brand"
  | "complete";

interface WizardProps {
  initialProjectName?: string;
  initialAppName?: string;
  gitHost: string;
  protocol?: "ssh" | "https";
  onComplete?: (config: AppConfig, destination: string) => void;
}

export const Wizard = ({ initialProjectName, initialAppName, gitHost, protocol, onComplete }: WizardProps) => {
  const [step, setStep] = useState<WizardStep>("project");
  const [projectDestination, setProjectDestination] = useState<string>("");
  const [sshRemediated, setSshRemediated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { config, updateConfig } = useConfig();
  const { exit } = useApp();

  const isCheckingSshRef = useRef(false);

  useEffect(() => {
    if (step === "complete") {
      onComplete?.(config, projectDestination);
      exit();
    }
  }, [step]);

  // SSH agent check before cloning
  useEffect(() => {
    if (step === "check_ssh" && !isCheckingSshRef.current) {
      isCheckingSshRef.current = true;
      const check = async () => {
        try {
          const result = await ensureSshAgent();
          if (result.status === "ready") {
            setSshRemediated(result.remediated ?? false);
            setStep("cloning");
          } else {
            setError(result.error ?? "SSH check failed");
            process.exit(1);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "SSH check failed");
          process.exit(1);
        }
        isCheckingSshRef.current = false;
      };
      void check();
    }
  }, [step]);

  const handleProjectComplete = (projectConfig: AppConfig["project"]) => {
    updateConfig("project", projectConfig);
    // Skip SSH check when using HTTPS protocol
    if (protocol === "https") {
      setStep("cloning");
    } else {
      setStep("check_ssh");
    }
  };

  const handleOAuthComplete = (result: { oauth: AppConfig["oauth"]; web3: AppConfig["web3"]; authSecret: string }) => {
    updateConfig("oauth", result.oauth);
    updateConfig("web3", result.web3);
    updateConfig("authSecret", result.authSecret);
    setStep("payment");
  };

  const handlePaymentComplete = (paymentConfig: AppConfig["payment"]) => {
    updateConfig("payment", paymentConfig);
    setStep("storage");
  };

  const handleStorageComplete = (storageConfig: AppConfig["storage"]) => {
    updateConfig("storage", storageConfig);
    setStep("analytics");
  };

  const handleAnalyticsComplete = (analyticsConfig: AppConfig["analytics"]) => {
    updateConfig("analytics", analyticsConfig);
    setStep("env");
  };

  const handleCloneComplete = (destination: string) => {
    setProjectDestination(destination);
    // BetterAuth is always enabled - set it directly without a step
    updateConfig("auth", { enabled: true });
    setStep("oauth");
  };

  const handleEnvComplete = () => {
    setStep("git");
  };

  const handleGitComplete = () => {
    setStep("install");
  };

  const handleInstallComplete = () => {
    setStep("brand");
  };

  const handleBrandComplete = () => {
    setStep("complete");
  };

  return (
    <Box flexDirection="column">
      {step !== "project" && step !== "complete" && <CompletedSteps config={config} currentStep={step} />}

      {step === "project" && (
        <ProjectSetup initialName={initialProjectName} initialAppName={initialAppName} onComplete={handleProjectComplete} />
      )}

      {sshRemediated && step !== "project" && step !== "check_ssh" && (
        <StatusMessage status="success">SSH ready</StatusMessage>
      )}

      {step === "check_ssh" && <Spinner label="Checking SSH agent..." />}

      {step === "cloning" && config.project && (
        <CloneStep
          projectName={config.project.name}
          gitHost={gitHost}
          protocol={protocol}
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

      {step === "brand" && config.project && (
        <BrandStep
          destination={projectDestination}
          slug={config.project.name}
          appName={config.project.appName || config.project.name}
          onComplete={handleBrandComplete}
        />
      )}

      {step === "complete" && (
        <Box flexDirection="column" marginTop={1}>
          <SectionHeader title="Setup Complete" />
          <StatusMessage status="success">Project scaffolded successfully!</StatusMessage>
          <CompletedSteps config={config} currentStep="complete" />
          <StatusMessage status="success">Branding: Applied</StatusMessage>
          <Box marginTop={1}>
            <Text dimColor>  cd {config.project?.name} && pnpm dev</Text>
          </Box>
        </Box>
      )}

      {error && (
        <Box flexDirection="column">
          <StatusMessage status="error">{error}</StatusMessage>
        </Box>
      )}
    </Box>
  );
};
