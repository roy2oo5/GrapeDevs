import React, { useState } from 'react';

export function DashboardHeader({
  currentHospital = 'MedCare General Hospital',
  onOpenSearch,
  onOpenNotifications,
  unreadCount = 3,
  user = { name: 'Dr. Sarah Lin', role: 'Chief Pharmacy Logistics' }
}) {
  const [showNotifications, setShowNotifications] = useState(false);

  const notificationItems = [
    {
      id: 1,
      title: 'Paracetamol IV Depletion Alert',
      desc: '1.7 days remaining. St. Jude borrow protocol ready.',
      time: '6m ago',
      urgent: true
    },
    {
      id: 2,
      title: 'Valley Trauma Enoxaparin Transfer',
      desc: 'Outgoing transit unit queued for pickup.',
      time: '24m ago',
      urgent: false
    },
    {
      id: 3,
      title: 'New Epidemic Signal in Cluster 3',
      desc: 'RSV admission spikes detected (+28%).',
      time: '1h ago',
      urgent: true
    }
  ];

  return (
    <header className="fixed top-0 left-72 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-space-lg border-b border-surface-container/60">
      {/* Active Hospital Display */}
      <div className="relative flex items-center gap-space-md">
        <div className="flex items-center gap-space-sm px-space-md py-1.5 rounded-xl bg-surface-container-low border border-surface-container-high/60">
          <span className="material-symbols-outlined text-primary text-[20px]">local_hospital</span>
          <div className="flex flex-col text-left">
            <span className="font-label-md text-label-md text-on-surface leading-tight font-semibold">
              {currentHospital}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant leading-none">
              Surplus Redistribution Terminal
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
            <span className="font-body-sm text-body-sm text-outline truncate flex-1 text-left">
              Cmd+K // Search SKU, alert...
            </span>
            <span className="px-1.5 py-0.5 rounded bg-surface-container-high font-label-sm text-label-sm text-outline font-mono">
              ⌘K
            </span>
          </button>
        </div>

        {/* Notifications Icon with Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-surface-container-low hover:bg-surface-container-high transition-colors text-on-surface-variant cursor-pointer border border-surface-container-high/40"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-error text-on-error font-label-sm text-label-sm flex items-center justify-center leading-none text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container-high p-3 z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                <span className="font-label-md text-label-md text-on-surface font-semibold">
                  Active Alerts ({notificationItems.length})
                </span>
                <span className="text-[11px] text-primary cursor-pointer hover:underline">
                  Mark all read
                </span>
              </div>
              <div className="flex flex-col gap-2 pt-2 max-h-72 overflow-y-auto">
                {notificationItems.map((n) => (
                  <div
                    key={n.id}
                    className="p-2 rounded-xl bg-surface-container-low text-xs space-y-1 hover:bg-surface-container transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-on-surface flex items-center gap-1">
                        {n.urgent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>
                        )}
                        {n.title}
                      </span>
                      <span className="text-[10px] text-outline">{n.time}</span>
                    </div>
                    <div className="text-secondary text-[11px] leading-snug">{n.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Info */}
        <div className="flex items-center pl-space-sm border-l border-surface-container-high/60">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm" title="User Profile">
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}
