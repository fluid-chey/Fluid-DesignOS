# Design Components — Inline Pattern Library

This file is the **copy-paste reference** for building Instagram archetype HTML/CSS. Each component section includes:
1. Purpose and archetype usage
2. HTML snippet with placeholder content
3. CSS rules (positioned for a 1080×1080 canvas)
4. Corresponding SlotSchema field definition

**Key rule:** Components are patterns, not runtime includes. Copy the markup structure and CSS into your archetype's `index.html` and `<style>` block directly. There is no import or partial system.

---

## What is a Component?

A design component is a mid-level functional block — a meaningful content unit that appears in multiple archetype layouts. Components sit between atomic elements (a text label) and full archetypes (a complete 1080×1080 layout).

**A component is independently meaningful to a user.** "Add a stat card" makes sense. "Add a text label" does not.

---

## Component Index

Components with a directory in `archetypes/components/` have a `pattern.html` and `README.md`. Components marked *(inline only)* are documented in this file but have no standalone directory.

| Component | Directory | Used by archetypes |
|-----------|-----------|-------------------|
| stat-card | `stat-card/` | hero-stat, hero-stat-split, data-dashboard, stat-hero-single |
| image-block | `image-block/` | photo-bg-overlay, split-photo-text, split-photo-quote, hero-stat-split, minimal-photo-top |
| quote-block | `quote-block/` | quote-testimonial, split-photo-quote |
| eyebrow-headline | `eyebrow-headline/` | hero-stat, hero-stat-split, data-dashboard-li |
| body-text | `body-text/` | hero-stat, split-photo-text, hero-stat-split, stat-hero-single |
| avatar-attribution | `avatar-attribution/` | quote-testimonial-li |
| cta-pill | `cta-pill/` | *(not yet used — available for future archetypes)* |
| metric-row | `metric-row/` | *(not yet used — available for future archetypes)* |
| headline-block | *(inline only)* | most archetypes (`.headline` class) |
| subtext-block | *(inline only)* | photo-bg-overlay, minimal-statement, minimal-photo-top |
| portrait-block | *(inline only)* | quote-testimonial, split-photo-quote |
| attribution-block | *(inline only)* | quote-testimonial, split-photo-quote |
| footnote-block | *(inline only)* | data-dashboard |
| divider | *(inline only)* | data-dashboard |
| background-layer / foreground-layer | *(inline only)* | All archetypes |

---

## 1. stat-card

**Purpose:** Large stat number + supporting label. The primary pattern for posts that lead with a compelling metric.

**Used by:** hero-stat, data-dashboard

**HTML:**

```html
<!-- SLOT: stat-number -->
<div class="stat-number">94%</div>

<!-- SLOT: stat-label -->
<div class="stat-label">Approval rate across all PSPs</div>
```

**CSS:**

```css
.stat-number {
  position: absolute;
  top: 280px;
  left: 68px;
  font-family: sans-serif;
  font-size: 260px;
  font-weight: 900;
  line-height: 0.85;
  color: #ffffff;
}

.stat-label {
  position: absolute;
  top: 570px;
  left: 68px;
  font-family: sans-serif;
  font-size: 28px;
  font-weight: 400;
  line-height: 1.3;
  color: rgba(255, 255, 255, 0.45);
  max-width: 700px;
}
```

**SlotSchema fields:**

```json
{ "type": "text", "sel": ".stat-number", "label": "Stat Value",  "mode": "text", "rows": 1 },
{ "type": "text", "sel": ".stat-label",  "label": "Stat Label",  "mode": "text", "rows": 2 }
```

---

## 2. image-block

**Purpose:** Photo container with `<img>` element. Supports full-bleed and partial-fill layouts.

**Used by:** photo-bg-overlay, split-photo-text, quote-testimonial

**HTML:**

```html
<!-- SLOT: photo -->
<div class="photo">
  <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="">
</div>
```

**CSS (full-bleed variant — photo-bg-overlay):**

```css
.photo {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
```

**CSS (half-width variant — split-photo-text):**

```css
.photo {
  position: absolute;
  top: 0;
  left: 0;
  width: 540px;
  height: 1080px;
  overflow: hidden;
}

.photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
```

**SlotSchema field:**

```json
{ "type": "image", "sel": ".photo img", "label": "Photo", "dims": "1080 x 1080px" }
```

---

## 3. quote-block

**Purpose:** Styled quotation text. Multi-line, italic or bold emphasis.

**Used by:** quote-testimonial

**HTML:**

```html
<!-- SLOT: quote-text -->
<div class="quote-text">"This changed how we think about payment reliability entirely."</div>
```

**CSS:**

```css
.quote-text {
  position: absolute;
  top: 300px;
  left: 68px;
  right: 68px;
  font-family: sans-serif;
  font-size: 48px;
  font-weight: 700;
  font-style: italic;
  line-height: 1.3;
  color: #ffffff;
}
```

**SlotSchema field:**

```json
{ "type": "text", "sel": ".quote-text", "label": "Quote", "mode": "pre", "rows": 5 }
```

---

## 4. eyebrow-headline

**Purpose:** A small category label above a large headline — the standard opening structure for posts with a strong main statement. See `eyebrow-headline/` directory for the standalone pattern.

**Used by:** hero-stat, hero-stat-split, data-dashboard-li

**HTML:**

```html
<!-- SLOT: headline -->
<div class="headline">Headline goes here</div>
```

**CSS:**

```css
.headline {
  position: absolute;
  top: 400px;
  left: 68px;
  right: 68px;
  font-family: sans-serif;
  font-size: 82px;
  font-weight: 900;
  line-height: 0.95;
  color: #ffffff;
}
```

**SlotSchema field:**

```json
{ "type": "text", "sel": ".headline", "label": "Headline", "mode": "pre", "rows": 3 }
```

---

## 5. headline-block

**Purpose:** Primary headline text. The dominant typographic element in non-stat layouts. Nearly every archetype uses a `.headline` class.

**Used by:** most archetypes

**HTML:**

```html
<!-- SLOT: subtext -->
<div class="subtext">Supporting context that explains what the number means and why it matters.</div>
```

**CSS:**

```css
.subtext {
  position: absolute;
  top: 680px;
  left: 68px;
  right: 68px;
  font-family: sans-serif;
  font-size: 28px;
  font-weight: 400;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.45);
}
```

**SlotSchema field:**

```json
{ "type": "text", "sel": ".subtext", "label": "Supporting Text", "mode": "pre", "rows": 4 }
```

---

## 6. body-text

**Purpose:** Body copy block for 1-3 sentences of supporting explanation. See `body-text/` directory for the standalone pattern.

**Used by:** hero-stat, split-photo-text, hero-stat-split, stat-hero-single

**HTML:**

```html
<!-- SLOT: body-copy -->
<div class="body-copy">Body copy goes here. Two to three sentences that explain the content in detail and give readers enough context to understand the significance.</div>
```

**CSS:**

```css
.body-copy {
  position: absolute;
  top: 500px;
  left: 580px;
  right: 68px;
  font-family: sans-serif;
  font-size: 24px;
  font-weight: 400;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.45);
}
```

**SlotSchema field:**

```json
{ "type": "text", "sel": ".body-copy", "label": "Body Copy", "mode": "pre", "rows": 5 }
```

---

## 7. subtext-block

**Purpose:** Supporting copy below a stat or headline. Short explanatory sentences.

**Used by:** photo-bg-overlay, minimal-statement, minimal-photo-top

**HTML:**

```html
<!-- SLOT: attribution -->
<div class="attribution">Jane Smith
Head of Engineering</div>
```

**CSS:**

```css
.attribution {
  position: absolute;
  top: 820px;
  left: 68px;
  font-family: sans-serif;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.7);
  white-space: pre-line;
}
```

**SlotSchema field:**

```json
{ "type": "text", "sel": ".attribution", "label": "Attribution", "mode": "pre", "rows": 2 }
```

---

## 8. avatar-attribution

**Purpose:** Small photo paired with name, title, and optional handle — the attribution block for posts featuring a real person. See `avatar-attribution/` directory for the standalone pattern.

**Used by:** quote-testimonial-li

**HTML:**

```html
<!-- SLOT: avatar -->
<div class="avatar">
  <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="">
</div>
<!-- SLOT: avatar-name -->
<div class="avatar-name">Michael Torres</div>
<!-- SLOT: avatar-title -->
<div class="avatar-title">VP of Marketing, Acme Corp</div>
```

**CSS:**

```css
.avatar {
  position: absolute;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-name {
  position: absolute;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
}

.avatar-title {
  position: absolute;
  font-size: 16px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
}
```

**SlotSchema fields:**

```json
{ "type": "image", "sel": ".avatar img",    "label": "Photo",  "dims": "64 x 64px" },
{ "type": "text",  "sel": ".avatar-name",   "label": "Name",   "mode": "text", "rows": 1 },
{ "type": "text",  "sel": ".avatar-title",  "label": "Title",  "mode": "text", "rows": 1 }
```

---

## 9. portrait-block

**Purpose:** Circular portrait image. Used in testimonial and quote layouts.

**Used by:** quote-testimonial, split-photo-quote

**HTML:**

```html
<!-- SLOT: portrait -->
<div class="portrait">
  <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="">
</div>
```

**CSS:**

```css
.portrait {
  position: absolute;
  top: 780px;
  left: 68px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
```

**SlotSchema field:**

```json
{ "type": "image", "sel": ".portrait img", "label": "Portrait Photo", "dims": "120 x 120px" }
```

---

## 10. attribution-block

**Purpose:** Name and title/role for testimonials and split layouts.

**Used by:** quote-testimonial, split-photo-quote

**HTML:**

```html
<!-- SLOT: attribution -->
<div class="attribution">Jane Smith
Head of Engineering</div>
```

**CSS:**

```css
.attribution {
  position: absolute;
  top: 820px;
  left: 68px;
  font-family: sans-serif;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.7);
  white-space: pre-line;
}
```

**SlotSchema field:**

```json
{ "type": "text", "sel": ".attribution", "label": "Attribution", "mode": "pre", "rows": 2 }
```

---

## 11. footnote-block

**Purpose:** Small context or source attribution at the bottom of data-heavy layouts.

**Used by:** data-dashboard

**HTML:**

```html
<!-- SLOT: footnote -->
<div class="footnote">Source: Internal analytics, Q4 2024 • All metrics verified</div>
```

**CSS:**

```css
.footnote {
  position: absolute;
  bottom: 60px;
  left: 68px;
  right: 68px;
  font-family: sans-serif;
  font-size: 18px;
  font-weight: 400;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.35);
}
```

**SlotSchema field:**

```json
{ "type": "text", "sel": ".footnote", "label": "Footnote", "mode": "pre", "rows": 2 }
```

---

## 12. cta-pill

**Purpose:** Call-to-action or tagline element — a pill-shaped container with primary action text and optional subtext. See `cta-pill/` directory for the standalone pattern.

**Used by:** *(not yet used — available for future archetypes)*

**HTML:**

```html
<!-- SLOT: cta-text -->
<div class="cta-text">Learn more</div>
<!-- SLOT: cta-sub -->
<div class="cta-sub">Available now</div>
```

**CSS:**

```css
.cta-text {
  position: absolute;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 40px;
  padding: 12px 32px;
}

.cta-sub {
  position: absolute;
  font-size: 16px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
}
```

**SlotSchema fields:**

```json
{ "type": "text", "sel": ".cta-text", "label": "CTA Text",    "mode": "text", "rows": 1 },
{ "type": "text", "sel": ".cta-sub",  "label": "CTA Subtext", "mode": "text", "rows": 1 }
```

---

## 13. metric-row

**Purpose:** Horizontal row with label, value, and optional descriptor — the building block for posts presenting multiple metrics in a structured list. See `metric-row/` directory for the standalone pattern.

**Used by:** *(not yet used — available for future archetypes)*

**HTML:**

```html
<!-- SLOT: metric-label -->
<div class="metric-label">Response time</div>
<!-- SLOT: metric-value -->
<div class="metric-value">47ms</div>
<!-- SLOT: metric-desc -->
<div class="metric-desc">P99 across all endpoints</div>
```

**CSS:**

```css
.metric-label {
  font-size: 18px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
}

.metric-value {
  font-size: 48px;
  font-weight: 900;
  color: #ffffff;
}

.metric-desc {
  font-size: 16px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.4);
}
```

**SlotSchema fields:**

```json
{ "type": "text", "sel": ".metric-label", "label": "Label",       "mode": "text", "rows": 1 },
{ "type": "text", "sel": ".metric-value", "label": "Value",       "mode": "text", "rows": 1 },
{ "type": "text", "sel": ".metric-desc",  "label": "Description", "mode": "text", "rows": 1 }
```

---

## 14. background-layer / foreground-layer

**Purpose:** Two empty containers that bracket content for brand decorative injection. Present in ALL archetypes. The pipeline injects brand elements into these layers at generation time.

**Used by:** All archetypes

- `.background-layer` — first element in `<body>` (`z-index: 0`). Receives textures, brushstrokes, gradient washes, background imagery.
- `.foreground-layer` — last element in `<body>` (`z-index: 10`). Receives borders, frames, header/footer bars, watermarks.

Content elements sit between them at `z-index: 2`.

**HTML:**

```html
<body>
  <!-- BACKGROUND LAYER: brand fills with textures, brushstrokes -->
  <div class="background-layer"></div>

  <!-- ... content elements ... -->

  <!-- FOREGROUND LAYER: brand fills with borders (footer, header, etc.) -->
  <div class="foreground-layer"></div>
</body>
```

**CSS:**

```css
.background-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.foreground-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}
```

**No SlotSchema field.** These layers are filled by the pipeline, not by the editor.

---

## 15. divider

**Purpose:** Visual separator between data rows in multi-stat layouts.

**Used by:** data-dashboard

**HTML:**

```html
<div class="divider"></div>
```

**CSS:**

```css
.divider {
  position: absolute;
  left: 68px;
  right: 68px;
  height: 1px;
  background: rgba(255, 255, 255, 0.12);
}
```

**SlotSchema field:**

```json
{ "type": "divider", "label": "Section Break" }
```

---

## Future Components

The following components are not yet implemented. Listed for future reference.

| Component | Description |
|-----------|-------------|
| chart-bar | Horizontal bar chart for comparison layouts |
| event-details | Date + time + location block for event posts |
| badge | Icon + label badge (e.g., "Award Winner") |
| logo-lockup | Company logo + name treatment |
| product-shot-frame | Product mockup frame with device or print context |

---

## Conventions Summary

- All content elements use `position: absolute` with explicit `px` values
- Default left/right margin: `68px` from canvas edge
- Neutral text colors: `#ffffff` (primary), `rgba(255,255,255,0.45)` (secondary)
- `font-family: sans-serif` — brand font applied at generation time
- Numeric font weights only (`700`, `900`) — no named weights like `bold`
- Placeholder images use base64 data URIs — no external URLs
- `.background-layer` is always the first element in `<body>`, `.foreground-layer` is always the last — both unstyled beyond `position: absolute; inset: 0`
