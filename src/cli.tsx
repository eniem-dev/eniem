import { render, Box, Text } from "ink";
import TextInput from "ink-text-input";
import React, { useState } from "react";
import { createRequire } from "module";
import meow from "meow";

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
  const [projectName, setProjectName] = useState(initialProjectName ?? "");
  const [isNameConfirmed, setIsNameConfirmed] = useState(!!initialProjectName);

  const handleSubmit = (value: string) => {
    if (value.trim()) {
      setProjectName(value.trim());
      setIsNameConfirmed(true);
    }
  };

  return (
    <Box flexDirection="column">
      <Header />
      {!isNameConfirmed ? (
        <Box>
          <Text>Project name: </Text>
          <TextInput
            value={projectName}
            onChange={setProjectName}
            onSubmit={handleSubmit}
            placeholder="my-eniem-app"
          />
        </Box>
      ) : (
        <Text color="green">✓ Project: {projectName}</Text>
      )}
    </Box>
  );
};

const projectName = cli.input[0];
render(<App initialProjectName={projectName} />);
