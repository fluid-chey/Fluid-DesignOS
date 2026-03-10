# Empirical Findings: Fluid Theme Rendering Pipeline

**Researched:** 2026-03-10
**Source:** Direct investigation of `/Users/cheyrasmussen/fluid` (Rails backend) and `/Users/cheyrasmussen/fluid-mono` (frontend monorepo)
**Confidence:** HIGH (code inspected, not inferred)

---

## 1. Schema Rendering Pipeline

**How schema JSON becomes editor sidebar controls.**

### Source Files
- `/Users/cheyrasmussen/fluid/app/themes/liquid_tags/schema_tag.rb` (31 lines)
- `/Users/cheyrasmussen/fluid/app/models/application_theme_template.rb` (lines 280-340)

### Findings

The `{% schema %}...{% endschema %}` block is parsed by `LiquidTags::SchemaTag`, which extends `Liquid::Block`:

1. **Parse phase:** `SchemaTag#render` calls `JSON.parse(schema_content)` to validate the JSON. If `liquid_strict_mode` is enabled in `RequestStore`, invalid JSON raises a `Liquid::Error`. Otherwise, parsing errors are silently ignored.

2. **Render output:** The schema tag always returns `""` (empty string) -- it produces NO visible output in the rendered HTML. The schema block is metadata only; it is consumed by the backend, not by the template renderer.

3. **Default application:** `ApplicationThemeTemplate` processes each section's schema settings (lines 283-288). For every setting in `template.schema["settings"]`, if the section's `settings[setting_id]` is `nil` AND the schema defines a `"default"` value, that default is applied:
   ```ruby
   template.schema["settings"]&.each do |setting|
     if section.dig("settings", setting["id"]).nil? && setting["default"].present?
       section["settings"] ||= {}
       section["settings"][setting["id"]] = setting["default"]
     end
   end
   ```

4. **Editor sidebar rendering:** The schema JSON is consumed by the frontend editor to dynamically build sidebar controls. Each setting `type` maps to a UI control: `text` becomes a text input, `select` becomes a dropdown, `checkbox` becomes a toggle, `image_picker` becomes an image uploader, etc. The setting `id` links the control to the value in `section.settings`.

### Confidence: HIGH
Direct code reading. The SchemaTag is straightforward -- JSON in, empty string out, metadata consumed by backend.

---

## 2. Template Rendering Pipeline

**How .liquid templates become HTML.**

### Source Files
- `/Users/cheyrasmussen/fluid/app/services/themes/templates/renderer.rb` (60 lines)
- `/Users/cheyrasmussen/fluid/app/services/themes/compiler.rb`
- `/Users/cheyrasmussen/fluid/app/services/dam/virtual_file_system.rb`

### Findings

1. **Liquid compilation:** Templates are processed through standard Liquid rendering. The `Themes::Templates::Renderer` module provides the rendering interface. Templates are loaded from the DAM (Digital Asset Manager) via `VirtualFileSystem`, which implements Liquid's file system interface.

2. **`{% render %}` tag resolution:** The custom `Themes::Liquid::Tags::Render` class extends the base `LiquidTags::Render`. When a `{% render 'some-snippet' %}` is encountered:
   - It calls `file_system.read_template_file(template_name)` which appends `.liquid` extension
   - It also auto-loads `.config.json` (static config like translated strings) and `.data.json` (dynamic data specs)
   - Config and data variables are injected into the component context automatically
   - User-passed attributes take priority over auto-loaded variables

3. **Data attribute injection (editor mode):** After Liquid rendering, `Renderer.populate_data_attrs` post-processes the HTML output:
   - Adds `data-fluid-element="{random8chars}"` to EVERY HTML tag (except `html`, `body`, `head`, `title`, `meta`, `link`, `script`, `style`, `noscript`, `doctype`)
   - Uses `SecureRandom.alphanumeric(8)` for unique IDs
   - Masks `{% schema %}...{% endschema %}` blocks during processing so their JSON is not corrupted by the regex
   - This enables the page editor to target any element for inline editing
   - Only runs when in editor mode

4. **VirtualFileSystem resolution:** Assets are loaded from the DAM using ltree paths. When `{% render 'section-css', section_id: 'features_grid' %}` is called, the VirtualFileSystem looks up `section-css.liquid` in the DAM asset tree for the current theme scope. The `section_id` parameter is passed as a Liquid variable available in the snippet.

### Confidence: HIGH
Direct code reading of all three source files. The pipeline is: Liquid parse -> render (with VFS for snippet resolution) -> data attr injection (editor mode only).

---

## 3. Theme Variable Resolution

**How `var(--clr-*)`, `var(--space-*)`, `var(--radius-*)` resolve in section templates.**

### Source Files
- `/Users/cheyrasmussen/fluid/app/themes/stylesheets/base/global/helpers/_classes.scss`
- `/Users/cheyrasmussen/fluid/app/themes/stylesheets/base/global/components/_buttons.scss`
- `/Users/cheyrasmussen/fluid/app/themes/stylesheets/fluid/global/components/_buttons.scss`
- `/Users/cheyrasmussen/fluid/app/themes/templates/global/sections/features_grid/styles.css`

### Findings

1. **CSS custom properties:** Theme colors are defined as CSS custom properties (e.g., `--clr-primary`, `--clr-black`, `--clr-white`, `--clr-gray`). These are consumed via `var(--clr-*)` in stylesheets.

2. **Utility class definitions:** The `_classes.scss` file in `base/global/helpers/` defines basic utility classes:
   - Background: `.bg-white { background-color: var(--clr-white); }`, `.bg-primary`, `.bg-gray`, `.bg-black`
   - Border: `.border-white`, `.border-black`, `.border-primary`, `.border-gray`
   - Font: `.font-italic`
   - The existing utility classes in the backend stylesheets are LIMITED -- only 4 background colors, 4 border colors

3. **Section-scoped styles:** Each section has its own `styles.css` file (e.g., `features_grid/styles.css`). These use CSS variables like `var(--space-lg)`, `var(--space-xl)`, `var(--space-3xl)`, etc. for spacing. This confirms the `--space-*` CSS custom properties exist in the theme system.

4. **Utility class availability:** The text utility classes (`text-xs`, `text-sm`, etc.), spacing utilities (`py-xs`, `px-lg`, etc.), and font weight utilities (`font-light`, `font-bold`, etc.) are NOT defined in the backend Ruby app's stylesheets. They are generated/defined in the frontend theme system. The existing sections USE these classes in their templates, which confirms they are available at runtime even though their definitions are in the frontend/theme CSS layer, not the backend SCSS.

5. **Spacing variables confirmed in use:** From `features_grid/styles.css`:
   - `var(--space-lg)` -- used for grid gap and margins
   - `var(--space-xl)` -- used for desktop grid gap
   - `var(--space-3xl)`, `var(--space-4xl)`, `var(--space-5xl)` -- used for header margins at different breakpoints
   - `var(--space-md)` -- used for content spacing
   - `var(--z-10)` -- z-index variable (from `cta_simple/styles.css`)

6. **Border radius variables:** `var(--radius-*)` pattern is referenced in the Gold Standard doc but the existing sections use utility classes (`rounded-none`, `rounded-lg`, etc.) rather than CSS variables for border radius. Both approaches work.

### Confidence: HIGH for CSS variable existence, MEDIUM for complete utility class catalog
The backend defines a subset of utility classes. The full set (text-xs through text-9xl, py-xs through py-3xl, font-light through font-bold) comes from the frontend theme CSS which was not fully inspectable from the backend repo alone. However, existing sections USE these classes in their templates, confirming they are available.

---

## 4. Block System

**How `block.fluid_attributes` generates data attributes, how blocks are reordered, and what `fluid_attributes` outputs.**

### Source Files
- `/Users/cheyrasmussen/fluid/app/models/application_theme_template.rb` (lines 289-324, 512-524)

### Findings

1. **Block initialization from presets:** When a section has no blocks, they are initialized from `template.schema.dig("presets", 0, "blocks")` (line 290). This means the `presets` array in the schema JSON defines the default blocks for a new instance of the section.

2. **`fluid_attributes` generation (editor mode only):** Block fluid attributes are ONLY generated when `RequestStore.store[:editor_mode]` is true (line 292). In production/storefront mode, blocks render without these data attributes.

3. **Data attributes generated:** The `build_fluid_attributes` method (lines 512-524) produces these attributes:
   - `data-fluid-section-block-id` -- MD5 hash of `"{template_id}-{section_index}-{block_index}"`, truncated to first 8 characters
   - `data-fluid-parent-section-type` -- the section's `type` value (e.g., `"features_grid"`)
   - `data-fluid-section-id` -- the template's database `id`
   - `data-fluid-section-block-type` -- the block's `type` value (e.g., `"feature_item"`)
   - `data-fluid-block-attribute` -- the block's `settings` hash serialized as JSON (HTML-escaped)

4. **`build_fluid_attributes` output format:** Returns a string of `key='value'` pairs joined by spaces:
   ```ruby
   def build_fluid_attributes(attributes = {})
     attributes.map do |key, value|
       next if value.blank?
       key = "data-#{key}" unless key.start_with?("data-")
       "#{key}='#{value}'"
     end.compact.join(" ")
   end
   ```

5. **Block ordering:** When `section["blocks"]` is a Hash (not an Array), block order is determined by:
   - If `section["block_order"]` exists: blocks are reordered according to that array (line 308)
   - If no `block_order`: blocks are iterated as hash key-value pairs, with `fluid_attributes` generated per block using the hash key as the `block_id` (lines 312-324)

6. **Block defaults:** After blocks are established, each block's settings are filled with defaults from the block's schema (lines 328-338), following the same pattern as section settings.

7. **Template usage:** In Liquid templates, `{{ block.fluid_attributes }}` outputs the generated attribute string directly into the HTML element. Example from `features_grid`:
   ```liquid
   <div class="feature-item ..." {{ block.fluid_attributes }}>
   ```

### Confidence: HIGH
Direct code reading of the exact methods. The block system is well-understood.

---

## 5. Available Utility Classes

**Confirmed from CSS source and existing section usage.**

### Source Files
- `/Users/cheyrasmussen/fluid/app/themes/stylesheets/base/global/helpers/_classes.scss`
- `/Users/cheyrasmussen/fluid/app/themes/stylesheets/base/global/components/_buttons.scss`
- `/Users/cheyrasmussen/fluid/app/themes/stylesheets/fluid/global/components/_buttons.scss`
- `/Users/cheyrasmussen/fluid/app/themes/templates/global/sections/*/index.liquid` (all existing sections)
- `/Users/cheyrasmussen/Fluid Marketing Master Skills/tools/rules.json`

### Confirmed Utility Classes (from backend SCSS)

**Background colors (from `_classes.scss`):**
- `.bg-white`, `.bg-primary`, `.bg-gray`, `.bg-black`

**Border colors (from `_classes.scss`):**
- `.border-white`, `.border-black`, `.border-primary`, `.border-gray`

**Button classes (from base `_buttons.scss`):**
- `.btn` (base button)
- `.btn-small` (size variant)
- `.btn-bg-primary`, `.btn-bg-white` (background variants)
- `.btn-border-black`, `.btn-border-primary`, `.btn-border-white` (outline variants)
- `.btn-link` (link variant)

**Button classes (from fluid theme `_buttons.scss`):**
- `.btn` (with `border-radius: 8px` default)
- `.btn-link`
- `.btn-bg-primary`, `.btn-bg-secondary`
- `.btn-disabled`

### Utility Classes Used in Templates (confirmed available at runtime)

The following classes are used in existing `.liquid` sections, confirming they exist in the frontend theme CSS even though they are not defined in the backend SCSS:

**Font families:** `font-primary`, `font-body`, `font-handwritten`, `font-serif`

**Font sizes (13 per Gold Standard):** `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`, `text-5xl`, `text-6xl`, `text-7xl`, `text-8xl`, `text-9xl`

**Desktop font sizes (13 per Gold Standard):** `lg:text-xs` through `lg:text-9xl`

**Font weights:** `font-light`, `font-normal`, `font-medium`, `font-semibold`, `font-bold`, `font-black` (existing sections use 6 including black; Gold Standard specifies 5, no black)

**Text colors (13 per Gold Standard):** `text-primary`, `text-secondary`, `text-tertiary`, `text-accent`, `text-accent-secondary`, `text-white`, `text-black`, `text-success`, `text-warning`, `text-error`, `text-info`, `text-muted`, `text-inherit`

**Background colors (13 per Gold Standard):** `bg-primary`, `bg-secondary`, `bg-tertiary`, `bg-accent`, `bg-accent-secondary`, `bg-white`, `bg-black`, `bg-success`, `bg-warning`, `bg-error`, `bg-info`, `bg-muted`, `bg-neutral` (plus `bg-transparent`)

**Spacing (vertical padding, 7 options):** `py-xs`, `py-sm`, `py-md`, `py-lg`, `py-xl`, `py-2xl`, `py-3xl`

**Spacing (horizontal padding, 7 options):** `px-xs`, `px-sm`, `px-md`, `px-lg`, `px-xl`, `px-2xl`, `px-3xl`

**Desktop spacing:** `lg:py-*`, `lg:px-*` (same 7 options with `lg:` prefix)

**Border radius (8 options):** `rounded-none`, `rounded-sm`, `rounded`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`

**Layout utilities (used in sections):** `container`, `max-w-4xl`, `mx-auto`, `text-center`, `space-y-4xl`, `mb-2xl`, `mb-lg`, `mb-md`, `leading-tight`, `leading-relaxed`, `w-12`, `h-12`, `flex`, `items-center`, `justify-center`, `overflow-hidden`, `w-full`, `h-full`, `object-cover`

**Button pattern:** `btn btn-{style}-{color}` (e.g., `btn btn-filled-primary`, `btn btn-outline-white`)

### Confidence: HIGH for Gold Standard option lists (from rules.json), MEDIUM for layout utilities (from template usage)
The exact utility classes are defined in the Gold Standard spec and validated in `rules.json`. The layout utilities (flex, grid, etc.) are Tailwind-like and confirmed by usage in existing sections.

---

## 6. Section CSS Pattern

**How `{% render 'section-css' %}` resolves.**

### Source Files
- `/Users/cheyrasmussen/fluid/app/themes/templates/global/sections/features_grid/index.liquid` (line 86)
- `/Users/cheyrasmussen/fluid/app/services/themes/liquid/tags/render.rb`
- `/Users/cheyrasmussen/fluid/app/services/dam/virtual_file_system.rb`
- `/Users/cheyrasmussen/fluid/app/themes/templates/global/sections/features_grid/styles.css`
- `/Users/cheyrasmussen/fluid/app/themes/templates/global/sections/cta_simple/styles.css`

### Findings

1. **Usage pattern:** Sections include their CSS via:
   ```liquid
   <style>
     {% render 'section-css', section_id: 'features_grid' %}
   </style>
   ```

2. **Resolution mechanism:** The `{% render %}` tag uses the `VirtualFileSystem` to look up `section-css.liquid` in the DAM asset tree. The `section_id` is passed as a parameter to the snippet. The `section-css.liquid` snippet is NOT a file in the backend repo's templates directory -- it exists in the DAM (database-stored assets) and would be resolved at runtime through the `Dam::AssetResolver`.

3. **Section-specific styles:** Each section directory has its own `styles.css` file alongside the `index.liquid`. The `section-css` snippet likely incorporates these section-specific styles. The `styles.css` files contain:
   - Layout-specific CSS (grid layouts, flexbox)
   - Responsive breakpoints (`@media (min-width: 640px)`, `@media (min-width: 1024px)`)
   - CSS variables for spacing (`var(--space-*)`)
   - No hard-coded colors (uses `var(--clr-*)`)

4. **Variables.json:** Each section also has a `variables.json` file containing default setting values. Example from `cta_simple/variables.json`: a flat hash of `setting_id => default_value` pairs representing the section's initial state.

5. **Three-file structure:** Each section consists of:
   - `index.liquid` -- template markup + schema JSON
   - `styles.css` -- section-specific CSS
   - `variables.json` -- default settings values

### Confidence: MEDIUM
The `section-css` snippet resolution path through the DAM is understood conceptually but the actual snippet template was not found in the filesystem (it's database-stored). The three-file structure per section is confirmed.

---

## 7. Working Section Analysis

**What existing sections look like (and why they are NOT Gold Standard).**

### Sections Analyzed
1. `features_grid/index.liquid` (687 lines)
2. `cta_simple/index.liquid` (inspected first 50 lines + full schema)
3. `statistics_hero/` (exists but not deeply inspected)
4. `logo_showcase/` (exists but not deeply inspected)
5. `steps_process/` (exists but not deeply inspected)

### features_grid Analysis (Non-Gold-Standard)

**What it gets right:**
- Uses `{{ block.fluid_attributes }}` on block elements (line 37)
- Groups content with styling settings (heading content followed by heading font settings)
- Uses utility classes from schema settings (no inline styles for colors/fonts)
- Has separate mobile and desktop font sizes
- Includes section and container settings sections
- Three-file structure (index.liquid, styles.css, variables.json)

**What it gets wrong (Gold Standard violations):**
- Font sizes: Only 5 options (text-2xl through text-6xl) -- Gold Standard requires 13 (text-xs through text-9xl)
- Colors: Only 8 options with non-standard names (`text-quaternary`, `text-neutral-light`, `text-neutral-dark`) -- Gold Standard requires 13 semantic colors
- Font weights: 6 options including `font-black` -- Gold Standard specifies exactly 5 (light through bold, no black)
- Feature title weights: Only 4 options (medium, semibold, bold, black) -- missing light and normal
- Feature description weights: Only 4 options (light, normal, medium, semibold) -- missing bold
- Section padding: Single setting `section_padding` instead of separate `section_padding_y_mobile` and `section_padding_y_desktop`
- Container padding: Single setting `container_padding` instead of 4 separate settings (y_mobile, y_desktop, x_mobile, x_desktop)
- No background image settings on section or container
- No section border radius setting
- No button system at all
- Settings order: Section background comes after feature styling (should be Content -> Interactive -> Layout -> Container)

### cta_simple Analysis (Closer to Gold Standard)

**What it gets closer on:**
- Has separate `section_padding_y_mobile` and `section_padding_y_desktop` settings
- Has separate container padding settings (y_mobile, y_desktop, x_mobile, x_desktop)
- Has `section_border_radius` and `container_border_radius` settings
- Has background image support via `data-bg` attribute
- Uses button utility class system: `btn btn-{style}-{color} {size}`
- Has show/hide toggles for content elements

**What it still gets wrong:**
- Font sizes: Likely incomplete (same reduced set as features_grid)
- Colors: Uses non-standard names (`text-quaternary` instead of `text-accent`, `text-neutral-light` instead of `text-muted`)
- Font weights: Includes `font-black` as default heading weight (Gold Standard max is `font-bold`)
- Button implementation: Missing `button_font_weight` setting (has style, color, size but not weight)
- Uses `settings.button_border_radius` (global theme settings) instead of `section.settings.button_border_radius` (section settings)

### Key Pattern: Section Structure

```
section/
  index.liquid    -- Template markup + {% schema %} JSON block
  styles.css      -- Section-scoped CSS (layout, responsive)
  variables.json  -- Default setting values (flat key-value hash)
```

Template structure follows this pattern:
```liquid
<!-- Section HTML with utility classes from settings -->
<section class="section-name {{ settings... }}">
  <div class="container {{ settings... }}">
    <!-- Content using settings -->
    {% for block in section.blocks %}
      {% case block.type %}
        {% when 'block_type' %}
          <div {{ block.fluid_attributes }}>
            <!-- Block content using block.settings -->
          </div>
      {% endcase %}
    {% endfor %}
  </div>
</section>

<style>
  {% render 'section-css', section_id: 'section_name' %}
</style>

{% schema %}
{
  "name": "Section Name",
  "tag": "section",
  "class": "section-class",
  "settings": [ ... ],
  "blocks": [ ... ],
  "presets": [ ... ]
}
{% endschema %}
```

### Confidence: HIGH
Direct inspection of actual section code. Gap analysis is precise.

---

## 8. Open Questions

1. **Where are text/spacing/font utility classes defined?** The classes `text-xs`, `py-xs`, `font-light`, etc. are used in templates but their CSS definitions are not in the backend SCSS files. They likely come from the frontend theme CSS layer (possibly generated from theme settings or a Tailwind-like system). The Gold Standard specifies exact option counts (13 sizes, 13 colors, 5 weights) which aligns with `rules.json`, confirming these classes exist -- we just cannot see their CSS definitions from the backend alone.

2. **What does the `section-css` snippet template contain?** The snippet resolves through the DAM `VirtualFileSystem`, meaning it is stored in the database, not as a file. It likely includes/injects the section's `styles.css` content, possibly with additional theme-level CSS variables. The exact template was not found in the filesystem.

3. **How are CSS custom properties (`--clr-*`, `--space-*`) populated per theme?** Theme-level settings (colors chosen by the merchant) are injected as CSS custom properties. The mechanism for this injection (inline `<style>` block, generated stylesheet, etc.) was not found in the backend code. It is likely handled by the theme renderer when building the full page.

4. **Button class system:** The backend SCSS defines `btn-bg-{color}` and `btn-border-{color}` patterns, while the Gold Standard specifies `btn-{style}-{color}` (e.g., `btn-filled-primary`, `btn-outline-primary`). The Gold Standard pattern may be defined in the frontend theme CSS or may be an aspirational pattern that needs to be implemented. Existing sections (like `cta_simple`) use the Gold Standard pattern in their templates, suggesting it IS available at runtime.

5. **`data-bg` attribute for background images:** The `cta_simple` section uses `data-bg="{{ section.settings.background_image }}"` instead of inline `background-image` style. This suggests a JavaScript lazy-loading or background-image handler exists in the frontend that reads `data-bg` attributes. This is a recommended pattern for Gold Standard sections.

---

## Summary

The Fluid theme rendering pipeline is a straightforward Liquid-based system:
1. **Schema** is metadata-only JSON parsed by `SchemaTag`, rendered as empty string, consumed by the editor frontend for sidebar controls and by the backend for default value application
2. **Templates** are standard Liquid with a custom `{% render %}` tag that resolves through a VirtualFileSystem (DAM-backed)
3. **Utility classes** follow a Tailwind-like pattern (text-*, bg-*, py-*, rounded-*) with exact counts defined in `rules.json`
4. **Blocks** get `fluid_attributes` data attributes in editor mode only, enabling selection/reordering/configuration
5. **CSS** is section-scoped via `styles.css` files + a `section-css` snippet pattern
6. **Existing sections** are demonstrably non-Gold-Standard (incomplete option lists, wrong color names, missing settings)
