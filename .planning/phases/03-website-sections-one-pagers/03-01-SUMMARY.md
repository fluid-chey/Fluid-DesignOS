---
phase: 03-website-sections-one-pagers
plan: 01
subsystem: docs
tags: [gold-standard, liquid, schema, theme-tokens, utility-classes, rendering-pipeline]

# Dependency graph
requires:
  - phase: 01-brand-intelligence
    provides: brand docs, rules.json, pattern library
provides:
  - "EMPIRICAL-FINDINGS.md documenting Fluid theme rendering pipeline from source code"
  - "schema-rules.md for layout agent (schema planning, build order, 6-setting text rule)"
  - "button-system.md for styling agent (7-setting button rule, btn utility classes)"
  - "template-patterns.md for layout agent (section/container wrappers, block.fluid_attributes)"
  - "validation-checklist.md for spec-check agent (full Phase 4 Gold Standard checklist)"
  - "theme-tokens.md for styling agent (CSS variables, utility classes, no-hardcode rules)"
affects: [03-website-sections-one-pagers, agent-upgrades, scaffold-tool]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Gold Standard schema: 6 settings per text element (content, family, size-mobile, size-desktop, weight, color)"
    - "Gold Standard schema: 7 settings per button (show, text, url, style, color, size, weight)"
    - "Gold Standard schema order: Content -> Interactive -> Layout -> Container"
    - "Section file structure: index.liquid + styles.css + variables.json"
    - "Block identity: {{ block.fluid_attributes }} on every block element"

key-files:
  created:
    - docs/fluid-themes-gold-standard/EMPIRICAL-FINDINGS.md
    - docs/fluid-themes-gold-standard/schema-rules.md
    - docs/fluid-themes-gold-standard/button-system.md
    - docs/fluid-themes-gold-standard/template-patterns.md
    - docs/fluid-themes-gold-standard/validation-checklist.md
    - docs/fluid-themes-gold-standard/theme-tokens.md
  modified: []

key-decisions:
  - "Utility classes (text-xs through text-9xl, py-xs through py-3xl) are defined in frontend theme CSS, not backend SCSS -- confirmed by usage in existing sections"
  - "Section-css snippet resolves through DAM VirtualFileSystem, not filesystem -- database-stored Liquid template"
  - "Existing sections use font-black weight but Gold Standard limits to 5 weights (light through bold, no black)"
  - "Gold Standard color names differ from existing sections (text-accent vs text-quaternary, text-muted vs text-neutral-light)"

patterns-established:
  - "Role-mapped doc pattern: Source + Agent + Weight header on every Gold Standard decomposition file"
  - "Cross-reference pattern: wiki-link format [[filename.md]] at bottom of each doc"
  - "Weight annotation pattern: (Weight: 100 -- Gold Standard) inline with critical rules"

requirements-completed: [SITE-02]

# Metrics
duration: 8min
completed: 2026-03-10
---

# Phase 3 Plan 01: Gold Standard Research and Decomposition Summary

**Empirical investigation of Fluid theme rendering pipeline from Ruby source + decomposition of Gold Standard workflow into 6 role-mapped agent docs**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-10T22:18:58Z
- **Completed:** 2026-03-10T22:27:27Z
- **Tasks:** 2
- **Files created:** 6

## Accomplishments
- Traced the complete Fluid theme rendering pipeline from schema JSON through Liquid rendering to editor sidebar controls, documenting SchemaTag, Renderer, VirtualFileSystem, and block.fluid_attributes with exact file paths and line numbers
- Decomposed the 310-line Gold Standard Workflow document into 5 role-mapped files preserving exact original wording, with Weight: 100 annotations and cross-references
- Confirmed the gap between existing sections and Gold Standard: incomplete font sizes (5 vs 13), wrong color names, extra font-black weight, single padding settings instead of mobile/desktop pairs
- Documented 5 open questions for future investigation (utility class CSS source, section-css snippet content, CSS variable injection mechanism)

## Task Commits

Each task was committed atomically:

1. **Task 1: Empirical research of Fluid theme rendering pipeline** - `203a478` (feat)
2. **Task 2: Decompose Gold Standard workflow into role-mapped files** - `65ac077` (feat)

## Files Created
- `docs/fluid-themes-gold-standard/EMPIRICAL-FINDINGS.md` - Empirical research: 8 sections covering schema pipeline, template rendering, theme variables, block system, utility classes, section-css pattern, working section analysis, open questions
- `docs/fluid-themes-gold-standard/schema-rules.md` - Layout agent: schema planning checklist, build order, 6-setting text rule, section/container settings
- `docs/fluid-themes-gold-standard/button-system.md` - Styling agent: 7-setting button rule, implementation pattern, schema snippet, validation rules
- `docs/fluid-themes-gold-standard/template-patterns.md` - Layout agent: section/container wrapper pattern, text element pattern, block pattern, image placeholders, complete section template structure
- `docs/fluid-themes-gold-standard/validation-checklist.md` - Spec-check agent: full pre-commit checklist, automated validation commands, common failures, success metrics
- `docs/fluid-themes-gold-standard/theme-tokens.md` - Styling agent: CSS variables (colors, spacing, radius), all 13 font sizes, all 5 weights, all 13 colors, no-hardcode rules, layout utilities

## Decisions Made
- Utility classes (text-xs through text-9xl, py-xs through py-3xl) are confirmed available at runtime from frontend theme CSS, even though not defined in backend SCSS
- Section-css snippet resolves through DAM VirtualFileSystem (database-stored), not filesystem
- Gold Standard specifies exactly 5 font weights (no font-black) despite existing sections using 6
- Gold Standard color names (text-accent, text-muted, text-inherit) differ from existing section color names (text-quaternary, text-neutral-light, text-neutral-dark)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 6 Gold Standard docs ready for agent consumption in downstream plans
- Layout agent can load schema-rules.md + template-patterns.md for section generation
- Styling agent can load button-system.md + theme-tokens.md for styling decisions
- Spec-check agent can load validation-checklist.md for validation runs
- scaffold.cjs update can proceed now that research is complete
- Hero section proof-of-concept can begin with documented schema patterns

---
*Phase: 03-website-sections-one-pagers*
*Completed: 2026-03-10*
