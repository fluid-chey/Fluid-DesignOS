import { useEffect, useState } from 'react';
import type { TemplateInfo } from '../lib/templates';

interface TemplateGalleryProps {
  onSelectTemplate: (template: TemplateInfo) => void;
  onFreePrompt: () => void;
}

/**
 * Grid of template cards with live iframe previews.
 * Fetches templates from /api/templates on mount.
 */
export function TemplateGallery({ onSelectTemplate, onFreePrompt }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((data: TemplateInfo[]) => {
        setTemplates(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
      <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#fff' }}>
        Choose a Template
      </h2>

      {loading && (
        <div style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
          Loading templates...
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Create with AI card */}
        <div
          onClick={onFreePrompt}
          style={{
            border: '2px dashed #3b82f6',
            borderRadius: 8,
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            minHeight: 200,
            backgroundColor: '#1e1e36',
            transition: 'border-color 0.15s',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#3b82f6' }}>+</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#3b82f6' }}>
            Create with AI
          </div>
          <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
            Start from a free-form prompt
          </div>
        </div>

        {/* Template cards */}
        {templates.map((template) => {
          const previewWidth = 280;
          const scale = previewWidth / template.dimensions.width;
          const previewHeight = template.dimensions.height * scale;

          return (
            <div
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              style={{
                border: '1px solid #2a2a3e',
                borderRadius: 8,
                overflow: 'hidden',
                cursor: 'pointer',
                backgroundColor: '#1e1e36',
                transition: 'border-color 0.15s',
              }}
            >
              {/* Iframe preview */}
              <div
                style={{
                  width: previewWidth,
                  height: previewHeight,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <iframe
                  srcDoc={template.html}
                  sandbox="allow-same-origin"
                  title={template.name}
                  style={{
                    width: template.dimensions.width,
                    height: template.dimensions.height,
                    border: 'none',
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    pointerEvents: 'none',
                  }}
                />
              </div>

              {/* Label */}
              <div style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#e0e0e0' }}>
                  {template.name}
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    padding: '2px 6px',
                    borderRadius: 4,
                    backgroundColor: template.category === 'social' ? '#3b82f622' : '#8b5cf622',
                    color: template.category === 'social' ? '#3b82f6' : '#8b5cf6',
                  }}
                >
                  {template.category}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
