# Design Tokens — Styling Agent Context

> Weight thresholds: 1-20 optional | 21-50 flexible | 51-80 strong preference | 81-100 brand-critical

## Color Systems

The brand uses TWO distinct color palettes depending on context. Never mix them.

### Social Post Palette (Weight: 95)

| Color | Hex | Mood | Best For |
|-------|-----|------|----------|
| Orange | `#FF8B58` | Urgency, pain, warning | Problem-first posts, cost/loss angles |
| Blue | `#42b1ff` | Technical, intelligence, trust | Manifesto quotes, architectural concepts |
| Green | `#44b574` | Success, solution, proof | Stats, outcomes, "after" states |
| Purple | `#c985e5` | Premium, financial, analytical | Data/math posts, CFO-facing content |

**One accent color per post (Weight: 95)** — never mix accent colors within a single design. Pick one and use it everywhere: headline accents, circle sketches, FLFont labels, diagram highlights, pills, taglines.

**Background: `#000` pure black (Weight: 95)** — not `#191919`, not dark gray. Pure black for contrast in feeds.

**Text primary: `#ffffff` (Weight: 90)**

**Body copy: `rgba(255,255,255,0.45)` (Weight: 85)**

**Dimmed/secondary: `rgba(255,255,255,0.25)` (Weight: 80)**

**Card backgrounds: `rgba(255,255,255,0.03)` (Weight: 80)**

**Card borders: `rgba(255,255,255,0.06)` (Weight: 75)**

### Website Palette (Weight: 90)

| Color | Hex | Usage |
|-------|-----|-------|
| Background primary | `#050505` / `#0a0a0a` | Page background |
| Background mid | `#111` / `#161616` | Section backgrounds |
| Text primary | `#f5f0e8` | Warm off-white body text |
| Accent orange | `#FF5500` | Action, urgency, emphasis, CTAs |
| Accent blue | `#00AAFF` | Navigation, technical, links |
| Accent green | `#00E87A` | Success, confirmation |
| Text secondary | `#888` | Supporting text |
| Borders/dividers | `#1a1a1a` / `#222` | Grid lines, separators |

Note: Website orange is `#FF5500` (deeper) vs social orange `#FF8B58` (warmer). Both map to urgency/pain. See [voice-rules.md](voice-rules.md) for color-to-emotion context in copy.

## Font System

| Display Name | CSS font-family | Actual File | Usage | Weight: |
|-------------|----------------|-------------|-------|---------|
| FLFont Bold | `flfontbold` | `assets/fonts/flfontbold.ttf` | Taglines, emphasis, handwritten accent | 95 |
| NeueHaasDisplay | `NeueHaas` | `assets/fonts/Inter-VariableFont.ttf` (dev proxy) | Headlines, body (social) — Black 900, Bold 700, Medium 500, Light 300 | 90 |
| Inter | `Inter` | `assets/fonts/Inter-VariableFont.ttf` | Body text, UI text | 80 |
| Syne | `Syne` | (web font) | Display/headline on website — ExtraBold 800 | 90 |
| DM Sans | `DM Sans` | (web font) | Body copy on website | 80 |
| Space Mono | `Space Mono` | (web font) | Labels, data, metadata, eyebrow text on website | 75 |

**Social posts use NeueHaasDisplay + FLFont.** Website uses Syne + DM Sans + Space Mono. Do not cross-pollinate without reason.

## Spacing System (Weight: 75)

Social post padding:
- Instagram footer: `padding: 22px 68px` (Weight: 85)
- LinkedIn footer: `padding: 18px 72px` (Weight: 85)

Website spacing uses CSS variables: `var(--space-*)` — never hard-code pixel values.

## Opacity Patterns

| Element | Opacity | Weight: |
|---------|---------|---------|
| Brushstrokes | 0.10-0.25 | 90 |
| Circle sketches | 0.5-0.7 | 85 |
| Side labels | ~0.35 | 70 |
| Slide numbers | ~0.40 | 70 |
| Ghost background text | ~0.04-0.06 | 65 |

## Border Radius (Weight: 60)

Social posts: sharp corners, no border radius. The aesthetic is editorial, not friendly.

Website: uses `var(--radius-*)` CSS variables — 8 options from `rounded-none` to `rounded-3xl`.

## Related Docs

- See [voice-rules.md](voice-rules.md) for how accent colors map to emotional messaging context
- See [social-post-specs.md](social-post-specs.md) for social-specific token usage and typography scale
- See [website-section-specs.md](website-section-specs.md) for CSS variable patterns and utility classes
- See [asset-usage.md](asset-usage.md) for brushstroke opacity and blend mode rules
