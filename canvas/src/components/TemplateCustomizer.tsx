import { useState } from 'react';
import type { TemplateInfo, TemplateCustomization } from '../lib/templates';
import { useGenerationStream } from '../hooks/useGenerationStream';

interface TemplateCustomizerProps {
  template: TemplateInfo;
  onBack: () => void;
}

const ACCENT_COLORS: Array<{ name: TemplateCustomization['accentColor']; hex: string }> = [
  { name: 'orange', hex: '#F26522' },
  { name: 'blue', hex: '#3b82f6' },
  { name: 'green', hex: '#22c55e' },
  { name: 'purple', hex: '#8b5cf6' },
];

/**
 * Customization form shown after selecting a template from the gallery.
 * Collects headline, accent color, topic, platform, and variation count,
 * then triggers generation via useGenerationStream.
 */
export function TemplateCustomizer({ template, onBack }: TemplateCustomizerProps) {
  const { generate, status } = useGenerationStream();

  const [headline, setHeadline] = useState('');
  const [accentColor, setAccentColor] = useState<TemplateCustomization['accentColor']>('orange');
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [variations, setVariations] = useState(3);

  const isGenerating = status === 'generating';

  const handleGenerate = () => {
    const customization: TemplateCustomization = {
      headline,
      accentColor,
      topic,
      platform: template.category === 'social' ? platform : undefined,
      variations,
    };

    const promptParts = [
      `Create ${variations} variation(s) of the "${template.name}" template.`,
      headline && `Headline: ${headline}`,
      topic && `Topic/Brief: ${topic}`,
      `Accent color: ${accentColor}`,
      template.category === 'social' && `Platform: ${platform}`,
    ].filter(Boolean);

    generate(promptParts.join('\n'), {
      template: template.id,
      customization,
      skillType: template.category === 'social' ? 'social' : 'one-pager',
    });
  };

  const previewWidth = 400;
  const scale = previewWidth / template.dimensions.width;
  const previewHeight = template.dimensions.height * scale;

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
          marginBottom: '1rem',
        }}
      >
        Back to Templates
      </button>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Template preview */}
        <div style={{ flexShrink: 0 }}>
          <div
            style={{
              width: previewWidth,
              height: previewHeight,
              overflow: 'hidden',
              borderRadius: 8,
              border: '1px solid #2a2a3e',
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
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#888' }}>
            {template.name} ({template.category})
          </div>
        </div>

        {/* Customization form */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#fff' }}>
            Customize
          </h3>

          {/* Headline */}
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="cust-headline" style={labelStyle}>Headline</label>
            <input
              id="cust-headline"
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Enter your headline..."
              style={inputStyle}
            />
          </div>

          {/* Accent color */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={labelStyle}>Accent Color</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.name}
                  data-testid={`color-${c.name}`}
                  onClick={() => setAccentColor(c.name)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: c.hex,
                    border: accentColor === c.name ? '3px solid #fff' : '3px solid transparent',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Topic */}
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="cust-topic" style={labelStyle}>Topic / Brief</label>
            <textarea
              id="cust-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Describe what this asset is about..."
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            />
          </div>

          {/* Platform (social only) */}
          {template.category === 'social' && (
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="cust-platform" style={labelStyle}>Platform</label>
              <select
                id="cust-platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                style={inputStyle}
              >
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>
          )}

          {/* Variations */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="cust-variations" style={labelStyle}>Variations</label>
            <input
              id="cust-variations"
              type="number"
              min={1}
              max={5}
              value={variations}
              onChange={(e) => setVariations(Number(e.target.value))}
              style={{ ...inputStyle, width: 80 }}
            />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              backgroundColor: isGenerating ? '#333' : '#3b82f6',
              color: isGenerating ? '#666' : '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '0.6rem 1.5rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
            }}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
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
  marginBottom: '0.25rem',
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
};
