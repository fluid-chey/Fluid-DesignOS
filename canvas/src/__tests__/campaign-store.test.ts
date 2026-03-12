/**
 * Unit tests for campaign store navigation logic.
 * Tests state transitions, sidebar toggles, and fetch actions.
 */
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { useCampaignStore } from '../store/campaign';
import type { Campaign, Asset, Frame, Iteration } from '../lib/campaign-types';

// ---- Mock fetch globally ----
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function makeJsonResponse<T>(data: T, ok = true): Response {
  return {
    ok,
    json: async () => data,
  } as unknown as Response;
}

// Reset the store between tests by reinitializing state
beforeEach(() => {
  mockFetch.mockReset();
  useCampaignStore.setState({
    currentView: 'dashboard',
    activeCampaignId: null,
    activeAssetId: null,
    activeFrameId: null,
    activeIterationId: null,
    campaigns: [],
    assets: [],
    frames: [],
    iterations: [],
    loading: false,
    leftSidebarOpen: true,
    rightSidebarOpen: false,
    _requestId: 0,
  });
});

// ---- Sample data ----
const sampleCampaigns: Campaign[] = [
  { id: 'cmp_1', title: 'Spring Campaign', channels: ['instagram'], createdAt: 1000, updatedAt: 1000 },
];
const sampleAssets: Asset[] = [
  { id: 'ast_1', campaignId: 'cmp_1', title: 'Hero Post', assetType: 'instagram', frameCount: 1, createdAt: 1000 },
];
const sampleFrames: Frame[] = [
  { id: 'frm_1', assetId: 'ast_1', frameIndex: 0, createdAt: 1000 },
];
const sampleIterations: Iteration[] = [
  {
    id: 'itr_1', frameId: 'frm_1', iterationIndex: 0,
    htmlPath: '/path/to/file.html', slotSchema: null, aiBaseline: null,
    userState: null, status: 'unmarked', source: 'ai', templateId: null, createdAt: 1000,
  },
];

// ============================================================
// Navigation state transitions
// ============================================================

describe('navigateToDashboard', () => {
  it('sets currentView to dashboard and clears sub-ids', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse(sampleCampaigns));

    useCampaignStore.getState().navigateToDashboard();

    const state = useCampaignStore.getState();
    expect(state.currentView).toBe('dashboard');
    expect(state.activeCampaignId).toBeNull();
    expect(state.activeAssetId).toBeNull();
    expect(state.activeFrameId).toBeNull();
    expect(state.activeIterationId).toBeNull();
  });
});

describe('navigateToCampaign', () => {
  it('sets currentView to campaign and activeCampaignId', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse(sampleAssets));

    await useCampaignStore.getState().navigateToCampaign('cmp_1');

    const state = useCampaignStore.getState();
    expect(state.currentView).toBe('campaign');
    expect(state.activeCampaignId).toBe('cmp_1');
    expect(state.activeAssetId).toBeNull();
    expect(state.activeFrameId).toBeNull();
  });

  it('fetches assets for the campaign', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse(sampleAssets));

    await useCampaignStore.getState().navigateToCampaign('cmp_1');

    expect(mockFetch).toHaveBeenCalledWith('/api/campaigns/cmp_1/assets');
    expect(useCampaignStore.getState().assets).toEqual(sampleAssets);
  });
});

describe('navigateToAsset', () => {
  it('sets currentView to asset and activeAssetId', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse(sampleFrames));

    await useCampaignStore.getState().navigateToAsset('ast_1');

    const state = useCampaignStore.getState();
    expect(state.currentView).toBe('asset');
    expect(state.activeAssetId).toBe('ast_1');
    expect(state.activeFrameId).toBeNull();
  });

  it('fetches frames for the asset', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse(sampleFrames));

    await useCampaignStore.getState().navigateToAsset('ast_1');

    expect(mockFetch).toHaveBeenCalledWith('/api/assets/ast_1/frames');
    expect(useCampaignStore.getState().frames).toEqual(sampleFrames);
  });
});

describe('navigateToFrame', () => {
  it('sets currentView to frame and activeFrameId', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse(sampleIterations));

    await useCampaignStore.getState().navigateToFrame('frm_1');

    const state = useCampaignStore.getState();
    expect(state.currentView).toBe('frame');
    expect(state.activeFrameId).toBe('frm_1');
  });

  it('fetches iterations for the frame', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse(sampleIterations));

    await useCampaignStore.getState().navigateToFrame('frm_1');

    expect(mockFetch).toHaveBeenCalledWith('/api/frames/frm_1/iterations');
    expect(useCampaignStore.getState().iterations).toEqual(sampleIterations);
  });
});

// ============================================================
// selectIteration
// ============================================================

describe('selectIteration', () => {
  it('sets activeIterationId', () => {
    useCampaignStore.getState().selectIteration('itr_1');
    expect(useCampaignStore.getState().activeIterationId).toBe('itr_1');
  });

  it('can clear by selecting different id', () => {
    useCampaignStore.getState().selectIteration('itr_1');
    useCampaignStore.getState().selectIteration('itr_2');
    expect(useCampaignStore.getState().activeIterationId).toBe('itr_2');
  });
});

// ============================================================
// navigateBack
// ============================================================

describe('navigateBack', () => {
  it('from frame goes to asset level', async () => {
    // Setup asset and frame state
    useCampaignStore.setState({ activeCampaignId: 'cmp_1', activeAssetId: 'ast_1' });
    mockFetch.mockResolvedValueOnce(makeJsonResponse(sampleFrames)); // frames for asset

    await useCampaignStore.getState().navigateToFrame('frm_1');
    mockFetch.mockResolvedValueOnce(makeJsonResponse(sampleFrames)); // navigateBack -> navigateToAsset -> fetchFrames

    await useCampaignStore.getState().navigateBack();

    expect(useCampaignStore.getState().currentView).toBe('asset');
  });

  it('from asset goes to campaign level', async () => {
    useCampaignStore.setState({ activeCampaignId: 'cmp_1' });
    mockFetch.mockResolvedValueOnce(makeJsonResponse(sampleAssets));

    await useCampaignStore.getState().navigateToAsset('ast_1');
    mockFetch.mockResolvedValueOnce(makeJsonResponse(sampleAssets)); // navigateBack -> navigateToCampaign -> fetchAssets

    await useCampaignStore.getState().navigateBack();

    expect(useCampaignStore.getState().currentView).toBe('campaign');
  });

  it('from campaign goes to dashboard', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse(sampleAssets)); // navigateToCampaign
    await useCampaignStore.getState().navigateToCampaign('cmp_1');

    mockFetch.mockResolvedValueOnce(makeJsonResponse(sampleCampaigns)); // navigateBack -> navigateToDashboard -> fetchCampaigns

    useCampaignStore.getState().navigateBack();
    // navigateToDashboard is synchronous for state change
    expect(useCampaignStore.getState().currentView).toBe('dashboard');
  });

  it('from dashboard is a no-op', () => {
    useCampaignStore.getState().navigateBack();
    expect(useCampaignStore.getState().currentView).toBe('dashboard');
  });
});

// ============================================================
// Sidebar toggles
// ============================================================

describe('sidebar state', () => {
  it('toggleLeftSidebar flips leftSidebarOpen', () => {
    expect(useCampaignStore.getState().leftSidebarOpen).toBe(true);
    useCampaignStore.getState().toggleLeftSidebar();
    expect(useCampaignStore.getState().leftSidebarOpen).toBe(false);
    useCampaignStore.getState().toggleLeftSidebar();
    expect(useCampaignStore.getState().leftSidebarOpen).toBe(true);
  });

  it('toggleRightSidebar flips rightSidebarOpen', () => {
    expect(useCampaignStore.getState().rightSidebarOpen).toBe(false);
    useCampaignStore.getState().toggleRightSidebar();
    expect(useCampaignStore.getState().rightSidebarOpen).toBe(true);
    useCampaignStore.getState().toggleRightSidebar();
    expect(useCampaignStore.getState().rightSidebarOpen).toBe(false);
  });

  it('setRightSidebarOpen sets explicit value', () => {
    useCampaignStore.getState().setRightSidebarOpen(true);
    expect(useCampaignStore.getState().rightSidebarOpen).toBe(true);

    useCampaignStore.getState().setRightSidebarOpen(false);
    expect(useCampaignStore.getState().rightSidebarOpen).toBe(false);
  });

  it('left sidebar defaults to open', () => {
    expect(useCampaignStore.getState().leftSidebarOpen).toBe(true);
  });

  it('right sidebar defaults to closed', () => {
    expect(useCampaignStore.getState().rightSidebarOpen).toBe(false);
  });
});

// ============================================================
// Fetch error handling
// ============================================================

describe('fetch error handling', () => {
  it('fetchCampaigns handles network error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    await useCampaignStore.getState().fetchCampaigns();
    const state = useCampaignStore.getState();
    expect(state.loading).toBe(false);
    expect(state.campaigns).toEqual([]);
  });

  it('fetchAssets handles non-ok response gracefully', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse(null, false));
    await useCampaignStore.getState().fetchAssets('cmp_1');
    expect(useCampaignStore.getState().loading).toBe(false);
  });
});
