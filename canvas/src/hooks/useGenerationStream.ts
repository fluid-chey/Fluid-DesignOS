import { useCallback } from 'react';
import { useGenerationStore } from '../store/generation';
import { parseStreamEvent } from '../lib/stream-parser';

interface GenerateOptions {
  template?: string;
  customization?: object;
  skillType?: string;
}

/**
 * Hook that connects to the /api/generate SSE endpoint,
 * parses stream frames, and dispatches events to the generation store.
 */
export function useGenerationStream() {
  const {
    addEvent,
    startGeneration,
    completeGeneration,
    errorGeneration,
    status,
    events,
  } = useGenerationStore();

  const generate = useCallback(
    async (prompt: string, opts?: GenerateOptions) => {
      startGeneration(prompt);

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, ...opts }),
        });

        if (!response.ok) {
          errorGeneration(await response.text());
          return;
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Parse SSE frames (separated by \n\n)
          while (buffer.includes('\n\n')) {
            const idx = buffer.indexOf('\n\n');
            const frame = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);

            // Extract event type and data from SSE frame
            const eventMatch = frame.match(/^event: (\w+)\n/);
            const dataMatch = frame.match(/^data: (.+)$/m);
            if (!dataMatch) continue;

            const eventType = eventMatch?.[1];

            let parsed: any;
            try {
              parsed = JSON.parse(dataMatch[1]);
            } catch {
              continue; // skip malformed JSON
            }

            if (eventType === 'done') {
              completeGeneration();
            } else {
              const msg = parseStreamEvent(parsed, eventType);
              if (msg) addEvent(msg);
            }
          }
        }

        // If stream ended without a done event, mark complete
        if (useGenerationStore.getState().status === 'generating') {
          completeGeneration();
        }
      } catch (err) {
        errorGeneration(String(err));
      }
    },
    [addEvent, startGeneration, completeGeneration, errorGeneration],
  );

  return { generate, status, events };
}
