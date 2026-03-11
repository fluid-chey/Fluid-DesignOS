import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { pushAsset } from '../tools/push-asset.js';
import { readAnnotations } from '../tools/read-annotations.js';
import { readStatuses } from '../tools/read-statuses.js';
import { readHistory } from '../tools/read-history.js';
import { readIterationRequest } from '../tools/iterate.js';
import type { AnnotationFile, Lineage, IterateRequest } from '../types.js';

let workingDir: string;

beforeEach(async () => {
  workingDir = await mkdtemp(path.join(tmpdir(), 'fluid-mcp-test-'));
});

afterEach(async () => {
  await rm(workingDir, { recursive: true, force: true });
});

// --- push_asset tests ---

describe('push_asset', () => {
  it('creates session directory and styled.html with provided HTML content', async () => {
    const html = '<html><body>Test Asset</body></html>';
    const result = await pushAsset(workingDir, {
      sessionId: '20260310-143022',
      variationId: 'v1',
      html,
    });

    expect(result.message).toContain('20260310-143022/v1/styled.html');

    const written = await readFile(
      path.join(workingDir, '20260310-143022', 'v1', 'styled.html'),
      'utf-8'
    );
    expect(written).toBe(html);
  });

  it('creates lineage.json if it does not exist', async () => {
    await pushAsset(workingDir, {
      sessionId: '20260310-143022',
      variationId: 'v1',
      html: '<html></html>',
      platform: 'instagram-square',
    });

    const lineagePath = path.join(workingDir, '20260310-143022', 'lineage.json');
    const lineage = JSON.parse(await readFile(lineagePath, 'utf-8'));

    expect(lineage.sessionId).toBe('20260310-143022');
    expect(lineage.platform).toBe('instagram-square');
    expect(lineage.rounds).toHaveLength(1);
    expect(lineage.rounds[0].variations).toHaveLength(1);
    expect(lineage.rounds[0].variations[0].id).toBe('v1');
  });

  it('appends variation to existing round in lineage.json', async () => {
    await pushAsset(workingDir, {
      sessionId: 'sess-1',
      variationId: 'v1',
      html: '<html>v1</html>',
    });
    await pushAsset(workingDir, {
      sessionId: 'sess-1',
      variationId: 'v2',
      html: '<html>v2</html>',
    });

    const lineage = JSON.parse(
      await readFile(path.join(workingDir, 'sess-1', 'lineage.json'), 'utf-8')
    );
    expect(lineage.rounds).toHaveLength(1);
    expect(lineage.rounds[0].variations).toHaveLength(2);
  });
});

// --- read_annotations tests ---

describe('read_annotations', () => {
  it('returns empty array when no annotations.json exists', async () => {
    await mkdir(path.join(workingDir, 'sess-empty'), { recursive: true });

    const result = await readAnnotations(workingDir, 'sess-empty');
    expect(result.annotations).toEqual([]);
    expect(result.statuses).toEqual({});
  });

  it('returns parsed annotations when file exists', async () => {
    const sessionDir = path.join(workingDir, 'sess-annotated');
    await mkdir(sessionDir, { recursive: true });

    const data: AnnotationFile = {
      sessionId: 'sess-annotated',
      annotations: [
        {
          id: 'ann-1',
          type: 'sidebar',
          author: 'Chey',
          authorType: 'human',
          variationPath: 'v1/styled.html',
          text: 'Great contrast',
          createdAt: '2026-03-10T14:30:00Z',
        },
      ],
      statuses: {
        'v1/styled.html': 'winner',
        'v2/styled.html': 'rejected',
      },
    };
    await writeFile(
      path.join(sessionDir, 'annotations.json'),
      JSON.stringify(data),
      'utf-8'
    );

    const result = await readAnnotations(workingDir, 'sess-annotated');
    expect(result.annotations).toHaveLength(1);
    expect(result.annotations[0].text).toBe('Great contrast');
    expect(result.statuses['v1/styled.html']).toBe('winner');
  });
});

// --- read_statuses tests ---

describe('read_statuses', () => {
  it('returns status map from annotations.json', async () => {
    const sessionDir = path.join(workingDir, 'sess-status');
    await mkdir(sessionDir, { recursive: true });

    const data: AnnotationFile = {
      sessionId: 'sess-status',
      annotations: [],
      statuses: {
        'v1/styled.html': 'winner',
        'v2/styled.html': 'rejected',
        'v3/styled.html': 'unmarked',
      },
    };
    await writeFile(
      path.join(sessionDir, 'annotations.json'),
      JSON.stringify(data),
      'utf-8'
    );

    const statuses = await readStatuses(workingDir, 'sess-status');
    expect(statuses['v1/styled.html']).toBe('winner');
    expect(statuses['v2/styled.html']).toBe('rejected');
    expect(statuses['v3/styled.html']).toBe('unmarked');
  });

  it('returns empty object when no annotations exist', async () => {
    const statuses = await readStatuses(workingDir, 'nonexistent');
    expect(statuses).toEqual({});
  });
});

// --- read_history tests ---

describe('read_history', () => {
  it('combines lineage.json rounds with annotation data', async () => {
    const sessionDir = path.join(workingDir, 'sess-history');
    await mkdir(sessionDir, { recursive: true });

    const lineage: Lineage = {
      sessionId: 'sess-history',
      created: '2026-03-10T14:00:00Z',
      platform: 'instagram-square',
      product: null,
      template: null,
      rounds: [
        {
          roundNumber: 1,
          prompt: 'Create a social post about FLFont',
          variations: [
            { id: 'v1', path: 'v1/styled.html', status: 'winner', specCheck: 'pass' },
            { id: 'v2', path: 'v2/styled.html', status: 'rejected', specCheck: 'pass' },
          ],
          winnerId: 'v1',
          timestamp: '2026-03-10T14:00:00Z',
        },
      ],
    };
    await writeFile(
      path.join(sessionDir, 'lineage.json'),
      JSON.stringify(lineage),
      'utf-8'
    );

    const annotations: AnnotationFile = {
      sessionId: 'sess-history',
      annotations: [
        {
          id: 'ann-1',
          type: 'pin',
          author: 'agent',
          authorType: 'agent',
          variationPath: 'v1/styled.html',
          text: 'Strong typography',
          createdAt: '2026-03-10T14:05:00Z',
          x: 50,
          y: 30,
          pinNumber: 1,
        },
      ],
      statuses: { 'v1/styled.html': 'winner' },
    };
    await writeFile(
      path.join(sessionDir, 'annotations.json'),
      JSON.stringify(annotations),
      'utf-8'
    );

    const history = await readHistory(workingDir, 'sess-history');
    expect(history.platform).toBe('instagram-square');
    expect(history.rounds).toHaveLength(1);
    expect(history.rounds[0].variations).toHaveLength(2);
    expect(history.annotations).toHaveLength(1);
    expect(history.statuses['v1/styled.html']).toBe('winner');
  });

  it('handles Phase 2 legacy format (entries[] instead of rounds[])', async () => {
    const sessionDir = path.join(workingDir, 'sess-legacy');
    await mkdir(sessionDir, { recursive: true });

    const legacyLineage = {
      sessionId: 'sess-legacy',
      created: '2026-03-09T10:00:00Z',
      platform: 'linkedin-landscape',
      entries: [
        { step: 'generate', file: 'v1/styled.html', timestamp: '2026-03-09T10:00:00Z' },
        { step: 'generate', file: 'v2/styled.html', timestamp: '2026-03-09T10:01:00Z' },
      ],
    };
    await writeFile(
      path.join(sessionDir, 'lineage.json'),
      JSON.stringify(legacyLineage),
      'utf-8'
    );

    const history = await readHistory(workingDir, 'sess-legacy');
    expect(history.platform).toBe('linkedin-landscape');
    expect(history.rounds).toHaveLength(1);
    expect(history.rounds[0].roundNumber).toBe(1);
    expect(history.rounds[0].variations).toHaveLength(2);
    expect(history.rounds[0].variations[0].path).toBe('v1/styled.html');
    expect(history.rounds[0].variations[1].path).toBe('v2/styled.html');
  });

  it('returns empty history when no lineage exists', async () => {
    const history = await readHistory(workingDir, 'nonexistent');
    expect(history.rounds).toEqual([]);
    expect(history.annotations).toEqual([]);
  });
});

// --- read_iteration_request tests ---

describe('read_iteration_request', () => {
  it('returns null when no request file exists', async () => {
    await mkdir(path.join(workingDir, 'sess-no-req'), { recursive: true });

    const result = await readIterationRequest(workingDir, 'sess-no-req');
    expect(result).toBeNull();
  });

  it('returns request and renames file after reading', async () => {
    const sessionDir = path.join(workingDir, 'sess-iterate');
    await mkdir(sessionDir, { recursive: true });

    const request: IterateRequest = {
      sessionId: 'sess-iterate',
      feedback: 'Make the headline bigger and bolder',
      winnerPath: 'v1/styled.html',
      context: {
        annotations: [],
        statuses: { 'v1/styled.html': 'winner' },
        rejectedVariations: ['v2/styled.html'],
      },
      createdAt: '2026-03-10T15:00:00Z',
    };
    await writeFile(
      path.join(sessionDir, 'iterate-request.json'),
      JSON.stringify(request),
      'utf-8'
    );

    const result = await readIterationRequest(workingDir, 'sess-iterate');
    expect(result).not.toBeNull();
    expect(result!.feedback).toBe('Make the headline bigger and bolder');
    expect(result!.winnerPath).toBe('v1/styled.html');

    // Original file should be renamed
    const { access } = await import('node:fs/promises');
    await expect(
      access(path.join(sessionDir, 'iterate-request.json'))
    ).rejects.toThrow();

    // Renamed file should exist
    const renamed = await readFile(
      path.join(sessionDir, 'iterate-request-read.json'),
      'utf-8'
    );
    expect(JSON.parse(renamed).feedback).toBe('Make the headline bigger and bolder');
  });
});
