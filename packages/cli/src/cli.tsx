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
    --git-host     SSH host alias for git clone (default: github.com)
    --env          Environment for products command (default: sandbox)
    --prod         Shorthand for --env=production
    --token        Polar access token (bypasses .env lookup)
    --protocol     Git protocol for clone: ssh or https (default: https)
    --ssh          Shorthand for --protocol=ssh
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
    $ eni my-app --ssh
    $ eni my-app --protocol ssh
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
      protocol: { type: "string" },
      ssh: { type: "boolean", default: false },
      help: { type: "boolean", shortFlag: "h" },
      version: { type: "boolean", shortFlag: "v" },
    },
  }
);

const command = cli.input[0];
const gitHost = cli.flags.gitHost;
const appNameFlag = cli.flags.appName;
const prodFlag = cli.flags.prod;
const envFlag = cli.flags.env;
const tokenFlag = cli.flags.token;
const protocolFlag = cli.flags.protocol;
const sshFlag = cli.flags.ssh;

if (appNameFlag !== undefined && appNameFlag.trim() === "") {
  console.error(`\x1b[31m✗ --app-name cannot be empty\x1b[0m`);
  process.exit(1);
}

if (protocolFlag !== undefined && protocolFlag !== "ssh" && protocolFlag !== "https") {
  console.error(`\x1b[31m✗ Invalid protocol "${protocolFlag}". Use "ssh" or "https".\x1b[0m`);
  process.exit(1);
}

if (protocolFlag !== undefined && sshFlag) {
  console.error(`\x1b[31m✗ Cannot use --protocol with --ssh. Pick one.\x1b[0m`);
  process.exit(1);
}

const resolvedProtocol: "ssh" | "https" | undefined = protocolFlag as "ssh" | "https" | undefined
  ?? (sshFlag ? "ssh" : undefined);

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
        <Wizard initialProjectName={projectName} initialAppName={appNameFlag} gitHost={gitHost} protocol={resolvedProtocol} />
      </Box>
    </ConfigProvider>
  );
}
