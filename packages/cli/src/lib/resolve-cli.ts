import type { CLIAdapter, CLIId } from "./adapters/types.js";
import { SUPPORTED_CLIS } from "./adapters/types.js";
import { getAdapter, isValidCLI, listAvailable } from "./adapters/registry.js";
import { readConfig } from "./eni-config.js";

export type ResolutionSource = "flag" | "config" | "default";

export type CLIResolution =
  | { resolved: true; adapter: CLIAdapter; source: ResolutionSource }
  | { needsFirstRun: true; available: CLIAdapter[] }
  | { needsFallback: true; configured: string; available: CLIAdapter[] }
  | { noClisAvailable: true };

export interface ResolveOptions {
  cliFlag?: string;
  command: "plan" | "build";
  cwd: string;
}

export async function resolveCLI(
  options: ResolveOptions,
): Promise<CLIResolution> {
  const { cliFlag, command, cwd } = options;

  // Step 1: --cli flag takes highest priority
  if (cliFlag) {
    if (!isValidCLI(cliFlag)) {
      throw new Error(
        `"${cliFlag}" is not a valid CLI. Valid options: ${SUPPORTED_CLIS.join(", ")}`,
      );
    }
    return resolveWithBinaryCheck(cliFlag, "flag");
  }

  // Step 2: Read config file
  const config = await readConfig(cwd);

  // No config file → needs first-run prompt
  if (config === null) {
    const available = await listAvailable();
    if (available.length === 0) return { noClisAvailable: true };
    return { needsFirstRun: true, available };
  }

  // Step 3: Config exists — use command-specific key or default to 'claude'
  const cliId = config[command] ?? "claude";

  if (!isValidCLI(cliId)) {
    throw new Error(
      `"${cliId}" is not a valid CLI. Valid options: ${SUPPORTED_CLIS.join(", ")}`,
    );
  }

  const source: ResolutionSource = config[command] ? "config" : "default";
  return resolveWithBinaryCheck(cliId, source);
}

async function resolveWithBinaryCheck(
  cliId: CLIId,
  source: ResolutionSource,
): Promise<CLIResolution> {
  const adapter = getAdapter(cliId);
  const available = await listAvailable();

  const isInstalled = available.some((a) => a.id === cliId);
  if (!isInstalled) {
    if (available.length === 0) return { noClisAvailable: true };
    return { needsFallback: true, configured: cliId, available };
  }

  return { resolved: true, adapter, source };
}
