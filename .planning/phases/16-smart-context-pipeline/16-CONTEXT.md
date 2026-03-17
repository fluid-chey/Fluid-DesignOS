# Phase 16: Smart Context Pipeline - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace agent self-discovery of brand context with deterministic, creation-type-aware pre-injection. Each pipeline stage receives exactly the brand data it needs, configured via a dev-editable context map stored in the DB. The context mapping is configurable and observable for iterative refinement. Discovery tools kept as fallback — their usage becomes a "gap signal" for map refinement.

</domain>

<decisions>
## Implementation Decisions

### Context Map Design
- **DB table** (`context_map`) stores the (creation_type, stage) → brand sections mapping. Editable via app UI. Consistent with DB-as-source-of-truth pattern.
- **Supports both explicit slugs AND category wildcards**: e.g., `color-palette` (specific slug) or `design-tokens:*` (all sections in category). Wildcards auto-expand at runtime so new sections in a category are picked up without map edits.
- **Priority field per entry** (1-100): when a stage's injected sections exceed its token budget, lowest-priority sections are dropped first. Matches the existing weight system used for brand rules.
- **Per-stage token limits**: each (type, stage) entry has an optional `max_tokens` field. Prevents context bloat.
- **UI lives on a new Settings page** — "Pipeline Settings" or "Context Config" section. Pipeline config is system config, not brand content.

### Design DNA Integration (Hybrid)
- **Brand sections + design rule text** flow through the unified context map. `loadDesignDna()` text rules (global visual style, social general, platform-specific, archetype notes) become context map entries like any other DB section.
- **HTML exemplar loading stays as a small specialized function** since it reads files from disk (not DB text) and depends on runtime archetype detection from copy stage output. Not folded into the context map.
- This means one unified text injection system + one small exemplar loader — not two parallel systems.

### Pre-injection Strategy
- **System prompt injection**: pre-loaded brand context goes into the system prompt (not user message). Anthropic docs recommend system prompts for persistent context that applies across the conversation.
- **Single DB load at pipeline start**: one `loadContextMap()` call returns all sections for all stages, partitioned by stage key. Cached for entire pipeline run. Matches Phase 11's `loadBrandContextFromDb()` pattern.
- **Extend `buildSystemPrompt()`** with optional `injectedContext: string` param. Appends brand context after generic instructions. Minimal code change.
- **Manifest header** prepended to injected context: `## Injected Brand Context\nSections: color-palette, typography, ...` so agents know what they received.
- **Prompt caching deferred** to a future optimization pass. Each stage has different prompts, limiting cache hit potential. Get pre-injection working first.

### Observability & Gap Tracking
- **Chat sidebar + DB**: show injected sections and estimated token count per stage live in the chat sidebar. Persist context logs to a DB table for reviewing past generations.
- **Gap signals logged silently to DB**: when agents call `list_brand_sections` or `read_brand_section` during stages with pre-injected context, those tool calls are recorded as "context gaps." No UI badge — review gaps periodically via settings page or API query.
- **Per-stage logging**: which sections were injected, estimated token count, any fallback tool calls that indicate map incompleteness.

### Migration from Current Tools
- **Discovery tools kept as fallback**: `list_brand_sections` and `read_brand_section` stay available in `STAGE_TOOLS`. Not the primary path, but agents can self-recover if the context map is incomplete. Tool usage becomes a gap signal.
- **All creation types at once**: context map covers instagram, linkedin, and one-pager from day one. No conditional paths. Discovery fallback means low risk; gap signals help iterate on all types simultaneously.

### Claude's Discretion
- Exact DB schema for `context_map` and `context_log` tables
- Context map seeder defaults (initial section assignments per creation type per stage)
- Settings page UI layout and component structure
- How wildcard expansion interacts with priority ordering
- Token estimation method (character count heuristic vs. tiktoken-equivalent)
- Chat sidebar context panel design and collapsibility

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Pipeline Architecture
- `canvas/src/server/api-pipeline.ts` — Pipeline orchestrator, `buildSystemPrompt()`, `runStageWithTools()`, `loadDesignDna()`, `STAGE_TOOLS`, `ARCHETYPE_TEMPLATE_FILES`
- `canvas/src/server/db-api.ts` — DB query functions: `getVoiceGuideDocs`, `getBrandPatterns`, `getBrandAssets`, `getDesignDnaForPipeline`
- `canvas/src/lib/db.ts` — SQLite schema, table creation, migrations

### Brand Data (Phase 15 context)
- `.planning/phases/15-brand-data-architecture/15-CONTEXT.md` — Patterns Foundations/Rules grouping, asset categories (Fonts/Images/Brand Elements/Decorations), Templates page self-contained with design rules
- `canvas/src/server/brand-seeder.ts` — Seeder patterns for DB table population

### Design DNA (Phase 14 context)
- `.planning/phases/14-design-dna-template-extracted-style-rules-per-deliverable-design-intelligence-and-exemplar-referenced-generation-pipeline/14-CONTEXT.md` — 3-tier data architecture (global style / per-deliverable / platform specs), template design rules, exemplar injection pattern

### Brand-Agnostic Pipeline (Phase 14.1 context)
- `.planning/phases/14.1-brand-agnostic-pipeline/14.1-CONTEXT.md` — Generic stage prompts, SKILL_FILES removed, `loadStagePrompt()` removed, brand context from DB only

### Existing UI Patterns
- `canvas/src/components/VoiceGuide.tsx` — Inline-editable DB-backed page (reference for Settings page UI)
- `canvas/src/components/TemplatesScreen.tsx` — DesignDnaPanel with grouped inline-editable rules
- `canvas/src/components/AppShell.tsx` — Page routing, left nav structure

### Research
- [Anthropic: Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — Pre-loaded vs just-in-time context tradeoffs, "smallest set of high-signal tokens" principle
- [Anthropic: Advanced tool use](https://www.anthropic.com/engineering/advanced-tool-use) — Tool Search Tool pattern, deferred tool loading, token optimization

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `buildSystemPrompt()` in api-pipeline.ts: extend with injectedContext param for pre-injection
- `loadDesignDna()`: text portion migrates to context map entries; HTML exemplar stays as-is
- `getDesignDnaForPipeline()` in db-api.ts: already queries `template_design_rules` table — can serve as pattern for context map queries
- `emitStageStatus()` / `emitStageNarrative()` SSE helpers: reuse for context observability events in chat sidebar
- VoiceGuide.tsx inline-editing pattern: reference for Settings page context map editor

### Established Patterns
- DB tables use `sort_order` for ordering, `updated_at` timestamps
- API routes follow `/api/{resource}` with GET/PUT/POST
- Seeder runs on startup with COUNT(*) guard
- SSE NDJSON format for streaming events to chat sidebar
- Dark theme UI (backgroundColor: '#0d0d0d', text colors #fff/#999/#666)

### Integration Points
- `buildSystemPrompt()`: add injectedContext param
- `runApiPipeline()`: add loadContextMap() call at pipeline start, pass results to each stage
- `STAGE_TOOLS`: keep discovery tools but track their usage as gap signals
- `executeTool()`: add gap signal logging when list_brand_sections/read_brand_section called during pre-injected stages
- AppShell.tsx: add Settings nav item for context map editor
- New SSE event type for context injection metadata in chat sidebar

</code_context>

<specifics>
## Specific Ideas

- Wildcard `design-tokens:*` should expand to all current slugs in that category at load time, not at config time — so adding a new design-tokens section to the DB automatically includes it in relevant stages
- The context map seeder should ship with sensible defaults extracted from current agent behavior (what sections they typically call for each type/stage combo)
- Token estimation can start with a simple 4-chars-per-token heuristic — exact tokenization isn't worth the dependency
- Gap signal logging should include the full tool call input (which slug was requested) so you can see exactly what the map is missing
- The Settings page could show a grid/matrix view: rows = creation types, columns = stages, cells = configured sections

</specifics>

<deferred>
## Deferred Ideas

- Anthropic prompt caching (`cache_control`) for pre-injected brand context — optimization after validating context map works
- Auto-tuning: system analyzes gap signals and suggests context map updates automatically
- Per-brand context maps (for future multi-brand support)
- Context map versioning / A/B testing different maps to compare generation quality
- Multimodal context injection (screenshots of reference templates alongside text rules)

</deferred>

---

*Phase: 16-smart-context-pipeline*
*Context gathered: 2026-03-17*
