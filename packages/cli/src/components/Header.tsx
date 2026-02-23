import { Box, Text } from "ink";
import React from "react";

const version = process.env.CLI_VERSION ?? "0.0.0";

const LOGO = `
███████╗███╗   ██╗██╗███████╗███╗   ███╗
██╔════╝████╗  ██║██║██╔════╝████╗ ████║
█████╗  ██╔██╗ ██║██║█████╗  ██╔████╔██║
██╔══╝  ██║╚██╗██║██║██╔══╝  ██║╚██╔╝██║
███████╗██║ ╚████║██║███████╗██║ ╚═╝ ██║
╚══════╝╚═╝  ╚═══╝╚═╝╚══════╝╚═╝     ╚═╝
`.trim();

export const Header = () => {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="cyan">{LOGO}</Text>
      <Text dimColor>
        v{version} - Scaffold your next Eniem project
      </Text>
    </Box>
  );
};
