import React from 'react';
import { BrandMark } from './BrandMark';

export function Sidebar({ currentView, onViewChange, onOpenAuth }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
    { id: 'inventory-and-skus', label: 'Inventory', icon: 'inventory_2' },
    { id: 'forecast-data', label: 'Record usage', icon: 'database' },
    { id: 'outbreak-surveillance', label: 'Medicine forecast', icon: 'coronavirus' },
    { id: 'transfers-and-logistics', label: 'Transfers', icon: 'local_shipping' },
    { id: 'mou-partners', label: 'Surplus Marketplace', icon: 'storefront' },
    { id: 'hospital-network', label: 'Hospital agreements', icon: 'handshake' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between border-r border-surface-container">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 px-space-lg flex items-center gap-space-sm bg-surface-container-low/40 border-b border-surface-container/60">
          <BrandMark />
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-on-surface leading-tight font-semibold">
              PulseGrid
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">
              Supply Chain Management
            </span>
          </div>
        </div>

        {/* Navigation Group */}
        <div className="px-space-md py-space-sm">
          <div className="px-space-sm py-space-xs">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">
              Hospital tools
            </span>
          </div>

          <nav className="flex flex-col gap-space-xs mt-space-xs">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onViewChange(item.id)}
                  className={`flex items-center gap-space-sm px-space-md py-2.5 rounded-xl transition-all cursor-pointer text-left w-full ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container font-headline-sm font-semibold shadow-[0_2px_10px_rgba(0,123,185,0.25)]'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span className="font-label-lg text-label-lg">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer & Telemetry Strip */}
      <div className="p-space-md flex flex-col gap-space-sm bg-surface-container-lowest border-t border-surface-container/60">
        <button
          type="button"
          onClick={() => onViewChange('system-settings')}
          className={`flex items-center gap-space-sm px-space-md py-2 rounded-xl transition-colors cursor-pointer w-full text-left ${
            currentView === 'system-settings'
              ? 'bg-surface-container text-on-surface font-semibold'
              : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">settings</span>
          <span className="font-label-md text-label-md">Settings</span>
        </button>



        {/* Terminal Switcher / Auth Gate */}
        {onOpenAuth && (
          <button
            type="button"
            onClick={onOpenAuth}
            className="text-[11px] text-center text-outline hover:text-primary transition-colors py-1 flex items-center justify-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">lock_reset</span>
            <span>Sign out</span>
          </button>
        )}
      </div>
    </aside>
  );
}
