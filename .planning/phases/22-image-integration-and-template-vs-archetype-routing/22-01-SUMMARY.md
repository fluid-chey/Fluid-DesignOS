---
phase: 22-image-integration-and-template-vs-archetype-routing
plan: 01
subsystem: database, api
tags: [sqlite, better-sqlite3, pipeline, archetypes, templates, routing]

# Dependency graph
requires:
  - phase: 21-linkedin-and-one-pager-archetypes
    provides: filterArchetypesByPlatform and archetype slug conventions used for platform filtering
  - phase: 13-dam-sync
    provides: getBrandAssets('images') for photo availability summary
  - phase: 15-brand-data-architecture
    provides: templates table and getTemplates API that this plan extends

provides:
  - Templates DB table with content_type and tags routing metadata columns (migration + seeder for all 8 templates)
  - getAgentTemplates() — lightweight template summaries for pipeline agents
  - AgentTemplateSummary interface in db-api.ts
  - buildPhotoAvailabilitySummary() — classifies archetypes as image-heavy or text-only based on schema.json fields
  - Extended buildCopyPrompt() with photoSummary and templateList params
  - Copy agent now receives photo availability context and template routing options at generation time

affects:
  - 22-02 (image slot wiring — depends on template routing metadata)
  - 22-03 (agent decision layer — uses the prompt signals built here)
  - api-pipeline (copy stage prompt now includes photo and template context)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ALTER TABLE migrations use try/catch for idempotent column additions"
    - "seedTemplateRoutingMetadata() called on server startup in watcher.ts after seedTemplatesIfEmpty()"
    - "buildPhotoAvailabilitySummary reads schema.json via fsSync.readFileSync to classify archetypes synchronously"
    - "buildTemplateListForCopy maps creationType to DB template type ('instagram'/'linkedin' -> 'social')"

key-files:
  created: []
  modified:
    - canvas/src/lib/db.ts
    - canvas/src/server/db-api.ts
    - canvas/src/server/api-pipeline.ts
    - canvas/src/server/watcher.ts

key-decisions:
  - "seedTemplateRoutingMetadata() called from watcher.ts startup (not from initSchema in db.ts) to avoid circular imports between db.ts and db-api.ts"
  - "buildPhotoAvailabilitySummary uses fsSync.readFileSync to match existing synchronous archetype scanning pattern"
  - "Template type column ('social'/'one-pager') maps from pipeline creationType; 'instagram' and 'linkedin' both map to 'social'"
  - "getAgentTemplates() filters by type column, not platform — matches existing template DB schema"
  - "Copy agent sees Template vs Archetype choice — prefer Archetype when uncertain (templates reserved for well-recognized repeatable formats)"

patterns-established:
  - "Photo summary pattern: count images, classify archetypes by schema.json image fields, inject before template list"
  - "Template routing pattern: format as bulleted list with content_type and tags for agent readability"

requirements-completed: [IMG-22-01, IMG-22-02, ROUTE-22-01, ROUTE-22-02]

# Metrics
duration: 12min
completed: 2026-03-24
---

# Phase 22 Plan 01: Image Integration and Template-vs-Archetype Routing Data Foundation Summary

**DB migration + seeder for template routing metadata (content_type/tags), getAgentTemplates() summary API, and extended copy prompt with photo availability and template routing signals**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-24T23:08:00Z
- **Completed:** 2026-03-24T23:20:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Templates table extended with content_type and tags columns (DB migration) and seeded with routing metadata for all 8 templates
- getAgentTemplates() returns lightweight AgentTemplateSummary objects for pipeline consumption without loading full SlotSchema
- buildPhotoAvailabilitySummary() reads brand image assets and classifies archetypes as image-heavy or text-only by parsing schema.json fields
- buildCopyPrompt() extended with photoSummary and templateList params — copy agent now makes informed template-vs-archetype routing decisions

## Task Commits

Each task was committed atomically:

1. **Task 1: DB migration + template routing metadata seeder + getAgentTemplates** - `0e52518` (feat)
2. **Task 2: Photo availability summary + copy prompt extension** - `59d0382` (feat)

## Files Created/Modified

- `canvas/src/lib/db.ts` - Added ALTER TABLE migrations for content_type and tags columns on templates table
- `canvas/src/server/db-api.ts` - Added AgentTemplateSummary interface, seedTemplateRoutingMetadata(), getAgentTemplates(); extended Template interface and rowToTemplate with new columns
- `canvas/src/server/api-pipeline.ts` - Added buildPhotoAvailabilitySummary(), buildTemplateListForCopy(), extended buildCopyPrompt() signature and body, updated call site in runApiPipeline()
- `canvas/src/server/watcher.ts` - Added seedTemplateRoutingMetadata import and startup call after seedTemplatesIfEmpty()

## Decisions Made

- seedTemplateRoutingMetadata() is called from watcher.ts startup rather than initSchema() to avoid circular dependency (db.ts cannot import db-api.ts)
- buildPhotoAvailabilitySummary uses synchronous fsSync.readFileSync matching existing pattern in scanArchetypes and attachSlotSchema
- creationType 'instagram' and 'linkedin' both map to 'social' template type in the DB (matching existing template schema)
- Copy agent prompt instructs: prefer Archetype when uncertain — templates reserved for well-recognized repeatable formats only

## Deviations from Plan

None - plan executed exactly as written. The db-api.ts changes (AgentTemplateSummary, seedTemplateRoutingMetadata, getAgentTemplates, Template interface) were already committed in HEAD from a prior agent partial run (commit 095dc91). db.ts migration and watcher.ts seed call were new additions.

## Issues Encountered

21 pre-existing test failures in brand-context.test.ts and AppShell tests exist before and after this plan — confirmed by stash/pop comparison. No regressions introduced.

## Next Phase Readiness

- Plan 02 can now wire DAM photos to image slots — template routing metadata is in DB and getAgentTemplates() is ready
- Plan 03 agent decision layer has the prompt signals it needs (photo summary + template list) injected into copy stage
- Copy agent will start producing "Template: {template-id}" or "Archetype: {slug}" outputs once pipeline runs with updated prompt

---
*Phase: 22-image-integration-and-template-vs-archetype-routing*
*Completed: 2026-03-24*
