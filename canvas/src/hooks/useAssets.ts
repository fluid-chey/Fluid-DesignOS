import { useState, useEffect, useCallback, useRef } from 'react';

export interface SavedAsset {
  id: string;
  url: string;
  name: string | null;
  mimeType?: string | null;
  source?: 'dam' | 'upload';
  createdAt?: number;
}

/** Simple module-level cache so multiple components share the same fetch. */
let cachedAssets: SavedAsset[] | null = null;
let inflight: Promise<SavedAsset[]> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const fn of listeners) fn();
}

async function fetchAssetsOnce(force = false): Promise<SavedAsset[]> {
  if (!force && cachedAssets !== null) return cachedAssets;
  if (!force && inflight) return inflight;
  inflight = fetch('/api/assets')
    .then((res) => {
      if (!res.ok) throw new Error('Failed to load assets');
      return res.json();
    })
    .then((data: unknown) => {
      const arr = Array.isArray(data) ? (data as SavedAsset[]) : [];
      cachedAssets = arr;
      inflight = null;
      notifyListeners();
      return arr;
    })
    .catch((err) => {
      inflight = null;
      throw err;
    });
  return inflight;
}

/**
 * Shared hook for /api/assets. Fetches once on mount and caches across
 * components. Call `invalidate()` to re-fetch (e.g. after adding/removing).
 */
export function useAssets() {
  const [assets, setAssets] = useState<SavedAsset[]>(cachedAssets ?? []);
  const [loading, setLoading] = useState(cachedAssets === null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAssetsOnce(force);
      if (mountedRef.current) {
        setAssets(data);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : 'Failed to load assets');
        setAssets([]);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    // Subscribe to cross-component cache updates
    const onUpdate = () => {
      if (mountedRef.current && cachedAssets) {
        setAssets(cachedAssets);
        setLoading(false);
      }
    };
    listeners.add(onUpdate);
    refresh();
    return () => {
      mountedRef.current = false;
      listeners.delete(onUpdate);
    };
  }, [refresh]);

  /** Force re-fetch from server (e.g. after add/remove). */
  const invalidate = useCallback(() => refresh(true), [refresh]);

  return { assets, loading, error, invalidate };
}
