import { useState } from 'react';
import type { TemplateMetadata } from '../lib/template-configs';
import { getTemplateSchema } from '../lib/template-configs';

interface TemplateCustomizerProps {
  template: TemplateMetadata;
  campaignId: string;
  onBack: () => void;
  /** Called with the campaignId after the asset+frame+iteration are created. */
  onCreated: (campaignId: string) => void;
}

const ACCENT_COLORS: Array<{ name: string; hex: string }> = [
  { name: 'orange', hex: '#F26522' },
  { name: 'blue', hex: '#3b82f6' },
  { name: 'green', hex: '#22c55e' },
  { name: 'purple', hex: '#8b5cf6' },
];

/**
 * Template customization form shown after selecting a template from the gallery.
 *
 * In the campaign model, creating a template asset creates:
 *   Asset (title, assetType, frameCount=1)
 *     Frame (frameIndex=0)
 *       Iteration (source='template', templateId, slotSchema from template-configs)
 *
 * The HTML content is left empty for now (templateId can be used by the iframe
 * server to serve the correct HTML). The slotSchema is stored in the iteration
 * so ContentEditor can immediately render the right editing fields.
 */
export function TemplateCustomizer({ template, campaignId, onBack, onCreated }: TemplateCustomizerProps) {
  const [title, setTitle] = useState(template.name);
  const [accentColor, setAccentColor] = useState('orange');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    setError(null);

    try {
      // 1. Create the asset
      const assetRes = await fetch(`/api/campaigns/${campaignId}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          assetType: template.platform,
          frameCount: template.dimensions.width > template.dimensions.height ? 1 : 1,
        }),
      });
      if (!assetRes.ok) throw new Error(`Failed to create asset: ${assetRes.status}`);
      const asset = await assetRes.json();

      // 2. Create frame 0
      const frameRes = await fetch(`/api/assets/${asset.id}/frames`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frameIndex: 0 }),
      });
      if (!frameRes.ok) throw new Error(`Failed to create frame: ${frameRes.status}`);
      const frame = await frameRes.json();

      // 3. Create the iteration with slotSchema from template config
      const slotSchema = getTemplateSchema(template.templateId);
      const htmlPath = `templates/${template.templateId}.html`;

      const iterRes = await fetch(`/api/frames/${frame.id}/iterations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iterationIndex: 0,
          htmlPath,
          source: 'template',
          templateId: template.templateId,
          slotSchema: slotSchema ?? null,
          aiBaseline: null,
        }),
      });
      if (!iterRes.ok) throw new Error(`Failed to create iteration: ${iterRes.status}`);

      // 4. Navigate to the campaign (which will reload assets)
      onCreated(campaignId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset');
      setCreating(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: '#3b82f6',
          cursor: 'pointer',
          fontSize: '0.85rem',
          padding: 0,
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Templates
      </button>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Template preview thumbnail */}
        <div style={{ flexShrink: 0 }}>
          <div style={{
            width: 280,
            height: template.platform === 'linkedin-landscape' ? 132 : 200,
            overflow: 'hidden',
            borderRadius: 8,
            border: '1px solid #2a2a3e',
            backgroundColor: '#0d0d1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img
              src={`/${template.thumbnailPath}`}
              alt={template.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#666' }}>
            {template.dimensions.width} × {template.dimensions.height}px
          </div>
        </div>

        {/* Customization form */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', color: '#fff' }}>
            {template.name}
          </h3>

          <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: '#666', lineHeight: 1.5 }}>
            {template.description}
          </p>

          {/* Asset title */}
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="tmpl-title" style={labelStyle}>Asset Title</label>
            <input
              id="tmpl-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for this asset..."
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
              onBlur={(e) => (e.target.style.borderColor = '#3a3a52')}
            />
          </div>

          {/* Accent color selection */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={labelStyle}>Accent Color</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setAccentColor(c.name)}
                  title={c.name}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: c.hex,
                    border: accentColor === c.name ? '3px solid #fff' : '3px solid transparent',
                    cursor: 'pointer',
                    outline: 'none',
                    boxShadow: accentColor === c.name ? '0 0 0 2px rgba(255,255,255,0.3)' : 'none',
                    transition: 'box-shadow 0.12s',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Notes / brief */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="tmpl-notes" style={labelStyle}>Notes (optional)</label>
            <textarea
              id="tmpl-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or brief for this asset..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
              onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
              onBlur={(e) => (e.target.style.borderColor = '#3a3a52')}
            />
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.625rem 0.875rem',
              backgroundColor: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 6,
              fontSize: '0.8rem',
              color: '#f87171',
            }}>
              {error}
            </div>
          )}

          {/* Create button */}
          <button
            onClick={handleCreate}
            disabled={creating || !title.trim()}
            style={{
              backgroundColor: creating || !title.trim() ? '#1e2a40' : '#3b82f6',
              color: creating || !title.trim() ? '#444' : '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '0.6rem 1.5rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: creating || !title.trim() ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              if (!creating && title.trim()) {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (!creating && title.trim()) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }
            }}
          >
            {creating ? 'Creating...' : 'Create Asset'}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  color: '#888',
  marginBottom: '0.3rem',
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#252540',
  border: '1px solid #3a3a52',
  borderRadius: 6,
  color: '#e0e0e0',
  padding: '0.5rem 0.75rem',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s',
};
