import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/generated/**",
    ],
  },

  // === Architectural Boundaries ===

  // UI components must stay pure — no business logic imports
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*"],
              message:
                "UI components must not import from features/. They are pure, props-driven. Move business logic to a feature component instead.",
            },
            {
              group: ["@/lib/db", "@/lib/auth", "@/lib/polar", "@/lib/email"],
              message:
                "UI components must not import infrastructure. Accept data via props from a parent feature component.",
            },
          ],
        },
      ],
    },
  },

  // Features must import other features through their public API (index.ts), not internal paths
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/features/*/services/*",
                "@/features/*/queries/*",
                "@/features/*/actions/*",
                "@/features/*/models/*",
                "@/features/*/schemas/*",
                "@/features/*/hooks/*",
                "@/features/*/components/*",
              ],
              message:
                "Import from the feature's public API: `import { ... } from '@/features/{name}'`. Within the same feature, use relative imports instead.",
            },
          ],
        },
      ],
    },
  },

  // Infrastructure (lib/) must not import from features — dependency flows downward
  {
    files: ["src/lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*"],
              message:
                "lib/ must not import from features/ — dependency flows downward (app → features → lib). Extract shared code into lib/ or pass it as a parameter.",
            },
          ],
        },
      ],
    },
  },

  // Queries must use services — no direct DB access
  {
    files: ["src/features/**/queries/**/*.{ts,tsx}", "src/features/**/*.query.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/db", "@prisma/*", "prisma", "prisma/*"],
              message:
                "Queries must not import the database directly. Call a service function instead. See docs/server-patterns.md.",
            },
          ],
        },
      ],
    },
  },

  // Actions must use services — no direct DB access
  {
    files: ["src/features/**/actions/**/*.{ts,tsx}", "src/features/**/*.action.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/db", "@prisma/*", "prisma", "prisma/*"],
              message:
                "Actions must not import the database directly. Call a service function instead. See docs/server-patterns.md.",
            },
          ],
        },
      ],
    },
  },

  // Pages and API routes must not use services directly — go through queries or actions
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*/services/*"],
              message:
                "Pages and API routes must not import services directly. Use queries (createQuery/createAuthenticatedQuery) or actions (actionClient) instead. See docs/server-patterns.md.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
