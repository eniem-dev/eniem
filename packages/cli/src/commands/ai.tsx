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
  ensureAgentsMdPrimary,
  cleanupTempDir,
  getCliFileInfo,
  removeCliConfig,
  findClisNeedingRestore,
  restoreCliConfigs,
  type CopyReport,
  type CliFileInfo,
  type CliRestoreReport,
  type LegacySymlinkResult,
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
  | "remove_unselected"
  | "restore_selected"
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
  protocol?: "ssh" | "https";
}

export const AiCommand = ({ forceFlag, targetDir, gitHost, protocol }: AiCommandProps) => {
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
  const [removalQueue, setRemovalQueue] = useState<CliFileInfo[]>([]);
  const [currentRemovalIndex, setCurrentRemovalIndex] = useState(0);
  const [removalResults, setRemovalResults] = useState<{ cliName: string; removed: boolean }[]>([]);
  const [restorationReports, setRestorationReports] = useState<CliRestoreReport[]>([]);
  const [legacySymlink, setLegacySymlink] = useState<LegacySymlinkResult>({ handled: false });

  // Refs to prevent duplicate effect runs
  const isCheckingRef = useRef(false);
  const isCloningRef = useRef(false);
  const isCopyingRef = useRef(false);
  const isLoadingAdaptersRef = useRef(false);
  const isSavingConfigRef = useRef(false);
  const isCheckingRemovalRef = useRef(false);
  const isRestoringRef = useRef(false);

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
        const result = await sparseCloneBoilerplate(gitHost, protocol);
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
  }, [step, gitHost, protocol]);

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

        // Ensure AGENTS.md is primary (handle legacy CLAUDE.md-as-primary projects)
        const symResult = await ensureAgentsMdPrimary(targetDir);
        setLegacySymlink(symResult);

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

  // Check for unselected CLIs with existing config files
  useEffect(() => {
    if (step !== "remove_unselected" || isCheckingRemovalRef.current) return;
    if (removalQueue.length > 0) return; // Already populated
    isCheckingRemovalRef.current = true;

    const check = async () => {
      const unselected = adapters
        .filter(({ adapter }) => !selectedClis.includes(adapter.id))
        .map(({ adapter }) => adapter);

      const infos = await Promise.all(
        unselected.map((a) => getCliFileInfo(targetDir, a.id, a.name)),
      );

      const withFiles = infos.filter((info) => info.hasFiles);
      if (withFiles.length === 0) {
        setStep("restore_selected");
      } else {
        setRemovalQueue(withFiles);
      }
      isCheckingRemovalRef.current = false;
    };

    void check();
  }, [step, adapters, selectedClis, targetDir, removalQueue.length]);

  // Restore missing config for selected CLIs
  useEffect(() => {
    if (step !== "restore_selected" || isRestoringRef.current) return;
    isRestoringRef.current = true;

    const restore = async () => {
      const clisToRestore = await findClisNeedingRestore(targetDir, selectedClis);

      if (clisToRestore.length === 0) {
        setStep("select_plan_cli");
        isRestoringRef.current = false;
        return;
      }

      // Clone boilerplate to get fresh config files
      const cloneResult = await sparseCloneBoilerplate(gitHost, protocol);
      if (!cloneResult.success) {
        setError(cloneResult.error ?? "Could not fetch boilerplate config. Check your connection and retry.");
        setStep("error");
        isRestoringRef.current = false;
        return;
      }

      // Build CLI name map from adapters
      const cliNames: Record<string, string> = {};
      for (const { adapter } of adapters) {
        cliNames[adapter.id] = adapter.name;
      }

      const result = await restoreCliConfigs(cloneResult.tempDir, targetDir, clisToRestore, cliNames);
      await cleanupTempDir(cloneResult.tempDir);

      if (!result.success) {
        setError(result.error ?? "Failed to restore CLI configs");
        setStep("error");
        isRestoringRef.current = false;
        return;
      }

      setRestorationReports(result.reports);
      setStep("select_plan_cli");
      isRestoringRef.current = false;
    };

    void restore();
  }, [step, targetDir, selectedClis, gitHost, protocol, adapters]);

  const handleRemovalConfirm = (confirmed: boolean) => {
    const current = removalQueue[currentRemovalIndex];

    const proceed = () => {
      setRemovalResults((prev) => [...prev, { cliName: current.cliName, removed: confirmed }]);
      const nextIndex = currentRemovalIndex + 1;
      if (nextIndex >= removalQueue.length) {
        setStep("restore_selected");
      } else {
        setCurrentRemovalIndex(nextIndex);
      }
    };

    if (confirmed) {
      void removeCliConfig(targetDir, current.cliId).then(proceed);
    } else {
      proceed();
    }
  };

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

    setRemovalQueue([]);
    setCurrentRemovalIndex(0);
    setRemovalResults([]);
    isCheckingRemovalRef.current = false;
    setStep("remove_unselected");
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

      {step === "remove_unselected" && removalQueue.length === 0 && (
        <Spinner label="Checking for unselected CLI configs..." />
      )}

      {step === "remove_unselected" && removalQueue.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          {removalResults.map(({ cliName, removed }) => (
            <StatusMessage key={cliName} status={removed ? "success" : "skip"}>
              {removed ? `Removed ${cliName} config` : `Kept ${cliName} config`}
            </StatusMessage>
          ))}

          {currentRemovalIndex < removalQueue.length && (() => {
            const current = removalQueue[currentRemovalIndex];
            return (
              <Box flexDirection="column" marginTop={removalResults.length > 0 ? 1 : 0}>
                <Text>
                  You didn{"'"}t select <Text bold>{current.cliName}</Text>. Remove its config files?
                </Text>
                <Box flexDirection="column" marginLeft={2} marginTop={1}>
                  <Text dimColor>Will remove:</Text>
                  {current.folders.map(({ path: folderPath, fileCount }) => (
                    <Text key={folderPath} dimColor>
                      {"  "}{folderPath}/ ({fileCount} {fileCount === 1 ? "file" : "files"})
                    </Text>
                  ))}
                  {current.rootFiles.map((file) => (
                    <Text key={file} dimColor>{"  "}{file}</Text>
                  ))}
                </Box>
                <Box marginTop={1}>
                  <Confirm
                    label="Remove?"
                    onConfirm={handleRemovalConfirm}
                    defaultValue={false}
                  />
                </Box>
              </Box>
            );
          })()}
        </Box>
      )}

      {step !== "remove_unselected" && step !== "select_clis" && removalResults.length > 0 && (
        <Box flexDirection="column">
          {removalResults.map(({ cliName, removed }) => (
            <StatusMessage key={cliName} status={removed ? "success" : "skip"}>
              {removed ? `Removed ${cliName} config` : `Kept ${cliName} config`}
            </StatusMessage>
          ))}
        </Box>
      )}

      {step === "restore_selected" && (
        <Spinner label="Restoring config for selected CLIs..." />
      )}

      {step !== "restore_selected" && step !== "remove_unselected" && step !== "select_clis" && restorationReports.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          {restorationReports.map(({ cliName, report }) => (
            <Box key={cliName} flexDirection="column">
              <Text>Setting up config for {cliName}...</Text>
              {report.addedFiles.map((file) => (
                <Text key={file} color="green">{"  ✓ Added "}{file}</Text>
              ))}
              {report.skippedFiles.map((file) => (
                <Text key={file} color="gray">{"  ⊘ Skipped "}{file}{" (already exists)"}</Text>
              ))}
            </Box>
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

          {legacySymlink.handled && (
            <Box marginTop={1}>
              <StatusMessage status="success">
                AGENTS.md is now primary, CLAUDE.md → symlink
              </StatusMessage>
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
