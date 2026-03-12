---
phase: 7
slug: merge-jonathan-s-codebase-into-fluid-designos
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | canvas/vitest.config.ts |
| **Quick run command** | `cd canvas && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd canvas && npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd canvas && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd canvas && npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 0 | Types + install | unit | `cd canvas && npx tsc --noEmit src/lib/campaign-types.ts src/lib/slot-schema.ts` | N/A (tsc) | ⬜ pending |
| 07-01-02 | 01 | 0 | DB + API layer | unit | `cd canvas && npx vitest run src/__tests__/db.test.ts` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 1 | Campaign API endpoints | integration | `cd canvas && npx vitest run src/__tests__/campaign-api.test.ts` | ❌ W0 | ⬜ pending |
| 07-03-01 | 03 | 1 | Campaign store + AppShell | unit | `cd canvas && npx vitest run src/__tests__/campaign-store.test.ts` | ❌ Plan 03 | ⬜ pending |
| 07-03-02 | 03 | 1 | Breadcrumb + DrillDown + Dashboard | tsc | `cd canvas && npx tsc --noEmit src/components/Breadcrumb.tsx src/components/DrillDownGrid.tsx src/components/CampaignDashboard.tsx` | N/A (tsc) | ⬜ pending |
| 07-04-01 | 04 | 1 | Editor store + SlotField + ContentEditor | unit | `cd canvas && npx vitest run src/__tests__/editor-store.test.ts` | ❌ Plan 04 | ⬜ pending |
| 07-04-02 | 04 | 1 | Photo/Brush/Carousel/Export | tsc | `cd canvas && npx tsc --noEmit src/components/PhotoReposition.tsx src/components/BrushTransform.tsx src/components/CarouselSelector.tsx src/components/ExportActions.tsx` | N/A (tsc) | ⬜ pending |
| 07-05-01 | 05 | 1 | MCP tool rewiring | unit | `cd canvas && npx vitest run mcp/__tests__/ --reporter=verbose` | ❌ Plan 05 | ⬜ pending |
| 07-05-02 | 05 | 1 | Template configs | tsc | `cd canvas && npx tsc --noEmit src/lib/template-configs.ts` | N/A (tsc) | ⬜ pending |
| 07-06-01 | 06 | 2 | Integration wiring | tsc | `cd canvas && npx tsc --noEmit` | N/A (tsc) | ⬜ pending |
| 07-06-02 | 06 | 2 | E2E visual verify | manual | Browser test | N/A | ⬜ pending |
| 07-07-01 | 07 | 3 | Campaign skill | file-exists | `test -f .agents/skills/fluid-campaign/SKILL.md` | N/A | ⬜ pending |
| 07-07-02 | 07 | 3 | DAM + 5-slot UI | tsc | `cd canvas && npx tsc --noEmit src/components/DAMPicker.tsx src/components/ContentEditor.tsx src/components/CampaignDashboard.tsx` | N/A (tsc) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `canvas/src/__tests__/db.test.ts` — SQLite schema creation, CRUD operations, FK constraints
- [ ] `better-sqlite3` and `@types/better-sqlite3` — npm install in canvas/
- [ ] Type contracts files — `canvas/src/lib/campaign-types.ts` (Campaign, Asset, Frame, Iteration) and `canvas/src/lib/slot-schema.ts` (SlotSchema, SlotField)

*Wave 0 is a single-agent session (Plan 01) that produces the foundation for parallel Wave 1 work.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full-size iframe previews at drill-down | UI fidelity | Visual rendering | Navigate Campaign > Asset > Frame, verify iframes render at native dimensions |
| Collapsible sidebar UX | Navigation | Interaction pattern | Toggle left/right sidebars, verify smooth collapse/expand |
| Breadcrumb navigation | Navigation | Multi-level state | Drill down 3 levels, use breadcrumbs to jump back, verify state |
| Template gallery in 'New' flow | Template system | Visual + flow | Click + New, verify template gallery appears with live previews |
| Jonathan's header visual match | Design fidelity | Visual comparison | Compare header with Jonathan's reference design |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
