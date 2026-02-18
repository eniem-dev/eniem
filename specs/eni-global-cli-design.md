# Design Doc: `eni` — Global CLI Companion to Eniem

> **Status:** Draft
> **Date:** 2026-02-17

## Problem

The current AI workflow requires copying scripts (`.eni/loop.sh`) and config (`.claude/`) into every project via `eniem ai init`. This means:

- Loop logic is duplicated across projects and the monorepo
- Updates require re-running `ai init` which can overwrite user files
- Users need to remember `./loop.sh` paths
- Two copies exist in the monorepo (root + `apps/boilerplate/`)

**Inspiration:** The `bd` (beads) CLI — one global binary, per-project config in `.beads/`, no scripts in the project.

## Key Principle

**`eni` is the companion to `eniem` (the boilerplate product).**

The boilerplate is the source of truth for all the valuable content:
- Prompts (`PROMPT_plan.md`, `PROMPT_build.md`)
- Claude skills (`functional-spec-interview`)
- Claude commands (`fix-code-review`, `cleanup`)
- Claude hooks (`inject-commit-context.sh`)
- Settings (`settings.json`)

**The CLI only absorbs the loop orchestration logic.** Everything else continues to come from the boilerplate via `eni setup` (sparse-clone). This means:
- Prompt improvements ship with the boilerplate, not the CLI
- New skills/commands added to the boilerplate are immediately available via `eni ai setup`
- The CLI and content evolve independently

---

## Command Structure

```
eni project <name>            # Scaffold wizard (was: eniem-cli <project-name>)
    --git-host=<host>

eni products                  # Polar product manager (unchanged)
    --env=sandbox|production
    --prod
    --token=<token>

eni ai setup                  # Bootstrap .eni/ + .claude/ + beads (was: eniem ai init)
    --force
    --update                  # Refresh .claude/ only (new skills, commands)

eni ai plan [spec-name]       # Run plan loop (was: ./loop.sh plan)
    [iterations]              # Default: 3
    -d, --debug               # Show tool calls (default: text only)
    # No spec-name → plans ALL specs in specs/ folder
    # With spec-name → plans just that one spec

eni ai build [epic-name]      # Run build loop (was: ./loop.sh build)
    [iterations]              # Default: 10
    -d, --debug               # Show tool calls (default: text only)

eni land                      # Session-close ritual (bd sync full + push)

eni doctor                    # Health check: tools, config, env

eni status                    # Dashboard: specs, epics, tasks, last push

eni version
eni help [command]
```

### Command grouping rationale

- **`eni project`** — one-time scaffolding, runs once per project
- **`eni products`** — product management, standalone workflow
- **`eni ai *`** — all AI workflow commands grouped under `ai` namespace (setup, plan, build)
- **`eni land`** — session lifecycle, run when done working
- **`eni doctor`** — diagnostics, run when something's wrong or onboarding
- **`eni status`** — visibility, run anytime to see project state

### What moves into the CLI (loop engine only)

- `run_claude()` — spawning Claude Code process
- Iteration management (plan: 3 iter, build: 10 iter)
- Sentinel token detection (`:::ENI_PLAN_REFINED:::`, `:::ENI_ALL_TASKS_COMPLETE:::`)
- Template variable substitution (`{{SPEC_NAME}}`, `{{ITERATION}}`, `{{EPIC_NAME}}`)
- JSON stream output parsing and formatting
- Output formatting (text-only default, debug mode with tool calls)
- Loading spinner between outputs
- Pre-flight checks (bd installed, .beads/ exists, AGENTS.md, prompt files)

### What stays in the boilerplate (cloned via `eni setup`)

- `PROMPT_plan.md` — planning instructions for Claude
- `PROMPT_build.md` — build instructions for Claude
- `.claude/settings.json` — pre-authorized commands
- `.claude/hooks/` — session hooks
- `.claude/commands/` — slash commands
- `.claude/skills/` — agent skills
- `specs/` directory structure

---

## Project Directory After `eni ai setup`

```
my-project/
├── .eni/
│   ├── PROMPT_plan.md        # From boilerplate (sparse-clone)
│   └── PROMPT_build.md       # From boilerplate (sparse-clone)
├── .claude/
│   ├── settings.json         # From boilerplate
│   ├── hooks/
│   │   └── inject-commit-context.sh
│   ├── commands/
│   │   ├── cleanup.md
│   │   └── fix-code-review.md
│   └── skills/
│       └── functional-spec-interview/
│           ├── SKILL.md
│           └── references/
│               └── spec-template.md
├── specs/
│   └── .gitkeep
└── AGENTS.md
```

**What changed vs. today:** `loop.sh` is gone from `.eni/`. That's it. Everything else comes from the boilerplate exactly as before.

---

## Loop Engine Architecture

The engine replaces the 293-line `loop.sh` bash script with TypeScript.

### Spawning Claude

```typescript
const proc = execa("claude", [
  "--dangerously-skip-permissions",
  "-p", "--verbose",
  "--output-format", "stream-json"
], { cwd: projectDir, input: prompt, stdout: "pipe" });
```

### Output Modes

**Default (text only):**
Only displays Claude's text output. Between text outputs, a loading spinner shows the CLI is still alive and Claude is working (thinking, running tools, etc.).

```
⠋ Claude is working...
Here's my analysis of the spec...
⠋ Claude is working...
I've created the epic and 5 tasks:
  - beads-014: Set up database schema
  - beads-015: Create API endpoint
  ...
```

**Debug mode (`-d`):**
Also shows tool calls so you can see what Claude is doing:

```
Here's my analysis of the spec...
  → Read: specs/auth-flow.md
  → Grep: "authentication" in src/
  → Bash: bd create --type=epic --title="Auth flow"
I've created the epic and 5 tasks:
  ...
```

### Loading Indicator

A spinner runs between text outputs to show Claude is still active. The spinner updates based on the stream-json events:

```typescript
// Pseudocode
for await (const event of parseJsonStream(proc.stdout)) {
  if (event.type === "assistant" && hasText(event)) {
    spinner.stop();
    printText(event);
    spinner.start("Claude is working...");
  } else if (debug && event.type === "assistant" && hasToolUse(event)) {
    spinner.stop();
    printToolCall(event);  // → Read: src/lib/auth.ts
    spinner.start("Claude is working...");
  }
  // All other events (tool results, thinking, etc.) just keep the spinner alive
}
```

The spinner uses the existing `ink-spinner` component or a lightweight alternative like `ora` (since loop commands don't use Ink).

### Sentinel Detection

```typescript
function detectSentinel(output: string): "plan_refined" | "all_complete" | null {
  // In stream-json mode: extract text from last assistant message
  // In interactive mode: scan last 5 lines
  const lastLine = output.trim().split("\n").pop()?.trim() ?? "";
  if (lastLine.includes(":::ENI_PLAN_REFINED:::")) return "plan_refined";
  if (lastLine.includes(":::ENI_ALL_TASKS_COMPLETE:::")) return "all_complete";
  return null;
}
```

### Iteration Loop

**Plan mode with spec name:**
```
for iteration 1..maxIterations:
  read PROMPT_plan.md from .eni/
  substitute {{SPEC_NAME}}, {{ITERATION}}
  spawn Claude → stream output → check sentinel
  break if :::ENI_PLAN_REFINED:::
```

**Plan mode without spec name (batch):**
```
for each spec in specs/*.md (excluding archive/):
  run plan loop for that spec (same as above)
```

**Build mode (epic name optional, already works without):**
```
for iteration 1..maxIterations:
  read PROMPT_build.md from .eni/
  substitute {{EPIC_NAME}}
  spawn Claude → stream output → check sentinel
  break if :::ENI_ALL_TASKS_COMPLETE:::
```

### Pre-flight Checks

Before `plan`/`build`: verify `bd` installed, `.beads/` exists, `AGENTS.md` present, `.eni/PROMPT_{mode}.md` exists.

### Elapsed Time

Each iteration prints elapsed time when complete:
```
--- Iteration 2 of 10 (3m 42s) ---
```

### Graceful Shutdown (SIGINT)

Catch Ctrl+C, kill the Claude process, stop the spinner, and print a summary:
```
^C Interrupted after iteration 3 of 10.
Completed: beads-012, beads-013
```

---

## `eni land` — Session Close

Automates the mandatory session-close ritual using beads' own sync:

```
bd sync full          # Let beads handle its full sync (branch-aware)
git push              # Push everything
git status            # Verify "up to date with origin"
```

Delegates entirely to `bd sync full` — no manual `git add .beads/` or commit crafting. Beads owns its sync process.

Fails loudly if push fails, retries once after `git pull --rebase`.

---

## `eni doctor` — Health Check

Checks that the project environment is correctly set up. Useful for onboarding and debugging.

```
$ eni doctor

✓ Node.js v20.11.0
✓ pnpm 9.1.0
✓ claude CLI installed
✓ bd (beads) installed
✓ .beads/ initialized
✓ .eni/PROMPT_plan.md present
✓ .eni/PROMPT_build.md present
✓ .claude/settings.json present
✓ .env file exists
✗ AGENTS.md missing — run: eni ai setup
```

Each check outputs a fix suggestion on failure.

---

## `eni status` — Project Dashboard

Shows the current state of specs, epics, and tasks at a glance:

```
$ eni status

Specs:
  specs/auth-flow.md          → epic: beads-001 (3/7 tasks done)
  specs/pricing-page.md       → no epic (run: eni ai plan pricing-page)
  specs/onboarding.md         → archived

Tasks:
  Ready:    2
  Blocked:  1
  Open:     4
  Closed:   12

Branch: feat/auth-flow (ahead of quality by 3 commits)
Last push: 2 hours ago
```

Reads from `bd list`, `specs/` directory, and git state. No AI involved.

---

## `eni ai setup` — Full Bootstrap + Targeted Updates

`eni ai setup` replaces `eniem ai init` but does more:

### Full setup (default)
1. Sparse-clone `eniem-dev/eniem-boilerplate.git` (depth=1)
2. Fetch only `.eni/` and `.claude/` directories
3. Copy into the user's project (skip `loop.sh` — it no longer exists in boilerplate)
4. Create `specs/` with `.gitkeep` if missing
5. Run `bd onboard` if `.beads/` doesn't exist (initialize beads)
6. Clean up temp dir

### Update mode (`--update`)
1. Sparse-clone same as above
2. Only overwrite `.claude/` (settings, hooks, commands, skills)
3. **Do not touch** `.eni/PROMPT_*.md` (user may have customized)
4. Clean up temp dir

**Why keep sparse-clone instead of bundling:**
- Prompts evolve with the boilerplate product, not the CLI
- New skills/commands ship with the boilerplate
- `eni ai setup` always gets the latest version
- CLI releases are decoupled from content updates

---

## Package & Distribution

**Package name:** `eniem` with `bin: { "eni": "./dist/cli.js" }`

```bash
npm install -g eniem    # gives you the `eni` command
eni plan my-feature
```

npm is the right channel — users already have Node.js for their Next.js projects.

**Build:** Keep `tsup`. No template bundling needed (content comes from sparse-clone).

---

## Source Organization

```
packages/cli/src/
├── cli.tsx                    # Entry point: arg parsing, command routing
├── commands/
│   ├── project.tsx            # Scaffold wizard (was: root flow)
│   ├── products.tsx           # Products manager (unchanged)
│   ├── land.ts                # Session close (bd sync full + push)
│   ├── doctor.ts              # Health check
│   ├── status.ts              # Project dashboard
│   └── ai/
│       ├── setup.tsx          # Bootstrap .eni/ + .claude/ + beads
│       ├── plan.ts            # Plan loop orchestrator (plain TS, no Ink)
│       └── build.ts           # Build loop orchestrator (plain TS, no Ink)
├── engine/                    # NEW — replaces loop.sh
│   ├── loop.ts                # Core: iteration management, sentinel detection
│   ├── claude-runner.ts       # Spawn Claude (interactive + non-interactive)
│   ├── template.ts            # Template variable substitution
│   └── preflight.ts           # Pre-flight checks
├── components/                # Ink components (unchanged)
├── config/                    # Config context for wizard (unchanged)
├── lib/
│   ├── ai-init.ts             # Sparse-clone logic (reused by setup.tsx)
│   └── ...                    # Other libs unchanged
└── steps/                     # Wizard steps (unchanged)
```

Key addition: `engine/` directory (~200 lines total) containing the loop logic.

---

## Migration Path

1. `npm install -g eniem` (new version with `eni` binary)
2. In boilerplate repo: remove `loop.sh` from `.eni/`
3. In each user project: `eni ai setup --force` (re-clones without loop.sh)
4. Replace `./loop.sh plan` → `eni ai plan` in docs/AGENTS.md
5. Final `eniem-cli` version prints deprecation notice

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Claude Code CLI flags change | Wrap behind `ClaudeRunner` interface |
| Sentinel token detection fragility | Parse JSON in stream mode, scan last 5 lines in interactive |
| npm name `eni` taken | Use `eniem` package name with `eni` bin alias |
| Boilerplate sparse-clone fails (network) | Clear error message, `eni ai plan/build` works without re-setup |

---

## Design Decisions

| Decision | Chosen | Why |
|----------|--------|-----|
| Content source | Sparse-clone from boilerplate | Content evolves with the product, not the CLI |
| Loop engine location | In CLI binary | No more scripts in projects |
| Output modes | Text-only default + `-d` debug | Clean by default, debuggable when needed |
| Loop commands UI | Plain stdout + ora spinner (no Ink) | Streams Claude output, Ink would interfere |
| Distribution | npm global | Users already have Node.js |
| Binary name | `eni` (short) via `eniem` package | Easy to type daily |

---

## Resolved Questions

1. **`eni ai setup` also initializes beads.** One command bootstraps everything: sparse-clone `.eni/` + `.claude/`, create `specs/`, AND run `bd onboard` if `.beads/` doesn't exist.

2. **`eni ai setup --update` refreshes managed files.** Re-clones `.claude/` (skills, commands, hooks, settings) from the boilerplate without touching customized prompts in `.eni/`. Users run this when the boilerplate ships new skills or updated commands.

3. **Monorepo keeps its own config.** The monorepo root has turborepo-aware prompts — this stays separate. Focus is on the consumer product (user projects cloned from the boilerplate).
