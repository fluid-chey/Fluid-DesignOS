---
phase: 21-linkedin-and-one-pager-archetypes
plan: "02"
subsystem: archetypes
tags: [linkedin, archetypes, slot-schema, brand-neutral, layouts]
dependency_graph:
  requires: [21-01]
  provides: [linkedin-archetypes]
  affects: [api-pipeline-archetype-selection, editor-sidebar-slot-schema]
tech_stack:
  added: []
  patterns: [archetype-format-v1, linkedin-landscape-1200x627, slot-schema-sidecar]
key_files:
  created:
    - archetypes/hero-stat-li/index.html
    - archetypes/hero-stat-li/schema.json
    - archetypes/hero-stat-li/README.md
    - archetypes/data-dashboard-li/index.html
    - archetypes/data-dashboard-li/schema.json
    - archetypes/data-dashboard-li/README.md
    - archetypes/split-photo-text-li/index.html
    - archetypes/split-photo-text-li/schema.json
    - archetypes/split-photo-text-li/README.md
    - archetypes/minimal-statement-li/index.html
    - archetypes/minimal-statement-li/schema.json
    - archetypes/minimal-statement-li/README.md
    - archetypes/quote-testimonial-li/index.html
    - archetypes/quote-testimonial-li/schema.json
    - archetypes/quote-testimonial-li/README.md
    - archetypes/article-preview-li/index.html
    - archetypes/article-preview-li/schema.json
    - archetypes/article-preview-li/README.md
    - archetypes/company-overview-op/README.md
  modified: []
decisions:
  - "LinkedIn archetypes use vertical stat column (hero-stat-li) rather than horizontal row — 3 stats stack cleanly in the right 38% of the 1200px canvas"
  - "data-dashboard-li uses 4 equal columns spread across full 1200px width — natural landscape fit vs Instagram 2x2 grid"
  - "quote-testimonial-li portrait zone is 400px wide (1/3 of canvas) vs Instagram's small 100px circle avatar — leverages landscape height for editorial portrait treatment"
  - "article-preview-li is LinkedIn-only with no Instagram equivalent — editorial card pattern native to LinkedIn article sharing"
metrics:
  duration: 5min
  completed: "2026-03-24T19:42:43Z"
  tasks_completed: 2
  files_created: 19
---

# Phase 21 Plan 02: LinkedIn Archetypes Summary

6 LinkedIn archetypes (1200x627 landscape) — 5 adapted from Instagram originals, 1 LinkedIn-native editorial card — all passing validator with 0 errors.

## Tasks Completed

### Task 1: Build 6 LinkedIn archetypes (5 adapted + 1 original)

Created 18 files across 6 archetype directories:

| Archetype | Type | Key Layout |
|-----------|------|------------|
| `hero-stat-li` | Adapted | Headline + body copy left, 3-stat vertical column right |
| `data-dashboard-li` | Adapted | 4-stat horizontal row across full 1200px width |
| `split-photo-text-li` | Adapted | Photo left (560px), text right (640px) — landscape 50/50 |
| `minimal-statement-li` | Adapted | Centered bold statement with 120px side margins |
| `quote-testimonial-li` | Adapted | Portrait left (400px), quote + attribution right |
| `article-preview-li` | LinkedIn-only | Category label, title, excerpt, byline — editorial card |

All archetypes:
- Dimensions: 1200x627px (`width: 1200px; height: 627px` in body CSS)
- Schema: `"platform": "linkedin-landscape"`, `"width": 1200`, `"height": 627`, `"brush": null`
- Structure: `<div class="decorative-zone">` as first child of body
- Styling: `font-family: sans-serif`, `background: #111`, no brand fonts, no brand assets
- Image placeholders: 1x1 base64 PNG data URI in photo/portrait containers
- Validator: all 6 pass `node tools/validate-archetypes.cjs {slug}` with 0 errors

### Task 2: Update archetypes/README.md

The README.md already contained the LinkedIn archetype listing (added in Plan 01). All acceptance criteria were met:
- 6 LinkedIn archetype slugs present
- "LinkedIn" section heading present (`## LinkedIn Archetypes (1200 × 627)`)
- `1200 × 627` dimension reference present
- `validate-archetypes.cjs` reference present

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed missing README.md in company-overview-op**
- **Found during:** Task 1 (running `node tools/validate-archetypes.cjs all`)
- **Issue:** Pre-existing `company-overview-op` directory had `index.html` and `schema.json` but was missing its `README.md`, causing 3 MISSING_FILE errors and blocking the `all` validation from exiting 0
- **Fix:** Created `archetypes/company-overview-op/README.md` with full archetype documentation matching the existing index.html structure
- **Files modified:** `archetypes/company-overview-op/README.md` (created)
- **Commit:** a181722

**2. [Note] archetypes/README.md and api-pipeline.ts already updated**
- The Plan 01 README.md and api-pipeline.ts changes were committed as `a27f52f` (from a partial Plan 03 execution). Task 2's acceptance criteria were already satisfied when Task 1 was completed. No further README changes needed.

## Verification

```
Total: 19 archetypes, 0 errors, 0 warnings
Exit: 0
```

All 19 archetypes pass the validator: 10 Instagram + 6 LinkedIn + 3 One-Pager.

## Self-Check

Files verified present:
- archetypes/hero-stat-li/index.html ✓
- archetypes/data-dashboard-li/index.html ✓
- archetypes/split-photo-text-li/index.html ✓
- archetypes/minimal-statement-li/index.html ✓
- archetypes/quote-testimonial-li/index.html ✓
- archetypes/article-preview-li/index.html ✓
- archetypes/company-overview-op/README.md ✓
