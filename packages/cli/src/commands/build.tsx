import { Box, Text, Static, useApp } from "ink";
import React, { useState, useEffect, useRef } from "react";
import {
  Select,
  Spinner,
  SectionHeader,
  StatusMessage,
  FirstRunPrompt,
  MissingBinaryFallback,
} from "../components/index.js";
import { listSpecs, moveSpec } from "../lib/specs.js";
import { loadTemplate, resolveTemplate, buildTemplateVars } from "../lib/template.js";
import { checkBinary } from "../lib/adapters/index.js";
import type { CLIAdapter, CLIRunner } from "../lib/adapters/index.js";
import { resolveCLI } from "../lib/resolve-cli.js";
import type { ResolutionSource } from "../lib/resolve-cli.js";

function toolInputSummary(name: string, input: Record<string, unknown>): string {
  const s = (k: string) => (typeof input[k] === "string" ? (input[k] as string) : "");
  if (name === "Read" || name === "Edit" || name === "Write") return s("file_path");
  if (name === "Bash") return s("command").slice(0, 80);
  if (name === "Glob") return s("pattern");
  if (name === "Grep") return s("pattern");
  if (name === "Task") return s("description");
  if (name === "WebFetch") return s("url");
  if (name === "WebSearch") return s("query");
  return "";
}

type BuildStep = "selecting" | "resolving" | "first-run" | "fallback" | "running" | "summary" | "error";

export interface BuildCommandProps {
  spec?: string;
  iterations: number;
  verbose: boolean;
  specsDir: string;
  promptFile: string;
  cli?: string;
}

export const BuildCommand = ({
  spec,
  iterations,
  verbose,
  specsDir,
  promptFile,
  cli,
}: BuildCommandProps) => {
  const { exit } = useApp();
  const [step, setStep] = useState<BuildStep>(spec ? "resolving" : "selecting");
  const [specName, setSpecName] = useState(spec ?? "");
  const [specPath, setSpecPath] = useState("");
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>([]);
  const [currentIteration, setCurrentIteration] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [sentinelDetected, setSentinelDetected] = useState(false);
  const [pastLines, setPastLines] = useState<string[]>([]);
  const [currentLines, setCurrentLines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resolvedAdapter, setResolvedAdapter] = useState<CLIAdapter | null>(null);
  const [resolutionSource, setResolutionSource] = useState<ResolutionSource | null>(null);
  const [firstRunAvailable, setFirstRunAvailable] = useState<CLIAdapter[]>([]);
  const [fallbackMissing, setFallbackMissing] = useState("");
  const [fallbackAvailable, setFallbackAvailable] = useState<CLIAdapter[]>([]);

  const isLoadingSpecsRef = useRef(false);
  const isResolvingRef = useRef(false);
  const isRunningRef = useRef(false);
  const runnerRef = useRef<CLIRunner | null>(null);

  // Load specs for selection
  useEffect(() => {
    if (step !== "selecting" || isLoadingSpecsRef.current) return;
    isLoadingSpecsRef.current = true;

    const load = async () => {
      const found = await listSpecs(specsDir);
      if (found.length === 0) {
        setError(
          `No planned specs found in ${specsDir}. Run eni plan first.`,
        );
        setStep("error");
        isLoadingSpecsRef.current = false;
        return;
      }
      setSpecs(found.map((s) => ({ label: s.name, value: s.name })));
      isLoadingSpecsRef.current = false;
    };
    void load();
  }, [step, specsDir]);

  // Resolve CLI adapter
  useEffect(() => {
    if (step !== "resolving" || isResolvingRef.current) return;
    isResolvingRef.current = true;

    const resolve = async () => {
      try {
        const result = await resolveCLI({
          cliFlag: cli,
          command: "build",
          cwd: process.cwd(),
        });

        if ("resolved" in result) {
          setResolvedAdapter(result.adapter);
          setResolutionSource(result.source);
          setStep("running");
        } else if ("needsFirstRun" in result) {
          setFirstRunAvailable(result.available);
          setStep("first-run");
        } else if ("needsFallback" in result) {
          setFallbackMissing(result.configured);
          setFallbackAvailable(result.available);
          setStep("fallback");
        } else {
          setError("No supported CLI is installed. Install one of: claude, codex, gemini, opencode");
          setStep("error");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
        setStep("error");
      }
      isResolvingRef.current = false;
    };
    void resolve();
  }, [step, cli]);

  // Resolve spec path when specName is set and we move to running
  useEffect(() => {
    if (step !== "running" || !specName || specPath) return;

    const resolve = async () => {
      const found = await listSpecs(specsDir);
      const match = found.find((s) => s.name === specName);
      if (!match) {
        setError(`Spec not found: ${specName}`);
        setStep("error");
        return;
      }
      setSpecPath(match.path);
    };
    void resolve();
  }, [step, specName, specPath, specsDir]);

  // Run iteration loop
  useEffect(() => {
    if (step !== "running" || !specPath || !resolvedAdapter || isRunningRef.current) return;
    isRunningRef.current = true;

    const runLoop = async () => {
      // Lazy prerequisite checks
      if (!(await checkBinary("bd"))) {
        setError("Beads CLI not found. Install it with: npm install -g @beads-cli/bd");
        setStep("error");
        isRunningRef.current = false;
        return;
      }

      let template: string;
      try {
        template = await loadTemplate(promptFile);
      } catch {
        setError(`Prompt file not found: ${promptFile}`);
        setStep("error");
        isRunningRef.current = false;
        return;
      }

      let detectedSentinel = false;

      for (let i = currentIteration; i <= iterations; i++) {
        setCurrentIteration(i);
        if (i > 1) {
          setCurrentLines((prev) => {
            setPastLines((past) => [...past, `── Iteration ${i - 1} ──`, ...prev]);
            return [];
          });
        }

        const vars = buildTemplateVars(specName, i, "build");
        const prompt = resolveTemplate(template, vars);

        const runner = resolvedAdapter.run(prompt, {
          onText: (text) => {
            setCurrentLines((prev) => [...prev, text]);
          },
          onToolUse: (toolName, toolInput) => {
            const detail = verbose ? toolInputSummary(toolName, toolInput) : "";
            setCurrentLines((prev) => [
              ...prev,
              detail ? `[tool] ${toolName}: ${detail}` : `[tool] ${toolName}`,
            ]);
          },
        });
        runnerRef.current = runner;

        try {
          const result = await runner.result;

          if (result.sentinelDetected) {
            detectedSentinel = true;
            break;
          }

          if (result.exitCode !== 0) {
            const detail = result.stderr.trim();
            setError(
              detail
                ? `CLI exited with code ${result.exitCode}:\n${detail}`
                : `CLI exited with code ${result.exitCode} (no stderr output)`,
            );
            setStep("error");
            isRunningRef.current = false;
            return;
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          setError(message);
          setStep("error");
          isRunningRef.current = false;
          return;
        }
      }

      setSentinelDetected(detectedSentinel);

      // Only archive the spec when sentinel was detected
      if (detectedSentinel) {
        const archiveDir = specsDir.replace(/\/planned\/?$/, "/archive");
        await moveSpec(specPath, archiveDir);
      }

      setStep("summary");
      isRunningRef.current = false;
    };
    void runLoop();
  }, [step, specPath, specName, iterations, currentIteration, promptFile, verbose, resolvedAdapter]);

  // Exit on terminal states
  useEffect(() => {
    if (step === "summary" || step === "error") {
      const timer = setTimeout(() => exit(), 0);
      return () => clearTimeout(timer);
    }
  }, [step, exit]);

  // Elapsed time ticker
  useEffect(() => {
    if (step !== "running") return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [step]);

  // Kill subprocess on Ctrl+C and exit with code 130
  useEffect(() => {
    const handler = () => {
      runnerRef.current?.kill();
      process.exit(130);
    };
    process.on("SIGINT", handler);
    return () => {
      process.off("SIGINT", handler);
    };
  }, []);

  const handleSpecSelect = (value: string) => {
    setSpecName(value);
    setStep("resolving");
  };

  const handleFirstRunComplete = () => {
    isResolvingRef.current = false;
    setStep("resolving");
  };

  const handleFallbackSelect = (adapter: CLIAdapter) => {
    setResolvedAdapter(adapter);
    setResolutionSource("default");
    setStep("running");
  };

  const cliIndicator = resolvedAdapter
    ? `Using ${resolvedAdapter.id} for build${resolutionSource === "flag" ? " (--cli override)" : ""}`
    : null;

  return (
    <Box flexDirection="column">
      <SectionHeader title="Build" />

      {step === "selecting" && specs.length > 0 && (
        <Select
          label="Select a spec to build:"
          options={specs}
          onSelect={handleSpecSelect}
        />
      )}

      {step === "selecting" && specs.length === 0 && !error && (
        <Spinner label="Loading specs..." />
      )}

      {step === "resolving" && (
        <Spinner label="Resolving CLI..." />
      )}

      {step === "first-run" && (
        <FirstRunPrompt
          available={firstRunAvailable}
          cwd={process.cwd()}
          onComplete={handleFirstRunComplete}
        />
      )}

      {step === "fallback" && (
        <MissingBinaryFallback
          missing={fallbackMissing}
          available={fallbackAvailable}
          onSelect={handleFallbackSelect}
        />
      )}

      {step === "running" && (
        <Box flexDirection="column">
          {cliIndicator && (
            <Box marginBottom={1}>
              <Text dimColor>{cliIndicator}</Text>
            </Box>
          )}
          <Static items={pastLines}>
            {(line, i) => (
              <Text key={i} dimColor={line.startsWith("[tool]") || line.startsWith("──")}>
                {line}
              </Text>
            )}
          </Static>
          {currentLines.length > 0 && (
            <Box flexDirection="column" marginLeft={2}>
              {currentLines.slice(-20).map((line, i) => (
                <Text key={i} dimColor={line.startsWith("[tool]")}>{line}</Text>
              ))}
            </Box>
          )}
          <Spinner label={`Iteration ${currentIteration}/${iterations} (${elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m${String(elapsed % 60).padStart(2, "0")}s`})`} />
        </Box>
      )}

      {step === "summary" && (
        <Box flexDirection="column">
          <StatusMessage status="success">
            {sentinelDetected
              ? "Build complete — spec archived."
              : `Completed ${iterations}/${iterations} iterations. Some tasks may remain — spec stays in planned.`}
          </StatusMessage>
          <Box marginTop={1} marginLeft={2}>
            <Text dimColor>
              {sentinelDetected
                ? `Completed in ${currentIteration}/${iterations} iterations (early exit).`
                : `All ${iterations} iterations used.`}
            </Text>
          </Box>
        </Box>
      )}

      {step === "error" && (
        <StatusMessage status="error">{error}</StatusMessage>
      )}
    </Box>
  );
};
