import { execa } from "execa";

export interface SshCheckResult {
  status: "ready" | "failed";
  remediated?: boolean;
  error?: string;
}

/**
 * Ensures an SSH key is loaded and available for git operations.
 *
 * Checks ssh-add -l exit codes:
 * - 0: key loaded, ready to go
 * - 1: agent running but no keys, runs ssh-add
 * - 2: no agent running, starts agent then runs ssh-add
 *
 * Uses stdio inherit for ssh-add so the user can enter their passphrase.
 */
export async function ensureSshAgent(): Promise<SshCheckResult> {
  const checkResult = await checkSshAgent();

  if (checkResult === 0) {
    return { status: "ready", remediated: false };
  }

  if (checkResult === 2) {
    const started = await startSshAgent();
    if (!started) {
      return {
        status: "failed",
        error: sshFailureMessage(),
      };
    }
  }

  // Exit code 1 or 2 (after starting agent): run ssh-add
  const added = await runSshAdd();
  if (!added) {
    return {
      status: "failed",
      error: sshFailureMessage(),
    };
  }

  // Verify key is now loaded
  const verifyResult = await checkSshAgent();
  if (verifyResult !== 0) {
    return {
      status: "failed",
      error: sshFailureMessage(),
    };
  }

  return { status: "ready", remediated: true };
}

/**
 * Checks ssh-add -l exit code.
 * Returns 0 (keys loaded), 1 (no keys), or 2 (no agent).
 */
async function checkSshAgent(): Promise<number> {
  try {
    await execa("ssh-add", ["-l"], { stdio: "pipe" });
    return 0;
  } catch (error) {
    if (isEnoent(error)) {
      throw new Error("ssh-add not found. Install OpenSSH and try again.");
    }
    const exitCode = (error as { exitCode?: number }).exitCode;
    return exitCode === 2 ? 2 : 1;
  }
}

/**
 * Starts ssh-agent and applies SSH_AUTH_SOCK and SSH_AGENT_PID to process.env.
 */
async function startSshAgent(): Promise<boolean> {
  try {
    const { stdout } = await execa("ssh-agent", ["-s"], { stdio: "pipe" });
    for (const line of stdout.split("\n")) {
      const match = line.match(/^(SSH_AUTH_SOCK|SSH_AGENT_PID)=([^;]+)/);
      if (match) {
        process.env[match[1]] = match[2];
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Runs ssh-add with inherited stdio so the passphrase prompt reaches the user.
 */
async function runSshAdd(): Promise<boolean> {
  try {
    await execa("ssh-add", [], { stdio: "inherit" });
    return true;
  } catch {
    return false;
  }
}

function isEnoent(error: unknown): boolean {
  return (error as { code?: string }).code === "ENOENT";
}

function sshFailureMessage(): string {
  return [
    "SSH key not loaded",
    "",
    "To fix this, run:",
    '  1. eval "$(ssh-agent -s)"',
    "  2. ssh-add ~/.ssh/your-key",
    "",
    "Then run `eni ai init` again.",
    "",
    "Tip: Install `keychain` to avoid this. See docs.eniem.dev/guides/ssh-setup",
  ].join("\n");
}
