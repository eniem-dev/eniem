import { render, Box, Text } from "ink";
import React from "react";
import { createRequire } from "module";
import meow from "meow";
import { ConfigProvider, type AppConfig } from "./config/index.js";
import { Wizard } from "./Wizard.js";
import { ProductsCommand } from "./commands/products.js";
import { AiCommand } from "./commands/ai.js";
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

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { name: string; version: string };

const cli = meow(
  `
  Usage
    $ eniem-cli [project-name]
    $ eniem-cli products [--env=sandbox|production] [--prod] [--token=<polar-token>]
    $ eniem-cli ai init [--force]

  Commands
    products       Manage Polar products interactively
    ai init        Initialize or update AI workflow files (.eni, .claude, specs/)

  Options
    --git-host     SSH host alias for git clone (default: github.com)
    --env          Environment for products command (default: sandbox)
    --prod         Shorthand for --env=production
    --token        Polar access token (bypasses .env lookup)
    --force        Skip confirmation when updating existing AI workflow
    --help, -h     Show this help message
    --version, -v  Show version number

  Examples
    $ eniem-cli my-app
    $ eniem-cli --git-host 0xtiby my-app
    $ eniem-cli products
    $ eniem-cli products --prod
    $ eniem-cli products --prod --token=polar_xxx
    $ eniem-cli ai init
    $ eniem-cli ai init --force
`,
  {
    importMeta: import.meta,
    autoHelp: true,
    autoVersion: true,
    flags: {
      gitHost: { type: "string", default: "github.com" },
      env: { type: "string", default: "sandbox" },
      prod: { type: "boolean", default: false },
      token: { type: "string" },
      force: { type: "boolean", default: false },
      help: { type: "boolean", shortFlag: "h" },
      version: { type: "boolean", shortFlag: "v" },
    },
  }
);

const LOGO = `
███████╗███╗   ██╗██╗███████╗███╗   ███╗
██╔════╝████╗  ██║██║██╔════╝████╗ ████║
█████╗  ██╔██╗ ██║██║█████╗  ██╔████╔██║
██╔══╝  ██║╚██╗██║██║██╔══╝  ██║╚██╔╝██║
███████╗██║ ╚████║██║███████╗██║ ╚═╝ ██║
╚══════╝╚═╝  ╚═══╝╚═╝╚══════╝╚═╝     ╚═╝
`.trim();

const Header = () => {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="cyan">{LOGO}</Text>
      <Text dimColor>
        v{pkg.version} - Scaffold your next Eniem project
      </Text>
    </Box>
  );
};

interface AppProps {
  initialProjectName?: string;
  gitHost: string;
}

const App = ({ initialProjectName, gitHost }: AppProps) => {
  const handleWizardComplete = (config: AppConfig, destination: string) => {
    // Config is now available for env generation
    // destination is the path where the project was cloned
    console.log("Final config:", JSON.stringify(config, null, 2));
    console.log("Project cloned to:", destination);
  };

  return (
    <ConfigProvider>
      <Box flexDirection="column">
        <Header />
        <Wizard initialProjectName={initialProjectName} gitHost={gitHost} onComplete={handleWizardComplete} />
      </Box>
    </ConfigProvider>
  );
};

const command = cli.input[0];
const subcommand = cli.input[1];
const gitHost = cli.flags.gitHost;
const prodFlag = cli.flags.prod;
const envFlag = cli.flags.env;
const tokenFlag = cli.flags.token;
const forceFlag = cli.flags.force;

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

// Check if this is the products command
if (command === "products") {
  const projectDir = process.cwd();
  render(
    <Box flexDirection="column">
      <Header />
      <ProductsCommand env={env} projectDir={projectDir} accessToken={tokenFlag} />
    </Box>
  );
} else if (command === "ai" && subcommand === "init") {
  // AI init command
  const targetDir = process.cwd();
  render(
    <Box flexDirection="column">
      <Header />
      <AiCommand forceFlag={forceFlag} targetDir={targetDir} />
    </Box>
  );
} else if (command === "ai") {
  // Show help for ai command if no subcommand
  console.error(`\x1b[31m✗ Unknown ai subcommand: ${subcommand ?? "(none)"}\x1b[0m`);
  console.error(`  Usage: eniem-cli ai init [--force]`);
  process.exit(1);
} else {
  // Default: Run the main wizard
  const projectName = command;
  render(<App initialProjectName={projectName} gitHost={gitHost} />);
}
