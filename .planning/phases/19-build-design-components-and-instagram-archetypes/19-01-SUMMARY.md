---
phase: 19-build-design-components-and-instagram-archetypes
plan: "01"
subsystem: archetypes
tags: [validator, tooling, documentation, components]
dependency_graph:
  requires: []
  provides: [tools/validate-archetypes.cjs, archetypes/components/README.md, archetypes/README.md]
  affects: [phase-19-02]
tech_stack:
  added: []
  patterns: [dual-output-cli-validator, inline-html-css-component-library]
key_files:
  created:
    - tools/validate-archetypes.cjs
    - archetypes/components/README.md (expanded)
  modified:
    - archetypes/README.md
decisions:
  - "Validator exits 0 on empty archetypes/ — non-error state, not a missing-directory error"
  - "components/README.md is a single inline-pattern file, not a meta-doc — HTML/CSS copy-paste library for archetype authors"
  - "archetypes/README.md updated to list all 6 Phase 19 slugs and reference validate-archetypes.cjs"
metrics:
  duration: 3min
  completed: "2026-03-24"
  tasks_completed: 2
  files_changed: 3
---

# Phase 19 Plan 01: Archetype Validator and Component Library Summary

**One-liner:** CJS validator script with JSON stdout + human stderr output, plus a 503-line inline HTML/CSS component pattern library documenting 11 design components for the 6 Phase 19 Instagram archetypes.

## What Was Built

### Task 1: `tools/validate-archetypes.cjs`

Archetype CLI validator following the brand-compliance.cjs pattern (CJS, shebang, dual stdout/stderr, exit code control).

Checks per archetype:
1. All required files exist (`index.html`, `schema.json`, `README.md`)
2. `schema.json` parses as valid JSON
3. Top-level shape: `width` (number), `height` (number), `fields` (array)
4. Dimensions `1080 × 1080` (Instagram)
5. `brush` is `null` or absent
6. `brushAdditional` is `[]` or absent
7. No `templateId` field
8. Every field has valid `type` in `['text', 'image', 'divider']`
9. Text fields: `sel`, `label`, `mode` in `['text', 'pre', 'br']`
10. Image fields: `sel`, `label` required
11. Selector parity: every `field.sel` class appears in `index.html` via `extractClassName()`

Edge cases: no archetypes/ dir → exit 0, unknown slug → MISSING_DIR error, empty dir → exit 0.

Verified: `node tools/validate-archetypes.cjs` exits 0 with `[]` output. `node tools/validate-archetypes.cjs hero-stat` exits 1 with MISSING_DIR error. Existing `stat-hero-single` archetype passes with 0 errors.

### Task 2: Component Library and Archetype Overview

**`archetypes/components/README.md`** (503 lines): Copy-paste HTML/CSS pattern library documenting 11 design components:

| Component | Archetypes |
|-----------|-----------|
| stat-card | hero-stat, data-dashboard |
| image-block | photo-bg-overlay, split-photo-text, quote-testimonial |
| quote-block | quote-testimonial |
| headline-block | All 5 non-quote archetypes |
| subtext-block | hero-stat, photo-bg-overlay, minimal-statement |
| body-copy-block | split-photo-text |
| attribution-block | quote-testimonial, split-photo-text |
| portrait-block | quote-testimonial |
| footnote-block | data-dashboard |
| decorative-zone | All archetypes |
| divider | data-dashboard |

Each component documents: HTML snippet, CSS (positioned for 1080px canvas), and SlotSchema JSON field definition.

**`archetypes/README.md`**: Added Phase 19 archetype slug table (hero-stat, photo-bg-overlay, split-photo-text, quote-testimonial, minimal-statement, data-dashboard) and validation section.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

**Validator file:** Confirmed `tools/validate-archetypes.cjs` exists, runs, exits 0 on empty/passing state.

**Component README:** Confirmed 503 lines, contains stat-number, .photo img, .quote-text, .headline, decorative-zone, position: absolute.

**Archetype README:** Confirmed "hero-stat", "validate-archetypes.cjs", "brush: null" all present.

**Commits:**
- `14d7024` — feat(19-01): create archetype validator script
- `e7b11ba` — feat(19-01): create component library README and archetype system overview

## Self-Check: PASSED
