import * as readline from "readline";
import {
  checkEniExists,
  sparseCloneBoilerplate,
  copyAiFiles,
  copyClaudeFilesOnly,
  ensureSpecsFolder,
  cleanupTempDir,
  detectLegacyFiles,
  removeLegacyFiles,
  initBeads,
} from "../lib/ai-init.js";

export interface AiSetupOptions {
  targetDir: string;
  gitHost: string;
  force: boolean;
  update: boolean;
}

function success(msg: string): void {
  console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
}

function fail(msg: string): void {
  console.log(`  \x1b[31m✗\x1b[0m ${msg}`);
}

function warn(msg: string): void {
  console.log(`\x1b[33m⚠\x1b[0m ${msg}`);
}

function preserved(msg: string): void {
  console.log(`  \x1b[36m↷\x1b[0m ${msg}`);
}

async function confirm(question: string, defaultYes: boolean): Promise<boolean> {
  const suffix = defaultYes ? "(Y/n)" : "(y/N)";
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  return new Promise((resolve) => {
    rl.question(`? ${question} ${suffix} `, (answer) => {
      rl.close();
      const trimmed = answer.trim().toLowerCase();
      if (trimmed === "") return resolve(defaultYes);
      resolve(trimmed === "y" || trimmed === "yes");
    });
  });
}

export async function runAiSetup(options: AiSetupOptions): Promise<void> {
  const { targetDir, gitHost, force, update } = options;

  // --update mode: .eni/ must already exist
  if (update) {
    const eniExists = await checkEniExists(targetDir);
    if (!eniExists) {
      fail(".eni/ not found. Run eni ai setup first");
      process.exit(1);
    }
    await runUpdateMode(targetDir, gitHost, force);
    return;
  }

  // Full setup mode
  await runFullSetup(targetDir, gitHost, force);
}

async function runUpdateMode(
  targetDir: string,
  gitHost: string,
  force: boolean,
): Promise<void> {
  console.log("\nUpdating Claude configuration...");

  // Sparse clone
  const cloneResult = await sparseCloneBoilerplate(gitHost);
  if (!cloneResult.success) {
    fail(`Failed to clone from eniem-boilerplate.`);
    console.log(`\n  Check your network connection and SSH access:`);
    console.log(`    ssh -T git@${gitHost}`);
    if (gitHost === "github.com") {
      console.log(`\n  If using a custom git host:`);
      console.log(`    eni ai setup --git-host=your-host.com`);
    }
    process.exit(1);
  }

  try {
    // Copy only .claude/
    const copyResult = await copyClaudeFilesOnly(cloneResult.tempDir, targetDir);
    if (!copyResult.success) {
      fail(copyResult.error ?? "Failed to copy files");
      process.exit(1);
    }

    for (const file of copyResult.copiedFiles) {
      success(file);
    }
    preserved(".eni/PROMPT_plan.md (preserved)");
    preserved(".eni/PROMPT_build.md (preserved)");

    // Check for legacy files
    await handleLegacyFiles(targetDir, force);

    console.log(`\n\x1b[32m✓\x1b[0m Update complete. Claude skills and commands refreshed.`);
  } finally {
    await cleanupTempDir(cloneResult.tempDir);
  }
}

async function runFullSetup(
  targetDir: string,
  gitHost: string,
  force: boolean,
): Promise<void> {
  const eniExists = await checkEniExists(targetDir);

  // Prompt for confirmation if .eni/ exists
  if (eniExists && !force) {
    console.log("\n.eni/ already exists. This will overwrite existing files.");
    const confirmed = await confirm("Continue?", false);
    if (!confirmed) {
      process.exit(0);
    }
  }

  console.log("\nCloning AI workflow files from eniem-boilerplate...");

  // Sparse clone
  const cloneResult = await sparseCloneBoilerplate(gitHost);
  if (!cloneResult.success) {
    fail(`Failed to clone from eniem-boilerplate.`);
    console.log(`\n  Check your network connection and SSH access:`);
    console.log(`    ssh -T git@${gitHost}`);
    if (gitHost === "github.com") {
      console.log(`\n  If using a custom git host:`);
      console.log(`    eni ai setup --git-host=your-host.com`);
    }
    process.exit(1);
  }

  try {
    // Copy .eni/ and .claude/
    const copyResult = await copyAiFiles(cloneResult.tempDir, targetDir);
    if (!copyResult.success) {
      fail(copyResult.error ?? "Failed to copy files");
      process.exit(1);
    }

    for (const file of copyResult.copiedFiles) {
      success(file);
    }

    // Ensure specs/ exists
    const specsResult = await ensureSpecsFolder(targetDir);
    if (!specsResult.success) {
      fail(specsResult.error ?? "Failed to create specs folder");
      process.exit(1);
    }
    if (specsResult.created) {
      success("specs/ (created)");
    }

    // Check for legacy files
    await handleLegacyFiles(targetDir, force);

    // Initialize beads
    console.log("\nInitializing beads...");
    const beadsResult = await initBeads(targetDir);

    switch (beadsResult.status) {
      case "initialized":
        success("bd onboard");
        console.log(`\n\x1b[32m✓\x1b[0m Setup complete. Start with: eni ai plan`);
        break;
      case "exists":
        success(".beads/ already initialized");
        console.log(`\n\x1b[32m✓\x1b[0m Setup complete. Start with: eni ai plan`);
        break;
      case "no-bd":
        warn(`bd (beads) not found — skipping beads initialization.`);
        console.log(`  Install beads to use eni ai plan/build.`);
        console.log(`\n\x1b[32m✓\x1b[0m Setup complete (without beads).`);
        break;
      case "error":
        warn(`beads initialization failed: ${beadsResult.error}`);
        console.log(`\n\x1b[32m✓\x1b[0m Setup complete (without beads).`);
        break;
    }
  } finally {
    await cleanupTempDir(cloneResult.tempDir);
  }
}

async function handleLegacyFiles(
  targetDir: string,
  force: boolean,
): Promise<void> {
  const legacyFiles = await detectLegacyFiles(targetDir);
  if (legacyFiles.length === 0) return;

  const fileList = legacyFiles.map((f) => `.eni/${f}`).join(", ");
  console.log(`\nOld ${fileList} found. ${legacyFiles.length === 1 ? "This file is" : "These files are"} no longer needed.`);

  let shouldRemove = force;
  if (!force) {
    shouldRemove = await confirm("Remove?", true);
  }

  if (shouldRemove) {
    const removed = await removeLegacyFiles(targetDir, legacyFiles);
    for (const file of removed) {
      success(`Removed ${file}`);
    }
  }
}
