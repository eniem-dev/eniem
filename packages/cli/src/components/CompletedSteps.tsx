import { Box } from "ink";
import React from "react";
import type { AppConfig } from "../config/types.js";
import { StatusMessage } from "./StatusMessage.js";

interface CompletedStepsProps {
  config: AppConfig;
  currentStep: string;
}

export const CompletedSteps = ({ config, currentStep }: CompletedStepsProps) => {
  // Define step order (web3 is now part of oauth step)
  const stepOrder = ["project", "cloning", "oauth", "payment", "storage", "analytics", "env", "git", "install", "brand"];
  const currentIndex = stepOrder.indexOf(currentStep);

  // Only show if we've progressed past project setup
  if (currentIndex <= 0) {
    return null;
  }

  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* Project - always show if we've moved past it */}
      {currentIndex > 0 && config.project && (
        <StatusMessage status="success">Project: {config.project.name}</StatusMessage>
      )}

      {/* Cloning - show after cloning step */}
      {currentIndex > 1 && config.project && (
        <StatusMessage status="success">Cloned to: {config.project.name}/</StatusMessage>
      )}

      {/* OAuth + Web3 - show after oauth step (web3 is now part of oauth) */}
      {currentIndex > 2 && (
        <>
          <StatusMessage status={config.oauth?.github ? "success" : "skip"}>
            GitHub OAuth: {config.oauth?.github ? "Configured" : "Skipped"}
          </StatusMessage>
          <StatusMessage status={config.oauth?.twitter ? "success" : "skip"}>
            Twitter OAuth: {config.oauth?.twitter ? "Configured" : "Skipped"}
          </StatusMessage>
          <StatusMessage status={config.web3?.enabled ? "success" : "skip"}>
            Web3 (WalletConnect): {config.web3?.enabled ? "Configured" : "Skipped"}
          </StatusMessage>
        </>
      )}

      {/* Payment - show after payment step */}
      {currentIndex > 3 && (
        <StatusMessage status={config.payment?.enabled ? "success" : "skip"}>
          Payment (Polar): {config.payment?.enabled ? "Configured" : "Skipped"}
        </StatusMessage>
      )}

      {/* Storage - show after storage step */}
      {currentIndex > 4 && (
        <StatusMessage status={config.storage?.enabled ? "success" : "skip"}>
          Storage (DO Spaces): {config.storage?.enabled ? "Configured" : "Skipped"}
        </StatusMessage>
      )}

      {/* Analytics - show after analytics step */}
      {currentIndex > 5 && (
        <StatusMessage status={config.analytics?.enabled ? "success" : "skip"}>
          Analytics: {config.analytics?.enabled ? config.analytics.provider : "Skipped"}
        </StatusMessage>
      )}
    </Box>
  );
};
