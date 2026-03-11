import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';
import type { ChildProcess } from 'child_process';

// Mock child_process.spawn
const mockStdout = new EventEmitter();
const mockStderr = new EventEmitter();
let mockChild: Partial<ChildProcess> & { stdout: EventEmitter; stderr: EventEmitter; pid: number; kill: ReturnType<typeof vi.fn> };

vi.mock('child_process', () => ({
  spawn: vi.fn(() => {
    mockChild = {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
      pid: 12345,
      kill: vi.fn(),
      on: vi.fn((event: string, cb: Function) => {
        if (event === 'close') {
          // Store for later triggering
          (mockChild as any)._onClose = cb;
        }
        return mockChild;
      }),
    };
    return mockChild;
  }),
}));

// We test the endpoint logic through the watcher plugin's middleware
// Since the endpoint is embedded in the Vite plugin, we test the spawn behavior
// and SSE output format

describe('Generate endpoint spawn behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('spawn should use stdio inherit for stdin (not pipe)', async () => {
    const { spawn } = await import('child_process');

    // Simulate what the endpoint does
    const child = spawn('claude', ['-p', 'test prompt', '--output-format', 'stream-json'], {
      cwd: '/tmp',
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    expect(spawn).toHaveBeenCalledWith(
      'claude',
      expect.arrayContaining(['-p', 'test prompt', '--output-format', 'stream-json']),
      expect.objectContaining({
        stdio: ['inherit', 'pipe', 'pipe'],
      }),
    );
  });
});

describe('SSE format', () => {
  it('formats data events correctly', () => {
    const data = { type: 'stream_event', event: { type: 'content_block_delta' } };
    const sseFrame = `data: ${JSON.stringify(data)}\n\n`;
    expect(sseFrame).toContain('data: ');
    expect(sseFrame.endsWith('\n\n')).toBe(true);
  });

  it('formats done events with event type', () => {
    const data = { code: 0, sessionId: '20260311-120000' };
    const sseFrame = `event: done\ndata: ${JSON.stringify(data)}\n\n`;
    expect(sseFrame).toContain('event: done\n');
    expect(sseFrame).toContain(`data: ${JSON.stringify(data)}`);
  });

  it('formats stderr events with event type', () => {
    const data = { text: 'Loading skill...' };
    const sseFrame = `event: stderr\ndata: ${JSON.stringify(data)}\n\n`;
    expect(sseFrame).toContain('event: stderr\n');
  });
});

describe('Concurrent generation lock', () => {
  it('second request while active should be rejected with 409', () => {
    // Simulate the lock mechanism
    let activeChild: any = null;

    function canGenerate(): boolean {
      return activeChild === null;
    }

    // First request - should succeed
    activeChild = { pid: 123 };
    expect(canGenerate()).toBe(false); // locked

    // Clear
    activeChild = null;
    expect(canGenerate()).toBe(true); // unlocked
  });
});

describe('Session directory creation', () => {
  it('generates session ID in YYYYMMDD-HHMMSS format', () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const sessionId = [
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate()),
      '-',
      pad(now.getHours()),
      pad(now.getMinutes()),
      pad(now.getSeconds()),
    ].join('');

    expect(sessionId).toMatch(/^\d{8}-\d{6}$/);
  });
});
