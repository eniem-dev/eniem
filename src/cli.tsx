import { render, Box, Text } from "ink";
import React from "react";
import { createRequire } from "module";
import meow from "meow";
import { ConfigProvider, type AppConfig } from "./config/index.js";
import { Wizard } from "./Wizard.js";

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

  Options
    --git-host     SSH host alias for git clone (default: github.com)
    --help, -h     Show this help message
    --version, -v  Show version number

  Examples
    $ eniem-cli my-app
    $ eniem-cli --git-host 0xtiby my-app
`,
  {
    importMeta: import.meta,
    autoHelp: true,
    autoVersion: true,
    flags: {
      gitHost: { type: "string", default: "github.com" },
      help: { type: "boolean", shortFlag: "h" },
      version: { type: "boolean", shortFlag: "v" },
    },
  }
);

const Header = () => {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color="cyan">
        {pkg.name} v{pkg.version}
      </Text>
      <Text dimColor>Scaffold your next Eniem project</Text>
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

const projectName = cli.input[0];
const gitHost = cli.flags.gitHost;
render(<App initialProjectName={projectName} gitHost={gitHost} />);
