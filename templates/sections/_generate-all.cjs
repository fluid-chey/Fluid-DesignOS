#!/usr/bin/env node
/**
 * Generate all 11 section templates following hero.liquid Gold Standard pattern.
 * Run: node templates/sections/_generate-all.cjs
 */
const fs = require('fs');
const path = require('path');

// Shared schema fragments
const FONT_FAMILY_OPTIONS = `[
        { "value": "font-primary", "label": "Primary" },
        { "value": "font-body", "label": "Body" },
        { "value": "font-handwritten", "label": "Handwritten" },
        { "value": "font-serif", "label": "Serif" }
      ]`;

const FONT_SIZE_MOBILE_OPTIONS = `[
        { "value": "text-xs", "label": "XS" },
        { "value": "text-sm", "label": "SM" },
        { "value": "text-base", "label": "Base" },
        { "value": "text-lg", "label": "LG" },
        { "value": "text-xl", "label": "XL" },
        { "value": "text-2xl", "label": "2XL" },
        { "value": "text-3xl", "label": "3XL" },
        { "value": "text-4xl", "label": "4XL" },
        { "value": "text-5xl", "label": "5XL" },
        { "value": "text-6xl", "label": "6XL" },
        { "value": "text-7xl", "label": "7XL" },
        { "value": "text-8xl", "label": "8XL" },
        { "value": "text-9xl", "label": "9XL" }
      ]`;

const FONT_SIZE_DESKTOP_OPTIONS = `[
        { "value": "lg:text-xs", "label": "XS" },
        { "value": "lg:text-sm", "label": "SM" },
        { "value": "lg:text-base", "label": "Base" },
        { "value": "lg:text-lg", "label": "LG" },
        { "value": "lg:text-xl", "label": "XL" },
        { "value": "lg:text-2xl", "label": "2XL" },
        { "value": "lg:text-3xl", "label": "3XL" },
        { "value": "lg:text-4xl", "label": "4XL" },
        { "value": "lg:text-5xl", "label": "5XL" },
        { "value": "lg:text-6xl", "label": "6XL" },
        { "value": "lg:text-7xl", "label": "7XL" },
        { "value": "lg:text-8xl", "label": "8XL" },
        { "value": "lg:text-9xl", "label": "9XL" }
      ]`;

const FONT_WEIGHT_OPTIONS = `[
        { "value": "font-light", "label": "Light" },
        { "value": "font-normal", "label": "Normal" },
        { "value": "font-medium", "label": "Medium" },
        { "value": "font-semibold", "label": "Semibold" },
        { "value": "font-bold", "label": "Bold" }
      ]`;

const COLOR_OPTIONS = `[
        { "value": "text-primary", "label": "Primary" },
        { "value": "text-secondary", "label": "Secondary" },
        { "value": "text-tertiary", "label": "Tertiary" },
        { "value": "text-accent", "label": "Accent" },
        { "value": "text-accent-secondary", "label": "Accent Secondary" },
        { "value": "text-white", "label": "White" },
        { "value": "text-black", "label": "Black" },
        { "value": "text-success", "label": "Success" },
        { "value": "text-warning", "label": "Warning" },
        { "value": "text-error", "label": "Error" },
        { "value": "text-info", "label": "Info" },
        { "value": "text-muted", "label": "Muted" },
        { "value": "text-inherit", "label": "Inherit" }
      ]`;

function textElementSettings(prefix, label, defaults = {}) {
  const dfFamily = defaults.family || 'font-primary';
  const dfSizeMobile = defaults.sizeMobile || 'text-base';
  const dfSizeDesktop = defaults.sizeDesktop || 'lg:text-lg';
  const dfWeight = defaults.weight || 'font-normal';
  const dfColor = defaults.color || 'text-primary';
  const dfContent = defaults.content || '';
  const inputType = defaults.inputType || 'text';

  return `    {
      "type": "header",
      "content": "${label}"
    },
    {
      "type": "${inputType}",
      "id": "${prefix}",
      "label": "${label}",
      "default": "${dfContent}"
    },
    {
      "type": "select",
      "id": "${prefix}_font_family",
      "label": "${label} Font Family",
      "options": ${FONT_FAMILY_OPTIONS},
      "default": "${dfFamily}"
    },
    {
      "type": "select",
      "id": "${prefix}_font_size",
      "label": "${label} Font Size Mobile",
      "options": ${FONT_SIZE_MOBILE_OPTIONS},
      "default": "${dfSizeMobile}"
    },
    {
      "type": "select",
      "id": "${prefix}_font_size_desktop",
      "label": "${label} Font Size Desktop",
      "options": ${FONT_SIZE_DESKTOP_OPTIONS},
      "default": "${dfSizeDesktop}"
    },
    {
      "type": "select",
      "id": "${prefix}_font_weight",
      "label": "${label} Font Weight",
      "options": ${FONT_WEIGHT_OPTIONS},
      "default": "${dfWeight}"
    },
    {
      "type": "select",
      "id": "${prefix}_color",
      "label": "${label} Color",
      "options": ${COLOR_OPTIONS},
      "default": "${dfColor}"
    }`;
}

function buttonSettings() {
  return `    {
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
      "default": "Learn More"
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
      "options": ${FONT_WEIGHT_OPTIONS},
      "default": "font-medium"
    }`;
}

function sectionSettings() {
  return `    {
      "type": "header",
      "content": "Section Settings"
    },
    {
      "type": "select",
      "id": "background_color",
      "label": "Background Color",
      "options": [
        { "value": "bg-neutral", "label": "Neutral" },
        { "value": "bg-primary", "label": "Primary" },
        { "value": "bg-secondary", "label": "Secondary" },
        { "value": "bg-tertiary", "label": "Tertiary" },
        { "value": "bg-accent", "label": "Accent" },
        { "value": "bg-accent-secondary", "label": "Accent Secondary" },
        { "value": "bg-white", "label": "White" },
        { "value": "bg-black", "label": "Black" },
        { "value": "bg-success", "label": "Success" },
        { "value": "bg-warning", "label": "Warning" },
        { "value": "bg-error", "label": "Error" },
        { "value": "bg-muted", "label": "Muted" },
        { "value": "bg-transparent", "label": "Transparent" }
      ],
      "default": "bg-neutral"
    },
    {
      "type": "image_picker",
      "id": "background_image",
      "label": "Background Image"
    },
    {
      "type": "select",
      "id": "section_padding_y_mobile",
      "label": "Section Padding Y (Mobile)",
      "options": [
        { "value": "py-xs", "label": "XS" },
        { "value": "py-sm", "label": "SM" },
        { "value": "py-md", "label": "MD" },
        { "value": "py-lg", "label": "LG" },
        { "value": "py-xl", "label": "XL" },
        { "value": "py-2xl", "label": "2XL" },
        { "value": "py-3xl", "label": "3XL" }
      ],
      "default": "py-xl"
    },
    {
      "type": "select",
      "id": "section_padding_y_desktop",
      "label": "Section Padding Y (Desktop)",
      "options": [
        { "value": "lg:py-xs", "label": "XS" },
        { "value": "lg:py-sm", "label": "SM" },
        { "value": "lg:py-md", "label": "MD" },
        { "value": "lg:py-lg", "label": "LG" },
        { "value": "lg:py-xl", "label": "XL" },
        { "value": "lg:py-2xl", "label": "2XL" },
        { "value": "lg:py-3xl", "label": "3XL" }
      ],
      "default": "lg:py-3xl"
    },
    {
      "type": "select",
      "id": "section_border_radius",
      "label": "Section Border Radius",
      "options": [
        { "value": "rounded-none", "label": "None" },
        { "value": "rounded-sm", "label": "SM" },
        { "value": "rounded", "label": "Default" },
        { "value": "rounded-md", "label": "MD" },
        { "value": "rounded-lg", "label": "LG" },
        { "value": "rounded-xl", "label": "XL" },
        { "value": "rounded-2xl", "label": "2XL" },
        { "value": "rounded-3xl", "label": "3XL" }
      ],
      "default": "rounded-none"
    }`;
}

function containerSettings() {
  return `    {
      "type": "header",
      "content": "Container Settings"
    },
    {
      "type": "select",
      "id": "container_background_color",
      "label": "Container Background Color",
      "options": [
        { "value": "bg-transparent", "label": "Transparent" },
        { "value": "bg-neutral", "label": "Neutral" },
        { "value": "bg-primary", "label": "Primary" },
        { "value": "bg-secondary", "label": "Secondary" },
        { "value": "bg-tertiary", "label": "Tertiary" },
        { "value": "bg-accent", "label": "Accent" },
        { "value": "bg-accent-secondary", "label": "Accent Secondary" },
        { "value": "bg-white", "label": "White" },
        { "value": "bg-black", "label": "Black" },
        { "value": "bg-success", "label": "Success" },
        { "value": "bg-warning", "label": "Warning" },
        { "value": "bg-error", "label": "Error" },
        { "value": "bg-muted", "label": "Muted" }
      ],
      "default": "bg-transparent"
    },
    {
      "type": "image_picker",
      "id": "container_background_image",
      "label": "Container Background Image"
    },
    {
      "type": "select",
      "id": "container_border_radius",
      "label": "Container Border Radius",
      "options": [
        { "value": "rounded-none", "label": "None" },
        { "value": "rounded-sm", "label": "SM" },
        { "value": "rounded", "label": "Default" },
        { "value": "rounded-md", "label": "MD" },
        { "value": "rounded-lg", "label": "LG" },
        { "value": "rounded-xl", "label": "XL" },
        { "value": "rounded-2xl", "label": "2XL" },
        { "value": "rounded-3xl", "label": "3XL" }
      ],
      "default": "rounded-none"
    },
    {
      "type": "select",
      "id": "container_padding_y_mobile",
      "label": "Container Padding Y (Mobile)",
      "options": [
        { "value": "py-xs", "label": "XS" },
        { "value": "py-sm", "label": "SM" },
        { "value": "py-md", "label": "MD" },
        { "value": "py-lg", "label": "LG" },
        { "value": "py-xl", "label": "XL" },
        { "value": "py-2xl", "label": "2XL" },
        { "value": "py-3xl", "label": "3XL" }
      ],
      "default": "py-0"
    },
    {
      "type": "select",
      "id": "container_padding_y_desktop",
      "label": "Container Padding Y (Desktop)",
      "options": [
        { "value": "lg:py-xs", "label": "XS" },
        { "value": "lg:py-sm", "label": "SM" },
        { "value": "lg:py-md", "label": "MD" },
        { "value": "lg:py-lg", "label": "LG" },
        { "value": "lg:py-xl", "label": "XL" },
        { "value": "lg:py-2xl", "label": "2XL" },
        { "value": "lg:py-3xl", "label": "3XL" }
      ],
      "default": "lg:py-0"
    },
    {
      "type": "select",
      "id": "container_padding_x_mobile",
      "label": "Container Padding X (Mobile)",
      "options": [
        { "value": "px-xs", "label": "XS" },
        { "value": "px-sm", "label": "SM" },
        { "value": "px-md", "label": "MD" },
        { "value": "px-lg", "label": "LG" },
        { "value": "px-xl", "label": "XL" },
        { "value": "px-2xl", "label": "2XL" },
        { "value": "px-3xl", "label": "3XL" }
      ],
      "default": "px-lg"
    },
    {
      "type": "select",
      "id": "container_padding_x_desktop",
      "label": "Container Padding X (Desktop)",
      "options": [
        { "value": "lg:px-xs", "label": "XS" },
        { "value": "lg:px-sm", "label": "SM" },
        { "value": "lg:px-md", "label": "MD" },
        { "value": "lg:px-lg", "label": "LG" },
        { "value": "lg:px-xl", "label": "XL" },
        { "value": "lg:px-2xl", "label": "2XL" },
        { "value": "lg:px-3xl", "label": "3XL" }
      ],
      "default": "lg:px-xl"
    }`;
}

function sectionWrapper(cssClass) {
  return `<section
  class="section-${cssClass} {{ section.settings.background_color | default: 'bg-neutral' }} {{ section.settings.section_padding_y_mobile | default: 'py-xl' }} {{ section.settings.section_padding_y_desktop | default: 'lg:py-3xl' }} {{ section.settings.section_border_radius | default: 'rounded-none' }}"
  {% if section.settings.background_image %}data-bg="{{ section.settings.background_image }}"{% endif %}>`;
}

function containerOpen() {
  return `  <div class="container {{ section.settings.container_background_color | default: 'bg-transparent' }} {{ section.settings.container_border_radius | default: 'rounded-none' }} {{ section.settings.container_padding_y_mobile | default: 'py-0' }} {{ section.settings.container_padding_y_desktop | default: 'lg:py-0' }} {{ section.settings.container_padding_x_mobile | default: 'px-lg' }} {{ section.settings.container_padding_x_desktop | default: 'lg:px-xl' }}"
    {% if section.settings.container_background_image %}data-bg="{{ section.settings.container_background_image }}"{% endif %}>`;
}

function textElement(tag, prefix, label, defaultContent) {
  return `
    {% if section.settings.${prefix} != blank %}
    <${tag} class="{{ section.settings.${prefix}_font_family | default: 'font-primary' }} {{ section.settings.${prefix}_font_size | default: 'text-base' }} {{ section.settings.${prefix}_font_size_desktop | default: 'lg:text-lg' }} {{ section.settings.${prefix}_font_weight | default: 'font-normal' }} {{ section.settings.${prefix}_color | default: 'text-primary' }}">
      {{ section.settings.${prefix} | default: '${defaultContent}' }}
    </${tag}>
    {% endif %}`;
}

function buttonBlock() {
  return `
    {% if section.settings.show_button %}
    <a href="{{ section.settings.button_url | default: '#' }}"
       class="btn btn-{{ section.settings.button_style | default: 'filled' }}-{{ section.settings.button_color | default: 'primary' }} {{ section.settings.button_size | default: 'btn-md' }} {{ section.settings.button_font_weight | default: 'font-medium' }} {{ settings.button_border_radius | default: 'rounded' }}">
      {{ section.settings.button_text | default: 'Learn More' }}
    </a>
    {% endif %}`;
}

function styleTag(sectionId) {
  return `
<style>
  {% render 'section-css', section_id: '${sectionId}' %}
</style>`;
}

function blockTextElement(tag, prefix, label, defaultContent) {
  return `          {% if block.settings.${prefix} != blank %}
          <${tag} class="{{ block.settings.${prefix}_font_family | default: 'font-body' }} {{ block.settings.${prefix}_font_size | default: 'text-base' }} {{ block.settings.${prefix}_font_size_desktop | default: 'lg:text-base' }} {{ block.settings.${prefix}_font_weight | default: 'font-normal' }} {{ block.settings.${prefix}_color | default: 'text-primary' }}">
            {{ block.settings.${prefix} }}
          </${tag}>
          {% endif %}`;
}

function blockTextSettings(prefix, label, defaults = {}) {
  const dfFamily = defaults.family || 'font-body';
  const dfSizeMobile = defaults.sizeMobile || 'text-base';
  const dfSizeDesktop = defaults.sizeDesktop || 'lg:text-base';
  const dfWeight = defaults.weight || 'font-normal';
  const dfColor = defaults.color || 'text-primary';
  const dfContent = defaults.content || '';
  const inputType = defaults.inputType || 'text';

  return `        {
          "type": "header",
          "content": "${label}"
        },
        {
          "type": "${inputType}",
          "id": "${prefix}",
          "label": "${label}",
          "default": "${dfContent}"
        },
        {
          "type": "select",
          "id": "${prefix}_font_family",
          "label": "${label} Font Family",
          "options": ${FONT_FAMILY_OPTIONS},
          "default": "${dfFamily}"
        },
        {
          "type": "select",
          "id": "${prefix}_font_size",
          "label": "${label} Font Size Mobile",
          "options": ${FONT_SIZE_MOBILE_OPTIONS},
          "default": "${dfSizeMobile}"
        },
        {
          "type": "select",
          "id": "${prefix}_font_size_desktop",
          "label": "${label} Font Size Desktop",
          "options": ${FONT_SIZE_DESKTOP_OPTIONS},
          "default": "${dfSizeDesktop}"
        },
        {
          "type": "select",
          "id": "${prefix}_font_weight",
          "label": "${label} Font Weight",
          "options": ${FONT_WEIGHT_OPTIONS},
          "default": "${dfWeight}"
        },
        {
          "type": "select",
          "id": "${prefix}_color",
          "label": "${label} Color",
          "options": ${COLOR_OPTIONS},
          "default": "${dfColor}"
        }`;
}

// ═══════════════════════════════════════════════
// Section definitions
// ═══════════════════════════════════════════════

const sections = {
  'testimonials': {
    name: 'Testimonials',
    category: 'Social Proof',
    annotations: [
      'FIXED: Section wrapper with utility class application from schema settings',
      'FIXED: Container wrapper with full 7-setting customization',
      'FLEXIBLE: Heading text content and all typography settings',
      'FLEXIBLE: Testimonial blocks with quote, author, role text and image',
      'OPTIONAL: Heading (conditionally rendered)',
    ],
    description: 'Gold Standard compliant -- 1 text element, 1 button, 5 section settings, 7 container settings + testimonial blocks',
    textElements: [
      { prefix: 'heading', label: 'Heading', tag: 'h2', defaults: { family: 'font-primary', sizeMobile: 'text-2xl', sizeDesktop: 'lg:text-3xl', weight: 'font-bold', color: 'text-primary', content: 'Testimonials' } },
    ],
    html: (te, btn) => `${te[0]}

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
      {% for block in section.blocks %}
        {% if block.type == 'testimonial' %}
        <div {{ block.fluid_attributes }} class="testimonial-card">
          {% if block.settings.image %}
          <img src="{{ block.settings.image | image_url }}" alt="{{ block.settings.author | default: 'Author' }}" class="testimonial-image" loading="lazy" />
          {% endif %}

${blockTextElement('blockquote', 'quote', 'Quote', 'Great product!')}

${blockTextElement('p', 'author', 'Author', 'John Doe')}

${blockTextElement('p', 'role', 'Role', 'CEO, Company')}
        </div>
        {% endif %}
      {% endfor %}
    </div>
${btn}`,
    blocks: [{
      type: 'testimonial',
      name: 'Testimonial',
      settings: [
        `        {
          "type": "image_picker",
          "id": "image",
          "label": "Author Image"
        }`,
        blockTextSettings('quote', 'Quote', { inputType: 'textarea', content: 'This product has transformed our business.', family: 'font-body', sizeMobile: 'text-base', sizeDesktop: 'lg:text-lg', weight: 'font-normal', color: 'text-primary' }),
        blockTextSettings('author', 'Author', { content: 'Jane Smith', family: 'font-primary', sizeMobile: 'text-base', sizeDesktop: 'lg:text-base', weight: 'font-semibold', color: 'text-primary' }),
        blockTextSettings('role', 'Role', { content: 'CEO, Acme Corp', family: 'font-body', sizeMobile: 'text-sm', sizeDesktop: 'lg:text-sm', weight: 'font-normal', color: 'text-secondary' }),
      ]
    }]
  },

  'cta-banner': {
    name: 'CTA Banner',
    category: 'Call to Action',
    annotations: [
      'FIXED: Section wrapper with utility class application from schema settings',
      'FIXED: Container wrapper with full 7-setting customization',
      'FLEXIBLE: Heading, body text content and all typography settings',
      'FLEXIBLE: Dual button configuration (primary + secondary)',
      'OPTIONAL: Body text, secondary button (conditionally rendered)',
    ],
    description: 'Gold Standard compliant -- 2 text elements, dual buttons, 5 section settings, 7 container settings',
    textElements: [
      { prefix: 'heading', label: 'Heading', tag: 'h2', defaults: { family: 'font-primary', sizeMobile: 'text-2xl', sizeDesktop: 'lg:text-4xl', weight: 'font-bold', color: 'text-white', content: 'Ready to Get Started?' } },
      { prefix: 'body', label: 'Body Text', tag: 'div', defaults: { inputType: 'textarea', family: 'font-body', sizeMobile: 'text-base', sizeDesktop: 'lg:text-lg', weight: 'font-normal', color: 'text-white', content: '' } },
    ],
    html: (te, btn) => `${te[0]}
${te[1]}

    <div class="cta-buttons">
${btn}

      {% if section.settings.show_secondary_button %}
      <a href="{{ section.settings.secondary_button_url | default: '#' }}"
         class="btn btn-{{ section.settings.secondary_button_style | default: 'outline' }}-{{ section.settings.secondary_button_color | default: 'white' }} {{ section.settings.secondary_button_size | default: 'btn-md' }} {{ section.settings.secondary_button_font_weight | default: 'font-medium' }}">
        {{ section.settings.secondary_button_text | default: 'Learn More' }}
      </a>
      {% endif %}
    </div>`,
    extraSettings: `    {
      "type": "header",
      "content": "Secondary Button"
    },
    {
      "type": "checkbox",
      "id": "show_secondary_button",
      "label": "Show Secondary Button",
      "default": true
    },
    {
      "type": "text",
      "id": "secondary_button_text",
      "label": "Secondary Button Text",
      "default": "Learn More"
    },
    {
      "type": "url",
      "id": "secondary_button_url",
      "label": "Secondary Button URL",
      "default": "#"
    },
    {
      "type": "select",
      "id": "secondary_button_style",
      "label": "Secondary Button Style",
      "options": [
        { "value": "filled", "label": "Filled" },
        { "value": "outline", "label": "Outline" },
        { "value": "ghost", "label": "Ghost" }
      ],
      "default": "outline"
    },
    {
      "type": "select",
      "id": "secondary_button_color",
      "label": "Secondary Button Color",
      "options": [
        { "value": "primary", "label": "Primary" },
        { "value": "secondary", "label": "Secondary" },
        { "value": "white", "label": "White" },
        { "value": "black", "label": "Black" }
      ],
      "default": "white"
    },
    {
      "type": "select",
      "id": "secondary_button_size",
      "label": "Secondary Button Size",
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
      "id": "secondary_button_font_weight",
      "label": "Secondary Button Font Weight",
      "options": ${FONT_WEIGHT_OPTIONS},
      "default": "font-medium"
    }`,
    bgDefault: 'bg-accent',
  },

  'image-text': {
    name: 'Image Text',
    category: 'Content',
    annotations: [
      'FIXED: Section wrapper with utility class application from schema settings',
      'FIXED: Container wrapper with full 7-setting customization',
      'FLEXIBLE: Heading, body text content and all typography settings',
      'FLEXIBLE: Image position (left/right) via reverse setting',
      'OPTIONAL: Body text, button (conditionally rendered)',
    ],
    description: 'Gold Standard compliant -- 2 text elements, 1 button, 5 section settings, 7 container settings + image_picker + reverse layout',
    textElements: [
      { prefix: 'heading', label: 'Heading', tag: 'h2', defaults: { family: 'font-primary', sizeMobile: 'text-2xl', sizeDesktop: 'lg:text-3xl', weight: 'font-bold', color: 'text-primary', content: 'Your Heading Here' } },
      { prefix: 'body', label: 'Body Text', tag: 'div', defaults: { inputType: 'textarea', family: 'font-body', sizeMobile: 'text-base', sizeDesktop: 'lg:text-lg', weight: 'font-normal', color: 'text-primary', content: '' } },
    ],
    html: (te, btn) => `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-xl {% if section.settings.reverse_layout %}flex-row-reverse{% endif %}">
      <div class="image-side">
        {% if section.settings.image %}
        <img src="{{ section.settings.image | image_url }}" alt="{{ section.settings.image_alt | default: '' }}" loading="lazy" />
        {% endif %}
      </div>

      <div class="text-side">
${te[0]}
${te[1]}
${btn}
      </div>
    </div>`,
    extraSettings: `    {
      "type": "header",
      "content": "Image"
    },
    {
      "type": "image_picker",
      "id": "image",
      "label": "Image"
    },
    {
      "type": "text",
      "id": "image_alt",
      "label": "Image Alt Text",
      "default": ""
    },
    {
      "type": "checkbox",
      "id": "reverse_layout",
      "label": "Reverse Layout (Image Right)",
      "default": false
    }`,
  },

  'statistics': {
    name: 'Statistics',
    category: 'Social Proof',
    annotations: [
      'FIXED: Section wrapper with utility class application from schema settings',
      'FIXED: Container wrapper with full 7-setting customization',
      'FLEXIBLE: Heading text content and all typography settings',
      'FLEXIBLE: Stat item blocks with value and label',
      'OPTIONAL: Heading (conditionally rendered)',
    ],
    description: 'Gold Standard compliant -- 1 text element, 1 button, 5 section settings, 7 container settings + stat_item blocks',
    textElements: [
      { prefix: 'heading', label: 'Heading', tag: 'h2', defaults: { family: 'font-primary', sizeMobile: 'text-2xl', sizeDesktop: 'lg:text-3xl', weight: 'font-bold', color: 'text-primary', content: 'By the Numbers' } },
    ],
    html: (te, btn) => `${te[0]}

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-lg">
      {% for block in section.blocks %}
        {% if block.type == 'stat_item' %}
        <div {{ block.fluid_attributes }} class="stat-item text-center">
${blockTextElement('div', 'value', 'Value', '99%')}

${blockTextElement('div', 'label', 'Label', 'Success Rate')}
        </div>
        {% endif %}
      {% endfor %}
    </div>
${btn}`,
    blocks: [{
      type: 'stat_item',
      name: 'Stat Item',
      settings: [
        blockTextSettings('value', 'Value', { content: '99%', family: 'font-primary', sizeMobile: 'text-3xl', sizeDesktop: 'lg:text-5xl', weight: 'font-bold', color: 'text-accent' }),
        blockTextSettings('label', 'Label', { content: 'Success Rate', family: 'font-body', sizeMobile: 'text-sm', sizeDesktop: 'lg:text-base', weight: 'font-normal', color: 'text-secondary' }),
      ]
    }]
  },

  'faq-accordion': {
    name: 'FAQ Accordion',
    category: 'Content',
    annotations: [
      'FIXED: Section wrapper with utility class application from schema settings',
      'FIXED: Container wrapper with full 7-setting customization',
      'FLEXIBLE: Heading text content and all typography settings',
      'FLEXIBLE: FAQ item blocks with question and answer text',
      'OPTIONAL: Heading (conditionally rendered)',
    ],
    description: 'Gold Standard compliant -- 1 text element, 1 button, 5 section settings, 7 container settings + faq_item blocks',
    textElements: [
      { prefix: 'heading', label: 'Heading', tag: 'h2', defaults: { family: 'font-primary', sizeMobile: 'text-2xl', sizeDesktop: 'lg:text-3xl', weight: 'font-bold', color: 'text-primary', content: 'Frequently Asked Questions' } },
    ],
    html: (te, btn) => `${te[0]}

    <div class="faq-list">
      {% for block in section.blocks %}
        {% if block.type == 'faq_item' %}
        <details {{ block.fluid_attributes }} class="faq-item">
          <summary class="{{ block.settings.question_font_family | default: 'font-primary' }} {{ block.settings.question_font_size | default: 'text-lg' }} {{ block.settings.question_font_size_desktop | default: 'lg:text-xl' }} {{ block.settings.question_font_weight | default: 'font-semibold' }} {{ block.settings.question_color | default: 'text-primary' }}">
            {{ block.settings.question | default: 'Question goes here' }}
          </summary>
          <div class="{{ block.settings.answer_font_family | default: 'font-body' }} {{ block.settings.answer_font_size | default: 'text-base' }} {{ block.settings.answer_font_size_desktop | default: 'lg:text-base' }} {{ block.settings.answer_font_weight | default: 'font-normal' }} {{ block.settings.answer_color | default: 'text-secondary' }}">
            {{ block.settings.answer | default: 'Answer goes here.' }}
          </div>
        </details>
        {% endif %}
      {% endfor %}
    </div>
${btn}`,
    blocks: [{
      type: 'faq_item',
      name: 'FAQ Item',
      settings: [
        blockTextSettings('question', 'Question', { content: 'What is your product?', family: 'font-primary', sizeMobile: 'text-lg', sizeDesktop: 'lg:text-xl', weight: 'font-semibold', color: 'text-primary' }),
        blockTextSettings('answer', 'Answer', { inputType: 'textarea', content: 'Our product helps businesses grow.', family: 'font-body', sizeMobile: 'text-base', sizeDesktop: 'lg:text-base', weight: 'font-normal', color: 'text-secondary' }),
      ]
    }]
  },

  'logo-showcase': {
    name: 'Logo Showcase',
    category: 'Social Proof',
    annotations: [
      'FIXED: Section wrapper with utility class application from schema settings',
      'FIXED: Container wrapper with full 7-setting customization',
      'FLEXIBLE: Heading text content and all typography settings',
      'FLEXIBLE: Logo item blocks with image, alt text, and link URL',
      'OPTIONAL: Heading, grayscale toggle (conditionally rendered)',
    ],
    description: 'Gold Standard compliant -- 1 text element, 1 button, 5 section settings, 7 container settings + logo_item blocks',
    textElements: [
      { prefix: 'heading', label: 'Heading', tag: 'h2', defaults: { family: 'font-primary', sizeMobile: 'text-xl', sizeDesktop: 'lg:text-2xl', weight: 'font-bold', color: 'text-primary', content: 'Trusted By' } },
    ],
    html: (te, btn) => `${te[0]}

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-lg items-center">
      {% for block in section.blocks %}
        {% if block.type == 'logo_item' %}
        <div {{ block.fluid_attributes }} class="logo-item{% if section.settings.grayscale %} grayscale{% endif %}">
          {% if block.settings.link_url != blank %}
          <a href="{{ block.settings.link_url }}">
          {% endif %}

          {% if block.settings.image %}
          <img src="{{ block.settings.image | image_url }}" alt="{{ block.settings.alt_text | default: 'Partner logo' }}" loading="lazy" />
          {% endif %}

          {% if block.settings.link_url != blank %}
          </a>
          {% endif %}
        </div>
        {% endif %}
      {% endfor %}
    </div>
${btn}`,
    extraSettings: `    {
      "type": "checkbox",
      "id": "grayscale",
      "label": "Grayscale Logos",
      "default": true
    }`,
    blocks: [{
      type: 'logo_item',
      name: 'Logo Item',
      settings: [
        `        {
          "type": "image_picker",
          "id": "image",
          "label": "Logo Image"
        },
        {
          "type": "text",
          "id": "alt_text",
          "label": "Alt Text",
          "default": "Partner logo"
        },
        {
          "type": "url",
          "id": "link_url",
          "label": "Link URL",
          "default": ""
        }`
      ]
    }]
  },

  'pricing': {
    name: 'Pricing',
    category: 'Commerce',
    annotations: [
      'FIXED: Section wrapper with utility class application from schema settings',
      'FIXED: Container wrapper with full 7-setting customization',
      'FLEXIBLE: Heading, subheading text content and all typography settings',
      'FLEXIBLE: Pricing tier blocks with name, price, period, features, CTA button',
      'OPTIONAL: Subheading, highlighted tier (conditionally rendered)',
    ],
    description: 'Gold Standard compliant -- 2 text elements, 1 button, 5 section settings, 7 container settings + pricing_tier blocks',
    textElements: [
      { prefix: 'heading', label: 'Heading', tag: 'h2', defaults: { family: 'font-primary', sizeMobile: 'text-2xl', sizeDesktop: 'lg:text-3xl', weight: 'font-bold', color: 'text-primary', content: 'Pricing Plans' } },
      { prefix: 'subheading', label: 'Subheading', tag: 'p', defaults: { family: 'font-body', sizeMobile: 'text-lg', sizeDesktop: 'lg:text-xl', weight: 'font-normal', color: 'text-secondary', content: '' } },
    ],
    html: (te, btn) => `${te[0]}
${te[1]}

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
      {% for block in section.blocks %}
        {% if block.type == 'pricing_tier' %}
        <div {{ block.fluid_attributes }} class="pricing-card{% if block.settings.highlighted %} highlighted{% endif %}">
${blockTextElement('h3', 'name', 'Plan Name', 'Basic')}

${blockTextElement('div', 'price', 'Price', '$29')}

${blockTextElement('div', 'period', 'Period', '/month')}

          {% if block.settings.features != blank %}
          <div class="features-list {{ block.settings.features_font_family | default: 'font-body' }} {{ block.settings.features_font_size | default: 'text-sm' }} {{ block.settings.features_font_size_desktop | default: 'lg:text-base' }} {{ block.settings.features_font_weight | default: 'font-normal' }} {{ block.settings.features_color | default: 'text-secondary' }}">
            {{ block.settings.features }}
          </div>
          {% endif %}

${blockTextElement('span', 'cta_text', 'CTA Text', 'Get Started')}
        </div>
        {% endif %}
      {% endfor %}
    </div>
${btn}`,
    blocks: [{
      type: 'pricing_tier',
      name: 'Pricing Tier',
      settings: [
        `        {
          "type": "checkbox",
          "id": "highlighted",
          "label": "Highlighted Tier",
          "default": false
        }`,
        blockTextSettings('name', 'Plan Name', { content: 'Basic', family: 'font-primary', sizeMobile: 'text-xl', sizeDesktop: 'lg:text-2xl', weight: 'font-bold', color: 'text-primary' }),
        blockTextSettings('price', 'Price', { content: '$29', family: 'font-primary', sizeMobile: 'text-3xl', sizeDesktop: 'lg:text-4xl', weight: 'font-bold', color: 'text-accent' }),
        blockTextSettings('period', 'Period', { content: '/month', family: 'font-body', sizeMobile: 'text-sm', sizeDesktop: 'lg:text-base', weight: 'font-normal', color: 'text-secondary' }),
        blockTextSettings('features', 'Features', { inputType: 'textarea', content: 'Feature 1\\nFeature 2\\nFeature 3', family: 'font-body', sizeMobile: 'text-sm', sizeDesktop: 'lg:text-base', weight: 'font-normal', color: 'text-secondary' }),
        blockTextSettings('cta_text', 'CTA Text', { content: 'Get Started', family: 'font-primary', sizeMobile: 'text-base', sizeDesktop: 'lg:text-base', weight: 'font-semibold', color: 'text-accent' }),
      ]
    }]
  },

  'content-richtext': {
    name: 'Content Richtext',
    category: 'Content',
    annotations: [
      'FIXED: Section wrapper with utility class application from schema settings',
      'FIXED: Container wrapper with full 7-setting customization',
      'FLEXIBLE: Heading text content and all typography settings',
      'FLEXIBLE: Rich text body content (WYSIWYG-friendly)',
      'OPTIONAL: Heading, button (conditionally rendered)',
    ],
    description: 'Gold Standard compliant -- 2 text elements, 1 button, 5 section settings, 7 container settings',
    textElements: [
      { prefix: 'heading', label: 'Heading', tag: 'h2', defaults: { family: 'font-primary', sizeMobile: 'text-2xl', sizeDesktop: 'lg:text-3xl', weight: 'font-bold', color: 'text-primary', content: 'Content Section' } },
      { prefix: 'body', label: 'Body Text', tag: 'div', defaults: { inputType: 'richtext', family: 'font-body', sizeMobile: 'text-base', sizeDesktop: 'lg:text-lg', weight: 'font-normal', color: 'text-primary', content: '' } },
    ],
    html: (te, btn) => `${te[0]}
${te[1]}
${btn}`,
  },

  'video': {
    name: 'Video',
    category: 'Media',
    annotations: [
      'FIXED: Section wrapper with utility class application from schema settings',
      'FIXED: Container wrapper with full 7-setting customization',
      'FLEXIBLE: Heading, body text content and all typography settings',
      'FLEXIBLE: Video URL setting for YouTube/Vimeo embed',
      'OPTIONAL: Heading, body text, overlay text (conditionally rendered)',
    ],
    description: 'Gold Standard compliant -- 2 text elements, 1 button, 5 section settings, 7 container settings + video_url',
    textElements: [
      { prefix: 'heading', label: 'Heading', tag: 'h2', defaults: { family: 'font-primary', sizeMobile: 'text-2xl', sizeDesktop: 'lg:text-3xl', weight: 'font-bold', color: 'text-primary', content: 'Watch the Video' } },
      { prefix: 'body', label: 'Body Text', tag: 'div', defaults: { inputType: 'textarea', family: 'font-body', sizeMobile: 'text-base', sizeDesktop: 'lg:text-lg', weight: 'font-normal', color: 'text-primary', content: '' } },
    ],
    html: (te, btn) => `${te[0]}

    {% if section.settings.video_url != blank %}
    <div class="video-wrapper aspect-video">
      {% if section.settings.video_url contains 'youtube' or section.settings.video_url contains 'youtu.be' %}
      <iframe src="{{ section.settings.video_url }}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
      {% elsif section.settings.video_url contains 'vimeo' %}
      <iframe src="{{ section.settings.video_url }}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>
      {% endif %}
    </div>
    {% endif %}

${te[1]}
${btn}`,
    extraSettings: `    {
      "type": "header",
      "content": "Video"
    },
    {
      "type": "text",
      "id": "video_url",
      "label": "Video URL (YouTube or Vimeo)",
      "default": ""
    }`,
  },

  'newsletter': {
    name: 'Newsletter',
    category: 'Lead Capture',
    annotations: [
      'FIXED: Section wrapper with utility class application from schema settings',
      'FIXED: Container wrapper with full 7-setting customization',
      'FLEXIBLE: Heading, body text content and all typography settings',
      'FLEXIBLE: Form placeholder with email input and submit button',
      'OPTIONAL: Body text, privacy text (conditionally rendered)',
    ],
    description: 'Gold Standard compliant -- 2 text elements, 1 button, 5 section settings, 7 container settings + form',
    textElements: [
      { prefix: 'heading', label: 'Heading', tag: 'h2', defaults: { family: 'font-primary', sizeMobile: 'text-2xl', sizeDesktop: 'lg:text-3xl', weight: 'font-bold', color: 'text-primary', content: 'Stay Updated' } },
      { prefix: 'body', label: 'Body Text', tag: 'div', defaults: { inputType: 'textarea', family: 'font-body', sizeMobile: 'text-base', sizeDesktop: 'lg:text-lg', weight: 'font-normal', color: 'text-secondary', content: '' } },
    ],
    html: (te, btn) => `${te[0]}
${te[1]}

    <form class="newsletter-form" action="#" method="POST">
      <div class="form-group">
        <input type="email" name="email" placeholder="{{ section.settings.placeholder_text | default: 'Enter your email' }}" required />

        {% if section.settings.show_button %}
        <button type="submit"
          class="btn btn-{{ section.settings.button_style | default: 'filled' }}-{{ section.settings.button_color | default: 'primary' }} {{ section.settings.button_size | default: 'btn-md' }} {{ section.settings.button_font_weight | default: 'font-medium' }}">
          {{ section.settings.button_text | default: 'Subscribe' }}
        </button>
        {% endif %}
      </div>
    </form>

    {% if section.settings.privacy_text != blank %}
    <p class="{{ section.settings.privacy_text_font_family | default: 'font-body' }} {{ section.settings.privacy_text_font_size | default: 'text-xs' }} {{ section.settings.privacy_text_font_size_desktop | default: 'lg:text-xs' }} {{ section.settings.privacy_text_font_weight | default: 'font-normal' }} {{ section.settings.privacy_text_color | default: 'text-muted' }}">
      {{ section.settings.privacy_text }}
    </p>
    {% endif %}`,
    extraSettings: `    {
      "type": "header",
      "content": "Form"
    },
    {
      "type": "text",
      "id": "placeholder_text",
      "label": "Email Placeholder",
      "default": "Enter your email"
    }`,
    extraTextElements: [
      { prefix: 'privacy_text', label: 'Privacy Text', defaults: { family: 'font-body', sizeMobile: 'text-xs', sizeDesktop: 'lg:text-xs', weight: 'font-normal', color: 'text-muted', content: '' } },
    ],
    // Newsletter uses inline button in form, so don't render standard button block
    skipStandardButton: true,
  },
};

// Generate each section
const outDir = path.join(__dirname);

for (const [slug, config] of Object.entries(sections)) {
  const cssClass = slug;

  // Build text element HTML
  const teHtml = config.textElements.map(te => {
    const d = te.defaults;
    return `
    {% if section.settings.${te.prefix} != blank %}
    <${te.tag} class="{{ section.settings.${te.prefix}_font_family | default: '${d.family}' }} {{ section.settings.${te.prefix}_font_size | default: '${d.sizeMobile}' }} {{ section.settings.${te.prefix}_font_size_desktop | default: '${d.sizeDesktop}' }} {{ section.settings.${te.prefix}_font_weight | default: '${d.weight}' }} {{ section.settings.${te.prefix}_color | default: '${d.color}' }}">
      {{ section.settings.${te.prefix} | default: '${d.content}' }}
    </${te.tag}>
    {% endif %}`;
  });

  const btnHtml = config.skipStandardButton ? '' : buttonBlock();
  const bodyHtml = config.html(teHtml, btnHtml);

  // Build settings JSON
  const teSettings = config.textElements.map(te =>
    textElementSettings(te.prefix, te.label, te.defaults)
  ).join(',\n');

  const extraTeSettings = (config.extraTextElements || []).map(te =>
    textElementSettings(te.prefix, te.label, te.defaults)
  ).join(',\n');

  const btnJson = buttonSettings();
  const extraJson = config.extraSettings || '';
  const sectionJson = sectionSettings();
  const containerJson = containerSettings();

  const settingsParts = [teSettings];
  if (extraTeSettings) settingsParts.push(extraTeSettings);
  settingsParts.push(btnJson);
  if (extraJson) settingsParts.push(extraJson);
  settingsParts.push(sectionJson);
  settingsParts.push(containerJson);

  // Build blocks JSON
  let blocksJson = '';
  if (config.blocks && config.blocks.length > 0) {
    const blockDefs = config.blocks.map(block => {
      const blockSettingsStr = block.settings.join(',\n');
      return `    {
      "type": "${block.type}",
      "name": "${block.name}",
      "settings": [
${blockSettingsStr}
      ]
    }`;
    });
    blocksJson = `,
  "blocks": [
${blockDefs.join(',\n')}
  ]`;
  }

  const annotations = config.annotations.map(a => `<!-- ${a} -->`).join('\n');

  const bgDefault = config.bgDefault || 'bg-neutral';

  const template = `${annotations}

<!-- ${config.name} Section -->
<!-- ${config.description} -->

${sectionWrapper(cssClass).replace("'bg-neutral'", `'${bgDefault}'`)}

${containerOpen()}

${bodyHtml}

  </div>
</section>
${styleTag(cssClass)}

{% schema %}
{
  "name": "${config.name}",
  "tag": "section",
  "class": "section-${cssClass}",
  "settings": [
${settingsParts.join(',\n')}
  ]${blocksJson},
  "presets": [
    {
      "name": "${config.name}",
      "category": "${config.category}"
    }
  ]
}
{% endschema %}
`;

  const outFile = path.join(outDir, `${slug}.liquid`);
  fs.writeFileSync(outFile, template, 'utf-8');
  console.log(`Generated: ${slug}.liquid`);
}

console.log(`\nDone. Generated ${Object.keys(sections).length} section templates.`);
