# Build Mode: Looper (PRD Sub-Issues)

You are in build mode. You must:

1. Implement exactly one ready sub-issue of PRD #{{PRD_ISSUE}} per iteration, using TDD (via the `tdd` skill).
2. Follow the phases below in order, starting at Phase 0.

Do not treat this prompt as documentation. Do not ask the user to confirm. Start now.

**Context**
- PRD: #{{PRD_ISSUE}}
- Iteration: {{ITERATION}} / {{MAX_ITERATIONS}}
- Session: {{SESSION_ID}}

---

## Path Discovery

**NEVER guess file paths.** Use Glob/Grep to verify paths exist before editing. For new files, verify the parent directory exists.

---

## Phase 0: Worktree Setup

```bash
BRANCH="feat/prd-{{PRD_ISSUE}}"
WORKTREE=".worktrees/$BRANCH"

if [ ! -d "$WORKTREE" ]; then
  git worktree add "$WORKTREE" -b "$BRANCH" 2>/dev/null || git worktree add "$WORKTREE" "$BRANCH"
  cd "$WORKTREE"
  pnpm install
else
  cd "$WORKTREE"
fi
```

All work happens inside `$WORKTREE`.

---

## Phase 1: Find a Ready Sub-Issue

Children of the PRD are discovered via body-ref, not labels. Each child contains a `## Parent PRD\n\n#{{PRD_ISSUE}}` block.

```bash
gh issue list \
  --search "in:body \"Parent PRD\" \"#{{PRD_ISSUE}}\"" \
  --state open \
  --json number,title,body
```

Filter the results to only those whose body literally contains the line `#{{PRD_ISSUE}}` under a `## Parent PRD` heading (guard against false-positive mentions).

For each open child, parse its `## Blocked by` section. A child is **ready** when every issue listed under `Blocked by` is closed:

```bash
gh issue view <blocker-number> --json state -q '.state'
```

Decision tree:

- **No open children remain** → go to **Phase 6: Create PR**.
- **Open children exist but all are blocked** → emit `:::LOOPER_DONE:::` (human must unblock).
- **At least one ready child** → pick the lowest-numbered ready child and continue.

---

## Phase 2: Gather Context

1. Read the chosen sub-issue: `gh issue view <number> --json title,body`
2. Read the parent PRD: `gh issue view {{PRD_ISSUE}} --json title,body`
3. Read `AGENTS.md` (or `CLAUDE.md`) for architecture, conventions, and commands
4. Find an existing test file in the area you're touching — follow its patterns
5. Explore the codebase enough to confirm the behavior doesn't already exist and to understand neighboring patterns

---

## Phase 3: Implement

**Follow the `tdd` skill for implementation.** Write one failing test per acceptance criterion, make it pass with minimal code, repeat. Refactor only when green. Mock only at system boundaries.

The sub-issue's `## Acceptance criteria` checklist drives the test list. Each criterion → one RED/GREEN cycle.

---

## Phase 4: Validate

```bash
./scripts/run_silent "build" pnpm build
./scripts/run_silent "lint" pnpm lint
./scripts/run_silent "test" pnpm test
./scripts/run_silent "typecheck" pnpm typecheck
```

All four must pass. If validation fails:

1. **First attempt** — targeted fix based on the error.
2. **Second attempt** — alternative approach.
3. **Third attempt** — stop. Do NOT commit broken code. Emit `:::LOOPER_DONE:::`.

The human decides what to do (fix manually, close the issue, rewrite the sub-issue). Looper's `maxIterations` backstops any runaway loop.

---

## Phase 5: Commit & Close

When validation passes:

```bash
gh issue close <number>

git add -A
git commit -m "feat(prd-{{PRD_ISSUE}}): <sub-issue title>

Closes #<number>"
git push -u origin HEAD
```

**STOP.** Do not pick up another task — looper will re-spawn for the next iteration.

---

## Phase 6: Create PR

Only reached when every child of PRD #{{PRD_ISSUE}} is closed.

```bash
gh pr create \
  --title "feat: <PRD title>" \
  --body "Closes #{{PRD_ISSUE}}"
```

Emit `:::LOOPER_DONE:::`.

---

## Guardrails

1. **Single task per iteration** — one sub-issue, then stop.
2. **Test first** — RED before GREEN, always. (See the `tdd` skill.)
3. **Validate before commit** — never commit failing code.
4. **Worktree first** — all work happens inside `.worktrees/feat/prd-{{PRD_ISSUE}}`.
5. **Body-ref discovery only** — no labels, no native sub-issue API.
6. **No PRD mutation** — never edit or close the PRD issue.
7. **Use `run_silent`** — wrap every validation command.

---

## Command Reference

```bash
# Find ready sub-issues
gh issue list --search 'in:body "Parent PRD" "#{{PRD_ISSUE}}"' --state open --json number,title,body

# Read issues
gh issue view <number> --json title,body,state
gh issue view {{PRD_ISSUE}} --json title,body

# Close + comment
gh issue close <number>
gh issue comment <number> --body "..."

# PR
gh pr create --title "..." --body "..."
```
