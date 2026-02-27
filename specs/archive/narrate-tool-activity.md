# Narrate Tool Activity in Plan/Build Prompts

## Problem

When running `eni plan` or `eni build` with non-Claude CLIs (OpenCode, Codex), the AI model often jumps straight into tool calls without any explanatory text. In non-verbose mode — where only text events are displayed — this creates long silent stretches where the user has no idea what's happening.

Claude naturally narrates its actions ("I'll read the spec first..." → tool → "Found the auth patterns, now let me..."), but other models don't. Since this is a behavioral difference in how models communicate, not a code bug, the fix belongs in the prompt templates.

However, narration adds output tokens — increasing execution time and cost. Not all users want it. The solution is a config option that controls whether narration instructions are injected into the prompt.

## Users

**Primary**: Developer running `eni plan` or `eni build` interactively in their terminal, watching real-time output.

## Solution

### Config Option

Add a `narration` key to `.eni/config.json` with two possible values:

- **`concise`** (default) — No narration instructions added to prompts. The model behaves as-is. Fast, fewer tokens.
- **`explicit`** — A "Communication Style" section is injected into `PROMPT_plan.md` and `PROMPT_build.md` at prompt build time, instructing the model to narrate its work.

```json
{
  "plan": "claude",
  "build": "claude",
  "narration": "explicit"
}
```

When `narration` is absent from config, it defaults to `concise`.

### Prompt Injection

When `narration` is set to `explicit`, the following section is prepended to the prompt (before the workflow phases):

```markdown
## Communication Style

Always explain what you are about to do before using any tool, and briefly summarize what you found or accomplished after. Keep narration concise — 1-2 sentences. This ensures the user can follow your progress in real-time.
```

When `narration` is `concise` (or absent), this section is not included.

### Narration Style (When Explicit)

Conversational but concise — 1-2 sentences per narration point:

- **Before tool calls**: Explain what you're about to do and why
- **After tool results**: Briefly summarize what you found or accomplished
- **Between phases**: State what phase you're entering

### Example: Explicit Narration

```
I'll start by reading the spec to understand the feature requirements.
[tool] Read: specs/my-feature.md

Good, the spec describes a user auth flow. Let me check the existing
codebase for authentication patterns I can build on.
[tool] Grep: pattern="auth" path="src/"

Found existing auth middleware in src/middleware.ts. Now I'll create
the epic and break this down into tasks.
[tool] Bash: bd create --type=epic ...
```

### Example: Concise (Default)

```
[tool] Read: specs/my-feature.md
[tool] Grep: pattern="auth" path="src/"
[tool] Bash: bd create --type=epic ...
```

(In non-verbose mode, the `[tool]` lines are hidden too — so the user sees nothing.)

## Scope

### In Scope

- New `narration` config key in `.eni/config.json` (`concise` | `explicit`)
- Config reading/validation for the new key
- Conditional injection of Communication Style section into prompts at build time
- Applies to both `PROMPT_plan.md` and `PROMPT_build.md`
- First-run config prompt should include the narration option (alongside CLI selection)

### Out of Scope

- CLI flag override (e.g. `--narration explicit`) — future enhancement
- Per-command narration settings (e.g. different for plan vs build)
- Verbose mode tool display improvements (covered by separate `verbose-tool-path-display` spec)
- Automated testing of narration quality

## Implementation Notes

- The Communication Style section should be injected during template variable substitution (where `{{SPEC_NAME}}`, `{{ITERATION}}` etc. are replaced), not hard-coded into the prompt files
- The prompt files themselves stay unchanged — the narration block is added dynamically
- Config validation: `narration` must be `"concise"` or `"explicit"`. Invalid values fall back to `concise`

## Acceptance Criteria

- `.eni/config.json` accepts a `narration` key with values `concise` or `explicit`
- When `narration: "explicit"`, both plan and build prompts include the Communication Style section
- When `narration: "concise"` (or absent), prompts are unchanged from current behavior
- When running with `narration: "explicit"` and any CLI adapter, the model produces explanatory text between tool-call clusters
- Verification: manual spot-check by running plan/build with `narration: "explicit"` and a non-Claude adapter

## Trade-offs

- **Config complexity**: One more option for users to understand. Mitigated by sensible default (`concise`).
- **Model compliance varies**: Some models may follow the narration instruction more strictly than others. Minimum bar: any text between tool clusters.
- **Prompt length**: The injected section is small (~30 words). Negligible impact on input tokens.
