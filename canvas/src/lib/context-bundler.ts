import type { Annotation, VariationStatus } from './types';

export interface IterateRequest {
  sessionId: string;
  winnerPath: string;
  feedback: string;
  roundNumber: number;
  rejectedPatterns: string[];
  allAnnotations: Annotation[];
  timestamp: string;
}

/**
 * Bundle iteration context and POST it as iterate-request.json to the session directory.
 *
 * @param sessionId - Active session ID
 * @param feedback - User's refinement instructions
 * @param annotations - All annotations in the session
 * @param statuses - Variation status map
 * @param currentRound - The current round number (next will be +1)
 */
export async function bundleContext(
  sessionId: string,
  feedback: string,
  annotations: Annotation[],
  statuses: Record<string, VariationStatus>,
  currentRound: number
): Promise<IterateRequest> {
  // Find winner
  const winnerPath = Object.entries(statuses).find(
    ([, status]) => status === 'winner'
  )?.[0];

  if (!winnerPath) {
    throw new Error('No winner selected. Mark a variation as winner before iterating.');
  }

  // Collect rejection reasons from annotations on rejected variations
  const rejectedPaths = Object.entries(statuses)
    .filter(([, status]) => status === 'rejected')
    .map(([path]) => path);

  const rejectedPatterns = annotations
    .filter((a) => rejectedPaths.includes(a.variationPath))
    .map((a) => a.text);

  const request: IterateRequest = {
    sessionId,
    winnerPath,
    feedback,
    roundNumber: currentRound + 1,
    rejectedPatterns,
    allAnnotations: annotations,
    timestamp: new Date().toISOString(),
  };

  // Write to server
  await fetch(`/api/iterate/${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  return request;
}
