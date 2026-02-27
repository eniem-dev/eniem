import { Box, Text, useApp } from "ink";
import React, { useEffect, useRef, useState } from "react";

import type { CLIAdapter, CLIId } from "../lib/adapters/index.js";
import { SUPPORTED_CLIS, getAdapter, checkBinary, isValidCLI } from "../lib/adapters/index.js";
import type { EniConfig, Narration } from "../lib/eni-config.js";
import { readConfig, writeConfig } from "../lib/eni-config.js";

import { Confirm } from "../components/Confirm.js";
import { SectionHeader } from "../components/SectionHeader.js";
import { Select } from "../components/Select.js";
import { Spinner } from "../components/Spinner.js";
import { StatusMessage } from "../components/StatusMessage.js";

interface ConfigCommandProps {
  cwd: string;
}

type Step = "loading" | "plan" | "build" | "verbose" | "narration" | "saving" | "done" | "error";

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
  const [verboseChoice, setVerboseChoice] = useState(false);
  const [narrationChoice, setNarrationChoice] = useState<Narration>("concise");
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

    setBuildCLI(value as CLIId);
    setVerboseChoice(currentConfig?.verbose ?? false);
    setStep("verbose");
  };

  const handleVerboseSelect = (confirmed: boolean) => {
    setVerboseChoice(confirmed);
    setNarrationChoice(currentConfig?.narration ?? "concise");
    setStep("narration");
  };

  const narrationOptions = [
    { label: "Concise — no narration, fewer tokens (default)", value: "concise" },
    { label: "Explicit — model narrates tool activity", value: "explicit" },
  ];

  const handleNarrationSelect = (value: string) => {
    const narration = value as Narration;
    setNarrationChoice(narration);
    setStep("saving");

    const config: EniConfig = { plan: planCLI!, build: buildCLI!, verbose: verboseChoice, narration };
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
          {currentConfig.build ?? "not set"}, verbose:{" "}
          {String(currentConfig.verbose ?? false)}, narration:{" "}
          {currentConfig.narration ?? "concise"}
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

      {buildCLI && step !== "build" && step !== "plan" && (
        <StatusMessage status="success">Build CLI: {buildCLI}</StatusMessage>
      )}

      {step === "verbose" && (
        <Box marginTop={1} flexDirection="column">
          <Confirm
            label="Enable verbose output?"
            onConfirm={handleVerboseSelect}
            defaultValue={currentConfig?.verbose ?? false}
          />
        </Box>
      )}

      {(step === "narration" || step === "saving" || step === "done") && (
        <StatusMessage status="success">
          Verbose: {String(verboseChoice)}
        </StatusMessage>
      )}

      {step === "narration" && (
        <Box marginTop={1} flexDirection="column">
          <Select
            label="Narration style:"
            options={narrationOptions}
            onSelect={handleNarrationSelect}
          />
        </Box>
      )}

      {(step === "saving" || step === "done") && (
        <StatusMessage status="success">
          Narration: {narrationChoice}
        </StatusMessage>
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
      <Text>  plan:      {config.plan ?? "not set"}</Text>
      <Text>  build:     {config.build ?? "not set"}</Text>
      <Text>  verbose:   {String(config.verbose ?? false)}</Text>
      <Text>  narration: {config.narration ?? "concise"}</Text>
    </Box>
  );
};

// --- ConfigSetCommand ---

const VALID_COMMANDS = ["plan", "build", "verbose", "narration"] as const;

interface ConfigSetCommandProps {
  cwd: string;
  command?: string;
  cliName?: string;
}

const VALID_NARRATION_VALUES = ["concise", "explicit"] as const;

function getUsageError(command?: string, value?: string): string | null {
  if (!command || !value) {
    return `Usage: eni config set <plan|build|verbose|narration> <value>`;
  }
  if (!VALID_COMMANDS.includes(command as (typeof VALID_COMMANDS)[number])) {
    return `Invalid command: "${command}". Must be one of: ${VALID_COMMANDS.join(", ")}`;
  }
  if (command === "verbose") {
    if (value !== "true" && value !== "false") {
      return `Invalid value for verbose: must be true or false`;
    }
    return null;
  }
  if (command === "narration") {
    if (!VALID_NARRATION_VALUES.includes(value as Narration)) {
      return `Invalid value for narration: must be one of: ${VALID_NARRATION_VALUES.join(", ")}`;
    }
    return null;
  }
  if (!isValidCLI(value)) {
    return `Invalid CLI: "${value}". Must be one of: ${SUPPORTED_CLIS.join(", ")}`;
  }
  return null;
}

export const ConfigSetCommand = ({ cwd, command, cliName }: ConfigSetCommandProps) => {
  const { exit } = useApp();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const usageError = getUsageError(command, cliName);

  useEffect(() => {
    if (usageError || startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      const existing = (await readConfig(cwd).catch(() => null)) ?? {};
      let updated: EniConfig;
      if (command === "verbose") {
        updated = { ...existing, verbose: cliName === "true" };
      } else if (command === "narration") {
        updated = { ...existing, narration: cliName as Narration };
      } else {
        updated = { ...existing, [command!]: cliName as CLIId };
      }
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
    const display =
      command === "verbose"
        ? `Set verbose to ${cliName}`
        : command === "narration"
          ? `Set narration to ${cliName}`
          : `Set ${command} CLI to ${cliName}`;
    return <StatusMessage status="success">{display}</StatusMessage>;
  }

  return null;
};
