# Ralph Workflow Improvements

## Summary

Enhance Ralph based on Anthropic's "Effective Harnesses" + AIHero's "Ralph Methodology" research.

**Single-file approach**: Enhance IMPLEMENTATION_PLAN.md format instead of adding separate files (PROGRESS.md, features.json). Markdown is better for LLM agents than JSON.

---

## Change 1: Enhanced IMPLEMENTATION_PLAN.md Format

### New Format

```markdown
# Implementation Plan: [Feature Name]

## Session Context
- **Last:** [Task completed] ([commit hash])
- **Next:** [Next task to do]
- **Issues:** [Blockers or None]

## Scope
[One-line description of the work]

## Tasks

- [x] **Create branch** `fix/feature-name`
  - Verify: `git branch --show-current | grep fix/feature-name`
  - Done: abc123

- [x] **Add SUPPORT_EMAIL to env config**
  - Verify: `grep -q SUPPORT_EMAIL apps/boilerplate/src/config/env.ts && echo pass`
  - Done: def456

- [ ] **Add locale strings for error UI**
  - Verify: `grep -q checkoutError apps/boilerplate/src/locales/index.ts && echo pass`

- [ ] **Implement error handling in component**
  - Verify: `pnpm test -- choose-plan-content`

- [ ] **Create pull request**
  - Verify: `gh pr view --json state -q '.state' | grep -q OPEN`

## Files to Modify
- `apps/boilerplate/src/config/env.ts`
- `apps/boilerplate/src/locales/index.ts`
- `apps/boilerplate/src/components/choose-plan-content.tsx`

## Patterns to Follow
- Error state: `useState<string | null>(null)` from `reset-password.tsx`
- Env config: Follow `env.email.*` structure
```

### Key Additions

| Addition | Purpose | Replaces |
|----------|---------|----------|
| `## Session Context` | Agent knows where it left off | PROGRESS.md |
| `- Verify:` per task | Explicit pass/fail verification | features.json |
| `- Done: [hash]` | Links task to commit | Session history |

### Task Status Convention

```
- [ ] Pending (not started)
- [~] In progress (started this session)
- [x] Complete (verification passed)
- [!] Blocked (issue documented in Session Context)
```

---

## Change 2: Update PROMPT_plan.md

Add new section after Phase 1 (Gap Analysis):

```markdown
## Plan Format Requirements

Generate @IMPLEMENTATION_PLAN.md with this structure:

1. **Session Context** section at top (initialize as empty for new plans)
2. **Scope** one-liner
3. **Tasks** with:
   - `[ ]` checkbox
   - **Bold description**
   - `Verify:` command that returns pass/fail
4. **Files to Modify** list
5. **Patterns to Follow** section

Verification types:
- File changes: `grep -q "pattern" file && echo pass`
- Tests: `pnpm test -- [file]`
- Branch/PR: `git`/`gh` commands
```

---

## Change 3: Update PROMPT_plan_work.md

Add to Phase 1 (Scoped Gap Analysis):

```markdown
## Plan Format Requirements

Each task MUST include:
1. **Description** in bold
2. **Verify:** command that returns pass/fail (grep, test, gh command)

Verification types:
- File changes: `grep -q "pattern" file && echo pass`
- Tests: `pnpm test -- [file]`
- Branch/PR: `git`/`gh` commands
```

---

## Change 4: Update PROMPT_build.md

### Phase 0: Add Startup Check

```markdown
## Phase 0: Startup

Before any work:
1. Read @IMPLEMENTATION_PLAN.md "Session Context" section
2. Check git branch matches plan
3. If uncommitted changes exist, ask before proceeding
4. Run `pnpm build` to verify clean state
```

### Phase 2: Update Validation

```markdown
## Phase 2: Validate

After implementing:
1. Run the task's `Verify:` command - must pass
2. Run `pnpm build` - must pass
3. Run `pnpm lint` - must pass

Only mark task `[x]` when verification passes.
```

### Phase 4: Update Commit & Exit

```markdown
## Phase 4: Commit & Exit

1. Mark task `[x]` with `Done: [commit-hash]`
2. Update "Session Context":
   - **Last:** [completed task] ([hash])
   - **Next:** [next pending task]
   - **Issues:** [any blockers found]
3. `git add -A && git commit -m "feat: ..."`
4. `git push`
5. Exit
```

### Add Error Recovery Section

```markdown
## Error Recovery

If verification fails:
1. First attempt: Targeted fix based on error
2. Second attempt: Alternative approach
3. Third attempt:
   - Mark task `[!]` (blocked)
   - Update Session Context Issues
   - Add new task: "Fix: [error description]"
   - Exit (don't commit broken code)
```

---

## Change 5: Update spec-interview.md

Add after "Acceptance Criteria" section:

```markdown
**Verification Commands**
- For each acceptance criterion, what command verifies it?
- Grep patterns, test commands, or CLI checks
```

New spec section:

```markdown
## Verification Commands

| Criterion | Command |
|-----------|---------|
| Error UI displays within 1s | `pnpm test -- choose-plan "displays error"` |
| Retry button works | `pnpm test -- choose-plan "retry triggers"` |
| Support email link correct | `grep -q "mailto:" apps/boilerplate/src/components/choose-plan-content.tsx` |
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `PROMPT_plan.md` | Add plan format requirements with `Verify:` per task |
| `PROMPT_plan_work.md` | Add plan format requirements with `Verify:` per task |
| `PROMPT_build.md` | Add Phase 0 startup, update validation, add error recovery |
| `spec-interview.md` | Add "Verification Commands" interview question + spec section |

## No New Files Needed

Everything stays in IMPLEMENTATION_PLAN.md.

---

## Implementation Order

1. Update `PROMPT_plan.md` - add plan format requirements with verification
2. Update `PROMPT_plan_work.md` - add plan format requirements with verification
3. Update `PROMPT_build.md` - startup check, validation, session context updates
4. Update `spec-interview.md` - ask for verification commands

---

## Verification

Test the updated workflow:
1. Run `./loop.sh plan` → Full plan has `Verify:` per task + Session Context section
2. Run `./loop.sh plan-work "test feature"` → Scoped plan has same format
3. Run `./loop.sh build` → Session Context updated after commit
4. Run `./loop.sh build` again → Agent reads Session Context, picks next task
5. Simulate failure → Task marked `[!]`, issue documented

---

## Decisions Made

1. **Single file**: IMPLEMENTATION_PLAN.md only (no PROGRESS.md, no features.json)
2. **Markdown over JSON**: Better for LLM reading/writing
3. **Verification per task**: Explicit command that must pass before `[x]`
