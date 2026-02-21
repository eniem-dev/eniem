import { render, Box } from "ink";
import React from "react";
import meow from "meow";
import { join } from "path";
import { ConfigProvider } from "./config/index.js";

import { Wizard } from "./Wizard.js";
import { ProductsCommand } from "./commands/products.js";
import { AiCommand } from "./commands/ai.js";
import { ReadyCommand } from "./commands/ready.js";
import { PlanCommand } from "./commands/plan.js";
import { BuildCommand } from "./commands/build.js";
import { Header } from "./components/Header.js";
import type { PolarEnvironment } from "./lib/polar.js";

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
    $ eni products [--env=sandbox|production] [--prod] [--token=<polar-token>]
    $ eni plan [--spec=<name>] [--iterations=<n>] [--verbose]
    $ eni build [--spec=<name>] [--iterations=<n>] [--verbose]
    $ eni ai init [--force]

  Commands
    ready          Generate production .env interactively
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
    --verbose      Show tool usage during plan/build execution
    --force        Skip confirmation when updating existing AI workflow
    --help, -h     Show this help message
    --version, -v  Show version number

  Examples
    $ eni my-app
    $ eni my-app --app-name "My App"
    $ eni --git-host 0xtiby my-app
    $ eni ready
    $ eni products
    $ eni products --prod
    $ eni products --prod --token=polar_xxx
    $ eni plan
    $ eni plan --spec=my-feature --iterations=5 --verbose
    $ eni build
    $ eni build --spec=my-feature --iterations=20 --verbose
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
      verbose: { type: "boolean", default: false },
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
  render(
    <Box flexDirection="column">
      <Header />
      <PlanCommand
        spec={specFlag}
        iterations={iterationsFlag ?? 3}
        verbose={verboseFlag}
        specsDir={join(projectDir, "specs")}
        promptFile={join(projectDir, ".eni", "PROMPT_plan.md")}
      />
    </Box>
  );
} else if (command === "build") {
  const projectDir = process.cwd();
  render(
    <Box flexDirection="column">
      <Header />
      <BuildCommand
        spec={specFlag}
        iterations={iterationsFlag ?? 10}
        verbose={verboseFlag}
        specsDir={join(projectDir, "specs")}
        promptFile={join(projectDir, ".eni", "PROMPT_build.md")}
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
