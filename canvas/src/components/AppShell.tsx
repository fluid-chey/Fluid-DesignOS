import type { ReactNode } from 'react';
import { useCampaignStore } from '../store/campaign';
import { Breadcrumb } from './Breadcrumb';

interface AppShellProps {
  /**
   * Content for the left sidebar (AI chat / PromptSidebar).
   * Collapses to a chat icon strip.
   */
  leftSidebar?: ReactNode;

  /**
   * Content for the right sidebar (ContentEditor from Plan 06).
   * Closed by default; opens when an iteration is selected or via setRightSidebarOpen.
   */
  rightSidebar?: ReactNode;

  /**
   * Main content area (CampaignDashboard or DrillDownGrid based on currentView).
   */
  children: ReactNode;

  /**
   * Called when the user triggers a "New Asset" flow (e.g., clicking + in the header).
   * Plan 06 (ContentEditor) wires into this callback for the template creation flow.
   */
  onNewAsset?: () => void;
}

const LEFT_SIDEBAR_WIDTH = 280;
const RIGHT_SIDEBAR_WIDTH = 320;
const COLLAPSED_SIDEBAR_WIDTH = 48;

/** Chat icon for collapsed left sidebar */
function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/** Layers icon for collapsed right sidebar */
function LayersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

/** Chevron arrow for sidebar toggle buttons */
function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  const rotate = direction === 'right' ? 0 : 180;
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         style={{ transform: `rotate(${rotate}deg)` }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function AppShell({ leftSidebar, rightSidebar, children, onNewAsset }: AppShellProps) {
  const leftSidebarOpen = useCampaignStore((s) => s.leftSidebarOpen);
  const rightSidebarOpen = useCampaignStore((s) => s.rightSidebarOpen);
  const toggleLeftSidebar = useCampaignStore((s) => s.toggleLeftSidebar);
  const toggleRightSidebar = useCampaignStore((s) => s.toggleRightSidebar);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#0f0f1a',
      color: '#e0e0e0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden',
    }}>
      {/* ---- Header ---- */}
      <header style={{
        height: 52,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0 1.25rem',
        borderBottom: '1px solid #1e1e30',
        backgroundColor: '#0f0f1a',
        zIndex: 10,
      }}>
        {/* App wordmark */}
        <span style={{
          fontSize: '0.9375rem',
          fontWeight: 600,
          color: '#fff',
          letterSpacing: '-0.02em',
          whiteSpace: 'nowrap',
        }}>
          Fluid Design OS
        </span>

        {/* Divider */}
        <div style={{ width: 1, height: 18, backgroundColor: '#2a2a3e', flexShrink: 0 }} />

        {/* Breadcrumb fills remaining header space */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Breadcrumb />
        </div>

        {/* New Asset button */}
        {onNewAsset && (
          <button
            onClick={onNewAsset}
            title="New asset"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '5px 12px',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Asset
          </button>
        )}
      </header>

      {/* ---- Body: left sidebar | main | right sidebar ---- */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Left sidebar */}
        <aside style={{
          width: leftSidebarOpen ? LEFT_SIDEBAR_WIDTH : COLLAPSED_SIDEBAR_WIDTH,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #1e1e30',
          backgroundColor: '#0d0d1a',
          transition: 'width 0.2s ease',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {leftSidebarOpen ? (
            <>
              {/* Left sidebar content */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {leftSidebar}
              </div>
              {/* Collapse toggle — bottom of sidebar */}
              <button
                onClick={toggleLeftSidebar}
                title="Collapse sidebar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  padding: '8px 10px',
                  background: 'none',
                  border: 'none',
                  borderTop: '1px solid #1e1e30',
                  color: '#555',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  gap: '0.25rem',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#888')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
              >
                <ChevronIcon direction="left" />
              </button>
            </>
          ) : (
            /* Icon strip when collapsed */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: '0.75rem',
              gap: '0.5rem',
            }}>
              <button
                onClick={toggleLeftSidebar}
                title="Expand sidebar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  background: 'none',
                  border: '1px solid #2a2a3e',
                  borderRadius: 6,
                  color: '#666',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#aaa')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
              >
                <ChatIcon />
              </button>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {children}
        </main>

        {/* Right sidebar */}
        {rightSidebar && (
          <aside style={{
            width: rightSidebarOpen ? RIGHT_SIDEBAR_WIDTH : COLLAPSED_SIDEBAR_WIDTH,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid #1e1e30',
            backgroundColor: '#0d0d1a',
            transition: 'width 0.2s ease',
            overflow: 'hidden',
          }}>
            {rightSidebarOpen ? (
              <>
                {/* Right sidebar collapse toggle at top */}
                <button
                  onClick={toggleRightSidebar}
                  title="Collapse content editor"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 10px',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid #1e1e30',
                    color: '#555',
                    cursor: 'pointer',
                    gap: '0.375rem',
                    fontSize: '0.75rem',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#888')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
                >
                  <ChevronIcon direction="right" />
                  <span>Close</span>
                </button>
                {/* Right sidebar content */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  {rightSidebar}
                </div>
              </>
            ) : (
              /* Icon strip when collapsed */
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: '0.75rem',
                gap: '0.5rem',
              }}>
                <button
                  onClick={toggleRightSidebar}
                  title="Expand content editor"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    background: 'none',
                    border: '1px solid #2a2a3e',
                    borderRadius: 6,
                    color: '#666',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#aaa')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
                >
                  <LayersIcon />
                </button>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
