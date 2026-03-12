import { useEffect, useState, useCallback, useRef } from 'react';
import { AppShell } from './components/AppShell';
import { PromptSidebar } from './components/PromptSidebar';
import { ContentEditor } from './components/ContentEditor';
import { CampaignDashboard } from './components/CampaignDashboard';
import { DrillDownGrid, type DrillDownItem, type PreviewDescriptor } from './components/DrillDownGrid';
import { TemplateGallery } from './components/TemplateGallery';
import { TemplateCustomizer } from './components/TemplateCustomizer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useCampaignStore } from './store/campaign';
import { useEditorStore } from './store/editor';
import { useFileWatcher } from './hooks/useFileWatcher';
import type { Asset, Frame, Iteration } from './lib/campaign-types';
import { TEMPLATE_METADATA, type TemplateMetadata } from './lib/template-configs';

type CreationFlow = null | 'gallery' | 'customizer';

export function App() {
  const currentView = useCampaignStore((s) => s.currentView);
  const activeCampaignId = useCampaignStore((s) => s.activeCampaignId);
  const activeAssetId = useCampaignStore((s) => s.activeAssetId);
  const activeFrameId = useCampaignStore((s) => s.activeFrameId);
  const activeIterationId = useCampaignStore((s) => s.activeIterationId);
  const assets = useCampaignStore((s) => s.assets);
  const frames = useCampaignStore((s) => s.frames);
  const iterations = useCampaignStore((s) => s.iterations);
  const loading = useCampaignStore((s) => s.loading);
  const navigateToCampaign = useCampaignStore((s) => s.navigateToCampaign);
  const navigateToAsset = useCampaignStore((s) => s.navigateToAsset);
  const navigateToFrame = useCampaignStore((s) => s.navigateToFrame);
  const selectIteration = useCampaignStore((s) => s.selectIteration);
  const setRightSidebarOpen = useCampaignStore((s) => s.setRightSidebarOpen);
  const fetchCampaigns = useCampaignStore((s) => s.fetchCampaigns);

  const selectedIterationId = useEditorStore((s) => s.selectedIterationId);

  // Template creation flow state
  const [creationFlow, setCreationFlow] = useState<CreationFlow>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMetadata | null>(null);

  // Ref to the active iteration's iframe element for ContentEditor
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Auto-refresh on filesystem changes (campaign-aware)
  useFileWatcher();

  // Initial data load
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // When an iteration is selected, open the right sidebar
  useEffect(() => {
    if (activeIterationId) {
      setRightSidebarOpen(true);
    }
  }, [activeIterationId, setRightSidebarOpen]);

  // ── Iteration selection handler ──────────────────────────────────────────
  const handleSelectIteration = useCallback(
    (item: DrillDownItem<Iteration>) => {
      selectIteration(item.id);
    },
    [selectIteration]
  );

  // ── Navigation handlers ──────────────────────────────────────────────────
  const handleSelectAsset = useCallback(
    (item: DrillDownItem<Asset>) => {
      navigateToAsset(item.id);
    },
    [navigateToAsset]
  );

  const handleSelectFrame = useCallback(
    (item: DrillDownItem<Frame>) => {
      navigateToFrame(item.id);
    },
    [navigateToFrame]
  );

  // ── Template creation flow ───────────────────────────────────────────────
  const handleNewAsset = useCallback(() => {
    setCreationFlow('gallery');
    setSelectedTemplate(null);
  }, []);

  const handleSelectTemplate = useCallback((template: TemplateMetadata) => {
    setSelectedTemplate(template);
    setCreationFlow('customizer');
  }, []);

  const handleCloseCreationFlow = useCallback(() => {
    setCreationFlow(null);
    setSelectedTemplate(null);
  }, []);

  const handleBackToGallery = useCallback(() => {
    setSelectedTemplate(null);
    setCreationFlow('gallery');
  }, []);

  // Called by TemplateCustomizer after successfully creating an asset
  const handleAssetCreated = useCallback(
    (campaignId: string) => {
      handleCloseCreationFlow();
      navigateToCampaign(campaignId);
    },
    [handleCloseCreationFlow, navigateToCampaign]
  );

  // ── Derive active iteration object ──────────────────────────────────────
  const activeIteration = activeIterationId
    ? iterations.find((it) => it.id === activeIterationId) ?? null
    : null;

  // ── DrillDownGrid renderPreview helpers ─────────────────────────────────
  // For assets: no preview HTML at this level
  const renderAssetPreview = (_item: DrillDownItem<Asset>): PreviewDescriptor | null => null;

  // For frames: no preview HTML at frame level either
  const renderFramePreview = (_item: DrillDownItem<Frame>): PreviewDescriptor | null => null;

  // For iterations: the iteration has htmlPath; we can serve via API
  // The DrillDownGrid shows a placeholder when no preview returned
  const renderIterationPreview = (_item: DrillDownItem<Iteration>): PreviewDescriptor | null => null;

  // ── Map store data to DrillDownItem arrays ───────────────────────────────
  const assetItems: DrillDownItem<Asset>[] = assets.map((a) => ({
    id: a.id,
    title: a.title,
    subtitle: a.assetType,
    data: a,
  }));

  const frameItems: DrillDownItem<Frame>[] = frames.map((f) => ({
    id: f.id,
    title: `Frame ${f.frameIndex + 1}`,
    data: f,
  }));

  const iterationItems: DrillDownItem<Iteration>[] = iterations.map((it) => ({
    id: it.id,
    title: `Iteration ${it.iterationIndex + 1}`,
    subtitle: it.source === 'template' ? `Template: ${it.templateId ?? ''}` : 'AI Generated',
    data: it,
  }));

  // ── Main content area (switches based on currentView) ───────────────────
  const renderMainContent = () => {
    if (loading && currentView !== 'dashboard') {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#555',
          fontSize: '0.9rem',
          gap: '0.75rem',
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            border: '2px solid #2a2a3e', borderTopColor: '#3b82f6',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Loading...
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <CampaignDashboard />;

      case 'campaign':
        return (
          <DrillDownGrid
            items={assetItems}
            renderPreview={renderAssetPreview}
            onSelect={handleSelectAsset}
            title="Assets"
            emptyState={
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '100%', minHeight: 300,
                gap: '1rem', color: '#444',
              }}>
                <div style={{ fontSize: '0.9rem' }}>No assets yet</div>
                <div style={{ fontSize: '0.8rem', color: '#333' }}>
                  Click &quot;New Asset&quot; to create one
                </div>
              </div>
            }
          />
        );

      case 'asset':
        return (
          <DrillDownGrid
            items={frameItems}
            renderPreview={renderFramePreview}
            onSelect={handleSelectFrame}
            title="Frames"
          />
        );

      case 'frame':
        return (
          <DrillDownGrid
            items={iterationItems}
            renderPreview={renderIterationPreview}
            onSelect={handleSelectIteration}
            title="Iterations"
            emptyState={
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '100%', minHeight: 300,
                gap: '0.75rem', color: '#444',
              }}>
                <div style={{ fontSize: '0.9rem' }}>No iterations yet</div>
                <div style={{ fontSize: '0.8rem', color: '#333' }}>
                  Iterations appear here once generated
                </div>
              </div>
            }
          />
        );

      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <AppShell
        leftSidebar={<PromptSidebar />}
        rightSidebar={
          <ContentEditor
            iteration={activeIteration}
            iframeEl={iframeRef.current}
          />
        }
        onNewAsset={activeCampaignId ? handleNewAsset : undefined}
      >
        {renderMainContent()}
      </AppShell>

      {/* Template creation flow — modal overlay */}
      {creationFlow !== null && (
        <TemplateCreationModal
          flow={creationFlow}
          selectedTemplate={selectedTemplate}
          activeCampaignId={activeCampaignId}
          onSelectTemplate={handleSelectTemplate}
          onBack={handleBackToGallery}
          onClose={handleCloseCreationFlow}
          onAssetCreated={handleAssetCreated}
        />
      )}
    </ErrorBoundary>
  );
}

// ─── Template Creation Modal ─────────────────────────────────────────────────

interface TemplateCreationModalProps {
  flow: 'gallery' | 'customizer';
  selectedTemplate: TemplateMetadata | null;
  activeCampaignId: string | null;
  onSelectTemplate: (t: TemplateMetadata) => void;
  onBack: () => void;
  onClose: () => void;
  onAssetCreated: (campaignId: string) => void;
}

function TemplateCreationModal({
  flow,
  selectedTemplate,
  activeCampaignId,
  onSelectTemplate,
  onBack,
  onClose,
  onAssetCreated,
}: TemplateCreationModalProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      {/* Dialog panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: flow === 'gallery' ? '75vw' : '85vw',
          maxWidth: flow === 'gallery' ? 900 : 1100,
          maxHeight: '85vh',
          backgroundColor: '#0f0f1a',
          border: '1px solid #2a2a3e',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 16px 64px rgba(0,0,0,0.8)',
        }}
      >
        {/* Modal header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #1e1e30',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#fff' }}>
            {flow === 'gallery' ? 'Choose a Template' : 'Customize Template'}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#555',
              cursor: 'pointer',
              fontSize: '1.25rem',
              lineHeight: 1,
              padding: '0 4px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#aaa')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
          >
            ×
          </button>
        </div>

        {/* Modal body */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {flow === 'gallery' && (
            <TemplateGallery
              onSelectTemplate={onSelectTemplate}
              mode="modal"
            />
          )}
          {flow === 'customizer' && selectedTemplate && activeCampaignId && (
            <TemplateCustomizer
              template={selectedTemplate}
              campaignId={activeCampaignId}
              onBack={onBack}
              onCreated={onAssetCreated}
            />
          )}
          {flow === 'customizer' && !activeCampaignId && (
            <div style={{ padding: '2rem', color: '#555', textAlign: 'center' }}>
              No campaign selected. Please navigate to a campaign first.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
