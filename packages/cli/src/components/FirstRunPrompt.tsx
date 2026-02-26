import { Box, Text } from "ink";
import React, { useState } from "react";

import type { CLIAdapter, CLIId } from "../lib/adapters/index.js";
import type { EniConfig } from "../lib/eni-config.js";
import { writeConfig } from "../lib/eni-config.js";
import { SUPPORTED_CLIS } from "../lib/adapters/index.js";

import { SectionHeader } from "./SectionHeader.js";
import { Select } from "./Select.js";
import { StatusMessage } from "./StatusMessage.js";

interface FirstRunPromptProps {
  available: CLIAdapter[];
  cwd: string;
  onComplete: (config: EniConfig) => void;
}

type Step = "plan" | "build" | "saving" | "done" | "error";

export const FirstRunPrompt = ({
  available,
  cwd,
  onComplete,
}: FirstRunPromptProps) => {
  const [step, setStep] = useState<Step>("plan");
  const [planCLI, setPlanCLI] = useState<CLIId | null>(null);
  const [buildCLI, setBuildCLI] = useState<CLIId | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (available.length === 0) {
    return (
      <Box flexDirection="column">
        <SectionHeader title="CLI Configuration" />
        <StatusMessage status="error">
          No supported CLI found. Install one of:{" "}
          {SUPPORTED_CLIS.join(", ")}
        </StatusMessage>
      </Box>
    );
  }

  const autoSelect = available.length === 1;

  if (autoSelect && step === "plan") {
    const only = available[0]!;
    const config: EniConfig = { plan: only.id, build: only.id };
    void writeConfig(cwd, config).then(() => {
      setPlanCLI(only.id);
      setBuildCLI(only.id);
      setStep("done");
      onComplete(config);
    });

    return (
      <Box flexDirection="column">
        <SectionHeader title="CLI Configuration" />
        <StatusMessage status="info">
          Only one CLI available — auto-selecting {only.name} ({only.id})
        </StatusMessage>
        <StatusMessage status="success">
          Saved to .eni/config.json
        </StatusMessage>
      </Box>
    );
  }

  const options = available.map((a) => ({
    label: `${a.name} (${a.id})`,
    value: a.id,
  }));

  const handlePlanSelect = (value: string) => {
    setPlanCLI(value as CLIId);
    setStep("build");
  };

  const handleBuildSelect = (value: string) => {
    const selectedBuild = value as CLIId;
    setBuildCLI(selectedBuild);
    setStep("saving");

    const config: EniConfig = { plan: planCLI!, build: selectedBuild };
    void writeConfig(cwd, config)
      .then(() => {
        setStep("done");
        onComplete(config);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "Failed to write config",
        );
        setStep("error");
      });
  };

  return (
    <Box flexDirection="column">
      <SectionHeader title="CLI Configuration" />
      <Text>
        No CLI configuration found. Let&apos;s set up your defaults.
      </Text>
      <Box marginTop={1} flexDirection="column">
        {step === "plan" && (
          <Select
            label="Default CLI for plan:"
            options={options}
            onSelect={handlePlanSelect}
          />
        )}

        {planCLI && step !== "plan" && (
          <StatusMessage status="success">
            Plan CLI: {planCLI}
          </StatusMessage>
        )}

        {step === "build" && (
          <Select
            label="Default CLI for build:"
            options={options}
            onSelect={handleBuildSelect}
          />
        )}

        {buildCLI && (step === "saving" || step === "done") && (
          <StatusMessage status="success">
            Build CLI: {buildCLI}
          </StatusMessage>
        )}

        {step === "done" && (
          <StatusMessage status="success">
            Saved to .eni/config.json
          </StatusMessage>
        )}

        {step === "error" && (
          <StatusMessage status="error">{error}</StatusMessage>
        )}
      </Box>
    </Box>
  );
};
