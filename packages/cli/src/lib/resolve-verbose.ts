import type { EniConfig } from "./eni-config.js";

/**
 * Resolve verbose setting from CLI flag and config.
 * Priority: --verbose/--no-verbose flag > config.verbose > false
 *
 * When meow has no default for a boolean flag:
 * - undefined = user passed neither --verbose nor --no-verbose
 * - true = user passed --verbose
 * - false = user passed --no-verbose
 */
export function resolveVerbose(
  flag: boolean | undefined,
  config: EniConfig | null,
): boolean {
  return flag ?? config?.verbose ?? false;
}
