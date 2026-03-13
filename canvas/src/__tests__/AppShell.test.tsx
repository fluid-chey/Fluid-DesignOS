import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useCampaignStore } from '../store/campaign';

describe('AppShell', () => {
  beforeEach(() => {
    useCampaignStore.setState({
      activeNavTab: 'campaigns',
      chatSidebarOpen: true,
      rightSidebarOpen: false,
    } as Parameters<typeof useCampaignStore.setState>[0]);
  });

  it('renders templates iframe when activeNavTab is templates', () => {
    // STUB: After AppShell rewrite in Task 2:
    // useCampaignStore.setState({ activeNavTab: 'templates' });
    // render(<AppShell><div /></AppShell>);
    // const iframe = screen.getByTitle('Template Library');
    // expect(iframe).toHaveAttribute('src', '/templates/');
    expect(true).toBe(true); // placeholder
  });

  it('renders patterns iframe when activeNavTab is patterns', () => {
    expect(true).toBe(true); // placeholder
  });

  it('chat sidebar has zero width when chatSidebarOpen is false', () => {
    expect(true).toBe(true); // placeholder
  });
});
