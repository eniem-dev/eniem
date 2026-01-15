#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMP_OUTPUT="$SCRIPT_DIR/.last-output"

# Parse arguments
INTERACTIVE=false
USE_WORKTREE=false
MAX=10
IMPL_FOLDER=""

while [[ $# -gt 0 ]]; do
  case $1 in
    -i) INTERACTIVE=true; shift ;;
    -w|--worktree) USE_WORKTREE=true; shift ;;
    [0-9]*) MAX=$1; shift ;;
    *) IMPL_FOLDER="$1"; shift ;;
  esac
done

if [ -z "$IMPL_FOLDER" ]; then
  echo "Error: Implementation folder required"
  echo "Usage: ralph.sh <folder> [max_iterations] [-i] [-w]"
  echo "Example: ralph.sh issue-123 20 -i"
  echo ""
  echo "Options:"
  echo "  -i  Interactive mode"
  echo "  -w  Use git worktree"
  echo ""
  echo "Available implementations:"
  ls -1 "$SCRIPT_DIR/implementations/" 2>/dev/null || echo "  (none)"
  exit 1
fi

IMPL_PATH="$SCRIPT_DIR/implementations/$IMPL_FOLDER"
if [ ! -d "$IMPL_PATH" ]; then
  echo "Error: Implementation folder not found: $IMPL_PATH"
  echo ""
  echo "Available implementations:"
  ls -1 "$SCRIPT_DIR/implementations/" 2>/dev/null || echo "  (none)"
  exit 1
fi

# Build prompt with injected values
build_prompt() {
  PROMPT=$(cat "$SCRIPT_DIR/prompt.md")
  PROMPT="${PROMPT//\{\{IMPL_PATH\}\}/$IMPL_PATH}"
  PROMPT="${PROMPT//\{\{USE_WORKTREE\}\}/$USE_WORKTREE}"
  echo "$PROMPT"
}

for i in $(seq 1 $MAX); do
  echo "=== Iteration $i ==="

  if $INTERACTIVE; then
    script -q "$TEMP_OUTPUT" bash -c "echo '$(build_prompt)' | claude --dangerously-skip-permissions"
  else
    build_prompt | claude --dangerously-skip-permissions > "$TEMP_OUTPUT" 2>&1
    cat "$TEMP_OUTPUT"
  fi

  if grep -q "<promise>COMPLETE</promise>" "$TEMP_OUTPUT"; then
    echo "PRD complete after $i iterations."
    exit 0
  fi
  sleep 2
done
echo "Max iterations reached."
