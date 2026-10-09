import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardView } from './components/DashboardView';
import { SecondaryViews } from './components/SecondaryViews';
import { CommandPalette } from './components/CommandPalette';
import { ActionModals } from './components/ActionModals';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LeftTelemetryPanel } from './components/LeftTelemetryPanel';
import { AuthFormPanel } from './components/AuthFormPanel';
import { InfoModal } from './components/InfoModal';
import {
  clearAccessToken,
  createTransfer,
  fetchCurrentHospital,
  fetchDashboard,
  fetchHealth,
  fetchInventory,
  fetchTransfers,
  exportHospitalData,
  getAccessToken,
  openRealtimeConnection,
  updateTransferStatus,
} from './services/api';

export default function App() {
  const [appMode, setAppMode] = useState('auth'); // 'dashboard' | 'auth'
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentHospital, setCurrentHospital] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [dashboardData, setDashboardData] = useState({});
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [hospitalTransfers, setHospitalTransfers] = useState([]);
  const [hospitalInventory, setHospitalInventory] = useState([]);
  const [dashboardError, setDashboardError] = useState('');
  const [syncVersion, setSyncVersion] = useState(0);

  // Modals & Interactive States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [actionModal, setActionModal] = useState(null); // { type, payload }
  const [authModalType, setAuthModalType] = useState(null);
  const [user, setUser] = useState(null);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = (message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Probe backend health status
  useEffect(() => {
    let isMounted = true;
    fetchHealth()
      .then(() => {
        if (isMounted) setBackendStatus('online');
      })
      .catch(() => {
        if (isMounted) setBackendStatus('offline');
      });
    const token = getAccessToken();
    if (token) {
      fetchCurrentHospital()
        .then((hospital) => {
          if (!isMounted) return;
          setCurrentHospital(hospital.name);
          setUser({ name: hospital.name, role: 'Hospital Administrator' });
          setAppMode('dashboard');
        })
        .catch(() => clearAccessToken());
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const loadHospitalDashboard = async () => {
    setDashboardLoading(true);
    try {
      const [summary, transfers, inventory] = await Promise.all([fetchDashboard(), fetchTransfers(), fetchInventory()]);
      setDashboardData(summary);
      setHospitalTransfers(transfers);
      setHospitalInventory(inventory);
      setDashboardError('');
    } catch (error) {
      setDashboardError(error.message || 'Could not load hospital data.');
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (appMode === 'dashboard') loadHospitalDashboard();
  }, [appMode]);

  useEffect(() => {
    if (appMode !== 'dashboard' || !getAccessToken()) return undefined;
    let reconnectTimer;
    let disposed = false;
    const connect = () => {
      const websocket = openRealtimeConnection({
        onMessage: () => {
          setSyncVersion((version) => version + 1);
          loadHospitalDashboard();
        },
        onClose: () => {
          if (!disposed) reconnectTimer = window.setTimeout(connect, 2000);
        },
      });
      return websocket;
    };
    const websocket = connect();
    return () => {
      disposed = true;
      window.clearTimeout(reconnectTimer);
      websocket?.close();
    };
  }, [appMode]);

  const handleLoginSuccess = (session) => {
    setCurrentHospital(session.hospital_name);
    setUser({
      name: session.hospital_name,
      role: session.role || 'Hospital Administrator',
    });
    setAppMode('dashboard');
    addToast(`Signed in to ${session.hospital_name}.`);
  };

  const handleHospitalUpdated = (hospital) => {
    setCurrentHospital(hospital.name);
    setUser((currentUser) => ({ ...currentUser, name: hospital.administrator_name }));
  };

  const handleSignOut = () => {
    clearAccessToken();
    setUser(null);
    setCurrentHospital('');
    setDashboardData({});
    setDashboardLoading(true);
    setHospitalTransfers([]);
    setHospitalInventory([]);
    setAppMode('auth');
  };

  const handleActionConfirm = async (message, transferPayload) => {
    if (!transferPayload) {
      addToast(message);
      return;
    }
    try {
      const transfer = await createTransfer(transferPayload);
      addToast(`Transfer request ${transfer.id} created.`);
      await loadHospitalDashboard();
    } catch (error) {
      addToast(`Transfer request failed: ${error.message}`);
    }
  };

  const [transferDraft, setTransferDraft] = useState(null);

  const handleCommandAction = (action, payload) => {
    if (action === 'open-search') {
      setIsSearchOpen(true);
    } else if (action === 'emergency-request') {
      setActionModal({ type: 'emergency-request' });
    } else if (action === 'open-inventory' || action === 'open-transfers' || action === 'open-forecasting') {
      setCurrentView({
        'open-inventory': 'inventory-and-skus',
        'open-transfers': 'transfers-and-logistics',
        'open-forecasting': 'outbreak-surveillance',
      }[action]);
    } else if (action === 'search-result' && payload?.view) {
      if (payload.type === 'Inventory') {
        setTransferDraft({
          sku_name: payload.title,
          sku_code: payload.sku_code,
          unit: payload.unit,
        });
        setCurrentView('transfers-and-logistics');
      } else {
        setCurrentView(payload.view);
      }
    } else {
      setActionModal({ type: 'take-action', payload });
    }
  };

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface min-h-screen antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* VIEW 1: EXECUTIVE COMMAND CONSOLE (DASHBOARD) */}
      {appMode === 'dashboard' ? (
        <div className="flex min-h-screen">
          {/* Fixed Left Navigation Sidebar */}
          <Sidebar
            currentView={currentView}
            onViewChange={(viewId) => {
              setCurrentView(viewId);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAuth={handleSignOut}
          />

          {/* Main Layout Area */}
          <div className="pl-72 flex-1 flex flex-col min-w-0">
            {/* Top Fixed Header */}
            <DashboardHeader
              currentHospital={currentHospital}
              onOpenSearch={() => setIsSearchOpen(true)}
              onExportData={async () => {
                try {
                  await exportHospitalData();
                  addToast('Hospital data exported as JSON.');
                } catch (error) {
                  addToast(`Export failed: ${error.message}`);
                }
              }}
              user={user}
            />

            {/* Main Content Area */}
            <main className="w-full pt-[5.25rem] min-h-screen bg-surface px-space-lg pb-space-xl flex-1">
              {dashboardError && (
                <div role="alert" className="mb-4 rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 text-sm text-on-error-container">
                  {dashboardError}
                </div>
              )}
              {currentView === 'dashboard' ? (
                <DashboardView
                  onToast={addToast}
                  dashboardData={dashboardData}
                  isLoading={dashboardLoading}
                  inventoryBatches={hospitalInventory}
                  pendingTransfers={hospitalTransfers.filter((transfer) => transfer.status === 'requested')}
                  onResolveTransfer={async (transferId, status, approvedQuantity) => {
                    await updateTransferStatus(transferId, status, approvedQuantity);
                    await loadHospitalDashboard();
                  }}
                  onOpenEmergencyModal={() => setActionModal({ type: 'emergency-request' })}
                  onNavigate={setCurrentView}
                  onFindSupply={(batch) => {
                    setTransferDraft({
                      sku_name: batch.sku_name,
                      sku_code: batch.sku_code,
                      unit: batch.unit,
                    });
                    setCurrentView('transfers-and-logistics');
                  }}
                />
              ) : (
                <SecondaryViews
                  key={syncVersion}
                  view={currentView}
                  onToast={addToast}
                  onOpenEmergencyModal={() => setActionModal({ type: 'emergency-request' })}
                  onNavigate={setCurrentView}
                  transferDraft={transferDraft}
                  onHospitalUpdated={handleHospitalUpdated}
                  onTransferDraftConsumed={() => setTransferDraft(null)}
                  onFindSupply={(batch) => {
                    setTransferDraft({
                      sku_name: batch.sku_name,
                      sku_code: batch.sku_code,
                      unit: batch.unit,
                    });
                    setCurrentView('transfers-and-logistics');
                  }}
                />
              )}
            </main>
          </div>
        </div>
      ) : (
        /* VIEW 2: HOSPITAL ACCESS */
        <div className="min-h-screen flex flex-col justify-between relative">
          <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_50%_18%,rgba(0,123,185,0.07)_0%,transparent_65%)]"></div>

          <Header backendStatus={backendStatus} />

          <main className="relative z-10 w-full flex-1 flex items-center justify-center px-margin-mobile lg:px-margin py-space-xl">
            <div className="flex flex-col w-full items-center justify-center py-space-sm sm:py-space-md">
              <div className="w-full max-w-5xl bg-surface-container-lowest rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,97,148,0.12),0_8px_24px_-4px_rgba(25,28,30,0.04)] overflow-hidden flex flex-col lg:flex-row relative border border-surface-container-high/40">
                <LeftTelemetryPanel />
                <AuthFormPanel
                  onLoginSuccess={handleLoginSuccess}
                  onRegisterSuccess={(data) => addToast(`${data.hospital_name} is ready for hospital login.`)}
                />
              </div>

            </div>
          </main>

          <Footer onOpenModal={(type) => setAuthModalType(type)} />
        </div>
      )}

      {/* Global Quick Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectAction={handleCommandAction}
      />

      {/* Action Modals for Dashboard */}
      <ActionModals
        modalData={actionModal}
        onClose={() => setActionModal(null)}
        onConfirm={handleActionConfirm}
      />

      {/* Terms */}
      <InfoModal
        modalType={authModalType !== 'diagnostics' ? authModalType : null}
        onClose={() => setAuthModalType(null)}
      />

      {/* Interactive Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="px-4 py-2.5 rounded-xl bg-on-surface text-surface font-label-md text-label-md shadow-xl flex items-center gap-2 pointer-events-auto transition-all animate-fadeIn"
          >
            <span className="material-symbols-outlined text-[16px] text-tertiary-fixed">check_circle</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
