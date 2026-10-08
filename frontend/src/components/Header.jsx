import React from 'react';

export function Header({ backendStatus = 'online' }) {
  return (
    <header className="relative z-10 w-full bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)] border-b border-surface-container">
      <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-space-sm">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm ring-1 ring-primary/20">
              <span className="material-symbols-outlined text-[20px]">hub</span>
            </div>
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold">
              PulseGrid
            </span>
          </div>

          <div className="h-4 w-px bg-surface-container-high hidden sm:block"></div>

          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider hidden sm:inline-block font-medium">
            Supply Intelligence Control Tower
          </span>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-space-sm sm:gap-space-md">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low text-tertiary font-label-sm text-label-sm border border-tertiary/15">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
            <span className="font-semibold tracking-wide">
              {backendStatus === 'online' ? 'ENCRYPTED NODE' : 'LOCAL NODE'}
            </span>
          </div>

          <div className="hidden md:inline-flex items-center px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm tracking-wide font-medium">
            v2.4.8-SEC
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
            <span className="material-symbols-outlined text-[14px]">verified_user</span>
            <span>CLEARANCE LEVEL 4</span>
          </div>
        </div>
      </div>
    </header>
  );
}
