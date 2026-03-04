import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ensureSshAgent } from "../ssh.js";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

import { execa } from "execa";

function execaError(opts: { exitCode?: number; code?: string; message?: string }) {
  const err = new Error(opts.message ?? "Command failed") as Error & { exitCode?: number; code?: string };
  if (opts.exitCode !== undefined) err.exitCode = opts.exitCode;
  if (opts.code !== undefined) err.code = opts.code;
  return err;
}

describe("ssh", () => {
  describe("ensureSshAgent", () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      process.env = { ...originalEnv };
    });

    it("returns ready when ssh-add -l succeeds (exit 0)", async () => {
      vi.mocked(execa).mockResolvedValueOnce({} as never);

      const result = await ensureSshAgent();

      expect(result).toEqual({ status: "ready", remediated: false });
      expect(execa).toHaveBeenCalledTimes(1);
      expect(execa).toHaveBeenCalledWith("ssh-add", ["-l"], { stdio: "pipe" });
    });

    it("runs ssh-add when agent running but no keys (exit 1)", async () => {
      // First call: ssh-add -l returns exit code 1
      vi.mocked(execa).mockRejectedValueOnce(execaError({ exitCode: 1 }));
      // Second call: ssh-add (interactive) succeeds
      vi.mocked(execa).mockResolvedValueOnce({} as never);
      // Third call: ssh-add -l verify succeeds
      vi.mocked(execa).mockResolvedValueOnce({} as never);

      const result = await ensureSshAgent();

      expect(result).toEqual({ status: "ready", remediated: true });
      expect(execa).toHaveBeenCalledTimes(3);
      expect(execa).toHaveBeenNthCalledWith(2, "ssh-add", [], { stdio: "inherit" });
    });

    it("starts agent then runs ssh-add when no agent (exit 2)", async () => {
      // First call: ssh-add -l returns exit code 2
      vi.mocked(execa).mockRejectedValueOnce(execaError({ exitCode: 2 }));
      // Second call: ssh-agent -s
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: "SSH_AUTH_SOCK=/tmp/ssh-xxx/agent.123; export SSH_AUTH_SOCK;\nSSH_AGENT_PID=456; export SSH_AGENT_PID;\n",
      } as never);
      // Third call: ssh-add (interactive)
      vi.mocked(execa).mockResolvedValueOnce({} as never);
      // Fourth call: ssh-add -l verify
      vi.mocked(execa).mockResolvedValueOnce({} as never);

      const result = await ensureSshAgent();

      expect(result).toEqual({ status: "ready", remediated: true });
      expect(execa).toHaveBeenNthCalledWith(2, "ssh-agent", ["-s"], { stdio: "pipe" });
      expect(execa).toHaveBeenNthCalledWith(3, "ssh-add", [], { stdio: "inherit" });
      expect(process.env.SSH_AUTH_SOCK).toBe("/tmp/ssh-xxx/agent.123");
      expect(process.env.SSH_AGENT_PID).toBe("456");
    });

    it("returns failed when ssh-add fails after remediation", async () => {
      // ssh-add -l returns exit code 1
      vi.mocked(execa).mockRejectedValueOnce(execaError({ exitCode: 1 }));
      // ssh-add (interactive) fails
      vi.mocked(execa).mockRejectedValueOnce(execaError({ exitCode: 1 }));

      const result = await ensureSshAgent();

      expect(result.status).toBe("failed");
      expect(result.error).toContain("SSH key not loaded");
      expect(result.error).toContain("ssh-add");
    });

    it("returns failed when verification fails after successful ssh-add", async () => {
      // ssh-add -l returns exit code 1
      vi.mocked(execa).mockRejectedValueOnce(execaError({ exitCode: 1 }));
      // ssh-add (interactive) succeeds
      vi.mocked(execa).mockResolvedValueOnce({} as never);
      // ssh-add -l verify fails
      vi.mocked(execa).mockRejectedValueOnce(execaError({ exitCode: 1 }));

      const result = await ensureSshAgent();

      expect(result.status).toBe("failed");
      expect(result.error).toContain("SSH key not loaded");
    });

    it("throws when ssh-add binary not found (ENOENT)", async () => {
      vi.mocked(execa).mockRejectedValueOnce(execaError({ code: "ENOENT" }));

      await expect(ensureSshAgent()).rejects.toThrow("ssh-add not found. Install OpenSSH and try again.");
    });

    it("returns failed when ssh-agent fails to start", async () => {
      // ssh-add -l returns exit code 2
      vi.mocked(execa).mockRejectedValueOnce(execaError({ exitCode: 2 }));
      // ssh-agent -s fails
      vi.mocked(execa).mockRejectedValueOnce(execaError({ exitCode: 1 }));

      const result = await ensureSshAgent();

      expect(result.status).toBe("failed");
      expect(result.error).toContain("SSH key not loaded");
    });

    it("includes fix instructions and keychain tip in error message", async () => {
      vi.mocked(execa).mockRejectedValueOnce(execaError({ exitCode: 1 }));
      vi.mocked(execa).mockRejectedValueOnce(execaError({ exitCode: 1 }));

      const result = await ensureSshAgent();

      expect(result.error).toContain('eval "$(ssh-agent -s)"');
      expect(result.error).toContain("ssh-add ~/.ssh/your-key");
      expect(result.error).toContain("Then try again.");
      expect(result.error).toContain("keychain");
    });
  });
});
