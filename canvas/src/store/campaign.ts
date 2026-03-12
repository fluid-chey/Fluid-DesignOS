import { create } from 'zustand';
import type { Campaign, Asset, Frame, Iteration } from '../lib/campaign-types';

export type NavigationView = 'dashboard' | 'campaign' | 'asset' | 'frame';

interface CampaignStore {
  // Navigation state
  currentView: NavigationView;
  activeCampaignId: string | null;
  activeAssetId: string | null;
  activeFrameId: string | null;
  activeIterationId: string | null;

  // Data cache
  campaigns: Campaign[];
  assets: Asset[];
  frames: Frame[];
  iterations: Iteration[];

  // Loading state
  loading: boolean;

  // Sidebar state
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;

  /** Internal counter for race condition guard on rapid navigation */
  _requestId: number;

  // Navigation actions
  navigateToDashboard: () => void;
  navigateToCampaign: (id: string) => Promise<void>;
  navigateToAsset: (id: string) => Promise<void>;
  navigateToFrame: (id: string) => Promise<void>;
  selectIteration: (id: string) => void;
  navigateBack: () => void;

  // Data fetching actions
  fetchCampaigns: () => Promise<void>;
  fetchAssets: (campaignId: string) => Promise<void>;
  fetchFrames: (assetId: string) => Promise<void>;
  fetchIterations: (frameId: string) => Promise<void>;

  // Sidebar actions
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setRightSidebarOpen: (open: boolean) => void;
}

export const useCampaignStore = create<CampaignStore>((set, get) => ({
  // Initial navigation state
  currentView: 'dashboard',
  activeCampaignId: null,
  activeAssetId: null,
  activeFrameId: null,
  activeIterationId: null,

  // Initial data cache
  campaigns: [],
  assets: [],
  frames: [],
  iterations: [],

  loading: false,

  // Sidebar initial state
  leftSidebarOpen: true,
  rightSidebarOpen: false,

  _requestId: 0,

  // ---- Navigation actions ----

  navigateToDashboard: () => {
    set({
      currentView: 'dashboard',
      activeCampaignId: null,
      activeAssetId: null,
      activeFrameId: null,
      activeIterationId: null,
      assets: [],
      frames: [],
      iterations: [],
    });
    get().fetchCampaigns();
  },

  navigateToCampaign: async (id: string) => {
    set({
      currentView: 'campaign',
      activeCampaignId: id,
      activeAssetId: null,
      activeFrameId: null,
      activeIterationId: null,
      frames: [],
      iterations: [],
    });
    await get().fetchAssets(id);
  },

  navigateToAsset: async (id: string) => {
    set({
      currentView: 'asset',
      activeAssetId: id,
      activeFrameId: null,
      activeIterationId: null,
      iterations: [],
    });
    await get().fetchFrames(id);
  },

  navigateToFrame: async (id: string) => {
    set({
      currentView: 'frame',
      activeFrameId: id,
      activeIterationId: null,
    });
    await get().fetchIterations(id);
  },

  selectIteration: (id: string) => {
    set({ activeIterationId: id });
  },

  navigateBack: () => {
    const { currentView, activeCampaignId, activeAssetId } = get();
    switch (currentView) {
      case 'frame':
        if (activeAssetId) {
          get().navigateToAsset(activeAssetId);
        } else {
          get().navigateToDashboard();
        }
        break;
      case 'asset':
        if (activeCampaignId) {
          get().navigateToCampaign(activeCampaignId);
        } else {
          get().navigateToDashboard();
        }
        break;
      case 'campaign':
        get().navigateToDashboard();
        break;
      case 'dashboard':
      default:
        // Already at top level; no-op
        break;
    }
  },

  // ---- Data fetching actions ----

  fetchCampaigns: async () => {
    const requestId = get()._requestId + 1;
    set({ loading: true, _requestId: requestId });
    try {
      const res = await fetch('/api/campaigns');
      if (get()._requestId !== requestId) return;
      if (!res.ok) { set({ loading: false }); return; }
      const campaigns: Campaign[] = await res.json();
      if (get()._requestId !== requestId) return;
      set({ campaigns, loading: false });
    } catch (err) {
      if (get()._requestId !== requestId) return;
      console.error('[campaign store] Failed to fetch campaigns:', err);
      set({ loading: false });
    }
  },

  fetchAssets: async (campaignId: string) => {
    const requestId = get()._requestId + 1;
    set({ loading: true, _requestId: requestId });
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/assets`);
      if (get()._requestId !== requestId) return;
      if (!res.ok) { set({ loading: false }); return; }
      const assets: Asset[] = await res.json();
      if (get()._requestId !== requestId) return;
      set({ assets, loading: false });
    } catch (err) {
      if (get()._requestId !== requestId) return;
      console.error('[campaign store] Failed to fetch assets:', campaignId, err);
      set({ loading: false });
    }
  },

  fetchFrames: async (assetId: string) => {
    const requestId = get()._requestId + 1;
    set({ loading: true, _requestId: requestId });
    try {
      const res = await fetch(`/api/assets/${assetId}/frames`);
      if (get()._requestId !== requestId) return;
      if (!res.ok) { set({ loading: false }); return; }
      const frames: Frame[] = await res.json();
      if (get()._requestId !== requestId) return;
      set({ frames, loading: false });
    } catch (err) {
      if (get()._requestId !== requestId) return;
      console.error('[campaign store] Failed to fetch frames:', assetId, err);
      set({ loading: false });
    }
  },

  fetchIterations: async (frameId: string) => {
    const requestId = get()._requestId + 1;
    set({ loading: true, _requestId: requestId });
    try {
      const res = await fetch(`/api/frames/${frameId}/iterations`);
      if (get()._requestId !== requestId) return;
      if (!res.ok) { set({ loading: false }); return; }
      const iterations: Iteration[] = await res.json();
      if (get()._requestId !== requestId) return;
      set({ iterations, loading: false });
    } catch (err) {
      if (get()._requestId !== requestId) return;
      console.error('[campaign store] Failed to fetch iterations:', frameId, err);
      set({ loading: false });
    }
  },

  // ---- Sidebar actions ----

  toggleLeftSidebar: () => {
    set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen }));
  },

  toggleRightSidebar: () => {
    set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen }));
  },

  setRightSidebarOpen: (open: boolean) => {
    set({ rightSidebarOpen: open });
  },
}));
