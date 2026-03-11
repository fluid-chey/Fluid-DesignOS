import { useEffect } from 'react';
import { SessionSidebar } from './components/SessionSidebar';
import { VariationGrid } from './components/VariationGrid';
import { useSessionStore } from './store/sessions';
import { useFileWatcher } from './hooks/useFileWatcher';

export function App() {
  const refreshSessions = useSessionStore((s) => s.refreshSessions);
  const activeSessionData = useSessionStore((s) => s.activeSessionData);
  const loading = useSessionStore((s) => s.loading);

  // Auto-refresh on filesystem changes
  useFileWatcher();

  // Initial session load
  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: '#1a1a2e',
      color: '#e0e0e0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <SessionSidebar />

      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Top bar */}
        <header style={{
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid #2a2a3e',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          minHeight: 48,
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 600,
            color: '#fff',
          }}>
            Fluid Design OS
          </h1>
          {activeSessionData && (
            <span style={{ fontSize: '0.8rem', color: '#666' }}>
              {activeSessionData.id}
            </span>
          )}
        </header>

        {/* Main content area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
        }}>
          {loading && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              Loading session...
            </div>
          )}

          {!loading && !activeSessionData && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#555',
              fontSize: '0.95rem',
            }}>
              Select a session to view variations
            </div>
          )}

          {!loading && activeSessionData && (
            <VariationGrid
              variations={activeSessionData.variations}
              platform={activeSessionData.lineage.platform}
              statuses={activeSessionData.annotations?.statuses ?? {}}
            />
          )}
        </div>
      </main>
    </div>
  );
}
