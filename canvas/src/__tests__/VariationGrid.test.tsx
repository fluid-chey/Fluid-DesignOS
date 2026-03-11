import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VariationGrid } from '../components/VariationGrid';
import type { VariationFile } from '../lib/types';

const noop = vi.fn();

const defaultProps = {
  platform: 'instagram' as const,
  statuses: {},
  annotations: [],
  activePin: null,
  onPinClick: noop,
  onAddPin: noop,
  onReply: noop,
  onStatusChange: noop,
};

describe('VariationGrid', () => {
  it('renders the correct number of AssetFrame components for given variations', () => {
    const variations: VariationFile[] = [
      { path: 'v1/styled.html', html: '<h1>Variation 1</h1>', name: 'v1' },
      { path: 'v2/styled.html', html: '<h1>Variation 2</h1>', name: 'v2' },
      { path: 'v3/styled.html', html: '<h1>Variation 3</h1>', name: 'v3' },
    ];

    const { container } = render(
      <VariationGrid variations={variations} {...defaultProps} />
    );

    const frames = container.querySelectorAll('[data-testid="asset-frame"]');
    expect(frames).toHaveLength(3);
  });

  it('shows empty state message when no variations are provided', () => {
    render(
      <VariationGrid variations={[]} {...defaultProps} />
    );

    expect(screen.getByText(/no variations/i)).toBeInTheDocument();
  });
});
