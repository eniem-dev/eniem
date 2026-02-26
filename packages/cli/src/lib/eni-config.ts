import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

import { SUPPORTED_CLIS, type CLIId } from "./adapters/types.js";

export interface EniConfig {
  plan?: CLIId;
  build?: CLIId;
}

const CONFIG_DIR = ".eni";
const CONFIG_FILE = "config.json";

function configPath(cwd: string): string {
  return join(cwd, CONFIG_DIR, CONFIG_FILE);
}

export function validateConfig(data: unknown): EniConfig {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("Invalid config: expected a JSON object {}");
  }

  const obj = data as Record<string, unknown>;
  const config: EniConfig = {};

  for (const key of ["plan", "build"] as const) {
    if (key in obj) {
      const value = obj[key];
      if (
        typeof value !== "string" ||
        !SUPPORTED_CLIS.includes(value as CLIId)
      ) {
        throw new Error(
          `Invalid config: "${key}" must be one of: ${SUPPORTED_CLIS.join(", ")} (got "${String(value)}")`,
        );
      }
      config[key] = value as CLIId;
    }
  }

  return config;
}

export async function readConfig(cwd: string): Promise<EniConfig | null> {
  try {
    const raw = await readFile(configPath(cwd), "utf-8");
    const data: unknown = JSON.parse(raw);
    return validateConfig(data);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return null;
    }

    if (error instanceof SyntaxError) {
      throw new Error(
        `Invalid JSON in ${CONFIG_DIR}/${CONFIG_FILE}: ${error.message}. Fix or delete the file.`,
      );
    }

    throw error;
  }
}

export async function writeConfig(
  cwd: string,
  config: EniConfig,
): Promise<void> {
  const dir = join(cwd, CONFIG_DIR);
  await mkdir(dir, { recursive: true });
  await writeFile(configPath(cwd), JSON.stringify(config, null, 2) + "\n");
}
