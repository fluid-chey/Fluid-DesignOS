/**
 * Shared preview utilities for asset/frame iframe rendering.
 * Extracted so they can be imported by both App.tsx and unit tests.
 */

import type { Iteration, Asset, Frame } from './campaign-types';

/** Minimal shape needed for preview descriptor (matches DrillDownGrid.PreviewDescriptor). */
export interface PreviewDescriptorBasic {
  src?: string;
  width: number;
  height: number;
  meta?: {
    icon?: string;
    badges?: string[];
    detail?: string;
  };
}

/**
 * Returns the native pixel dimensions for a given asset type.
 * Used to correctly scale iframe previews in DrillDownGrid cards.
 */
export function getAssetDimensions(assetType: string): { width: number; height: number } {
  const map: Record<string, { width: number; height: number }> = {
    instagram: { width: 1080, height: 1080 },
    linkedin: { width: 1200, height: 627 },
    'one-pager': { width: 816, height: 1056 },
  };
  return map[assetType] ?? { width: 1080, height: 1080 };
}

/**
 * Pure function version of renderAssetPreview — testable without React.
 * Returns an iframe src descriptor when latestIter is complete, else metadata fallback.
 */
export function buildAssetPreview(
  asset: Asset,
  latestIter: Iteration | undefined
): PreviewDescriptorBasic {
  if (latestIter?.htmlPath && latestIter.generationStatus === 'complete') {
    const dims = getAssetDimensions(asset.assetType);
    return { src: `/api/iterations/${latestIter.id}/html`, ...dims };
  }
  return {
    width: 1080,
    height: 1080,
    meta: {
      icon: 'asset',
      badges: [asset.assetType, latestIter?.generationStatus ?? 'pending'],
      detail: `${asset.frameCount} frame${asset.frameCount !== 1 ? 's' : ''}`,
    },
  };
}

/**
 * Pure function version of renderFramePreview — testable without React.
 * Returns an iframe src descriptor when the latest iteration is complete, else metadata fallback.
 */
export function buildFramePreview(
  frame: Frame,
  frameIterations: Iteration[],
  parentAsset: Asset | undefined
): PreviewDescriptorBasic {
  const latest = frameIterations.length > 0
    ? frameIterations.reduce((best, iter) =>
        iter.iterationIndex > best.iterationIndex ? iter : best
      )
    : null;
  if (latest?.htmlPath && latest.generationStatus === 'complete') {
    const dims = getAssetDimensions(parentAsset?.assetType ?? 'instagram');
    return { src: `/api/iterations/${latest.id}/html`, ...dims };
  }
  return {
    width: 1080,
    height: 1080,
    meta: {
      icon: 'frame',
      badges: [`Slide ${frame.frameIndex + 1}`],
      detail: latest ? latest.generationStatus ?? 'pending' : 'No iterations',
    },
  };
}
