---
name: overnight-run
description: "Run a full pipeline simulation batch: init creations, execute all stages via sim-executor subagents, eval each creation, generate summary report. Self-improving when used with /loop."
user-invocable: true
---

# Overnight Pipeline Simulation Run

You are the orchestrator for a full pipeline simulation batch. Claude Code subagents act as the model for each pipeline stage — receiving the EXACT same system prompt + user prompt that the Anthropic API call would receive, using the same tools (via pipeline-tools.cjs), and producing the same output files. No Anthropic API key needed.

## Prerequisites (check these first)

1. SQLite DB exists: `canvas/fluid.db`
2. Node modules installed: `canvas/node_modules/better-sqlite3` exists
3. Playwright Chromium browser: run `npx playwright install chromium` if needed (one-time)

## Orchestration Flow

### 1. Setup

```
REPORT_DIR=".fluid/reports/$(date +%Y%m%d-%H%M%S)"
mkdir -p $REPORT_DIR
```

Read test prompts from `tools/test-prompts.txt`. Each line is one prompt.

### 2. For each prompt

#### INIT
```bash
node tools/simulate-pipeline.cjs --step init "the prompt text"
```
Returns JSON manifest with `campaignId` and `creations[]` array. Each creation has: `creationId`, `creationType`, `workingDir`, `htmlOutputPath`, `pipelineDir`.

#### FOR EACH CREATION (sequentially, 30s cooldown between):

**STAGE 1: COPY**
```bash
node tools/simulate-pipeline.cjs --step copy --working-dir <workingDir> [--campaign-context "Prior headlines: ..."]
```
Then read `<pipelineDir>/copy-system.txt` and `<pipelineDir>/copy-user.txt`.
Spawn sim-executor (model: sonnet):
```
"SYSTEM CONTEXT:\n{copy-system.txt}\n\nTASK:\n{copy-user.txt}\n\nWORKING_DIR: {workingDir}"
```
Verify `{workingDir}/copy.md` exists. Extract headline + tagline for campaign dedup.

**ROUTING DETECTION + STAGE 2: LAYOUT**
```bash
node tools/simulate-pipeline.cjs --step layout --working-dir <workingDir>
```
Returns `{ routing, resolvedId, isTemplatePath }`. Read `layout-system.txt` + `layout-user.txt`.
Spawn sim-executor (model: haiku):
```
"SYSTEM CONTEXT:\n{layout-system.txt}\n\nTASK:\n{layout-user.txt}\n\nWORKING_DIR: {workingDir}"
```
Verify `{workingDir}/layout.html` exists.

**STAGE 3: STYLING** (SKIP if isTemplatePath — copy layout.html to htmlOutputPath instead)
```bash
node tools/simulate-pipeline.cjs --step styling --working-dir <workingDir>
```
If returns `{ skipped: true }`, copy layout.html → htmlOutputPath and skip to stage 4.
Otherwise read `styling-system.txt` + `styling-user.txt`.
Spawn sim-executor (model: sonnet):
```
"SYSTEM CONTEXT:\n{styling-system.txt}\n\nTASK:\n{styling-user.txt}\n\nWORKING_DIR: {workingDir}"
```
Verify `{htmlOutputPath}` exists.

**STAGE 4: SPEC-CHECK**
```bash
node tools/simulate-pipeline.cjs --step spec-check --working-dir <workingDir>
```
Read `spec-check-user.txt`. Spawn sim-executor (model: sonnet) with the spec-check prompt.
Read `{workingDir}/spec-report.json`.

**FIX LOOP** (up to 3 iterations):
If spec-report overall = "fail":
1. Try micro-fix: `node tools/simulate-pipeline.cjs --step micro-fix --working-dir <workingDir>`
   - If `{ fixed: true }`, re-run spec-check and check again
2. If micro-fix insufficient:
   - Read blocking_issues, group by fix_target
   - For each target: `node tools/simulate-pipeline.cjs --step fix --working-dir <workingDir> --target <target> --issues '<json>'`
   - Spawn sim-executor for each target with the fix prompts
   - If copy was fixed: cascade → re-run layout + styling stages
   - Re-run spec-check
3. Repeat up to 3 times

**DB UPDATE**:
```bash
# Mark iteration as complete (use sqlite3 or a quick node command)
node -e "const D=require('canvas/node_modules/better-sqlite3');const db=new D('canvas/fluid.db');db.prepare(\"UPDATE iterations SET generation_status='complete' WHERE id=?\").run('<iterationId>');db.close()"
```

**ATTACH SCHEMA** (archetype path only):
```bash
node tools/simulate-pipeline.cjs --step attach-schema --working-dir <workingDir>
```

**EVAL**:
```bash
node tools/eval-harness.cjs <htmlOutputPath> --working-dir <workingDir> --creation-type <type>
```
```bash
node tools/visual-eval.cjs <htmlOutputPath> --creation-type <type>
```
Then spawn a sonnet subagent with the art director rubric + both screenshot PNGs for visual eval.

Append combined results to `{REPORT_DIR}/report.json`.

Write handoff log to `{workingDir}/handoff-log.json`.

### 3. After all prompts complete

Run batch variety eval:
```bash
node tools/eval-harness.cjs --batch {REPORT_DIR}/report.json
```

Generate summary:
```bash
node tools/report-summary.cjs {REPORT_DIR}/eval.json
```

Read SUMMARY.md and diagnose top failures.

### 4. Self-improving loop (when invoked via /loop)

Check if a previous cycle's report exists in `.fluid/reports/`. If yes:
1. Read the previous SUMMARY.md
2. Compare via `node tools/compare-runs.cjs <prev-eval.json> <this-eval.json>`
3. Make up to 5 targeted adjustments (see guardrails below)
4. Log every change to `{REPORT_DIR}/changes.log`
5. If pattern-seeds or voice-guide files were edited: run `node tools/reseed-patterns.cjs`
6. Create git branch `overnight/{timestamp}/cycle-{N}` and commit changes

## Art Director Visual Eval Rubric

When spawning the visual eval subagent, use this prompt with both screenshot PNGs:

```
You are a senior art director evaluating whether a generated social media post meets the visual standard of the brand's curated templates.

You are seeing TWO images:
1. REFERENCE: A curated, human-approved brand template (the gold standard)
2. GENERATED: An AI-generated post that should look like it belongs to the same brand

Rate the GENERATED image on each dimension. Use ONLY these ratings:
  PASS — meets the standard set by the reference
  WEAK — noticeably below the reference but recognizable as the same brand
  FAIL — would not be recognized as the same brand

Dimensions: COLOR USAGE, TYPOGRAPHY, COMPOSITION, DECORATIVE ELEMENTS, FOOTER, BRAND COHESION, VISUAL POLISH, DISTINCTIVENESS

Return ONLY valid JSON:
{
  "reference_template": "<name>",
  "dimensions": {
    "color_usage": { "rating": "PASS|WEAK|FAIL", "note": "1 sentence" },
    "typography": { "rating": "...", "note": "..." },
    "composition": { "rating": "...", "note": "..." },
    "decorative_elements": { "rating": "...", "note": "..." },
    "footer": { "rating": "...", "note": "..." },
    "brand_cohesion": { "rating": "...", "note": "..." },
    "visual_polish": { "rating": "...", "note": "..." },
    "distinctiveness": { "rating": "...", "note": "..." }
  },
  "overall": "PASS|WEAK|FAIL",
  "art_director_note": "2-3 sentences of candid feedback"
}
```

## Adjustment Guardrails — Parity-Preserving Changes ONLY

The overnight loop may ONLY edit files that are shared source-of-truth for BOTH the real API pipeline and the simulation:

| Layer | Files | What can change |
|-------|-------|----------------|
| Brand rules | `pattern-seeds/*.md` | Weight values, clarifying examples, anti-patterns |
| Pipeline prompts | `canvas/src/server/api-pipeline.ts` (ONLY `build*Prompt()` functions) | Wording, rules, examples |
| Voice guide docs | `voice-guide/*.md` | Refine voice rules, add examples |

**Off-limits (NEVER modify):**
- `tools/simulate-pipeline.cjs`, `tools/pipeline-tools.cjs`, `.claude/agents/sim-executor.md`
- `tools/eval-harness.cjs`, `tools/visual-eval.cjs`
- Hex color values in pattern-seeds (brand colors are immutable)
- `archetypes/` directory
- Model assignments (`STAGE_MODELS`)
- Tool schemas (`STAGE_TOOLS`)

**Per-cycle limits:** Maximum 5 edits. Must log each change with file path, before/after, reasoning, and which eval failure it addresses.

**After editing pattern-seeds or voice-guide:** run `node tools/reseed-patterns.cjs` to sync DB.
