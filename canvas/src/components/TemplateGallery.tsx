import { TEMPLATE_METADATA, type TemplateMetadata } from '../lib/template-configs';

interface TemplateGalleryProps {
  onSelectTemplate: (template: TemplateMetadata) => void;
  /**
   * 'modal' — compact version inside the creation flow modal.
   * 'standalone' — legacy full-page view (kept for compatibility).
   * Defaults to 'modal'.
   */
  mode?: 'modal' | 'standalone';
}

const PLATFORM_LABELS: Record<string, string> = {
  'instagram-square': 'Instagram',
  'linkedin-landscape': 'LinkedIn',
  'unknown': 'Other',
};

/**
 * Grid of template cards using static TEMPLATE_METADATA from template-configs.ts.
 * Uses thumbnail images from canvas/public/templates/thumbnails/.
 * Appears inside the creation flow modal, not as a top-level section.
 */
export function TemplateGallery({ onSelectTemplate, mode = 'modal' }: TemplateGalleryProps) {
  return (
    <div style={{ padding: mode === 'modal' ? '1.25rem' : '1.5rem', overflowY: 'auto', height: '100%' }}>
      {mode === 'standalone' && (
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#fff' }}>
          Choose a Template
        </h2>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1rem',
        }}
      >
        {TEMPLATE_METADATA.map((template) => (
          <TemplateCard
            key={template.templateId}
            template={template}
            onSelect={onSelectTemplate}
          />
        ))}
      </div>

      {TEMPLATE_METADATA.length === 0 && (
        <div style={{ color: '#555', textAlign: 'center', padding: '2rem' }}>
          No templates available.
        </div>
      )}
    </div>
  );
}

// ─── Template Card ───────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: TemplateMetadata;
  onSelect: (template: TemplateMetadata) => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const platformLabel = PLATFORM_LABELS[template.platform] ?? template.platform;
  const isLandscape = template.dimensions.width > template.dimensions.height;
  const thumbHeight = isLandscape ? 150 : 200;

  return (
    <div
      onClick={() => onSelect(template)}
      style={{
        border: '1px solid #2a2a3e',
        borderRadius: 8,
        overflow: 'hidden',
        cursor: 'pointer',
        backgroundColor: '#1e1e36',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#3b82f6';
        e.currentTarget.style.boxShadow = '0 0 0 1px rgba(59, 130, 246, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#2a2a3e';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Thumbnail */}
      <div style={{
        height: thumbHeight,
        overflow: 'hidden',
        backgroundColor: '#0d0d1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <img
          src={`/${template.thumbnailPath}`}
          alt={template.name}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
          onError={(e) => {
            // Show a placeholder on broken thumbnail
            const img = e.currentTarget;
            img.style.display = 'none';
            const parent = img.parentElement;
            if (parent && !parent.querySelector('.thumb-placeholder')) {
              const placeholder = document.createElement('div');
              placeholder.className = 'thumb-placeholder';
              placeholder.style.cssText = `
                display: flex; align-items: center; justify-content: center;
                width: 100%; height: 100%; color: #333; font-size: 0.75rem;
              `;
              placeholder.textContent = template.name;
              parent.appendChild(placeholder);
            }
          }}
        />
      </div>

      {/* Label row */}
      <div style={{
        padding: '0.625rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
      }}>
        <div style={{
          fontSize: '0.85rem',
          fontWeight: 500,
          color: '#e0e0e0',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {template.name}
        </div>
        <div style={{
          fontSize: '0.7rem',
          color: '#666',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {template.description}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.125rem' }}>
          <span style={{
            fontSize: '0.65rem',
            padding: '2px 6px',
            borderRadius: 4,
            backgroundColor: 'rgba(59,130,246,0.15)',
            color: '#7db5ff',
            flexShrink: 0,
          }}>
            {platformLabel}
          </span>
          <span style={{
            fontSize: '0.65rem',
            color: '#444',
          }}>
            {template.dimensions.width} × {template.dimensions.height}
          </span>
        </div>
      </div>
    </div>
  );
}
