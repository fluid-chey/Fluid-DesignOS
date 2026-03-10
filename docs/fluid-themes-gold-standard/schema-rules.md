# Gold Standard Schema Rules

**Source:** GOLD_STANDARD_WORKFLOW.md
**Agent:** Layout agent
**Weight:** 100

---

## Schema Planning Checklist (Weight: 100 -- Gold Standard)

### Step 1: Analyze Requirements

- [ ] Review reference design (Image, Text, or Code)
- [ ] Identify all text elements (heading, subheading, body, captions, etc.)
- [ ] Identify all interactive elements (buttons, links, CTAs)
- [ ] Identify repeatable content (use blocks)
- [ ] List all customization needs (colors, spacing, layout)

### Step 2: Schema Planning Checklist

For **EVERY text element**, plan these settings:
- [ ] Content field (text, textarea, richtext)
- [ ] Font family (4 options: primary, body, handwritten, serif)
- [ ] Font size mobile (13 options: text-xs -> text-9xl)
- [ ] Font size desktop (13 options: lg:text-xs -> lg:text-9xl)
- [ ] Font weight (5 options: light, normal, medium, semibold, bold)
- [ ] Color (13 options: all semantic colors)

For **EVERY button**, plan these settings:
- [ ] Show toggle (checkbox)
- [ ] Text (text)
- [ ] URL (url)
- [ ] Style (filled, outline, ghost)
- [ ] Color (10 options: primary -> white)
- [ ] Size (5 options: btn-xs -> btn-xl)
- [ ] Font weight (5 options: light -> bold)

For **section**, plan these settings:
- [ ] Background color (13 options)
- [ ] Background image (image_picker)
- [ ] Padding Y mobile (7 options: py-xs -> py-3xl)
- [ ] Padding Y desktop (7 options: lg:py-xs -> lg:py-3xl)
- [ ] Border radius (8 options: rounded-none -> rounded-3xl)

For **container**, plan these settings:
- [ ] Background color (13 options + transparent)
- [ ] Background image (image_picker)
- [ ] Border radius (8 options)
- [ ] Padding Y mobile (7 options)
- [ ] Padding Y desktop (7 options)
- [ ] Padding X mobile (7 options)
- [ ] Padding X desktop (7 options)

---

## Schema Build Order (Weight: 100 -- Gold Standard)

**Order matters!** Build schema in this exact order:

```
1. Content Settings (with immediate styling)
   |-- Heading
   |   |-- heading (text)
   |   |-- heading_font_family (select - 4 options)
   |   |-- heading_font_size (select - 13 options)
   |   |-- heading_font_size_desktop (select - 13 options)
   |   |-- heading_font_weight (select - 5 options)
   |   |-- heading_color (select - 13 options)
   |-- Subheading (same 6 settings)
   |-- Body Text (same 6 settings)
   |-- Caption (same 6 settings)

2. Interactive Elements
   |-- Button
   |   |-- show_button (checkbox)
   |   |-- button_text (text)
   |   |-- button_url (url)
   |   |-- button_style (select - 3 options)
   |   |-- button_color (select - 10 options)
   |   |-- button_size (select - 5 options)
   |   |-- button_font_weight (select - 5 options)
   |-- Link (similar structure)

3. Layout Settings
   |-- background_color (select - 13 options)
   |-- background_image (image_picker)
   |-- section_padding_y_mobile (select - 7 options)
   |-- section_padding_y_desktop (select - 7 options)
   |-- section_border_radius (select - 8 options)

4. Container Settings
   |-- container_background_color (select - 13 + transparent)
   |-- container_background_image (image_picker)
   |-- container_border_radius (select - 8 options)
   |-- container_padding_y_mobile (select - 7 options)
   |-- container_padding_y_desktop (select - 7 options)
   |-- container_padding_x_mobile (select - 7 options)
   |-- container_padding_x_desktop (select - 7 options)
```

**Content + styling must be grouped:** Each content field is immediately followed by its styling settings (font family, size, weight, color). Do NOT separate content from its styling.

---

## Text Element 6-Setting Rule (Weight: 100 -- Gold Standard)

Every text element requires exactly 6 settings:

1. **Content** -- the text value (`type: "text"`, `"textarea"`, or `"richtext"`)
2. **Font family** -- 4 options: `font-primary`, `font-body`, `font-handwritten`, `font-serif`
3. **Font size (mobile)** -- 13 options: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`, `text-5xl`, `text-6xl`, `text-7xl`, `text-8xl`, `text-9xl`
4. **Font size (desktop)** -- 13 options: `lg:text-xs`, `lg:text-sm`, `lg:text-base`, `lg:text-lg`, `lg:text-xl`, `lg:text-2xl`, `lg:text-3xl`, `lg:text-4xl`, `lg:text-5xl`, `lg:text-6xl`, `lg:text-7xl`, `lg:text-8xl`, `lg:text-9xl`
5. **Font weight** -- 5 options: `font-light`, `font-normal`, `font-medium`, `font-semibold`, `font-bold`
6. **Color** -- 13 options: `text-primary`, `text-secondary`, `text-tertiary`, `text-accent`, `text-accent-secondary`, `text-white`, `text-black`, `text-success`, `text-warning`, `text-error`, `text-info`, `text-muted`, `text-inherit`

### Option Counts (from rules.json)

| Setting | Count | Values |
|---------|-------|--------|
| Font family | 4 | primary, body, handwritten, serif |
| Font size (mobile) | 13 | text-xs through text-9xl |
| Font size (desktop) | 13 | lg:text-xs through lg:text-9xl |
| Font weight | 5 | light, normal, medium, semibold, bold |
| Color | 13 | primary, secondary, tertiary, accent, accent-secondary, white, black, success, warning, error, info, muted, inherit |

---

## Section Settings (Weight: 100 -- Gold Standard)

5 required settings for every section:

| Setting | Type | Options |
|---------|------|---------|
| `background_color` | select | 13 bg-* semantic colors |
| `background_image` | image_picker | -- |
| `section_padding_y_mobile` | select | 7: py-xs, py-sm, py-md, py-lg, py-xl, py-2xl, py-3xl |
| `section_padding_y_desktop` | select | 7: lg:py-xs through lg:py-3xl |
| `section_border_radius` | select | 8: rounded-none, rounded-sm, rounded, rounded-md, rounded-lg, rounded-xl, rounded-2xl, rounded-3xl |

---

## Container Settings (Weight: 100 -- Gold Standard)

7 required settings for every container:

| Setting | Type | Options |
|---------|------|---------|
| `container_background_color` | select | 13 bg-* colors + bg-transparent |
| `container_background_image` | image_picker | -- |
| `container_border_radius` | select | 8 rounded-* options |
| `container_padding_y_mobile` | select | 7 py-* options |
| `container_padding_y_desktop` | select | 7 lg:py-* options |
| `container_padding_x_mobile` | select | 7 px-* options |
| `container_padding_x_desktop` | select | 7 lg:px-* options |

---

## Empirical Context

From `EMPIRICAL-FINDINGS.md`:

- **Schema is metadata only:** The `{% schema %}` block renders as empty string `""`. It is parsed as JSON by `SchemaTag` and consumed by the backend for default value application and by the frontend editor for sidebar control rendering.
- **Defaults are applied by the backend:** `ApplicationThemeTemplate` processes schema settings and applies `"default"` values when section settings are `nil`.
- **Block defaults from presets:** When a section has no blocks, they are initialized from `template.schema.dig("presets", 0, "blocks")`.
- **Settings order affects editor sidebar:** Settings appear in the editor sidebar in the order they are defined in the schema JSON. This is why the Content -> Interactive -> Layout -> Container order matters.

---

## Critical Rules (Weight: 100 -- Gold Standard)

### NEVER:
1. Write schema without planning first
2. Use partial font size lists (only 5 or 8 options)
3. Omit desktop font sizes
4. Omit font family selects
5. Use incomplete color lists (only 3-5 options)
6. Skip container settings section

### ALWAYS:
1. Start with Phase 1 (Planning)
2. Include all 13 font sizes for mobile AND desktop
3. Include all 13 semantic colors
4. Include all 5 font weights (including Light)
5. Include complete layout settings (5 settings)
6. Include complete container settings (7 settings)

---

## Cross-References

- [[template-patterns.md]] -- How to use schema settings in Liquid templates
- [[button-system.md]] -- Button schema (7 settings per button)
- [[validation-checklist.md]] -- How to validate schema completeness
- [[theme-tokens.md]] -- CSS variable and utility class reference
- [[EMPIRICAL-FINDINGS.md]] -- How schema renders into editor sidebar controls
- `tools/rules.json` -- Compiled option counts and values
- `tools/schema-validation.cjs` -- Automated schema validation tool
- `tools/scaffold.cjs` -- Gold Standard .liquid skeleton generator
