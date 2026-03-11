#!/bin/bash
# stop.sh — Stop the Fluid Canvas dev server
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CANVAS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_FILE="$CANVAS_DIR/.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "Canvas dev server is not running (no .pid file)"
  exit 0
fi

PID=$(cat "$PID_FILE")

# Kill process and its children
if kill -0 "$PID" 2>/dev/null; then
  # Kill the process group to catch child processes
  kill -- -"$PID" 2>/dev/null || kill "$PID" 2>/dev/null
  echo "Canvas dev server stopped (PID $PID)"
else
  echo "Canvas dev server was not running (stale PID $PID)"
fi

# Clean up canvas-active sentinel
PROJECT_DIR="$(cd "$CANVAS_DIR/.." && pwd)"
rm -f "$PROJECT_DIR/.fluid/canvas-active"

rm -f "$PID_FILE"
