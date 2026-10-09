import React from 'react';

export function InfoModal({ modalType, onClose }) {
  if (!modalType) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-container flex items-center justify-between bg-surface-container-low/50">
          <div className="flex items-center gap-2 text-primary font-semibold">
            {modalType === 'reset' && (
              <>
                <span className="material-symbols-outlined text-[22px]">key</span>
                <span className="font-headline-sm text-base text-on-surface">Access key help</span>
              </>
            )}
            {modalType === 'sso' && (
              <>
                <span className="material-symbols-outlined text-[22px]">local_hospital</span>
                <span className="font-headline-sm text-base text-on-surface">Single sign-on</span>
              </>
            )}
            {modalType === 'terms' && (
              <>
                <span className="material-symbols-outlined text-[22px]">gavel</span>
                <span className="font-headline-sm text-base text-on-surface">PulseGrid Protocol Terms</span>
              </>
            )}
            {modalType === 'audit' && (
              <>
                <span className="material-symbols-outlined text-[22px]">verified_user</span>
                <span className="font-headline-sm text-base text-on-surface">Audit report</span>
              </>
            )}
            {modalType === 'telemetry' && (
              <>
                <span className="material-symbols-outlined text-[22px]">vital_signs</span>
                <span className="font-headline-sm text-base text-on-surface">System status</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 text-on-surface text-sm space-y-4">
          {modalType === 'reset' && (
            <p className="leading-relaxed text-on-surface-variant">
              Access key recovery is not available here. Contact your hospital administrator for help signing in.
            </p>
          )}

          {modalType === 'sso' && (
            <p className="leading-relaxed text-on-surface-variant">
              Single sign-on is not set up for this hospital. Sign in with your hospital ID and access key instead.
            </p>
          )}

          {modalType === 'terms' && (
            <div className="space-y-3 text-secondary text-xs leading-relaxed max-h-72 overflow-y-auto pr-1">
              <h4 className="font-semibold text-on-surface text-sm">Mutual Aid Redistribution Protocol</h4>
              <p>Use this service to manage medicine stock and coordinate transfers with other hospitals.</p>
              <h4 className="font-semibold text-on-surface text-sm">Privacy &amp; Data Boundary</h4>
              <p>Only enter information needed to manage stock and transfers. Do not enter patient-identifying information.</p>
              <h4 className="font-semibold text-on-surface text-sm">Auditability</h4>
              <p>Follow your hospital’s policies when recording, sending, or accepting stock.</p>
            </div>
          )}

          {modalType === 'audit' && (
            <p className="leading-relaxed text-on-surface-variant">
              An audit report is not available in this view.
            </p>
          )}

          {modalType === 'telemetry' && (
            <p className="leading-relaxed text-on-surface-variant">
              Live system performance details are not available here.
            </p>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-surface-container-low/50 border-t border-surface-container flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-container text-on-surface font-semibold text-xs hover:bg-surface-container-high transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
