# Gold Standard Template Patterns

**Source:** GOLD_STANDARD_WORKFLOW.md
**Agent:** Layout agent
**Weight:** 100

---

## Template Implementation Rules (Weight: 100 -- Gold Standard)

From Phase 3 (Implementation), Step 2 of GOLD_STANDARD_WORKFLOW.md:

- [ ] Use utility classes from schema settings
- [ ] Never hard-code colors, spacing, or border radius
- [ ] Use `var(--clr-*)`, `var(--radius-*)`, `var(--space-*)` for inline styles
- [ ] Add `{{ block.fluid_attributes }}` to all block elements
- [ ] Add placeholder fallbacks for all images
- [ ] Background images use `data-bg` attribute
- [ ] Content properly centered where needed (`margin: 0 auto; text-align: center;`)
- [ ] Links that shouldn't wrap use `white-space: nowrap;`

---

## Section/Container Wrapper Pattern (Weight: 100 -- Gold Standard)

Every section follows this wrapper structure:

```liquid
<section class="section-name {{ section.settings.background_color | default: 'bg-neutral' }} {{ section.settings.section_padding_y_mobile | default: 'py-xl' }} {{ section.settings.section_padding_y_desktop | default: 'lg:py-3xl' }} {{ section.settings.section_border_radius | default: 'rounded-none' }}"
  {% if section.settings.background_image %}data-bg="{{ section.settings.background_image }}"{% endif %}>

  <div class="container {{ section.settings.container_background_color | default: 'bg-transparent' }} {{ section.settings.container_border_radius | default: 'rounded-none' }} {{ section.settings.container_padding_y_mobile | default: 'py-0' }} {{ section.settings.container_padding_y_desktop | default: 'lg:py-0' }} {{ section.settings.container_padding_x_mobile | default: 'px-lg' }} {{ section.settings.container_padding_x_desktop | default: 'lg:px-xl' }}"
    {% if section.settings.container_background_image %}data-bg="{{ section.settings.container_background_image }}"{% endif %}>

    <!-- Section content here -->

  </div>
</section>
```

### Key Points:
- Section background color default: `bg-neutral` (NOT bg-white or bg-primary)
- Section padding default: `py-xl` (mobile), `lg:py-3xl` (desktop)
- Container padding default: `px-lg` (mobile), `lg:px-xl` (desktop)
- Background images use `data-bg` attribute (NOT inline `background-image` style)
- Every utility class comes from a schema setting with a `| default:` fallback

---

## Text Element Template Pattern (Weight: 100 -- Gold Standard)

Every text element uses all 6 settings from the schema:

```liquid
{% if section.settings.heading != blank %}
<h1 class="{{ section.settings.heading_font_family | default: 'font-primary' }} {{ section.settings.heading_font_size | default: 'text-3xl' }} {{ section.settings.heading_font_size_desktop | default: 'lg:text-4xl' }} {{ section.settings.heading_font_weight | default: 'font-bold' }} {{ section.settings.heading_color | default: 'text-primary' }}">
  {{ section.settings.heading | default: 'Your Heading Here' }}
</h1>
{% endif %}
```

### Default Values (Weight: 100 -- Gold Standard)
- Heading: `text-3xl` (mobile), `lg:text-4xl` (desktop), `font-bold`
- Body: `text-base` (mobile), `lg:text-lg` (desktop), `font-normal`
- Text color: `text-primary` (NOT text-black unless specific reason)

---

## Block Pattern (Weight: 100 -- Gold Standard)

Every block element MUST include `{{ block.fluid_attributes }}`:

```liquid
{% for block in section.blocks %}
  {% case block.type %}
    {% when 'text_block' %}
      <div class="block-wrapper" {{ block.fluid_attributes }}>
        <!-- Block content using block.settings -->
      </div>
    {% when 'feature_item' %}
      <div class="feature-item" {{ block.fluid_attributes }}>
        <!-- Feature content -->
      </div>
  {% endcase %}
{% endfor %}
```

### Empirical Context

From `EMPIRICAL-FINDINGS.md`:

`{{ block.fluid_attributes }}` outputs data attributes in editor mode only:
- `data-fluid-section-block-id` -- MD5 hash for block identification
- `data-fluid-parent-section-type` -- the section's type
- `data-fluid-section-id` -- the template's database ID
- `data-fluid-section-block-type` -- the block's type
- `data-fluid-block-attribute` -- the block's settings as JSON

Without `{{ block.fluid_attributes }}`, blocks render correctly but CANNOT be selected, reordered, or configured in the page editor.

---

## Image Placeholder Pattern (Weight: 100 -- Gold Standard)

All images must have placeholder fallbacks:

```liquid
{% if section.settings.image %}
  <img src="{{ section.settings.image | image_url: width: 800 }}"
       alt="{{ section.settings.image_alt | default: 'Section image' }}"
       class="w-full h-full object-cover">
{% else %}
  <img src="{{ 'placeholder-image.png' | asset_url }}"
       alt="{{ section.settings.image_alt | default: 'Placeholder image' }}"
       class="w-full h-full object-cover">
{% endif %}
```

---

## Button Template Pattern (Weight: 100 -- Gold Standard)

```liquid
{% if section.settings.show_button %}
<a href="{{ section.settings.button_url | default: '#' }}"
   class="btn btn-{{ section.settings.button_style | default: 'filled' }}-{{ section.settings.button_color | default: 'primary' }} {{ section.settings.button_size | default: 'btn-md' }} {{ section.settings.button_font_weight | default: 'font-medium' }} {{ settings.button_border_radius | default: 'rounded' }}">
  {{ section.settings.button_text | default: 'Click Here' }}
</a>
{% endif %}
```

See [[button-system.md]] for full button system documentation.

---

## Complete Section Template Structure (Weight: 100 -- Gold Standard)

```liquid
<!-- Section Name -->
<section class="section-name {{ section.settings.background_color | default: 'bg-neutral' }} {{ section.settings.section_padding_y_mobile | default: 'py-xl' }} {{ section.settings.section_padding_y_desktop | default: 'lg:py-3xl' }} {{ section.settings.section_border_radius | default: 'rounded-none' }}"
  {% if section.settings.background_image %}data-bg="{{ section.settings.background_image }}"{% endif %}>

  <div class="container {{ section.settings.container_background_color | default: 'bg-transparent' }} {{ section.settings.container_border_radius | default: 'rounded-none' }} {{ section.settings.container_padding_y_mobile | default: 'py-0' }} {{ section.settings.container_padding_y_desktop | default: 'lg:py-0' }} {{ section.settings.container_padding_x_mobile | default: 'px-lg' }} {{ section.settings.container_padding_x_desktop | default: 'lg:px-xl' }}"
    {% if section.settings.container_background_image %}data-bg="{{ section.settings.container_background_image }}"{% endif %}>

    <!-- Text Elements (each with 6 settings) -->
    {% if section.settings.heading != blank %}
    <h2 class="{{ section.settings.heading_font_family | default: 'font-primary' }} {{ section.settings.heading_font_size | default: 'text-3xl' }} {{ section.settings.heading_font_size_desktop | default: 'lg:text-4xl' }} {{ section.settings.heading_font_weight | default: 'font-bold' }} {{ section.settings.heading_color | default: 'text-primary' }}">
      {{ section.settings.heading | default: 'Your Heading Here' }}
    </h2>
    {% endif %}

    <!-- Blocks -->
    {% for block in section.blocks %}
      {% case block.type %}
        {% when 'block_type' %}
          <div class="block-wrapper" {{ block.fluid_attributes }}>
            <!-- Block content using block.settings -->
          </div>
      {% endcase %}
    {% endfor %}

    <!-- Buttons -->
    {% if section.settings.show_button %}
    <a href="{{ section.settings.button_url | default: '#' }}"
       class="btn btn-{{ section.settings.button_style | default: 'filled' }}-{{ section.settings.button_color | default: 'primary' }} {{ section.settings.button_size | default: 'btn-md' }} {{ section.settings.button_font_weight | default: 'font-medium' }} {{ settings.button_border_radius | default: 'rounded' }}">
      {{ section.settings.button_text | default: 'Click Here' }}
    </a>
    {% endif %}

  </div>
</section>

<style>
  {% render 'section-css', section_id: 'section_name' %}
</style>

{% schema %}
{
  "name": "Section Name",
  "tag": "section",
  "class": "section-name-class",
  "settings": [
    /* Content -> Interactive -> Layout -> Container order */
  ],
  "blocks": [ ... ],
  "presets": [ ... ]
}
{% endschema %}
```

---

## Section File Structure

Each section consists of three files:

```
section-name/
  index.liquid    -- Template markup + {% schema %} JSON block
  styles.css      -- Section-scoped CSS (layout, responsive)
  variables.json  -- Default setting values (flat key-value hash)
```

### styles.css Pattern
Section-specific CSS uses CSS variables for spacing and colors:
```css
.section-name .grid-container {
  display: grid;
  gap: var(--space-lg);
}

@media (min-width: 1024px) {
  .section-name .grid-container {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-xl);
  }
}
```

### Section CSS Inclusion
CSS is included via a Liquid snippet:
```liquid
<style>
  {% render 'section-css', section_id: 'section_name' %}
</style>
```
This resolves through the DAM VirtualFileSystem. The `section_id` parameter identifies which section's CSS to load.

---

## Critical Rules (Weight: 100 -- Gold Standard)

### NEVER:
1. Hard-code colors (no `#e6ea00`, use `var(--clr-secondary)`)
2. Hard-code border radius (no `13px`, use `var(--radius-lg)`)
3. Hard-code spacing (no `24px`, use `var(--space-lg)`)
4. Omit `{{ block.fluid_attributes }}` on block elements
5. Omit placeholder fallbacks for images
6. Use inline styles for colors, spacing, or border radius

### ALWAYS:
1. Use utility classes from schema settings
2. Add `| default:` fallback to every setting reference
3. Wrap optional elements in `{% if section.settings.field != blank %}`
4. Include `{{ block.fluid_attributes }}` on every block's outermost element
5. Use `data-bg` for background images

---

## Cross-References

- [[schema-rules.md]] -- Schema planning and build order
- [[button-system.md]] -- Button implementation details
- [[theme-tokens.md]] -- CSS variable and utility class reference
- [[validation-checklist.md]] -- Template validation checks
- [[EMPIRICAL-FINDINGS.md]] -- How block.fluid_attributes works, section file structure
