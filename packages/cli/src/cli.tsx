import { render, Box } from "ink";
import React from "react";
import meow from "meow";
import { ConfigProvider } from "./config/index.js";

import { Wizard } from "./Wizard.js";
import { ProductsCommand } from "./commands/products.js";
import { ReadyCommand } from "./commands/ready.js";
import { Header } from "./components/Header.js";
import type { PolarEnvironment } from "./lib/polar.js";

process.on("unhandledRejection", (reason) => {
  console.error("\n\x1b[31m✗ An unexpected error occurred:\x1b[0m");
  console.error(reason instanceof Error ? reason.message : String(reason));
  process.exit(1);
});

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

  Commands
    ready          Generate production .env interactively
    products       Manage Polar products interactively

  Options
    --app-name     Display name for the app (skips interactive prompt)
    --ssh          Clone via SSH (default tries gh, falls back to git HTTPS)
    --git-host     SSH host alias (implies --ssh, default: github.com)
    --env          Environment for products command (default: sandbox)
    --prod         Shorthand for --env=production
    --token        Polar access token (bypasses .env lookup)
    --help, -h     Show this help message
    --version, -v  Show version number

  Examples
    $ eni my-app
    $ eni my-app --app-name "My App"
    $ eni my-app --ssh
    $ eni my-app --git-host github.com-work
    $ eni ready
    $ eni products
    $ eni products --prod
    $ eni products --prod --token=polar_xxx
`,
  {
    importMeta: import.meta,
    autoHelp: true,
    autoVersion: true,
    flags: {
      appName: { type: "string" },
      gitHost: { type: "string" },
      env: { type: "string", default: "sandbox" },
      prod: { type: "boolean", default: false },
      token: { type: "string" },
      ssh: { type: "boolean", default: false },
      help: { type: "boolean", shortFlag: "h" },
      version: { type: "boolean", shortFlag: "v" },
    },
  }
);

const command = cli.input[0];
const gitHostFlag = cli.flags.gitHost;
const appNameFlag = cli.flags.appName;
const prodFlag = cli.flags.prod;
const envFlag = cli.flags.env;
const tokenFlag = cli.flags.token;
const sshFlag = cli.flags.ssh;

if (appNameFlag !== undefined && appNameFlag.trim() === "") {
  console.error(`\x1b[31m✗ --app-name cannot be empty\x1b[0m`);
  process.exit(1);
}

const sshResolved = sshFlag || gitHostFlag !== undefined;

const resolvedEnv = prodFlag ? "production" : envFlag;

const validEnvs = ["sandbox", "production"];
if (!validEnvs.includes(resolvedEnv)) {
  console.error(`\x1b[31m✗ Invalid environment: ${resolvedEnv}\x1b[0m`);
  console.error(`  Valid options: sandbox, production`);
  process.exit(1);
}
const env = resolvedEnv as PolarEnvironment;

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
} else {
  const projectName = command;
  render(
    <ConfigProvider>
      <Box flexDirection="column">
        <Header />
        <Wizard initialProjectName={projectName} initialAppName={appNameFlag} gitHost={gitHostFlag} ssh={sshResolved} />
      </Box>
    </ConfigProvider>
  );
}
