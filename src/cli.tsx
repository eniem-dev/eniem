import { render, Box, Text } from "ink";
import React from "react";
import { createRequire } from "module";
import meow from "meow";
import { ConfigProvider, type AppConfig } from "./config/index.js";
import { Wizard } from "./Wizard.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { name: string; version: string };

const cli = meow(
  `
  Usage
    $ eniem-cli [project-name]

  Options
    --help, -h     Show this help message
    --version, -v  Show version number

  Examples
    $ eniem-cli my-app
    $ eniem-cli
`,
  {
    importMeta: import.meta,
    flags: {
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
}

const App = ({ initialProjectName }: AppProps) => {
  const handleWizardComplete = (config: AppConfig) => {
    // Config is now available for env generation
    // This will be used by later stories (011-014)
    console.log("Final config:", JSON.stringify(config, null, 2));
  };

  return (
    <ConfigProvider>
      <Box flexDirection="column">
        <Header />
        <Wizard initialProjectName={initialProjectName} onComplete={handleWizardComplete} />
      </Box>
    </ConfigProvider>
  );
};

const projectName = cli.input[0];
render(<App initialProjectName={projectName} />);
