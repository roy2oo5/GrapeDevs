import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LeftTelemetryPanel } from './components/LeftTelemetryPanel';
import { AuthFormPanel } from './components/AuthFormPanel';
import { InfoModal } from './components/InfoModal';
import { ApiTester } from './components/ApiTester';
import { fetchHealth } from './services/api';

export default function App() {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [modalType, setModalType] = useState(null); // 'reset' | 'sso' | 'terms' | 'audit' | 'telemetry' | 'diagnostics' | null
  const [activeSession, setActiveSession] = useState(null);

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
    setActiveSession(userData);
  };

  const handleRegisterSuccess = (registrationData) => {
    console.log('Registration submitted:', registrationData);
  };

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface min-h-screen flex flex-col justify-between selection:bg-primary-fixed selection:text-on-primary-fixed relative">
      {/* Ambient Radial Background Gradient */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_50%_18%,rgba(0,123,185,0.07)_0%,transparent_65%)]"></div>

      {/* Header */}
      <Header backendStatus={backendStatus} />

      {/* Main Content Area */}
      <main className="relative z-10 w-full flex-1 flex items-center justify-center px-margin-mobile lg:px-margin py-space-xl">
        <div className="flex flex-col w-full items-center justify-center py-space-sm sm:py-space-md">
          {/* Master Split Container (max-w-5xl, elevation, responsive layout) */}
          <div className="w-full max-w-5xl bg-surface-container-lowest rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,97,148,0.12),0_8px_24px_-4px_rgba(25,28,30,0.04)] overflow-hidden flex flex-col lg:flex-row relative border border-surface-container-high/40">
            {/* Left Clinical Brand & Intelligence Telemetry Panel */}
            <LeftTelemetryPanel />

            {/* Right Interactive Form Panel */}
            <AuthFormPanel
              onResetKeyClick={() => setModalType('reset')}
              onSSOClick={() => setModalType('sso')}
              onLoginSuccess={handleLoginSuccess}
              onRegisterSuccess={handleRegisterSuccess}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer onOpenModal={(type) => setModalType(type)} />

      {/* Informative Modals */}
      <InfoModal modalType={modalType !== 'diagnostics' ? modalType : null} onClose={() => setModalType(null)} />

      {/* Optional Developer API Diagnostics Modal */}
      {modalType === 'diagnostics' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-surface-container flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">developer_board</span>
                <span className="font-semibold text-on-surface">FastAPI Backend Diagnostics &amp; Smoke Test</span>
              </div>
              <button
                type="button"
                onClick={() => setModalType(null)}
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

      {/* Floating Diagnostics Tool for Dev Convenience */}
      <button
        type="button"
        onClick={() => setModalType('diagnostics')}
        title="Open Backend API Diagnostics"
        className="fixed bottom-4 right-4 z-40 px-3 py-1.5 rounded-full bg-surface-container text-secondary hover:text-on-surface hover:bg-surface-container-high border border-surface-container-high/80 text-xs font-medium shadow-md transition-all flex items-center gap-1.5 cursor-pointer opacity-70 hover:opacity-100"
      >
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: backendStatus === 'online' ? '#00855b' : '#ba1a1a' }}></span>
        <span>API Diagnostics</span>
      </button>
    </div>
  );
}
