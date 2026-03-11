---
name: fluid-design-os
description: "Start/stop the Fluid Design OS canvas for viewing, annotating, and iterating on generated assets."
invoke: slash
context: fork
argument-hint: '[stop]'
allowed-tools: Bash, Read
---

# Fluid Design OS

Start and manage the Fluid Design OS canvas -- a visual workspace for reviewing, annotating, and iterating on generated marketing assets.

**Canvas directory:** `$HOME/Fluid-DesignOS/canvas`

## MCP Agent Bridge

The Fluid Design OS includes an MCP server (`fluid-canvas`) that gives agents access to canvas data:
- `push_asset` -- write HTML assets to the working directory
- `read_annotations` -- read spatial pin annotations and sidebar notes
- `read_statuses` -- query variation statuses (winner/rejected/final)
- `read_history` -- read full revision history for a session
- `read_iteration_request` -- read bundled iterate-request.json context

**The MCP server is auto-managed by Claude Code via `.mcp.json` at the project root.** When Claude Code needs to use MCP tools, it spawns the MCP server process automatically using the configuration in `.mcp.json`. No manual MCP process management is needed.

The `start.sh` script manages ONLY the Vite dev server (the canvas UI). The MCP server lifecycle is entirely handled by Claude Code's MCP infrastructure (configured in `.mcp.json`).

## Behavior

Parse `$ARGUMENTS` to determine action:

### Stop (argument contains "stop")

```bash
bash "$HOME/Fluid-DesignOS/canvas/scripts/stop.sh"
```

Print: "Canvas stopped."

### Start (default, no arguments or anything other than "stop")

**Run this single Bash call.** It handles everything: dependency installation, launch.json injection, and prints the status. Do NOT add any steps before or after.

```bash
CANVAS_DIR="$HOME/Fluid-DesignOS/canvas"

# 1. Install deps if missing
if [ ! -d "$CANVAS_DIR/node_modules" ]; then
  echo "Installing canvas dependencies..."
  (cd "$CANVAS_DIR" && npm install --loglevel=error 2>&1 | grep -v "^npm warn Unknown")
fi

# 2. Inject fluid-canvas into .claude/launch.json so preview_start works
LAUNCH="$HOME/Fluid-DesignOS/.claude/launch.json"
mkdir -p "$HOME/Fluid-DesignOS/.claude"
CANVAS_CONFIG='{"name":"fluid-canvas","runtimeExecutable":"npx","runtimeArgs":["vite","--port","5174"],"port":5174,"cwd":"'"$CANVAS_DIR"'"}'

if [ ! -f "$LAUNCH" ]; then
  echo '{"version":"0.0.1","configurations":['"$CANVAS_CONFIG"']}' > "$LAUNCH"
  echo "Created $LAUNCH with fluid-canvas config"
elif ! grep -q '"fluid-canvas"' "$LAUNCH" 2>/dev/null; then
  # Add to existing configurations array
  node -e "
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync('$LAUNCH','utf8'));
    data.configurations = data.configurations || [];
    data.configurations.push($CANVAS_CONFIG);
    fs.writeFileSync('$LAUNCH', JSON.stringify(data, null, 2) + '\n');
  "
  echo "Added fluid-canvas to $LAUNCH"
else
  echo "fluid-canvas already in $LAUNCH"
fi

echo ""
echo "Fluid Design OS canvas ready."
echo ""
echo "  Open:             http://localhost:5174"
echo "  Generate assets:  /fluid-social \"your topic\" --variations 3"
echo "  Stop:             /fluid-design-os stop"
echo ""
echo "  MCP bridge (fluid-canvas) is auto-managed by Claude Code via .mcp.json"
```

**After the Bash call completes**, call `preview_start` with name `"fluid-canvas"`. This starts the Vite dev server AND opens the preview browser in one action.

Do NOT start the server yourself (no start.sh, no npm run dev, no npx vite). Let `preview_start` handle it -- it uses the launch.json config to start the server and open the preview together. Starting the server manually causes port conflicts.

If `preview_start` is not available (CLI mode), fall back to:
```bash
bash "$HOME/Fluid-DesignOS/canvas/scripts/start.sh"
```
Then print: "Open http://localhost:5174 in your browser."

## Workflow

Once the canvas is running:

1. **Generate variations:** `/fluid-social "your topic" --variations 3`
2. **View in canvas:** Variations appear automatically (no manual refresh)
3. **Annotate:** Click on any variation to place a spatial pin annotation; use the sidebar notes panel for general observations
4. **Mark winner:** Click the star icon on the best variation; others auto-reject
5. **Iterate:** Type feedback in the iterate panel and click Iterate
6. **Agents read back:** The MCP server exposes annotations and iteration context to agents via tools configured in `.mcp.json`

## Important

- **Always use absolute paths** with `$HOME` (not `~`) in bash scripts. `~` doesn't expand in all contexts.
- **Do NOT** start the dev server before calling `preview_start`. Let preview_start handle it.
- **Do NOT** use `open` to launch the system browser. Use Claude Code Desktop's built-in preview.
- **Do NOT** add extra output, explanations, or troubleshooting tips beyond what the script prints.
- **Do NOT** use `npm run dev` or bare `vite`. The launch.json uses `npx vite` which resolves correctly.
- **Do NOT** manually start or stop the MCP server. The `.mcp.json` file at the project root configures Claude Code to manage the MCP server process automatically.
