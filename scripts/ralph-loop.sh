#!/usr/bin/env bash
# Iterative validation -- Red Dragon Bot
# Usage: ./scripts/ralph-loop.sh [max_iterations]
# ==========================================================

set -euo pipefail

MAX="${1:-10}"
IT=0
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT"

echo "Red Dragon Bot -- Validation started"
echo "Max iterations: $MAX"
echo "Directory: $ROOT"
echo "=========================================="

while [ "$IT" -lt "$MAX" ]; do
    IT=$((IT + 1))
    echo ""
    echo "--- Iteration #$IT of $MAX ---"

    # 1) Syntax of all JS files
    echo "Checking syntax..."
    SYNTAX_FAIL=0
    for f in $(find src -name "*.js" -type f); do
        if ! node --check "$f" 2>/dev/null; then
            echo "  FAIL: $f"
            SYNTAX_FAIL=1
        fi
    done
    if [ "$SYNTAX_FAIL" -ne 0 ]; then
        echo "Syntax errors found. Fix and run again."
        exit 1
    fi
    echo "  Syntax OK."

    # 2) Command structure
    echo "Checking commands..."
    CMD_OK=1
    for cmd in src/commands/*.js; do
        grep -q "export const data" "$cmd" 2>/dev/null || { echo "  FAIL: $cmd missing 'export const data'"; CMD_OK=0; }
        grep -q "export async function execute" "$cmd" 2>/dev/null || { echo "  FAIL: $cmd missing 'export async function execute'"; CMD_OK=0; }
    done
    if [ "$CMD_OK" -ne 1 ]; then
        echo "Structure violation in commands."
        exit 1
    fi
    echo "  Commands OK."

    # 3) Hardcoded hex in commands
    echo "Checking color compliance..."
    HEX=$(grep -rn "0x[0-9A-Fa-f]\{6\}" src/commands/ 2>/dev/null || true)
    if [ -n "$HEX" ]; then
        echo "  FAIL: Hardcoded hex found:"
        echo "$HEX"
        exit 1
    fi
    echo "  Colors OK."

    # 4) Event structure
    echo "Checking events..."
    EVT_OK=1
    for evt in src/events/*.js; do
        grep -q "export const name" "$evt" 2>/dev/null || { echo "  FAIL: $evt missing 'export const name'"; EVT_OK=0; }
        grep -q "export.*function execute" "$evt" 2>/dev/null || { echo "  FAIL: $evt missing 'execute'"; EVT_OK=0; }
    done
    if [ "$EVT_OK" -ne 1 ]; then
        echo "Structure violation in events."
        exit 1
    fi
    echo "  Events OK."

    echo "Iteration #$IT completed -- all passed."

    PENDING=$(grep -c "\[PENDING\]\|\[FAIL\]" progress.txt 2>/dev/null || true)
    if [ "$PENDING" -eq 0 ]; then
        echo ""
        echo "=========================================="
        echo "ALL TASKS COMPLETED."
        echo "Total iterations: $IT"
        exit 0
    fi
done

echo ""
echo "=========================================="
echo "Iteration limit reached ($MAX)."
echo "Check progress.txt for pending tasks."
exit 0
