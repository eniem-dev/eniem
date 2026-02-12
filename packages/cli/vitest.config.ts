import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/cli.tsx",
        "src/**/index.ts",
        "src/config/types.ts",
        "src/steps/AuthSetup.tsx",
        "src/steps/Web3Setup.tsx",
        // Interactive CLI wizards - better suited for E2E testing
        "src/commands/products.tsx",
      ],
      thresholds: {
        statements: 70,
        branches: 55,
        functions: 35,
        lines: 70,
      },
    },
  },
});
