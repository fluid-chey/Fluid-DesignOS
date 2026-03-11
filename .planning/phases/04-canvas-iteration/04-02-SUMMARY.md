---
phase: 04-canvas-iteration
plan: 02
subsystem: mcp
tags: [mcp, stdio, modelcontextprotocol, zod, typescript, agent-tools]

requires:
  - phase: 02-orchestrator-social-posts
    provides: .fluid/working/ directory structure and lineage.json format
provides:
  - MCP stdio server with 5 agent-to-canvas tools
  - push_asset tool for writing HTML assets to working directory
  - read_annotations tool for session annotation access
  - read_statuses tool for variation status queries
  - read_history tool for combined revision history (supports legacy format)
  - read_iteration_request tool for canvas-to-agent feedback loop
  - .mcp.json for Claude Code auto-discovery
affects: [04-canvas-iteration, 05-feedback-loop]

tech-stack:
  added: ["@modelcontextprotocol/sdk", "zod", "tsx"]
  patterns: ["MCP stdio transport", "pure function tool handlers with workingDir param for testability", "console.error-only logging in MCP context"]

key-files:
  created:
    - canvas/mcp/server.ts
    - canvas/mcp/types.ts
    - canvas/mcp/tsconfig.json
    - canvas/mcp/tools/push-asset.ts
    - canvas/mcp/tools/read-annotations.ts
    - canvas/mcp/tools/read-statuses.ts
    - canvas/mcp/tools/read-history.ts
    - canvas/mcp/tools/iterate.ts
    - canvas/mcp/__tests__/tools.test.ts
    - .mcp.json
  modified:
    - canvas/package.json
    - canvas/vitest.config.ts

key-decisions:
  - "Tool handlers are pure functions accepting workingDir parameter -- enables unit testing without MCP server"
  - "Zod v4 used for input schemas, confirmed compatible with MCP SDK v1.27"
  - "Vitest environmentMatchGlobs routes mcp tests to node environment (not jsdom)"

patterns-established:
  - "MCP tool pattern: export async function from tools/*.ts, register in server.ts with zod schema"
  - "No console.log in MCP server code -- stderr only via console.error"
  - "Lineage format detection: check for rounds[] (Phase 4) vs entries[] (Phase 2) key"

requirements-completed: [CANV-04]

duration: 5min
completed: 2026-03-11
---

# Phase 4 Plan 02: MCP Agent Tools Summary

**MCP stdio server with 5 tools (push_asset, read_annotations, read_statuses, read_history, read_iteration_request) enabling agent-to-canvas communication via @modelcontextprotocol/sdk**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-11T00:02:42Z
- **Completed:** 2026-03-11T00:08:25Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Standalone MCP stdio server registers 5 tools for agent-canvas interaction
- All tools use pure functions with workingDir parameter for testability
- 12 unit tests covering all tools including edge cases (missing files, legacy lineage format)
- .mcp.json at project root enables Claude Code auto-discovery

## Task Commits

Each task was committed atomically:

1. **Task 1: MCP server scaffold, types, and tool implementations** - `1fefc07` (feat)
2. **Task 2: MCP tool unit tests** - `fcf29dc` (test)

## Files Created/Modified
- `canvas/mcp/server.ts` - MCP stdio server entry point with 5 tool registrations
- `canvas/mcp/types.ts` - Annotation, lineage, and MCP-specific type definitions
- `canvas/mcp/tsconfig.json` - Separate TypeScript config for MCP server (ES2022, NodeNext)
- `canvas/mcp/tools/push-asset.ts` - Write HTML asset + update lineage.json
- `canvas/mcp/tools/read-annotations.ts` - Read annotations.json with empty defaults
- `canvas/mcp/tools/read-statuses.ts` - Extract variation status map
- `canvas/mcp/tools/read-history.ts` - Combined lineage + annotations, dual format support
- `canvas/mcp/tools/iterate.ts` - Read and consume iterate-request.json
- `canvas/mcp/__tests__/tools.test.ts` - 12 unit tests for all tool handlers
- `.mcp.json` - Claude Code MCP server auto-discovery config
- `canvas/package.json` - Added build:mcp and mcp:dev scripts, MCP SDK + zod deps
- `canvas/vitest.config.ts` - Added node environment for mcp test paths

## Decisions Made
- Tool handlers extracted as pure functions accepting `workingDir` parameter, making them unit-testable without spinning up the MCP server
- Zod v4 (installed as ^4.3.6) confirmed compatible with MCP SDK v1.27's zod-to-json-schema v3
- Vitest `environmentMatchGlobs` used to route mcp/**/*.test.ts to node environment while keeping jsdom for React component tests

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. The MCP server auto-registers via .mcp.json when Claude Code opens the project.

## Next Phase Readiness
- MCP server ready for Plans 03/04 (canvas UI can write iterate-request.json, agent reads via tool)
- Tools share .fluid/working/ directory with canvas filesystem watcher (Plan 01)
- All 5 tools match the CANV-04 requirement specification

---
*Phase: 04-canvas-iteration*
*Completed: 2026-03-11*
