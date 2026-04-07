# The Sandbox: Pipeline Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 4-stage sequential pipeline with a single conversational agent that acts as a creative partner, with a Claude Desktop-style chat UI.

**Architecture:** Direct Anthropic API with tool-use loop (~200 lines). Agent discovers brand context via tools, renders and self-critiques via Playwright screenshots, and persists conversations in SQLite. Chat sidebar replaces PromptSidebar. Campaign fan-out spawns parallel agent sessions.

**Tech Stack:** TypeScript, Anthropic SDK (`@anthropic-ai/sdk` — already installed), Playwright (already in devDeps), SQLite (better-sqlite3), React 19, Zustand 5, SSE streaming.

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `canvas/src/server/agent.ts` | Agent core: tool-use loop, streaming, conversation management |
| `canvas/src/server/agent-tools.ts` | All tool definitions and implementations (brand discovery, editing, visual, context) |
| `canvas/src/server/agent-system-prompt.ts` | System prompt construction (brand-agnostic) |
| `canvas/src/server/render-engine.ts` | Pre-warmed Playwright instance, HTML-to-screenshot |
| `canvas/src/server/chat-routes.ts` | API routes for chat CRUD and message sending |
| `canvas/src/store/chat.ts` | Zustand store for chat state |
| `canvas/src/components/ChatSidebar.tsx` | Chat sidebar replacing PromptSidebar |
| `canvas/src/components/ChatMessage.tsx` | Individual message rendering (text, tool calls, images) |
| `canvas/src/components/ChatHistory.tsx` | Chat history list with new chat button |
| `canvas/src/hooks/useChatStream.ts` | SSE hook for streaming agent responses |
| `canvas/src/components/ChatSidebar.css` | Styles for chat sidebar |
| `canvas/tests/agent-tools.test.ts` | Tests for tool implementations |
| `canvas/tests/render-engine.test.ts` | Tests for render engine |
| `canvas/tests/chat-routes.test.ts` | Tests for chat API routes |

### Modified Files

| File | Change |
|------|--------|
| `canvas/src/lib/db.ts` | Add `chats` and `chat_messages` table creation |
| `canvas/src/lib/campaign-types.ts` | Add `Chat`, `ChatMessage` types |
| `canvas/src/server/watcher.ts:2` | Remove `api-pipeline` import, add `chat-routes` import |
| `canvas/src/server/watcher.ts:2079-2244` | Remove `/api/generate` and `/api/generate/cancel` routes |
| `canvas/src/components/AppShell.tsx` | Replace PromptSidebar with ChatSidebar |
| `canvas/mcp/server.ts` | Add new tools alongside push_asset |

### Deleted Files (Task 10)

| File | Reason |
|------|--------|
| `canvas/src/server/api-pipeline.ts` | Replaced by agent.ts |
| `canvas/src/components/PromptSidebar.tsx` | Replaced by ChatSidebar |
| `canvas/src/store/generation.ts` | Replaced by chat.ts |
| `canvas/src/hooks/useGenerationStream.ts` | Replaced by useChatStream.ts |
| `.claude/agents/copy-agent.md` | No longer used |
| `.claude/agents/layout-agent.md` | No longer used |
| `.claude/agents/styling-agent.md` | No longer used |
| `.claude/agents/spec-check-agent.md` | No longer used |

---

## Task 1: DB Schema — Chat Tables

**Files:**
- Modify: `canvas/src/lib/db.ts:53-100`
- Modify: `canvas/src/lib/campaign-types.ts:1-62`

- [ ] **Step 1: Add Chat and ChatMessage TypeScript types**

In `canvas/src/lib/campaign-types.ts`, add after the existing types (after line 62):

```typescript
export interface Chat {
  id: string;
  title: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string | null;
  toolCalls: string | null;    // JSON array of tool call blocks
  toolResults: string | null;  // JSON array of tool result blocks
  uiContext: string | null;    // JSON blob of UI state
  createdAt: number;
}
```

- [ ] **Step 2: Add CREATE TABLE statements to initSchema**

In `canvas/src/lib/db.ts`, inside `initSchema()` (after the existing CREATE TABLE statements around line 100), add:

```typescript
db.exec(`
  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    title TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT,
    tool_calls TEXT,
    tool_results TEXT,
    ui_context TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
`);
```

- [ ] **Step 3: Verify tables are created on startup**

Run: `cd canvas && npm run dev`

Then check the DB:

```bash
sqlite3 canvas/fluid.db ".tables" | grep chat
```

Expected: `chat_messages  chats` appear in the output.

- [ ] **Step 4: Commit**

```bash
git add canvas/src/lib/db.ts canvas/src/lib/campaign-types.ts
git commit -m "feat: add chats and chat_messages DB tables for sandbox pipeline"
```

---

## Task 2: Render Engine

**Files:**
- Create: `canvas/src/server/render-engine.ts`
- Create: `canvas/tests/render-engine.test.ts`

- [ ] **Step 1: Write the render engine**

Create `canvas/src/server/render-engine.ts`:

```typescript
import { chromium, type Browser, type BrowserContext } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

let browser: Browser | null = null;
let context: BrowserContext | null = null;

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..', '..');

export async function ensureBrowser(): Promise<BrowserContext> {
  if (context) return context;
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext();
  return context;
}

export async function shutdownBrowser(): Promise<void> {
  if (context) { await context.close(); context = null; }
  if (browser) { await browser.close(); browser = null; }
}

export async function renderPreview(
  html: string,
  width: number,
  height: number
): Promise<string> {
  const ctx = await ensureBrowser();
  const page = await ctx.newPage();

  try {
    await page.setViewportSize({ width, height });

    // Rewrite /fluid-assets/ URLs to absolute file paths
    const assetsDir = path.join(PROJECT_ROOT, 'assets');
    const resolvedHtml = html.replace(
      /\/fluid-assets\//g,
      `file://${assetsDir}/`
    ).replace(
      /\/api\/brand-assets\/serve\//g,
      `file://${assetsDir}/`
    );

    // Write to temp file so file:// URLs resolve correctly
    const tmpFile = path.join(os.tmpdir(), `fluid-render-${Date.now()}.html`);
    fs.writeFileSync(tmpFile, resolvedHtml, 'utf-8');

    await page.goto(`file://${tmpFile}`, { waitUntil: 'networkidle' });

    // Brief pause for fonts/images to load
    await page.waitForTimeout(200);

    const screenshot = await page.screenshot({ type: 'png' });
    const base64 = screenshot.toString('base64');

    fs.unlinkSync(tmpFile);
    return base64;
  } finally {
    await page.close();
  }
}
```

- [ ] **Step 2: Write a smoke test**

Create `canvas/tests/render-engine.test.ts`:

```typescript
import { describe, it, expect, afterAll } from 'vitest';
import { renderPreview, shutdownBrowser } from '../src/server/render-engine';

afterAll(async () => {
  await shutdownBrowser();
});

describe('renderPreview', () => {
  it('returns a base64 PNG string for simple HTML', async () => {
    const html = `<!DOCTYPE html>
<html><body style="margin:0;background:#ff6600;">
  <h1 style="color:white;padding:40px;">Hello</h1>
</body></html>`;

    const result = await renderPreview(html, 1080, 1080);

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(100);
    // PNG magic bytes in base64 start with iVBOR
    expect(result.startsWith('iVBOR')).toBe(true);
  }, 15000);

  it('respects custom dimensions', async () => {
    const html = `<!DOCTYPE html><html><body><div id="size"></div>
<script>document.getElementById('size').textContent=window.innerWidth+'x'+window.innerHeight;</script>
</body></html>`;

    const result = await renderPreview(html, 1200, 627);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(100);
  }, 15000);
});
```

- [ ] **Step 3: Run tests**

```bash
cd canvas && npx vitest run tests/render-engine.test.ts
```

Expected: 2 tests pass.

- [ ] **Step 4: Commit**

```bash
git add canvas/src/server/render-engine.ts canvas/tests/render-engine.test.ts
git commit -m "feat: add Playwright render engine for agent visual self-critique"
```

---

## Task 3: Agent Tools — Brand Discovery

**Files:**
- Create: `canvas/src/server/agent-tools.ts`
- Create: `canvas/tests/agent-tools.test.ts`

- [ ] **Step 1: Create the tools file with brand discovery tools**

Create `canvas/src/server/agent-tools.ts`:

```typescript
import { getDb } from '../lib/db';
import * as path from 'path';
import * as fs from 'fs';
import type Anthropic from '@anthropic-ai/sdk';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const ARCHETYPES_DIR = path.join(PROJECT_ROOT, 'archetypes');

// ─── Brand Discovery (READ) ───

export function listVoiceGuide(): { slug: string; title: string; description: string }[] {
  const db = getDb();
  const rows = db.prepare(
    `SELECT slug, title, SUBSTR(content, 1, 200) as description FROM voice_guide_docs ORDER BY title`
  ).all() as any[];
  return rows.map(r => ({
    slug: r.slug,
    title: r.title,
    description: r.description?.split('\n')[0] ?? '',
  }));
}

export function readVoiceGuide(slug: string): { slug: string; title: string; content: string } | null {
  const db = getDb();
  const row = db.prepare(`SELECT slug, title, content FROM voice_guide_docs WHERE slug = ?`).get(slug) as any;
  return row ?? null;
}

export function listPatterns(category?: string): { slug: string; name: string; category: string; weight: number; description: string }[] {
  const db = getDb();
  const sql = category
    ? `SELECT slug, name, category, weight, SUBSTR(content, 1, 200) as description FROM brand_patterns WHERE category = ? ORDER BY weight DESC, name`
    : `SELECT slug, name, category, weight, SUBSTR(content, 1, 200) as description FROM brand_patterns ORDER BY category, weight DESC, name`;
  const rows = (category ? db.prepare(sql).all(category) : db.prepare(sql).all()) as any[];
  return rows.map(r => ({
    slug: r.slug,
    name: r.name,
    category: r.category,
    weight: r.weight ?? 50,
    description: r.description?.split('\n')[0] ?? '',
  }));
}

export function readPattern(slug: string): { slug: string; name: string; category: string; weight: number; content: string } | null {
  const db = getDb();
  const row = db.prepare(`SELECT slug, name, category, weight, content FROM brand_patterns WHERE slug = ?`).get(slug) as any;
  return row ?? null;
}

export function listAssets(type?: string): { name: string; type: string; cssUrl: string | null; fontSrc: string | null; imgSrc: string | null; description: string | null }[] {
  const db = getDb();
  const sql = type
    ? `SELECT name, type, css_url as cssUrl, font_src as fontSrc, img_src as imgSrc, description FROM brand_assets WHERE type = ? ORDER BY name`
    : `SELECT name, type, css_url as cssUrl, font_src as fontSrc, img_src as imgSrc, description FROM brand_assets ORDER BY type, name`;
  return (type ? db.prepare(sql).all(type) : db.prepare(sql).all()) as any[];
}

export function listTemplates(): { slug: string; name: string; platform: string | null; description: string | null }[] {
  const db = getDb();
  return db.prepare(`SELECT slug, name, platform, description FROM templates ORDER BY name`).all() as any[];
}

export function readTemplate(slug: string): any | null {
  const db = getDb();
  const tmpl = db.prepare(`SELECT * FROM templates WHERE slug = ?`).get(slug) as any;
  if (!tmpl) return null;
  const rules = db.prepare(`SELECT * FROM template_design_rules WHERE template_id = ?`).all(tmpl.id) as any[];
  return { ...tmpl, designRules: rules };
}

export function listArchetypes(): { slug: string; name: string; slots: string[] }[] {
  if (!fs.existsSync(ARCHETYPES_DIR)) return [];
  const dirs = fs.readdirSync(ARCHETYPES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'components');

  return dirs.map(d => {
    const schemaPath = path.join(ARCHETYPES_DIR, d.name, 'schema.json');
    let slots: string[] = [];
    if (fs.existsSync(schemaPath)) {
      try {
        const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
        slots = (schema.slots ?? []).map((s: any) => s.label ?? s.selector);
      } catch {}
    }
    return {
      slug: d.name,
      name: d.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      slots,
    };
  });
}

export function readArchetype(slug: string): { slug: string; html: string; schema: any; notes: string | null } | null {
  const dir = path.join(ARCHETYPES_DIR, slug);
  if (!fs.existsSync(dir)) return null;

  const htmlPath = path.join(dir, 'index.html');
  const schemaPath = path.join(dir, 'schema.json');
  const notesPath = path.join(dir, 'notes.md');

  const html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf-8') : '';
  const schema = fs.existsSync(schemaPath) ? JSON.parse(fs.readFileSync(schemaPath, 'utf-8')) : null;
  const notes = fs.existsSync(notesPath) ? fs.readFileSync(notesPath, 'utf-8') : null;

  return { slug, html, schema, notes };
}
```

- [ ] **Step 2: Write tests for brand discovery tools**

Create `canvas/tests/agent-tools.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  listVoiceGuide, readVoiceGuide,
  listPatterns, readPattern,
  listAssets, listTemplates,
  listArchetypes, readArchetype,
} from '../src/server/agent-tools';

describe('Brand Discovery Tools', () => {
  it('listVoiceGuide returns array with slug and title', () => {
    const result = listVoiceGuide();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('slug');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('description');
    }
  });

  it('readVoiceGuide returns content for valid slug', () => {
    const list = listVoiceGuide();
    if (list.length === 0) return; // skip if no data
    const doc = readVoiceGuide(list[0].slug);
    expect(doc).not.toBeNull();
    expect(doc!.content.length).toBeGreaterThan(0);
  });

  it('readVoiceGuide returns null for invalid slug', () => {
    expect(readVoiceGuide('nonexistent-slug-xyz')).toBeNull();
  });

  it('listPatterns returns array', () => {
    const result = listPatterns();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('slug');
      expect(result[0]).toHaveProperty('category');
      expect(result[0]).toHaveProperty('weight');
    }
  });

  it('listPatterns filters by category', () => {
    const all = listPatterns();
    if (all.length === 0) return;
    const category = all[0].category;
    const filtered = listPatterns(category);
    expect(filtered.every(p => p.category === category)).toBe(true);
  });

  it('listArchetypes returns entries from filesystem', () => {
    const result = listArchetypes();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('slug');
    expect(result[0]).toHaveProperty('slots');
  });

  it('readArchetype returns HTML and schema for valid slug', () => {
    const list = listArchetypes();
    if (list.length === 0) return;
    const arch = readArchetype(list[0].slug);
    expect(arch).not.toBeNull();
    expect(arch!.html.length).toBeGreaterThan(0);
    expect(arch!.schema).not.toBeNull();
  });

  it('readArchetype returns null for invalid slug', () => {
    expect(readArchetype('nonexistent-archetype-xyz')).toBeNull();
  });
});
```

- [ ] **Step 3: Run tests**

```bash
cd canvas && npx vitest run tests/agent-tools.test.ts
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add canvas/src/server/agent-tools.ts canvas/tests/agent-tools.test.ts
git commit -m "feat: add brand discovery tools for sandbox agent"
```

---

## Task 4: Agent Tools — Brand Editing, Visual, and Context

**Files:**
- Modify: `canvas/src/server/agent-tools.ts`
- Modify: `canvas/tests/agent-tools.test.ts`

- [ ] **Step 1: Add brand editing tools**

Append to `canvas/src/server/agent-tools.ts`:

```typescript
import { nanoid } from 'nanoid';
import { renderPreview } from './render-engine';

// ─── Brand Editing (WRITE) ───

export function updatePattern(slug: string, content: string): { success: boolean } {
  const db = getDb();
  const result = db.prepare(`UPDATE brand_patterns SET content = ? WHERE slug = ?`).run(content, slug);
  return { success: result.changes > 0 };
}

export function createPattern(category: string, name: string, content: string): { slug: string } {
  const db = getDb();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
  db.prepare(
    `INSERT INTO brand_patterns (slug, name, category, content, weight, is_core) VALUES (?, ?, ?, ?, 50, 0)`
  ).run(slug, name, category, content, );
  return { slug };
}

export function deletePattern(slug: string): { success: boolean } {
  const db = getDb();
  const result = db.prepare(`DELETE FROM brand_patterns WHERE slug = ?`).run(slug);
  return { success: result.changes > 0 };
}

export function updateVoiceGuide(slug: string, content: string): { success: boolean } {
  const db = getDb();
  const result = db.prepare(`UPDATE voice_guide_docs SET content = ? WHERE slug = ?`).run(content, slug);
  return { success: result.changes > 0 };
}

export function createVoiceGuide(title: string, content: string): { slug: string } {
  const db = getDb();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
  db.prepare(
    `INSERT INTO voice_guide_docs (slug, title, content) VALUES (?, ?, ?)`
  ).run(slug, title, content);
  return { slug };
}

// ─── Create & Preview (VISUAL) ───

export async function renderPreviewTool(
  html: string, width: number, height: number
): Promise<{ base64: string }> {
  const base64 = await renderPreview(html, width, height);
  return { base64 };
}

export function saveCreation(
  html: string,
  slotSchema: any,
  platform: string,
  campaignId?: string
): { iterationId: string; creationId: string; htmlPath: string } {
  const db = getDb();
  const now = Date.now();

  // Create campaign if not provided
  if (!campaignId) {
    campaignId = `cmp_${nanoid(10)}`;
    db.prepare(`INSERT INTO campaigns (id, name, created_at) VALUES (?, ?, ?)`).run(
      campaignId, `Chat creation ${new Date().toLocaleDateString()}`, now
    );
  }

  const creationId = `cre_${nanoid(10)}`;
  db.prepare(
    `INSERT INTO creations (id, campaign_id, name, platform, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(creationId, campaignId, `${platform} creation`, platform, now);

  const slideId = `sld_${nanoid(10)}`;
  db.prepare(
    `INSERT INTO slides (id, creation_id, slide_index, created_at) VALUES (?, ?, 0, ?)`
  ).run(slideId, creationId, now);

  const iterationId = `itr_${nanoid(10)}`;
  const htmlRelPath = `.fluid/campaigns/${campaignId}/${creationId}/${slideId}/${iterationId}.html`;
  const htmlAbsPath = path.join(PROJECT_ROOT, htmlRelPath);

  // Ensure directory exists
  fs.mkdirSync(path.dirname(htmlAbsPath), { recursive: true });
  fs.writeFileSync(htmlAbsPath, html, 'utf-8');

  db.prepare(`
    INSERT INTO iterations (id, slide_id, iteration_index, html_path, slot_schema, ai_baseline, status, source, generation_status, created_at)
    VALUES (?, ?, 0, ?, ?, ?, 'unmarked', 'ai', 'complete', ?)
  `).run(iterationId, slideId, htmlRelPath, JSON.stringify(slotSchema), JSON.stringify(slotSchema), now);

  return { iterationId, creationId, htmlPath: htmlRelPath };
}

export function editCreation(
  iterationId: string, html: string, slotSchema?: any
): { success: boolean } {
  const db = getDb();
  const iter = db.prepare(`SELECT html_path FROM iterations WHERE id = ?`).get(iterationId) as any;
  if (!iter) return { success: false };

  const htmlAbsPath = path.join(PROJECT_ROOT, iter.html_path);
  fs.writeFileSync(htmlAbsPath, html, 'utf-8');

  if (slotSchema) {
    db.prepare(`UPDATE iterations SET slot_schema = ? WHERE id = ?`).run(JSON.stringify(slotSchema), iterationId);
  }

  return { success: true };
}

export function saveAsTemplate(
  iterationId: string, name: string, category: string
): { templateId: string } | { error: string } {
  const db = getDb();
  const iter = db.prepare(`SELECT html_path, slot_schema FROM iterations WHERE id = ?`).get(iterationId) as any;
  if (!iter) return { error: 'Iteration not found' };

  const html = fs.readFileSync(path.join(PROJECT_ROOT, iter.html_path), 'utf-8');
  const templateId = `tmpl_${nanoid(10)}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');

  db.prepare(`
    INSERT INTO templates (id, slug, name, category, html, slot_schema, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(templateId, slug, name, category, html, iter.slot_schema, Date.now());

  return { templateId };
}

// ─── UI Awareness (CONTEXT) ───

export function getCreation(iterationId: string): any | null {
  const db = getDb();
  const iter = db.prepare(`
    SELECT i.*, s.creation_id, c.platform, c.campaign_id
    FROM iterations i
    JOIN slides s ON i.slide_id = s.id
    JOIN creations c ON s.creation_id = c.id
    WHERE i.id = ?
  `).get(iterationId) as any;
  if (!iter) return null;

  const htmlAbsPath = path.join(PROJECT_ROOT, iter.html_path);
  const html = fs.existsSync(htmlAbsPath) ? fs.readFileSync(htmlAbsPath, 'utf-8') : '';

  // Merge userState over aiBaseline for current slot values
  const aiBaseline = iter.ai_baseline ? JSON.parse(iter.ai_baseline) : {};
  const userState = iter.user_state ? JSON.parse(iter.user_state) : {};
  const mergedSlots = { ...aiBaseline, ...userState };

  return {
    iterationId: iter.id,
    creationId: iter.creation_id,
    campaignId: iter.campaign_id,
    platform: iter.platform,
    html,
    slotSchema: iter.slot_schema ? JSON.parse(iter.slot_schema) : null,
    mergedSlots,
    status: iter.status,
    hasUserEdits: Object.keys(userState).length > 0,
  };
}

export function getCampaign(campaignId: string): any | null {
  const db = getDb();
  const campaign = db.prepare(`SELECT * FROM campaigns WHERE id = ?`).get(campaignId) as any;
  if (!campaign) return null;

  const creations = db.prepare(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM slides s JOIN iterations i ON s.id = i.slide_id WHERE s.creation_id = c.id) as iterationCount,
      (SELECT i.status FROM slides s JOIN iterations i ON s.id = i.slide_id WHERE s.creation_id = c.id ORDER BY i.created_at DESC LIMIT 1) as latestStatus
    FROM creations c WHERE c.campaign_id = ? ORDER BY c.created_at
  `).all(campaignId) as any[];

  return { ...campaign, creations };
}
```

- [ ] **Step 2: Add the nanoid import at the top of the file**

Make sure the imports at the top of `agent-tools.ts` include `nanoid`:

```typescript
import { nanoid } from 'nanoid';
import { renderPreview } from './render-engine';
```

(Add these to the existing imports if not already present.)

- [ ] **Step 3: Add tests for editing and context tools**

Append to `canvas/tests/agent-tools.test.ts`:

```typescript
import {
  updatePattern, createPattern, deletePattern,
  saveCreation, getCreation, getCampaign,
} from '../src/server/agent-tools';

describe('Brand Editing Tools', () => {
  it('createPattern creates and deletePattern removes a pattern', () => {
    const { slug } = createPattern('test-category', 'Test Pattern', '# Test\nSome content');
    expect(slug).toBe('test-pattern');

    const deleted = deletePattern(slug);
    expect(deleted.success).toBe(true);

    const deletedAgain = deletePattern(slug);
    expect(deletedAgain.success).toBe(false);
  });
});

describe('Create & Preview Tools', () => {
  it('saveCreation creates DB records and writes HTML file', () => {
    const html = '<html><body><h1 class="headline">Test</h1></body></html>';
    const slotSchema = { slots: [{ selector: '.headline', label: 'Headline', type: 'text' }] };
    const result = saveCreation(html, slotSchema, 'instagram');

    expect(result.iterationId).toMatch(/^itr_/);
    expect(result.creationId).toMatch(/^cre_/);
    expect(result.htmlPath).toContain('.fluid/campaigns/');
  });
});

describe('UI Awareness Tools', () => {
  it('getCreation returns merged slot state', () => {
    const html = '<html><body><h1 class="headline">Test</h1></body></html>';
    const slotSchema = { slots: [{ selector: '.headline', label: 'Headline', type: 'text' }] };
    const { iterationId } = saveCreation(html, slotSchema, 'linkedin');

    const creation = getCreation(iterationId);
    expect(creation).not.toBeNull();
    expect(creation.html).toContain('Test');
    expect(creation.slotSchema).toEqual(slotSchema);
    expect(creation.hasUserEdits).toBe(false);
  });
});
```

- [ ] **Step 4: Run tests**

```bash
cd canvas && npx vitest run tests/agent-tools.test.ts
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add canvas/src/server/agent-tools.ts canvas/tests/agent-tools.test.ts
git commit -m "feat: add brand editing, visual, and context tools for sandbox agent"
```

---

## Task 5: Agent System Prompt

**Files:**
- Create: `canvas/src/server/agent-system-prompt.ts`

- [ ] **Step 1: Create the system prompt module**

Create `canvas/src/server/agent-system-prompt.ts`:

```typescript
export const SYSTEM_PROMPT = `You are a creative partner for a brand design system. You help users generate marketing assets, edit brand identity rules, manage templates, and answer questions.

## How You Work

You have tools to discover everything about the brand — voice guide, visual patterns, assets (fonts, images, decorative elements), templates, and layout archetypes. Use them to understand the brand before creating anything.

You care deeply about design quality. When you create HTML, render a preview and look at it. If something doesn't look right, fix it. Iterate on your own work like a designer would — check spacing, hierarchy, typography, and visual balance.

## Guardrails

These rules are non-negotiable for all HTML output:

- All CSS must be in \`<style>\` blocks with class selectors. Never use inline \`style=""\` attributes on elements.
- Output must be self-contained HTML with no external dependencies (no CDN links, no external stylesheets).
- Decorative and background elements use \`<div>\` with \`background-image: url()\`, never \`<img>\` tags.
- Only use fonts that appear in the brand asset registry (check with list_assets).
- Every creation must include a working slot schema based on an archetype. Use list_archetypes and read_archetype to understand the slot structure. You may add slots with clear purpose but never remove core archetype slots.

## Intent Gating

- For brand editing (patterns, voice guide, assets): only make changes when the user explicitly asks you to.
- Confirm before destructive operations (deleting patterns, voice guide docs, etc.).

## Creating Assets

When the user asks you to create a marketing asset:

1. Discover the brand context you need (voice, patterns, assets, archetypes)
2. Choose an appropriate archetype for the platform and content type
3. Create complete, self-contained HTML
4. Render a preview at the correct platform dimensions and look at it
5. Refine until you're satisfied with the visual quality
6. Save using save_creation with a complete slot schema

Platform dimensions for rendering:
- Instagram Square: 1080 x 1080
- Instagram Story: 1080 x 1920
- LinkedIn Post: 1200 x 627
- LinkedIn Article: 1200 x 644
- Facebook Post: 1200 x 630
- Twitter/X Post: 1200 x 675
- One-Pager: 1280 x 1600
`;
```

- [ ] **Step 2: Commit**

```bash
git add canvas/src/server/agent-system-prompt.ts
git commit -m "feat: add brand-agnostic system prompt for sandbox agent"
```

---

## Task 6: Agent Core — Tool-Use Loop

**Files:**
- Create: `canvas/src/server/agent.ts`

- [ ] **Step 1: Create the agent core**

Create `canvas/src/server/agent.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { getDb } from '../lib/db';
import { nanoid } from 'nanoid';
import { SYSTEM_PROMPT } from './agent-system-prompt';
import * as tools from './agent-tools';
import type { ServerResponse } from 'http';

// ─── Tool Definitions ───

const TOOL_DEFINITIONS: Anthropic.Messages.Tool[] = [
  // Brand Discovery
  { name: 'list_voice_guide', description: 'List all voice guide documents with slugs and descriptions. Use to discover brand voice and messaging rules.', input_schema: { type: 'object' as const, properties: {}, required: [] } },
  { name: 'read_voice_guide', description: 'Read the full content of a voice guide document by slug.', input_schema: { type: 'object' as const, properties: { slug: { type: 'string', description: 'Voice guide document slug' } }, required: ['slug'] } },
  { name: 'list_patterns', description: 'List brand patterns (visual design rules, color palettes, typography, decorative elements). Optionally filter by category.', input_schema: { type: 'object' as const, properties: { category: { type: 'string', description: 'Optional category filter (e.g. Colors, Typography, Logos, Images, Decorations, Archetypes)' } }, required: [] } },
  { name: 'read_pattern', description: 'Read the full content of a brand pattern by slug.', input_schema: { type: 'object' as const, properties: { slug: { type: 'string', description: 'Brand pattern slug' } }, required: ['slug'] } },
  { name: 'list_assets', description: 'List brand assets (fonts, images, brushstrokes, logos) with CSS-ready URLs. Optionally filter by type.', input_schema: { type: 'object' as const, properties: { type: { type: 'string', description: 'Optional type filter (e.g. font, image, brushstroke, logo)' } }, required: [] } },
  { name: 'list_templates', description: 'List available templates with names and platforms.', input_schema: { type: 'object' as const, properties: {}, required: [] } },
  { name: 'read_template', description: 'Read a template with its full spec, design rules, and slot schema.', input_schema: { type: 'object' as const, properties: { slug: { type: 'string', description: 'Template slug' } }, required: ['slug'] } },
  { name: 'list_archetypes', description: 'List brand-neutral layout archetypes with their slot names. Archetypes define proven structural foundations for marketing assets.', input_schema: { type: 'object' as const, properties: {}, required: [] } },
  { name: 'read_archetype', description: 'Read an archetype\'s full HTML structure, slot schema (schema.json), and design notes.', input_schema: { type: 'object' as const, properties: { slug: { type: 'string', description: 'Archetype slug (e.g. hero-stat, split-photo-text)' } }, required: ['slug'] } },

  // Brand Editing
  { name: 'update_pattern', description: 'Update an existing brand pattern\'s content. Only use when the user explicitly asks.', input_schema: { type: 'object' as const, properties: { slug: { type: 'string' }, content: { type: 'string' } }, required: ['slug', 'content'] } },
  { name: 'create_pattern', description: 'Create a new brand pattern. Only use when the user explicitly asks.', input_schema: { type: 'object' as const, properties: { category: { type: 'string' }, name: { type: 'string' }, content: { type: 'string' } }, required: ['category', 'name', 'content'] } },
  { name: 'delete_pattern', description: 'Delete a brand pattern. Only use when the user explicitly asks. Confirm before deleting.', input_schema: { type: 'object' as const, properties: { slug: { type: 'string' } }, required: ['slug'] } },
  { name: 'update_voice_guide', description: 'Update a voice guide document. Only use when the user explicitly asks.', input_schema: { type: 'object' as const, properties: { slug: { type: 'string' }, content: { type: 'string' } }, required: ['slug', 'content'] } },
  { name: 'create_voice_guide', description: 'Create a new voice guide document. Only use when the user explicitly asks.', input_schema: { type: 'object' as const, properties: { title: { type: 'string' }, content: { type: 'string' } }, required: ['title', 'content'] } },

  // Visual
  { name: 'render_preview', description: 'Render HTML at specified dimensions and return a screenshot. Use this to see your work and check visual quality.', input_schema: { type: 'object' as const, properties: { html: { type: 'string', description: 'Complete self-contained HTML to render' }, width: { type: 'number', description: 'Viewport width in pixels' }, height: { type: 'number', description: 'Viewport height in pixels' } }, required: ['html', 'width', 'height'] } },
  { name: 'save_creation', description: 'Save an HTML creation to the canvas. Creates campaign/creation/slide/iteration records and writes the HTML file.', input_schema: { type: 'object' as const, properties: { html: { type: 'string', description: 'Complete self-contained HTML' }, slotSchema: { type: 'object', description: 'Slot schema defining editable elements (required)' }, platform: { type: 'string', description: 'Platform (e.g. instagram, linkedin, facebook, twitter, one-pager)' }, campaignId: { type: 'string', description: 'Optional existing campaign ID to add to' } }, required: ['html', 'slotSchema', 'platform'] } },
  { name: 'edit_creation', description: 'Update an existing iteration\'s HTML. Use when iterating on a saved creation.', input_schema: { type: 'object' as const, properties: { iterationId: { type: 'string' }, html: { type: 'string' }, slotSchema: { type: 'object', description: 'Optional updated slot schema' } }, required: ['iterationId', 'html'] } },
  { name: 'save_as_template', description: 'Save an existing creation as a reusable template.', input_schema: { type: 'object' as const, properties: { iterationId: { type: 'string' }, name: { type: 'string' }, category: { type: 'string' } }, required: ['iterationId', 'name', 'category'] } },

  // Context
  { name: 'get_ui_context', description: 'Get the current UI state — which page the user is on, which creation/campaign is selected.', input_schema: { type: 'object' as const, properties: {}, required: [] } },
  { name: 'get_creation', description: 'Get a creation\'s HTML, merged slot values (including user edits), slot schema, and metadata.', input_schema: { type: 'object' as const, properties: { iterationId: { type: 'string' } }, required: ['iterationId'] } },
  { name: 'get_campaign', description: 'Get a campaign with all its creations, iteration counts, and statuses.', input_schema: { type: 'object' as const, properties: { campaignId: { type: 'string' } }, required: ['campaignId'] } },
];

// ─── Tool Executor ───

async function executeTool(
  name: string,
  input: any
): Promise<Anthropic.Messages.ToolResultBlockParam['content']> {
  switch (name) {
    // Brand Discovery
    case 'list_voice_guide': return JSON.stringify(tools.listVoiceGuide());
    case 'read_voice_guide': return JSON.stringify(tools.readVoiceGuide(input.slug));
    case 'list_patterns': return JSON.stringify(tools.listPatterns(input.category));
    case 'read_pattern': return JSON.stringify(tools.readPattern(input.slug));
    case 'list_assets': return JSON.stringify(tools.listAssets(input.type));
    case 'list_templates': return JSON.stringify(tools.listTemplates());
    case 'read_template': return JSON.stringify(tools.readTemplate(input.slug));
    case 'list_archetypes': return JSON.stringify(tools.listArchetypes());
    case 'read_archetype': return JSON.stringify(tools.readArchetype(input.slug));

    // Brand Editing
    case 'update_pattern': return JSON.stringify(tools.updatePattern(input.slug, input.content));
    case 'create_pattern': return JSON.stringify(tools.createPattern(input.category, input.name, input.content));
    case 'delete_pattern': return JSON.stringify(tools.deletePattern(input.slug));
    case 'update_voice_guide': return JSON.stringify(tools.updateVoiceGuide(input.slug, input.content));
    case 'create_voice_guide': return JSON.stringify(tools.createVoiceGuide(input.title, input.content));

    // Visual
    case 'render_preview': {
      const { base64 } = await tools.renderPreviewTool(input.html, input.width, input.height);
      return [
        { type: 'text', text: 'Screenshot rendered successfully.' },
        { type: 'image', source: { type: 'base64', media_type: 'image/png', data: base64 } },
      ];
    }
    case 'save_creation': return JSON.stringify(tools.saveCreation(input.html, input.slotSchema, input.platform, input.campaignId));
    case 'edit_creation': return JSON.stringify(tools.editCreation(input.iterationId, input.html, input.slotSchema));
    case 'save_as_template': return JSON.stringify(tools.saveAsTemplate(input.iterationId, input.name, input.category));

    // Context
    case 'get_ui_context': return JSON.stringify({ note: 'UI context is included in the user message. Use this tool only if you need a fresh snapshot.' });
    case 'get_creation': return JSON.stringify(tools.getCreation(input.iterationId));
    case 'get_campaign': return JSON.stringify(tools.getCampaign(input.campaignId));

    default: return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

// ─── SSE Helpers ───

function sendSSE(res: ServerResponse, event: string, data: any): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ─── Cancellation ───

const activeSessions = new Map<string, { cancelled: boolean }>();

export function cancelChat(chatId: string): void {
  const session = activeSessions.get(chatId);
  if (session) session.cancelled = true;
}

// ─── Agent Loop ───

export async function runAgent(
  chatId: string,
  userContent: string,
  uiContext: any | null,
  res: ServerResponse
): Promise<void> {
  const db = getDb();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const anthropic = new Anthropic({ apiKey });

  // Load existing conversation
  const dbMessages = db.prepare(
    `SELECT role, content, tool_calls, tool_results, ui_context FROM chat_messages WHERE chat_id = ? ORDER BY created_at ASC`
  ).all(chatId) as any[];

  // Build Anthropic message array from DB history
  const messages: Anthropic.Messages.MessageParam[] = [];
  for (const msg of dbMessages) {
    if (msg.role === 'user') {
      const content: any[] = [];
      if (msg.content) content.push({ type: 'text', text: msg.content });
      if (msg.tool_results) {
        const results = JSON.parse(msg.tool_results);
        content.push(...results);
      }
      if (content.length > 0) messages.push({ role: 'user', content });
    } else if (msg.role === 'assistant') {
      const content: any[] = [];
      if (msg.content) content.push({ type: 'text', text: msg.content });
      if (msg.tool_calls) {
        const calls = JSON.parse(msg.tool_calls);
        content.push(...calls);
      }
      if (content.length > 0) messages.push({ role: 'assistant', content });
    }
  }

  // Add current user message
  let userText = userContent;
  if (uiContext) {
    userText += `\n\n[UI Context: ${JSON.stringify(uiContext)}]`;
  }
  messages.push({ role: 'user', content: userText });

  // Persist user message
  const userMsgId = `msg_${nanoid(10)}`;
  db.prepare(
    `INSERT INTO chat_messages (id, chat_id, role, content, ui_context, created_at) VALUES (?, ?, 'user', ?, ?, ?)`
  ).run(userMsgId, chatId, userContent, uiContext ? JSON.stringify(uiContext) : null, Date.now());

  // Set up cancellation tracking
  const session = { cancelled: false };
  activeSessions.set(chatId, session);

  try {
    // Tool-use loop
    while (!session.cancelled) {
      const response = await anthropic.messages.create({
        model: process.env.FLUID_AGENT_MODEL ?? 'claude-sonnet-4-6',
        max_tokens: 16384,
        system: SYSTEM_PROMPT,
        tools: TOOL_DEFINITIONS,
        messages,
      });

      // Process response content blocks
      const assistantContent: any[] = [];
      let textAccumulator = '';
      const toolUseBlocks: any[] = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          textAccumulator += block.text;
          assistantContent.push(block);
          sendSSE(res, 'text', { delta: block.text });
        } else if (block.type === 'tool_use') {
          toolUseBlocks.push(block);
          assistantContent.push(block);
          sendSSE(res, 'tool_start', { tool: block.name, id: block.id, input: block.input });
        }
      }

      // Persist assistant message
      const assistantMsgId = `msg_${nanoid(10)}`;
      db.prepare(
        `INSERT INTO chat_messages (id, chat_id, role, content, tool_calls, created_at) VALUES (?, ?, 'assistant', ?, ?, ?)`
      ).run(
        assistantMsgId, chatId,
        textAccumulator || null,
        toolUseBlocks.length > 0 ? JSON.stringify(toolUseBlocks) : null,
        Date.now()
      );

      // Add to conversation
      messages.push({ role: 'assistant', content: assistantContent });

      // If no tool use, we're done
      if (response.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
        break;
      }

      // Execute tool calls
      if (session.cancelled) break;

      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
      for (const toolCall of toolUseBlocks) {
        if (session.cancelled) break;
        try {
          const result = await executeTool(toolCall.name, toolCall.input);
          toolResults.push({ type: 'tool_result', tool_use_id: toolCall.id, content: result });

          // Send result summary to frontend (skip image data)
          const summary = typeof result === 'string'
            ? result.substring(0, 500)
            : 'Tool completed with rich content';
          sendSSE(res, 'tool_result', {
            id: toolCall.id,
            tool: toolCall.name,
            result: summary,
            hasImage: toolCall.name === 'render_preview',
          });
        } catch (err: any) {
          const errorResult = JSON.stringify({ error: err.message });
          toolResults.push({ type: 'tool_result', tool_use_id: toolCall.id, content: errorResult, is_error: true });
          sendSSE(res, 'tool_result', { id: toolCall.id, tool: toolCall.name, error: err.message });
        }
      }

      // Add tool results to conversation
      messages.push({ role: 'user', content: toolResults });

      // Persist tool results
      const toolResultMsgId = `msg_${nanoid(10)}`;
      db.prepare(
        `INSERT INTO chat_messages (id, chat_id, role, tool_results, created_at) VALUES (?, ?, 'user', ?, ?)`
      ).run(toolResultMsgId, chatId, JSON.stringify(toolResults), Date.now());
    }
  } finally {
    activeSessions.delete(chatId);
  }

  // Auto-title chat if first message
  const msgCount = (db.prepare(`SELECT COUNT(*) as c FROM chat_messages WHERE chat_id = ?`).get(chatId) as any).c;
  if (msgCount <= 3) {
    const title = userContent.substring(0, 80).replace(/\n/g, ' ');
    db.prepare(`UPDATE chats SET title = ?, updated_at = ? WHERE id = ? AND title IS NULL`).run(title, Date.now(), chatId);
  } else {
    db.prepare(`UPDATE chats SET updated_at = ? WHERE id = ?`).run(Date.now(), chatId);
  }

  sendSSE(res, 'done', { chatId });
}
```

- [ ] **Step 2: Commit**

```bash
git add canvas/src/server/agent.ts
git commit -m "feat: add agent core with tool-use loop and SSE streaming"
```

---

## Task 7: Chat API Routes

**Files:**
- Create: `canvas/src/server/chat-routes.ts`
- Modify: `canvas/src/server/watcher.ts:2`

- [ ] **Step 1: Create the chat routes module**

Create `canvas/src/server/chat-routes.ts`:

```typescript
import { getDb } from '../lib/db';
import { nanoid } from 'nanoid';
import { runAgent, cancelChat } from './agent';
import type { IncomingMessage, ServerResponse } from 'http';

function json(res: ServerResponse, data: any, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

export async function handleChatRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
): Promise<boolean> {
  const method = req.method ?? 'GET';
  const pathname = url.pathname;

  // GET /api/chats — list all chats
  if (method === 'GET' && pathname === '/api/chats') {
    const db = getDb();
    const chats = db.prepare(
      `SELECT id, title, created_at as createdAt, updated_at as updatedAt FROM chats ORDER BY updated_at DESC`
    ).all();
    json(res, chats);
    return true;
  }

  // POST /api/chats — create new chat
  if (method === 'POST' && pathname === '/api/chats') {
    const db = getDb();
    const id = `chat_${nanoid(10)}`;
    const now = Date.now();
    db.prepare(`INSERT INTO chats (id, title, created_at, updated_at) VALUES (?, NULL, ?, ?)`).run(id, now, now);
    json(res, { id, title: null, createdAt: now, updatedAt: now }, 201);
    return true;
  }

  // GET /api/chats/:id — get chat with messages
  const chatGetMatch = pathname.match(/^\/api\/chats\/([^/]+)$/);
  if (method === 'GET' && chatGetMatch) {
    const db = getDb();
    const chatId = chatGetMatch[1];
    const chat = db.prepare(`SELECT id, title, created_at as createdAt, updated_at as updatedAt FROM chats WHERE id = ?`).get(chatId);
    if (!chat) { json(res, { error: 'Chat not found' }, 404); return true; }

    const messages = db.prepare(
      `SELECT id, role, content, tool_calls as toolCalls, tool_results as toolResults, ui_context as uiContext, created_at as createdAt
       FROM chat_messages WHERE chat_id = ? ORDER BY created_at ASC`
    ).all(chatId);

    json(res, { ...(chat as any), messages });
    return true;
  }

  // DELETE /api/chats/:id — delete a chat
  const chatDeleteMatch = pathname.match(/^\/api\/chats\/([^/]+)$/);
  if (method === 'DELETE' && chatDeleteMatch) {
    const db = getDb();
    const chatId = chatDeleteMatch[1];
    db.prepare(`DELETE FROM chat_messages WHERE chat_id = ?`).run(chatId);
    db.prepare(`DELETE FROM chats WHERE id = ?`).run(chatId);
    json(res, { success: true });
    return true;
  }

  // POST /api/chats/:id/messages — send message (SSE streaming)
  const msgMatch = pathname.match(/^\/api\/chats\/([^/]+)\/messages$/);
  if (method === 'POST' && msgMatch) {
    const chatId = msgMatch[1];
    const db = getDb();

    // Verify chat exists
    const chat = db.prepare(`SELECT id FROM chats WHERE id = ?`).get(chatId);
    if (!chat) { json(res, { error: 'Chat not found' }, 404); return true; }

    const body = await readBody(req);
    const { content, uiContext } = body;
    if (!content || typeof content !== 'string') {
      json(res, { error: 'content is required' }, 400);
      return true;
    }

    // Set up SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();

    try {
      await runAgent(chatId, content, uiContext ?? null, res);
    } catch (err: any) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
    }

    res.end();
    return true;
  }

  // POST /api/chats/:id/cancel — cancel in-progress agent
  const cancelMatch = pathname.match(/^\/api\/chats\/([^/]+)\/cancel$/);
  if (method === 'POST' && cancelMatch) {
    cancelChat(cancelMatch[1]);
    json(res, { success: true });
    return true;
  }

  return false; // not handled
}
```

- [ ] **Step 2: Wire chat routes into watcher.ts**

In `canvas/src/server/watcher.ts`, add the import near the top (after line 2):

```typescript
import { handleChatRoutes } from './chat-routes';
```

Then find the middleware function where routes are dispatched (the main `server.middlewares.use` callback) and add before the existing route handlers:

```typescript
// Chat routes
const chatUrl = new URL(req.url ?? '/', `http://${req.headers.host}`);
const handled = await handleChatRoutes(req, res, chatUrl);
if (handled) return;
```

- [ ] **Step 3: Verify routes respond**

Start the dev server and test:

```bash
cd canvas && npm run dev &
sleep 3

# Create a chat
curl -s -X POST http://localhost:5174/api/chats | python3 -m json.tool

# List chats
curl -s http://localhost:5174/api/chats | python3 -m json.tool
```

Expected: Chat created with `chat_` prefixed ID, list returns it.

- [ ] **Step 4: Commit**

```bash
git add canvas/src/server/chat-routes.ts canvas/src/server/watcher.ts
git commit -m "feat: add chat API routes with SSE streaming for agent messages"
```

---

## Task 8: Chat Store (Frontend State)

**Files:**
- Create: `canvas/src/store/chat.ts`

- [ ] **Step 1: Create the Zustand chat store**

Create `canvas/src/store/chat.ts`:

```typescript
import { create } from 'zustand';

export interface ChatMessageUI {
  id: string;
  role: 'user' | 'assistant';
  content: string | null;
  toolCalls: ToolCallUI[];
  isStreaming?: boolean;
  createdAt: number;
}

export interface ToolCallUI {
  id: string;
  tool: string;
  input?: any;
  result?: string;
  hasImage?: boolean;
  error?: string;
  status: 'pending' | 'complete' | 'error';
}

export interface ChatSummary {
  id: string;
  title: string | null;
  createdAt: number;
  updatedAt: number;
}

interface ChatState {
  // Chat list
  chats: ChatSummary[];
  activeChatId: string | null;

  // Active chat messages
  messages: ChatMessageUI[];

  // Streaming state
  isStreaming: boolean;
  abortController: AbortController | null;

  // Actions
  loadChats: () => Promise<void>;
  createChat: () => Promise<string>;
  openChat: (chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  sendMessage: (content: string, uiContext?: any) => Promise<void>;
  cancelGeneration: () => void;

  // Internal
  _appendTextDelta: (delta: string) => void;
  _addToolCall: (tc: ToolCallUI) => void;
  _updateToolResult: (id: string, result: string, hasImage?: boolean, error?: string) => void;
  _finishStreaming: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChatId: null,
  messages: [],
  isStreaming: false,
  abortController: null,

  loadChats: async () => {
    const res = await fetch('/api/chats');
    const chats = await res.json();
    set({ chats });
  },

  createChat: async () => {
    const res = await fetch('/api/chats', { method: 'POST' });
    const chat = await res.json();
    set(s => ({ chats: [chat, ...s.chats], activeChatId: chat.id, messages: [] }));
    return chat.id;
  },

  openChat: async (chatId: string) => {
    const res = await fetch(`/api/chats/${chatId}`);
    const data = await res.json();

    const messages: ChatMessageUI[] = (data.messages ?? []).map((m: any) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      toolCalls: m.toolCalls ? JSON.parse(m.toolCalls).map((tc: any) => ({
        id: tc.id, tool: tc.name, input: tc.input, status: 'complete' as const,
      })) : [],
      createdAt: m.createdAt,
    }));

    set({ activeChatId: chatId, messages });
  },

  deleteChat: async (chatId: string) => {
    await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
    set(s => ({
      chats: s.chats.filter(c => c.id !== chatId),
      activeChatId: s.activeChatId === chatId ? null : s.activeChatId,
      messages: s.activeChatId === chatId ? [] : s.messages,
    }));
  },

  sendMessage: async (content: string, uiContext?: any) => {
    const state = get();
    let chatId = state.activeChatId;

    // Create chat if none active
    if (!chatId) {
      chatId = await get().createChat();
    }

    // Add user message to UI
    const userMsg: ChatMessageUI = {
      id: `pending_${Date.now()}`,
      role: 'user',
      content,
      toolCalls: [],
      createdAt: Date.now(),
    };
    set(s => ({ messages: [...s.messages, userMsg] }));

    // Add streaming assistant placeholder
    const assistantMsg: ChatMessageUI = {
      id: `streaming_${Date.now()}`,
      role: 'assistant',
      content: '',
      toolCalls: [],
      isStreaming: true,
      createdAt: Date.now(),
    };
    set(s => ({ messages: [...s.messages, assistantMsg], isStreaming: true }));

    // Start SSE
    const abortController = new AbortController();
    set({ abortController });

    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, uiContext }),
        signal: abortController.signal,
      });

      if (!res.ok || !res.body) {
        get()._finishStreaming();
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            const store = get();

            if (eventType === 'text') {
              store._appendTextDelta(data.delta);
            } else if (eventType === 'tool_start') {
              store._addToolCall({ id: data.id, tool: data.tool, input: data.input, status: 'pending' });
            } else if (eventType === 'tool_result') {
              store._updateToolResult(data.id, data.result, data.hasImage, data.error);
            } else if (eventType === 'done') {
              store._finishStreaming();
            } else if (eventType === 'error') {
              store._appendTextDelta(`\n\nError: ${data.error}`);
              store._finishStreaming();
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        get()._appendTextDelta(`\n\nConnection error: ${err.message}`);
      }
      get()._finishStreaming();
    }

    // Refresh chat list to get updated title
    get().loadChats();
  },

  cancelGeneration: () => {
    const { abortController, activeChatId } = get();
    if (abortController) abortController.abort();
    if (activeChatId) {
      fetch(`/api/chats/${activeChatId}/cancel`, { method: 'POST' });
    }
    get()._finishStreaming();
  },

  _appendTextDelta: (delta: string) => {
    set(s => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last?.role === 'assistant' && last.isStreaming) {
        msgs[msgs.length - 1] = { ...last, content: (last.content ?? '') + delta };
      }
      return { messages: msgs };
    });
  },

  _addToolCall: (tc: ToolCallUI) => {
    set(s => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last?.role === 'assistant' && last.isStreaming) {
        msgs[msgs.length - 1] = { ...last, toolCalls: [...last.toolCalls, tc] };
      }
      return { messages: msgs };
    });
  },

  _updateToolResult: (id: string, result: string, hasImage?: boolean, error?: string) => {
    set(s => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last?.role === 'assistant' && last.isStreaming) {
        const toolCalls = last.toolCalls.map(tc =>
          tc.id === id ? { ...tc, result, hasImage, error, status: error ? 'error' as const : 'complete' as const } : tc
        );
        msgs[msgs.length - 1] = { ...last, toolCalls };
      }
      return { messages: msgs };
    });
  },

  _finishStreaming: () => {
    set(s => {
      const msgs = s.messages.map(m =>
        m.isStreaming ? { ...m, isStreaming: false } : m
      );
      return { messages: msgs, isStreaming: false, abortController: null };
    });
  },
}));
```

- [ ] **Step 2: Commit**

```bash
git add canvas/src/store/chat.ts
git commit -m "feat: add Zustand chat store with SSE streaming support"
```

---

## Task 9: Chat Sidebar UI

**Files:**
- Create: `canvas/src/components/ChatMessage.tsx`
- Create: `canvas/src/components/ChatHistory.tsx`
- Create: `canvas/src/components/ChatSidebar.tsx`
- Create: `canvas/src/components/ChatSidebar.css`
- Modify: `canvas/src/components/AppShell.tsx`

- [ ] **Step 1: Create ChatMessage component**

Create `canvas/src/components/ChatMessage.tsx`:

```tsx
import React, { useState } from 'react';
import type { ChatMessageUI, ToolCallUI } from '../store/chat';

function ToolCallBlock({ tc }: { tc: ToolCallUI }) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon = tc.status === 'pending' ? '⏳' : tc.status === 'error' ? '❌' : '✅';
  const label = tc.tool.replace(/_/g, ' ');

  return (
    <div className="chat-tool-call" onClick={() => setExpanded(!expanded)}>
      <div className="chat-tool-header">
        <span className="chat-tool-status">{statusIcon}</span>
        <span className="chat-tool-name">{label}</span>
        {tc.hasImage && <span className="chat-tool-badge">screenshot</span>}
        <span className="chat-tool-expand">{expanded ? '▾' : '▸'}</span>
      </div>
      {expanded && tc.result && (
        <pre className="chat-tool-result">{tc.result}</pre>
      )}
      {expanded && tc.error && (
        <pre className="chat-tool-result chat-tool-error">{tc.error}</pre>
      )}
    </div>
  );
}

export function ChatMessage({ message }: { message: ChatMessageUI }) {
  const isUser = message.role === 'user';

  return (
    <div className={`chat-message chat-message-${message.role}`}>
      <div className="chat-message-role">{isUser ? 'You' : 'Agent'}</div>
      {message.content && (
        <div className="chat-message-content">{message.content}</div>
      )}
      {message.toolCalls.length > 0 && (
        <div className="chat-tool-calls">
          {message.toolCalls.map(tc => (
            <ToolCallBlock key={tc.id} tc={tc} />
          ))}
        </div>
      )}
      {message.isStreaming && !message.content && message.toolCalls.length === 0 && (
        <div className="chat-message-thinking">Thinking...</div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create ChatHistory component**

Create `canvas/src/components/ChatHistory.tsx`:

```tsx
import React from 'react';
import { useChatStore } from '../store/chat';

export function ChatHistory() {
  const { chats, activeChatId, openChat, createChat, deleteChat, loadChats } = useChatStore();

  React.useEffect(() => { loadChats(); }, []);

  return (
    <div className="chat-history">
      <button className="chat-new-btn" onClick={() => createChat()}>
        + New Chat
      </button>
      <div className="chat-history-list">
        {chats.map(chat => (
          <div
            key={chat.id}
            className={`chat-history-item ${chat.id === activeChatId ? 'active' : ''}`}
            onClick={() => openChat(chat.id)}
          >
            <span className="chat-history-title">
              {chat.title ?? 'New chat'}
            </span>
            <button
              className="chat-history-delete"
              onClick={e => { e.stopPropagation(); deleteChat(chat.id); }}
              title="Delete chat"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create ChatSidebar component**

Create `canvas/src/components/ChatSidebar.tsx`:

```tsx
import React, { useRef, useEffect, useState } from 'react';
import { useChatStore } from '../store/chat';
import { useCampaignStore } from '../store/campaign';
import { ChatMessage } from './ChatMessage';
import { ChatHistory } from './ChatHistory';
import './ChatSidebar.css';

export function ChatSidebar() {
  const {
    messages, activeChatId, isStreaming,
    sendMessage, cancelGeneration,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    // Gather UI context from campaign store
    const campaignState = useCampaignStore.getState();
    const uiContext = {
      currentView: campaignState.currentView,
      activeCampaignId: campaignState.activeCampaignId,
      activeCreationId: campaignState.activeCreationId,
      activeIterationId: campaignState.activeIterationId,
    };

    sendMessage(input.trim(), uiContext);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-sidebar">
      {/* Header */}
      <div className="chat-sidebar-header">
        <button
          className="chat-history-toggle"
          onClick={() => setShowHistory(!showHistory)}
          title="Chat history"
        >
          ☰
        </button>
        <span className="chat-sidebar-title">
          {activeChatId ? 'Chat' : 'New Chat'}
        </span>
        {isStreaming && (
          <button className="chat-cancel-btn" onClick={cancelGeneration}>
            Stop
          </button>
        )}
      </div>

      {/* History panel (toggleable) */}
      {showHistory && (
        <div className="chat-history-panel">
          <ChatHistory />
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages-container">
        {messages.length === 0 && (
          <div className="chat-empty-state">
            <p>Ask me anything about your brand, or tell me what to create.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={msg.id ?? i} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <textarea
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message your creative partner..."
          rows={2}
          disabled={isStreaming}
        />
        <button
          className="chat-send-btn"
          type="submit"
          disabled={!input.trim() || isStreaming}
        >
          Send
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Create ChatSidebar.css**

Create `canvas/src/components/ChatSidebar.css`:

```css
.chat-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary, #fff);
  border-right: 1px solid var(--border, #e2e8f0);
}

.chat-sidebar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border, #e2e8f0);
  flex-shrink: 0;
}

.chat-sidebar-title {
  font-weight: 600;
  font-size: 14px;
  flex: 1;
}

.chat-history-toggle {
  background: none;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;
}

.chat-cancel-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
}

/* History panel */
.chat-history-panel {
  border-bottom: 1px solid var(--border, #e2e8f0);
  max-height: 300px;
  overflow-y: auto;
  flex-shrink: 0;
}

.chat-new-btn {
  width: 100%;
  padding: 10px;
  background: none;
  border: none;
  border-bottom: 1px solid var(--border, #e2e8f0);
  cursor: pointer;
  font-size: 13px;
  text-align: left;
  color: var(--text-secondary, #64748b);
}

.chat-new-btn:hover { background: var(--bg-hover, #f8fafc); }

.chat-history-list { padding: 4px 0; }

.chat-history-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
}

.chat-history-item:hover { background: var(--bg-hover, #f8fafc); }
.chat-history-item.active { background: var(--bg-active, #eff6ff); }

.chat-history-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.chat-history-delete {
  background: none;
  border: none;
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
  font-size: 16px;
  padding: 0 4px;
  opacity: 0;
}

.chat-history-item:hover .chat-history-delete { opacity: 1; }

/* Messages */
.chat-messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.chat-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted, #94a3b8);
  font-size: 14px;
  text-align: center;
  padding: 40px;
}

.chat-message {
  margin-bottom: 16px;
}

.chat-message-role {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted, #94a3b8);
  margin-bottom: 4px;
}

.chat-message-content {
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.chat-message-user .chat-message-content {
  color: var(--text-primary, #1e293b);
}

.chat-message-assistant .chat-message-content {
  color: var(--text-primary, #334155);
}

.chat-message-thinking {
  color: var(--text-muted, #94a3b8);
  font-style: italic;
  font-size: 13px;
}

/* Tool calls */
.chat-tool-calls {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.chat-tool-call {
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
}

.chat-tool-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  font-size: 12px;
  background: var(--bg-secondary, #f8fafc);
}

.chat-tool-name { font-weight: 500; color: var(--text-secondary, #475569); }
.chat-tool-status { font-size: 11px; }

.chat-tool-badge {
  background: #8b5cf6;
  color: white;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 10px;
}

.chat-tool-expand { margin-left: auto; color: var(--text-muted, #94a3b8); font-size: 10px; }

.chat-tool-result {
  padding: 8px 10px;
  font-size: 11px;
  background: var(--bg-primary, #fff);
  border-top: 1px solid var(--border, #e2e8f0);
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

.chat-tool-error { color: #dc2626; }

/* Input */
.chat-input-form {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border, #e2e8f0);
  flex-shrink: 0;
}

.chat-input {
  flex: 1;
  resize: none;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
}

.chat-input:focus { border-color: var(--accent, #3b82f6); }

.chat-send-btn {
  background: var(--accent, #3b82f6);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  align-self: flex-end;
}

.chat-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

- [ ] **Step 5: Update AppShell to use ChatSidebar**

In `canvas/src/components/AppShell.tsx`, find where `PromptSidebar` is imported or composed as the left sidebar prop. Replace it with `ChatSidebar`:

```typescript
import { ChatSidebar } from './ChatSidebar';
```

Replace the `PromptSidebar` reference with `<ChatSidebar />` in the sidebar slot.

Note: The exact change depends on how AppShell receives its sidebar — it uses a `leftSidebar` prop. Find where AppShell is instantiated (likely in the app root/router) and pass `<ChatSidebar />` instead of `<PromptSidebar />`.

- [ ] **Step 6: Verify the UI renders**

```bash
cd canvas && npm run dev
```

Open http://localhost:5174/app/ — the chat sidebar should appear with the "New Chat" button and empty state message.

- [ ] **Step 7: Commit**

```bash
git add canvas/src/components/ChatMessage.tsx canvas/src/components/ChatHistory.tsx canvas/src/components/ChatSidebar.tsx canvas/src/components/ChatSidebar.css canvas/src/components/AppShell.tsx
git commit -m "feat: add ChatSidebar UI replacing PromptSidebar"
```

---

## Task 10: Delete Old Pipeline Code

**Files:**
- Delete: `canvas/src/server/api-pipeline.ts`
- Delete: `canvas/src/components/PromptSidebar.tsx`
- Delete: `canvas/src/store/generation.ts`
- Delete: `canvas/src/hooks/useGenerationStream.ts`
- Delete: `.claude/agents/copy-agent.md`
- Delete: `.claude/agents/layout-agent.md`
- Delete: `.claude/agents/styling-agent.md`
- Delete: `.claude/agents/spec-check-agent.md`
- Modify: `canvas/src/server/watcher.ts`

- [ ] **Step 1: Remove api-pipeline import from watcher.ts**

In `canvas/src/server/watcher.ts`, remove line 2:

```typescript
// DELETE THIS LINE:
import { runApiPipeline, type PipelineContext } from './api-pipeline';
```

- [ ] **Step 2: Remove /api/generate and /api/generate/cancel routes from watcher.ts**

In `canvas/src/server/watcher.ts`, delete the route handlers at lines 2079-2244 (the `POST /api/generate/cancel` and `POST /api/generate` blocks). These are replaced by the chat routes.

- [ ] **Step 3: Remove any remaining references to GenerationStore**

Search the codebase for imports of `generation.ts` store or `useGenerationStream` and remove them. Check:
- Any component that imports from `../store/generation`
- Any component that imports `useGenerationStream`
- Build-hero components that trigger the old generation flow

For BuildHero, update it to use the chat store's `sendMessage` instead.

- [ ] **Step 4: Delete the old files**

```bash
rm canvas/src/server/api-pipeline.ts
rm canvas/src/components/PromptSidebar.tsx
rm canvas/src/store/generation.ts
rm canvas/src/hooks/useGenerationStream.ts
rm .claude/agents/copy-agent.md
rm .claude/agents/layout-agent.md
rm .claude/agents/styling-agent.md
rm .claude/agents/spec-check-agent.md
```

- [ ] **Step 5: Verify the app still builds**

```bash
cd canvas && npx tsc --noEmit
```

Expected: No type errors. If there are remaining references to deleted files, fix them.

- [ ] **Step 6: Verify the app runs**

```bash
cd canvas && npm run dev
```

Open http://localhost:5174/app/ — app should load with ChatSidebar, no console errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: remove old 4-stage pipeline, subagent definitions, and generation UI"
```

---

## Task 11: End-to-End Smoke Test

**Files:** No new files — this is a manual verification task.

- [ ] **Step 1: Start the dev server**

```bash
cd canvas && npm run dev
```

Ensure `ANTHROPIC_API_KEY` is set in `.env`.

- [ ] **Step 2: Create a new chat and send a simple question**

Open http://localhost:5174/app/. Click "New Chat" (or the empty state). Type:

> "What brand patterns are available?"

Expected: Agent calls `list_patterns`, tool call is visible and expandable, agent responds with a summary of patterns.

- [ ] **Step 3: Ask for a generation**

In the same chat, type:

> "Create an Instagram post announcing a product launch"

Expected: Agent calls brand discovery tools, creates HTML, calls `render_preview` (screenshot badge visible), calls `save_creation`. The creation should appear in the campaigns view.

- [ ] **Step 4: Iterate on the creation**

In the same chat, type:

> "Make the headline shorter and punchier"

Expected: Agent calls `get_creation` or uses context from the conversation, edits the HTML, renders a new preview, saves via `edit_creation`.

- [ ] **Step 5: Verify chat persistence**

Refresh the page. Open chat history. Click on the previous chat. All messages should be there.

- [ ] **Step 6: Verify canvas editor still works**

Navigate to the campaign/creation created in step 3. Open the editor sidebar. Verify slot editing works (text changes, transforms, etc.).

- [ ] **Step 7: Commit any fixes discovered during testing**

```bash
git add -A
git commit -m "fix: address issues found during sandbox pipeline smoke test"
```

---

## Task 12: Update Context Map Cleanup (Optional)

**Files:**
- Modify: `canvas/src/server/watcher.ts`

The old `context_map` and `context_log` tables are no longer used by the new agent (it discovers context via tools). These routes and tables can be removed or left as dead code for now.

- [ ] **Step 1: Remove context_map and context_log API routes from watcher.ts**

Search for `/api/context-map` and `/api/context-log` route handlers and remove them.

- [ ] **Step 2: Remove Settings page navigation if it only showed context map**

Check if the Settings page in the left nav exists solely for context map editing. If so, remove the nav entry. If it has other settings, just remove the context map section.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "cleanup: remove context_map and context_log routes (no longer used by sandbox agent)"
```

---

## Summary

| Task | Description | Est. Complexity |
|------|-------------|-----------------|
| 1 | DB Schema — chat tables | Small |
| 2 | Render Engine — Playwright screenshots | Medium |
| 3 | Agent Tools — Brand Discovery | Medium |
| 4 | Agent Tools — Editing, Visual, Context | Medium |
| 5 | Agent System Prompt | Small |
| 6 | Agent Core — Tool-use loop | Large |
| 7 | Chat API Routes | Medium |
| 8 | Chat Store (Zustand) | Medium |
| 9 | Chat Sidebar UI | Medium |
| 10 | Delete Old Pipeline | Small |
| 11 | End-to-End Smoke Test | Medium |
| 12 | Context Map Cleanup (optional) | Small |

Total: 12 tasks. Tasks 1-9 are the core build. Task 10 is cleanup. Task 11 is verification. Task 12 is optional housekeeping.

## Deferred to Follow-Up

These spec requirements are intentionally deferred until the single-agent flow works end-to-end:

- **Campaign fan-out orchestrator** — Spawning parallel agents for multi-platform prompts (e.g. "make a LinkedIn post and an Instagram story"). Requires `parseChannelHints()` integration and parallel SSE multiplexing. Build after single-creation works.
- **Image upload in chat input** — Using the existing `/api/uploads/chat-image` endpoint to let users send reference images to the agent. Requires adding an upload button to ChatSidebar and passing image content blocks in the user message.
- **Token limit management** — Sliding window or summarization for long conversations. Not needed until real usage reveals conversation length patterns.
- **Simulation harness update** — Rewriting `tools/simulate-pipeline.cjs` for single-agent mode.
