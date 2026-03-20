/**
 * Editor store — Zustand store for the right sidebar content editor.
 * Tracks selected iteration, slot schema, current slot values, and dirty state.
 * Sends postMessage to iframe for live preview updates.
 * Persists user edits via PATCH /api/iterations/:id/user-state.
 */

import { create } from 'zustand';
import type { SlotSchema } from '../lib/slot-schema';
import type { Iteration } from '../lib/campaign-types';

/** JSON map of brush selector → CSS transform string; persisted in userState */
export const BRUSH_TRANSFORM_STATE_KEY = '__brushTransform__';

interface EditorStore {
  /** Currently selected iteration ID (null = nothing selected) */
  selectedIterationId: string | null;
  /** Slot schema from the iteration's slotSchema field */
  slotSchema: SlotSchema | null;
  /** Current slot values keyed by CSS selector */
  slotValues: Record<string, string>;
  /** True when slotValues differ from what's persisted */
  isDirty: boolean;
  /** Reference to the active iframe for postMessage communication */
  iframeRef: HTMLIFrameElement | null;
  /** 1-based slide index for carousels (properties panel + iframe sync) */
  activeCarouselSlide: number;

  /** Load an iteration from the API, parse its slot schema and current values */
  selectIteration: (id: string) => Promise<void>;
  /** Update a single slot value locally and send postMessage to iframe */
  updateSlotValue: (sel: string, value: string, mode?: string) => void;
  /** Persist brush CSS transform for selector; updates iframe and userState blob */
  patchBrushTransform: (sel: string, transform: string) => void;
  /** PATCH /api/iterations/:id/user-state with current slotValues, resets isDirty */
  saveUserState: () => Promise<void>;
  /** Set the iframe reference for postMessage targeting */
  setIframeRef: (ref: HTMLIFrameElement | null) => void;
  /** Carousel slide tabs — updates state and should pair with postMessage setSlide */
  setActiveCarouselSlide: (slide: number) => void;
  /** Reset all editor state */
  clearSelection: () => void;
}

/** Normalize image URL to origin-relative form for persistence (so it works across port/origin). Blob URLs become empty so reload shows template default. */
function normalizeImageUrlForSave(value: string): string {
  if (typeof value !== 'string') return value;
  if (value.startsWith('blob:')) return '';
  if (value.startsWith('data:') || !value.startsWith('http')) return value;
  try {
    const u = new URL(value);
    if (u.origin === window.location.origin && (u.pathname.startsWith('/fluid-assets/') || u.pathname.startsWith('/api/brand-assets/serve/'))) {
      return u.pathname;
    }
  } catch {
    /* ignore */
  }
  return value;
}

/** Extract initial slot values from userState (preferred) or aiBaseline; normalize fluid-asset URLs to path-only */
function extractSlotValues(iteration: Iteration): Record<string, string> {
  const source = (iteration.userState || iteration.aiBaseline) as Record<string, string> | null;
  if (!source) return {};
  return Object.fromEntries(
    Object.entries(source).map(([k, v]) => {
      const s = String(v);
      return [k, normalizeImageUrlForSave(s)];
    })
  );
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  selectedIterationId: null,
  slotSchema: null,
  slotValues: {},
  isDirty: false,
  iframeRef: null,
  activeCarouselSlide: 1,

  selectIteration: async (id: string) => {
    try {
      const res = await fetch(`/api/iterations/${id}`);
      if (!res.ok) {
        console.warn(`Editor: failed to load iteration ${id}`, res.status);
        return;
      }
      const iteration: Iteration = await res.json();
      const schema = iteration.slotSchema as SlotSchema | null;
      const values = extractSlotValues(iteration);
      // Do not reset activeCarouselSlide — keep it aligned with the creation’s active slide
      // (App sync). Resetting to 1 left the iframe on slide 1 while editing slide 2+.
      set({
        selectedIterationId: id,
        slotSchema: schema,
        slotValues: values,
        isDirty: false,
      });
    } catch (err) {
      console.warn('Editor: selectIteration error', err);
    }
  },

  updateSlotValue: (sel: string, value: string, mode?: string) => {
    set((state) => ({
      slotValues: { ...state.slotValues, [sel]: value },
      isDirty: true,
    }));

    // Send postMessage to iframe for live preview
    const { iframeRef } = get();
    if (iframeRef?.contentWindow) {
      iframeRef.contentWindow.postMessage(
        { type: 'tmpl', sel, value, mode: mode ?? 'text' },
        '*'
      );
    }
  },

  patchBrushTransform: (sel: string, transform: string) => {
    const { iframeRef } = get();
    if (iframeRef?.contentWindow) {
      iframeRef.contentWindow.postMessage(
        { type: 'tmpl', sel, action: 'transform', transform },
        '*'
      );
    }
    set((state) => {
      let map: Record<string, string> = {};
      try {
        map = JSON.parse(state.slotValues[BRUSH_TRANSFORM_STATE_KEY] || '{}') as Record<string, string>;
      } catch {
        map = {};
      }
      map[sel] = transform;
      return {
        slotValues: { ...state.slotValues, [BRUSH_TRANSFORM_STATE_KEY]: JSON.stringify(map) },
        isDirty: true,
      };
    });
  },

  saveUserState: async () => {
    const { selectedIterationId, slotValues } = get();
    if (!selectedIterationId) return;
    const normalized = Object.fromEntries(
      Object.entries(slotValues).map(([k, v]) => [k, normalizeImageUrlForSave(v)])
    );
    try {
      const res = await fetch(`/api/iterations/${selectedIterationId}/user-state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userState: normalized }),
      });
      if (res.ok) {
        set({ isDirty: false });
      } else {
        console.warn('Editor: saveUserState failed', res.status);
      }
    } catch (err) {
      console.warn('Editor: saveUserState error', err);
    }
  },

  setIframeRef: (ref: HTMLIFrameElement | null) => {
    set({ iframeRef: ref });
  },

  setActiveCarouselSlide: (slide: number) => {
    set({ activeCarouselSlide: Math.max(1, slide) });
  },

  clearSelection: () => {
    set({
      selectedIterationId: null,
      slotSchema: null,
      slotValues: {},
      isDirty: false,
      iframeRef: null,
      activeCarouselSlide: 1,
    });
  },
}));
