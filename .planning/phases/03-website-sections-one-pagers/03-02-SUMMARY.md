---
phase: 03-website-sections-one-pagers
plan: 02
subsystem: agents
tags: [liquid, schema, gold-standard, mode-aware, hero-section, utility-classes, subagents]

# Dependency graph
requires:
  - phase: 03-website-sections-one-pagers
    provides: Gold Standard docs (schema-rules.md, template-patterns.md, button-system.md, theme-tokens.md, validation-checklist.md)
  - phase: 02-orchestrator-social-posts
    provides: 4 subagent contracts (copy, layout, styling, spec-check)
provides:
  - "Mode-aware subagents: copy, layout, styling, spec-check agents support social + section + one-pager modes"
  - "Gold Standard compliant hero.liquid: proof-of-concept section template with 3 text elements, 1 button, 5 section settings, 7 container settings"
  - "Validated schema pattern: 13 font sizes, 13 colors, 5 weights per text element, zero hard-coded values"
affects: [03-website-sections-one-pagers, section-templates, one-pager-templates, orchestrator]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mode-aware agent branching: orchestrator passes mode=social|section|one-pager, agents load different docs per mode"
    - "Gold Standard .liquid schema: Content -> Interactive -> Layout -> Container order, 6 settings per text element"
    - "Section wrapper pattern: utility classes from schema settings with | default: fallbacks"
    - "data-bg attribute for background images instead of inline styles"

key-files:
  created:
    - templates/sections/hero.liquid
  modified:
    - .claude/agents/copy-agent.md
    - .claude/agents/layout-agent.md
    - .claude/agents/styling-agent.md
    - .claude/agents/spec-check-agent.md

key-decisions:
  - "Hero section uses heading_font_size (not heading_font_size_mobile) for schema ID naming -- matches Gold Standard template-patterns.md convention"
  - "Button settings use show_button (not _show_button) for IDs -- required for schema-validation.cjs pattern matching"
  - "Section placed at templates/sections/ (not templates/gold-standard/) per plan spec and parallel to templates/social/"
  - "brand-compliance.cjs has pre-existing bug with website context (rules.colors.website undefined) -- logged as deferred item"

patterns-established:
  - "Mode branch pattern: ### Mode: social / ### Mode: section / ### Mode: one-pager sections in each agent"
  - "Gold Standard section template structure: annotations -> section wrapper -> container -> text elements -> button -> style include -> schema"

requirements-completed: [SITE-01, SITE-03, SITE-04, SITE-05, SITE-06, SITE-07, TMPL-04]

# Metrics
duration: 5min
completed: 2026-03-10
---

# Phase 3 Plan 02: Agent Mode Upgrades + Hero Section PoC Summary

**Mode-aware subagent upgrades (social/section/one-pager) and Gold Standard compliant hero.liquid with 3 text elements, full schema validation passing**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-10T22:30:14Z
- **Completed:** 2026-03-10T22:35:32Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Upgraded all 4 subagents (copy, layout, styling, spec-check) with mode=section and mode=one-pager branches, each loading 3-4 role-specific docs per mode
- Built hero.liquid as first Gold Standard compliant section template with 3 text elements (heading, subheading, body), each with exactly 6 settings
- Hero passes schema-validation.cjs with 0 errors: 13 font sizes, 13 colors, 5 weights, 7 button settings, 5 section settings, 7 container settings
- All social mode behavior preserved unchanged in agent files

## Task Commits

Each task was committed atomically:

1. **Task 1: Upgrade 4 subagents with mode-aware branching** - `6c5f726` (feat)
2. **Task 2 RED: Failing hero.liquid stub** - `fe54e7e` (test)
3. **Task 2 GREEN: Gold Standard compliant hero section** - `36fe0fd` (feat)

## Files Created/Modified
- `templates/sections/hero.liquid` - Gold Standard compliant hero section with 3 text elements, button, section/container settings, FIXED/FLEXIBLE/OPTIONAL annotations
- `.claude/agents/copy-agent.md` - Added Mode: section (structured .liquid slots, no accent color) and Mode: one-pager (zone-based content with accent color)
- `.claude/agents/layout-agent.md` - Added Mode: section (.liquid output with Gold Standard schema) and Mode: one-pager (@page letter-size HTML)
- `.claude/agents/styling-agent.md` - Added Mode: section (utility classes, no hard-coded values, btn system) and Mode: one-pager (inline brand assets)
- `.claude/agents/spec-check-agent.md` - Added Mode: section (schema-validation.cjs primary, validation-checklist.md holistic) and Mode: one-pager (letter-size dimension check)

## Decisions Made
- Hero section uses `heading_font_size` (not `heading_font_size_mobile`) for schema IDs to match Gold Standard convention and validation tool patterns
- Button settings use `show_button` (not `_show_button`) -- the scaffold tool generates underscore-prefixed IDs but the validation tool needs the standard names
- Hero section placed at `templates/sections/` to parallel `templates/social/` structure
- brand-compliance.cjs has pre-existing bug accessing `rules.colors.website.allowed_hex` which does not exist -- logged to deferred-items.md

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Scaffold tool output not directly usable**
- **Found during:** Task 2 (hero.liquid build)
- **Issue:** `tools/scaffold.cjs hero` generates to `templates/gold-standard/` with underscore-prefixed button IDs (`_show_button`) and only 2 text elements (heading, body). Missing subheading, wrong IDs, wrong location.
- **Fix:** Built hero.liquid from scratch at `templates/sections/hero.liquid` using Gold Standard docs as authoritative reference instead of scaffold output
- **Files modified:** templates/sections/hero.liquid
- **Verification:** schema-validation.cjs passes with 0 errors
- **Committed in:** 36fe0fd

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Used Gold Standard docs as source of truth instead of scaffold tool. No scope creep.

## Issues Encountered
- brand-compliance.cjs crashes with TypeError when running on .liquid files (pre-existing bug: `rules.colors.website` undefined in rules.json). Logged as deferred item -- does not block schema validation which is the primary check for sections.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Hero section template validates the Gold Standard schema pattern works
- All 4 agents ready to produce sections (mode=section) and one-pagers (mode=one-pager)
- Plan 03 can scale to 10+ section types using the proven hero template as reference
- brand-compliance.cjs needs a website context fix before it can validate section files (deferred item)

## Self-Check: PASSED

All 5 files verified present. All 3 commits verified in git log.

---
*Phase: 03-website-sections-one-pagers*
*Completed: 2026-03-10*
