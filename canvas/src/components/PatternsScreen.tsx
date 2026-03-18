import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BrandPattern {
  id: string;
  slug: string;
  label: string;
  category: string;
  content: string;
  sortOrder: number;
  updatedAt: number;
}

// ─── Category → Display Group ─────────────────────────────────────────────────

interface PatternGroup {
  id: string;
  title: string;
  subtitle: string;
  slugs: string[]; // ordered
}

const DISPLAY_GROUPS: PatternGroup[] = [
  {
    id: 'visual-tokens',
    title: 'Visual Tokens',
    subtitle: 'Color foundations, typography rules, and opacity patterns.',
    slugs: ['color-palette', 'typography', 'opacity-patterns'],
  },
  {
    id: 'brand-assets',
    title: 'Brand Assets',
    subtitle: 'Textures, emphasis elements, photos, logos, and footer structure.',
    slugs: [
      'brushstroke-textures',
      'circles-underlines',
      'line-textures',
      'scribble-textures',
      'x-mark-textures',
      'photos-mockups',
      'footer-structure',
    ],
  },
  {
    id: 'patterns',
    title: 'Patterns',
    subtitle: 'Compositional rules, FLFont usage, and layout archetypes.',
    slugs: ['flfont-tagline-patterns', 'layout-archetypes', 'visual-compositor-contract'],
  },
];

// ─── Pattern styles ─────────────────────────────────────────────────────────

const PATTERN_STYLES = `
  /* Markdown content styles */
  .pattern-content {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 15px;
    line-height: 1.7;
    color: rgba(255,255,255,0.75);
  }
  .pattern-content h2 {
    font-size: 22px;
    font-weight: 700;
    color: #fff;
    margin: 32px 0 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .pattern-content h3 {
    font-size: 17px;
    font-weight: 600;
    color: rgba(255,255,255,0.9);
    margin: 24px 0 8px;
  }
  .pattern-content h4 {
    font-size: 14px;
    font-weight: 600;
    color: rgba(255,255,255,0.7);
    margin: 16px 0 6px;
  }
  .pattern-content p {
    margin: 8px 0;
  }
  .pattern-content strong {
    color: #fff;
    font-weight: 700;
  }
  .pattern-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 13px;
  }
  .pattern-content th {
    text-align: left;
    padding: 10px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.45);
    font-weight: 500;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .pattern-content td {
    padding: 10px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.75);
  }
  .pattern-content code {
    font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
    font-size: 12px;
    background: rgba(255,255,255,0.06);
    padding: 2px 6px;
    border-radius: 3px;
    color: #FF8B58;
  }
  .pattern-content pre {
    background: #111;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px;
    padding: 20px;
    margin: 16px 0;
    overflow-x: auto;
  }
  .pattern-content pre code {
    background: none;
    padding: 0;
    font-size: 12px;
    line-height: 1.6;
    color: rgba(255,255,255,0.75);
  }
  .pattern-content ul, .pattern-content ol {
    padding-left: 24px;
    margin: 8px 0;
  }
  .pattern-content li {
    margin: 4px 0;
  }
  .pattern-content hr {
    border: none;
    border-top: 1px solid rgba(255,255,255,0.06);
    margin: 24px 0;
  }

  /* ── Preview sandbox ──────────────────────────────────────── */
  @font-face {
    font-family: 'flfontbold';
    src: url('/api/brand-assets/serve/flfontbold') format('truetype');
    font-weight: 700;
    font-style: normal;
  }
  @font-face {
    font-family: 'NeueHaas';
    src: url('/api/brand-assets/serve/Inter-VariableFont') format('truetype');
    font-weight: 100 900;
    font-style: normal;
  }

  .code-preview-sandbox {
    font-family: 'Inter', 'NeueHaas', sans-serif;
    color: #fff;
    background: #000;
    padding: 24px;
    font-size: 14px;
    line-height: 1.5;
  }
  .code-preview-sandbox img {
    max-width: 100%;
    height: auto;
  }
  .code-preview-sandbox .footer {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 22px 68px;
  }
  .code-preview-sandbox .footer-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .code-preview-sandbox .footer-left img { height: 18px; opacity: 0.8; }
  .code-preview-sandbox .footer-separator {
    width: 1px;
    height: 14px;
    background: rgba(255,255,255,0.15);
  }
  .code-preview-sandbox .footer-right img { height: 22px; opacity: 0.8; }

  /* Spinner animation */
  @keyframes patterns-spin { to { transform: rotate(360deg); } }
`;

// ─── CodePreview: tabbed rendered / code view for fenced code blocks ──────────

function CodePreview({ code, language }: { code: string; language: string }) {
  // Default to preview for HTML or mixed blocks; code for pure CSS
  const hasHtml = language === 'html' || (language !== 'css' && code.includes('<'));
  const [tab, setTab] = useState<'preview' | 'code'>(hasHtml ? 'preview' : 'preview');

  // Build preview HTML: inject CSS as <style>, render HTML in a sandboxed container
  const previewHtml = (() => {
    if (language === 'css') {
      // For CSS blocks, apply the styles and show sample elements
      return `<style>${code}</style>
        <div style="padding: 16px; font-family: 'Inter', sans-serif; color: rgba(255,255,255,0.75); font-size: 13px;">
          <div class="headline" style="font-size: 28px; font-weight: 900; margin-bottom: 8px;">Headline Sample</div>
          <div class="body-copy" style="margin-bottom: 8px;">Body copy sample text for visual reference.</div>
          <div class="tagline" style="margin-bottom: 8px;">Tagline sample</div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <span class="pill" style="padding: 4px 10px; border-radius: 4px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);">pill</span>
            <span class="context-label">context label</span>
          </div>
        </div>`;
    }
    // HTML or mixed: render as-is
    return code;
  })();

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 14px',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.03em',
    border: 'none',
    borderBottom: active ? '2px solid #42b1ff' : '2px solid transparent',
    background: 'none',
    color: active ? '#42b1ff' : 'rgba(255,255,255,0.35)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  return (
    <div style={{
      margin: '16px 0',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 8,
      overflow: 'hidden',
      background: '#111',
    }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        gap: 0,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: '#0a0a0a',
        padding: '0 8px',
      }}>
        <button style={tabStyle(tab === 'preview')} onClick={() => setTab('preview')}>
          Preview
        </button>
        <button style={tabStyle(tab === 'code')} onClick={() => setTab('code')}>
          Code
        </button>
        {language && (
          <span style={{
            marginLeft: 'auto',
            alignSelf: 'center',
            fontSize: 10,
            color: 'rgba(255,255,255,0.2)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            paddingRight: 8,
          }}>
            {language}
          </span>
        )}
      </div>

      {/* Content */}
      {tab === 'preview' ? (
        <div
          className="code-preview-sandbox"
          style={{
            padding: 0,
            background: '#000',
            minHeight: 40,
            overflow: 'hidden',
          }}
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      ) : (
        <pre style={{
          margin: 0,
          padding: 20,
          overflow: 'auto',
          background: '#111',
        }}>
          <code style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
            fontSize: 12,
            lineHeight: 1.6,
            color: 'rgba(255,255,255,0.75)',
            background: 'none',
            padding: 0,
          }}>
            {code}
          </code>
        </pre>
      )}
    </div>
  );
}

// ─── Custom ReactMarkdown components ──────────────────────────────────────────

const markdownComponents: Record<string, React.ComponentType<Record<string, unknown>>> = {
  // Override fenced code blocks with CodePreview
  code({ className, children }: { className?: string; children?: React.ReactNode }) {
    const match = /language-(\w+)/.exec(className || '');
    if (match) {
      const code = String(children).replace(/\n$/, '');
      return <CodePreview code={code} language={match[1]} />;
    }
    // Inline code — pass through
    return <code className={className}>{children}</code>;
  },
  // Unwrap <pre> so CodePreview isn't nested inside it
  pre({ children }: { children?: React.ReactNode }) {
    return <>{children}</>;
  },
};

// ─── PatternSection Component ─────────────────────────────────────────────────

interface PatternSectionProps {
  pattern: BrandPattern;
  onSave: (slug: string, content: string) => Promise<void>;
  savedSlug: string | null;
  failedSlug: string | null;
}

function PatternSection({ pattern, onSave, savedSlug, failedSlug }: PatternSectionProps) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  const handleStartEdit = () => {
    setEditContent(pattern.content);
    setEditing(true);
  };

  const handleSave = async () => {
    setEditing(false);
    await onSave(pattern.slug, editContent);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const isSaved = savedSlug === pattern.slug;
  const isFailed = failedSlug === pattern.slug;

  return (
    <div style={{ marginBottom: 80, paddingTop: 32 }}>
      {/* Section title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <h2 style={{
          fontSize: 32,
          fontWeight: 900,
          letterSpacing: '-0.02em',
          margin: 0,
          color: '#fff',
        }}>
          {pattern.label}
        </h2>

        {/* Edit toggle */}
        <button
          onClick={editing ? handleCancel : handleStartEdit}
          style={{
            background: editing ? 'rgba(255,59,48,0.15)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${editing ? 'rgba(255,59,48,0.3)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 4,
            padding: '4px 10px',
            fontSize: 11,
            fontWeight: 600,
            color: editing ? '#ff3b30' : 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            letterSpacing: '0.02em',
            transition: 'all 0.15s',
          }}
        >
          {editing ? 'Cancel' : 'Edit'}
        </button>

        {isSaved && (
          <span style={{ fontSize: 12, color: '#44b574', fontWeight: 500 }}>Saved</span>
        )}
        {isFailed && (
          <span style={{ fontSize: 12, color: '#ff3b30', fontWeight: 500 }}>Save failed</span>
        )}
      </div>

      {/* Content: visual render or edit textarea */}
      {editing ? (
        <div style={{ marginTop: 16 }}>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{
              width: '100%',
              minHeight: 400,
              backgroundColor: '#111',
              border: '1px solid #42b1ff',
              borderRadius: 6,
              padding: 16,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              fontSize: 12,
              color: 'rgba(255,255,255,0.75)',
              resize: 'vertical',
              outline: 'none',
              lineHeight: 1.6,
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              onClick={handleSave}
              style={{
                background: '#42b1ff',
                border: 'none',
                borderRadius: 4,
                padding: '6px 16px',
                fontSize: 12,
                fontWeight: 600,
                color: '#000',
                cursor: 'pointer',
              }}
            >
              Save
            </button>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', alignSelf: 'center' }}>
              Ctrl+Enter to save, Esc to cancel
            </span>
          </div>
        </div>
      ) : (
        <div ref={contentRef} className="pattern-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {pattern.content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

// ─── PatternsScreen ───────────────────────────────────────────────────────────

export function PatternsScreen() {
  const [patterns, setPatterns] = useState<BrandPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [failedSlug, setFailedSlug] = useState<string | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/brand-patterns')
      .then((r) => {
        if (!r.ok) throw new Error('Fetch failed');
        return r.json();
      })
      .then((data: BrandPattern[]) => {
        setPatterns(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const savePattern = async (slug: string, content: string) => {
    const prevPatterns = patterns;
    // Optimistic update
    setPatterns((ps) => ps.map((p) => (p.slug === slug ? { ...p, content } : p)));

    try {
      const res = await fetch(`/api/brand-patterns/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSavedSlug(slug);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSavedSlug(null), 2000);
    } catch {
      // Revert on failure
      setPatterns(prevPatterns);
      setFailedSlug(slug);
      if (failedTimerRef.current) clearTimeout(failedTimerRef.current);
      failedTimerRef.current = setTimeout(() => setFailedSlug(null), 4000);
    }
  };

  // ─── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        backgroundColor: '#000',
      }}>
        <div style={{
          width: 20,
          height: 20,
          border: '2px solid #333',
          borderTopColor: '#555',
          borderRadius: '50%',
          animation: 'patterns-spin 0.8s linear infinite',
        }} />
        <style>{PATTERN_STYLES}</style>
      </div>
    );
  }

  // ─── Error state ────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        backgroundColor: '#000',
        color: '#777',
        fontSize: 14,
        padding: 24,
        textAlign: 'center',
      }}>
        Failed to load Patterns data. Check the server is running and refresh.
      </div>
    );
  }

  // ─── Build pattern map for quick lookup ─────────────────────────────────────

  const patternMap = new Map<string, BrandPattern>();
  for (const p of patterns) {
    patternMap.set(p.slug, p);
  }

  // Patterns not in any display group (catch-all)
  const groupedSlugs = new Set(DISPLAY_GROUPS.flatMap((g) => g.slugs));
  const ungrouped = patterns.filter((p) => !groupedSlugs.has(p.slug));

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#000',
    }}>
      {/* Inject pattern styles */}
      <style>{PATTERN_STYLES}</style>

      {/* Fixed header bar */}
      <div style={{
        flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backgroundColor: '#000',
        padding: '14px 1rem',
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fff', margin: 0 }}>
          Patterns
        </h1>
        <p style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.45)', marginTop: 4, marginBottom: 0 }}>
          Visual building blocks — color foundations, typographic rules, spacing systems, and compositional techniques
        </p>
      </div>

      {/* Scrollable content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '48px 64px 96px',
        maxWidth: 1200,
        boxSizing: 'border-box',
      }}>

        {/* Display groups */}
        {DISPLAY_GROUPS.map((group) => {
          const groupPatterns = group.slugs
            .map((slug) => patternMap.get(slug))
            .filter((p): p is BrandPattern => p !== undefined);

          if (groupPatterns.length === 0) return null;

          return (
            <div key={group.id} style={{ marginBottom: 32 }}>
              {/* Group header */}
              <div style={{
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                paddingBottom: 12,
                marginBottom: 48,
              }}>
                <div style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.15em',
                  color: 'rgba(255,255,255,0.25)',
                  marginBottom: 4,
                }}>
                  {group.title}
                </div>
                <div style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.35)',
                }}>
                  {group.subtitle}
                </div>
              </div>

              {/* Pattern sections */}
              {groupPatterns.map((pattern) => (
                <PatternSection
                  key={pattern.slug}
                  pattern={pattern}
                  onSave={savePattern}
                  savedSlug={savedSlug}
                  failedSlug={failedSlug}
                />
              ))}
            </div>
          );
        })}

        {/* Ungrouped patterns */}
        {ungrouped.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              paddingBottom: 12,
              marginBottom: 48,
            }}>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.15em',
                color: 'rgba(255,255,255,0.25)',
                marginBottom: 4,
              }}>
                Other
              </div>
              <div style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.35)',
              }}>
                Additional patterns and rules.
              </div>
            </div>
            {ungrouped.map((pattern) => (
              <PatternSection
                key={pattern.slug}
                pattern={pattern}
                onSave={savePattern}
                savedSlug={savedSlug}
                failedSlug={failedSlug}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
