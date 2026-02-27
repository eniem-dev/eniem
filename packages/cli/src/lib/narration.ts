import type { Narration } from "./eni-config.js";

const COMMUNICATION_STYLE = `## Communication Style

Always explain what you are about to do before using any tool, and briefly summarize what you found or accomplished after. Keep narration concise — 1-2 sentences. This ensures the user can follow your progress in real-time.

`;

export function injectNarration(
  prompt: string,
  narration: Narration | undefined,
): string {
  if (narration === "explicit") {
    return COMMUNICATION_STYLE + prompt;
  }
  return prompt;
}
