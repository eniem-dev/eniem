import { execa } from "execa";
import type { CLIAdapter, CLIId } from "./types.js";
import { SUPPORTED_CLIS } from "./types.js";
import { claudeAdapter } from "./claude.js";
import { codexAdapter } from "./codex.js";

const ADAPTERS: Record<string, CLIAdapter> = {
  claude: claudeAdapter,
  codex: codexAdapter,
};

export async function checkBinary(name: string): Promise<boolean> {
  try {
    await execa(name, ["--version"]);
    return true;
  } catch (err: unknown) {
    const error = err as { code?: string };
    return error.code !== "ENOENT";
  }
}

export function isValidCLI(id: string): id is CLIId {
  return (SUPPORTED_CLIS as readonly string[]).includes(id);
}

export function getAdapter(id: string): CLIAdapter {
  const adapter = ADAPTERS[id];
  if (!adapter) {
    const valid = Object.keys(ADAPTERS).join(", ");
    throw new Error(`Unknown CLI adapter "${id}". Available: ${valid}`);
  }
  return adapter;
}

export async function listAvailable(): Promise<CLIAdapter[]> {
  const results = await Promise.all(
    Object.values(ADAPTERS).map(async (adapter) => ({
      adapter,
      available: await checkBinary(adapter.binary),
    })),
  );
  return results.filter((r) => r.available).map((r) => r.adapter);
}
