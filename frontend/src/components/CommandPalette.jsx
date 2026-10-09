import React, { useState, useEffect } from 'react';
import { searchHospitalData } from '../services/api';

export function CommandPalette({ isOpen, onClose, onSelectAction }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const items = [
    { type: 'ACTION', label: 'Emergency Stock Request', detail: 'Initiate emergency clinical borrow under MOU', action: 'emergency-request' },
    { type: 'ACTION', label: 'Open Inventory', detail: 'Search and manage hospital stock', action: 'open-inventory' },
    { type: 'ACTION', label: 'Open Transfers', detail: 'View sending and received transfers', action: 'open-transfers' },
    { type: 'ACTION', label: 'Open Forecasting', detail: 'Review demand and shortage risk', action: 'open-forecasting' },
  ];

  useEffect(() => {
    if (!isOpen || query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      setSearchError('');
      return undefined;
    }
    let active = true;
    setSearching(true);
    setSearchError('');
    const timer = window.setTimeout(() => {
      searchHospitalData(query)
        .then((response) => {
          if (active) setResults(response.results);
        })
        .catch((error) => {
          if (active) setSearchError(error.message || 'Could not search hospital data.');
        })
        .finally(() => {
          if (active) setSearching(false);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isOpen, query]);

  const filteredActions = items.filter((item) => (
    item.label.toLowerCase().includes(query.toLowerCase())
    || item.detail.toLowerCase().includes(query.toLowerCase())
  ));

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
            placeholder="Search medicine, transfers, MOUs, or hospitals..."
            className="flex-1 bg-transparent text-on-surface font-body-lg text-body-lg focus:outline-none placeholder:text-outline"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Results List */}
        <div className="p-2 max-h-96 overflow-y-auto divide-y divide-surface-container/40">
          {query.trim().length < 2 && filteredActions.length > 0 && filteredActions.map((item) => (
            <button
              key={item.action}
              type="button"
              onClick={() => {
                onSelectAction(item.action);
                onClose();
              }}
              className="w-full p-3 text-left hover:bg-surface-container-low rounded-xl flex items-center justify-between transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-tertiary-fixed text-on-tertiary-fixed-variant">ACTION</span>
                <div>
                  <div className="font-semibold text-on-surface text-sm group-hover:text-primary">{item.label}</div>
                  <div className="text-secondary text-xs">{item.detail}</div>
                </div>
              </div>
            </button>
          ))}
          {query.trim().length >= 2 && results.length > 0 && results.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                type="button"
                onClick={() => {
                  onSelectAction('search-result', item);
                  onClose();
                }}
                className="w-full p-3 text-left hover:bg-surface-container-low rounded-xl flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      'bg-primary-fixed text-on-primary-fixed-variant'
                    }`}
                  >
                    {item.type}
                  </span>
                  <div>
                    <div className="font-semibold text-on-surface text-sm group-hover:text-primary transition-colors">
                      {item.title}
                    </div>
                    <div className="text-secondary text-xs">{item.detail}</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-[18px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            ))}
          {searching && <p className="p-4 text-center text-sm text-on-surface-variant">Searching hospital data...</p>}
          {searchError && <p role="alert" className="p-4 text-center text-sm text-error">{searchError}</p>}
          {query.trim().length >= 2 && !searching && !searchError && results.length === 0 && (
            <div className="p-8 text-center text-secondary text-sm">
              No matching hospital records found for "{query}".
            </div>
          )}
          {query.trim().length < 2 && filteredActions.length === 0 && (
            <div className="p-8 text-center text-secondary text-sm">Type at least 2 characters to search hospital data.</div>
          )}
        </div>
      </div>
    </div>
  );
}
