import { Box, Text, useApp } from "ink";
import React, { useEffect, useRef, useState } from "react";

import type { CLIAdapter, CLIId } from "../lib/adapters/index.js";
import { SUPPORTED_CLIS, getAdapter, checkBinary, isValidCLI } from "../lib/adapters/index.js";
import type { EniConfig } from "../lib/eni-config.js";
import { readConfig, writeConfig } from "../lib/eni-config.js";

import { SectionHeader } from "../components/SectionHeader.js";
import { Select } from "../components/Select.js";
import { Spinner } from "../components/Spinner.js";
import { StatusMessage } from "../components/StatusMessage.js";

interface ConfigCommandProps {
  cwd: string;
}

type Step = "loading" | "plan" | "build" | "saving" | "done" | "error";

interface AdapterInfo {
  adapter: CLIAdapter;
  available: boolean;
}

export const ConfigCommand = ({ cwd }: ConfigCommandProps) => {
  const { exit } = useApp();
  const [step, setStep] = useState<Step>("loading");
  const [adapters, setAdapters] = useState<AdapterInfo[]>([]);
  const [currentConfig, setCurrentConfig] = useState<EniConfig | null>(null);
  const [planCLI, setPlanCLI] = useState<CLIId | null>(null);
  const [buildCLI, setBuildCLI] = useState<CLIId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (step !== "loading" || loadedRef.current) return;
    loadedRef.current = true;

    const load = async () => {
      const infos: AdapterInfo[] = await Promise.all(
        SUPPORTED_CLIS.map(async (id) => ({
          adapter: getAdapter(id),
          available: await checkBinary(getAdapter(id).binary),
        })),
      );
      setAdapters(infos);

      const existing = await readConfig(cwd).catch(() => null);
      setCurrentConfig(existing);

      setStep("plan");
    };

    void load();
  }, [step, cwd]);

  useEffect(() => {
    if (step === "done" || step === "error") {
      exit();
    }
  }, [step, exit]);

  const options = adapters.map(({ adapter, available }) => ({
    label: available
      ? `${adapter.name} (${adapter.id})`
      : `${adapter.name} (${adapter.id}) — not installed`,
    value: adapter.id,
  }));

  const handlePlanSelect = (value: string) => {
    const info = adapters.find((a) => a.adapter.id === value);
    if (!info?.available) return;
    setPlanCLI(value as CLIId);
    setStep("build");
  };

  const handleBuildSelect = (value: string) => {
    const info = adapters.find((a) => a.adapter.id === value);
    if (!info?.available) return;

    const selectedBuild = value as CLIId;
    setBuildCLI(selectedBuild);
    setStep("saving");

    const config: EniConfig = { plan: planCLI!, build: selectedBuild };
    void writeConfig(cwd, config)
      .then(() => setStep("done"))
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

      {step === "loading" && <Spinner label="Checking installed CLIs..." />}

      {currentConfig && step === "plan" && (
        <StatusMessage status="info">
          Current config — plan: {currentConfig.plan ?? "not set"}, build:{" "}
          {currentConfig.build ?? "not set"}
        </StatusMessage>
      )}

      {step === "plan" && (
        <Box marginTop={1} flexDirection="column">
          <Select
            label="Default CLI for plan:"
            options={options}
            onSelect={handlePlanSelect}
          />
        </Box>
      )}

      {planCLI && step !== "plan" && (
        <StatusMessage status="success">Plan CLI: {planCLI}</StatusMessage>
      )}

      {step === "build" && (
        <Box marginTop={1} flexDirection="column">
          <Select
            label="Default CLI for build:"
            options={options}
            onSelect={handleBuildSelect}
          />
        </Box>
      )}

      {buildCLI && (step === "saving" || step === "done") && (
        <StatusMessage status="success">Build CLI: {buildCLI}</StatusMessage>
      )}

      {step === "saving" && <Spinner label="Saving configuration..." />}

      {step === "done" && (
        <StatusMessage status="success">
          Saved to .eni/config.json
        </StatusMessage>
      )}

      {step === "error" && (
        <StatusMessage status="error">{error}</StatusMessage>
      )}
    </Box>
  );
};

// --- ConfigShowCommand ---

interface ConfigShowCommandProps {
  cwd: string;
}

export const ConfigShowCommand = ({ cwd }: ConfigShowCommandProps) => {
  const { exit } = useApp();
  const [config, setConfig] = useState<EniConfig | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    void readConfig(cwd)
      .then((c) => setConfig(c))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to read config");
      });
  }, [cwd]);

  useEffect(() => {
    if (config !== undefined || error) exit();
  }, [config, error, exit]);

  if (error) {
    return <StatusMessage status="error">{error}</StatusMessage>;
  }

  if (config === undefined) return null;

  if (!config) {
    return (
      <StatusMessage status="info">
        No configuration found. Run eni config to set up.
      </StatusMessage>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold>CLI Configuration (.eni/config.json):</Text>
      <Text>  plan:  {config.plan ?? "not set"}</Text>
      <Text>  build: {config.build ?? "not set"}</Text>
    </Box>
  );
};

// --- ConfigSetCommand ---

const VALID_COMMANDS = ["plan", "build"] as const;

interface ConfigSetCommandProps {
  cwd: string;
  command?: string;
  cliName?: string;
}

export const ConfigSetCommand = ({ cwd, command, cliName }: ConfigSetCommandProps) => {
  const { exit } = useApp();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const usageError = !command || !cliName
    ? `Usage: eni config set <plan|build> <${SUPPORTED_CLIS.join("|")}>`
    : !VALID_COMMANDS.includes(command as (typeof VALID_COMMANDS)[number])
      ? `Invalid command: "${command}". Must be one of: ${VALID_COMMANDS.join(", ")}`
      : !isValidCLI(cliName)
        ? `Invalid CLI: "${cliName}". Must be one of: ${SUPPORTED_CLIS.join(", ")}`
        : null;

  useEffect(() => {
    if (usageError || startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      const existing = (await readConfig(cwd).catch(() => null)) ?? {};
      const updated: EniConfig = { ...existing, [command!]: cliName as CLIId };
      await writeConfig(cwd, updated);
      setDone(true);
    };

    void run().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to write config");
    });
  }, [cwd, command, cliName, usageError]);

  useEffect(() => {
    if (usageError || done || error) exit();
  }, [usageError, done, error, exit]);

  if (usageError) {
    return <StatusMessage status="error">{usageError}</StatusMessage>;
  }

  if (error) {
    return <StatusMessage status="error">{error}</StatusMessage>;
  }

  if (done) {
    return (
      <StatusMessage status="success">
        Set {command} CLI to {cliName}
      </StatusMessage>
    );
  }

  return null;
};
