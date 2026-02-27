import { render, Box } from "ink";
import React from "react";
import meow from "meow";
import { join } from "path";
import { listSpecs } from "./lib/specs.js";
import { ConfigProvider } from "./config/index.js";

import { Wizard } from "./Wizard.js";
import { ProductsCommand } from "./commands/products.js";
import { AiCommand } from "./commands/ai.js";
import { ReadyCommand } from "./commands/ready.js";
import { ConfigCommand, ConfigShowCommand, ConfigSetCommand } from "./commands/config.js";
import { PlanCommand } from "./commands/plan.js";
import { BuildCommand } from "./commands/build.js";
import { Header } from "./components/Header.js";
import type { PolarEnvironment } from "./lib/polar.js";
import { isValidCLI, SUPPORTED_CLIS } from "./lib/adapters/index.js";
import { readConfig } from "./lib/eni-config.js";
import { resolveVerbose } from "./lib/resolve-verbose.js";

// Handle unhandled promise rejections globally
process.on("unhandledRejection", (reason) => {
  console.error("\n\x1b[31m✗ An unexpected error occurred:\x1b[0m");
  console.error(reason instanceof Error ? reason.message : String(reason));
  process.exit(1);
});

// Handle uncaught exceptions globally
process.on("uncaughtException", (error) => {
  console.error("\n\x1b[31m✗ An unexpected error occurred:\x1b[0m");
  console.error(error.message);
  process.exit(1);
});

const cli = meow(
  `
  Usage
    $ eni [project-name]
    $ eni ready
    $ eni config
    $ eni config show
    $ eni config set <plan|build|verbose> <value>
    $ eni products [--env=sandbox|production] [--prod] [--token=<polar-token>]
    $ eni plan [--spec=<name>] [--iterations=<n>] [--verbose] [--cli=<name>] [--list]
    $ eni build [--spec=<name>] [--iterations=<n>] [--verbose] [--cli=<name>] [--list]
    $ eni ai init [--force]

  Commands
    ready          Generate production .env interactively
    config         Configure default AI CLI backends interactively
    config show    Display current CLI configuration
    config set     Set a config value (e.g. eni config set plan gemini, eni config set verbose true)
    products       Manage Polar products interactively
    plan           Run AI planning loop on a spec file
    build          Run AI build loop on a planned spec file
    ai init        Initialize or update AI workflow files (.eni, .claude, specs/)

  Options
    --app-name     Display name for the app (skips interactive prompt)
    --git-host     SSH host alias for git clone (default: github.com)
    --env          Environment for products command (default: sandbox)
    --prod         Shorthand for --env=production
    --token        Polar access token (bypasses .env lookup)
    --spec         Spec name for plan/build command (interactive if omitted)
    --iterations   Number of iterations (default: 3 for plan, 10 for build)
    --verbose      Show tool usage during plan/build (overrides config)
    --no-verbose   Disable verbose output (overrides config)
    --cli          AI CLI backend for plan/build (claude, codex, gemini, opencode)
    --list         List available spec names for plan/build and exit
    --force        Skip confirmation when updating existing AI workflow
    --help, -h     Show this help message
    --version, -v  Show version number

  Examples
    $ eni my-app
    $ eni my-app --app-name "My App"
    $ eni --git-host 0xtiby my-app
    $ eni ready
    $ eni config
    $ eni config show
    $ eni config set plan gemini
    $ eni config set build codex
    $ eni config set verbose true
    $ eni products
    $ eni products --prod
    $ eni products --prod --token=polar_xxx
    $ eni plan
    $ eni plan --spec=my-feature --iterations=5 --verbose
    $ eni plan --cli codex
    $ eni build
    $ eni build --spec=my-feature --iterations=20 --verbose
    $ eni build --cli gemini
    $ eni plan --list
    $ eni build --list
    $ eni ai init
    $ eni ai init --force
`,
  {
    importMeta: import.meta,
    autoHelp: true,
    autoVersion: true,
    flags: {
      appName: { type: "string" },
      gitHost: { type: "string", default: "github.com" },
      env: { type: "string", default: "sandbox" },
      prod: { type: "boolean", default: false },
      token: { type: "string" },
      spec: { type: "string" },
      iterations: { type: "number" },
      verbose: { type: "boolean" },
      cli: { type: "string" },
      list: { type: "boolean", default: false },
      force: { type: "boolean", default: false },
      help: { type: "boolean", shortFlag: "h" },
      version: { type: "boolean", shortFlag: "v" },
    },
  }
);

const command = cli.input[0];
const subcommand = cli.input[1];
const gitHost = cli.flags.gitHost;
const appNameFlag = cli.flags.appName;
const prodFlag = cli.flags.prod;
const envFlag = cli.flags.env;
const tokenFlag = cli.flags.token;
const forceFlag = cli.flags.force;
const specFlag = cli.flags.spec;
const iterationsFlag = cli.flags.iterations;
const verboseFlag = cli.flags.verbose;
const cliFlag = cli.flags.cli;
const listFlag = cli.flags.list;

// --list: print spec names and exit (before any validation)
if (listFlag && (command === "plan" || command === "build")) {
  const projectDir = process.cwd();
  const specsDir =
    command === "plan"
      ? join(projectDir, "specs")
      : join(projectDir, "specs", "planned");
  const specs = await listSpecs(specsDir);
  if (specs.length === 0) {
    const label = command === "plan" ? "No specs to plan" : "No planned specs to build";
    process.stderr.write(`${label}\n`);
    process.exit(0);
  }
  const names = specs.map((s) => s.name).sort();
  process.stdout.write(names.join("\n"));
  process.exit(0);
}

// Validate --iterations flag (must be >= 1)
if (iterationsFlag !== undefined && iterationsFlag < 1) {
  console.error(`\x1b[31m✗ Iterations must be at least 1\x1b[0m`);
  process.exit(1);
}

// Validate --app-name flag (must be non-empty if provided)
if (appNameFlag !== undefined && appNameFlag.trim() === "") {
  console.error(`\x1b[31m✗ --app-name cannot be empty\x1b[0m`);
  process.exit(1);
}

// Validate --cli flag (must be a supported CLI)
if (cliFlag !== undefined && !isValidCLI(cliFlag)) {
  console.error(`\x1b[31m✗ Unknown CLI: ${cliFlag}\x1b[0m`);
  console.error(`  Available: ${SUPPORTED_CLIS.join(", ")}`);
  process.exit(1);
}

// Determine environment: --prod takes precedence
const resolvedEnv = prodFlag ? "production" : envFlag;

// Validate env flag
const validEnvs = ["sandbox", "production"];
if (!validEnvs.includes(resolvedEnv)) {
  console.error(`\x1b[31m✗ Invalid environment: ${resolvedEnv}\x1b[0m`);
  console.error(`  Valid options: sandbox, production`);
  process.exit(1);
}
const env = resolvedEnv as PolarEnvironment;

// Check if this is the ready command
if (command === "ready") {
  const projectDir = process.cwd();
  render(
    <Box flexDirection="column">
      <Header />
      <ReadyCommand projectDir={projectDir} />
    </Box>
  );
} else if (command === "config" && subcommand === "show") {
  const projectDir = process.cwd();
  render(
    <Box flexDirection="column">
      <Header />
      <ConfigShowCommand cwd={projectDir} />
    </Box>
  );
} else if (command === "config" && subcommand === "set") {
  const projectDir = process.cwd();
  render(
    <Box flexDirection="column">
      <Header />
      <ConfigSetCommand cwd={projectDir} command={cli.input[2]} cliName={cli.input[3]} />
    </Box>
  );
} else if (command === "config" && subcommand && subcommand !== "show" && subcommand !== "set") {
  console.error(`\x1b[31m✗ Unknown config subcommand: ${subcommand}\x1b[0m`);
  console.error(`  Usage: eni config [show | set <plan|build|verbose> <value>]`);
  process.exit(1);
} else if (command === "config") {
  const projectDir = process.cwd();
  render(
    <Box flexDirection="column">
      <Header />
      <ConfigCommand cwd={projectDir} />
    </Box>
  );
} else if (command === "products") {
  const projectDir = process.cwd();
  render(
    <Box flexDirection="column">
      <Header />
      <ProductsCommand env={env} projectDir={projectDir} accessToken={tokenFlag} />
    </Box>
  );
} else if (command === "plan") {
  const projectDir = process.cwd();
  const config = await readConfig(projectDir);
  const resolvedVerbose = resolveVerbose(verboseFlag, config);
  render(
    <Box flexDirection="column">
      <PlanCommand
        spec={specFlag}
        iterations={iterationsFlag ?? 3}
        verbose={resolvedVerbose}
        specsDir={join(projectDir, "specs")}
        promptFile={join(projectDir, ".eni", "PROMPT_plan.md")}
        cli={cliFlag}
      />
    </Box>
  );
} else if (command === "build") {
  const projectDir = process.cwd();
  const config = await readConfig(projectDir);
  const resolvedVerbose = resolveVerbose(verboseFlag, config);
  render(
    <Box flexDirection="column">
      <Header />
      <BuildCommand
        spec={specFlag}
        iterations={iterationsFlag ?? 10}
        verbose={resolvedVerbose}
        specsDir={join(projectDir, "specs", "planned")}
        promptFile={join(projectDir, ".eni", "PROMPT_build.md")}
        cli={cliFlag}
      />
    </Box>
  );
} else if (command === "ai" && subcommand === "init") {
  const targetDir = process.cwd();
  render(
    <Box flexDirection="column">
      <Header />
      <AiCommand forceFlag={forceFlag} targetDir={targetDir} gitHost={gitHost} />
    </Box>
  );
} else if (command === "ai") {
  console.error(`\x1b[31m✗ Unknown ai subcommand: ${subcommand ?? "(none)"}\x1b[0m`);
  console.error(`  Usage: eni ai init [--force]`);
  process.exit(1);
} else {
  // Default: Run the main wizard
  const projectName = command;
  render(
    <ConfigProvider>
      <Box flexDirection="column">
        <Header />
        <Wizard initialProjectName={projectName} initialAppName={appNameFlag} gitHost={gitHost}  />
      </Box>
    </ConfigProvider>
  );
}
