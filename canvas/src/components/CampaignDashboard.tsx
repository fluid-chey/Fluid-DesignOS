import { useEffect, useState } from 'react';
import { useCampaignStore } from '../store/campaign';
import { DrillDownGrid, type DrillDownItem, type PreviewDescriptor } from './DrillDownGrid';
import type { Campaign } from '../lib/campaign-types';

// ---- New Campaign Modal ----

interface NewCampaignModalProps {
  onClose: () => void;
  onCreated: (title: string, channels: string[]) => void;
}

const CHANNEL_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'one-pager', label: 'One-pager' },
  { value: 'email', label: 'Email' },
];

function NewCampaignModal({ onClose, onCreated }: NewCampaignModalProps) {
  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [refLinks, setRefLinks] = useState<string[]>(['']);

  const toggleChannel = (ch: string) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleCreate = () => {
    const t = title.trim();
    if (!t) return;
    onCreated(t, selectedChannels);
    onClose();
  };

  const addLink = () => setRefLinks((prev) => [...prev, '']);
  const removeLink = (i: number) => setRefLinks((prev) => prev.filter((_, idx) => idx !== i));
  const updateLink = (i: number, val: string) =>
    setRefLinks((prev) => prev.map((l, idx) => (idx === i ? val : l)));

  const labelStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    color: '#888',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '0.5rem',
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: '#141414',
    border: '1px solid #2a2a2e',
    borderRadius: 6,
    color: '#e0e0e0',
    padding: '8px 12px',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: "'Inter', sans-serif",
  };

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      {/* Dialog */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 580,
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#1a1a1e',
          border: '1px solid #2a2a2e',
          borderRadius: 10,
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>
            New Campaign
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1, padding: '2px 6px' }}
          >
            ×
          </button>
        </div>

        {/* Campaign Name */}
        <div>
          <label style={labelStyle}>Campaign Name</label>
          <input
            autoFocus
            type="text"
            placeholder="e.g. Spring 2026 Launch"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') onClose(); }}
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#44B2FF')}
            onBlur={(e) => (e.target.style.borderColor = '#2a2a2e')}
          />
        </div>

        {/* Brief */}
        <div>
          <label style={labelStyle}>Brief</label>
          <textarea
            placeholder="e.g. Q2 product launch campaign targeting independent sales reps on LinkedIn and Instagram..."
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            style={{
              ...inputStyle,
              minHeight: 100,
              resize: 'vertical',
              lineHeight: '1.5',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#44B2FF')}
            onBlur={(e) => (e.target.style.borderColor = '#2a2a2e')}
          />
        </div>

        {/* Resources */}
        <div>
          <label style={labelStyle}>Resources</label>
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{
              fontSize: '0.7rem',
              color: '#555',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              Reference Links
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {refLinks.map((link, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="url"
                  placeholder="https://..."
                  value={link}
                  onChange={(e) => updateLink(i, e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={(e) => (e.target.style.borderColor = '#44B2FF')}
                  onBlur={(e) => (e.target.style.borderColor = '#2a2a2e')}
                />
                <button
                  onClick={() => removeLink(i)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#555',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '0 4px',
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#888')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addLink}
            style={{
              background: 'none',
              border: 'none',
              color: '#44B2FF',
              cursor: 'pointer',
              fontSize: '0.8rem',
              padding: '0.375rem 0',
              marginTop: '0.25rem',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            + Add Link
          </button>
        </div>

        {/* Attach Files */}
        <div>
          <label style={labelStyle}>Attach Files</label>
          <button
            style={{
              padding: '7px 16px',
              background: 'none',
              border: '1px solid #2a2a2e',
              borderRadius: 6,
              color: '#888',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.04em',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#44B2FF')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2a2a2e')}
          >
            Choose Files
          </button>
        </div>

        {/* Fluid DAM */}
        <div>
          <label style={labelStyle}>Fluid DAM</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
            <span style={{ color: '#4ade80', fontSize: '0.85rem' }}>✦</span>
            <span style={{ color: '#4ade80', fontSize: '0.8rem', fontWeight: 500 }}>Fluid DAM connected</span>
          </div>
          <button
            style={{
              width: '100%',
              padding: '9px 16px',
              backgroundColor: '#44B2FF',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Browse Assets
          </button>
        </div>

        {/* Channel selection (styled to match) */}
        <div>
          <label style={labelStyle}>Channels</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {CHANNEL_OPTIONS.map((ch) => {
              const active = selectedChannels.includes(ch.value);
              return (
                <button
                  key={ch.value}
                  onClick={() => toggleChannel(ch.value)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 5,
                    border: `1px solid ${active ? '#44B2FF' : '#2a2a2e'}`,
                    backgroundColor: active ? 'rgba(68,178,255,0.12)' : 'transparent',
                    color: active ? '#44B2FF' : '#666',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {ch.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.25rem' }}>
          <button
            onClick={onClose}
            style={{
              padding: '7px 16px',
              background: 'none',
              border: '1px solid #2a2a2e',
              borderRadius: 6,
              color: '#888',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim()}
            style={{
              padding: '7px 20px',
              backgroundColor: title.trim() ? '#44B2FF' : '#1a2530',
              border: 'none',
              borderRadius: 6,
              color: title.trim() ? '#fff' : '#444',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: title.trim() ? 'pointer' : 'not-allowed',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              transition: 'background-color 0.15s',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Save Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Filter / Sort bar ----

type SortKey = 'updatedAt' | 'createdAt' | 'title';

interface FilterSortBarProps {
  filterChannel: string;
  onFilterChannel: (ch: string) => void;
  sortKey: SortKey;
  onSort: (key: SortKey) => void;
  channels: string[];
}

function FilterSortBar({ filterChannel, onFilterChannel, sortKey, onSort, channels }: FilterSortBarProps) {
  const allChannels = ['all', ...Array.from(new Set(channels))];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
      {/* Channel filter tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        {allChannels.map((ch) => {
          const active = filterChannel === ch;
          return (
            <button
              key={ch}
              onClick={() => onFilterChannel(ch)}
              style={{
                padding: '4px 12px',
                borderRadius: 5,
                border: `1px solid ${active ? '#44B2FF' : 'transparent'}`,
                backgroundColor: active ? 'rgba(68,178,255,0.1)' : 'transparent',
                color: active ? '#44B2FF' : '#555',
                fontSize: '0.7rem',
                fontWeight: active ? 600 : 500,
                cursor: 'pointer',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                transition: 'all 0.12s',
                fontFamily: "'Inter', sans-serif",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = '#888'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = '#555'; }}
            >
              {ch}
            </button>
          );
        })}
      </div>

      {/* Sort controls */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <span style={{ fontSize: '0.7rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Sort:</span>
        {[
          { key: 'updatedAt' as SortKey, label: 'Updated' },
          { key: 'createdAt' as SortKey, label: 'Created' },
          { key: 'title' as SortKey, label: 'Name' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onSort(key)}
            style={{
              padding: '4px 10px',
              borderRadius: 5,
              border: `1px solid ${sortKey === key ? '#44B2FF' : 'transparent'}`,
              backgroundColor: sortKey === key ? 'rgba(68,178,255,0.1)' : 'transparent',
              color: sortKey === key ? '#44B2FF' : '#555',
              fontSize: '0.7rem',
              fontWeight: sortKey === key ? 600 : 500,
              cursor: 'pointer',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.08em',
              transition: 'all 0.12s',
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => { if (sortKey !== key) e.currentTarget.style.color = '#888'; }}
            onMouseLeave={(e) => { if (sortKey !== key) e.currentTarget.style.color = '#555'; }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- CampaignDashboard ----

/**
 * Top-level campaign list view.
 * Uses DrillDownGrid with filter/sort controls and a "New Campaign" action.
 */
export function CampaignDashboard() {
  const campaigns = useCampaignStore((s) => s.campaigns);
  const loading = useCampaignStore((s) => s.loading);
  const fetchCampaigns = useCampaignStore((s) => s.fetchCampaigns);
  const navigateToCampaign = useCampaignStore((s) => s.navigateToCampaign);

  const [showNewModal, setShowNewModal] = useState(false);
  const [filterChannel, setFilterChannel] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');

  // Load campaigns on mount
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Collect all channels across campaigns for the filter bar
  const allChannels = campaigns.flatMap((c) => c.channels);

  // Filter
  const filtered = filterChannel === 'all'
    ? campaigns
    : campaigns.filter((c) => c.channels.includes(filterChannel));

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === 'title') return a.title.localeCompare(b.title);
    return b[sortKey] - a[sortKey]; // numeric desc (most recent first)
  });

  // Map to DrillDownGrid items
  const items: DrillDownItem<Campaign>[] = sorted.map((c) => ({
    id: c.id,
    title: c.title,
    subtitle: c.channels.join(', ') || 'No channels',
    data: c,
  }));

  /**
   * renderPreview for campaigns:
   * At campaign level we don't have asset HTML loaded yet.
   * Return null — the grid will show a "No preview" placeholder.
   * A future plan can wire in representative asset thumbnails.
   */
  const renderPreview = (_item: DrillDownItem<Campaign>): PreviewDescriptor | null => null;

  const handleSelect = (item: DrillDownItem<Campaign>) => {
    navigateToCampaign(item.id);
  };

  const handleCreated = (title: string, channels: string[]) => {
    // POST to API — fire-and-forget, then refresh
    fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, channels }),
    })
      .then(() => fetchCampaigns())
      .catch((err) => console.error('[CampaignDashboard] Failed to create campaign:', err));
  };

  const headerActions = (
    <>
      <FilterSortBar
        filterChannel={filterChannel}
        onFilterChannel={setFilterChannel}
        sortKey={sortKey}
        onSort={setSortKey}
        channels={allChannels}
      />
      <button
        onClick={() => setShowNewModal(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '5px 14px',
          backgroundColor: '#44B2FF',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: '0.7rem',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Campaign
      </button>
    </>
  );

  const emptyState = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: 300,
      gap: '1rem',
      color: '#555',
    }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
           stroke="#2a2a2e" strokeWidth="1.25" strokeLinecap="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
      <div style={{ fontSize: '0.9rem', color: '#555' }}>No campaigns yet</div>
      <div style={{ fontSize: '0.8rem', color: '#3a3a3a' }}>
        Create one to get started
      </div>
      <button
        onClick={() => setShowNewModal(true)}
        style={{
          marginTop: '0.5rem',
          padding: '7px 18px',
          backgroundColor: '#44B2FF',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: '0.7rem',
          fontWeight: 600,
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        + New Campaign
      </button>
    </div>
  );

  if (loading && campaigns.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#555',
        fontSize: '0.9rem',
        gap: '0.75rem',
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          border: '2px solid #2a2a2e', borderTopColor: '#44B2FF',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Loading campaigns...
      </div>
    );
  }

  return (
    <>
      <DrillDownGrid
        items={items}
        renderPreview={renderPreview}
        onSelect={handleSelect}
        emptyState={emptyState}
        title="Campaigns"
        headerActions={headerActions}
      />

      {showNewModal && (
        <NewCampaignModal
          onClose={() => setShowNewModal(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
