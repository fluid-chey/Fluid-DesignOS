Standard footer across all social posts. Three elements, always the same. (weight: 95)

## Structure

- **Left:** WeCommerce flag icon + separator bar + WeCommerce wordmark
- **Right:** Fluid dots mark
- Footer is subtle, never competing with content

## Platform Sizing

| Platform | Footer Padding | Weight |
|----------|---------------|--------|
| Instagram | `padding: 22px 68px` | 85 |
| LinkedIn | `padding: 18px 72px` | 85 |

## Footer Assets

| Position | Asset | Size |
|----------|-------|------|
| Left — flag | `/api/brand-assets/serve/wecommerce-flags` | height: 18px |
| Left — wordmark | `/api/brand-assets/serve/wecommerce-logos` | height: 18px |
| Right — dots | `/api/brand-assets/serve/frame-3-fluid-dots` | height: 22px |

```css
/* Footer Structure (Weight: 95) */
.footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px 68px;     /* Instagram. LinkedIn: 18px 72px */
  z-index: 10;
}
.footer-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.footer-left img {
  height: 18px;
  opacity: 0.8;
}
.footer-separator {
  width: 1px;
  height: 14px;
  background: rgba(255,255,255,0.15);
}
.footer-right img {
  height: 22px;
  opacity: 0.8;
}
```

```html
<footer class="footer">
  <div class="footer-left">
    <img src="/api/brand-assets/serve/wecommerce-flags" alt="We-Commerce">
    <div class="footer-separator"></div>
    <img src="/api/brand-assets/serve/wecommerce-logos" alt="We-Commerce">
  </div>
  <div class="footer-right">
    <img src="/api/brand-assets/serve/frame-3-fluid-dots" alt="Fluid">
  </div>
</footer>
```
