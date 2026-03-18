import { create } from 'zustand';
import type { StreamUIMessage } from '../lib/stream-parser';

type GenerationSource = 'sidebar' | 'hero' | null;

interface GenerationStore {
  status: 'idle' | 'generating' | 'complete' | 'error';
  /** Where the generation was initiated from */
  source: GenerationSource;
  events: StreamUIMessage[];
  activeSessionId: string | null;
  activeCampaignId: string | null;
  activePid: number | null;
  errorMessage: string | null;
  isSingleCreation: boolean;
  creationIds: string[];

  addEvent: (event: StreamUIMessage) => void;
  startGeneration: (source?: GenerationSource) => void;
  setSessionId: (sessionId: string) => void;
  setCampaignId: (campaignId: string) => void;
  setSessionMeta: (meta: { isSingleCreation?: boolean; creationIds?: string[] }) => void;
  completeGeneration: () => void;
  errorGeneration: (message: string) => void;
  reset: () => void;
}

export const useGenerationStore = create<GenerationStore>((set) => ({
  status: 'idle',
  source: null,
  events: [],
  activeSessionId: null,
  activeCampaignId: null,
  activePid: null,
  errorMessage: null,
  isSingleCreation: false,
  creationIds: [],

  addEvent: (event: StreamUIMessage) => {
    set((state) => ({
      events: [...state.events, event],
    }));
  },

  startGeneration: (source: GenerationSource = null) => {
    set({
      status: 'generating',
      source,
      events: [],
      activeSessionId: null,
      activeCampaignId: null,
      errorMessage: null,
      isSingleCreation: false,
      creationIds: [],
    });
  },

  setSessionId: (sessionId: string) => {
    set({ activeSessionId: sessionId });
  },

  setCampaignId: (campaignId: string) => {
    set({ activeCampaignId: campaignId });
  },

  setSessionMeta: (meta) => {
    set({
      ...(meta.isSingleCreation !== undefined ? { isSingleCreation: meta.isSingleCreation } : {}),
      ...(meta.creationIds ? { creationIds: meta.creationIds } : {}),
    });
  },

  completeGeneration: () => {
    set({ status: 'complete' });
  },

  errorGeneration: (message: string) => {
    set({ status: 'error', errorMessage: message });
  },

  reset: () => {
    set({
      status: 'idle',
      source: null,
      events: [],
      activeSessionId: null,
      activeCampaignId: null,
      activePid: null,
      errorMessage: null,
      isSingleCreation: false,
      creationIds: [],
    });
  },
}));
