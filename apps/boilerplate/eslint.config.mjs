import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Polar SDK is gateway-only: only files under src/lib/polar/** may import @polar-sh/sdk.
// Bundled into every no-restricted-imports block below because flat config does not merge
// rule values across matching blocks — the last matching block wins for a given rule name.
const polarSdkRestriction = {
  group: ["@polar-sh/sdk", "@polar-sh/sdk/*"],
  message:
    "Import from `@/lib/polar` (the gateway) instead. Direct @polar-sh/sdk usage is only permitted inside src/lib/polar/**.",
};

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

  // Default for all src/ files: forbid direct Polar SDK imports. Excludes src/lib/polar/**.
  // More specific blocks below override this rule with their own pattern list — those
  // blocks re-include polarSdkRestriction so the protection is preserved.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/polar/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [polarSdkRestriction],
        },
      ],
    },
  },

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
            polarSdkRestriction,
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
            polarSdkRestriction,
          ],
        },
      ],
    },
  },

  // Infrastructure (lib/) must not import from features — dependency flows downward.
  // Excludes src/lib/polar/** so the gateway itself can import the Polar SDK.
  {
    files: ["src/lib/**/*.{ts,tsx}"],
    ignores: [
      "src/lib/polar/**",
      "src/lib/auth/side-effects.ts",
      "src/lib/auth/side-effects.test.ts",
    ],
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
            polarSdkRestriction,
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
            polarSdkRestriction,
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
            polarSdkRestriction,
          ],
        },
      ],
    },
  },

  // src/lib/auth/** must not import from features/ or @/lib/polar — except side-effects.ts,
  // which is the explicit bridge between auth and the rest of the app. This keeps webhook
  // and lifecycle callbacks importable in isolation, and localizes feature/external coupling.
  {
    files: ["src/lib/auth/**/*.{ts,tsx}"],
    ignores: [
      "src/lib/auth/side-effects.ts",
      "src/lib/auth/side-effects.test.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*", "@/lib/polar", "@/lib/polar/*"],
              message:
                "src/lib/auth/** must not import from features/ or @/lib/polar. Route through src/lib/auth/side-effects.ts (the bridge).",
            },
            polarSdkRestriction,
          ],
        },
      ],
    },
  },

  // Auth side-effects may touch billing only through the narrow server API.
  // Do not import the billing feature barrel here: it re-exports UI, hooks, and
  // queries that can pull handler/auth config back into auth initialization.
  {
    files: ["src/lib/auth/side-effects.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/features/billing",
              message:
                "Auth side-effects must import billing through `@/features/billing/server-api` only. The billing barrel includes UI/hooks/queries and can create auth cycles.",
            },
          ],
          patterns: [
            {
              regex: "^@/features/billing/(?!server-api$).*",
              message:
                "Auth side-effects must import billing through `@/features/billing/server-api` only. Keep UI/hooks/queries out of the auth bridge.",
            },
            polarSdkRestriction,
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
                "Pages and API routes must not import services directly. Use queries (publicly.query/authed.query) or actions (authed.action/publicly.action) from @/lib/handler instead. See docs/server-patterns.md.",
            },
            polarSdkRestriction,
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
