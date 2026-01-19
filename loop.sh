#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Global flags
INTERACTIVE=false

print_usage() {
  echo -e "${BLUE}Ralph Loop - Autonomous AI Coding${NC}"
  echo ""
  echo "Usage:"
  echo "  ./loop.sh plan [-i]                    Full planning from all specs"
  echo "  ./loop.sh plan-work \"description\" [-i] Work-scoped planning"
  echo "  ./loop.sh build [N] [-i]               Build mode (default: 1 iteration)"
  echo ""
  echo "Options:"
  echo "  -i    Interactive mode (watch Claude work in real-time)"
  echo ""
  echo "Examples:"
  echo "  ./loop.sh plan                    Generate full implementation plan"
  echo "  ./loop.sh plan -i                 Plan interactively (watch progress)"
  echo "  ./loop.sh plan-work \"user auth\"   Plan only user auth feature"
  echo "  ./loop.sh build                   Run 1 build iteration (supervised)"
  echo "  ./loop.sh build 10                Run 10 build iterations (autonomous)"
  echo "  ./loop.sh build 1 -i              Run 1 iteration interactively"
  echo ""
  echo "Requirements:"
  echo "  - specs/*.md files with requirements"
  echo "  - CLAUDE.md with project conventions"
}

LAST_OUTPUT=""

run_claude() {
  local prompt_file="$1"
  local work_scope="$2"
  local prompt_content

  if [ -n "$work_scope" ]; then
    prompt_content=$(sed "s|{{WORK_SCOPE}}|$work_scope|g" "$prompt_file")
  else
    prompt_content=$(cat "$prompt_file")
  fi

  if $INTERACTIVE; then
    # Interactive: use script to preserve TTY for full UI while capturing output
    local tmp_output
    tmp_output=$(mktemp)
    script -q "$tmp_output" claude --dangerously-skip-permissions "$prompt_content"
    LAST_OUTPUT=$(cat "$tmp_output")
    rm -f "$tmp_output"
  else
    # Non-interactive: pipe mode, capture output
    LAST_OUTPUT=$(echo "$prompt_content" | claude --dangerously-skip-permissions -p)
    echo "$LAST_OUTPUT"
  fi
}

# Check if Claude signaled completion
is_complete() {
  echo "$LAST_OUTPUT" | grep -q "<complete>DONE</complete>"
}

check_requirements() {
  if [ ! -f "$SCRIPT_DIR/CLAUDE.md" ]; then
    echo -e "${RED}Error: CLAUDE.md not found${NC}"
    exit 1
  fi

  if [ ! -d "$SCRIPT_DIR/specs" ] || [ -z "$(ls -A "$SCRIPT_DIR/specs" 2>/dev/null)" ]; then
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
    check_requirements
    echo -e "${GREEN}=== Planning Mode ===${NC}"
    $INTERACTIVE && echo -e "${BLUE}Interactive mode enabled${NC}"
    echo "Analyzing specs and generating implementation plan..."
    run_claude "$SCRIPT_DIR/PROMPT_plan.md"
    echo -e "${GREEN}=== Planning Complete ===${NC}"
    ;;

  plan-work)
    if [ -z "${2:-}" ] || [[ "${2:-}" == -* ]]; then
      echo -e "${RED}Error: Work scope description required${NC}"
      echo "Usage: ./loop.sh plan-work \"description of work\" [-i]"
      exit 1
    fi
    check_requirements
    echo -e "${GREEN}=== Work-Scoped Planning Mode ===${NC}"
    $INTERACTIVE && echo -e "${BLUE}Interactive mode enabled${NC}"
    echo "Scope: $2"
    run_claude "$SCRIPT_DIR/PROMPT_plan_work.md" "$2"
    echo -e "${GREEN}=== Planning Complete ===${NC}"
    ;;

  build)
    check_requirements

    # Get max iterations (skip flags)
    MAX_ITERATIONS=1
    for arg in "${@:2}"; do
      if [[ "$arg" =~ ^[0-9]+$ ]]; then
        MAX_ITERATIONS="$arg"
        break
      fi
    done

    if [ ! -f "$SCRIPT_DIR/IMPLEMENTATION_PLAN.md" ]; then
      echo -e "${RED}Error: IMPLEMENTATION_PLAN.md not found${NC}"
      echo "Run './loop.sh plan' or './loop.sh plan-work \"scope\"' first"
      exit 1
    fi

    echo -e "${GREEN}=== Build Mode ===${NC}"
    $INTERACTIVE && echo -e "${BLUE}Interactive mode enabled${NC}"
    echo "Running $MAX_ITERATIONS iteration(s)..."

    for i in $(seq 1 "$MAX_ITERATIONS"); do
      echo ""
      echo -e "${BLUE}--- Iteration $i of $MAX_ITERATIONS ---${NC}"

      if ! run_claude "$SCRIPT_DIR/PROMPT_build.md"; then
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
    echo "Run './loop.sh build' again to continue, or review IMPLEMENTATION_PLAN.md"
    ;;

  -h|--help|help)
    print_usage
    ;;

  *)
    print_usage
    exit 1
    ;;
esac
