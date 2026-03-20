import { describe, it, expect } from 'vitest';
import type { SlotField } from '../lib/slot-schema';
import {
  filterFieldsForSlide,
  brushVisibleForSlide,
  getSlideIndexFromSelector,
} from '../lib/slot-schema-filter';

describe('getSlideIndexFromSelector', () => {
  it('parses data-slide attribute', () => {
    expect(getSlideIndexFromSelector('[data-slide="2"] .foo')).toBe(2);
    expect(getSlideIndexFromSelector('.headline')).toBeNull();
  });
});

describe('filterFieldsForSlide', () => {
  const carouselFields: SlotField[] = [
    { type: 'divider', label: 'Slide 01' },
    { type: 'text', sel: '[data-slide="1"] .a', label: 'A', mode: 'text', rows: 1 },
    { type: 'divider', label: 'Slide 02' },
    { type: 'text', sel: '[data-slide="2"] .b', label: 'B', mode: 'text', rows: 1 },
  ];

  it('non-carousel omits dividers', () => {
    const fields: SlotField[] = [
      { type: 'divider', label: 'X' },
      { type: 'text', sel: '.h', label: 'Headline', mode: 'text', rows: 1 },
    ];
    const out = filterFieldsForSlide(fields, 1, false);
    expect(out).toHaveLength(1);
    expect(out[0].type).toBe('text');
  });

  it('carousel shows only slide 1 fields and its divider', () => {
    const out = filterFieldsForSlide(carouselFields, 1, true);
    expect(out.map((f) => (f.type === 'divider' ? f.label : (f as { sel: string }).sel))).toEqual([
      'Slide 01',
      '[data-slide="1"] .a',
    ]);
  });

  it('carousel shows only slide 2 fields and its divider', () => {
    const out = filterFieldsForSlide(carouselFields, 2, true);
    expect(out.map((f) => (f.type === 'divider' ? f.label : (f as { sel: string }).sel))).toEqual([
      'Slide 02',
      '[data-slide="2"] .b',
    ]);
  });
});

describe('brushVisibleForSlide', () => {
  it('hides brush when selector targets another slide', () => {
    expect(brushVisibleForSlide('[data-slide="2"] .arrow', 1, true)).toBe(false);
    expect(brushVisibleForSlide('[data-slide="2"] .arrow', 2, true)).toBe(true);
  });

  it('shows brush without data-slide for all slides', () => {
    expect(brushVisibleForSlide('.brush', 1, true)).toBe(true);
    expect(brushVisibleForSlide('.brush', 3, true)).toBe(true);
  });

  it('non-carousel shows brush when present', () => {
    expect(brushVisibleForSlide('[data-slide="2"] .x', 1, false)).toBe(true);
  });
});
