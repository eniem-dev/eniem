<p align="center">
  <img src="public/android-chrome-512x512.png" alt="Eniem" width="120" height="120">
</p>

<h1 align="center">Eniem Boilerplate</h1>

<p align="center">
  A production-ready Next.js 15 boilerplate with authentication, payments, and everything you need to ship fast. Start building today.
</p>

---

# Get Started

```bash
git clone https://github.com/eniem-dev/eniem-boilerplate [YOUR_APP_NAME]
cd [YOUR_APP_NAME]
git remote remove origin && rm -rf .git && git init
pnpm install
pnpm dev
```

## Rebranding

This boilerplate uses `myapp` (slug) and `MyApp` (display name) as placeholders. Replace them with your own project name:

```bash
# Replace display name (e.g., "My Cool App")
grep -rl "MyApp" . --exclude-dir={node_modules,.git} | xargs sed -i 's/MyApp/Your App Name/g'

# Replace slug (e.g., "mycoolapp")
grep -rl "myapp" . --exclude-dir={node_modules,.git} | xargs sed -i 's/myapp/yourslug/g'
```

> **Note:** If your project name contains regex special characters (`.`, `*`, `+`, etc.), you'll need to escape them in the sed commands.

## Documentation

Full documentation available at [doc.eniem.dev](https://doc.eniem.dev)

---

## Ralph Workflow (AI-Assisted Development)

This project uses the [Ralph methodology](https://claytonfarr.github.io/ralph-playbook/) for autonomous AI-assisted development.

### Core Concepts

```
GitHub Issue (idea) → Spec Interview → specs/*.md → Planning → Build Loop → PR
```

| Artifact | Purpose | Lifecycle |
|----------|---------|-----------|
| `specs/*.md` | Requirements & acceptance criteria | Permanent, evolves |
| `IMPLEMENTATION_PLAN.md` | Prioritized task list | Disposable, per-branch |
| `PROMPT_*.md` | Instructions for Claude | Permanent |
| `loop.sh` | Orchestration script | Permanent |

### Quick Start

```bash
# 1. Create spec via interview
/spec-interview <feature-name>

# 2. Generate implementation plan
./loop.sh plan                      # Full plan from all specs
./loop.sh plan-work "description"   # Scoped plan for specific work

# 3. Build (choose your trust level)
./loop.sh build 1                   # Supervised: 1 task, review, repeat
./loop.sh build 10                  # Autonomous: 10 tasks, review PR
```

### Workflow Modes

**Supervised (stay in the loop)**
```bash
./loop.sh build 1   # Run one task
# Review changes
./loop.sh build 1   # Run next task
# Repeat until done
```

**Autonomous (let it run)**
```bash
./loop.sh build 20  # Run 20 tasks
# Review PR when done
```

### Key Principles

1. **Specs capture WHAT and WHY**, not HOW
2. **Plans are disposable** - regenerate freely
3. **Backpressure via validation** - build/lint must pass before commit
4. **Context resets between iterations** - fresh context = better performance
5. **Human reviews PR** - Ralph never merges to main

### File Structure

```
├── specs/                    # Requirements (committed)
│   └── feature-name.md
├── IMPLEMENTATION_PLAN.md    # Task list (gitignored)
├── PROMPT_plan.md            # Full planning instructions
├── PROMPT_plan_work.md       # Work-scoped planning
├── PROMPT_build.md           # Build mode instructions
└── loop.sh                   # Orchestration script
```

### Creating Specs

Use the interview skill for structured spec creation:

```
/spec-interview analytics-dashboard
```

Claude will ask questions using AskUserQuestionTool to clarify:
- Job to be done
- Requirements
- Acceptance criteria
- Edge cases

Output: `specs/analytics-dashboard.md`
