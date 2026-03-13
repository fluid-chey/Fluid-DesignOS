import { useState } from 'react';

const CHIPS = [
  { id: 'db-auth', label: 'Add database and auth', icon: 'drop' },
  { id: 'nano-banana', label: 'Nano Banana 2', icon: 'brush' },
  { id: 'voice-apps', label: 'Create conversational voice apps', icon: 'waves' },
  { id: 'animate', label: 'Animate images wit', icon: 'doc', more: true },
];

function SparkleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M5 21l2-6 4 2-2 4-4-0z" />
      <path d="M19 21l-2-6-4 2 2 4 4 0z" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function PlusCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function ChipIcon({ type }: { type: string }) {
  const color = '#44B2FF';
  if (type === 'drop') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    );
  }
  if (type === 'brush') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M9.06 11.9L2 19l2.1-7.06L19 2l-7.9 7.06z" />
      </svg>
    );
  }
  if (type === 'waves') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M2 12h2v2H2zM6 10h2v4H6zM10 8h2v8h-2zM14 10h2v4h-2zM18 12h2v2h-2zM22 6h2v12h-2z" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 7h10M7 12h10M7 17h6" />
    </svg>
  );
}

export function BuildHero() {
  const [prompt, setPrompt] = useState('');

  return (
    <div style={{
      padding: '1.5rem 1.5rem 1rem',
      borderBottom: '1px solid var(--border, #1e1e1e)',
      backgroundColor: 'var(--bg-primary, #0d0d0d)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        marginBottom: '1.25rem',
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: 600,
          color: '#fff',
          letterSpacing: '-0.02em',
          fontFamily: 'inherit',
        }}>
          Build your ideas with Gemini
        </h1>
        <SparkleIcon />
      </div>

      <div style={{
        maxWidth: 640,
        margin: '0 auto 1rem',
        padding: 2,
        borderRadius: 14,
        background: 'linear-gradient(90deg, #f97316 0%, #eab308 25%, #22c55e 50%, #3b82f6 100%)',
        boxShadow: '0 0 24px rgba(59, 130, 246, 0.15)',
      }}>
        <div style={{
          borderRadius: 12,
          backgroundColor: '#1a1a1e',
          overflow: 'hidden',
        }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe an app and let Gemini do the rest"
            rows={2}
            style={{
              width: '100%',
              padding: '14px 16px 12px',
              background: 'transparent',
              border: 'none',
              color: '#e0e0e0',
              fontSize: '0.9375rem',
              lineHeight: 1.5,
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            padding: '10px 14px',
            borderTop: '1px solid #2a2a2e',
          }}>
            <button
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '6px 12px',
                borderRadius: 8,
                backgroundColor: '#25252a',
                border: 'none',
                color: '#e0e0e0',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <GearIcon />
              Model: Gemini 3.1 Pro Preview
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button type="button" title="Voice input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', backgroundColor: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                <MicIcon />
              </button>
              <button type="button" title="Add attachment" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', backgroundColor: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                <PlusCircleIcon />
              </button>
              <button
                type="button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '8px 14px',
                  borderRadius: 8,
                  backgroundColor: '#25252a',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <SparkleIcon />
                I'm feeling lucky
              </button>
              <button
                type="button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '8px 14px',
                  borderRadius: 8,
                  backgroundColor: '#2a2a2e',
                  border: 'none',
                  color: '#888',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Build
                <ArrowLeftIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: 4,
        maxWidth: 640,
        margin: '0 auto',
      }}>
        {CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '8px 14px',
              borderRadius: 20,
              backgroundColor: '#25252a',
              border: '1px solid #2a2a2e',
              color: '#e0e0e0',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            <ChipIcon type={chip.icon} />
            {chip.label}
            {'more' in chip && chip.more && <span style={{ color: '#666', marginLeft: 2 }}>&gt;</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
