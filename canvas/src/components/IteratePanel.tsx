import { useState } from 'react';
import type { Annotation, VariationStatus } from '../lib/types';
import { bundleContext } from '../lib/context-bundler';

interface IteratePanelProps {
  sessionId: string;
  annotations: Annotation[];
  statuses: Record<string, VariationStatus>;
  currentRound: number;
}

/**
 * Feedback input panel with Iterate button.
 * Disabled when no winner is marked for the current round.
 */
export function IteratePanel({ sessionId, annotations, statuses, currentRound }: IteratePanelProps) {
  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const hasWinner = Object.values(statuses).includes('winner');
  const disabled = !hasWinner || sending;

  const handleIterate = async () => {
    if (disabled) return;
    const text = feedback.trim();
    if (!text) return;

    setSending(true);
    try {
      await bundleContext(sessionId, text, annotations, statuses, currentRound);
      setSent(true);
      setFeedback('');
    } catch {
      // Error handled silently -- user can retry
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div data-testid="iterate-panel" style={panelStyle}>
        <div style={{
          textAlign: 'center',
          padding: '1rem',
          color: '#22c55e',
          fontSize: '0.85rem',
        }}>
          Iteration request sent. Waiting for agent to process...
          <button
            onClick={() => setSent(false)}
            style={{
              display: 'block',
              margin: '0.5rem auto 0',
              background: 'none',
              border: '1px solid #333',
              color: '#888',
              borderRadius: 4,
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            Send another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="iterate-panel" style={panelStyle}>
      {!hasWinner && (
        <p style={{
          margin: '0 0 0.5rem',
          fontSize: '0.8rem',
          color: '#ef4444',
        }}>
          Mark a winner to iterate
        </p>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <textarea
          data-testid="iterate-feedback"
          placeholder="Describe what to change in the next round..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          disabled={!hasWinner}
          style={{
            flex: 1,
            backgroundColor: '#252540',
            border: '1px solid #3a3a52',
            borderRadius: 6,
            color: '#e0e0e0',
            padding: '0.5rem 0.75rem',
            fontSize: '0.85rem',
            resize: 'vertical',
            minHeight: 60,
            outline: 'none',
            opacity: hasWinner ? 1 : 0.5,
          }}
        />
        <button
          data-testid="iterate-button"
          onClick={handleIterate}
          disabled={disabled || !feedback.trim()}
          style={{
            backgroundColor: disabled ? '#333' : '#3b82f6',
            color: disabled ? '#666' : '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '0.5rem 1.25rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: disabled ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {sending ? 'Sending...' : 'Iterate'}
        </button>
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  padding: '1rem 1.5rem',
  borderTop: '1px solid #2a2a3e',
  backgroundColor: '#16162a',
};
