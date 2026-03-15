import { Box, Text, Static, useApp } from "ink";
import React, { useState, useEffect, useRef } from "react";
import { join } from "path";
import {
  Select,
  Spinner,
  SectionHeader,
  StatusMessage,
  FirstRunPrompt,
  MissingBinaryFallback,
} from "../components/index.js";
import { Header } from "../components/Header.js";
import { listSpecs, moveSpec, sortByNumericPrefix } from "../lib/specs.js";
import type { SpecFile } from "../lib/specs.js";
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

interface SpecResult {
  name: string;
  success: boolean;
  iterationsUsed: number;
  totalIterations: number;
  earlyExit: boolean;
}

type PlanStep = "selecting" | "resolving" | "first-run" | "fallback" | "running" | "summary" | "error";

export interface PlanCommandProps {
  spec?: string;
  all?: boolean;
  iterations: number;
  verbose: boolean;
  specsDir: string;
  promptFile: string;
  cli?: string;
  narration?: Narration;
}

export const PlanCommand = ({
  spec,
  all,
  iterations,
  verbose,
  specsDir,
  promptFile,
  cli,
  narration,
}: PlanCommandProps) => {
  const { exit } = useApp();
  const [step, setStep] = useState<PlanStep>(spec ? "resolving" : all ? "resolving" : "selecting");
  const [specName, setSpecName] = useState(spec ?? (all ? "__all__" : ""));
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

  // All-mode state
  const [allSpecs, setAllSpecs] = useState<SpecFile[]>([]);
  const [currentSpecIndex, setCurrentSpecIndex] = useState(0);
  const [specResults, setSpecResults] = useState<SpecResult[]>([]);

  const isAllMode = specName === "__all__";

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
        setError(`No unplanned specs found in ${specsDir}. Create a spec file first.`);
        setStep("error");
        isLoadingSpecsRef.current = false;
        return;
      }
      const options = found.map((s) => ({ label: s.name, value: s.name }));
      options.push({ label: "Run all", value: "__all__" });
      setSpecs(options);
      isLoadingSpecsRef.current = false;
    };
    void load();
  }, [step, specsDir]);

  // Resolve CLI adapter first, then validate spec
  useEffect(() => {
    if (step !== "resolving" || isResolvingRef.current) return;
    isResolvingRef.current = true;

    const resolve = async () => {
      try {
        const result = await resolveCLI({
          cliFlag: cli,
          command: "plan",
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

        if (specName && specName !== "__all__") {
          const found = await listSpecs(specsDir);
          const match = found.find((s) => s.name === specName);
          if (!match) {
            setError(`Spec not found: ${join(specsDir, specName + ".md")}`);
            setStep("error");
            isResolvingRef.current = false;
            return;
          }
          setSpecPath(match.path);
        }

        setStep("running");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
        setStep("error");
      }
      isResolvingRef.current = false;
    };
    void resolve();
  }, [step, cli, specName, specsDir]);

  // Resolve spec path when specName is set and we move to running (single-spec only)
  useEffect(() => {
    if (step !== "running" || !specName || specName === "__all__" || specPath) return;

    const resolve = async () => {
      const found = await listSpecs(specsDir);
      const match = found.find((s) => s.name === specName);
      if (!match) {
        setError(`Spec not found: ${join(specsDir, specName + ".md")}`);
        setStep("error");
        return;
      }
      setSpecPath(match.path);
    };
    void resolve();
  }, [step, specName, specPath, specsDir]);

  // Run iteration loop — single-spec mode
  useEffect(() => {
    if (step !== "running" || isAllMode || !specPath || !resolvedAdapter || isRunningRef.current) return;
    isRunningRef.current = true;

    const runLoop = async () => {
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

        const vars = buildTemplateVars(specName, i, "plan");
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

      // Move spec to planned
      setSentinelDetected(detectedSentinel);
      const plannedDir = join(specsDir, "planned");
      await moveSpec(specPath, plannedDir);

      setStep("summary");
      isRunningRef.current = false;
    };
    void runLoop();
  }, [step, specPath, specName, iterations, currentIteration, promptFile, verbose, resolvedAdapter, isAllMode]);

  // Run iteration loop — all-specs mode
  useEffect(() => {
    if (step !== "running" || !isAllMode || !resolvedAdapter || isRunningRef.current) return;
    isRunningRef.current = true;

    const runAllLoop = async () => {
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

      // Load and sort all specs
      const found = await listSpecs(specsDir);
      if (found.length === 0) {
        setError(`No unplanned specs found in ${specsDir}. Create a spec file first.`);
        setStep("error");
        isRunningRef.current = false;
        return;
      }
      const sorted = sortByNumericPrefix(found);
      setAllSpecs(sorted);

      const results: SpecResult[] = [];

      for (let si = 0; si < sorted.length; si++) {
        const currentSpec = sorted[si];
        setCurrentSpecIndex(si);
        setSpecName(currentSpec.name);
        setCurrentIteration(1);
        setCurrentLines([]);
        setPastLines((past) => {
          if (si > 0) return [...past, `── Spec ${si}/${sorted.length}: ${sorted[si - 1].name} complete ──`];
          return past;
        });

        let detectedSentinel = false;
        let iterationsUsed = 0;

        for (let i = 1; i <= iterations; i++) {
          setCurrentIteration(i);
          iterationsUsed = i;
          if (i > 1) {
            setCurrentLines((prev) => {
              setPastLines((past) => [...past, `── Iteration ${i - 1} ──`, ...prev]);
              return [];
            });
          }

          const vars = buildTemplateVars(currentSpec.name, i, "plan");
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
              results.push({ name: currentSpec.name, success: false, iterationsUsed: i, totalIterations: iterations, earlyExit: false });
              setSpecResults(results);
              setError(
                `Plan failed on spec ${si + 1}/${sorted.length}: ${currentSpec.name}\n\n` +
                (detail
                  ? `CLI exited with code ${result.exitCode}:\n${detail}`
                  : `CLI exited with code ${result.exitCode} (no stderr output)`) +
                `\n\n${si}/${sorted.length} specs completed before failure.`,
              );
              setStep("error");
              isRunningRef.current = false;
              return;
            }
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            results.push({ name: currentSpec.name, success: false, iterationsUsed: i, totalIterations: iterations, earlyExit: false });
            setSpecResults(results);
            setError(
              `Plan failed on spec ${si + 1}/${sorted.length}: ${currentSpec.name}\n\n${message}\n\n${si}/${sorted.length} specs completed before failure.`,
            );
            setStep("error");
            isRunningRef.current = false;
            return;
          }
        }

        // Move spec to planned
        const plannedDir = join(specsDir, "planned");
        await moveSpec(currentSpec.path, plannedDir);

        results.push({
          name: currentSpec.name,
          success: true,
          iterationsUsed,
          totalIterations: iterations,
          earlyExit: detectedSentinel,
        });
        setSpecResults([...results]);
      }

      setStep("summary");
      isRunningRef.current = false;
    };
    void runAllLoop();
  }, [step, isAllMode, resolvedAdapter, specsDir, iterations, promptFile, verbose, narration]);

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
    ? `Using ${resolvedAdapter.id} for plan${resolutionSource === "flag" ? " (--cli override)" : ""}`
    : null;

  const subtitle = isAllMode && allSpecs.length > 0
    ? `Run all (Spec ${currentSpecIndex + 1}/${allSpecs.length}: ${allSpecs[currentSpecIndex]?.name ?? specName})`
    : specName === "__all__"
      ? "Run all"
      : specName || undefined;

  return (
    <Box flexDirection="column">
      {step === "selecting" && <Header />}
      <SectionHeader title="Plan" subtitle={subtitle} />

      {step === "selecting" && specs.length > 0 && (
        <Select
          label="Select a spec to plan:"
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

      {step === "summary" && !isAllMode && (
        <Box flexDirection="column">
          <StatusMessage status="success">
            Plan complete — spec moved to planned.
          </StatusMessage>
          <Box marginTop={1} marginLeft={2}>
            <Text dimColor>
              {sentinelDetected
                ? `Completed in ${currentIteration}/${iterations} iterations (early exit).`
                : `Completed ${iterations}/${iterations} iterations.`}
            </Text>
          </Box>
        </Box>
      )}

      {step === "summary" && isAllMode && (
        <Box flexDirection="column">
          <StatusMessage status="success">
            Plan complete — {specResults.length}/{specResults.length} specs planned.
          </StatusMessage>
          <Box marginTop={1} marginLeft={2} flexDirection="column">
            {specResults.map((r, i) => (
              <Text key={i} dimColor>
                {"  "}{r.name} ✓ ({r.iterationsUsed}/{r.totalIterations} iterations{r.earlyExit ? ", early exit" : ""})
              </Text>
            ))}
          </Box>
        </Box>
      )}

      {step === "error" && (
        <StatusMessage status="error">{error}</StatusMessage>
      )}
    </Box>
  );
};
