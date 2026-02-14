#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Global flags
INTERACTIVE=false

print_usage() {
  echo -e "${BLUE}ENI Loop - Autonomous AI Coding${NC}"
  echo ""
  echo "Usage:"
  echo "  ./loop.sh plan <spec-name> [N] [-i]    Create beads from spec (default: 3 iterations)"
  echo "  ./loop.sh build [epic-name] [N] [-i]   Build mode (default: 10 iterations, all ready tasks)"
  echo ""
  echo "Options:"
  echo "  -i    Interactive mode (watch Claude work in real-time)"
  echo ""
  echo "Examples:"
  echo "  ./loop.sh plan usage-based-pricing        Create beads (3 iterations)"
  echo "  ./loop.sh plan usage-based-pricing 5      Create beads (5 iterations)"
  echo "  ./loop.sh build                           Build all ready tasks (1 iteration)"
  echo "  ./loop.sh build usage-based-pricing       Build only tasks from epic"
  echo "  ./loop.sh build usage-based-pricing 10    Build epic tasks (10 iterations)"
  echo "  ./loop.sh build 10 -i                     Build all (10 iterations, interactive)"
  echo ""
  echo "Workflow:"
  echo "  1. /functional-spec <name>    Create specs/<name>.md"
  echo "  2. ./loop.sh plan <name>      Create beads epic + issues"
  echo "  3. bd ready                   See what to work on"
  echo "  4. ./loop.sh build [epic]     Implement tasks"
}

LAST_OUTPUT=""

run_claude() {
  local prompt_file="$1"
  local spec_name="${2:-}"
  local iteration="${3:-1}"
  local epic_name="${4:-}"
  local prompt_content

  prompt_content=$(cat "$prompt_file")

  # Template substitutions
  if [ -n "$spec_name" ]; then
    prompt_content=$(echo "$prompt_content" | sed "s|{{SPEC_NAME}}|$spec_name|g")
  fi
  prompt_content=$(echo "$prompt_content" | sed "s|{{ITERATION}}|$iteration|g")
  if [ -n "$epic_name" ]; then
    prompt_content=$(echo "$prompt_content" | sed "s|{{EPIC_NAME}}|$epic_name|g")
  else
    prompt_content=$(echo "$prompt_content" | sed "s|{{EPIC_NAME}}||g")
  fi

  if $INTERACTIVE; then
    # Interactive: use script to preserve TTY for full UI while capturing output
    local tmp_output tmp_prompt
    tmp_output=$(mktemp)
    tmp_prompt=$(mktemp)
    printf '%s' "$prompt_content" > "$tmp_prompt"
    # OS-specific script syntax: Linux uses -c, macOS/BSD puts command after file
    if [[ "$OSTYPE" == "darwin"* ]]; then
      script -q "$tmp_output" bash -c "claude --dangerously-skip-permissions < '$tmp_prompt'"
    else
      script -q -c "claude --dangerously-skip-permissions < '$tmp_prompt'" "$tmp_output"
    fi
    LAST_OUTPUT=$(cat "$tmp_output")
    rm -f "$tmp_output" "$tmp_prompt"
  else
    # Non-interactive: stream-json mode with formatted output (using Node.js for JSON parsing)
    tmp_output=$(mktemp)
    echo "$prompt_content" | claude --dangerously-skip-permissions -p --verbose --output-format stream-json 2>&1 | tee "$tmp_output" | node -e '
const rl = require("readline").createInterface({ input: process.stdin });
rl.on("line", (line) => {
  try {
    const d = JSON.parse(line);
    if (d.type === "assistant") {
      for (const c of d.message?.content || []) {
        if (c.type === "text") console.log(c.text);
        else if (c.type === "tool_use") {
          const i = c.input || {};
          const info = i.file_path || i.pattern || i.command?.slice(0, 60) || i.query || i.content?.slice(0, 40) || Object.keys(i).join(", ");
          console.log("→ " + c.name + ": " + info);
        }
      }
    }
  } catch {}
});
'
    LAST_OUTPUT=$(cat "$tmp_output")
    rm -f "$tmp_output"
  fi
}

# Check if Claude signaled completion
# Only check last line to avoid matching the marker in the prompt instructions
is_complete() {
  echo "$LAST_OUTPUT" | tail -n 1 | grep -q ":::ENI_ALL_TASKS_COMPLETE:::"
}

# Check if Claude signaled plan is fully refined
is_refined() {
  echo "$LAST_OUTPUT" | tail -n 1 | grep -q ":::ENI_PLAN_REFINED:::"
}

check_beads() {
  if ! command -v bd &> /dev/null; then
    echo -e "${RED}Error: bd (beads) is not installed${NC}"
    echo -e "Install with: ${YELLOW}eniem ai init${NC}"
    echo -e "Or manually: ${YELLOW}npm install -g @beads/bd${NC}"
    exit 1
  fi

  if [ ! -d "$PROJECT_ROOT/.beads" ]; then
    echo -e "${RED}Error: .beads/ directory not found — beads not initialized${NC}"
    echo -e "Initialize with: ${YELLOW}eniem ai init${NC}"
    exit 1
  fi
}

check_requirements() {
  if [ ! -f "$PROJECT_ROOT/AGENTS.md" ]; then
    echo -e "${RED}Error: AGENTS.md not found${NC}"
    exit 1
  fi

  if [ ! -d "$PROJECT_ROOT/specs" ] || [ -z "$(ls -A "$PROJECT_ROOT/specs" 2>/dev/null)" ]; then
    echo -e "${YELLOW}Warning: specs/ directory is empty or missing${NC}"
    echo "Create spec files first using: /spec-interview <feature-name>"
  fi
}

# Parse flags from any position
parse_flags() {
  for arg in "$@"; do
    case "$arg" in
      -i|--interactive) INTERACTIVE=true ;;
    esac
  done
}

# Parse flags first
parse_flags "$@"

case "${1:-}" in
  plan)
    # Require spec name
    SPEC_NAME=""
    MAX_ITERATIONS=3
    for arg in "${@:2}"; do
      if [[ "$arg" == -* ]]; then
        continue
      elif [[ "$arg" =~ ^[0-9]+$ ]]; then
        MAX_ITERATIONS="$arg"
      else
        SPEC_NAME="$arg"
      fi
    done

    if [ -z "$SPEC_NAME" ]; then
      echo -e "${RED}Error: Spec name required${NC}"
      echo "Usage: ./loop.sh plan <spec-name> [iterations] [-i]"
      echo ""
      echo "Available specs:"
      ls -1 "$PROJECT_ROOT/specs" 2>/dev/null | sed 's/\.md$//' | sed 's/^/  /'
      exit 1
    fi

    if [ ! -f "$PROJECT_ROOT/specs/${SPEC_NAME}.md" ]; then
      echo -e "${RED}Error: specs/${SPEC_NAME}.md not found${NC}"
      echo ""
      echo "Available specs:"
      ls -1 "$PROJECT_ROOT/specs" 2>/dev/null | sed 's/\.md$//' | sed 's/^/  /'
      exit 1
    fi

    check_beads
    check_requirements
    echo -e "${GREEN}=== Planning Mode: ${SPEC_NAME} ===${NC}"
    $INTERACTIVE && echo -e "${BLUE}Interactive mode enabled${NC}"
    echo "Creating beads from specs/${SPEC_NAME}.md ($MAX_ITERATIONS iterations)..."

    for i in $(seq 1 "$MAX_ITERATIONS"); do
      echo ""
      echo -e "${BLUE}--- Iteration $i of $MAX_ITERATIONS ---${NC}"

      run_claude "$SCRIPT_DIR/PROMPT_plan.md" "$SPEC_NAME" "$i"

      # Check for early exit (plan fully refined)
      if is_refined; then
        echo ""
        echo -e "${GREEN}=== Plan Fully Refined ===${NC}"
        exit 0
      fi

      if [ "$i" -lt "$MAX_ITERATIONS" ]; then
        sleep 2
      fi
    done

    echo -e "${GREEN}=== Planning Complete ===${NC}"
    ;;

  build)
    check_beads
    check_requirements

    # Parse arguments: [epic-name] [iterations]
    EPIC_NAME=""
    MAX_ITERATIONS=10
    for arg in "${@:2}"; do
      if [[ "$arg" == -* ]]; then
        continue
      elif [[ "$arg" =~ ^[0-9]+$ ]]; then
        MAX_ITERATIONS="$arg"
      else
        EPIC_NAME="$arg"
      fi
    done

    # Check if there are ready beads
    if [ -n "$EPIC_NAME" ]; then
      # Filter by epic name in title
      READY_COUNT=$(bd ready 2>/dev/null | grep -i "$EPIC_NAME" | grep -c "^beads-" || echo "0")
    else
      READY_COUNT=$(bd ready 2>/dev/null | grep -c "^beads-" || echo "0")
    fi

    if [ "$READY_COUNT" -eq 0 ]; then
      echo -e "${YELLOW}Warning: No ready beads found${NC}"
      if [ -n "$EPIC_NAME" ]; then
        echo "No ready tasks for epic: $EPIC_NAME"
      fi
      echo "Run './loop.sh plan <spec-name>' first to create beads"
      echo ""
      echo "Or check blocked issues with: bd blocked"
    fi

    echo -e "${GREEN}=== Build Mode ===${NC}"
    if [ -n "$EPIC_NAME" ]; then
      echo "Epic: $EPIC_NAME"
    else
      echo "Building all ready tasks"
    fi
    $INTERACTIVE && echo -e "${BLUE}Interactive mode enabled${NC}"
    echo "Running $MAX_ITERATIONS iteration(s)..."
    echo "Ready tasks: $READY_COUNT"

    for i in $(seq 1 "$MAX_ITERATIONS"); do
      echo ""
      echo -e "${BLUE}--- Iteration $i of $MAX_ITERATIONS ---${NC}"

      if ! run_claude "$SCRIPT_DIR/PROMPT_build.md" "" "1" "$EPIC_NAME"; then
        echo -e "${RED}Build iteration failed${NC}"
        exit 1
      fi

      # Check for completion marker
      if is_complete; then
        echo ""
        echo -e "${GREEN}=== All Tasks Complete ===${NC}"
        exit 0
      fi

      if [ "$i" -lt "$MAX_ITERATIONS" ]; then
        sleep 2
      fi
    done

    echo ""
    echo -e "${GREEN}=== Completed $MAX_ITERATIONS iteration(s) ===${NC}"
    echo "Run './loop.sh build' again to continue, or check: bd ready"
    ;;

  -h|--help|help)
    print_usage
    ;;

  *)
    print_usage
    exit 1
    ;;
esac
