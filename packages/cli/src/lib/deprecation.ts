import path from "node:path";

const COMMAND_MAP: Record<string, string> = {
  "ai init": "eni ai setup",
  products: "eni products",
};

/**
 * Returns true if the current process was invoked as the old "eniem-cli" binary.
 */
export function isDeprecatedBinary(argv1: string): boolean {
  const bin = path.basename(argv1);
  return bin.includes("eniem");
}

/**
 * Build the deprecation banner lines for the old eniem-cli binary.
 * Returns an array of stderr lines (including box borders).
 */
export function buildDeprecationBanner(
  argv1: string,
  inputArgs: string[],
): string[] {
  const contentLines = [
    "eniem-cli is deprecated. Switch to the new CLI:",
    "",
    "  npm install -g eniem",
  ];

  // Map the current command to its new equivalent
  const oldCommand = inputArgs.join(" ");
  const newCommand = COMMAND_MAP[oldCommand];
  if (newCommand) {
    contentLines.push(`  ${newCommand}`);
  } else if (inputArgs.length > 0) {
    // For project scaffolding: "eniem-cli <name>" → "eni project <name>"
    const first = inputArgs[0];
    if (first && !["ai", "products", "help", "version"].includes(first)) {
      contentLines.push(`  eni project ${first}`);
    }
  }

  // Calculate box width: widest content line + padding
  const maxLen = Math.max(...contentLines.map((l) => l.length));
  const innerWidth = maxLen + 2; // 1 space padding on each side

  const top = `╔${"═".repeat(innerWidth)}╗`;
  const bottom = `╚${"═".repeat(innerWidth)}╝`;

  const lines = [top];
  for (const line of contentLines) {
    lines.push(`║ ${line.padEnd(innerWidth - 2)} ║`);
  }
  lines.push(bottom);

  return lines;
}

/**
 * Print the deprecation banner to stderr if invoked as eniem-cli.
 * Returns true if the banner was printed.
 */
export function printDeprecationNotice(
  argv1: string,
  inputArgs: string[],
): boolean {
  if (!isDeprecatedBinary(argv1)) {
    return false;
  }

  const lines = buildDeprecationBanner(argv1, inputArgs);
  console.error("");
  for (const line of lines) {
    console.error(line);
  }
  console.error("");

  return true;
}
