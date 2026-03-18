Social = NeueHaasDisplay + FLFont. Website = Syne + DM Sans + Space Mono. Never cross-pollinate.

## Font Mapping

| Display Name | CSS font-family | File | Context | Weight |
|---|---|---|---|---|
| FLFont Bold | `flfontbold` | flfontbold.ttf | Social — taglines | 95 |
| NeueHaasDisplay | `NeueHaas` | Inter-VariableFont.ttf (proxy) | Social — headlines, body | 90 |
| Inter | `Inter` | Inter-VariableFont.ttf | Body, UI text | 80 |
| Syne | `Syne` | (web font) | Website — display/headline | 90 |
| DM Sans | `DM Sans` | (web font) | Website — body copy | 80 |
| Space Mono | `Space Mono` | (web font) | Website — labels, metadata | 75 |

## Social Typography Scale — Instagram

```css
@font-face {
  font-family: 'flfontbold';
  src: url('/api/brand-assets/serve/flfontbold') format('truetype');
  font-weight: 700;
  font-style: normal;
}

@font-face {
  font-family: 'NeueHaas';
  src: url('/api/brand-assets/serve/Inter-VariableFont') format('truetype');
  font-weight: 100 900;
  font-style: normal;
}

/* Instagram headline */
.headline-ig {
  font-family: 'NeueHaas', sans-serif;
  font-weight: 900;
  font-size: 82px;       /* Range: 82-100px */
  line-height: 0.92;
  letter-spacing: -0.03em;
  text-transform: uppercase;
  color: #ffffff;
}

/* Body copy */
.body-copy {
  font-family: 'NeueHaas', sans-serif;
  font-weight: 300;
  font-size: 22px;       /* Range: 22-24px */
  line-height: 1.5;
  color: rgba(255,255,255,0.45);
}

/* Side label (vertical) */
.side-label {
  font-family: 'NeueHaas', sans-serif;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  opacity: 0.35;
  writing-mode: vertical-rl;
}

/* LinkedIn headline */
.headline-li {
  font-family: 'NeueHaas', sans-serif;
  font-weight: 900;
  font-size: 52px;       /* Range: 52-62px */
  line-height: 0.92;
  letter-spacing: -0.03em;
  text-transform: uppercase;
}
```

## FLFont Bold Usage

FLFont is for **taglines and emphasis ONLY** — never body text or headlines.

```css
.flfont-tagline {
  font-family: 'flfontbold', cursive;
  font-size: 26px;       /* Instagram: 26-32px, LinkedIn: 20-24px */
  color: #FF8B58;         /* Replace with post accent color */
  line-height: 1.3;
}
```

## Uppercase Patterns (weight: 90)

All-caps is used selectively. Letter-spacing inverts based on size: large display text gets tight negative tracking, small functional text gets wide positive tracking.

| Element | Letter-Spacing | Size | Notes |
|---|---|---|---|
| Headlines | `-0.03em` (tight) | 82-100px+ | Massive, fills the frame |
| Side labels | `0.15em` (wide) | 11px | Vertical rotated text, ~35% opacity |
| Pills / tags | `0.08em` (wide) | 10px | Small tag elements with card bg + border |
| Context labels | `0.1em` (wide) | 11-18px | Stat descriptions, ~30% opacity |

**NOT uppercase:** Body copy (sentence case), FLFont taglines (sentence case), sub-text callouts (sentence case).

```css
/* Headlines — tight tracking, massive size */
.headline {
  text-transform: uppercase;
  letter-spacing: -0.03em;
  font-weight: 900;
  line-height: 0.92;
}

/* Pills / tags — wide tracking, tiny size */
.pill {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 10px;
  font-weight: 700;
}

/* Context labels — wide tracking, dimmed */
.context-label {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: rgba(255,255,255,0.3);
}

/* Side labels — widest tracking, vertical */
.side-label {
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-size: 11px;
  opacity: 0.35;
  writing-mode: vertical-rl;
}
```
