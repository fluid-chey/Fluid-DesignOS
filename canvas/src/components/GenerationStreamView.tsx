import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useGenerationStore } from '../store/generation';
import { useCampaignStore } from '../store/campaign';
import { useGenerationStream } from '../hooks/useGenerationStream';
import { StreamMessage } from './StreamMessage';
import { BG_PRIMARY, BG_CARD, BORDER, ACCENT, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from './tokens';
import type { StreamUIMessage } from '../lib/stream-parser';

interface ChatTurn {
  role: 'user' | 'assistant';
  /** For user turns: the prompt text. For assistant turns: the stream messages snapshot. */
  content: string;
  messages?: StreamUIMessage[];
}

/**
 * Full-viewport Gemini-style chat view.
 * - Topic header at top
 * - User bubbles right-aligned, AI output left-aligned
 * - Follow-up text input pinned to bottom
 */
export function GenerationStreamView({
  prompt,
  onReset,
}: {
  prompt: string;
  onReset: () => void;
}) {
  const status = useGenerationStore((s) => s.status);
  const events = useGenerationStore((s) => s.events);
  const errorMessage = useGenerationStore((s) => s.errorMessage);
  const activeCampaignId = useGenerationStore((s) => s.activeCampaignId);
  const isSingleCreation = useGenerationStore((s) => s.isSingleCreation);
  const creationIds = useGenerationStore((s) => s.creationIds);
  const reset = useGenerationStore((s) => s.reset);
  const navigateToCampaign = useCampaignStore((s) => s.navigateToCampaign);
  const navigateToCreation = useCampaignStore((s) => s.navigateToCreation);
  const { generate } = useGenerationStream();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [followUp, setFollowUp] = useState('');

  // Chat history — completed turns
  const [history, setHistory] = useState<ChatTurn[]>([]);
  // Track previous status to snapshot completed assistant turns
  const prevStatusRef = useRef(status);

  const isGenerating = status === 'generating';
  const isComplete = status === 'complete';
  const isError = status === 'error';

  // Merge consecutive text events (for live stream)
  const liveMessages = useMemo(() => {
    const result: StreamUIMessage[] = [];
    for (const ev of events) {
      if (ev.type === 'tool-start' || ev.type === 'tool-done') continue;
      if (ev.type === 'text' && result.length > 0 && result[result.length - 1].type === 'text') {
        const prev = result[result.length - 1];
        result[result.length - 1] = { ...prev, content: prev.content + ev.content };
      } else {
        result.push(ev);
      }
    }
    return result;
  }, [events]);

  // When generation completes, snapshot the assistant messages into history
  useEffect(() => {
    if (prevStatusRef.current === 'generating' && (status === 'complete' || status === 'error')) {
      setHistory((h) => [...h, { role: 'assistant', content: '', messages: [...liveMessages] }]);
    }
    prevStatusRef.current = status;
  }, [status, liveMessages]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [liveMessages, history]);

  const handleViewResult = () => {
    if (!activeCampaignId) return;
    if (isSingleCreation && creationIds.length === 1) {
      navigateToCreation(creationIds[0]);
    } else {
      navigateToCampaign(activeCampaignId);
    }
  };

  const handleNewCreation = () => {
    reset();
    onReset();
  };

  const handleFollowUp = useCallback(() => {
    const text = followUp.trim();
    if (!text || isGenerating) return;
    // Add user turn to history, then fire generation
    setHistory((h) => [...h, { role: 'user', content: text }]);
    setFollowUp('');
    generate(text, { skillType: 'social', source: 'hero', existingCampaignId: activeCampaignId ?? undefined });
  }, [followUp, isGenerating, generate, activeCampaignId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFollowUp();
    }
  };

  // Build the initial prompt display (strip [Type] prefix for the topic header)
  const topicLabel = prompt.replace(/^\[.*?\]\s*/, '');

  return (
    <div
      style={{
        height: '100%',
        background: BG_PRIMARY,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'inherit',
      }}
    >
      {/* Topic header — centered at top like Gemini */}
      <div
        style={{
          flexShrink: 0,
          textAlign: 'center',
          padding: '1.25rem 1.5rem 0.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <span
          style={{
            fontSize: '0.85rem',
            color: TEXT_SECONDARY,
            fontWeight: 500,
          }}
        >
          {topicLabel}
        </span>
      </div>

      {/* Scrollable chat area */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 780,
            padding: '1rem 1.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Initial user prompt */}
          <UserBubble text={prompt} />

          {/* History turns (completed rounds) */}
          {history.map((turn, i) =>
            turn.role === 'user' ? (
              <UserBubble key={`h-${i}`} text={turn.content} />
            ) : (
              <AssistantBlock key={`h-${i}`} messages={turn.messages ?? []} />
            ),
          )}

          {/* Live streaming assistant output (current round) */}
          {isGenerating && (
            <AssistantBlock messages={liveMessages} isLive />
          )}

          {/* Completion / error status */}
          {isComplete && history.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '0.5rem' }}>
              <button
                onClick={handleViewResult}
                style={{
                  padding: '0.4rem 1rem',
                  backgroundColor: ACCENT,
                  color: '#000',
                  border: 'none',
                  borderRadius: 20,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                View Result
              </button>
              <button
                onClick={handleNewCreation}
                style={{
                  padding: '0.4rem 1rem',
                  backgroundColor: 'transparent',
                  color: TEXT_SECONDARY,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 20,
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                New Creation
              </button>
            </div>
          )}

          {isError && (
            <div style={{ fontSize: '0.82rem', color: '#ef4444', paddingLeft: 4 }}>
              Generation failed{errorMessage ? `: ${errorMessage}` : ''}
            </div>
          )}
        </div>
      </div>

      {/* Bottom input — pinned */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'center',
          padding: '0.5rem 1.5rem 1.25rem',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 780,
            position: 'relative',
          }}
        >
          <div
            style={{
              background: BG_CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 24,
              padding: '0.65rem 1rem',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '0.5rem',
            }}
          >
            <textarea
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
              placeholder="Follow up..."
              rows={1}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontSize: '0.9rem',
                color: TEXT_PRIMARY,
                fontFamily: 'inherit',
                lineHeight: 1.5,
                maxHeight: 120,
                overflowY: 'auto',
              }}
            />
            {isGenerating ? (
              <button
                title="Stop"
                style={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: ACCENT,
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="#000">
                  <rect x="2" y="2" width="10" height="10" rx="1.5" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleFollowUp}
                disabled={!followUp.trim()}
                title="Send"
                style={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: followUp.trim() ? ACCENT : 'transparent',
                  border: followUp.trim() ? 'none' : `1px solid ${BORDER}`,
                  borderRadius: '50%',
                  cursor: followUp.trim() ? 'pointer' : 'default',
                  flexShrink: 0,
                  transition: 'background-color 0.15s',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke={followUp.trim() ? '#000' : TEXT_MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────────── */

/** Right-aligned user message bubble */
function UserBubble({ text }: { text: string }) {
  // Strip [Type] prefix for display
  const displayText = text.replace(/^\[.*?\]\s*/, '');
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div
        style={{
          backgroundColor: '#2a2a2e',
          color: TEXT_PRIMARY,
          padding: '0.6rem 1rem',
          borderRadius: 20,
          fontSize: '0.9rem',
          lineHeight: 1.5,
          maxWidth: '75%',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {displayText}
      </div>
    </div>
  );
}

/** Left-aligned assistant output block */
function AssistantBlock({ messages, isLive }: { messages: StreamUIMessage[]; isLive?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
      {/* Sparkle icon like Gemini */}
      <div style={{ color: ACCENT, fontSize: '0.9rem', marginBottom: 2 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
        </svg>
      </div>
      {messages.length === 0 && isLive && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: TEXT_MUTED,
            fontSize: '0.85rem',
          }}
        >
          <span className="spin" style={{ display: 'inline-block', width: 14, height: 14 }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
          </span>
          Thinking...
        </div>
      )}
      {messages.map((msg) => (
        <StreamMessage key={msg.id} message={msg} />
      ))}
      {isLive && messages.length > 0 && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            color: TEXT_MUTED,
            fontSize: '0.75rem',
            marginTop: 2,
          }}
        >
          <span className="spin" style={{ display: 'inline-block', width: 12, height: 12 }}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
          </span>
        </div>
      )}
    </div>
  );
}
