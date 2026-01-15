#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMPL_FOLDER=""
USE_WORKTREE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -w|--worktree) USE_WORKTREE=true; shift ;;
    *) IMPL_FOLDER="$1"; shift ;;
  esac
done

if [ -z "$IMPL_FOLDER" ]; then
  echo "Error: Implementation folder required"
  echo "Usage: ralph-once.sh <folder> [-w]"
  echo "Example: ralph-once.sh issue-123"
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

# Inject implementation path into prompt
PROMPT=$(cat "$SCRIPT_DIR/prompt.md")
PROMPT="${PROMPT//\{\{IMPL_PATH\}\}/$IMPL_PATH}"
PROMPT="${PROMPT//\{\{USE_WORKTREE\}\}/$USE_WORKTREE}"

echo "$PROMPT" | claude --dangerously-skip-permissions
