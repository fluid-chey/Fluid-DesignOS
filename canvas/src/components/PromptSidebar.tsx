import { useState, useRef, useEffect, useMemo } from 'react';
import { useGenerationStream } from '../hooks/useGenerationStream';
import { StreamMessage } from './StreamMessage';
import { useGenerationStore } from '../store/generation';
import { useCampaignStore } from '../store/campaign';
import type { StreamUIMessage } from '../lib/stream-parser';
import { ContextPanel } from './ContextPanel';

/**
 * Left sidebar with prompt input and streaming agent output display.
 * Always visible regardless of main pane view.
 */
export function PromptSidebar() {
  const { generate, cancelGeneration, status, events, errorMessage } = useGenerationStream();
  const [prompt, setPrompt] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const resetGeneration = useGenerationStore((s) => s.reset);
  const activeCampaignId = useGenerationStore((s) => s.activeCampaignId);
  const generationStatus = useGenerationStore((s) => s.status);
  const generationSource = useGenerationStore((s) => s.source);
  const isSingleCreation = useGenerationStore((s) => s.isSingleCreation);
  const creationIds = useGenerationStore((s) => s.creationIds);

  // When generation was started from BuildHero, the main viewport handles display
  const heroOwnsGeneration = generationSource === 'hero';
  const navigateToCampaign = useCampaignStore((s) => s.navigateToCampaign);
  const navigateToCreation = useCampaignStore((s) => s.navigateToCreation);
  const campaignCurrentView = useCampaignStore((s) => s.currentView);
  const campaignActiveCampaignId = useCampaignStore((s) => s.activeCampaignId);
  const campaigns = useCampaignStore((s) => s.campaigns);

  // "Add to existing campaign" mode — active when user is viewing a campaign
  const isAddToCampaignMode =
    campaignCurrentView === 'campaign' && !!campaignActiveCampaignId;
  const [addToCampaignDismissed, setAddToCampaignDismissed] = useState(false);
  const showAddToCampaignBanner = isAddToCampaignMode && !addToCampaignDismissed;

  // Find the campaign title for the banner
  const activeCampaignTitle = campaigns.find((c) => c.id === campaignActiveCampaignId)?.title
    ?? campaignActiveCampaignId ?? '';

  const isGenerating = status === 'generating';

  // Accumulate consecutive text events into single messages, filter tool noise
  const displayMessages = useMemo(() => {
    const result: StreamUIMessage[] = [];
    for (const ev of events) {
      // Filter out tool-level noise — stage badges replace these
      if (ev.type === 'tool-start' || ev.type === 'tool-done') continue;
      if (ev.type === 'text' && result.length > 0 && result[result.length - 1].type === 'text') {
        // Merge into previous text message
        const prev = result[result.length - 1];
        result[result.length - 1] = {
          ...prev,
          content: prev.content + ev.content,
        };
      } else {
        result.push(ev);
      }
    }
    return result;
  }, [events]);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages]);

  const [submittedPrompt, setSubmittedPrompt] = useState('');

  // Navigate to the newly created/updated campaign (or creation) when generation completes.
  // No delay — the 'done' SSE event fires only after all subagents complete (Plan 02).
  const prevStatusRef = useRef(generationStatus);
  useEffect(() => {
    // Skip auto-navigation when BuildHero's GenerationStreamView owns the experience
    if (heroOwnsGeneration) {
      prevStatusRef.current = generationStatus;
      return;
    }
    if (prevStatusRef.current === 'generating' && generationStatus === 'complete' && activeCampaignId) {
      if (isSingleCreation && creationIds.length === 1) {
        // Single-creation prompt: navigate directly to the creation
        navigateToCreation(creationIds[0]);
      } else {
        navigateToCampaign(activeCampaignId);
      }
    }
    prevStatusRef.current = generationStatus;
  }, [generationStatus, activeCampaignId, isSingleCreation, creationIds, navigateToCampaign, navigateToCreation, heroOwnsGeneration]);

  // Reset "Add to campaign" dismissed state when campaign view changes
  useEffect(() => {
    setAddToCampaignDismissed(false);
  }, [campaignActiveCampaignId]);

  const handleGenerate = () => {
    const text = prompt.trim();
    if (!text || isGenerating) return;

    setSubmittedPrompt(text);

    // Base generate options — include existingCampaignId when in add-to-campaign mode
    const opts = {
      skillType: 'social' as const,
      source: 'sidebar' as const,
      ...(showAddToCampaignBanner && campaignActiveCampaignId
        ? { existingCampaignId: campaignActiveCampaignId }
        : {}),
    };

    generate(text, opts);
    setPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const placeholderText = 'Describe what you want to create...';
  const buttonText = isGenerating ? 'Generating...' : 'Generate';

  return (
    <div
      style={{
        width: '100%',
        borderRight: '1px solid #2a2a2e',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#111111',
        flexShrink: 0,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header — static mode label */}
      <div style={{ padding: '0.75rem', borderBottom: '1px solid #2a2a2e', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '0.75rem', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Create with AI
            </span>
          </div>
        </div>
      </div>

      {/* Message scroll area — flex: 1, messages pushed to bottom via spacer */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {heroOwnsGeneration ? (
          /* BuildHero's GenerationStreamView is handling the display */
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '2rem' }}>
            <span style={{ fontSize: '0.82rem', color: '#555', textAlign: 'center' }}>
              {isGenerating ? 'Generating in main view...' : 'Enter a prompt below to get started.'}
            </span>
          </div>
        ) : displayMessages.length === 0 && !isGenerating ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '2rem' }}>
            <span style={{ fontSize: '0.82rem', color: '#555', textAlign: 'center' }}>
              Enter a prompt below to get started.
            </span>
          </div>
        ) : (
          <>
            {/* Spacer pushes messages to bottom when few; shrinks as messages accumulate */}
            <div style={{ flex: 1 }} />
            {displayMessages.map((msg) => {
              if (msg.type === 'context-injected') {
                return (
                  <ContextPanel
                    key={msg.id}
                    sections={msg.sections || []}
                    tokenEstimate={msg.tokenEstimate || 0}
                    gapCount={msg.gapCount}
                  />
                );
              }
              return <StreamMessage key={msg.id} message={msg} />;
            })}
            {status === 'complete' && (
              <div style={{ textAlign: 'center', color: '#22c55e', fontSize: '0.75rem', padding: '0.5rem 0' }}>
                Done
              </div>
            )}
            {status === 'error' && (
              <div style={{ textAlign: 'center', color: '#ef4444', fontSize: '0.75rem', padding: '0.5rem 0' }}>
                Generation failed{errorMessage ? `: ${errorMessage}` : ''}
              </div>
            )}
          </>
        )}
      </div>

      {/* Input zone — bottom, fixed height */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid #2a2a2e', flexShrink: 0 }}>
        {/* "Adding to existing campaign" banner */}
        {showAddToCampaignBanner && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(68,178,255,0.08)',
            border: '1px solid rgba(68,178,255,0.2)',
            borderRadius: 5,
            padding: '0.3rem 0.5rem',
            marginBottom: '0.5rem',
            gap: '0.35rem',
          }}>
            <span style={{
              fontSize: '0.7rem',
              color: '#44B2FF',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              fontFamily: "'Inter', sans-serif",
            }}>
              Adding to: <strong>{activeCampaignTitle}</strong>
            </span>
            <button
              onClick={() => setAddToCampaignDismissed(true)}
              title="Clear — generate new campaign instead"
              style={{
                background: 'none',
                border: 'none',
                color: '#44B2FF',
                cursor: 'pointer',
                fontSize: '0.85rem',
                lineHeight: 1,
                padding: '0 2px',
                flexShrink: 0,
                opacity: 0.7,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
            >
              ×
            </button>
          </div>
        )}
        <textarea
          value={isGenerating ? submittedPrompt : prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isGenerating}
          readOnly={isGenerating}
          placeholder={placeholderText}
          style={{
            width: '100%',
            backgroundColor: '#1a1a1e',
            border: '1px solid #2a2a2e',
            borderRadius: 6,
            color: '#e0e0e0',
            padding: '0.5rem 0.6rem',
            fontSize: '0.82rem',
            resize: 'none',
            minHeight: 60,
            outline: 'none',
            boxSizing: 'border-box',
            opacity: isGenerating ? 0.5 : 1,
          }}
        />
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            style={{
              flex: 1,
              backgroundColor: isGenerating || !prompt.trim() ? '#333' : '#44B2FF',
              color: isGenerating || !prompt.trim() ? '#666' : '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '0.45rem 0.75rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: isGenerating || !prompt.trim() ? 'default' : 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {buttonText}
          </button>
          {isGenerating && (
            <button
              onClick={cancelGeneration}
              style={{
                padding: '0.45rem 0.75rem',
                backgroundColor: 'transparent',
                color: '#ef4444',
                border: '1px solid #ef4444',
                borderRadius: 6,
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Stop Generation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
