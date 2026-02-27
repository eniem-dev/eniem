import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "ink-testing-library";
import React from "react";

vi.mock("ink", async () => {
  const actual = await vi.importActual("ink");
  return {
    ...(actual as object),
    useApp: () => ({ exit: vi.fn() }),
  };
});

vi.mock("../../lib/eni-config.js", () => ({
  readConfig: vi.fn(() => Promise.resolve(null)),
  writeConfig: vi.fn(() => Promise.resolve()),
}));

vi.mock("../../lib/adapters/index.js", () => ({
  SUPPORTED_CLIS: ["claude", "codex", "gemini", "opencode"] as const,
  getAdapter: vi.fn((id: string) => ({
    id,
    name: { claude: "Claude Code", codex: "Codex", gemini: "Gemini CLI", opencode: "OpenCode" }[id],
    binary: id,
    run: () => ({
      result: Promise.resolve({ exitCode: 0, sentinelDetected: false, stderr: "" }),
      kill: () => {},
    }),
  })),
  checkBinary: vi.fn(() => Promise.resolve(true)),
  isValidCLI: vi.fn((name: string) =>
    ["claude", "codex", "gemini", "opencode"].includes(name),
  ),
}));

import { ConfigCommand, ConfigShowCommand, ConfigSetCommand } from "../config.js";
import { readConfig, writeConfig } from "../../lib/eni-config.js";
import { checkBinary } from "../../lib/adapters/index.js";

const mockReadConfig = vi.mocked(readConfig);
const mockWriteConfig = vi.mocked(writeConfig);
const mockCheckBinary = vi.mocked(checkBinary);

describe("ConfigCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckBinary.mockResolvedValue(true);
    mockReadConfig.mockResolvedValue(null);
    mockWriteConfig.mockResolvedValue();
  });

  it("renders plan CLI picker", async () => {
    const { lastFrame } = render(<ConfigCommand cwd="/tmp" />);

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Default CLI for plan:");
    });
    expect(lastFrame()).toContain("Claude Code (claude)");
    expect(lastFrame()).toContain("Codex (codex)");
    expect(lastFrame()).toContain("Gemini CLI (gemini)");
    expect(lastFrame()).toContain("OpenCode (opencode)");
  });

  it("shows current config when one exists", async () => {
    mockReadConfig.mockResolvedValue({ plan: "claude", build: "codex", verbose: true });

    const { lastFrame } = render(<ConfigCommand cwd="/tmp" />);

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("plan: claude");
      expect(lastFrame()).toContain("build: codex");
      expect(lastFrame()).toContain("verbose: true");
      expect(lastFrame()).toContain("narration: concise");
    });
  });

  it("grays out unavailable CLIs with 'not installed' label", async () => {
    mockCheckBinary.mockImplementation(async (name: string) =>
      name !== "gemini",
    );

    const { lastFrame } = render(<ConfigCommand cwd="/tmp" />);

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Gemini CLI (gemini) — not installed");
    });
    expect(lastFrame()).not.toContain("Claude Code (claude) — not installed");
  });

  it("renders build CLI picker after plan selection", async () => {
    const { lastFrame, stdin } = render(<ConfigCommand cwd="/tmp" />);

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Default CLI for plan:");
    });

    // Select first option (Claude Code) with Enter
    stdin.write("\r");

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Plan CLI: claude");
      expect(lastFrame()).toContain("Default CLI for build:");
    });
  });

  it("shows verbose prompt after build selection", async () => {
    const { lastFrame, stdin } = render(<ConfigCommand cwd="/tmp" />);

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Default CLI for plan:");
    });

    stdin.write("\r");

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Default CLI for build:");
    });

    await new Promise((r) => setTimeout(r, 50));

    stdin.write("\r");

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Enable verbose output?");
    });
    expect(lastFrame()).toContain("Plan CLI: claude");
    expect(lastFrame()).toContain("Build CLI: claude");
  });

  it("shows summary after all selections", async () => {
    const { lastFrame, stdin } = render(<ConfigCommand cwd="/tmp" />);

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Default CLI for plan:");
    });

    stdin.write("\r");

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Default CLI for build:");
    });

    await new Promise((r) => setTimeout(r, 50));

    stdin.write("\r");

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Enable verbose output?");
    });

    await new Promise((r) => setTimeout(r, 50));

    // Confirm verbose (press 'n' to select No)
    stdin.write("n");

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Saved to .eni/config.json");
    });
    expect(lastFrame()).toContain("Plan CLI: claude");
    expect(lastFrame()).toContain("Build CLI: claude");
    expect(lastFrame()).toContain("Verbose: false");
  });

  it("calls writeConfig with selected values including verbose", async () => {
    const { lastFrame, stdin } = render(<ConfigCommand cwd="/tmp" />);

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Default CLI for plan:");
    });

    stdin.write("\r");

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Default CLI for build:");
    });

    await new Promise((r) => setTimeout(r, 50));

    stdin.write("\r");

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Enable verbose output?");
    });

    await new Promise((r) => setTimeout(r, 50));

    // Select yes for verbose
    stdin.write("y");

    await vi.waitFor(() => {
      expect(mockWriteConfig).toHaveBeenCalledWith("/tmp", {
        plan: "claude",
        build: "claude",
        verbose: true,
      });
    });
  });
});

describe("ConfigShowCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays formatted config when file exists", async () => {
    mockReadConfig.mockResolvedValue({ plan: "claude", build: "codex" });

    const { lastFrame } = render(<ConfigShowCommand cwd="/tmp" />);

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("CLI Configuration (.eni/config.json):");
      expect(lastFrame()).toContain("plan:");
      expect(lastFrame()).toContain("claude");
      expect(lastFrame()).toContain("build:");
      expect(lastFrame()).toContain("codex");
      expect(lastFrame()).toContain("verbose:");
      expect(lastFrame()).toContain("false");
    });
  });

  it("displays verbose: true when config has verbose enabled", async () => {
    mockReadConfig.mockResolvedValue({ plan: "claude", build: "codex", verbose: true });

    const { lastFrame } = render(<ConfigShowCommand cwd="/tmp" />);

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("verbose:");
      expect(lastFrame()).toContain("true");
    });
  });

  it("displays verbose: false when verbose key is missing", async () => {
    mockReadConfig.mockResolvedValue({ plan: "claude", build: "codex" });

    const { lastFrame } = render(<ConfigShowCommand cwd="/tmp" />);

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("verbose:");
      expect(lastFrame()).toContain("false");
    });
  });

  it("displays narration: concise when narration key is missing", async () => {
    mockReadConfig.mockResolvedValue({ plan: "claude", build: "codex" });

    const { lastFrame } = render(<ConfigShowCommand cwd="/tmp" />);

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("narration: concise");
    });
  });

  it("displays narration: explicit when set", async () => {
    mockReadConfig.mockResolvedValue({ plan: "claude", build: "codex", narration: "explicit" });

    const { lastFrame } = render(<ConfigShowCommand cwd="/tmp" />);

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("narration: explicit");
    });
  });

  it("shows 'No configuration found' when no config file", async () => {
    mockReadConfig.mockResolvedValue(null);

    const { lastFrame } = render(<ConfigShowCommand cwd="/tmp" />);

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("No configuration found. Run eni config to set up.");
    });
  });

  it("shows error when config read fails", async () => {
    mockReadConfig.mockRejectedValue(new Error("Invalid JSON"));

    const { lastFrame } = render(<ConfigShowCommand cwd="/tmp" />);

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Invalid JSON");
    });
  });
});

describe("ConfigSetCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadConfig.mockResolvedValue(null);
    mockWriteConfig.mockResolvedValue();
  });

  it("updates the correct key in config", async () => {
    mockReadConfig.mockResolvedValue({ plan: "claude", build: "claude" });

    const { lastFrame } = render(
      <ConfigSetCommand cwd="/tmp" command="plan" cliName="gemini" />,
    );

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Set plan CLI to gemini");
    });
    expect(mockWriteConfig).toHaveBeenCalledWith("/tmp", {
      plan: "gemini",
      build: "claude",
    });
  });

  it("creates config when no file exists", async () => {
    mockReadConfig.mockResolvedValue(null);

    const { lastFrame } = render(
      <ConfigSetCommand cwd="/tmp" command="build" cliName="opencode" />,
    );

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Set build CLI to opencode");
    });
    expect(mockWriteConfig).toHaveBeenCalledWith("/tmp", {
      build: "opencode",
    });
  });

  it("sets verbose to true", async () => {
    mockReadConfig.mockResolvedValue({ plan: "claude", build: "claude" });

    const { lastFrame } = render(
      <ConfigSetCommand cwd="/tmp" command="verbose" cliName="true" />,
    );

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Set verbose to true");
    });
    expect(mockWriteConfig).toHaveBeenCalledWith("/tmp", {
      plan: "claude",
      build: "claude",
      verbose: true,
    });
  });

  it("sets verbose to false", async () => {
    mockReadConfig.mockResolvedValue({ plan: "claude", build: "claude", verbose: true });

    const { lastFrame } = render(
      <ConfigSetCommand cwd="/tmp" command="verbose" cliName="false" />,
    );

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Set verbose to false");
    });
    expect(mockWriteConfig).toHaveBeenCalledWith("/tmp", {
      plan: "claude",
      build: "claude",
      verbose: false,
    });
  });

  it("rejects invalid verbose value", async () => {
    const { lastFrame } = render(
      <ConfigSetCommand cwd="/tmp" command="verbose" cliName="maybe" />,
    );

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Invalid value for verbose: must be true or false");
    });
  });

  it("sets narration to concise", async () => {
    mockReadConfig.mockResolvedValue({ plan: "claude", build: "claude" });

    const { lastFrame } = render(
      <ConfigSetCommand cwd="/tmp" command="narration" cliName="concise" />,
    );

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Set narration to concise");
    });
    expect(mockWriteConfig).toHaveBeenCalledWith("/tmp", {
      plan: "claude",
      build: "claude",
      narration: "concise",
    });
  });

  it("sets narration to explicit", async () => {
    mockReadConfig.mockResolvedValue({ plan: "claude", build: "claude" });

    const { lastFrame } = render(
      <ConfigSetCommand cwd="/tmp" command="narration" cliName="explicit" />,
    );

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Set narration to explicit");
    });
    expect(mockWriteConfig).toHaveBeenCalledWith("/tmp", {
      plan: "claude",
      build: "claude",
      narration: "explicit",
    });
  });

  it("rejects invalid narration value", async () => {
    const { lastFrame } = render(
      <ConfigSetCommand cwd="/tmp" command="narration" cliName="loud" />,
    );

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Invalid value for narration: must be one of: concise, explicit");
    });
  });

  it("shows usage error when command is missing", async () => {
    const { lastFrame } = render(
      <ConfigSetCommand cwd="/tmp" command={undefined} cliName="claude" />,
    );

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Usage: eni config set <plan|build|verbose|narration>");
    });
  });

  it("shows usage error when value is missing", async () => {
    const { lastFrame } = render(
      <ConfigSetCommand cwd="/tmp" command="plan" cliName={undefined} />,
    );

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Usage: eni config set <plan|build|verbose|narration>");
    });
  });

  it("rejects invalid command name", async () => {
    const { lastFrame } = render(
      <ConfigSetCommand cwd="/tmp" command="deploy" cliName="claude" />,
    );

    await vi.waitFor(() => {
      expect(lastFrame()).toContain('Invalid command: "deploy"');
      expect(lastFrame()).toContain("plan, build, verbose, narration");
    });
  });

  it("rejects invalid CLI name", async () => {
    const { lastFrame } = render(
      <ConfigSetCommand cwd="/tmp" command="plan" cliName="invalid" />,
    );

    await vi.waitFor(() => {
      expect(lastFrame()).toContain('Invalid CLI: "invalid"');
      expect(lastFrame()).toContain("claude, codex, gemini, opencode");
    });
  });
});
