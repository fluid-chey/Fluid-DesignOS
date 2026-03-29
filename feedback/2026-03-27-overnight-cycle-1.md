---
date: 2026-03-27
asset_type: pipeline
outcome: partial
---

# Overnight Pipeline Cycle 1 — 2026-03-27

**Creations:** 16 (9 IG, 6 LI, 1 one-pager)
**Spec-check pass rate:** 100% (up from 39% baseline)
**Archetype selection:** 100% valid (up from 56% baseline)
**Art director PASS rate:** 0% (4 evaluated, all FAIL)

## Changes Made This Cycle

No prompt/pattern-seed changes were applied this cycle — this was a baseline measurement run with the current pipeline configuration.

## Metrics

| Metric | Baseline (2026-03-25) | This Cycle | Delta |
|--------|----------------------|------------|-------|
| Spec-check pass | 39% | 100% | +61pp |
| Archetype selection | 56% | 100% | +44pp |
| Decorative in HTML | 10% | 100% | +90pp |
| Decorative visible | 10% | 0% | -10pp |
| Art director PASS | N/A | 0% | — |

## Issues That Persisted

1. Decorative elements present in HTML but invisible in screenshots (asset server not running during Playwright capture)
2. Empty/sparse canvas appearance in rendered output
3. Some copy agents not using standardized section headers
4. DECORATIONS comment sometimes omitted
5. `cursive` font fallback used instead of `sans-serif`
