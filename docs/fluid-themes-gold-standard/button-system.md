# Gold Standard Button System

**Source:** GOLD_STANDARD_WORKFLOW.md
**Agent:** Styling agent
**Weight:** 100

---

## Button 7-Setting Rule (Weight: 100 -- Gold Standard)

Every button requires exactly 7 settings:

| # | Setting | Type | ID Pattern | Options |
|---|---------|------|------------|---------|
| 1 | Show toggle | checkbox | `show_button` | true/false |
| 2 | Text | text | `button_text` | free text, default: "Click Here" |
| 3 | URL | url | `button_url` | URL, default: "#" |
| 4 | Style | select | `button_style` | 3 options: filled, outline, ghost |
| 5 | Color | select | `button_color` | 10 options (see below) |
| 6 | Size | select | `button_size` | 5 options: btn-xs, btn-sm, btn-md, btn-lg, btn-xl |
| 7 | Font weight | select | `button_font_weight` | 5 options: font-light, font-normal, font-medium, font-semibold, font-bold |

### Button Color Options (10)

From `tools/rules.json` `schema.button_color_count: 10`:
- primary
- secondary
- tertiary
- accent
- accent-secondary
- white
- black
- success
- warning
- error

### Button Style Options (3)

From `tools/rules.json` `schema.button_style_options`:
- `filled` -- solid background with button color
- `outline` -- transparent background with colored border
- `ghost` -- transparent background, no border, colored text

### Button Size Options (5)

From `tools/rules.json` `schema.button_size_options`:
- `btn-xs`
- `btn-sm`
- `btn-md` (default)
- `btn-lg`
- `btn-xl`

---

## Button Implementation Pattern (Weight: 100 -- Gold Standard)

**CRITICAL:** Always use the button utility class system:

```liquid
{% if section.settings.show_button %}
<a href="{{ section.settings.button_url | default: '#' }}"
   class="btn btn-{{ section.settings.button_style | default: 'filled' }}-{{ section.settings.button_color | default: 'primary' }} {{ section.settings.button_size | default: 'btn-md' }} {{ section.settings.button_font_weight | default: 'font-medium' }} {{ settings.button_border_radius | default: 'rounded' }}">
  {{ section.settings.button_text | default: 'Click Here' }}
</a>
{% endif %}
```

### Class Pattern Breakdown

The button class string follows this structure:
```
btn btn-{style}-{color} {size} {weight} {border-radius}
```

Example rendered output:
```html
<a class="btn btn-filled-primary btn-md font-medium rounded">Click Here</a>
```

---

## NEVER Custom Button Styles (Weight: 100 -- Gold Standard)

**NEVER:**
```liquid
<!-- DON'T DO THIS -->
<a class="bg-primary text-secondary" style="padding: 18px; border-radius: 13px;">
```

**ALWAYS:**
```liquid
<!-- DO THIS -->
<a class="btn btn-filled-primary btn-md font-medium rounded">
```

Hard-coded button styles bypass the theme system entirely. The `btn btn-{style}-{color}` class system ensures:
- Consistent hover/focus transitions
- Proper disabled states
- Theme-aware color resolution via CSS custom properties
- Responsive sizing

---

## Button Schema Snippet (Weight: 100 -- Gold Standard)

Complete schema JSON for a button (copy-paste ready):

```json
{
  "type": "header",
  "content": "Button Settings"
},
{
  "type": "checkbox",
  "id": "show_button",
  "label": "Show Button",
  "default": true
},
{
  "type": "text",
  "id": "button_text",
  "label": "Button Text",
  "default": "Click Here"
},
{
  "type": "url",
  "id": "button_url",
  "label": "Button URL",
  "default": "#"
},
{
  "type": "select",
  "id": "button_style",
  "label": "Button Style",
  "options": [
    { "value": "filled", "label": "Filled" },
    { "value": "outline", "label": "Outline" },
    { "value": "ghost", "label": "Ghost" }
  ],
  "default": "filled"
},
{
  "type": "select",
  "id": "button_color",
  "label": "Button Color",
  "options": [
    { "value": "primary", "label": "Primary" },
    { "value": "secondary", "label": "Secondary" },
    { "value": "tertiary", "label": "Tertiary" },
    { "value": "accent", "label": "Accent" },
    { "value": "accent-secondary", "label": "Accent Secondary" },
    { "value": "white", "label": "White" },
    { "value": "black", "label": "Black" },
    { "value": "success", "label": "Success" },
    { "value": "warning", "label": "Warning" },
    { "value": "error", "label": "Error" }
  ],
  "default": "primary"
},
{
  "type": "select",
  "id": "button_size",
  "label": "Button Size",
  "options": [
    { "value": "btn-xs", "label": "XS" },
    { "value": "btn-sm", "label": "SM" },
    { "value": "btn-md", "label": "MD" },
    { "value": "btn-lg", "label": "LG" },
    { "value": "btn-xl", "label": "XL" }
  ],
  "default": "btn-md"
},
{
  "type": "select",
  "id": "button_font_weight",
  "label": "Button Font Weight",
  "options": [
    { "value": "font-light", "label": "Light" },
    { "value": "font-normal", "label": "Normal" },
    { "value": "font-medium", "label": "Medium" },
    { "value": "font-semibold", "label": "Semibold" },
    { "value": "font-bold", "label": "Bold" }
  ],
  "default": "font-medium"
}
```

---

## Validation Rules (Weight: 100 -- Gold Standard)

From Phase 4 (Validation) of GOLD_STANDARD_WORKFLOW.md:

- [ ] All buttons have 7 settings (show, text, url, style, color, size, weight)
- [ ] Button style has 3 options (filled, outline, ghost)
- [ ] Button color has 10 options (primary through error)
- [ ] Button size has 5 options (btn-xs through btn-xl)
- [ ] Buttons use `btn btn-{style}-{color}` class system
- [ ] No custom button styles anywhere

---

## Empirical Context

From `EMPIRICAL-FINDINGS.md`:

The existing backend SCSS defines button classes with a different naming pattern:
- Base: `btn-bg-{color}` (e.g., `btn-bg-primary`, `btn-bg-white`)
- Outline: `btn-border-{color}` (e.g., `btn-border-black`, `btn-border-primary`)
- Link: `btn-link`

The Gold Standard specifies `btn-{style}-{color}` (e.g., `btn-filled-primary`, `btn-outline-primary`). Existing sections like `cta_simple` use the Gold Standard pattern in templates, confirming it is available at runtime through the frontend theme CSS.

---

## Cross-References

- [[schema-rules.md]] -- Where buttons fit in the schema order (Interactive Elements section)
- [[template-patterns.md]] -- How to implement buttons in Liquid templates
- [[validation-checklist.md]] -- Full validation checklist including button checks
- [[theme-tokens.md]] -- CSS variable patterns for button colors
- `tools/rules.json` -- Button option counts and values (`schema.button_settings`, `schema.button_style_options`, `schema.button_size_options`)
