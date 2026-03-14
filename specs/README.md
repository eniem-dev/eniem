# Specifications

## Tech Stack
- **Language:** TypeScript
- **Framework:** Ink 5 (React for CLI), meow
- **Build:** tsup (ESM)
- **Testing:** Vitest

## Specs

| Spec | Source Path | Description |
|------|------------|-------------|
| [CLI "Run All" Selection](./01-run-all-selection.md) | `packages/cli/src/` | Add `--all` flag and "Run all" option to spec selector |
| [Plan-All Serial Execution](./02-plan-all-serial.md) | `packages/cli/src/commands/plan.tsx` | Process all specs serially with existing plan prompt |
| [Build-All Serial Execution](./03-build-all-serial.md) | `packages/cli/src/commands/build.tsx` | Process all planned specs in shared worktree |
| [PROMPT_build_full.md](./04-prompt-build-full.md) | `.eni/PROMPT_build_full.md` | New prompt file for multi-spec build sessions |
