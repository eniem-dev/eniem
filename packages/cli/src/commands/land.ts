import { execa } from "execa";

function success(msg: string): void {
  console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
}

function fail(msg: string): void {
  console.log(`  \x1b[31m✗\x1b[0m ${msg}`);
}

function retry(msg: string): void {
  console.log(`  \x1b[33m↻\x1b[0m ${msg}`);
}

async function isGitRepo(): Promise<boolean> {
  try {
    await execa("git", ["rev-parse", "--is-inside-work-tree"]);
    return true;
  } catch {
    return false;
  }
}

async function hasUpstream(): Promise<boolean> {
  try {
    await execa("git", ["rev-parse", "--abbrev-ref", "@{u}"]);
    return true;
  } catch {
    return false;
  }
}

async function hasUncommittedChanges(): Promise<boolean> {
  const { stdout } = await execa("git", ["status", "--porcelain"]);
  return stdout.trim().length > 0;
}

async function isUpToDate(): Promise<boolean> {
  const { stdout } = await execa("git", ["status"]);
  return stdout.includes("up to date") || stdout.includes("up-to-date");
}

async function bdSyncFull(): Promise<{ ok: boolean; error?: string }> {
  try {
    await execa("bd", ["sync", "--full"]);
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("ENOENT") || msg.includes("not found")) {
      return { ok: false, error: "bd not found. Install beads first." };
    }
    return { ok: false, error: msg };
  }
}

async function gitPush(): Promise<{ ok: boolean; error?: string }> {
  try {
    const upstream = await hasUpstream();
    if (upstream) {
      await execa("git", ["push"]);
    } else {
      await execa("git", ["push", "-u", "origin", "HEAD"]);
    }
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { ok: false, error: msg };
  }
}

async function gitPullRebase(): Promise<{ ok: boolean; error?: string }> {
  try {
    await execa("git", ["pull", "--rebase"]);
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { ok: false, error: msg };
  }
}

export async function runLand(): Promise<void> {
  // Check if we're in a git repo
  if (!(await isGitRepo())) {
    console.log("\x1b[31m✗ Not in a git repository\x1b[0m");
    process.exit(1);
  }

  // Warn about uncommitted changes
  if (await hasUncommittedChanges()) {
    console.log("\x1b[33m⚠ Uncommitted changes detected. They won't be pushed.\x1b[0m");
  }

  // Step 1: bd sync full
  console.log("Syncing beads...");
  const syncResult = await bdSyncFull();
  if (!syncResult.ok) {
    fail(`bd sync full`);
    console.log(`\n\x1b[31m✗ ${syncResult.error}\x1b[0m`);
    process.exit(1);
  }
  success("bd sync full");

  // Step 2: git push
  console.log("\nPushing...");
  const pushResult = await gitPush();
  if (pushResult.ok) {
    success("git push");
  } else {
    fail("git push (rejected)");

    // Retry: pull --rebase then push
    retry("git pull --rebase");
    const rebaseResult = await gitPullRebase();
    if (!rebaseResult.ok) {
      console.log(`\n\x1b[31m✗ Push failed. Resolve conflicts and try again.\x1b[0m`);
      process.exit(1);
    }

    const retryPush = await gitPush();
    if (retryPush.ok) {
      success("git push");
    } else {
      fail("git push (rejected)");
      console.log(`\n\x1b[31m✗ Push failed. Resolve conflicts and try again.\x1b[0m`);
      process.exit(1);
    }
  }

  // Step 3: Verify up to date
  if (await isUpToDate()) {
    console.log(`\n\x1b[32m✓\x1b[0m All work pushed. Branch is up to date with origin.`);
  } else {
    console.log(`\n\x1b[32m✓\x1b[0m All work pushed.`);
  }
}
