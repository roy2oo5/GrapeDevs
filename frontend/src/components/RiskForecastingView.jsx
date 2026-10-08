import React, { useState } from 'react';

export function RiskForecastingView({ onToast, onOpenEmergencyModal }) {
  const [selectedSKU, setSelectedSKU] = useState('Paracetamol 500mg IV Infusion (100ml) [High Volatility]');
  const [showBayesianBand, setShowBayesianBand] = useState(true);
  const [granularity, setGranularity] = useState('daily'); // 'daily' | 'weekly' | 'batch'
  const [shortageFilter, setShortageFilter] = useState('all'); // 'all' | 'under3' | 'surge'
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationGlow, setSimulationGlow] = useState(false);

  // Modal State for Inter-Hospital MOU Dispatch
  const [mouDialog, setMouDialog] = useState(null); // { title, sku, hospital, route }

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setSimulationGlow(true);
      setTimeout(() => setSimulationGlow(false), 1200);
      if (onToast) onToast('Bayesian MAP fits updated: +34% epidemic cluster demand projection integrated.');
    }, 900);
  };

  const handleOpenBorrow = (sku, hospital) => {
    if (onOpenEmergencyModal) {
      onOpenEmergencyModal();
    } else {
      setMouDialog({
        title: 'Inter-Hospital Shortage Mitigator',
        sku,
        hospital,
        route: 'Direct Hospital Handoff'
      });
    }
  };

  const handleOpenTaker = (lot, med, val) => {
    if (onOpenEmergencyModal) {
      onOpenEmergencyModal();
    } else {
      setMouDialog({
        title: 'Expiry Redistribution Matcher',
        sku: `${med} (${lot})`,
        hospital: `Matched Regional Partner • Stock: ${val}`,
        route: 'Peer Redistribution Protocol'
      });
    }
  };

  const handleConfirmDispatch = () => {
    const sku = mouDialog?.sku;
    setMouDialog(null);
    if (onToast) onToast(`Transfer request token generated for ${sku}. Requisition sent to Regional District 4 Hub.`);
  };

  // Shortage table data
  const shortageData = [
    {
      id: 1,
      sku: 'Paracetamol 500mg IV',
      code: 'SKU-88210 • 100ml Infusion',
      stock: '140 vials',
      stockBar: 'w-1/6 bg-error',
      burn: '98 u/day',
      burnSub: '+28% surge',
      burnColor: 'text-error',
      depletion: '1.4d',
      status: 'Critical',
      statusClass: 'bg-error-container text-on-error-container',
      ping: true,
      actionText: 'Initiate Borrow',
      actionClass: 'bg-error text-on-error hover:opacity-90',
      category: 'under3',
      hospitalMatch: 'St. Jude Health Hub'
    },
    {
      id: 2,
      sku: 'Propofol 10mg/mL',
      code: 'SKU-44109 • 20ml Emulsion',
      stock: '28 amp',
      stockBar: 'w-1/4 bg-primary',
      burn: '11.5 u/day',
      burnSub: 'ICU Steady',
      burnColor: 'text-on-surface-variant',
      depletion: '2.4d',
      status: 'Borrow',
      statusClass: 'bg-secondary-container text-on-secondary-fixed',
      ping: false,
      actionText: 'Route Stock',
      actionClass: 'bg-surface-container-high text-on-surface hover:bg-primary-container hover:text-on-primary-container',
      category: 'under3',
      hospitalMatch: 'Valley Trauma Center'
    },
    {
      id: 3,
      sku: 'Ceftriaxone 1g Powder',
      code: 'SKU-11902 • Vial Injection',
      stock: '310 vials',
      stockBar: 'w-2/5 bg-secondary',
      burn: '72 u/day',
      burnSub: '+15% surge',
      burnColor: 'text-error',
      depletion: '4.3d',
      status: 'Reorder',
      statusClass: 'bg-surface-container-high text-on-surface-variant',
      ping: false,
      actionText: 'PO Staged',
      actionClass: 'bg-surface-container-low text-on-surface hover:bg-surface-container-high',
      category: 'surge',
      hospitalMatch: 'Automated Supplier Gateway'
    },
    {
      id: 4,
      sku: 'Epinephrine 1mg/mL',
      code: 'SKU-33201 • Auto-Injector',
      stock: '85 units',
      stockBar: 'w-3/5 bg-tertiary',
      burn: '14 u/day',
      burnSub: 'Baseline',
      burnColor: 'text-on-surface-variant',
      depletion: '6.0d',
      status: 'Normal',
      statusClass: 'bg-tertiary-fixed/40 text-on-tertiary-fixed-variant',
      ping: false,
      actionText: 'Monitor',
      actionClass: 'bg-surface-container-low text-outline hover:text-on-surface',
      category: 'normal',
      hospitalMatch: 'Internal Buffer Adequate'
    }
  ];

  const filteredShortages = shortageData.filter((item) => {
    if (shortageFilter === 'all') return true;
    if (shortageFilter === 'under3') return item.category === 'under3';
    if (shortageFilter === 'surge') return item.category === 'surge';
    return true;
  });

  // Expiry table data
  const expiryData = [
    {
      lot: '#LOT-99214-A',
      rfid: 'RFID: 994-02B',
      name: 'Enoxaparin Sodium',
      detail: '40mg/0.4mL Pre-filled',
      days: '18 Days',
      daysColor: 'bg-error',
      value: '1,420 units',
      note: '2 Facilities Seeking',
      noteColor: 'text-tertiary'
    },
    {
      lot: '#LOT-88301-C',
      rfid: 'RFID: 412-88F',
      name: 'Sevoflurane Inhalation',
      detail: '250ml Liquid Gas',
      days: '26 Days',
      daysColor: 'bg-primary',
      value: '985 units',
      note: 'High OR Demand @ St. Jude',
      noteColor: 'text-primary'
    },
    {
      lot: '#LOT-77412-B',
      rfid: 'RFID: 104-19X',
      name: 'Meropenem 1g IV',
      detail: 'Powder Vial',
      days: '34 Days',
      daysColor: 'bg-outline',
      value: '812 units',
      note: 'County Clinic Match',
      noteColor: 'text-on-surface-variant'
    },
    {
      lot: '#LOT-66109-D',
      rfid: 'RFID: 708-33K',
      name: 'Dexamethasone 4mg/mL',
      detail: 'Vial Solution',
      days: '42 Days',
      daysColor: 'bg-outline',
      value: '625 units',
      note: 'Inter-Network Swap',
      noteColor: 'text-on-surface-variant'
    }
  ];

  return (
    <div className="flex flex-col w-full gap-space-lg pb-12 animate-fadeIn">
      {/* Top Operational Context / Breadcrumb & Header Action Strip */}
      <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-md">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold">
              Clinical Intelligence
            </span>
            <span className="text-outline text-xs">/</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
              Predictive Modeling
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed font-label-sm text-label-sm font-semibold ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              District-4 Realtime Sync
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
            Risk Intelligence &amp; AI Forecasting
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl leading-relaxed">
            Continuous Bayesian demand projection with 95% uncertainty intervals, epidemiological surge indicators, and peer-to-peer MOU rebalancing automation.
          </p>
        </div>

        {/* Controls & Action Ribbon */}
        <div className="flex flex-wrap items-center gap-space-sm pt-2 xl:pt-0">
          {/* Granularity Pills */}
          <div className="inline-flex p-1 bg-surface-container-high rounded-xl shadow-inner">
            <button
              type="button"
              onClick={() => setGranularity('daily')}
              className={`px-3 py-1 rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
                granularity === 'daily'
                  ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => setGranularity('weekly')}
              className={`px-3 py-1 rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
                granularity === 'weekly'
                  ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setGranularity('batch')}
              className={`px-3 py-1 rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
                granularity === 'batch'
                  ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Batch Cycle
            </button>
          </div>

          {/* Action Button CTA */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSimulating}
              onClick={handleRunSimulation}
              className="flex items-center gap-2 px-space-md py-2.5 rounded-xl bg-primary-container text-on-primary-container font-label-lg text-label-lg shadow-md hover:bg-primary transition-all active:scale-[0.99] font-semibold cursor-pointer disabled:opacity-80"
            >
              {isSimulating ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                  <span>Computing Bayesian Fits...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">query_stats</span>
                  <span>Run Forecast</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onToast && onToast('Risk matrix export generated (PDF/CSV).')}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors shadow-sm cursor-pointer border border-surface-container-high/60"
              title="Export Risk Matrix"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
            </button>
          </div>
        </div>
      </section>

      {/* Section 1: KPI Summary Strip (Model Accuracy Removed) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        {/* KPI 1: Shortage Risk -> Triggers Emergency Request */}
        <div
          onClick={() => onOpenEmergencyModal && onOpenEmergencyModal()}
          className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-sm relative overflow-hidden group hover:shadow-md transition-all cursor-pointer border border-error/30"
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-error font-semibold">
                Projected Shortages (Click to Request)
              </span>
              <span className="font-headline-lg text-headline-lg text-error font-bold mt-1 tracking-tight">
                4 SKUs
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-error-container/60 flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-[22px]">fmd_bad</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-error">
              <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
              <span className="font-label-sm text-label-sm font-semibold">Within 7 Calendar Days</span>
            </div>
            <span className="font-body-sm text-body-sm text-outline font-semibold">Trigger Stock Request</span>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-error-container/20 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* KPI 3 */}
        <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-sm relative overflow-hidden group hover:shadow-md transition-all border border-surface-container-high/40">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Projected Expiry At Risk
              </span>
              <span className="font-headline-lg text-headline-lg text-on-surface font-bold mt-1 tracking-tight">
                3,842 units
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary-container/60 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">hourglass_bottom</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
              <span className="font-label-sm text-label-sm font-semibold">Next 30d Window</span>
            </div>
            <span className="font-body-sm text-body-sm text-outline">4 Batches Eligible</span>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-secondary-container/20 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* KPI 4 */}
        <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-sm relative overflow-hidden group hover:shadow-md transition-all border border-surface-container-high/40">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Epidemic Surge Factor
              </span>
              <span className="font-headline-lg text-headline-lg text-tertiary font-bold mt-1 tracking-tight">
                1.38x
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-tertiary-fixed/40 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[22px]">coronavirus</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-tertiary">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
              <span className="font-label-sm text-label-sm font-semibold">RSV / Viral Wave (Tier-2)</span>
            </div>
            <span className="font-body-sm text-body-sm text-outline">+38% Consumption</span>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-tertiary-fixed/30 rounded-full blur-xl pointer-events-none"></div>
        </div>
      </section>

      {/* Section 2: AI Projected vs. Historical Consumption Trend Visualization */}
      <section className="p-space-lg rounded-2xl bg-surface-container-lowest shadow-md flex flex-col gap-space-md border border-surface-container-high/40">
        {/* Card Header Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                AI Projected vs. Historical Consumption Trend
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-semibold">
                Aggregated District Volume
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Historical dispense cadence mapped against Bayesian monte-carlo simulation factoring emergency department census &amp; syndromic surveillance inputs.
            </p>
          </div>

          {/* Filters & Horizon Selector */}
          <div className="flex flex-wrap items-center gap-space-sm">
            {/* SKU Selector Dropdown */}
            <div className="relative">
              <select
                value={selectedSKU}
                onChange={(e) => setSelectedSKU(e.target.value)}
                className="appearance-none bg-surface-container-low text-on-surface font-label-md text-label-md pl-space-md pr-8 py-2 rounded-xl focus:outline-none focus:bg-surface-container-lowest cursor-pointer transition-all shadow-sm border border-surface-container-high/60"
              >
                <option value="Paracetamol 500mg IV Infusion (100ml) [High Volatility]">Paracetamol 500mg IV Infusion (100ml) [High Volatility]</option>
                <option value="Propofol 10mg/mL Emulsion [Critical ICU]">Propofol 10mg/mL Emulsion [Critical ICU]</option>
                <option value="Ceftriaxone 1g Powder for Injection">Ceftriaxone 1g Powder for Injection</option>
                <option value="Enoxaparin Sodium 40mg/0.4mL Pre-filled">Enoxaparin Sodium 40mg/0.4mL Pre-filled</option>
                <option value="Sevoflurane Inhalation Liquid 250ml">Sevoflurane Inhalation Liquid 250ml</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-2.5 text-outline text-[18px]">
                arrow_drop_down
              </span>
            </div>

            {/* Predictive Window Selector */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-low text-on-surface font-label-md text-label-md border border-surface-container-high/60">
              <span className="material-symbols-outlined text-[16px] text-primary">timeline</span>
              <span>14-Day Horizon</span>
            </div>

            {/* 95% Bayesian Band Toggle */}
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-low text-on-surface font-label-md text-label-md cursor-pointer select-none border border-surface-container-high/60">
              <input
                type="checkbox"
                checked={showBayesianBand}
                onChange={(e) => setShowBayesianBand(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer accent-primary"
              />
              <span>95% Bayesian Band</span>
            </label>
          </div>
        </div>

        {/* Chart Canvas Area */}
        <div className="relative w-full rounded-xl bg-surface-container-low/50 p-space-md overflow-hidden border border-surface-container-high/30">
          {/* Top Chart Annotations & Legend */}
          <div className="flex flex-wrap items-center justify-between gap-space-md pb-4 text-body-sm">
            <div className="flex flex-wrap items-center gap-space-md">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-1 bg-primary rounded-full"></span>
                <span className="font-label-md text-label-md text-on-surface">Historical Dispensed (Solid)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-0 border-t-2 border-dashed border-primary"></span>
                <span className="font-label-md text-label-md text-on-surface">AI Predicted Demand (Dashed)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-2.5 bg-primary/20 rounded"></span>
                <span className="font-label-md text-label-md text-on-surface">95% Confidence Interval Band</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-error-container/50 text-error font-label-sm text-label-sm font-semibold border border-error-container">
                <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                <span>Surge Cluster (+34% influx)</span>
              </div>
            </div>
            <div className="text-on-surface-variant font-label-sm text-label-sm">
              Baseline Mean: <span className="text-on-surface font-semibold">1,200 units/day</span> • Peak Projected: <span className="text-error font-semibold">2,050 units/day</span>
            </div>
          </div>

          {/* High Fidelity SVG Graphic */}
          <div className="relative w-full h-[320px] select-none">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 320">
              <defs>
                {/* Gradient for 95% Bayesian Interval */}
                <linearGradient id="ciGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#007bb9" stopOpacity="0.32"></stop>
                  <stop offset="50%" stopColor="#007bb9" stopOpacity="0.14"></stop>
                  <stop offset="100%" stopColor="#007bb9" stopOpacity="0.02"></stop>
                </linearGradient>

                {/* Surge Alert Highlight Area */}
                <linearGradient id="surgeGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ba1a1a" stopOpacity="0.15"></stop>
                  <stop offset="100%" stopColor="#ba1a1a" stopOpacity="0.0"></stop>
                </linearGradient>

                <pattern height="40" id="chartGrid" patternUnits="userSpaceOnUse" width="100">
                  <path d="M 100 0 L 0 0 0 40" fill="none" stroke="#e0e3e5" strokeDasharray="2 2" strokeWidth="0.8"></path>
                </pattern>
              </defs>

              {/* Background Subtle Grid */}
              <rect fill="url(#chartGrid)" height="260" opacity="0.6" width="1000"></rect>

              {/* Horizontal Reference Gridlines & Y-Axis Labels */}
              <g className="text-[11px] font-sans fill-outline" textAnchor="end">
                <line stroke="#eceef0" strokeWidth="1" x1="45" x2="980" y1="20" y2="20"></line>
                <text x="40" y="24">2500</text>
                <line stroke="#eceef0" strokeWidth="1" x1="45" x2="980" y1="68" y2="68"></line>
                <text x="40" y="72">2000</text>
                <line stroke="#eceef0" strokeWidth="1" x1="45" x2="980" y1="116" y2="116"></line>
                <text x="40" y="120">1500</text>
                <line stroke="#eceef0" strokeWidth="1" x1="45" x2="980" y1="164" y2="164"></line>
                <text x="40" y="168">1000</text>
                <line stroke="#eceef0" strokeWidth="1" x1="45" x2="980" y1="212" y2="212"></line>
                <text x="40" y="216">500</text>
                <line stroke="#bfc7d2" strokeWidth="1" x1="45" x2="980" y1="260" y2="260"></line>
                <text x="40" y="264">0</text>
              </g>

              {/* Viral Surge Signal Region */}
              <rect fill="url(#surgeGradient)" height="240" rx="4" width="260" x="580" y="20"></rect>
              <line opacity="0.4" stroke="#ba1a1a" strokeDasharray="3 3" strokeWidth="1" x1="580" x2="580" y1="20" y2="260"></line>
              <line opacity="0.4" stroke="#ba1a1a" strokeDasharray="3 3" strokeWidth="1" x1="840" x2="840" y1="20" y2="260"></line>

              {/* Surge Pill in Graphic */}
              <rect fill="#ffdad6" height="22" rx="11" width="180" x="620" y="30"></rect>
              <text className="text-[10px] font-sans fill-on-error-container font-semibold" textAnchor="middle" x="710" y="45">
                Viral Surge Signal Active (+34%)
              </text>

              {/* Bayesian 95% Confidence Interval Polygon */}
              {showBayesianBand && (
                <polygon
                  fill="url(#ciGradient)"
                  points="520,132 600,108 680,82 750,56 830,72 900,95 960,110 960,198 900,182 830,162 750,140 680,152 600,165 520,132"
                  className={`transition-opacity duration-300 ${simulationGlow ? 'opacity-80' : 'opacity-100'}`}
                ></polygon>
              )}

              {/* Vertical Demarcation Line: Today */}
              <line stroke="#006194" strokeDasharray="4 4" strokeWidth="2" x1="520" x2="520" y1="10" y2="270"></line>
              <circle cx="520" cy="18" fill="#006194" r="4"></circle>
              <rect fill="#006194" height="20" rx="4" width="150" x="445" y="6"></rect>
              <text className="text-[10px] font-sans fill-on-primary font-semibold tracking-wide" textAnchor="middle" x="520" y="19">
                TODAY // FORECAST SPLIT
              </text>

              {/* Historical Curve */}
              <path
                d="M 80 180 C 120 175, 130 168, 150 168 C 190 168, 200 155, 230 155 C 270 155, 280 172, 310 172 C 360 172, 370 142, 410 142 C 460 142, 480 132, 520 132"
                fill="none"
                stroke="#006194"
                strokeLinecap="round"
                strokeWidth="3"
              ></path>

              {/* Historical Data Nodes */}
              <circle cx="80" cy="180" fill="#ffffff" r="4" stroke="#006194" strokeWidth="2.5"></circle>
              <circle cx="150" cy="168" fill="#ffffff" r="4" stroke="#006194" strokeWidth="2.5"></circle>
              <circle cx="230" cy="155" fill="#ffffff" r="4" stroke="#006194" strokeWidth="2.5"></circle>
              <circle cx="310" cy="172" fill="#ffffff" r="4" stroke="#006194" strokeWidth="2.5"></circle>
              <circle cx="410" cy="142" fill="#ffffff" r="4" stroke="#006194" strokeWidth="2.5"></circle>
              <circle cx="520" cy="132" fill="#006194" r="5" stroke="#ffffff" strokeWidth="2"></circle>

              {/* AI Predicted Demand Line */}
              <path
                d="M 520 132 C 560 132, 580 136, 600 136 C 640 136, 660 115, 680 115 C 720 115, 730 94, 750 94 C 790 94, 810 112, 830 112 C 870 112, 880 135, 900 135 C 930 135, 940 150, 960 150"
                fill="none"
                stroke="#007bb9"
                strokeDasharray="6 5"
                strokeLinecap="round"
                strokeWidth="3"
              ></path>

              {/* Prediction Nodes */}
              <circle cx="600" cy="136" fill="#007bb9" r="4" stroke="#ffffff" strokeWidth="2"></circle>
              <circle cx="680" cy="115" fill="#007bb9" r="4" stroke="#ffffff" strokeWidth="2"></circle>
              <circle cx="750" cy="94" fill="#ba1a1a" r="5" stroke="#ffffff" strokeWidth="2.5"></circle>
              <circle cx="830" cy="112" fill="#007bb9" r="4" stroke="#ffffff" strokeWidth="2"></circle>
              <circle cx="900" cy="135" fill="#007bb9" r="4" stroke="#ffffff" strokeWidth="2"></circle>
              <circle cx="960" cy="150" fill="#007bb9" r="4" stroke="#ffffff" strokeWidth="2"></circle>

              {/* X-Axis Labels */}
              <g className="text-[11px] font-sans fill-on-surface-variant font-medium" textAnchor="middle">
                <text x="80" y="285">Oct 12</text>
                <text x="170" y="285">Oct 16</text>
                <text x="260" y="285">Oct 20</text>
                <text x="350" y="285">Oct 24</text>
                <text x="440" y="285">Oct 28</text>
                <text className="fill-primary font-bold" x="520" y="285">Today (Nov 01)</text>
                <text x="630" y="285">Nov 05</text>
                <text className="fill-error font-bold" x="750" y="285">Nov 06 (Peak)</text>
                <text x="850" y="285">Nov 09</text>
                <text x="960" y="285">Nov 13</text>
              </g>
            </svg>

            {/* Floating High-Density Diagnostic Tooltip Mock */}
            <div className="absolute left-[65%] top-[14%] hidden md:flex flex-col gap-1.5 p-space-md bg-surface-container-lowest/95 backdrop-blur-md rounded-xl shadow-xl w-64 z-20 pointer-events-none transform -translate-x-1/2 border border-surface-container-high">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-error"></span>
                  <span className="font-label-md text-label-md text-on-surface font-bold">Nov 06 • Day +5</span>
                </div>
                <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-semibold">
                  Surge +34%
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-body-sm text-body-sm text-outline">AI Predicted:</span>
                <span className="font-headline-sm text-headline-sm text-primary font-bold">1,840 units</span>
              </div>
              <div className="flex items-center justify-between text-body-sm text-on-surface-variant pt-0.5">
                <span className="text-outline">95% CI Range:</span>
                <span className="font-medium text-on-surface">1,620 – 2,050 u</span>
              </div>
              <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
                <span className="text-outline">Normal Baseline:</span>
                <span className="font-medium text-on-surface">1,200 u</span>
              </div>
              <div className="mt-1 pt-1 flex items-center justify-between text-body-sm border-t border-surface-container">
                <span className="text-error font-semibold">Viral Surge Delta:</span>
                <span className="text-error font-bold">+420 units</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Bottom Split 50/50 Grid (Shortage Risks vs Expiry Risks) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
        {/* Left (50%): Shortage Risks Table */}
        <div className="flex flex-col p-space-lg rounded-2xl bg-surface-container-lowest shadow-md justify-between border border-surface-container-high/40">
          <div className="flex flex-col gap-space-md">
            {/* Panel Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-[22px]">warning</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Shortage Risks</h3>
                  <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">
                    {filteredShortages.length} High Vulnerability SKUs
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Ranked ascending by algorithmic Days to Stockout
                </span>
              </div>

              {/* Quick Filters */}
              <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl shadow-inner">
                <button
                  type="button"
                  onClick={() => setShortageFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-label-sm text-label-sm transition-all cursor-pointer ${
                    shortageFilter === 'all'
                      ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  All ({shortageData.length})
                </button>
                <button
                  type="button"
                  onClick={() => setShortageFilter('under3')}
                  className={`px-2.5 py-1 rounded-lg font-label-sm text-label-sm transition-all cursor-pointer ${
                    shortageFilter === 'under3'
                      ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  &lt; 3 Days
                </button>
                <button
                  type="button"
                  onClick={() => setShortageFilter('surge')}
                  className={`px-2.5 py-1 rounded-lg font-label-sm text-label-sm transition-all cursor-pointer ${
                    shortageFilter === 'surge'
                      ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Surge Tier
                </button>
              </div>
            </div>

            {/* Shortage Risks Table Layout */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-outline font-label-sm text-label-sm uppercase tracking-wider bg-surface-container-low/60 rounded-lg">
                    <th className="py-2.5 px-3 rounded-l-lg">Medicine / SKU</th>
                    <th className="py-2.5 px-2">Stock Level</th>
                    <th className="py-2.5 px-2">Projected Burn</th>
                    <th className="py-2.5 px-2">Depletion</th>
                    <th className="py-2.5 px-2">Status</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Intervention</th>
                  </tr>
                </thead>
                <tbody className="divide-y-0 text-body-sm">
                  {filteredShortages.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors group">
                      <td className="py-3 px-3">
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-md text-label-md text-on-surface font-bold group-hover:text-primary transition-colors">
                            {item.sku}
                          </span>
                          <span className="font-body-sm text-body-sm text-outline">{item.code}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md text-on-surface font-semibold">{item.stock}</span>
                          <div className="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-1">
                            <div className={`h-full rounded-full ${item.stockBar}`}></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">{item.burn}</span>
                        <span className={`block text-[11px] font-medium ${item.burnColor}`}>{item.burnSub}</span>
                      </td>
                      <td className="py-3 px-2">
                        <div className={`flex items-center gap-1.5 font-headline-sm text-headline-sm font-bold ${
                          item.status === 'Critical' || item.status === 'Borrow' ? 'text-error' : 'text-on-surface'
                        }`}>
                          <span>{item.depletion}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${item.statusClass}`}>
                          {item.ping && <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>}
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenBorrow(item.sku, item.hospitalMatch)}
                          className={`px-3 py-1.5 rounded-xl font-label-sm text-label-sm font-semibold shadow-sm transition-all cursor-pointer ${item.actionClass}`}
                        >
                          {item.actionText}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Left Table Footer */}
          <div className="pt-4 flex items-center justify-between text-body-sm text-outline border-t border-surface-container/60">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">bolt</span>
              <span>Automatic MOU trigger staged at &lt; 2.0 days</span>
            </div>
            <button
              type="button"
              onClick={() => onToast && onToast('Displaying full 30-day algorithmic depletion log')}
              className="font-label-md text-label-md text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Full Depletion Log</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Right (50%): Expiry Risks Table */}
        <div className="flex flex-col p-space-lg rounded-2xl bg-surface-container-lowest shadow-md justify-between border border-surface-container-high/40">
          <div className="flex flex-col gap-space-md">
            {/* Panel Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">published_with_changes</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Expiry Risks</h3>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                    3,842 At-Risk Units
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Algorithmic matching with high-consumption regional district nodes
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-tertiary-fixed/30 text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold border border-tertiary/20">
                <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                <span>Zero Wastage Protocol</span>
              </div>
            </div>

            {/* Expiry Risks Table Layout */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-outline font-label-sm text-label-sm uppercase tracking-wider bg-surface-container-low/60 rounded-lg">
                    <th className="py-2.5 px-3 rounded-l-lg">Batch / RFID</th>
                    <th className="py-2.5 px-2">Medicine Detail</th>
                    <th className="py-2.5 px-2">Expiry Horizon</th>
                    <th className="py-2.5 px-2">At-Risk Quantity</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Peer Redistribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y-0 text-body-sm">
                  {expiryData.map((exp, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low/50 transition-colors group">
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md text-on-surface font-semibold font-mono">{exp.lot}</span>
                          <span className="font-body-sm text-body-sm text-outline">{exp.rfid}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-md text-label-md text-on-surface font-bold group-hover:text-primary transition-colors">
                            {exp.name}
                          </span>
                          <span className="font-body-sm text-body-sm text-outline">{exp.detail}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${exp.daysColor}`}></span>
                          <span className="font-label-md text-label-md text-on-surface font-bold">{exp.days}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="font-headline-sm text-headline-sm text-on-surface font-bold">{exp.value}</span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenTaker(exp.lot, exp.name, exp.value)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container shadow-sm transition-all cursor-pointer"
                          >
                            <span>Find Taker</span>
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </button>
                          <span className={`text-[10px] font-semibold ${exp.noteColor}`}>{exp.note}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Table Footer */}
          <div className="pt-4 flex items-center justify-between text-body-sm text-outline border-t border-surface-container/60">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-tertiary">verified_user</span>
              <span>Automated MOU Smart Router will ping matched tertiary centers with freight routing.</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
              MOU-SEC // Compliant
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Modal / Slide-over Mock for P2P MOU Rebalance */}
      {mouDialog && (
        <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-lg w-full p-space-lg flex flex-col gap-space-md border border-surface-container-high">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed/40 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">local_shipping</span>
                </div>
                <div className="flex flex-col">
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{mouDialog.title}</h4>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">District 4 Rapid Stock Redistribution</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMouDialog(null)}
                className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-outline hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-2 border border-surface-container-high/50">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-outline">Target SKU / Batch:</span>
                <span className="font-label-md text-label-md text-on-surface font-semibold">{mouDialog.sku}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-outline">Target Hospital:</span>
                <span className="font-label-md text-label-md text-primary font-semibold">{mouDialog.hospital}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-outline">Protocol Route:</span>
                <span className="font-label-md text-label-md text-tertiary font-semibold">{mouDialog.route}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container">
              <button
                type="button"
                onClick={() => setMouDialog(null)}
                className="px-4 py-2 rounded-xl bg-surface-container-low text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                <span>Confirm Automated Transfer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
