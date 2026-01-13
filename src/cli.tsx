import { render, Box, Text } from "ink";
import React from "react";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { name: string; version: string };

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

const App = () => {
  return (
    <Box flexDirection="column">
      <Header />
    </Box>
  );
};

render(<App />);
