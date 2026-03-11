import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TemplateGallery } from '../components/TemplateGallery';
import { TemplateCustomizer } from '../components/TemplateCustomizer';
import type { TemplateInfo } from '../lib/templates';

const mockTemplates: TemplateInfo[] = [
  {
    id: 'problem-first',
    name: 'Problem First',
    category: 'social',
    html: '<div>Social template</div>',
    dimensions: { width: 1080, height: 1080 },
  },
  {
    id: 'case-study',
    name: 'Case Study',
    category: 'one-pager',
    html: '<div>One-pager template</div>',
    dimensions: { width: 816, height: 1056 },
  },
];

// Mock useGenerationStream
const mockGenerate = vi.fn();
vi.mock('../hooks/useGenerationStream', () => ({
  useGenerationStream: () => ({
    generate: mockGenerate,
    status: 'idle',
    events: [],
  }),
}));

describe('TemplateGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTemplates),
    });
  });

  it('fetches templates on mount and renders a card for each template', async () => {
    const onSelect = vi.fn();
    const onFreePrompt = vi.fn();

    render(
      <TemplateGallery onSelectTemplate={onSelect} onFreePrompt={onFreePrompt} />
    );

    await waitFor(() => {
      expect(screen.getByText('Problem First')).toBeInTheDocument();
    });
    expect(screen.getByText('Case Study')).toBeInTheDocument();
  });

  it('clicking a template card calls onSelectTemplate with the template', async () => {
    const onSelect = vi.fn();
    const onFreePrompt = vi.fn();

    render(
      <TemplateGallery onSelectTemplate={onSelect} onFreePrompt={onFreePrompt} />
    );

    await waitFor(() => {
      expect(screen.getByText('Problem First')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Problem First'));
    expect(onSelect).toHaveBeenCalledWith(mockTemplates[0]);
  });

  it('renders "Create with AI" card and calls onFreePrompt when clicked', async () => {
    const onSelect = vi.fn();
    const onFreePrompt = vi.fn();

    render(
      <TemplateGallery onSelectTemplate={onSelect} onFreePrompt={onFreePrompt} />
    );

    await waitFor(() => {
      expect(screen.getByText(/Create with AI/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Create with AI/));
    expect(onFreePrompt).toHaveBeenCalled();
  });
});

describe('TemplateCustomizer', () => {
  const template = mockTemplates[0];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields (headline, accent color, topic, variations)', () => {
    render(
      <TemplateCustomizer template={template} onBack={vi.fn()} />
    );

    expect(screen.getByLabelText(/headline/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/topic/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/variations/i)).toBeInTheDocument();
    // Accent color buttons
    expect(screen.getByTestId('color-orange')).toBeInTheDocument();
    expect(screen.getByTestId('color-blue')).toBeInTheDocument();
  });

  it('"Generate" button calls generate with constructed prompt and customization', async () => {
    render(
      <TemplateCustomizer template={template} onBack={vi.fn()} />
    );

    const headlineInput = screen.getByLabelText(/headline/i);
    const topicInput = screen.getByLabelText(/topic/i);

    fireEvent.change(headlineInput, { target: { value: 'Test Headline' } });
    fireEvent.change(topicInput, { target: { value: 'Test Topic' } });

    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      expect(mockGenerate).toHaveBeenCalled();
    });

    const callArgs = mockGenerate.mock.calls[0];
    expect(callArgs[0]).toContain('Test Headline');
    expect(callArgs[1]).toMatchObject({
      template: 'problem-first',
      customization: expect.objectContaining({
        headline: 'Test Headline',
        topic: 'Test Topic',
      }),
    });
  });

  it('"Back to Templates" calls onBack', () => {
    const onBack = vi.fn();
    render(
      <TemplateCustomizer template={template} onBack={onBack} />
    );

    fireEvent.click(screen.getByText(/back to templates/i));
    expect(onBack).toHaveBeenCalled();
  });
});
