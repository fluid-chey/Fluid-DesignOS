/**
 * Unit tests for api-pipeline.ts
 * Tests: tool executor, tool schemas, stage prompt loader, STAGE_MODELS
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fsSync from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// ---------------------------------------------------------------------------
// Mocks — hoisted before imports
// ---------------------------------------------------------------------------

// Mock child_process for run_brand_check tests
vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return {
    ...actual,
    execSync: vi.fn(() => '{"pass":true,"issues":[]}'),
  };
});

// We DO NOT mock the Anthropic SDK — these tests never call the API

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { executeTool, PIPELINE_TOOLS, loadStagePrompt, STAGE_MODELS } from '../server/api-pipeline';
import type { PipelineContext } from '../server/api-pipeline';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.resolve(__dirname, '../../..');

function makeCtx(overrides: Partial<PipelineContext> = {}): PipelineContext {
  return {
    prompt: 'Test prompt',
    creationType: 'instagram',
    workingDir: '/tmp/test-working-dir',
    htmlOutputPath: '/tmp/test-working-dir/output.html',
    creationId: 'creation-test',
    campaignId: 'campaign-test',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// STAGE_MODELS
// ---------------------------------------------------------------------------

describe('STAGE_MODELS', () => {
  it('maps layout to haiku model', () => {
    expect(STAGE_MODELS.layout).toMatch(/haiku/i);
  });

  it('maps copy to sonnet model', () => {
    expect(STAGE_MODELS.copy).toMatch(/sonnet/i);
  });

  it('maps styling to sonnet model', () => {
    expect(STAGE_MODELS.styling).toMatch(/sonnet/i);
  });

  it('maps spec-check to sonnet model', () => {
    expect(STAGE_MODELS['spec-check']).toMatch(/sonnet/i);
  });
});

// ---------------------------------------------------------------------------
// Tool schemas
// ---------------------------------------------------------------------------

describe('PIPELINE_TOOLS schemas', () => {
  it('exports exactly 4 tools', () => {
    expect(PIPELINE_TOOLS).toHaveLength(4);
  });

  it('all tools have name, description, and input_schema', () => {
    for (const tool of PIPELINE_TOOLS) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.input_schema).toBeTruthy();
      expect(tool.input_schema.type).toBe('object');
    }
  });

  it('read_file schema has required path field', () => {
    const tool = PIPELINE_TOOLS.find((t) => t.name === 'read_file')!;
    expect(tool).toBeDefined();
    expect((tool.input_schema as any).required).toContain('path');
  });

  it('write_file schema has required path and content fields', () => {
    const tool = PIPELINE_TOOLS.find((t) => t.name === 'write_file')!;
    expect(tool).toBeDefined();
    expect((tool.input_schema as any).required).toContain('path');
    expect((tool.input_schema as any).required).toContain('content');
  });

  it('list_files schema has required directory field', () => {
    const tool = PIPELINE_TOOLS.find((t) => t.name === 'list_files')!;
    expect(tool).toBeDefined();
    expect((tool.input_schema as any).required).toContain('directory');
  });

  it('run_brand_check schema has required html_path field', () => {
    const tool = PIPELINE_TOOLS.find((t) => t.name === 'run_brand_check')!;
    expect(tool).toBeDefined();
    expect((tool.input_schema as any).required).toContain('html_path');
  });
});

// ---------------------------------------------------------------------------
// executeTool — read_file
// ---------------------------------------------------------------------------

describe('executeTool: read_file', () => {
  it('reads brand/voice-rules.md and returns contents', async () => {
    const workingDir = PROJECT_ROOT;
    const result = await executeTool('read_file', { path: 'brand/voice-rules.md' }, workingDir);
    expect(result.toLowerCase()).toContain('voice');
    expect(result.length).toBeGreaterThan(100);
  });

  it('returns error string on missing file (does not throw)', async () => {
    const result = await executeTool(
      'read_file',
      { path: 'brand/does-not-exist.md' },
      PROJECT_ROOT,
    );
    expect(result).toMatch(/error/i);
    expect(typeof result).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// executeTool — write_file
// ---------------------------------------------------------------------------

describe('executeTool: write_file', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await import('node:fs/promises').then((fsp) =>
      fsp.mkdtemp(path.join(os.tmpdir(), 'api-pipeline-test-')),
    );
  });

  afterEach(async () => {
    const fsp = await import('node:fs/promises');
    await fsp.rm(tempDir, { recursive: true, force: true });
  });

  it('writes file inside workingDir and returns confirmation', async () => {
    const result = await executeTool(
      'write_file',
      { path: path.join(tempDir, 'hello.txt'), content: 'hello world' },
      tempDir,
    );
    expect(result).toContain('File written');
    const written = fsSync.readFileSync(path.join(tempDir, 'hello.txt'), 'utf-8');
    expect(written).toBe('hello world');
  });

  it('rejects paths outside workingDir (path traversal prevention)', async () => {
    const outsidePath = path.join(os.tmpdir(), 'outside-sandbox.txt');
    const result = await executeTool(
      'write_file',
      { path: outsidePath, content: 'should not be written' },
      tempDir,
    );
    expect(result).toMatch(/outside.*working directory/i);
    expect(fsSync.existsSync(outsidePath)).toBe(false);
  });

  it('creates parent directories automatically', async () => {
    const nestedPath = path.join(tempDir, 'sub', 'dir', 'file.txt');
    const result = await executeTool(
      'write_file',
      { path: nestedPath, content: 'nested content' },
      tempDir,
    );
    expect(result).toContain('File written');
    expect(fsSync.existsSync(nestedPath)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// executeTool — list_files
// ---------------------------------------------------------------------------

describe('executeTool: list_files', () => {
  it('lists brand directory and includes markdown files', async () => {
    const result = await executeTool('list_files', { directory: 'brand' }, PROJECT_ROOT);
    expect(result).toContain('voice-rules.md');
    expect(result).toContain('design-tokens.md');
  });

  it('filters by pattern when provided', async () => {
    const result = await executeTool(
      'list_files',
      { directory: 'brand', pattern: '*.md' },
      PROJECT_ROOT,
    );
    // All results should end in .md
    const files = result.split('\n').filter(Boolean);
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      expect(f).toMatch(/\.md$/);
    }
  });

  it('returns error string on missing directory (does not throw)', async () => {
    const result = await executeTool(
      'list_files',
      { directory: 'brand/nonexistent-subdir' },
      PROJECT_ROOT,
    );
    expect(result).toMatch(/error/i);
    expect(typeof result).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// executeTool — run_brand_check
// ---------------------------------------------------------------------------

describe('executeTool: run_brand_check', () => {
  it('calls brand-compliance CLI and returns stdout', async () => {
    const { execSync } = await import('node:child_process');
    (execSync as ReturnType<typeof vi.fn>).mockReturnValueOnce('{"pass":true,"issues":[]}');

    const result = await executeTool(
      'run_brand_check',
      { html_path: 'test.html' },
      PROJECT_ROOT,
    );
    expect(result).toContain('"pass"');
    expect(execSync).toHaveBeenCalled();
  });

  it('returns error string when CLI fails (does not throw)', async () => {
    const { execSync } = await import('node:child_process');
    (execSync as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      const err = Object.assign(new Error('CLI failed'), { stderr: 'CLI error output' });
      throw err;
    });

    const result = await executeTool(
      'run_brand_check',
      { html_path: 'test.html' },
      PROJECT_ROOT,
    );
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// executeTool — unknown tool
// ---------------------------------------------------------------------------

describe('executeTool: unknown tool', () => {
  it('returns unknown tool message for unrecognized tool names', async () => {
    const result = await executeTool('unknown_tool', {}, PROJECT_ROOT);
    expect(result).toMatch(/unknown tool/i);
    expect(result).toContain('unknown_tool');
  });
});

// ---------------------------------------------------------------------------
// loadStagePrompt
// ---------------------------------------------------------------------------

describe('loadStagePrompt', () => {
  it('reads fluid-social SKILL.md and returns prompt containing copy-stage content for instagram', async () => {
    const ctx = makeCtx({ creationType: 'instagram' });
    const prompt = await loadStagePrompt('copy', ctx);
    // Should contain reference to copy agent (from skill file OR fallback)
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(50);
    // Should reference copy (either from skill section or fallback)
    expect(prompt.toLowerCase()).toMatch(/copy/);
  });

  it('returns prompt containing layout-stage content', async () => {
    const ctx = makeCtx({ creationType: 'instagram' });
    const prompt = await loadStagePrompt('layout', ctx);
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(50);
    expect(prompt.toLowerCase()).toMatch(/layout/);
  });

  it('returns prompt containing styling-stage content', async () => {
    const ctx = makeCtx({ creationType: 'instagram' });
    const prompt = await loadStagePrompt('styling', ctx);
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(50);
    expect(prompt.toLowerCase()).toMatch(/styl/);
  });

  it('returns prompt referencing run_brand_check for spec-check stage', async () => {
    const ctx = makeCtx({ creationType: 'instagram' });
    const prompt = await loadStagePrompt('spec-check', ctx);
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(50);
    expect(prompt).toMatch(/run_brand_check|spec.?check/i);
  });

  it('falls back to hardcoded prompt when skill file is missing', async () => {
    // Use a creationType that maps to a skill file that doesn't exist
    const ctx = makeCtx({ creationType: 'nonexistent-type' });
    const prompt = await loadStagePrompt('copy', ctx);
    // Fallback prompt should still be a valid string
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(20);
  });

  it('fallback prompt for copy stage references voice-rules.md', async () => {
    const ctx = makeCtx({ creationType: 'nonexistent-type' });
    const prompt = await loadStagePrompt('copy', ctx);
    // The fallback references brand/voice-rules.md
    expect(prompt).toContain('voice-rules.md');
  });

  it('fallback prompt for layout stage references layout-archetypes.md', async () => {
    const ctx = makeCtx({ creationType: 'nonexistent-type' });
    const prompt = await loadStagePrompt('layout', ctx);
    expect(prompt).toContain('layout-archetypes.md');
  });

  it('fallback prompt for styling stage references design-tokens.md', async () => {
    const ctx = makeCtx({ creationType: 'nonexistent-type' });
    const prompt = await loadStagePrompt('styling', ctx);
    expect(prompt).toContain('design-tokens.md');
  });

  it('fallback prompt for spec-check stage references run_brand_check', async () => {
    const ctx = makeCtx({ creationType: 'nonexistent-type' });
    const prompt = await loadStagePrompt('spec-check', ctx);
    expect(prompt).toContain('run_brand_check');
  });

  it('injects workingDir and htmlOutputPath into the prompt', async () => {
    const ctx = makeCtx({
      creationType: 'nonexistent-type',
      workingDir: '/test/working/dir',
      htmlOutputPath: '/test/working/dir/output.html',
    });
    const prompt = await loadStagePrompt('copy', ctx);
    // Fallback contains workingDir reference
    expect(prompt).toContain('/test/working/dir');
  });

  it('returns prompt including workingDir in context when skill file loads successfully', async () => {
    const ctx = makeCtx({
      creationType: 'instagram',
      workingDir: '/unique-working-dir-12345',
    });
    const prompt = await loadStagePrompt('copy', ctx);
    // The composed prompt always injects workingDir in the Context section
    // This applies when skill file loads successfully (from SKILL.md path)
    // OR when using fallback — either way context vars are included
    expect(prompt).toContain('/unique-working-dir-12345');
  });
});
