export type { CLIAdapter, CLIId, CLIResult, CLIRunner, RunOptions } from "./types.js";
export { SUPPORTED_CLIS } from "./types.js";
export { claudeAdapter } from "./claude.js";
export { codexAdapter } from "./codex.js";
export { geminiAdapter } from "./gemini.js";
export {
  checkBinary,
  getAdapter,
  isValidCLI,
  listAvailable,
} from "./registry.js";
