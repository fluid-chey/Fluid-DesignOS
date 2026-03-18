Two distinct palettes: Social and Website. Never cross-pollinate.

## Accent Colors (weight: 95)

One accent color per design. Used across all contexts — social, website, presentations.

| Color | Hex | Usage |
|-------|-----|-------|
| Orange | #FF8B58 | Urgency, pain, warning, CTAs |
| Blue | #42b1ff | Technical, intelligence, trust, links |
| Green | #44b574 | Success, solution, proof |
| Purple | #c985e5 | Premium, financial, analytical |

```css
/* Brand Accent Colors — pick ONE per design */
:root {
  --clr-orange: #FF8B58;
  --clr-blue: #42b1ff;
  --clr-green: #44b574;
  --clr-purple: #c985e5;
}
```

## Neutrals (weight: 90)

| Color | Hex | Usage |
|-------|-----|-------|
| Black | #000000 | Social backgrounds (pure black) |
| Near-black | #050505 | Website backgrounds |
| Section bg | #111 / #161616 | Section fills |
| White | #ffffff | Primary text |
| Warm white | #f5f0e8 | Body text (warm off-white) |
| Secondary | #888888 | Supporting text |

### RGBA Overlay Patterns

| Value | Usage | Weight |
|-------|-------|--------|
| `rgba(255,255,255,0.45)` | Body copy | 85 |
| `rgba(255,255,255,0.25)` | Dimmed/secondary | 80 |
| `rgba(255,255,255,0.03)` | Card backgrounds | 80 |
| `rgba(255,255,255,0.06)` | Card borders | 75 |
| `#1a1a1a` / `#222` | Borders/dividers | 75 |

```css
/* Neutrals — backgrounds, text, overlays */
:root {
  --clr-bg: #000;             /* Social: pure black */
  --clr-bg-page: #050505;     /* Website: near-black */
  --clr-bg-section: #111;     /* Section fills */
  --clr-text: #ffffff;        /* Primary text */
  --clr-text-warm: #f5f0e8;   /* Body text (warm) */
  --clr-text-secondary: #888; /* Supporting text */
  --clr-border: #1a1a1a;      /* Borders, dividers */
}
.body-copy    { color: rgba(255,255,255,0.45); }  /* Weight: 85 */
.dimmed       { color: rgba(255,255,255,0.25); }  /* Weight: 80 */
.card         { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }
```
