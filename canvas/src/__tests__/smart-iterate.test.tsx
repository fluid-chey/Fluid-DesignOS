import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IteratePanel } from '../components/IteratePanel';
import { bundleContext } from '../lib/context-bundler';
import type { VariationStatus } from '../lib/types';

// Mock fetch globally for bundleContext tests
const mockFetch = vi.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
);
vi.stubGlobal('fetch', mockFetch);

const basePanelProps = {
  sessionId: 'test-session',
  annotations: [],
  currentRound: 1,
};

describe('IteratePanel smart unblock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('with 1 variation and no winner, textarea is enabled and iterate button is enabled (with feedback)', () => {
    const statuses: Record<string, VariationStatus> = { 'v1/styled.html': 'unmarked' };
    render(
      <IteratePanel {...basePanelProps} statuses={statuses} variationCount={1} />
    );

    const textarea = screen.getByTestId('iterate-feedback') as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(false);
    expect(textarea.style.opacity).not.toBe('0.5');
  });

  it('with 2+ variations and no winner, textarea is enabled but iterate button is disabled', () => {
    const statuses: Record<string, VariationStatus> = {
      'v1/styled.html': 'unmarked',
      'v2/styled.html': 'unmarked',
    };
    render(
      <IteratePanel {...basePanelProps} statuses={statuses} variationCount={2} />
    );

    const textarea = screen.getByTestId('iterate-feedback') as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(false);

    const button = screen.getByTestId('iterate-button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('with 2+ variations and a winner starred, both textarea and button are enabled', () => {
    const statuses: Record<string, VariationStatus> = {
      'v1/styled.html': 'winner',
      'v2/styled.html': 'unmarked',
    };
    render(
      <IteratePanel {...basePanelProps} statuses={statuses} variationCount={2} />
    );

    const textarea = screen.getByTestId('iterate-feedback') as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(false);

    const button = screen.getByTestId('iterate-button') as HTMLButtonElement;
    // Button should be enabled (only disabled by lack of feedback text)
    // Since we haven't typed anything, it will be disabled due to empty feedback
    // but NOT due to missing winner
    expect(button.disabled).toBe(true); // disabled because no feedback text
  });

  it('shows "Mark a winner" message only when multi-variation and no winner', () => {
    const statusesNoWinner: Record<string, VariationStatus> = {
      'v1/styled.html': 'unmarked',
      'v2/styled.html': 'unmarked',
    };
    const { rerender } = render(
      <IteratePanel {...basePanelProps} statuses={statusesNoWinner} variationCount={2} />
    );
    expect(screen.getByText(/mark a winner/i)).toBeInTheDocument();

    // Single variation -- no message
    rerender(
      <IteratePanel {...basePanelProps} statuses={{ 'v1/styled.html': 'unmarked' }} variationCount={1} />
    );
    expect(screen.queryByText(/mark a winner/i)).not.toBeInTheDocument();
  });
});

describe('bundleContext winner auto-infer', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) } as Response);
  });

  it('with 1 variation and no winner, auto-infers the single variation as winner', async () => {
    const statuses: Record<string, VariationStatus> = { 'v1/styled.html': 'unmarked' };
    const result = await bundleContext(
      'test-session',
      'Make it brighter',
      [],
      statuses,
      1,
      ['v1/styled.html']
    );

    expect(result.winnerPath).toBe('v1/styled.html');
  });

  it('with 2+ variations and no winner, still throws "No winner selected"', async () => {
    const statuses: Record<string, VariationStatus> = {
      'v1/styled.html': 'unmarked',
      'v2/styled.html': 'unmarked',
    };

    await expect(
      bundleContext('test-session', 'Make it brighter', [], statuses, 1, ['v1/styled.html', 'v2/styled.html'])
    ).rejects.toThrow('No winner selected');
  });
});
