#!/usr/bin/env node
/**
 * Verify brand pattern sizes and simulate pipeline context injection.
 * Run after migration to confirm no oversized content will blow up agent prompts.
 *
 * Usage: node tools/verify-context-sizes.cjs
 */

const path = require('path');
const fs = require('fs');

// Resolve better-sqlite3 from canvas/node_modules
const Database = require(path.resolve(__dirname, '../canvas/node_modules/better-sqlite3'));

// Find the DB
const dbPath = path.resolve(__dirname, '../canvas/fluid.db');
if (!fs.existsSync(dbPath)) {
  console.error('DB not found at', dbPath);
  process.exit(1);
}

const db = new Database(dbPath, { readonly: true });

// ─── 1. Check pattern sizes ──────────────────────────────────────────────────

console.log('\n═══ Brand Pattern Sizes ═══\n');

const patterns = db.prepare('SELECT slug, category, length(content) as bytes FROM brand_patterns ORDER BY bytes DESC').all();
let hasOversized = false;

for (const p of patterns) {
  const tokens = Math.ceil(p.bytes / 4);
  const status = tokens > 10000 ? '❌ OVERSIZED' : tokens > 5000 ? '⚠️  LARGE' : '✅';
  if (tokens > 10000) hasOversized = true;
  console.log(`  ${status}  ${p.slug.padEnd(30)} ${String(p.bytes).padStart(8)} bytes  (~${String(tokens).padStart(6)} tokens)  [${p.category}]`);
}

// ─── 2. Check for base64 ────────────────────────────────────────────────────

console.log('\n═══ Base64 Check ═══\n');

const base64Check = db.prepare(`
  SELECT slug,
    (length(content) - length(replace(content, 'base64', ''))) / 6 as base64_count
  FROM brand_patterns
  WHERE content LIKE '%base64%'
`).all();

if (base64Check.length === 0) {
  console.log('  ✅ No base64 content found in any pattern');
} else {
  for (const p of base64Check) {
    console.log(`  ❌ ${p.slug} has ${p.base64_count} base64 reference(s)`);
  }
}

// Also check voice_guide_docs
const vgBase64 = db.prepare(`SELECT slug FROM voice_guide_docs WHERE content LIKE '%base64%'`).all();
if (vgBase64.length > 0) {
  for (const v of vgBase64) {
    console.log(`  ❌ voice_guide: ${v.slug} has base64 content`);
  }
} else {
  console.log('  ✅ No base64 content in voice guide docs');
}

// ─── 3. Simulate context injection per stage ────────────────────────────────

console.log('\n═══ Simulated Context Injection (per stage) ═══\n');

const contextMap = db.prepare('SELECT creation_type, stage, sections, max_tokens FROM context_map').all();

for (const entry of contextMap) {
  const sections = JSON.parse(entry.sections);
  let totalTokens = 0;
  const loaded = [];

  for (const sectionSpec of sections) {
    // Expand wildcards
    const [categoryPrefix] = sectionSpec.split(':');
    const isWild = sectionSpec.endsWith(':*');

    let matchingPatterns;
    if (isWild) {
      matchingPatterns = db.prepare('SELECT slug, length(content) as bytes FROM brand_patterns WHERE category = ?').all(categoryPrefix);
    } else {
      matchingPatterns = db.prepare('SELECT slug, length(content) as bytes FROM brand_patterns WHERE slug = ?').all(sectionSpec);
    }

    // Also check voice_guide_docs
    if (categoryPrefix === 'voice-guide' && isWild) {
      matchingPatterns = db.prepare('SELECT slug, length(content) as bytes FROM voice_guide_docs').all();
    }

    for (const mp of matchingPatterns) {
      const tokens = Math.ceil(mp.bytes / 4);
      totalTokens += tokens;
      loaded.push({ slug: mp.slug, tokens });
    }
  }

  const budget = entry.max_tokens || 'unlimited';
  const overBudget = entry.max_tokens && totalTokens > entry.max_tokens;
  const status = overBudget ? '⚠️  OVER BUDGET (will be truncated)' : '✅';

  console.log(`  ${entry.creation_type}:${entry.stage} — ${totalTokens} tokens / ${budget} budget ${status}`);
  for (const s of loaded) {
    console.log(`    └─ ${s.slug}: ~${s.tokens} tokens`);
  }
}

// ─── 4. Check Design DNA size ───────────────────────────────────────────────

console.log('\n═══ Design DNA Components ═══\n');

const vsc = db.prepare("SELECT length(content) as bytes FROM brand_patterns WHERE slug = 'visual-compositor-contract'").get();
if (vsc) {
  console.log(`  visual-compositor-contract: ${vsc.bytes} bytes (~${Math.ceil(vsc.bytes / 4)} tokens)`);
}

const designRules = db.prepare('SELECT scope, label, length(content) as bytes FROM template_design_rules ORDER BY scope, label').all();
let drTotal = 0;
for (const dr of designRules) {
  drTotal += dr.bytes;
  console.log(`  ${dr.scope}/${dr.label}: ${dr.bytes} bytes`);
}
console.log(`  Design rules total: ${drTotal} bytes (~${Math.ceil(drTotal / 4)} tokens)`);

// Estimate template exemplar sizes
const templateDir = path.resolve(__dirname, '../templates/social');
if (fs.existsSync(templateDir)) {
  console.log('\n  Template exemplar HTML files:');
  const files = fs.readdirSync(templateDir).filter(f => f.endsWith('.html'));
  for (const f of files) {
    const size = fs.statSync(path.join(templateDir, f)).size;
    console.log(`    ${f}: ${size} bytes (~${Math.ceil(size / 4)} tokens)`);
  }
}

// ─── Summary ────────────────────────────────────────────────────────────────

console.log('\n═══ Summary ═══\n');

const totalPatternBytes = patterns.reduce((sum, p) => sum + p.bytes, 0);
console.log(`  Total pattern content: ${totalPatternBytes} bytes (~${Math.ceil(totalPatternBytes / 4)} tokens)`);
console.log(`  Pattern count: ${patterns.length}`);
console.log(`  Oversized patterns (>10K tokens): ${hasOversized ? '❌ YES — needs fixing' : '✅ None'}`);
console.log(`  Base64 in patterns: ${base64Check.length > 0 ? '❌ YES' : '✅ None'}`);

// Max safe prompt estimate: system + user + tools + context ~= should be under 150K tokens
const MAX_SAFE = 150000;
const estDnaTokens = vsc ? Math.ceil(vsc.bytes / 4) + Math.ceil(drTotal / 4) : 0;
const estToolSchemas = 5000; // rough estimate for tool definitions
const estMaxExemplar = 4000; // ~16KB max HTML template

// Worst case layout stage: DNA (system) + context injection + tools + exemplar
const worstCase = estDnaTokens + 6000 + estToolSchemas + estMaxExemplar;
console.log(`\n  Estimated worst-case layout stage prompt: ~${worstCase} tokens`);
console.log(`  ${worstCase < MAX_SAFE ? '✅' : '❌'} ${worstCase < MAX_SAFE ? 'Well within' : 'EXCEEDS'} ${MAX_SAFE} token safe limit`);

db.close();
console.log('');
