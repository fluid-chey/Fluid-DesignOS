# Gold Standard Validation Checklist

**Source:** GOLD_STANDARD_WORKFLOW.md (Phase 4: Validation)
**Agent:** Spec-check agent
**Weight:** 100

---

## Pre-Commit Checklist (Weight: 100 -- Gold Standard)

Run through this checklist **before** considering the section complete:

---

### Schema Validation

- [ ] All text elements have 6 settings (family, size mobile, size desktop, weight, color, content)
- [ ] All font size selects have exactly 13 options
- [ ] All color selects have exactly 13 options
- [ ] All font weight selects have exactly 5 options (including "Light")
- [ ] All buttons have 7 settings (show, text, url, style, color, size, weight)
- [ ] Button style has 3 options (filled, outline, ghost)
- [ ] Button color has 10 options (primary through white)
- [ ] Button size has 5 options (btn-xs through btn-xl)
- [ ] Layout settings complete (5 settings: bg color, bg image, padding mobile/desktop, border radius)
- [ ] Container settings complete (7 settings: bg color, bg image, border radius, padding x/y mobile/desktop)
- [ ] Settings ordered: Content -> Interactive -> Layout -> Container
- [ ] Content + styling properly grouped (content field immediately followed by styling)

### Expected Option Counts (from rules.json)

| Setting Type | Count | Validation Command |
|-------------|-------|-------------------|
| Font sizes (mobile) | 13 | `text-xs` through `text-9xl` |
| Font sizes (desktop) | 13 | `lg:text-xs` through `lg:text-9xl` |
| Colors | 13 | `text-primary` through `text-inherit` |
| Font weights | 5 | `font-light` through `font-bold` |
| Font families | 4 | `font-primary`, `font-body`, `font-handwritten`, `font-serif` |
| Button styles | 3 | `filled`, `outline`, `ghost` |
| Button colors | 10 | `primary` through `error` |
| Button sizes | 5 | `btn-xs` through `btn-xl` |
| Section padding | 7 | `py-xs` through `py-3xl` |
| Section radius | 8 | `rounded-none` through `rounded-3xl` |
| Container padding | 7 | same as section padding |

---

### Template Validation

- [ ] All settings used in template exist in schema
- [ ] No hard-coded colors (no `#e6ea00`, use `var(--clr-secondary)`)
- [ ] No hard-coded border radius (no `13px`, use `var(--radius-lg)`)
- [ ] No hard-coded spacing (no `24px`, use `var(--space-lg)`)
- [ ] Buttons use `btn btn-{style}-{color}` class system
- [ ] All blocks include `{{ block.fluid_attributes }}`
- [ ] All images have placeholder fallbacks
- [ ] Background images use `data-bg` attribute
- [ ] Content properly centered where needed (`margin: 0 auto; text-align: center;`)
- [ ] Links that shouldn't wrap use `white-space: nowrap;`

---

### Default Values

- [ ] Section background: `bg-neutral` (not bg-white or bg-primary)
- [ ] Text color: `text-primary` (not text-black unless specific reason)
- [ ] Button size: `btn-md`
- [ ] Button font weight: `font-medium`
- [ ] Section padding: `py-xl` (mobile), `lg:py-3xl` (desktop)
- [ ] Heading: `text-3xl` (mobile), `lg:text-4xl` (desktop), `font-bold`
- [ ] Body: `text-base` (mobile), `lg:text-lg` (desktop), `font-normal`

---

### CSS Validation

- [ ] Smooth hover transitions (0.3s cubic-bezier)
- [ ] Proper focus states for accessibility
- [ ] Mobile-first responsive design
- [ ] Desktop variants use `lg:` prefix
- [ ] No unwanted shadows on images (`box-shadow: none !important;`)
- [ ] Section-scoped CSS uses CSS variables (var(--space-*), var(--clr-*))
- [ ] No hard-coded pixel values for spacing in styles.css

---

### Quality Checks

- [ ] Tested on mobile viewport
- [ ] Tested on desktop viewport
- [ ] All settings in customizer work as expected
- [ ] No console errors
- [ ] No linter errors
- [ ] Images load with proper fallbacks

---

## Automated Validation Commands

### Schema Validation
```bash
node tools/schema-validation.cjs <file.liquid>
```
Checks:
- Font size count (expects 13)
- Color count (expects 13)
- Weight count (expects 5)
- Button setting completeness
- Section settings completeness
- Container settings completeness

### Brand Compliance
```bash
node tools/brand-compliance.cjs <file>
```
Checks:
- No hard-coded hex colors
- Correct font families
- No hard-coded spacing values

### Full Suite
```bash
for f in templates/sections/*.liquid; do node tools/schema-validation.cjs "$f"; done
```

---

## Success Metrics (Weight: 100 -- Gold Standard)

A section is **Gold Standard compliant** when:

1. Passes 100% of validation checklist
2. User has complete control over all typography
3. User has complete control over all colors
4. User has complete control over all spacing
5. User has complete control over all layout
6. No hard-coded values anywhere
7. Consistent with all other Gold Standard sections
8. Professional, polished, accessible

---

## Common Failures

### Most Common: Incomplete Font Size Options
**Symptom:** `schema-validation.cjs` reports "Font sizes: 5/13 (missing 8)"
**Fix:** Always use the full list from `rules.json` `schema.font_size_options`. Never use a subset.

### Second Most Common: Wrong Color Names
**Symptom:** Schema uses `text-quaternary`, `text-neutral-light` instead of Gold Standard names
**Fix:** Use exactly the 13 semantic colors from `rules.json` `schema.color_options`:
`text-primary`, `text-secondary`, `text-tertiary`, `text-accent`, `text-accent-secondary`, `text-white`, `text-black`, `text-success`, `text-warning`, `text-error`, `text-info`, `text-muted`, `text-inherit`

### Third Most Common: Missing font-light Weight
**Symptom:** Only 4 font weight options (normal, medium, semibold, bold)
**Fix:** Always include `font-light` as the first option. Gold Standard requires exactly 5 weights.

### Fourth Most Common: Includes font-black Weight
**Symptom:** 6 font weight options including "Black"
**Fix:** Gold Standard specifies exactly 5 weights. Remove `font-black`. Maximum is `font-bold`.

### Fifth Most Common: Single Padding Setting
**Symptom:** One `section_padding` instead of `section_padding_y_mobile` + `section_padding_y_desktop`
**Fix:** Always use separate mobile and desktop padding settings. Same for container padding (4 separate settings: y_mobile, y_desktop, x_mobile, x_desktop).

---

## Critical Rules (Weight: 100 -- Gold Standard)

### NEVER:
1. Skip any of the 4 phases
2. Mark section "done" without validation checklist
3. Ship a section with incomplete option counts

### ALWAYS:
1. Run `node tools/schema-validation.cjs` before marking complete
2. Run `node tools/brand-compliance.cjs` before marking complete
3. Verify every checkbox in this checklist
4. Run validation checklist before marking "done"

---

## Cross-References

- [[schema-rules.md]] -- Schema planning rules (what to validate against)
- [[button-system.md]] -- Button validation specifics
- [[template-patterns.md]] -- Template implementation rules
- [[theme-tokens.md]] -- CSS variable and utility class reference
- [[EMPIRICAL-FINDINGS.md]] -- How schema renders into editor sidebar controls
- `tools/schema-validation.cjs` -- Automated schema validation
- `tools/brand-compliance.cjs` -- Automated brand compliance checks
- `tools/rules.json` -- Source of truth for option counts
