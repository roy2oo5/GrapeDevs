import React from 'react';

export function DashboardHeader({
  currentHospital = 'MedCare General Hospital',
  onOpenSearch,
  onExportData
}) {
  return (
    <header className="fixed top-0 left-72 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-space-lg border-b border-surface-container/60">
      {/* Active Hospital Display */}
      <div className="relative flex items-center gap-space-md">
        <div className="flex items-center gap-space-sm px-space-md py-1.5 rounded-xl bg-surface-container-low border border-surface-container-high/60">
          <div className="flex flex-col text-left">
            <span className="font-label-lg text-label-lg text-on-surface leading-tight font-semibold">
              {currentHospital}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-space-md">
        {/* Cmd+K Search Bar */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center gap-space-sm px-space-md py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant w-72 transition-colors cursor-pointer border border-surface-container-high/40"
          >
            <span className="material-symbols-outlined text-[18px] text-outline">search</span>
            <span className="font-body-md text-body-md text-outline truncate flex-1 text-left">
              Search hospital data...
            </span>
            <span className="px-1.5 py-0.5 rounded bg-surface-container-high font-label-md text-label-md text-outline font-mono">
              ⌘K
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={onExportData}
          className="flex h-10 items-center gap-2 rounded-xl border border-surface-container-high/40 bg-surface-container-low px-3 text-base font-semibold text-on-surface-variant hover:bg-surface-container-high"
        >
          <span className="material-symbols-outlined text-[20px]">download</span>
          Export data
        </button>
      </div>
    </header>
  );
}
