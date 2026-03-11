import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Plugin } from 'vite';

// Mock chokidar
const mockWatcher = {
  on: vi.fn().mockReturnThis(),
  close: vi.fn().mockResolvedValue(undefined),
};

vi.mock('chokidar', () => ({
  watch: vi.fn(() => mockWatcher),
}));

// Mock fs/promises
const mockMkdir = vi.fn().mockResolvedValue(undefined);
const mockStat = vi.fn().mockResolvedValue({ mtimeMs: Date.now() });

vi.mock('node:fs/promises', () => ({
  default: {
    mkdir: (...args: any[]) => mockMkdir(...args),
    stat: (...args: any[]) => mockStat(...args),
    readFile: vi.fn().mockRejectedValue(new Error('not found')),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue([]),
  },
}));

import { fluidWatcherPlugin } from '../server/watcher.js';
import { watch } from 'chokidar';

describe('fluidWatcherPlugin hardening', () => {
  let plugin: Plugin;
  let mockServer: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockServer = {
      config: { root: '/test/project' },
      ws: { send: vi.fn() },
      middlewares: { use: vi.fn() },
    };

    plugin = fluidWatcherPlugin('../.fluid/working');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create the working directory if it does not exist', () => {
    const configure = plugin.configureServer as (srv: any) => void;
    configure(mockServer);

    expect(mockMkdir).toHaveBeenCalledWith(
      expect.stringContaining('.fluid/working'),
      { recursive: true }
    );
  });

  it('should use awaitWriteFinish config for stability', () => {
    const configure = plugin.configureServer as (srv: any) => void;
    configure(mockServer);

    expect(watch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        awaitWriteFinish: expect.objectContaining({
          stabilityThreshold: 200,
          pollInterval: 100,
        }),
      })
    );
  });

  it('should watch with depth 4 for deeper nesting', () => {
    const configure = plugin.configureServer as (srv: any) => void;
    configure(mockServer);

    expect(watch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        depth: 4,
      })
    );
  });

  it('should listen to addDir events for new session directories', () => {
    const configure = plugin.configureServer as (srv: any) => void;
    configure(mockServer);

    const events = mockWatcher.on.mock.calls.map((c: any[]) => c[0]);
    expect(events).toContain('addDir');
  });

  it('should fire HMR events on file changes', () => {
    const configure = plugin.configureServer as (srv: any) => void;
    configure(mockServer);

    // Find the callback registered for 'add'
    const addCall = mockWatcher.on.mock.calls.find((c: any[]) => c[0] === 'add');
    expect(addCall).toBeDefined();

    // Trigger the callback
    addCall![1]();

    // Advance the debounce timer
    vi.advanceTimersByTime(400);

    expect(mockServer.ws.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'custom',
        event: 'fluid:file-change',
        data: expect.objectContaining({ timestamp: expect.any(Number) }),
      })
    );
  });

  it('should have a periodic re-scan interval', async () => {
    // First call returns old mtime, second returns newer
    let callCount = 0;
    mockStat.mockImplementation(() => {
      callCount++;
      return Promise.resolve({ mtimeMs: callCount * 1000 });
    });

    const configure = plugin.configureServer as (srv: any) => void;
    configure(mockServer);

    // Clear previous calls from initial setup
    mockServer.ws.send.mockClear();

    // Advance past the re-scan interval (5 seconds)
    await vi.advanceTimersByTimeAsync(5100);

    // Wait for debounce
    await vi.advanceTimersByTimeAsync(400);

    // The re-scan should have detected mtime change and sent an update
    expect(mockServer.ws.send).toHaveBeenCalled();
  });
});
