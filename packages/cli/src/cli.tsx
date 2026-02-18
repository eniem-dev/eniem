import { render, Box, Text } from "ink";
import React from "react";
import { createRequire } from "module";
import meow from "meow";
import { ConfigProvider, type AppConfig } from "./config/index.js";
import { Wizard } from "./Wizard.js";
import { ProductsCommand } from "./commands/products.js";
import { AiCommand } from "./commands/ai.js";
import { runAiPlan, executePlanLoop } from "./commands/ai-plan.js";
import { AiPlanSelector } from "./commands/ai-plan-selector.js";
import { runAiBuild } from "./commands/ai-build.js";
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

const HELP_TEXT = `
  eni project <name>          Scaffold a new project
  eni products                Manage Polar products
  eni ai setup                Bootstrap AI workflow files
  eni ai plan [spec] [N]      Plan a spec into beads issues
  eni ai build [epic] [N]     Build ready tasks autonomously
  eni land                    Sync and push all work
  eni doctor                  Check environment health
  eni status                  Show project dashboard
  eni version                 Show version
  eni help                    Show this help

Options:
  --git-host                  SSH host alias for git clone (default: github.com)
  --env                       Environment for products command (default: sandbox)
  --prod                      Shorthand for --env=production
  --token                     Polar access token (bypasses .env lookup)
  --force                     Skip confirmation prompts
  -d, --debug                 Show tool calls in ai commands
`;

const cli = meow(HELP_TEXT, {
  importMeta: import.meta,
  autoHelp: false,
  autoVersion: false,
  flags: {
    gitHost: { type: "string", default: "github.com" },
    env: { type: "string", default: "sandbox" },
    prod: { type: "boolean", default: false },
    token: { type: "string" },
    force: { type: "boolean", default: false },
    debug: { type: "boolean", shortFlag: "d", default: false },
    help: { type: "boolean", shortFlag: "h" },
    version: { type: "boolean", shortFlag: "v" },
  },
});

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

function printHelp(): void {
  console.log(HELP_TEXT);
}

function printStub(commandName: string): void {
  console.log(`\x1b[33m⚠ '${commandName}' is not yet implemented.\x1b[0m`);
}

// Extract CLI inputs and flags
const command = cli.input[0];
const subcommand = cli.input[1];
const gitHost = cli.flags.gitHost;
const prodFlag = cli.flags.prod;
const envFlag = cli.flags.env;
const tokenFlag = cli.flags.token;
const forceFlag = cli.flags.force;

// Determine environment: --prod takes precedence
const resolvedEnv = prodFlag ? "production" : envFlag;

// Handle --version and --help flags (since autoHelp/autoVersion are disabled)
if (cli.flags.version) {
  console.log(pkg.version);
  process.exit(0);
}

if (cli.flags.help) {
  printHelp();
  process.exit(0);
}

// Validate env flag for commands that use it
function getValidatedEnv(): PolarEnvironment {
  const validEnvs = ["sandbox", "production"];
  if (!validEnvs.includes(resolvedEnv)) {
    console.error(`\x1b[31m✗ Invalid environment: ${resolvedEnv}\x1b[0m`);
    console.error(`  Valid options: sandbox, production`);
    process.exit(1);
  }
  return resolvedEnv as PolarEnvironment;
}

// Route commands
switch (command) {
  case "project": {
    const projectName = subcommand;
    render(<App initialProjectName={projectName} gitHost={gitHost} />);
    break;
  }

  case "products": {
    const env = getValidatedEnv();
    const projectDir = process.cwd();
    render(
      <Box flexDirection="column">
        <Header />
        <ProductsCommand env={env} projectDir={projectDir} accessToken={tokenFlag} />
      </Box>
    );
    break;
  }

  case "ai": {
    switch (subcommand) {
      case "setup":
      case "init": {
        const targetDir = process.cwd();
        render(
          <Box flexDirection="column">
            <Header />
            <AiCommand forceFlag={forceFlag} targetDir={targetDir} gitHost={gitHost} />
          </Box>
        );
        break;
      }
      case "plan": {
        const specArg = cli.input[2];
        const iterArg = cli.input[specArg ? 3 : 2];
        const iterations = iterArg ? parseInt(iterArg, 10) : undefined;
        const planDebug = cli.flags.debug;
        const planCwd = process.cwd();

        if (iterations !== undefined && isNaN(iterations)) {
          console.error(`\x1b[31mError: invalid iteration count: ${iterArg}\x1b[0m`);
          process.exit(1);
        }

        void (async () => {
          const result = await runAiPlan({
            specName: specArg,
            iterations,
            debug: planDebug,
            cwd: planCwd,
          });

          if (result.needsSelector) {
            const inkInstance = render(
              <AiPlanSelector
                specs={result.specs}
                onSelect={(selected) => {
                  inkInstance.unmount();
                  void executePlanLoop(
                    selected,
                    iterations ?? 3,
                    planDebug,
                    planCwd,
                  );
                }}
              />,
            );
          }
        })();
        break;
      }
      case "build": {
        const epicArg = cli.input[2];
        const buildIterArg = cli.input[epicArg ? 3 : 2];
        const buildIterations = buildIterArg
          ? parseInt(buildIterArg, 10)
          : undefined;
        const buildDebug = cli.flags.debug;
        const buildCwd = process.cwd();

        if (buildIterations !== undefined && isNaN(buildIterations)) {
          console.error(
            `\x1b[31mError: invalid iteration count: ${buildIterArg}\x1b[0m`,
          );
          process.exit(1);
        }

        void runAiBuild({
          epicName: epicArg,
          iterations: buildIterations,
          debug: buildDebug,
          cwd: buildCwd,
        });
        break;
      }
      default:
        console.error(`\x1b[31m✗ Unknown ai subcommand: ${subcommand ?? "(none)"}\x1b[0m`);
        console.error(`  Available: eni ai setup, eni ai plan, eni ai build`);
        process.exit(1);
    }
    break;
  }

  case "land":
    printStub("eni land");
    break;

  case "doctor":
    printStub("eni doctor");
    break;

  case "status":
    printStub("eni status");
    break;

  case "version":
    console.log(pkg.version);
    break;

  case "help":
    printHelp();
    break;

  default: {
    if (command) {
      console.error(`\x1b[31m✗ Unknown command: ${command}\x1b[0m`);
      printHelp();
      process.exit(1);
    }
    // No command: show help
    printHelp();
    break;
  }
}
