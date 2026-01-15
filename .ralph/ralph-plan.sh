#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ISSUE_URL="$1"

if [ -n "$ISSUE_URL" ]; then
  # Skip to prd.json generation (issue URL provided)
  echo -e "$(cat "$SCRIPT_DIR/prompt-plan.md")\n\nGitHub Issue: $ISSUE_URL" | claude --dangerously-skip-permissions
else
  # Full planning flow
  cat "$SCRIPT_DIR/prompt-plan.md" | claude --dangerously-skip-permissions
fi
