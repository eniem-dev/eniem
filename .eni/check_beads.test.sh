#!/bin/bash
# Tests for check_beads() function in loop.sh
# Run: bash .eni/check_beads.test.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOOP_SH="$SCRIPT_DIR/loop.sh"
PASS=0
FAIL=0

assert() {
  local desc="$1"
  local result="$2"
  if [ "$result" = "pass" ]; then
    echo "  PASS: $desc"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $desc"
    FAIL=$((FAIL + 1))
  fi
}

echo "Testing check_beads in .eni/loop.sh"
echo "===================================="

# Test 1: check_beads function is defined
if grep -q "check_beads()" "$LOOP_SH"; then
  assert "check_beads() function is defined" "pass"
else
  assert "check_beads() function is defined" "fail"
fi

# Test 2: Uses command -v bd
if grep -q 'command -v bd' "$LOOP_SH"; then
  assert "Uses 'command -v bd' to check bd is installed" "pass"
else
  assert "Uses 'command -v bd' to check bd is installed" "fail"
fi

# Test 3: Checks .beads directory with -d
if grep -q '! -d.*\.beads' "$LOOP_SH"; then
  assert "Checks .beads/ directory with -d flag" "pass"
else
  assert "Checks .beads/ directory with -d flag" "fail"
fi

# Test 4: check_beads is called before check_requirements in plan command
if grep -A1 "check_beads" "$LOOP_SH" | grep -q "check_requirements"; then
  assert "check_beads called before check_requirements in plan" "pass"
else
  assert "check_beads called before check_requirements in plan" "fail"
fi

# Test 5: check_beads is called before check_requirements in build command
BUILD_BLOCK=$(sed -n '/^  build)/,/^  ;;/p' "$LOOP_SH")
if echo "$BUILD_BLOCK" | grep -q "check_beads"; then
  # Also verify check_beads comes before check_requirements in the build block
  BEADS_LINE=$(echo "$BUILD_BLOCK" | grep -n "check_beads" | head -1 | cut -d: -f1)
  REQ_LINE=$(echo "$BUILD_BLOCK" | grep -n "check_requirements" | head -1 | cut -d: -f1)
  if [ "$BEADS_LINE" -lt "$REQ_LINE" ]; then
    assert "check_beads called before check_requirements in build" "pass"
  else
    assert "check_beads called before check_requirements in build" "fail"
  fi
else
  assert "check_beads called before check_requirements in build" "fail"
fi

# Test 6: Error message references 'eniem ai init' when bd not found
if grep -A3 'command -v bd' "$LOOP_SH" | grep -q 'eniem ai init'; then
  assert "Error message references 'eniem ai init' when bd not found" "pass"
else
  assert "Error message references 'eniem ai init' when bd not found" "fail"
fi

# Test 6: Error message references 'eniem ai init' when .beads/ missing
if grep -A3 '! -d.*\.beads' "$LOOP_SH" | grep -q 'eniem ai init'; then
  assert "Error message references 'eniem ai init' when .beads/ missing" "pass"
else
  assert "Error message references 'eniem ai init' when .beads/ missing" "fail"
fi

# Test 7: Help command does not trigger check_beads
# The help case block should not contain check_beads
HELP_BLOCK=$(sed -n '/-h|--help|help)/,/;;/p' "$LOOP_SH")
if echo "$HELP_BLOCK" | grep -q "check_beads"; then
  assert "Help command does NOT trigger check_beads" "fail"
else
  assert "Help command does NOT trigger check_beads" "pass"
fi

# Test 8: help command actually runs without errors
if bash "$LOOP_SH" help > /dev/null 2>&1; then
  assert "help command runs successfully" "pass"
else
  assert "help command runs successfully" "fail"
fi

# Test 9: Fallback install method mentioned (nice-to-have)
if grep -q 'npm install -g @beads/bd' "$LOOP_SH"; then
  assert "Includes fallback install method (npm install -g @beads/bd)" "pass"
else
  assert "Includes fallback install method (npm install -g @beads/bd)" "fail"
fi

echo ""
echo "Results: $PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
