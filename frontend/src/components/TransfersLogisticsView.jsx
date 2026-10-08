import React, { useState } from 'react';

export function TransfersLogisticsView({ onToast }) {
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [selectedFacility, setSelectedFacility] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedRegime, setSelectedRegime] = useState('All');
  const [isInitiateModalOpen, setIsInitiateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState('TRX-9402');
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  // Transfers data model
  const [transfers, setTransfers] = useState([
    {
      id: 'TRX-9411',
      column: 'proposed',
      skuName: 'Ceftriaxone 1g Powder',
      subtitle: 'Injectable Vials for Reconstitution',
      quantity: '500 vials',
      regime: 'Ambient Regulated',
      regimeType: 'ambient',
      origin: 'MedCare Gen (Depot-B)',
      destination: 'North District Clinic',
      distance: '9.4 km',
      eta: '22m',
      courier: 'District Courier',
      score: 98,
      scoreLabel: 'Critical Surge',
      scoreType: 'critical',
      timeAgo: '8m ago',
      batch: '#LOT-88120-C',
      expiry: 'Dec 12, 2024',
      justification: 'Outbreak spike detected in North District pediatric ward. Automated redistribution from surplus depot.',
      steps: [
        { label: 'Proposed by Epi-Forecast Agent', time: 'Oct 28, 08:32', done: true },
        { label: 'MOU Partner Verification', time: 'Pending', active: true },
        { label: 'Clinical Pharmacy Authorization', time: 'Pending' },
        { label: 'Cold Chain Courier Dispatch', time: 'Pending' },
        { label: 'Receipt & Cryptographic Ledgering', time: 'Pending' }
      ]
    },
    {
      id: 'TRX-9408',
      column: 'proposed',
      skuName: 'Enoxaparin 40mg Syringes',
      subtitle: 'Prefilled Subcutaneous Solution',
      quantity: '400 syringes',
      regime: 'Cold Chain 2-8°C',
      regimeType: 'cold',
      origin: 'St. Jude Regional',
      destination: 'MedCare General',
      distance: '18.1 km',
      eta: '45m',
      courier: 'CryoTransit',
      score: 72,
      scoreLabel: 'Routine Rebalance',
      scoreType: 'routine',
      timeAgo: '24m ago',
      batch: '#LOT-77402-E',
      expiry: 'Jan 05, 2025',
      justification: 'Routine monthly stock stabilization based on consumption burn-rate.',
      steps: [
        { label: 'Proposed by Epi-Forecast Agent', time: 'Oct 28, 08:16', done: true },
        { label: 'MOU Partner Verification', time: 'Pending', active: true },
        { label: 'Clinical Pharmacy Authorization', time: 'Pending' },
        { label: 'Cold Chain Courier Dispatch', time: 'Pending' },
        { label: 'Receipt & Cryptographic Ledgering', time: 'Pending' }
      ]
    },
    {
      id: 'TRX-9402',
      column: 'under-review',
      skuName: 'Paracetamol 500mg IV Infusion',
      subtitle: '100ml Glass Infusion Bottles',
      quantity: '600 vials (12 cases)',
      regime: 'Ambient Regulated (15-25°C)',
      regimeType: 'ambient',
      origin: 'MedCare General (Depot-A)',
      destination: 'Valley Trauma Center',
      distance: '18.4 km via I-80 Med Express',
      eta: '38m',
      courier: 'CryoExpress',
      score: 94,
      scoreLabel: 'Surge Defense',
      scoreType: 'critical',
      timeAgo: '14m ago',
      batch: '#LOT-99214-A',
      expiry: 'Nov 18, 2024 (18d buffer)',
      justification: 'Valley Trauma Center reports 41% pediatric & adult viral influenza surge admissions. Projected zero-stockout in 16.4 hours without peer-to-peer assistance. MedCare General currently operates at 142% safety buffer threshold with surplus batch LOT-99214-A.',
      impact: 'Protects estimated 84 hospital admissions against fever spikes.',
      steps: [
        { label: 'Proposed by Epi-Forecast Agent', time: 'Oct 28, 08:14 • Algorithmic shortage risk trigger (<24h lead)', done: true },
        { label: 'MOU Partner Verification', time: 'Oct 28, 08:22 • Valley Trauma confirmed forecast & accepted quota', done: true },
        { label: 'Clinical Pharmacy Authorization', time: 'Oct 28, 08:35 • Awaiting sign-off by MedCare General Hospital', active: true },
        { label: 'Cold Chain Courier Dispatch', time: 'Pending authorization • Automated dispatch staged' },
        { label: 'Receipt & Cryptographic Ledgering', time: 'Pending delivery • DSCSA Title 21 CFR Part 11 ledgering' }
      ]
    },
    {
      id: 'TRX-9399',
      column: 'under-review',
      skuName: 'Propofol 10mg/mL Emulsion',
      subtitle: 'Injectable Anesthetic 50mL Vial',
      quantity: '150 ampoules',
      regime: 'Cold Chain 4°C',
      regimeType: 'cold',
      origin: "Central Children's",
      destination: 'MedCare General',
      distance: '12.5 km',
      eta: '30m',
      courier: 'District Courier',
      score: 89,
      scoreLabel: 'Critical Shortage',
      scoreType: 'critical',
      timeAgo: '32m ago',
      batch: '#LOT-44109-P',
      expiry: 'Dec 01, 2024',
      justification: 'MedCare surgical schedule requires backup anesthetic vials for emergency cardiac suites.',
      steps: [
        { label: 'Proposed by Epi-Forecast Agent', time: 'Oct 28, 07:58', done: true },
        { label: 'MOU Partner Verification', time: 'Oct 28, 08:10', done: true },
        { label: 'Clinical Pharmacy Authorization', time: 'Awaiting Director Sign-off', active: true },
        { label: 'Cold Chain Courier Dispatch', time: 'Pending' },
        { label: 'Receipt & Cryptographic Ledgering', time: 'Pending' }
      ]
    },
    {
      id: 'TRX-9395',
      column: 'approved',
      skuName: 'Norepinephrine 4mg/4mL',
      subtitle: 'Concentrate for Infusion (Vasopressor)',
      quantity: '240 ampoules',
      regime: 'Ambient Regulated',
      regimeType: 'ambient',
      origin: 'MedCare General',
      destination: 'Highland Memorial',
      distance: '15.8 km',
      eta: '34m',
      courier: 'Packaging Ready',
      score: 91,
      scoreLabel: 'Hospital Restock',
      scoreType: 'critical',
      timeAgo: '50m ago',
      batch: '#LOT-33219-N',
      expiry: 'Jan 22, 2025',
      justification: 'Highland Memorial septic shock admissions exceeded 3-day mean by 65%.',
      steps: [
        { label: 'Proposed by Epi-Forecast Agent', time: 'Oct 28, 07:40', done: true },
        { label: 'MOU Partner Verification', time: 'Oct 28, 07:55', done: true },
        { label: 'Clinical Pharmacy Authorization', time: 'Oct 28, 08:05 • Approved by MedCare General Hospital', done: true },
        { label: 'Cold Chain Courier Dispatch', time: 'Staging on Loading Bay 3', active: true },
        { label: 'Receipt & Cryptographic Ledgering', time: 'Pending receipt' }
      ]
    },
    {
      id: 'TRX-9388',
      column: 'in-transit',
      skuName: 'Packed Red Blood Cells (O-)',
      subtitle: 'Cold Container Unit CPDA-1',
      quantity: '12 Units',
      regime: '3.8°C Steady',
      regimeType: 'cold',
      origin: 'Metro Regional Blood Bank',
      destination: 'MedCare Trauma Bay',
      distance: 'En Route • 65% Completed',
      eta: '12m',
      courier: 'Van #04 (Rapid Dispatch)',
      score: 99,
      scoreLabel: 'Trauma Code O-Neg',
      scoreType: 'critical',
      timeAgo: 'Live GPS',
      progress: 65,
      batch: '#LOT-BLD-9002',
      expiry: 'Nov 02, 2024',
      justification: 'Mass casualty trauma intake at MedCare Gen requested urgent Type O-Neg blood replenishment.',
      steps: [
        { label: 'Proposed by Epi-Forecast Agent', time: 'Oct 28, 07:10', done: true },
        { label: 'MOU Partner Verification', time: 'Oct 28, 07:15', done: true },
        { label: 'Clinical Pharmacy Authorization', time: 'Oct 28, 07:20', done: true },
        { label: 'Cold Chain Courier Dispatch', time: 'Oct 28, 07:28 • Driver Assigned (Van #04)', done: true },
        { label: 'Receipt & Cryptographic Ledgering', time: 'ETA 12m • Live Cold-Chain Verified', active: true }
      ]
    },
    {
      id: 'TRX-9372',
      column: 'completed',
      skuName: 'Remdesivir 100mg Vials',
      subtitle: 'Lyophilized Powder Infusion',
      quantity: '180 vials',
      regime: 'Ambient',
      regimeType: 'ambient',
      origin: 'MedCare General',
      destination: "Central Children's",
      distance: 'Delivered',
      eta: 'Received 10:14 AM',
      courier: 'DSCSA Verified',
      score: 85,
      scoreLabel: 'Pediatric Replenishment',
      scoreType: 'routine',
      timeAgo: 'Received 10:14 AM',
      batch: '#LOT-55102-R',
      expiry: 'Mar 15, 2025',
      justification: 'Scheduled peer fulfillment completed with cryptographic signatures matching FDA DSCSA.',
      steps: [
        { label: 'Proposed by Epi-Forecast Agent', time: 'Oct 28, 06:10', done: true },
        { label: 'MOU Partner Verification', time: 'Oct 28, 06:25', done: true },
        { label: 'Clinical Pharmacy Authorization', time: 'Oct 28, 06:40', done: true },
        { label: 'Cold Chain Courier Dispatch', time: 'Oct 28, 07:05', done: true },
        { label: 'Receipt & Cryptographic Ledgering', time: 'Oct 28, 10:14 • Verified on SHA-256 Ledger', done: true }
      ]
    }
  ]);

  const selectedTransfer = transfers.find(t => t.id === selectedTransferId) || transfers[0];

  const columns = [
    { id: 'proposed', title: 'Proposed', subtitle: 'AI outbreak forecast and safety buffer rebalancing', totalVal: '540 units', badgeClass: 'bg-surface-container-high text-on-surface-variant' },
    { id: 'under-review', title: 'Under Review', subtitle: 'Pending clinical director / pharmacy sign-off', totalVal: '390 units', badgeClass: 'bg-primary-fixed text-on-primary-fixed', highlight: true },
    { id: 'approved', title: 'Approved', subtitle: 'Authorized, awaiting packaging & courier dispatch', totalVal: '410 units', badgeClass: 'bg-surface-container-high text-on-surface-variant' },
    { id: 'in-transit', title: 'In Transit', subtitle: 'Active cold chain GPS tracking & live telemetry', totalVal: '790 units', badgeClass: 'bg-tertiary-fixed text-on-tertiary-fixed' },
    { id: 'completed', title: 'Completed', subtitle: 'Reconciled into destination inventory ledger', totalVal: '1,340 units', badgeClass: 'bg-tertiary-fixed/30 text-on-tertiary-fixed-variant' }
  ];

  const handleApproveTransfer = (id) => {
    setTransfers(prev =>
      prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            column: 'approved',
            steps: t.steps.map((s, idx) => (idx <= 2 ? { ...s, done: true, active: false } : idx === 3 ? { ...s, active: true } : s))
          };
        }
        return t;
      })
    );
    if (onToast) {
      onToast(`Transfer ${id} Authorized! Cold-Chain Courier dispatch staged.`);
    }
  };

  const handleRejectTransfer = (id) => {
    if (onToast) {
      onToast(`Transfer ${id} rejected & flagged for manual review.`);
    }
  };

  return (
    <div className="flex flex-col w-full relative animate-fadeIn">
      {/* Top Ambient Glass Radiance Overlay */}
      <div className="absolute -top-10 left-1/3 w-96 h-96 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute top-48 right-10 w-80 h-80 bg-tertiary-fixed/15 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Breadcrumb & Control Bar Header */}
      <div className="flex flex-col gap-space-sm mb-space-lg">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
          <span>Clinical Operations</span>
          <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
          <span>Transfers &amp; Logistics</span>
          <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
          <span className="text-primary font-semibold">Regional Redistribution Hub</span>
        </div>

        {/* Title and Primary Actions Strip */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
          <div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
              Redistribution Hub: Stock Movement &amp; MOU Logistics
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-0.5 max-w-4xl">
              Autonomous and peer-to-peer hospital stock rebalancing across Metropolitan District 4 mutual-aid facilities.
            </p>
          </div>

          {/* Controls & Quick Actions */}
          <div className="flex flex-wrap items-center gap-space-sm">
            {/* View Switcher Segmented Control */}
            <div className="flex items-center p-1 rounded-xl bg-surface-container-high shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-surface-container-lowest text-on-surface shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className={`material-symbols-outlined text-[16px] ${viewMode === 'kanban' ? 'text-primary' : 'text-outline'}`}>view_kanban</span>
                <span>Kanban Board</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-surface-container-lowest text-on-surface shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className={`material-symbols-outlined text-[16px] ${viewMode === 'list' ? 'text-primary' : 'text-outline'}`}>format_list_bulleted</span>
                <span>List View</span>
              </button>
            </div>

            {/* Export Action */}
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 px-space-md py-2.5 rounded-xl bg-surface-container-lowest text-on-surface font-label-lg text-label-lg shadow-sm hover:bg-surface-container-low transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-outline">ios_share</span>
              <span>Export Manifest</span>
            </button>

            {/* Primary Initiate Transfer Button */}
            <button
              type="button"
              onClick={() => setIsInitiateModalOpen(true)}
              className="flex items-center gap-2 px-space-lg py-2.5 rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg shadow-[0_4px_14px_rgba(0,123,185,0.35)] hover:bg-primary transition-all active:scale-[0.99] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Initiate Emergency Transfer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Operational Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm p-space-sm rounded-xl bg-surface-container-low mb-space-lg">
        <div className="flex flex-wrap items-center gap-space-xs">
          <span className="px-space-sm font-label-sm text-label-sm text-outline uppercase tracking-wider">Filters:</span>

          {/* Facility Filter Chip */}
          <div className="relative">
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              aria-label="Filter transfers by facility"
              className="appearance-none flex items-center gap-1.5 pl-8 pr-7 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm cursor-pointer hover:bg-surface-container-high transition-colors border-none outline-none"
            >
              <option value="All">Facility: All 6 Centers</option>
              <option value="MedCare General">MedCare General</option>
              <option value="Valley Trauma Center">Valley Trauma Center</option>
              <option value="St. Jude Regional">St. Jude Regional</option>
              <option value="North District Clinic">North District Clinic</option>
              <option value="Central Children's">Central Children's</option>
              <option value="Highland Memorial">Highland Memorial</option>
            </select>
            <span className="material-symbols-outlined text-[16px] text-primary absolute left-2.5 top-2 pointer-events-none">domain</span>
            <span className="material-symbols-outlined text-[14px] text-outline absolute right-2 top-2.5 pointer-events-none">expand_more</span>
          </div>

          {/* Priority Filter Chip */}
          <div className="relative">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              aria-label="Filter transfers by priority level"
              className="appearance-none flex items-center gap-1.5 pl-8 pr-7 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm cursor-pointer hover:bg-surface-container-high transition-colors border-none outline-none"
            >
              <option value="All">Priority: All Levels</option>
              <option value="critical">Critical Surge (&gt;90)</option>
              <option value="routine">Routine Rebalance</option>
            </select>
            <span className="material-symbols-outlined text-[16px] text-error absolute left-2.5 top-2 pointer-events-none">flag</span>
            <span className="material-symbols-outlined text-[14px] text-outline absolute right-2 top-2.5 pointer-events-none">expand_more</span>
          </div>

          {/* Storage Temp Filter Chip */}
          <div className="relative">
            <select
              value={selectedRegime}
              onChange={(e) => setSelectedRegime(e.target.value)}
              aria-label="Filter transfers by storage regime"
              className="appearance-none flex items-center gap-1.5 pl-8 pr-7 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm cursor-pointer hover:bg-surface-container-high transition-colors border-none outline-none"
            >
              <option value="All">Regime: Cold Chain &amp; Ambient</option>
              <option value="cold">Cold Chain (2-8°C / Frozen)</option>
              <option value="ambient">Ambient Regulated (15-25°C)</option>
            </select>
            <span className="material-symbols-outlined text-[16px] text-primary-container absolute left-2.5 top-2 pointer-events-none">ac_unit</span>
            <span className="material-symbols-outlined text-[14px] text-outline absolute right-2 top-2.5 pointer-events-none">expand_more</span>
          </div>

          {/* Active Filter Pill Counter */}
          <span className="ml-2 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
            {transfers.length} Active Manifests
          </span>
        </div>

        {/* Right mini-tools */}
        <div className="flex items-center gap-space-sm px-2">
          <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
            <span>Auto-Sync: 30s</span>
          </div>
          <button
            type="button"
            onClick={() => onToast && onToast('Transfers ledger synchronized across District 4 node mesh.')}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-lowest text-on-surface-variant hover:text-on-surface shadow-sm cursor-pointer"
            title="Refresh Ledger"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
          </button>
        </div>
      </div>

      {/* Operational KPI Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md mb-space-xl">
        {/* Metric 1: Active Reallocations */}
        <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-[0_4px_16px_rgba(15,23,42,0.03)] flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Active Reallocations</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-headline-lg text-headline-lg font-bold text-on-surface">18 Transfers</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-fixed/50 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">swap_horiz</span>
            </div>
          </div>
          <div className="mt-space-sm pt-space-xs flex items-center justify-between text-on-surface-variant">
            <span className="font-label-md text-label-md text-primary font-semibold">Total Quantity: 2,485 units</span>
            <span className="font-label-sm text-label-sm text-tertiary flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span> +3 Today
            </span>
          </div>
        </div>

        {/* Metric 2: In Transit Convoys */}
        <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-[0_4px_16px_rgba(15,23,42,0.03)] flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">In Transit Now</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-headline-lg text-headline-lg font-bold text-on-surface">6 Convoys</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary-fixed/50 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[22px]">local_shipping</span>
            </div>
          </div>
          <div className="mt-space-sm pt-space-xs flex items-center justify-between text-on-surface-variant">
            <span className="font-label-md text-label-md text-on-surface-variant">Active Couriers En Route</span>
            <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed/40 text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">
              100% On Schedule
            </span>
          </div>
        </div>

        {/* Metric 3: Fulfillment SLA */}
        <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-[0_4px_16px_rgba(15,23,42,0.03)] flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Avg Fulfillment Time</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-headline-lg text-headline-lg font-bold text-on-surface">48 mins</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-tertiary-fixed/50 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[22px]">timer</span>
            </div>
          </div>
          <div className="mt-space-sm pt-space-xs flex items-center justify-between text-on-surface-variant">
            <span className="font-label-md text-label-md text-outline">District 4 SLA &lt; 90 mins</span>
            <span className="font-label-sm text-label-sm text-tertiary font-semibold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">speed</span> -42m Delta
            </span>
          </div>
        </div>

        {/* Metric 4: Prevented Stockouts */}
        <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-[0_4px_16px_rgba(15,23,42,0.03)] flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Prevented Stockouts</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-headline-lg text-headline-lg font-bold text-on-surface">12 Units</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-error-container/60 flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-[22px]">shield</span>
            </div>
          </div>
          <div className="mt-space-sm pt-space-xs flex items-center justify-between text-on-surface-variant">
            <span className="font-label-md text-label-md text-on-surface-variant">Protected This Week</span>
            <span className="font-label-sm text-label-sm text-on-surface font-semibold">1,240 Critical Patients</span>
          </div>
        </div>
      </div>

      {/* Workspace Container: Kanban Columns + Detail Drawer Side-by-Side Canvas */}
      <div className="relative w-full flex items-start gap-space-md">
        {/* Kanban Board Mode */}
        {viewMode === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-space-md flex-1 min-w-0">
            {columns.map(col => {
              const colTransfers = transfers.filter(t => t.column === col.id);
              const count = colTransfers.length;

              return (
                <div
                  key={col.id}
                  className={`flex flex-col gap-space-sm bg-surface-container-low/70 p-space-sm rounded-2xl min-h-[720px] ${
                    col.highlight ? 'ring-2 ring-primary/20' : ''
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-label-lg text-label-lg text-on-surface font-semibold">{col.title}</span>
                      <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${col.badgeClass}`}>
                        {count}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-label-sm text-label-sm text-outline font-semibold">{col.totalVal}</span>
                      <button type="button" className="w-6 h-6 flex items-center justify-center rounded text-outline hover:text-on-surface">
                        <span className="material-symbols-outlined text-[16px]">more_horiz</span>
                      </button>
                    </div>
                  </div>

                  <div className="px-2 pb-1">
                    <p className="font-label-sm text-label-sm text-outline leading-tight">{col.subtitle}</p>
                  </div>

                  {/* Cards List */}
                  <div className="flex flex-col gap-space-sm flex-1">
                    {colTransfers.map(item => {
                      const isSelected = selectedTransferId === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedTransferId(item.id);
                            setIsDrawerOpen(true);
                          }}
                          className={`p-space-md rounded-xl bg-surface-container-lowest transition-all cursor-pointer flex flex-col gap-2.5 relative ${
                            isSelected
                              ? 'shadow-[0_4px_16px_rgba(0,123,185,0.18)] ring-2 ring-primary'
                              : 'shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-md'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-primary text-on-primary font-label-sm text-label-sm font-semibold shadow-sm flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">visibility</span> Selected
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-0.5">
                            <span className="font-label-sm text-label-sm font-bold text-primary">#{item.id}</span>
                            {item.timeAgo === 'Live GPS' ? (
                              <span className="flex items-center gap-1 font-label-sm text-label-sm text-tertiary font-semibold">
                                <span className="w-2 h-2 rounded-full bg-tertiary animate-ping"></span> GPS Live
                              </span>
                            ) : item.column === 'completed' ? (
                              <span className="flex items-center gap-1 font-label-sm text-label-sm text-tertiary font-semibold">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span> Reconciled
                              </span>
                            ) : (
                              <span className="font-label-sm text-label-sm text-outline">{item.timeAgo}</span>
                            )}
                          </div>

                          {/* Score Pill */}
                          <div
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full w-fit font-label-sm text-label-sm font-semibold ${
                              item.scoreType === 'critical'
                                ? 'bg-error-container text-on-error-container'
                                : 'bg-secondary-container text-on-secondary-fixed-variant'
                            }`}
                          >
                            {item.scoreType === 'critical' && <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>}
                            <span>Score: {item.score} // {item.scoreLabel}</span>
                          </div>

                          <div>
                            <h4 className="font-label-lg text-label-lg text-on-surface font-bold leading-snug">{item.skuName}</h4>
                            <p className="font-body-sm text-body-sm text-on-surface-variant">{item.subtitle}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-surface-container-high font-label-sm text-label-sm font-semibold text-on-surface">
                              {item.quantity}
                            </span>
                            {item.regimeType === 'cold' ? (
                              <span className="px-2 py-0.5 rounded bg-primary-fixed/40 font-label-sm text-label-sm text-on-primary-fixed flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">ac_unit</span> {item.regime}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-secondary-fixed/50 font-label-sm text-label-sm text-on-secondary-fixed">
                                {item.regime}
                              </span>
                            )}
                          </div>

                          {/* Live Progress Bar for In-Transit */}
                          {item.progress && (
                            <div className="flex flex-col gap-1 mt-1">
                              <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                                <span>En Route • {item.progress}% Completed</span>
                                <span className="font-semibold text-on-surface">ETA {item.eta}</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${item.progress}%` }}></div>
                              </div>
                            </div>
                          )}

                          {/* Route Graphic */}
                          <div className="p-2 rounded-lg bg-surface-container-low flex flex-col gap-1 text-on-surface-variant font-label-sm text-label-sm">
                            <div className="flex items-center justify-between">
                              <span className="truncate font-semibold text-on-surface">{item.origin}</span>
                              <span className="material-symbols-outlined text-[14px] text-primary shrink-0 px-1">arrow_forward</span>
                              <span className="truncate text-on-surface">{item.destination}</span>
                            </div>
                          </div>

                          {/* Metadata Strip */}
                          <div className="flex items-center justify-between pt-1 text-outline font-label-sm text-label-sm">
                            <span>{item.distance} • ETA {item.eta}</span>
                            <span className="font-semibold text-on-surface-variant">{item.courier}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View Mode */
          <div className="flex-1 bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-surface-container-high overflow-x-auto">
            <table className="w-full text-left border-collapse font-body-sm text-body-sm">
              <thead>
                <tr className="border-b border-surface-container-high text-outline uppercase font-label-sm text-[11px] tracking-wider">
                  <th className="py-3 px-4">Manifest ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">SKU / Item</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Origin ➔ Destination</th>
                  <th className="py-3 px-4">Regime</th>
                  <th className="py-3 px-4">Courier / Telemetry</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high/60">
                {transfers.map(item => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      setSelectedTransferId(item.id);
                      setIsDrawerOpen(true);
                    }}
                    className={`hover:bg-surface-container-low/80 cursor-pointer transition-colors ${
                      selectedTransferId === item.id ? 'bg-primary-fixed/10 font-medium' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-primary">#{item.id}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-surface-container-high text-on-surface">
                        {item.column.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-on-surface">{item.skuName}</div>
                      <div className="text-outline text-xs">{item.subtitle}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-on-surface">{item.quantity}</td>
                    <td className="py-3 px-4 text-xs">
                      <div>{item.origin}</div>
                      <div className="text-primary font-medium">➔ {item.destination}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-xs font-medium">
                        {item.regime}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-outline">{item.courier}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTransferId(item.id);
                          setIsDrawerOpen(true);
                        }}
                        className="px-3 py-1 rounded-lg bg-surface-container text-primary hover:bg-primary hover:text-on-primary text-xs font-semibold transition-all cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SIDE DRAWER: Transfer Details Modal/Drawer */}
        {isDrawerOpen && selectedTransfer && (
          <div className="w-full xl:w-[430px] shrink-0 bg-surface-container-lowest rounded-2xl shadow-[0_12px_40px_rgba(15,23,42,0.12)] p-space-lg flex flex-col gap-space-md sticky top-20 border-l border-primary/10 animate-fadeIn">
            {/* Drawer Header Bar */}
            <div className="flex items-start justify-between pb-space-sm">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Transfer Manifest</span>
                  <span className="px-2 py-0.5 rounded bg-primary-fixed text-primary font-mono font-bold text-label-sm">#{selectedTransfer.id}</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mt-1">Transfer Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Status Indicator Pill Strip */}
            <div className="flex items-center justify-between p-space-sm rounded-xl bg-primary-fixed/20">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                <span className="font-label-md text-label-md font-bold text-on-primary-fixed uppercase">
                  {selectedTransfer.column === 'under-review' ? 'UNDER REVIEW • ACTION REQUIRED' : selectedTransfer.column.replace('-', ' ')}
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-primary font-semibold">SLA: 18m left</span>
            </div>

            {/* SKU & Batch Specifics Card */}
            <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-xs">
              <span className="font-label-sm text-label-sm uppercase text-outline font-semibold">Stock Item Specification</span>
              <h4 className="font-label-lg text-label-lg font-bold text-on-surface">{selectedTransfer.skuName}</h4>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 text-label-sm font-label-sm">
                <div>
                  <span className="text-outline block">Volume:</span>
                  <span className="text-on-surface font-semibold">{selectedTransfer.quantity}</span>
                </div>
                <div>
                  <span className="text-outline block">Batch Lot:</span>
                  <span className="font-mono text-on-surface font-semibold">{selectedTransfer.batch}</span>
                </div>
                <div>
                  <span className="text-outline block">Expiry:</span>
                  <span className="text-on-surface font-semibold">{selectedTransfer.expiry}</span>
                </div>
                <div>
                  <span className="text-outline block">Storage Regime:</span>
                  <span className="text-on-surface font-semibold">{selectedTransfer.regime}</span>
                </div>
              </div>
              <div className="mt-2 pt-2 flex flex-col gap-1 text-label-sm font-label-sm">
                <div className="flex items-center gap-2 text-on-surface">
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
                  <span className="text-outline">Origin:</span>
                  <span className="font-semibold truncate">{selectedTransfer.origin}</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface">
                  <span className="w-2 h-2 rounded-full bg-tertiary shrink-0"></span>
                  <span className="text-outline">Destination:</span>
                  <span className="font-semibold truncate">{selectedTransfer.destination}</span>
                </div>
              </div>
            </div>

            {/* Algorithmic Clinical Justification Banner */}
            <div className="p-space-md rounded-xl bg-secondary-container/40 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-on-secondary-fixed">
                <span className="material-symbols-outlined text-[18px] text-primary">neurology</span>
                <span className="font-label-md text-label-md font-bold">AI Epidemiologic Surge Match</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                {selectedTransfer.justification}
              </p>
              {selectedTransfer.impact && (
                <div className="flex items-center gap-1.5 pt-1 text-tertiary font-label-sm text-label-sm font-semibold">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>{selectedTransfer.impact}</span>
                </div>
              )}
            </div>

            {/* Logistics & Corridor Telemetry Snapshot */}
            <div className="p-space-sm rounded-xl bg-surface-container-high/40 flex items-center justify-between text-label-sm font-label-sm">
              <div>
                <span className="text-outline block">Route &amp; Corridor:</span>
                <span className="text-on-surface font-semibold truncate block max-w-[130px]">{selectedTransfer.distance}</span>
              </div>
              <div>
                <span className="text-outline block">Courier:</span>
                <span className="text-on-surface font-semibold truncate block max-w-[110px]">{selectedTransfer.courier}</span>
              </div>
              <div>
                <span className="text-outline block">Transit Dispatch:</span>
                <span className="text-primary font-semibold">MOU Pool Verified</span>
              </div>
            </div>

            {/* Audit Trail / Stepper Component */}
            <div className="flex flex-col gap-space-xs mt-1">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Verification Ledger Steps</span>
              <div className="flex flex-col gap-3 relative mt-2 pl-4">
                {/* Continuous Timeline Vertical Guide */}
                <div className="absolute left-1.5 top-2 bottom-3 w-0.5 bg-surface-container-high"></div>

                {selectedTransfer.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 relative ${
                      step.done ? '' : step.active ? '' : 'opacity-60'
                    }`}
                  >
                    {step.done ? (
                      <span className="w-3.5 h-3.5 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shrink-0 ring-4 ring-surface-container-lowest -ml-2 z-10">
                        <span className="material-symbols-outlined text-[10px]">check</span>
                      </span>
                    ) : step.active ? (
                      <span className="w-3.5 h-3.5 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 ring-4 ring-surface-container-lowest -ml-2 z-10">
                        <span className="w-1.5 h-1.5 rounded-full bg-surface-container-lowest"></span>
                      </span>
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full bg-outline-variant shrink-0 ring-4 ring-surface-container-lowest -ml-2 z-10"></span>
                    )}

                    <div className="flex flex-col">
                      <span className={`font-label-sm text-label-sm ${step.active ? 'text-primary font-bold' : 'text-on-surface font-semibold'}`}>
                        {step.label}
                      </span>
                      <span className="font-body-sm text-body-sm text-outline">
                        {step.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Sticky Action Buttons */}
            <div className="mt-space-sm pt-space-md flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleApproveTransfer(selectedTransfer.id)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-[0_4px_16px_rgba(0,97,148,0.35)] hover:bg-primary-container transition-all active:scale-[0.99] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">verified_user</span>
                <span>Approve Transfer &amp; Dispatch</span>
              </button>
              <button
                type="button"
                onClick={() => handleRejectTransfer(selectedTransfer.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-container-low text-on-surface-variant font-label-md text-label-md hover:bg-error-container hover:text-on-error-container transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
                <span>Reject / Request Modification</span>
              </button>
              <p className="font-body-sm text-body-sm text-outline text-center mt-1">
                Action will be cryptographically logged to District 4 Healthcare Shared Ledger.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* INITIATE EMERGENCY TRANSFER MODAL */}
      {isInitiateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-surface-container-high space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">add_circle</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Initiate Emergency Transfer</h3>
                  <p className="text-xs text-secondary">District 4 Mutual Aid Redistribution</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInitiateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsInitiateModalOpen(false);
                if (onToast) onToast('Emergency Transfer Request Broadcast to District 4 Coordinators!');
              }}
              className="space-y-3 pt-2"
            >
              <div>
                <label className="block text-xs font-semibold text-outline uppercase mb-1">Target SKU / Medication</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol 500mg IV or Packed RBC (O-)"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high text-on-surface text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-outline uppercase mb-1">Quantity Needed</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500 vials"
                    className="w-full px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high text-on-surface text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-outline uppercase mb-1">Destination Hospital</label>
                  <select className="w-full px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high text-on-surface text-sm focus:outline-none focus:border-primary">
                    <option>Valley Trauma Center</option>
                    <option>MedCare General</option>
                    <option>North District Clinic</option>
                    <option>Central Children's Hospital</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-outline uppercase mb-1">Clinical Urgency Justification</label>
                <textarea
                  rows="3"
                  required
                  placeholder="State clinical rationale (surge index, active mass-casualty code, zero-stockout ETA)..."
                  className="w-full px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high text-on-surface text-sm focus:outline-none focus:border-primary resize-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsInitiateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-secondary text-sm font-semibold hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-md hover:bg-primary-container transition-all cursor-pointer"
                >
                  Dispatch Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPORT MANIFEST MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-container-high space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-tertiary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">ios_share</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Export Transfer Manifest</h3>
                  <p className="text-xs text-secondary">DSCSA Title 21 CFR Part 11 Certified</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-sm text-on-surface-variant">
              Generate a cryptographically signed PDF / CSV manifest containing chain-of-custody signatures, lot serializations, and cold-chain temperature telemetry logs for FDA compliance.
            </p>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 p-3 rounded-xl bg-surface-container-low cursor-pointer">
                <input type="radio" name="exportFormat" defaultChecked className="text-primary focus:ring-0" />
                <span className="text-xs font-semibold text-on-surface">Cryptographic PDF Manifest (with QR chain-of-custody)</span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-xl bg-surface-container-low cursor-pointer">
                <input type="radio" name="exportFormat" className="text-primary focus:ring-0" />
                <span className="text-xs font-semibold text-on-surface">CSV Data Ledger (DSCSA Interoperability Schema)</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-secondary text-sm font-semibold hover:bg-surface-container cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsExportModalOpen(false);
                  if (onToast) onToast('Transfer Manifest PDF Generated & Signed!');
                }}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-md hover:bg-primary-container transition-all cursor-pointer"
              >
                Download Manifest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
