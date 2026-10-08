import React, { useState, useEffect } from 'react';

export function CommandPalette({ isOpen, onClose, onSelectAction }) {
  const [query, setQuery] = useState('');

  const items = [
    { type: 'SKU', label: 'Paracetamol 500mg IV Infusion', detail: '140 vials • 1.7d depletion • CRITICAL', action: 'Paracetamol 500mg IV' },
    { type: 'SKU', label: 'Propofol 10mg/mL Injectable Emulsion', detail: '28 ampoules • 0.9d runout • SURGERY QUOTA', action: 'Propofol 10mg/mL' },
    { type: 'SKU', label: 'Ceftriaxone 1g Powder for Injection', detail: '310 vials • 4.1d buffer • PO Pending', action: 'Ceftriaxone 1g Injection' },
    { type: 'SKU', label: 'Enoxaparin Sodium 40mg/0.4mL', detail: '150 syringes • Outbound swap to Valley Trauma', action: 'Enoxaparin Sodium' },
    { type: 'SKU', label: 'Sevoflurane Inhalation Liquid (250ml)', detail: '24 bottles • Inbound borrow from St. Jude', action: 'Sevoflurane 250ml' },
    { type: 'ACTION', label: 'Emergency Stock Request', detail: 'Initiate emergency clinical borrow under MOU', action: 'emergency-request' },
    { type: 'ACTION', label: 'Export Audit Telemetry', detail: 'Download signed FIPS 140-3 cryptographic logs', action: 'export-audit' },
    { type: 'ACTION', label: 'Run AI Redistribution Optimizer', detail: 'Execute linear solver across all 6 facilities', action: 'run-optimizer' },
    { type: 'FACILITY', label: 'St. Jude Regional Hospital', detail: 'Node 03 • 600u Paracetamol Available', action: 'node-stjude' },
    { type: 'FACILITY', label: 'Valley Trauma Center', detail: 'Node 02 • 420u Propofol Surplus', action: 'node-valley' },
  ];

  const filtered = items.filter(
    (i) =>
      i.label.toLowerCase().includes(query.toLowerCase()) ||
      i.detail.toLowerCase().includes(query.toLowerCase()) ||
      i.type.toLowerCase().includes(query.toLowerCase())
  );

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else if (onSelectAction) onSelectAction('open-search');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onSelectAction]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="p-4 border-b border-surface-container flex items-center gap-3 bg-surface-container-low/40">
          <span className="material-symbols-outlined text-primary text-[22px]">search</span>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a SKU name, facility, or system command..."
            className="flex-1 bg-transparent text-on-surface font-body-lg text-body-lg focus:outline-none placeholder:text-outline"
          />
          <span className="px-2 py-0.5 rounded bg-surface-container-high text-[11px] font-mono text-outline">
            ESC to close
          </span>
        </div>

        {/* Results List */}
        <div className="p-2 max-h-96 overflow-y-auto divide-y divide-surface-container/40">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSelectAction(item.action);
                  onClose();
                }}
                className="w-full p-3 text-left hover:bg-surface-container-low rounded-xl flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      item.type === 'SKU'
                        ? 'bg-primary-fixed text-on-primary-fixed-variant'
                        : item.type === 'ACTION'
                        ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                        : 'bg-secondary-container text-on-secondary-fixed'
                    }`}
                  >
                    {item.type}
                  </span>
                  <div>
                    <div className="font-semibold text-on-surface text-sm group-hover:text-primary transition-colors">
                      {item.label}
                    </div>
                    <div className="text-secondary text-xs">{item.detail}</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-[18px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            ))
          ) : (
            <div className="p-8 text-center text-secondary text-sm">
              No matching SKUs or telemetry records found for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
