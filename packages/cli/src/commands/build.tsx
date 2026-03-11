import { Box, Text, Static, useApp } from "ink";
import React, { useState, useEffect, useRef } from "react";
import { join } from "path";
import {
  MultiSelect,
  Spinner,
  SectionHeader,
  StatusMessage,
  FirstRunPrompt,
  MissingBinaryFallback,
} from "../components/index.js";
import { Header } from "../components/Header.js";
import { listSpecs, moveSpec } from "../lib/specs.js";
import { loadTemplate, resolveTemplate, buildTemplateVars } from "../lib/template.js";
import { checkBinary } from "../lib/adapters/index.js";
import type { CLIAdapter, CLIRunner } from "../lib/adapters/index.js";
import { resolveCLI } from "../lib/resolve-cli.js";
import type { ResolutionSource } from "../lib/resolve-cli.js";
import { injectNarration } from "../lib/narration.js";
import type { Narration } from "../lib/eni-config.js";

function toolInputSummary(name: string, input: Record<string, unknown>): string {
  const s = (...keys: string[]) => {
    for (const k of keys) {
      if (typeof input[k] === "string") return input[k] as string;
    }
    return "";
  };
  const n = name.toLowerCase().replace(/_/g, "");
  if (n === "read" || n === "readfile" || n === "edit" || n === "write") return s("file_path", "path");
  if (n === "bash" || n === "shell") return s("command").slice(0, 80);
  if (n === "glob" || n === "listdirectory") return s("pattern", "dir_path", "path");
  if (n === "grep" || n === "search") return s("pattern", "query");
  if (n === "task") return s("description");
  if (n === "webfetch") return s("url");
  if (n === "websearch") return s("query");
  return "";
}

type BuildStep = "selecting" | "resolving" | "first-run" | "fallback" | "running" | "summary" | "error";

export interface BuildCommandProps {
  specs?: string[];
  iterations: number;
  verbose: boolean;
  specsDir: string;
  promptFile: string;
  cli?: string;
  narration?: Narration;
}

interface SpecResult {
  name: string;
  iterations: number;
  totalIterations: number;
  sentinelDetected: boolean;
}

export const BuildCommand = ({
  specs: preSelectedSpecs,
  iterations,
  verbose,
  specsDir,
  promptFile,
  cli,
  narration,
}: BuildCommandProps) => {
  const { exit } = useApp();
  const [step, setStep] = useState<BuildStep>(preSelectedSpecs ? "resolving" : "selecting");
  const [specQueue, setSpecQueue] = useState<string[]>(preSelectedSpecs ?? []);
  const [currentSpecIndex, setCurrentSpecIndex] = useState(0);
  const [availableSpecs, setAvailableSpecs] = useState<{ label: string; value: string }[]>([]);
  const [currentIteration, setCurrentIteration] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [pastLines, setPastLines] = useState<string[]>([]);
  const [currentLines, setCurrentLines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resolvedAdapter, setResolvedAdapter] = useState<CLIAdapter | null>(null);
  const [resolutionSource, setResolutionSource] = useState<ResolutionSource | null>(null);
  const [firstRunAvailable, setFirstRunAvailable] = useState<CLIAdapter[]>([]);
  const [fallbackMissing, setFallbackMissing] = useState("");
  const [fallbackAvailable, setFallbackAvailable] = useState<CLIAdapter[]>([]);
  const [completedSpecs, setCompletedSpecs] = useState<SpecResult[]>([]);

  const isLoadingSpecsRef = useRef(false);
  const isResolvingRef = useRef(false);
  const isRunningRef = useRef(false);
  const runnerRef = useRef<CLIRunner | null>(null);

  const currentSpecName = specQueue[currentSpecIndex] ?? "";

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
      setAvailableSpecs(found.map((s) => ({ label: s.name, value: s.name })));
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

        if ("needsFirstRun" in result) {
          setFirstRunAvailable(result.available);
          setStep("first-run");
          isResolvingRef.current = false;
          return;
        }

        if ("needsFallback" in result) {
          setFallbackMissing(result.configured);
          setFallbackAvailable(result.available);
          setStep("fallback");
          isResolvingRef.current = false;
          return;
        }

        if (!("resolved" in result)) {
          setError("No supported CLI is installed. Install one of: claude, codex, opencode");
          setStep("error");
          isResolvingRef.current = false;
          return;
        }

        setResolvedAdapter(result.adapter);
        setResolutionSource(result.source);

        // Validate all spec names if pre-selected
        if (specQueue.length > 0) {
          const found = await listSpecs(specsDir);
          const validNames = new Set(found.map((s) => s.name));
          const invalid = specQueue.filter((n) => !validNames.has(n));
          if (invalid.length > 0) {
            setError(`Spec not found: ${invalid.map((n) => join(specsDir, n + ".md")).join(", ")}`);
            setStep("error");
            isResolvingRef.current = false;
            return;
          }
        }

        setStep("running");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
        setStep("error");
      }
      isResolvingRef.current = false;
    };
    void resolve();
  }, [step, cli, specQueue, specsDir]);

  // Run iteration loop for current spec
  useEffect(() => {
    if (step !== "running" || !resolvedAdapter || isRunningRef.current) return;
    if (currentSpecIndex >= specQueue.length) return;
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

      const specName = specQueue[currentSpecIndex]!;

      // Resolve spec path
      const found = await listSpecs(specsDir);
      const match = found.find((s) => s.name === specName);
      if (!match) {
        setError(`Spec not found: ${join(specsDir, specName + ".md")}`);
        setStep("error");
        isRunningRef.current = false;
        return;
      }

      let detectedSentinel = false;

      // Add spec separator to past lines if processing 2nd+ spec
      if (currentSpecIndex > 0) {
        setPastLines((past) => [...past, "", `━━ Spec: ${specName} ━━`]);
      }

      for (let i = 1; i <= iterations; i++) {
        setCurrentIteration(i);
        if (i > 1) {
          setCurrentLines((prev) => {
            setPastLines((past) => [...past, `── Iteration ${i - 1} ──`, ...prev]);
            return [];
          });
        }

        const vars = buildTemplateVars(specName, i, "build");
        const resolved = resolveTemplate(template, vars);
        const prompt = injectNarration(resolved, narration);

        const runner = resolvedAdapter.run(prompt, {
          onText: (text) => {
            setCurrentLines((prev) => [...prev, text]);
          },
          onToolUse: verbose
            ? (toolName, toolInput) => {
                const detail = toolInputSummary(toolName, toolInput);
                setCurrentLines((prev) => [
                  ...prev,
                  detail ? `[tool] ${toolName}: ${detail}` : `[tool] ${toolName}`,
                ]);
              }
            : undefined,
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

      // Only archive the spec when sentinel was detected
      if (detectedSentinel) {
        const archiveDir = specsDir.replace(/\/planned\/?$/, "/archive");
        await moveSpec(match.path, archiveDir);
      }

      const specResult: SpecResult = {
        name: specName,
        iterations: detectedSentinel ? currentIteration : iterations,
        totalIterations: iterations,
        sentinelDetected: detectedSentinel,
      };
      setCompletedSpecs((prev) => [...prev, specResult]);

      // Flush current lines to past
      setCurrentLines((prev) => {
        setPastLines((past) => [...past, ...prev]);
        return [];
      });

      // Advance to next spec or finish
      const nextIndex = currentSpecIndex + 1;
      if (nextIndex < specQueue.length) {
        setCurrentSpecIndex(nextIndex);
        setCurrentIteration(1);
        setElapsed(0);
        isRunningRef.current = false;
      } else {
        setStep("summary");
        isRunningRef.current = false;
      }
    };
    void runLoop();
  }, [step, resolvedAdapter, currentSpecIndex, specQueue, iterations, promptFile, verbose, specsDir, narration]);

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

  const handleSpecsSelected = (values: string[]) => {
    setSpecQueue(values);
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

  const formatElapsed = (s: number) =>
    s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${String(s % 60).padStart(2, "0")}s`;

  const specProgress = specQueue.length > 1
    ? ` [${currentSpecIndex + 1}/${specQueue.length}]`
    : "";

  return (
    <Box flexDirection="column">
      {step === "selecting" && <Header />}
      <SectionHeader title="Build" subtitle={currentSpecName || undefined} />

      {step === "selecting" && availableSpecs.length > 0 && (
        <MultiSelect
          label="Select specs to build:"
          items={availableSpecs}
          onSubmit={handleSpecsSelected}
          required
          emptyHintText="Select at least one spec"
        />
      )}

      {step === "selecting" && availableSpecs.length === 0 && !error && (
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
              <Text key={i} dimColor={line.startsWith("[tool]") || line.startsWith("──") || line.startsWith("━━")}>
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
          <Spinner label={`${currentSpecName}${specProgress} · Iteration ${currentIteration}/${iterations} (${formatElapsed(elapsed)})`} />
        </Box>
      )}

      {step === "summary" && (
        <Box flexDirection="column">
          <StatusMessage status="success">
            Build complete — {completedSpecs.length} spec{completedSpecs.length !== 1 ? "s" : ""} processed.
          </StatusMessage>
          {completedSpecs.map((sr) => (
            <Box key={sr.name} marginLeft={2}>
              <Text dimColor>
                {sr.name}: {sr.sentinelDetected
                  ? `${sr.iterations}/${sr.totalIterations} iterations (early exit) — archived`
                  : `${sr.totalIterations}/${sr.totalIterations} iterations — stays in planned`}
              </Text>
            </Box>
          ))}
        </Box>
      )}

      {step === "error" && (
        <StatusMessage status="error">{error}</StatusMessage>
      )}
    </Box>
  );
};
