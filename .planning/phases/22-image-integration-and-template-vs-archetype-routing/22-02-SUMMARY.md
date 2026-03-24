---
phase: 22-image-integration-and-template-vs-archetype-routing
plan: 02
subsystem: api
tags: [brand-assets, image-upload, styling-agent, archetype, pipeline]

# Dependency graph
requires:
  - phase: 21-linkedin-and-one-pager-archetypes
    provides: Archetype schemas with image field types that getArchetypeImageSlotLabels reads
  - phase: 19-build-design-components-and-instagram-archetypes
    provides: schema.json format with fields[] array used for image slot detection
  - phase: 13-dam-sync
    provides: brand_assets DB table with source/category fields that insertUploadedAsset extends
provides:
  - POST /api/uploads/chat-image endpoint that persists chat sidebar image uploads permanently
  - insertUploadedAsset() function for source='upload' brand asset creation
  - promoteUploadToLibrary() function for moving one-off uploads to curated library
  - getArchetypeImageSlotLabels() that reads image field labels from archetype schema.json
  - Extended buildStylingPrompt() with imageSlotLabels and userImageUrl params
  - Image Slots to Fill section in styling prompt with photo selection and branded placeholder fallback
affects:
  - 22-03 (Phase 22 Plan 03 will wire userImageUrl from generate request body)
  - styling agent output quality for archetypes with image slots

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Raw binary upload pattern: accept application/octet-stream with metadata in headers (x-filename, content-type)"
    - "source='upload' brand asset pattern: permanent storage distinct from 'local' and 'dam' sources"
    - "Image slot detection: read archetype schema.json synchronously, filter fields by type='image'"

key-files:
  created: []
  modified:
    - canvas/src/server/db-api.ts
    - canvas/src/server/watcher.ts
    - canvas/src/server/api-pipeline.ts

key-decisions:
  - "Chat image uploads use raw binary (application/octet-stream) not multipart — simpler for frontend"
  - "Uploads stored as assets/uploads/{storedName} with source='upload' in brand_assets — permanent, never auto-deleted"
  - "Image slot labels extracted from schema.json fields[] at pipeline runtime (not cached) — always reflects current archetype"
  - "userImageUrl placeholder as undefined for now — Phase 22 Plan 03 wires it from generate request body"
  - "Branded placeholder gradient uses {accent-color}22 (8% opacity) for dark-on-black readability"

patterns-established:
  - "getArchetypeImageSlotLabels: synchronous fsSync.readFileSync for schema reads in prompt builder path"
  - "insertUploadedAsset: category always 'images', source always 'upload', permanent file path in assets/uploads/"

requirements-completed:
  - IMG-22-03
  - IMG-22-04
  - IMG-22-05
  - IMG-22-06

# Metrics
duration: 12min
completed: 2026-03-24
---

# Phase 22 Plan 02: Image Upload Endpoint + Styling Prompt Image Awareness Summary

**POST /api/uploads/chat-image persists binary uploads to assets/uploads/ and brand_assets DB; buildStylingPrompt extended with image slot detection from archetype schema.json and branded placeholder fallback.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-24T19:55:00Z
- **Completed:** 2026-03-24T20:07:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Image upload endpoint accepts raw binary data via POST /api/uploads/chat-image with content-type and x-filename headers; stores permanently to assets/uploads/ and brand_assets DB with source='upload'
- insertUploadedAsset() and promoteUploadToLibrary() added to db-api.ts — one-off upload vs curated library distinction
- buildStylingPrompt() extended with imageSlotLabels and userImageUrl params; adds Image Slots to Fill section when archetype has image fields; instructs agent to select from DAM or generate branded placeholder gradient
- getArchetypeImageSlotLabels() reads archetype schema.json at pipeline runtime to detect image fields
- Fix loop re-run call updated to pass same imageSlotLabels and userImageUrl context

## Task Commits

Each task was committed atomically:

1. **Task 1: Image upload endpoint + persistent storage** - `095dc91` (feat)
2. **Task 2: Image slot detection + styling prompt extension** - `7871b75` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified
- `canvas/src/server/db-api.ts` - Added insertUploadedAsset() and promoteUploadToLibrary()
- `canvas/src/server/watcher.ts` - Added POST /api/uploads/chat-image endpoint and insertUploadedAsset import
- `canvas/src/server/api-pipeline.ts` - Added fsSync import, getArchetypeImageSlotLabels(), extended buildStylingPrompt() signature, wired image slot detection in runApiPipeline()

## Decisions Made
- Chat image uploads use raw binary (not multipart) — simpler for frontend to send as application/octet-stream with metadata in headers
- source='upload' in brand_assets keeps one-off uploads distinct from curated 'local' and synced 'dam' assets
- Uploads persist permanently in assets/uploads/ — creation links never break even if user never promotes to library
- userImageUrl is undefined placeholder for now — Phase 22 Plan 03 will wire it from generate request body

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing test failures: 21 tests failing before changes, 21 failing after — no regressions introduced. Failures are in brand-context.test.ts and AppShell component tests unrelated to this plan's scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Upload endpoint ready for frontend chat sidebar integration (Plan 03)
- Image slot directives active in styling agent — archetypes with image fields now receive photo selection instructions
- userImageUrl wiring from generate request body is the remaining piece for Plan 03

---
*Phase: 22-image-integration-and-template-vs-archetype-routing*
*Completed: 2026-03-24*
