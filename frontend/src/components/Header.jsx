import React from 'react';
import { BrandMark } from './BrandMark';

export function Header({ backendStatus = 'online' }) {
  return (
    <header className="relative z-10 w-full bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)] border-b border-surface-container">
      <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-space-sm">
            <BrandMark className="h-8 w-8 rounded-lg" />
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold">
              PulseGrid
            </span>
          </div>

          <div className="h-4 w-px bg-surface-container-high hidden sm:block"></div>

          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider hidden sm:inline-block font-medium">
            Supply Chain Management
          </span>
        </div>

        {/* Status badges */}
        <div className="flex items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-surface-container-high/60 bg-surface-container-low px-3 py-1.5 text-sm font-medium text-on-surface-variant">
            <span className={`h-2 w-2 rounded-full ${backendStatus === 'online' ? 'bg-tertiary' : backendStatus === 'offline' ? 'bg-error' : 'bg-outline animate-pulse'}`} />
            <span>{backendStatus === 'online' ? 'API connected' : backendStatus === 'offline' ? 'API unavailable' : 'Connecting to API'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
