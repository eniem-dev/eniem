import { Box, Text } from "ink";
import React, { useState, useEffect, useRef } from "react";
import {
  Spinner,
  Confirm,
  Select,
  MultiSelect,
  SectionHeader,
  StatusMessage,
} from "../components/index.js";
import {
  checkEniExists,
  sparseCloneBoilerplate,
  copyAiFiles,
  ensureSpecsFolder,
  cleanupTempDir,
  type CopyReport,
} from "../lib/ai-init.js";
import type { CLIAdapter, CLIId } from "../lib/adapters/index.js";
import { SUPPORTED_CLIS, getAdapter, checkBinary } from "../lib/adapters/index.js";
import type { EniConfig, Narration } from "../lib/eni-config.js";
import { readConfig, writeConfig } from "../lib/eni-config.js";

type AiInitStep =
  | "checking"
  | "confirm_update"
  | "cloning"
  | "copying"
  | "select_clis"
  | "select_plan_cli"
  | "select_build_cli"
  | "select_verbose"
  | "select_narration"
  | "saving_config"
  | "complete"
  | "error";

interface AiCommandProps {
  forceFlag: boolean;
  targetDir: string;
  gitHost: string;
}

export const AiCommand = ({ forceFlag, targetDir, gitHost }: AiCommandProps) => {
  const [step, setStep] = useState<AiInitStep>("checking");
  const [eniExists, setEniExists] = useState(false);
  const [copyReport, setCopyReport] = useState<CopyReport>({ addedFiles: [], skippedFiles: [] });
  const [specsCreated, setSpecsCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempDir, setTempDir] = useState<string | null>(null);
  const [adapters, setAdapters] = useState<{ adapter: CLIAdapter; available: boolean }[]>([]);
  const [planCLI, setPlanCLI] = useState<CLIId | null>(null);
  const [buildCLI, setBuildCLI] = useState<CLIId | null>(null);
  const [verboseChoice, setVerboseChoice] = useState(false);
  const [narrationChoice, setNarrationChoice] = useState<Narration>("concise");
  const [existingConfig, setExistingConfig] = useState<EniConfig | null>(null);
  const [selectedClis, setSelectedClis] = useState<CLIId[]>([]);
  const [cliWarnings, setCliWarnings] = useState<string[]>([]);

  // Refs to prevent duplicate effect runs
  const isCheckingRef = useRef(false);
  const isCloningRef = useRef(false);
  const isCopyingRef = useRef(false);
  const isLoadingAdaptersRef = useRef(false);
  const isSavingConfigRef = useRef(false);

  // Step 1: Check if .eni exists
  useEffect(() => {
    if (step === "checking" && !isCheckingRef.current) {
      isCheckingRef.current = true;
      const check = async () => {
        const exists = await checkEniExists(targetDir);
        setEniExists(exists);

        if (exists && !forceFlag) {
          setStep("confirm_update");
        } else {
          setStep("cloning");
        }
        isCheckingRef.current = false;
      };
      void check();
    }
  }, [step, targetDir, forceFlag]);

  // Step 2: Sparse clone boilerplate
  useEffect(() => {
    if (step === "cloning" && !isCloningRef.current) {
      isCloningRef.current = true;
      const clone = async () => {
        const result = await sparseCloneBoilerplate(gitHost);
        if (!result.success) {
          setError(result.error ?? "Failed to clone boilerplate");
          setStep("error");
          isCloningRef.current = false;
          return;
        }
        setTempDir(result.tempDir);
        setStep("copying");
        isCloningRef.current = false;
      };
      void clone();
    }
  }, [step, gitHost]);

  // Step 3: Copy files and ensure specs folder
  useEffect(() => {
    if (step === "copying" && tempDir && !isCopyingRef.current) {
      isCopyingRef.current = true;
      const copy = async () => {
        // Copy AI config folders (additive merge — preserves existing files)
        const copyResult = await copyAiFiles(tempDir, targetDir);
        if (!copyResult.success) {
          await cleanupTempDir(tempDir);
          setError(copyResult.error ?? "Failed to copy files");
          setStep("error");
          isCopyingRef.current = false;
          return;
        }

        // Ensure specs folder exists
        const specsResult = await ensureSpecsFolder(targetDir);
        if (!specsResult.success) {
          await cleanupTempDir(tempDir);
          setError(specsResult.error ?? "Failed to create specs folder");
          setStep("error");
          isCopyingRef.current = false;
          return;
        }

        // Add specs/.gitkeep to report if specs folder was created
        const report = { ...copyResult.report };
        if (specsResult.created) {
          report.addedFiles = [...report.addedFiles, "specs/.gitkeep"];
        }

        // Cleanup temp directory
        await cleanupTempDir(tempDir);

        setCopyReport(report);
        setSpecsCreated(specsResult.created);
        setStep("select_clis");
        isCopyingRef.current = false;
      };
      void copy();
    }
  }, [step, tempDir, targetDir]);

  // Handle confirmation
  const handleConfirm = (confirmed: boolean) => {
    if (confirmed) {
      setStep("cloning");
    } else {
      process.exit(0);
    }
  };

  // Load adapters and existing config when entering select_clis
  useEffect(() => {
    if (step !== "select_clis" || isLoadingAdaptersRef.current) return;
    isLoadingAdaptersRef.current = true;

    const load = async () => {
      const [infos, config] = await Promise.all([
        Promise.all(
          SUPPORTED_CLIS.map(async (id) => ({
            adapter: getAdapter(id),
            available: await checkBinary(getAdapter(id).binary),
          })),
        ),
        readConfig(targetDir).catch(() => null),
      ]);
      setExistingConfig(config);
      setAdapters(infos);
      isLoadingAdaptersRef.current = false;
    };

    void load();
  }, [step, targetDir]);

  // Save config
  useEffect(() => {
    if (step !== "saving_config" || isSavingConfigRef.current) return;
    isSavingConfigRef.current = true;

    const config: EniConfig = { plan: planCLI!, build: buildCLI!, clis: selectedClis, verbose: verboseChoice, narration: narrationChoice };
    void writeConfig(targetDir, config)
      .then(() => setStep("complete"))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to write config");
        setStep("error");
      })
      .finally(() => { isSavingConfigRef.current = false; });
  }, [step, targetDir, planCLI, buildCLI, selectedClis, verboseChoice, narrationChoice]);

  const cliMultiSelectItems = adapters.map(({ adapter, available }) => ({
    label: available
      ? `${adapter.name} (installed)`
      : `${adapter.name} (not found)`,
    value: adapter.id,
  }));

  const handleClisSelect = (values: string[]) => {
    const selected = values as CLIId[];
    setSelectedClis(selected);

    // Warn about selected CLIs that are not installed
    const warnings = selected
      .filter((id) => !adapters.find((a) => a.adapter.id === id)?.available)
      .map((id) => {
        const adapter = adapters.find((a) => a.adapter.id === id);
        return `⚠ ${adapter?.adapter.name ?? id} binary not found. You can still set up config and install it later.`;
      });
    setCliWarnings(warnings);

    setStep("select_plan_cli");
  };

  const adapterOptions = adapters.map(({ adapter, available }) => ({
    label: available
      ? `${adapter.name} (${adapter.id})`
      : `${adapter.name} (${adapter.id}) — not installed`,
    value: adapter.id,
  }));

  const handlePlanSelect = (value: string) => {
    const info = adapters.find((a) => a.adapter.id === value);
    if (!info?.available) return;
    setPlanCLI(value as CLIId);
    setStep("select_build_cli");
  };

  const handleBuildSelect = (value: string) => {
    const info = adapters.find((a) => a.adapter.id === value);
    if (!info?.available) return;
    setBuildCLI(value as CLIId);
    setVerboseChoice(existingConfig?.verbose ?? false);
    setStep("select_verbose");
  };

  const handleVerboseSelect = (confirmed: boolean) => {
    setVerboseChoice(confirmed);
    setNarrationChoice(existingConfig?.narration ?? "concise");
    setStep("select_narration");
  };

  const narrationOptions = [
    { label: "Concise", value: "concise" },
    { label: "Explicit", value: "explicit" },
  ];

  const handleNarrationSelect = (value: string) => {
    setNarrationChoice(value as Narration);
    setStep("saving_config");
  };

  return (
    <Box flexDirection="column">
      <SectionHeader title="AI Workflow Setup" />

      {step === "checking" && <Spinner label="Checking existing files..." />}

      {step === "confirm_update" && (
        <Box flexDirection="column">
          <Text color="yellow">
            .eni folder already exists in this project.
          </Text>
          <Box marginTop={1}>
            <Confirm
              label="Update AI workflow files? This will replace existing .eni and .claude folders"
              onConfirm={handleConfirm}
              defaultValue={false}
            />
          </Box>
        </Box>
      )}

      {step === "cloning" && (
        <Spinner label="Fetching latest AI workflow files from boilerplate..." />
      )}

      {step === "copying" && <Spinner label="Copying files to project..." />}

      {step === "select_clis" && adapters.length === 0 && (
        <Spinner label="Checking installed CLIs..." />
      )}

      {step === "select_clis" && adapters.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <MultiSelect
            label="Which CLIs do you want to configure?"
            items={cliMultiSelectItems}
            onSubmit={handleClisSelect}
            initialSelected={existingConfig?.clis ?? adapters.filter((a) => a.available).map((a) => a.adapter.id)}
          />
        </Box>
      )}

      {step !== "select_clis" && selectedClis.length > 0 && (
        <StatusMessage status="success">
          CLIs: {selectedClis.join(", ")}
        </StatusMessage>
      )}

      {cliWarnings.length > 0 && step !== "select_clis" && (
        <Box flexDirection="column" marginLeft={2}>
          {cliWarnings.map((warning) => (
            <Text key={warning} color="yellow">{warning}</Text>
          ))}
        </Box>
      )}

      {step === "select_plan_cli" && adapters.length === 0 && (
        <Spinner label="Loading CLI adapters..." />
      )}

      {step === "select_plan_cli" && adapters.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Select
            label="Default CLI for plan:"
            options={adapterOptions}
            onSelect={handlePlanSelect}
          />
        </Box>
      )}

      {planCLI && step !== "select_plan_cli" && (
        <StatusMessage status="success">Plan CLI: {planCLI}</StatusMessage>
      )}

      {step === "select_build_cli" && (
        <Box marginTop={1} flexDirection="column">
          <Select
            label="Default CLI for build:"
            options={adapterOptions}
            onSelect={handleBuildSelect}
          />
        </Box>
      )}

      {buildCLI && !["select_plan_cli", "select_build_cli"].includes(step) && (
        <StatusMessage status="success">Build CLI: {buildCLI}</StatusMessage>
      )}

      {step === "select_verbose" && (
        <Box marginTop={1} flexDirection="column">
          <Confirm
            label="Enable verbose output?"
            onConfirm={handleVerboseSelect}
            defaultValue={existingConfig?.verbose ?? false}
          />
        </Box>
      )}

      {["select_narration", "saving_config", "complete"].includes(step) && (
        <StatusMessage status="success">
          Verbose: {String(verboseChoice)}
        </StatusMessage>
      )}

      {step === "select_narration" && (
        <Box marginTop={1} flexDirection="column">
          <Select
            label="Narration style:"
            options={narrationOptions}
            onSelect={handleNarrationSelect}
          />
        </Box>
      )}

      {(step === "saving_config" || step === "complete") && (
        <StatusMessage status="success">
          Narration: {narrationChoice}
        </StatusMessage>
      )}

      {step === "saving_config" && <Spinner label="Saving configuration..." />}

      {step === "complete" && (
        <Box flexDirection="column">
          <StatusMessage status="success">
            {eniExists
              ? "AI workflow files updated!"
              : "AI workflow initialized."}
          </StatusMessage>

          <Box flexDirection="column" marginTop={1} marginLeft={2}>
            {copyReport.addedFiles.map((file) => (
              <Text key={file} color="green">
                {"  ✓ Added "}{file}
              </Text>
            ))}
            {copyReport.skippedFiles.map((file) => (
              <Text key={file} color="gray">
                {"  ⊘ Skipped "}{file}{" (already exists)"}
              </Text>
            ))}
          </Box>

          {specsCreated && (
            <Box marginTop={1}>
              <Text dimColor>Created specs/ folder for feature specs</Text>
            </Box>
          )}

          <Box marginTop={1}>
            <StatusMessage status="success">
              Config saved to .eni/config.json
            </StatusMessage>
          </Box>

          <Box marginTop={1}>
            <Text dimColor>
              Open your CLI and run the <Text color="cyan">/functional-spec-interview</Text> to start creating specifications.
            </Text>
          </Box>

          <Box marginTop={1}>
            <Text dimColor>
              Run <Text color="cyan">eni plan</Text> to start planning with AI
            </Text>
          </Box>

          <Box marginTop={1}>
            <Text dimColor>
              Run <Text color="cyan">eni build</Text> to start building from a spec
            </Text>
          </Box>
        </Box>
      )}

      {step === "error" && (
        <Box flexDirection="column">
          <StatusMessage status="error">{error}</StatusMessage>
        </Box>
      )}
    </Box>
  );
};
