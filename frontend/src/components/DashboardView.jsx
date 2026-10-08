import React, { useState } from 'react';

export function DashboardView({ onToast, onOpenEmergencyModal, onOpenAuditModal, onTakeAction }) {
  const [timeframe, setTimeframe] = useState('live'); // 'live' | '24h' | '7d'
  const [attentionFilter, setAttentionFilter] = useState('all'); // 'all' | 'critical' | 'risk'

  // Approvals State (allows dismissing/approving in real-time)
  const [approvals, setApprovals] = useState([
    {
      id: 'approval-card-1',
      type: 'OUTBOUND TRANSFER',
      typeColor: 'bg-primary-fixed text-on-primary-fixed-variant',
      badge: 'Exp: 28 min',
      badgeColor: 'text-error',
      badgeIcon: 'timer',
      sku: 'Enoxaparin Sodium 40mg/0.4mL',
      from: 'MedCare General',
      to: 'Valley Trauma Center',
      details: '150 Pre-filled Syringes • Expiring in 38 days. Valley Trauma declared surge protocol after transit accident.'
    },
    {
      id: 'approval-card-2',
      type: 'INBOUND BORROW',
      typeColor: 'bg-tertiary-fixed text-on-tertiary-fixed',
      badge: 'Dispatched',
      badgeColor: 'text-primary',
      badgeIcon: 'local_shipping',
      sku: 'Sevoflurane Inhalation Liquid (250ml)',
      from: 'St. Jude Regional Hospital',
      to: 'MedCare General',
      details: '24 Bottles • Responding to OR Suite 4 volume spike. ETA at MedCare Dock 2: 34 minutes.'
    },
    {
      id: 'approval-card-3',
      type: 'OUTBOUND REBALANCE',
      typeColor: 'bg-surface-container-high text-on-surface-variant',
      badge: 'Routine Routing',
      badgeColor: 'text-outline',
      badgeIcon: null,
      sku: 'N95 Surgical Respirator Masks (Box/50)',
      from: 'MedCare General',
      to: 'North District Community Clinic',
      details: '40 Boxes • Network surplus rebalancing quota (+180% local target). Non-critical timing.'
    }
  ]);

  const [dismissingId, setDismissingId] = useState(null);

  const handleTimeframeChange = (tf) => {
    setTimeframe(tf);
    const label = tf === 'live' ? 'Real-time Live' : tf === '24h' ? '24h Predictive Model' : '7-Day Outbreak Model';
    if (onToast) onToast(`Timeframe updated: ${label}`);
  };

  const handleResolveApproval = (id, action) => {
    setDismissingId(id);
    setTimeout(() => {
      setApprovals((prev) => prev.filter((item) => item.id !== id));
      setDismissingId(null);
      if (onToast) {
        onToast(action === 'approved' ? 'MOU Transfer Signed & Dispatched' : 'Transfer Request Terminated');
      }
    }, 280);
  };

  const handleSyncTelemetry = () => {
    if (onToast) onToast('District 4 Telemetry Synced with 5 Node Centers (14ms)');
  };

  // Filter attention cards
  const attentionCards = [
    {
      id: 'attn-1',
      category: 'critical',
      sku: 'Paracetamol 500mg IV Infusion (100ml)',
      code: 'SKU #IV-PARA-500',
      tag: 'CRITICAL: Stockout < Lead Time',
      badge: 'BORROW PROTOCOL INITIATED',
      stock: '140 vials',
      burn: '82 units / day',
      depletion: '1.7 Days (Lead: 4d)',
      alertText: 'Local Viral Epidemic Cluster identified (+28% hospital admissions). Algorithmic forecast projects absolute zero-inventory at MedCare Depot in 41 hours.',
      partnerOffer: 'Route Emergency Borrow via St. Jude Regional (Available: 600u)',
      actionText: 'Take Action'
    },
    {
      id: 'attn-2',
      category: 'critical',
      sku: 'Propofol 10mg/mL Injectable Emulsion (20ml)',
      code: 'SKU #ANES-PROP-10M',
      tag: 'CRITICAL: Stock Quota Breached',
      badge: 'MOU DISPATCH READY',
      stock: '28 ampoules',
      burn: 'Hospital Demand Spiked 3.4x',
      depletion: '0.9 Days (Safe: 5d)',
      alertText: 'Critical hospital safety threshold violated. Valley Trauma Center reports a verified surplus of 420 units within active mutual assistance framework.',
      partnerOffer: 'Auto-Match Transit Dispatch',
      actionText: 'Take Action'
    },
    {
      id: 'attn-3',
      category: 'risk',
      sku: 'Ceftriaxone 1g Powder for Injection',
      code: 'SKU #ANTI-CEFT-1G',
      tag: 'REORDER: Threshold Alert',
      badge: 'PREDICTIVE SURGE',
      stock: '310 vials',
      burn: '4.1 Days Buffer',
      depletion: 'Supplier Lead: 3.5d',
      alertText: 'Safety stock buffer near threshold. Automated Replenishment Order #PO-8812 is staged and ready for hospital sign-off.',
      partnerOffer: null,
      actionText: 'Authorize Order #PO-8812'
    }
  ];

  const filteredAttention = attentionCards.filter((card) => {
    if (attentionFilter === 'all') return true;
    return card.category === attentionFilter;
  });

  return (
    <div className="flex flex-col w-full">
      {/* AMBIENT TOP SCATTER / CLINICAL GLOW LAYER */}
      <div className="relative w-full overflow-hidden pb-space-xl">
        <div className="absolute -top-24 right-1/4 w-96 h-96 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-tertiary-fixed/15 rounded-full blur-2xl pointer-events-none -z-10"></div>

        {/* 1. DASHBOARD HEADER & QUICK FILTERS */}
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-lg mb-space-xl">
          <div className="flex flex-col max-w-3xl">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm font-semibold tracking-wider uppercase border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                MedCare General Hospital
              </span>
              <span className="font-label-sm text-label-sm text-outline font-mono">
                TX-HASH: 90F2-SURGE-OCT
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
              Executive Command Console
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-1 leading-relaxed">
              Real-time epidemiological surge tracking and multi-facility supply rebalancing across Regional District 4.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-space-md">
            {/* Timeframe Segmented Control */}
            <div className="inline-flex p-1 rounded-xl bg-surface-container-high shadow-inner">
              <button
                type="button"
                onClick={() => handleTimeframeChange('live')}
                className={`timeframe-btn px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all cursor-pointer ${
                  timeframe === 'live'
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface font-medium'
                }`}
              >
                Real-time Live
              </button>
              <button
                type="button"
                onClick={() => handleTimeframeChange('24h')}
                className={`timeframe-btn px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all cursor-pointer ${
                  timeframe === '24h'
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface font-medium'
                }`}
              >
                24h Forecast
              </button>
              <button
                type="button"
                onClick={() => handleTimeframeChange('7d')}
                className={`timeframe-btn px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all cursor-pointer ${
                  timeframe === '7d'
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface font-medium'
                }`}
              >
                7-Day Model
              </button>
            </div>

            {/* Primary Action: Emergency Stock Request */}
            <button
              type="button"
              onClick={onOpenEmergencyModal}
              className="inline-flex items-center gap-2 px-space-md py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md transition-all shadow-md hover:shadow-lg active:scale-95 font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_alert</span>
              <span>Emergency Stock Request</span>
            </button>
          </div>
        </header>

        {/* 2. TOP ROW (KPI CONTROL CARDS - 4 Grid) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md mb-space-xl">
          {/* Card 1: Total Surplus Items in Network */}
          <div className="relative bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden border border-surface-container-high/40">
            <div className="flex items-center justify-between mb-space-md">
              <span className="font-label-md text-label-md text-on-surface-variant font-semibold uppercase tracking-wider">
                Total Surplus Items in Network
              </span>
              <span className="p-2 rounded-lg bg-surface-container-low text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">inventory_2</span>
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
                  1,420 Items
                </span>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-tertiary-fixed/30 text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  1.24M Units
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Available for redistribution across 6 network hospital nodes
              </p>
            </div>
            <div className="mt-space-md pt-space-xs">
              <svg className="w-full h-8 text-primary overflow-visible" fill="none" viewBox="0 0 160 30">
                <path
                  d="M0 24 L24 20 L50 26 L80 14 L110 18 L136 6 L160 9"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                ></path>
                <path
                  d="M0 24 L24 20 L50 26 L80 14 L110 18 L136 6 L160 9 V30 H0 Z"
                  fill="currentColor"
                  fillOpacity="0.08"
                ></path>
                <circle cx="160" cy="9" fill="currentColor" r="3"></circle>
              </svg>
            </div>
          </div>

          {/* Card 2: Items Nearing Expiry (30 days) */}
          <div className="relative bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden border border-surface-container-high/40">
            <div className="flex items-center justify-between mb-space-md">
              <span className="font-label-md text-label-md text-on-surface-variant font-semibold uppercase tracking-wider">
                Items Nearing Expiry (30 days)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                Exp: MM/YYYY
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-headline-xl text-headline-xl font-bold tracking-tight text-amber-700">
                  45,800 Units
                </span>
                <span className="font-label-sm text-label-sm text-outline font-medium">14 Batches</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Flagged for zero-wastage peer redistribution prior to expiration
              </p>
            </div>
            <div className="mt-space-md flex flex-col gap-1.5">
              <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant font-medium">
                <span>Network Redistribution Rate</span>
                <span className="font-semibold text-on-surface">88% Saved</span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden flex">
                <div className="h-full bg-tertiary" style={{ width: '88%' }}></div>
                <div className="h-full bg-amber-500" style={{ width: '12%' }}></div>
              </div>
            </div>
          </div>

          {/* Card 3: Active Transfer Requests */}
          <div className="relative bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden border border-surface-container-high/40">
            <div className="flex items-center justify-between mb-space-md">
              <span className="font-label-md text-label-md text-on-surface-variant font-semibold uppercase tracking-wider">
                Active Transfer Requests
              </span>
              <span className="px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm font-semibold">
                Peer-to-Peer
              </span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-headline-xl text-headline-xl text-primary font-bold tracking-tight">
                  18 Requests
                </span>
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Active peer handoff &amp; redistribution workflows in progress
              </p>
            </div>
            <div className="mt-space-md p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between text-on-surface-variant">
              <span className="font-body-sm text-body-sm font-medium">Urgency Status</span>
              <span className="font-label-sm text-label-sm text-error font-semibold uppercase tracking-wider">
                3 Critical
              </span>
            </div>
          </div>

          {/* Card 4: Pending MOUs */}
          <div className="relative bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden border border-surface-container-high/40">
            <div className="flex items-center justify-between mb-space-md">
              <span className="font-label-md text-label-md text-on-surface-variant font-semibold uppercase tracking-wider">
                Pending MOUs
              </span>
              <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed/40 text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">
                Governance
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
                  5 Pending MOUs
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Awaiting clinical director sign-off &amp; mutual agreement terms
              </p>
            </div>
            <div className="mt-space-md flex items-center justify-between">
              <div className="flex -space-x-2 overflow-hidden">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold shadow-xs ring-2 ring-surface-container-lowest" title="St. Jude Regional">
                  SJ
                </span>
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold shadow-xs ring-2 ring-surface-container-lowest" title="Valley Trauma Center">
                  VT
                </span>
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold shadow-xs ring-2 ring-surface-container-lowest" title="Apex Memorial">
                  AM
                </span>
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-bold shadow-xs ring-2 ring-surface-container-lowest" title="North District Clinic">
                  ND
                </span>
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm font-bold shadow-xs ring-2 ring-surface-container-lowest" title="Harbor Health">
                  HH
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-primary font-semibold">
                District 4 Network
              </span>
            </div>
          </div>
        </section>

        {/* 3. MIDDLE SECTION (60/40 SPLIT GRID) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* LEFT COLUMN (60% width -> 7 cols on lg) : REQUIRES ATTENTION */}
          <section className="lg:col-span-7 flex flex-col gap-space-md">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-1">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
                    Requires Attention
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">
                    {filteredAttention.length} Actionable Warnings
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Algorithmic bio-surveillance alerts prioritizing lead time thresholds and regional outbreak spikes.
                </p>
              </div>

              {/* Filter Switcher */}
              <div className="flex items-center gap-1 bg-surface-container-high p-1 rounded-lg self-start sm:self-auto shadow-inner">
                <button
                  type="button"
                  onClick={() => setAttentionFilter('all')}
                  className={`attn-filter-btn px-2.5 py-1 rounded-md font-label-sm text-label-sm transition-all cursor-pointer ${
                    attentionFilter === 'all'
                      ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  All ({attentionCards.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAttentionFilter('critical')}
                  className={`attn-filter-btn px-2.5 py-1 rounded-md font-label-sm text-label-sm transition-all cursor-pointer ${
                    attentionFilter === 'critical'
                      ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Stockouts (2)
                </button>
                <button
                  type="button"
                  onClick={() => setAttentionFilter('risk')}
                  className={`attn-filter-btn px-2.5 py-1 rounded-md font-label-sm text-label-sm transition-all cursor-pointer ${
                    attentionFilter === 'risk'
                      ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Expiry (1)
                </button>
              </div>
            </div>

            {/* Alert Items Stack */}
            <div className="flex flex-col gap-space-md">
              {filteredAttention.map((alert) => (
                <article
                  key={alert.id}
                  className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col gap-space-md border border-surface-container-high/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold flex items-center gap-1 ${
                          alert.category === 'critical'
                            ? 'bg-error-container text-on-error-container'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            alert.category === 'critical' ? 'bg-error' : 'bg-amber-600'
                          }`}
                        ></span>
                        {alert.tag}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">
                        {alert.badge}
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-outline font-mono">
                      {alert.code}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      {alert.sku}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 p-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm border border-surface-container-high/40">
                      <div>
                        <span className="text-on-surface-variant block text-[11px] uppercase tracking-wider font-semibold">
                          Current Stock
                        </span>
                        <span className="font-semibold text-on-surface">{alert.stock}</span>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block text-[11px] uppercase tracking-wider font-semibold">
                          Burn Velocity
                        </span>
                        <span className={`font-semibold ${alert.category === 'critical' ? 'text-error' : 'text-amber-700'}`}>
                          {alert.burn}
                        </span>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-on-surface-variant block text-[11px] uppercase tracking-wider font-semibold">
                          Depletion Clock
                        </span>
                        <span className={`font-semibold ${alert.category === 'critical' ? 'text-error' : 'text-on-surface'}`}>
                          {alert.depletion}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-space-sm rounded-lg flex items-start gap-2.5 ${
                      alert.category === 'critical'
                        ? 'bg-error-container/40 text-on-error-container border border-error-container'
                        : 'bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] mt-0.5 ${
                        alert.category === 'critical' ? 'text-error' : 'text-outline'
                      }`}
                    >
                      {alert.category === 'critical' ? 'warning' : 'info'}
                    </span>
                    <p className="font-body-sm text-body-sm leading-snug">{alert.alertText}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pt-1 border-t border-surface-container/60">
                    {alert.partnerOffer ? (
                      <button
                        type="button"
                        onClick={() => onTakeAction && onTakeAction(alert.sku)}
                        className="inline-flex items-center gap-1 text-primary hover:text-primary-container font-label-sm text-label-sm font-semibold group cursor-pointer text-left"
                      >
                        <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-0.5">
                          hub
                        </span>
                        <span>{alert.partnerOffer}</span>
                      </button>
                    ) : (
                      <span className="font-label-sm text-label-sm text-outline">
                        Generated by AI Auto-Order Gateway
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onTakeAction && onTakeAction(alert.sku)}
                        className={`px-space-md py-2 rounded-xl font-label-md text-label-md transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                          alert.category === 'critical'
                            ? 'bg-primary hover:bg-primary-container text-on-primary'
                            : 'bg-surface-container-high hover:bg-surface-variant text-on-surface'
                        }`}
                      >
                        <span>{alert.actionText}</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* RIGHT COLUMN (40% width -> 5 cols on lg) : PENDING APPROVALS QUEUE */}
          <section className="lg:col-span-5 flex flex-col gap-space-md">
            {/* Section Header */}
            <div className="flex items-center justify-between pb-1">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
                    Pending Approvals
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">
                    {approvals.length} Sign-Offs
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Inbound and outbound clinical supply swaps under emergency MOU protocols.
                </p>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
                title="Filter Queue"
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
              </button>
            </div>

            {/* Approvals List Cards */}
            <div className="flex flex-col gap-space-sm">
              {approvals.map((item) => (
                <div
                  key={item.id}
                  className={`bg-surface-container-lowest p-space-md rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col gap-space-sm border border-surface-container-high/40 ${
                    dismissingId === item.id ? 'opacity-0 translate-x-5' : 'opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${item.typeColor}`}>
                      {item.type}
                    </span>
                    <span className={`font-label-sm text-label-sm font-medium flex items-center gap-1 ${item.badgeColor}`}>
                      {item.badgeIcon && (
                        <span className="material-symbols-outlined text-[14px]">{item.badgeIcon}</span>
                      )}
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-label-lg text-label-lg text-on-surface font-bold">{item.sku}</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                      <span className="font-medium text-on-surface">{item.from}</span>
                      <span className="material-symbols-outlined text-[14px] text-outline">arrow_right_alt</span>
                      <span className="font-medium text-primary">{item.to}</span>
                    </p>
                  </div>

                  <div className="p-2 rounded-lg bg-surface-container-low text-on-surface-variant font-body-sm text-body-sm leading-relaxed border border-surface-container-high/40">
                    {item.details}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-surface-container/60">
                    <button
                      type="button"
                      onClick={() => handleResolveApproval(item.id, 'rejected')}
                      className="px-3 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-error-container/50 text-error font-label-sm text-label-sm transition-colors cursor-pointer font-medium"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolveApproval(item.id, 'approved')}
                      className="px-4 py-1.5 rounded-lg bg-tertiary-container hover:bg-tertiary text-on-tertiary font-label-sm text-label-sm transition-all shadow-xs flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      <span className="material-symbols-outlined text-[16px]">check</span>
                      <span>Accept Transfer</span>
                    </button>
                  </div>
                </div>
              ))}

              {approvals.length === 0 && (
                <div className="p-8 text-center bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant text-secondary text-sm">
                  <span className="material-symbols-outlined text-[28px] text-tertiary mb-1 block">
                    check_circle
                  </span>
                  All regional MOU approvals and clinical swaps have been reconciled.
                </div>
              )}
            </div>

            {/* Ledger Compliance Audit Strip */}
            <div className="p-space-sm rounded-xl bg-surface-container-low text-on-surface-variant flex items-center gap-2.5 border border-surface-container-high/50">
              <span className="material-symbols-outlined text-[20px] text-primary shrink-0">verified</span>
              <span className="font-body-sm text-body-sm leading-tight text-outline">
                All approvals cryptographically signed to District Health Audit Ledger (FIPS 140-3 validated).
              </span>
            </div>
          </section>
        </div>

        {/* 4. BOTTOM TELEMETRY STATUS BAR */}
        <footer className="mt-space-xl p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col md:flex-row items-center justify-between gap-space-md border border-surface-container-high/40">
          <div className="flex items-center gap-space-md flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse"></span>
              <span className="font-label-sm text-label-sm text-on-surface font-semibold uppercase tracking-wider">
                MOU Network Live Telemetry
              </span>
            </div>
            <span className="hidden sm:inline text-outline">•</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Last Rebalancing Pulse: <strong className="text-on-surface">32 seconds ago</strong>
            </span>
            <span className="hidden sm:inline text-outline">•</span>
            <span className="font-body-sm text-body-sm text-outline">
              Surveillance Engine: <strong className="text-on-surface">Epi-Forecast v4.1</strong>
            </span>
          </div>

          <div className="flex items-center gap-space-md text-on-surface-variant">
            <div className="flex items-center gap-1 font-mono text-body-sm">
              <span className="text-outline">Sync Status:</span>
              <span className="text-tertiary font-semibold">OPTIMAL (99.98%)</span>
            </div>
            <button
              type="button"
              onClick={handleSyncTelemetry}
              className="p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors text-on-surface cursor-pointer border border-surface-container-high/60"
              title="Force Telemetry Sync"
            >
              <span className="material-symbols-outlined text-[18px]">sync</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
