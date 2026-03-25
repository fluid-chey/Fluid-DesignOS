---
phase: 19-build-design-components-and-instagram-archetypes
plan: "02"
subsystem: archetypes
tags: [archetypes, instagram, slot-schema, html, wireframes]
dependency_graph:
  requires: [19-01]
  provides: [archetypes/hero-stat, archetypes/photo-bg-overlay, archetypes/split-photo-text, archetypes/quote-testimonial, archetypes/minimal-statement, archetypes/data-dashboard]
  affects: [phase-20-pipeline-integration]
tech_stack:
  added: []
  patterns: [brandless-html-skeleton, slot-schema-sidecar, css-absolute-positioning-1080px-canvas]
key_files:
  created:
    - archetypes/hero-stat/index.html
    - archetypes/hero-stat/schema.json
    - archetypes/hero-stat/README.md
    - archetypes/photo-bg-overlay/index.html
    - archetypes/photo-bg-overlay/schema.json
    - archetypes/photo-bg-overlay/README.md
    - archetypes/split-photo-text/index.html
    - archetypes/split-photo-text/schema.json
    - archetypes/split-photo-text/README.md
    - archetypes/quote-testimonial/index.html
    - archetypes/quote-testimonial/schema.json
    - archetypes/quote-testimonial/README.md
    - archetypes/minimal-statement/index.html
    - archetypes/minimal-statement/schema.json
    - archetypes/minimal-statement/README.md
    - archetypes/data-dashboard/index.html
    - archetypes/data-dashboard/schema.json
    - archetypes/data-dashboard/README.md
  modified: []
decisions:
  - "split-photo-text text slots (headline, body-copy, attribution) flow inside a flex container rather than using absolute positioning — preserves vertical centering without fixed top values"
  - "data-dashboard uses CSS grid for the 3-stat layout rather than absolute-positioned individual stats — ensures equal column widths without manual math"
  - "divider type field in data-dashboard schema uses label --- to match the plan spec exactly"
metrics:
  duration: 3min
  completed: "2026-03-24"
  tasks_completed: 2
  files_changed: 18
---

# Phase 19 Plan 02: Instagram Archetypes Summary

**One-liner:** Six brandless Instagram archetype skeletons (1080x1080) — stat, photo-overlay, split-layout, testimonial, minimal, and dashboard — each with renderable HTML, SlotSchema JSON, and README documentation, all passing the archetype validator.

## What Was Built

### Task 1: hero-stat, photo-bg-overlay, split-photo-text

**`archetypes/hero-stat/`** — Giant stat number anchors the layout.
- `index.html`: 260px stat number at top 190px, uppercase label, 82px headline in middle zone, muted subtext pinned to bottom
- `schema.json`: 4 text fields — stat-number (text, 1 row), stat-label (text, 2 rows), headline (pre, 3 rows), subtext (pre, 4 rows)
- All slots use position absolute within the 1080px body canvas

**`archetypes/photo-bg-overlay/`** — Full-bleed photo with gradient scrim and text overlay.
- `index.html`: `.photo` div with full-bleed `<img>`, bottom-to-top gradient overlay, headline at bottom 280px, subtext at bottom 180px, vertical category label upper-right
- `schema.json`: 1 image field (.photo img) + 3 text fields — headline, subtext, category span

**`archetypes/split-photo-text/`** — 50/50 editorial split layout.
- `index.html`: `.photo` div (absolute, left 0, 540x1080px) + `.text-panel` div (absolute, right 0, 540x1080px, flex column centered, 60px padding)
- headline, body-copy, attribution flow inside the flex container (no absolute positioning within panel)
- `schema.json`: 1 image field (.photo img) + 3 text fields

### Task 2: quote-testimonial, minimal-statement, data-dashboard

**`archetypes/quote-testimonial/`** — Pull quote with circular portrait and attribution.
- `index.html`: 200x200px circular portrait (top 120px), 48px italic quote text (top 380px, 800px wide), bold name at bottom 200px, muted title at bottom 160px, vertical category label
- `schema.json`: 4 text fields + 1 image field (.portrait img)

**`archetypes/minimal-statement/`** — Maximum whitespace, single bold statement.
- `index.html`: 96px headline at `top: 50%; transform: translateY(-60%)` — slightly above center; 24px muted subtext at bottom 120px
- `schema.json`: exactly 2 fields — headline (pre, 3 rows), subtext (pre, 3 rows)

**`archetypes/data-dashboard/`** — 3-stat grid with headline and footnote.
- `index.html`: 48px headline, CSS grid with 3 equal columns (stat-1, stat-2, stat-3 — each with num + label divs), 2px divider rule, 18px footnote
- Each stat number: 120px at 0.85 line-height; each label: 22px muted
- `schema.json`: 9 fields — headline, 3x (stat-N-num + stat-N-label), divider separator, footnote

### Validation Results

```
data-dashboard: 0 errors, 0 warnings
hero-stat: 0 errors, 0 warnings
minimal-statement: 0 errors, 0 warnings
photo-bg-overlay: 0 errors, 0 warnings
quote-testimonial: 0 errors, 0 warnings
split-photo-text: 0 errors, 0 warnings
stat-hero-single: 0 errors, 0 warnings (existing PoC)

Total: 7 archetypes, 0 errors, 0 warnings
```

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

**Created files exist:**
- archetypes/hero-stat/{index.html, schema.json, README.md} — FOUND
- archetypes/photo-bg-overlay/{index.html, schema.json, README.md} — FOUND
- archetypes/split-photo-text/{index.html, schema.json, README.md} — FOUND
- archetypes/quote-testimonial/{index.html, schema.json, README.md} — FOUND
- archetypes/minimal-statement/{index.html, schema.json, README.md} — FOUND
- archetypes/data-dashboard/{index.html, schema.json, README.md} — FOUND

**Commits exist:**
- `8711da9` — feat(19-02): create hero-stat, photo-bg-overlay, split-photo-text archetypes
- `24728ca` — feat(19-02): create quote-testimonial, minimal-statement, data-dashboard archetypes

**Validator:** `node tools/validate-archetypes.cjs` exits 0, 0 errors across all 7 archetypes.

## Self-Check: PASSED
