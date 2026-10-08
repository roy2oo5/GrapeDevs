import React from 'react';

export function Footer({ onOpenModal }) {
  return (
    <footer className="relative z-10 w-full bg-surface-container-lowest/70 backdrop-blur-md shadow-[0_-1px_6px_rgba(0,0,0,0.02)] border-t border-surface-container">
      <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin py-space-md flex flex-col sm:flex-row items-center justify-between gap-space-sm">
        {/* Compliance Badges */}
        <div className="flex items-center gap-space-sm flex-wrap justify-center sm:justify-start">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-secondary font-label-sm text-label-sm font-medium">
            <span className="material-symbols-outlined text-[13px]">shield</span>
            SOC2 TYPE II
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-secondary font-label-sm text-label-sm font-medium">
            <span className="material-symbols-outlined text-[13px]">medical_services</span>
            HIPAA VERIFIED
          </span>
          <span className="hidden lg:inline text-on-surface-variant font-body-sm text-body-sm">
            • FIPS 140-3 Hardware Boundary
          </span>
        </div>

        {/* Audit Links & Copyright */}
        <div className="flex items-center gap-space-md font-label-sm text-label-sm text-on-surface-variant flex-wrap justify-center sm:justify-end">
          <button
            type="button"
            onClick={() => onOpenModal && onOpenModal('terms')}
            className="hover:text-on-surface transition-colors focus:outline-none cursor-pointer"
          >
            Protocol Terms
          </button>
          <button
            type="button"
            onClick={() => onOpenModal && onOpenModal('audit')}
            className="hover:text-on-surface transition-colors focus:outline-none cursor-pointer"
          >
            Cryptographic Audit
          </button>
          <button
            type="button"
            onClick={() => onOpenModal && onOpenModal('telemetry')}
            className="hover:text-on-surface transition-colors focus:outline-none cursor-pointer"
          >
            Incident Telemetry
          </button>
          <span className="text-outline-variant hidden sm:inline">
            © 2025 PulseGrid Systems
          </span>
        </div>
      </div>
    </footer>
  );
}
