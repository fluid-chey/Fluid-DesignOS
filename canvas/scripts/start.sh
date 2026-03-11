#!/bin/bash
# start.sh — Start the Fluid Canvas dev server
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CANVAS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_FILE="$CANVAS_DIR/.pid"
PORT=5174

# Check if already running
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo "Canvas dev server already running (PID $PID)"
    echo "  http://localhost:$PORT"
    exit 0
  else
    # Stale PID file
    rm -f "$PID_FILE"
  fi
fi

# Start the dev server
cd "$CANVAS_DIR"
npm run dev > /dev/null 2>&1 &
echo $! > "$PID_FILE"

# Wait for server to be ready (max 10 seconds)
echo -n "Starting canvas dev server..."
for i in $(seq 1 20); do
  if curl -s -o /dev/null "http://localhost:$PORT" 2>/dev/null; then
    echo " ready!"
    echo "  http://localhost:$PORT"
    exit 0
  fi
  sleep 0.5
done

echo " timeout (server may still be starting)"
echo "  http://localhost:$PORT"
echo "  PID: $(cat "$PID_FILE")"
