---
name: brand-intelligence
description: Loads brand context from the DesignOS database for any brand-related task
invoke: always-active
---

# Brand Intelligence

Brand data lives in the app's SQLite database (`canvas/.fluid/fluid.db`), managed through the app UI (Voice Guide, Patterns, Assets, Templates pages).

## Accessing Brand Data

Use these MCP tools to load brand context at runtime:

- **`list_brand_sections(category?)`** — Discover available brand docs. Categories: `voice-guide`, `design-tokens`, `layout-archetype`, `pattern`.
- **`read_brand_section(slug)`** — Load a specific brand doc by slug.
- **`list_brand_assets(category?)`** — Discover available brand assets (fonts, images, textures). Returns ready-to-use URLs.

## Role-Based Loading

Load only what you need for the task at hand (3-6 sections max):

| Task Type | Start With |
|-----------|------------|
| Copy / messaging | `list_brand_sections(category="voice-guide")` |
| Visual styling | `list_brand_sections(category="design-tokens")` + `list_brand_assets()` |
| Layout / structure | `list_brand_sections(category="layout-archetype")` |
| Spec validation | Use `run_brand_check` tool directly |

## Weight System

Brand rules carry weights 1-100:
- **81-100** = must follow (brand-critical)
- **51-80** = should follow (strong preference)
- **21-50** = recommended (flexible)
- **1-20** = nice-to-have (optional)

## Important

- Do NOT read from `brand/` files — they do not exist. All brand data is in the DB.
- Do NOT hardcode brand-specific values. Always query the DB tools.
- The DB is seeded on first app startup. Run the app at least once before using brand tools.
