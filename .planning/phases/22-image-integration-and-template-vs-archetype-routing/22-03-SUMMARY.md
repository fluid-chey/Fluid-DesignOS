---
phase: 22-image-integration-and-template-vs-archetype-routing
plan: 03
subsystem: api
tags: [pipeline, template-routing, archetype-routing, image-upload, slot-schema, vitest]

# Dependency graph
requires:
  - phase: 22-01
    provides: getAgentTemplates, template routing metadata, copy prompt signals
  - phase: 22-02
    provides: getArchetypeImageSlotLabels, buildStylingPrompt image params, userImageUrl placeholder

provides:
  - Template-vs-archetype routing branch in runApiPipeline (isTemplatePath flag + branching if/else)
  - Template path: load HTML from disk, run layout, skip styling (emits skipped-template SSE), attach SlotSchema from TEMPLATE_SCHEMAS
  - Archetype path: unchanged copy->layout->styling->spec-check flow
  - Graceful fallback from template to archetype when template HTML file not on disk
  - Fix loop is template-aware: no styling re-run on template path
  - userImageUrl wired from POST /api/generate body through PipelineContext to buildStylingPrompt
  - PipelineContext.userImageUrl optional field
  - getTemplateSchema import added to api-pipeline.ts
  - Integration tests for routing signal detection (Template: vs Archetype: in copy.md)

affects:
  - api-pipeline.ts runApiPipeline (routing + styling skip + SlotSchema branching)
  - watcher.ts POST /api/generate (userImageUrl extraction)
  - api-pipeline.test.ts (6 new routing detection tests)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Template signal checked before archetype signal in copy.md parse — templates take precedence"
    - "Template path: emitStageStatus(res, ctx.creationId, 'styling', 'skipped-template') notifies client"
    - "Template SlotSchema from TEMPLATE_SCHEMAS[resolvedTemplateId] not archetype schema.json"
    - "Variables declared before routing branch (archetypeHtml, imageSlotLabels, stylingInjected) for fix loop scope access"
    - "userImageUrl: body.userImageUrl as string | undefined — raw extraction, no validation needed"

key-files:
  created: []
  modified:
    - canvas/src/server/api-pipeline.ts
    - canvas/src/server/watcher.ts
    - canvas/src/__tests__/api-pipeline.test.ts

key-decisions:
  - "isTemplatePath + resolvedTemplateId + templateHtml declared at runApiPipeline scope so fix loop can access without re-parsing copy.md"
  - "archetypeHtml, imageSlotLabels, stylingInjected also scoped at function level (initialized to undefined/empty) so fix loop cascade works for both paths"
  - "Template HTML path: templates/{social|one-pagers}/{id}.html — subdir derived from ctx.creationType"
  - "Fix loop template-aware: inputHtml/inputId conditional on isTemplatePath; styling re-run guarded by !isTemplatePath"
  - "getTemplateSchema imported from template-configs (not re-exported from db-api) — already existed there from Phase 07"

requirements-completed: [ROUTE-22-03, ROUTE-22-04, ROUTE-22-05, ROUTE-22-06, IMG-22-07]

# Metrics
duration: 3min
completed: 2026-03-24
---

# Phase 22 Plan 03: Template-vs-Archetype Routing Branch + userImageUrl Wiring Summary

**Template routing branch in runApiPipeline: Template: signal skips styling and attaches SlotSchema from TEMPLATE_SCHEMAS; Archetype: signal follows existing path; userImageUrl flows from POST /api/generate body to styling prompt**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-24T23:50:00Z
- **Completed:** 2026-03-24T23:53:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- runApiPipeline now has a clear if/else branch: `isTemplatePath` flag set from Template: signal in copy.md, with graceful fallback to archetype path when template HTML is missing on disk
- Template path: layout stage runs with template HTML, styling stage is skipped (SSE emits `skipped-template`), SlotSchema attached from `TEMPLATE_SCHEMAS[resolvedTemplateId]` via `getTemplateSchema()`
- Archetype path: unchanged from Phase 20 — copy->layout->styling->spec-check
- Fix loop is template-aware: no styling re-run on template path; layout re-run uses `inputHtml/inputId` conditionally
- `userImageUrl` extracted from POST `/api/generate` body in watcher.ts and passed through `PipelineContext` to `buildStylingPrompt` calls (replacing `undefined` placeholder from Plan 02)
- `PipelineContext.userImageUrl?: string` field added
- 6 new vitest tests added to api-pipeline.test.ts covering: Template: detection, Archetype: detection, template precedence, archetype fallback when no Template: line, userImageUrl optional field behavior

## Task Commits

Each task was committed atomically:

1. **Task 1: Template routing branch + skip-styling path + SlotSchema attachment** - `4c7ed78` (feat)
2. **Task 2: Wire userImageUrl from generate request + integration test** - `0ee055f` (feat)

## Files Created/Modified

- `canvas/src/server/api-pipeline.ts` — Added `getTemplateSchema` import, `userImageUrl?: string` to PipelineContext, routing detection block (templateMatch + isTemplatePath), branching if/else for template vs archetype pipeline stages, template-aware fix loop
- `canvas/src/server/watcher.ts` — Added `const userImageUrl = body.userImageUrl as string | undefined` and `userImageUrl` in PipelineContext construction
- `canvas/src/__tests__/api-pipeline.test.ts` — Added "Template vs Archetype routing" describe block with 6 tests

## Decisions Made

- `isTemplatePath`, `resolvedTemplateId`, `templateHtml`, `archetypeHtml`, `imageSlotLabels`, `stylingInjected` all declared at `runApiPipeline` function scope so the fix loop cascade can access them without re-parsing copy.md
- Template HTML subdir derived from `ctx.creationType`: `one-pager` maps to `one-pagers/`, everything else maps to `social/`
- `getTemplateSchema` imported from `../lib/template-configs` (not re-exported from db-api) — this function already existed from Phase 07 work

## Deviations from Plan

None — plan executed exactly as written. The `getTemplateSchema` function was already exported from `template-configs.ts` (verified during Task 1 read). No structural changes required beyond what was specified.

## Issues Encountered

Pre-existing test failures: 21 tests failing before changes, 21 failing after — no regressions. All failures are in brand-context.test.ts and AppShell component tests unrelated to this plan.

## Phase 22 Completion

This is the final plan in Phase 22. All three plans are complete:
- Plan 01: Template routing metadata in DB + copy prompt signals
- Plan 02: Image upload endpoint + styling prompt image awareness
- Plan 03: Pipeline routing branch + userImageUrl end-to-end wiring

---
*Phase: 22-image-integration-and-template-vs-archetype-routing*
*Completed: 2026-03-24*
