# The Sandbox: Pipeline Redesign Spec

> Replace the 4-stage sequential pipeline with a single conversational agent that acts as a creative partner.

## Motivation

The current pipeline prescribes *how* the model should work: copy → layout → styling → spec-check → fix loops, with smart context injection, token budgets, per-section caps, and stage-specific tool sets. As models get smarter, this over-specification becomes a liability. The "bitter lesson" of AI systems: simpler architectures that trust the model outperform complex scaffolding.

The new system gives the model the **goal**, the **guardrails**, and the **tools** — then gets out of the way.

## Design Principles

1. **Outcome over process** — Specify what and why, never how
2. **Brand-agnostic** — System prompt contains zero brand-specific content. All brand identity is runtime data from the DB
3. **Agent pulls, not pushed** — The agent discovers brand context via tools rather than having it pre-injected
4. **Visual self-critique** — The agent can render and see its own work, iterating like a designer would
5. **Conversational** — One persistent conversation per chat, not a fire-and-forget pipeline
6. **Slot schemas are sacred** — Every creation must have a working slot schema for canvas editability

---

## Architecture Overview

```
User sends message in chat sidebar
  ↓
Chat layer: persist message, load conversation history
  ↓
Intent detection: is this generation, a question, brand editing, etc.?
  (The agent decides — no explicit routing)
  ↓
Agent core: messages.create() with tool-use loop
  Agent discovers brand context via tools
  Agent creates HTML (for generation intents)
  Agent renders preview, looks at screenshot
  Agent refines until satisfied
  Agent saves via save_creation()
  ↓
User sees streaming response + tool call indicators
User can continue conversation for iterations
User can edit slots in canvas editor
User can start a new chat anytime
```

### What Gets Deleted

- `api-pipeline.ts` — 4-stage orchestration (~800 lines)
- `buildCopyPrompt()` / `buildLayoutPrompt()` / `buildStylingPrompt()` / `buildSpecCheckPrompt()`
- Smart context injection system (`context_map`, `context_log` DB tables)
- Fix loops + micro-fix regex engine
- 4 subagent definitions (`.claude/agents/copy-agent.md`, `layout-agent.md`, `styling-agent.md`, `spec-check-agent.md`)
- Design DNA injection logic
- Token budgets and per-section caps
- Archetype vs template routing logic
- `PromptSidebar` component
- `GenerationStore` (replaced by chat store)
- `useGenerationStream` hook

### What Stays

- DB schema: campaigns, creations, slides, iterations (unchanged)
- Canvas editor + slot editing (SlotSchema, userState, aiBaseline)
- Brand data tables: `voice_guide_docs`, `brand_patterns`, `brand_assets`, `templates`, `template_design_rules`
- Asset serving (`/fluid-assets/`, `/api/brand-assets/serve/`)
- `parseChannelHints()` — prompt parsing for single vs campaign routing
- Left nav + main viewport + all brand management pages (Patterns, Voice Guide, Assets, Templates)
- DB export/import tooling
- DAM sync
- HMR/live reload system
- All existing CRUD API routes

---

## Agent Core

### Implementation

Direct Anthropic API with a tool-use loop. No framework, no agent SDK.

```
function runAgent(chatId, userMessage, uiContext):
  messages = loadChatMessages(chatId)
  messages.push({ role: "user", content: userMessage + uiContext })

  while true:
    response = anthropic.messages.create({
      model: "claude-sonnet-4-6",  // or configurable
      system: SYSTEM_PROMPT,
      tools: TOOL_DEFINITIONS,
      messages: messages
    })

    persistAssistantMessage(chatId, response)
    streamToFrontend(response)

    if response.stop_reason === "end_turn":
      break

    if response.stop_reason === "tool_use":
      toolResults = executeToolCalls(response.tool_use_blocks)
      messages.push(assistantMessage)
      messages.push({ role: "user", content: toolResults })
      persistToolResults(chatId, toolResults)

  return response
```

The entire orchestration is ~200 lines of TypeScript.

### System Prompt

~300 tokens. Brand-agnostic. Three sections:

**Identity & Disposition:**
> You are a creative partner for a brand design system. You can generate marketing assets, edit brand rules, manage templates, and answer questions about the brand. You have tools to discover everything about the brand — use them to understand the brand before creating. You care deeply about design quality and routinely render and check your visual output. For brand editing (patterns, voice guide, assets), only make changes when the user explicitly asks.

**Guardrails (universal, not brand-specific):**
- All CSS in `<style>` blocks with class selectors. Never use inline `style=""` attributes.
- Output must be self-contained HTML with no external dependencies.
- Decorative/background elements use `<div>` with `background-image: url()`, never `<img>` tags.
- Only use fonts that appear in the brand asset registry.
- Every creation must include a working slot schema based on the archetype used. Archetype slots are the baseline; you may add slots with taste but never remove core archetype slots.

**Tool catalog:** Just the tool definitions with clear descriptions. No instructions on when or how to call them.

### Campaign Fan-Out

When `parseChannelHints()` detects multiple platforms in a prompt:

1. Orchestrator creates Campaign + Creation + Slide + Iteration records in DB
2. Spawns one independent agent session per creation (parallel)
3. Each agent discovers brand context independently (cheap — a few tool calls)
4. Each agent has its own conversation that persists for future iterations
5. Frontend shows progress per-creation via SSE

Single-creation prompts skip the orchestrator — direct agent session.

From the user's perspective, this is all one chat. The fan-out happens internally — the user sees streaming results for each creation arriving in their conversation. When the user later says "make the LinkedIn headline punchier," the agent knows which creation to iterate on (from UI context or by asking).

---

## Tool Suite

### Brand Discovery (READ)

| Tool | Returns |
|------|---------|
| `list_voice_guide()` | Array of `{ slug, title, description }` |
| `read_voice_guide(slug)` | Full markdown content of a voice guide doc |
| `list_patterns(category?)` | Array of `{ slug, name, category, weight, description }` |
| `read_pattern(slug)` | Full markdown content of a brand pattern |
| `list_assets(type?)` | Array of `{ name, type, cssUrl, fontSrc, imgSrc, description }` |
| `list_templates()` | Array of `{ slug, name, platform, description }` |
| `read_template(slug)` | Full template spec + design rules + slot schema |
| `list_archetypes()` | Array of `{ slug, name, platform, description, slots[] }` |
| `read_archetype(slug)` | Full HTML + schema.json + archetype notes |

All brand discovery tools query the SQLite DB directly (same process), except archetype tools which read from the `archetypes/` filesystem directory. No HTTP round-trips.

### Brand Editing (WRITE)

| Tool | Effect |
|------|--------|
| `update_pattern(slug, content)` | Update a brand pattern's content |
| `create_pattern(category, name, content)` | Create a new brand pattern |
| `delete_pattern(slug)` | Delete a brand pattern |
| `update_voice_guide(slug, content)` | Update a voice guide doc |
| `create_voice_guide(title, content)` | Create a new voice guide doc |

These tools are gated by the system prompt instruction: "only make changes when the user explicitly asks." The agent should confirm before executing destructive operations (delete).

### Create & Preview (VISUAL)

| Tool | Returns |
|------|---------|
| `render_preview(html, width, height)` | Base64 PNG screenshot of rendered HTML |
| `save_creation(html, slotSchema, platform, campaignId?)` | Creates iteration record, writes HTML to canonical path, returns iterationId |
| `edit_creation(iterationId, html, slotSchema?)` | Updates an existing iteration's HTML |
| `save_as_template(iterationId, name, category)` | Saves a creation as a reusable template |

`save_creation()` requires a `slotSchema` parameter — the agent cannot save without defining editable slots.

### UI Awareness (CONTEXT)

| Tool | Returns |
|------|---------|
| `get_ui_context()` | Current page, selected campaign/creation/iteration, view state |
| `get_creation(iterationId)` | HTML + merged slot values (userState over aiBaseline) + slotSchema + metadata |
| `get_campaign(campaignId)` | All creations with status, iteration counts |

`get_creation()` returns the **merged** state — if the user manually edited slots, those edits are reflected. The agent treats this as the current truth and preserves user edits when iterating.

UI context is also auto-appended to each user message as a small JSON blob by the frontend, so the agent has ambient awareness without needing to call a tool.

---

## Render Engine

Pre-warmed Playwright instance for fast visual feedback.

- **Startup:** Launch a Chromium browser instance when the server starts. Keep it alive.
- **Render flow:** Write HTML to temp file → navigate browser page → screenshot at specified dimensions → return base64 PNG
- **Target latency:** <1 second per render
- **Platform dimensions:** Passed as `width` and `height` parameters (1080x1080 for IG square, 1080x1920 for IG story, 1200x627 for LinkedIn, etc.)
- **Image delivery:** Base64 in the tool result content block. The Anthropic API supports image content in tool results via vision.
- **Concurrency:** One browser instance, multiple pages (one per active agent session). Pages are reused and navigated.

No complexity beyond this. One function, one screenshot, one return value.

---

## Chat & Conversation Layer

### DB Schema

```sql
CREATE TABLE chats (
  id TEXT PRIMARY KEY,
  title TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL REFERENCES chats(id),
  role TEXT NOT NULL,           -- 'user' | 'assistant'
  content TEXT,                 -- text content
  tool_calls TEXT,              -- JSON array of tool call blocks (assistant messages)
  tool_results TEXT,            -- JSON array of tool result blocks (user messages)
  ui_context TEXT,              -- JSON blob of UI state at time of message
  created_at TEXT DEFAULT (datetime('now'))
);
```

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/chats` | GET | List all chats (newest first) |
| `/api/chats` | POST | Create new chat |
| `/api/chats/:id` | GET | Get chat with messages |
| `/api/chats/:id` | DELETE | Delete a chat |
| `/api/chats/:id/messages` | POST | Send message, triggers agent (SSE response) |
| `/api/chats/:id/cancel` | POST | Cancel in-progress agent execution |

### Conversation Lifecycle

1. **New chat:** Frontend creates a chat via `POST /api/chats`. Returns chat ID.
2. **Send message:** Frontend sends `POST /api/chats/:id/messages` with `{ content, uiContext }`. Server loads chat history, appends message, calls agent. Response streams via SSE.
3. **Continue chat:** Same endpoint. Server loads full message history from DB, appends new message.
4. **Auto-title:** After first assistant response, generate a title from the conversation (or use first ~50 chars of user message).
5. **Chat history:** `GET /api/chats` returns list for sidebar. User can switch between chats or start new ones.

### Frontend UX

The chat sidebar replaces `PromptSidebar`:

- **Left panel:** Chat history list + "New Chat" button
- **Main area:** Message thread with streaming text
- **Tool calls visible:** Expandable blocks showing tool name + result (like Claude Desktop)
- **Tool indicators:** "Browsing brand patterns..." "Rendering preview..." badges during execution
- **Image previews:** When render_preview returns a screenshot, show it inline in the chat
- **Input:** Text input + image upload (uses existing `/api/uploads/chat-image` endpoint)

### Streaming Protocol

SSE events from `POST /api/chats/:id/messages`:

```
event: text
data: {"delta": "Let me look at the brand..."}

event: tool_start
data: {"tool": "list_patterns", "id": "tc_1"}

event: tool_result
data: {"id": "tc_1", "result": "Found 12 patterns across 6 categories"}

event: tool_start
data: {"tool": "render_preview", "id": "tc_2"}

event: tool_result
data: {"id": "tc_2", "hasImage": true}

event: text
data: {"delta": "Here's what I've created..."}

event: done
data: {"messageId": "msg_xxx"}
```

---

## Archetype & Slot Schema Contract

Archetypes are brand-neutral layout foundations with proven slot schemas. They live in `archetypes/` on the filesystem.

### Agent's Relationship to Archetypes

1. Agent browses available archetypes via `list_archetypes()` / `read_archetype(slug)`
2. Agent selects an archetype as the structural foundation for its creation
3. Agent's output HTML must include all core slots defined in the archetype's `schema.json`
4. Agent may add additional slots (with taste — purposeful additions, not arbitrary)
5. Agent must never remove core archetype slots
6. The `slotSchema` passed to `save_creation()` must be a superset of the archetype's schema

### Slot Schema Format

The existing slot schema format is preserved:

```json
{
  "slots": [
    {
      "selector": ".headline",
      "label": "Headline",
      "type": "text"
    },
    {
      "selector": ".body-copy",
      "label": "Body Copy",
      "type": "text"
    }
  ]
}
```

Special prefixes for transform/positioning slots:
- `__transform__:{selector}` — CSS transform values
- `__textbox__:{selector}` — JSON with width, height, left, top, align, fontPreset, fontSizePx
- `__brushTransform__` — nested selector → transform map for decorative elements

The agent should learn these conventions from the archetype schemas it reads, not from hardcoded instructions.

---

## Error Handling

### API Failures
- Anthropic API errors: Log, set chat message status to error, return error SSE event. User can retry by sending another message (conversation history is preserved).
- Tool execution failures: Return error in tool result. The agent sees the error and can decide how to recover (retry, try different approach, ask user).

### Cancellation
- `POST /api/chats/:id/cancel` sets a cancellation flag
- Agent loop checks flag between tool calls
- If cancelled, agent stops, partial work is preserved in chat history
- Any HTML already saved via `save_creation()` persists

### Token Limits
- For long conversations, implement sliding window: keep system prompt + last N messages + any messages containing saved creation references
- Summarize older messages if needed (or let the model handle it — it's good at working with truncated history)

---

## Migration Path

This is not a gradual migration — it's a clean replacement:

1. Build the new agent core, tools, and render engine alongside the existing pipeline
2. Build the new chat sidebar and chat persistence layer
3. Wire up the new `/api/chats/` routes
4. Switch the frontend to use the new chat sidebar
5. Delete the old pipeline code, subagent definitions, and related infrastructure
6. Update the simulation harness for single-agent mode

The existing DB schema for campaigns/creations/slides/iterations is unchanged. The new chat layer is additive. Brand data tables are unchanged — only the tools that access them are new.

---

## What This Enables

- **Any intent, one interface:** Generate assets, edit brand rules, ask questions, save templates — all through natural conversation
- **True iteration:** The agent remembers what you've been working on and preserves your manual edits
- **Brand-agnostic:** Load a different brand into the DB and everything works. Zero code changes.
- **Model-upgradeable:** When a smarter model drops, the system gets better automatically because we're not over-constraining it
- **Debuggable:** The chat history is a complete audit trail of what the agent did and why
