The handwritten font for the takeaway line. Confidence and personality. (weight: 90)

## Size Guide

| Platform | Size Range | Example |
|----------|-----------|---------|
| Instagram primary | 26-32px | "Every transaction matters." |
| Instagram secondary | 22-26px | "One connection. Zero 3am calls." |
| LinkedIn | 20-24px | "One platform. Every transaction." |

## Tagline Sentence Patterns

| Pattern | Example |
|---------|---------|
| [benefit]. [contrast]. | "One connection. Zero 3am calls." |
| [declaration]. | "Every transaction matters." |
| [scope]. [claim]. | "One platform. Every transaction." |

## Placement Rules

- Below headline or bottom of content, before footer (weight: 80)
- **Never** inside the headline itself
- Color: always the post's accent color
- Sentence case (NOT uppercase)

```css
/* FLFont Tagline Rules:
   - Taglines and emphasis ONLY, never body/headlines (Weight: 90)
   - Below headline, before footer (Weight: 80)
   - Instagram: 26-32px, LinkedIn: 20-24px
   - Color: post accent color
*/

.tagline {
  font-family: 'flfontbold', cursive;
  font-size: 28px;        /* Instagram: 26-32px */
  color: #FF8B58;          /* Replace with post accent color */
  line-height: 1.3;
  margin-top: 16px;
}
```

```html
<p class="tagline">Every transaction matters.</p>
```
