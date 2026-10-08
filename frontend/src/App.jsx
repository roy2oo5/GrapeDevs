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
import { ApiTester } from './components/ApiTester';
import { fetchHealth } from './services/api';

export default function App() {
  const [appMode, setAppMode] = useState('dashboard'); // 'dashboard' | 'auth'
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentFacility, setCurrentFacility] = useState('MedCare General Hospital');
  const [backendStatus, setBackendStatus] = useState('checking');

  // Modals & Interactive States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [actionModal, setActionModal] = useState(null); // { type, payload }
  const [authModalType, setAuthModalType] = useState(null); // 'reset' | 'sso' | 'terms' | 'telemetry' | 'diagnostics'
  const [user, setUser] = useState({ name: 'MedCare General Hospital', role: 'Regional Redistribution Hub' });

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
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser({
      name: userData.facility || 'MedCare General Hospital',
      role: userData.role || 'Regional Redistribution Hub'
    });
    setAppMode('dashboard');
    addToast(`Authenticated as ${userData.email}. Welcome to Executive Command Console.`);
  };

  const handleCommandAction = (action) => {
    if (action === 'open-search') {
      setIsSearchOpen(true);
    } else if (action === 'emergency-request') {
      setActionModal({ type: 'emergency-request' });
    } else if (action === 'run-optimizer') {
      addToast('Constrained Optimization Engine executed across all facilities. Transfers recommended.');
      setCurrentView('transfers-and-logistics');
    } else {
      setActionModal({ type: 'take-action', payload: action });
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
            onOpenAuth={() => setAppMode('auth')}
          />

          {/* Main Layout Area */}
          <div className="pl-72 flex-1 flex flex-col min-w-0">
            {/* Top Fixed Header */}
            <DashboardHeader
              currentFacility={currentFacility}
              onFacilityChange={(name) => {
                setCurrentFacility(name);
                addToast(`Operating hospital switched to ${name}`);
              }}
              onOpenSearch={() => setIsSearchOpen(true)}
              user={user}
            />

            {/* Main Content Area */}
            <main className="w-full pt-16 min-h-screen bg-surface px-space-lg py-space-lg flex-1">
              {currentView === 'dashboard' ? (
                <DashboardView
                  onToast={addToast}
                  onOpenEmergencyModal={() => setActionModal({ type: 'emergency-request' })}
                  onTakeAction={(sku) => setActionModal({ type: 'take-action', payload: sku })}
                />
              ) : (
                <SecondaryViews
                  view={currentView}
                  onToast={addToast}
                  onOpenEmergencyModal={() => setActionModal({ type: 'emergency-request' })}
                />
              )}
            </main>
          </div>
        </div>
      ) : (
        /* VIEW 2: ACCESS CONTROL TOWER (AUTH & FACILITY ONBOARDING) */
        <div className="min-h-screen flex flex-col justify-between relative">
          <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_50%_18%,rgba(0,123,185,0.07)_0%,transparent_65%)]"></div>

          <Header backendStatus={backendStatus} />

          <main className="relative z-10 w-full flex-1 flex items-center justify-center px-margin-mobile lg:px-margin py-space-xl">
            <div className="flex flex-col w-full items-center justify-center py-space-sm sm:py-space-md">
              <div className="w-full max-w-5xl bg-surface-container-lowest rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,97,148,0.12),0_8px_24px_-4px_rgba(25,28,30,0.04)] overflow-hidden flex flex-col lg:flex-row relative border border-surface-container-high/40">
                <LeftTelemetryPanel />
                <AuthFormPanel
                  onResetKeyClick={() => setAuthModalType('reset')}
                  onSSOClick={() => setAuthModalType('sso')}
                  onLoginSuccess={handleLoginSuccess}
                  onRegisterSuccess={(data) => {
                    addToast(`Onboarding request submitted for ${data.facility}. Pending verification.`);
                  }}
                />
              </div>

              {/* Quick Jump back to Dashboard */}
              <button
                type="button"
                onClick={() => setAppMode('dashboard')}
                className="mt-4 text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Jump to Executive Dashboard Console</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
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
        onConfirm={(msg) => addToast(msg)}
      />

      {/* Auth Modals (Terms, Cryptographic Audit, Reset Key, SSO) */}
      <InfoModal
        modalType={authModalType !== 'diagnostics' ? authModalType : null}
        onClose={() => setAuthModalType(null)}
      />

      {/* Developer API Diagnostics Drawer */}
      {authModalType === 'diagnostics' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-surface-container flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">developer_board</span>
                <span className="font-semibold text-on-surface">FastAPI Backend Diagnostics</span>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalType(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-surface-container-lowest">
              <ApiTester onStatusChange={setBackendStatus} />
            </div>
          </div>
        </div>
      )}

      {/* Floating Diagnostics Button */}
      <button
        type="button"
        onClick={() => setAuthModalType('diagnostics')}
        title="Open Backend API Diagnostics"
        className="fixed bottom-4 right-4 z-40 px-3 py-1.5 rounded-full bg-surface-container text-secondary hover:text-on-surface hover:bg-surface-container-high border border-surface-container-high/80 text-xs font-medium shadow-md transition-all flex items-center gap-1.5 cursor-pointer opacity-70 hover:opacity-100"
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: backendStatus === 'online' ? '#00855b' : '#ba1a1a' }}
        ></span>
        <span>API Diagnostics</span>
      </button>

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
