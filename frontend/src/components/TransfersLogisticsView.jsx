import React, { useState } from 'react';

export function TransfersLogisticsView({ onToast }) {
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [selectedFacility, setSelectedFacility] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [isInitiateModalOpen, setIsInitiateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState('TRX-9402');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
      origin: 'MedCare General',
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
      origin: 'MedCare General',
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
        { label: 'Clinical Pharmacy Authorization', time: 'Oct 28, 08:05 • Approved by MedCare Lead', done: true },
        { label: 'Cold Chain Courier Dispatch', time: 'Staged at Bay 3', active: true },
        { label: 'Receipt & Cryptographic Ledgering', time: 'Pending' }
      ]
    },
    {
      id: 'TRX-9388',
      column: 'in-transit',
      skuName: 'Packed Red Blood Cells (O-)',
      subtitle: 'Cold Container Unit CPDA-1',
      quantity: '12 Units',
      regime: 'Cold Chain 3.8°C Steady',
      regimeType: 'cold',
      origin: 'Metro Regional Blood Bank',
      destination: 'MedCare Trauma Unit',
      distance: '6.2 km',
      eta: '12m',
      courier: 'Van #04 (Rapid Dispatch)',
      score: 99,
      scoreLabel: 'Trauma Code O-Neg',
      scoreType: 'critical',
      timeAgo: 'Live GPS',
      batch: '#LOT-00912-B',
      expiry: 'Nov 02, 2024',
      justification: 'Multi-casualty highway collision trauma activation in Emergency Room Bay 4.',
      progress: 65,
      steps: [
        { label: 'Emergency Trauma Call Request', time: 'Oct 28, 07:12', done: true },
        { label: 'Blood Center Rapid Match', time: 'Oct 28, 07:18', done: true },
        { label: 'Cold-Chain Validation Passed (3.8°C)', time: 'Oct 28, 07:22', done: true },
        { label: 'En-Route with Live GPS Beacon', time: 'Oct 28, 07:25 • Active', active: true },
        { label: 'ER Reception & Transfusion Lock', time: 'ETA 12m' }
      ]
    },
    {
      id: 'TRX-9372',
      column: 'completed',
      skuName: 'Remdesivir 100mg Vials',
      subtitle: 'Lyophilized Powder for Infusion',
      quantity: '180 vials',
      regime: 'Ambient',
      regimeType: 'ambient',
      origin: 'MedCare General',
      destination: "Central Children's",
      distance: '12.5 km',
      eta: 'Received 10:14 AM',
      courier: 'Delivered',
      score: 85,
      scoreLabel: 'Pediatric Replenishment',
      scoreType: 'routine',
      timeAgo: 'Done',
      batch: '#LOT-55190-R',
      expiry: 'Feb 15, 2025',
      justification: 'Replenished post-outbreak pediatric reserve buffer.',
      steps: [
        { label: 'Requisition Dispatched', time: 'Oct 27, 16:30', done: true },
        { label: 'Bilateral MOU Clearance', time: 'Oct 27, 17:00', done: true },
        { label: 'Pharmacy Transfer Signed', time: 'Oct 27, 17:45', done: true },
        { label: 'Transit Completed', time: 'Oct 28, 09:30', done: true },
        { label: 'Cryptographic Ledger Reconciled', time: 'Oct 28, 10:14', done: true }
      ]
    }
  ]);

  const selectedTransfer = transfers.find(t => t.id === selectedTransferId) || transfers[0];

  const columns = [
    { id: 'proposed', title: 'Proposed', subtitle: 'AI surge forecast', totalVal: '540 units', countBadge: 'bg-surface-container-high text-on-surface-variant' },
    { id: 'under-review', title: 'Under Review', subtitle: 'Pending director sign-off', totalVal: '390 units', countBadge: 'bg-primary text-on-primary', highlight: true },
    { id: 'approved', title: 'Approved', subtitle: 'Awaiting courier dispatch', totalVal: '410 units', countBadge: 'bg-surface-container-high text-on-surface-variant' },
    { id: 'in-transit', title: 'In Transit', subtitle: 'Active cold chain GPS', totalVal: '790 units', countBadge: 'bg-tertiary-fixed text-on-tertiary-fixed' },
    { id: 'completed', title: 'Completed', subtitle: 'Reconciled to ledger', totalVal: '1,340 units', countBadge: 'bg-surface-container-high text-on-surface-variant' }
  ];

  const filteredTransfers = transfers.filter(t => {
    if (selectedFacility !== 'All' && t.origin !== selectedFacility && t.destination !== selectedFacility) return false;
    if (selectedPriority !== 'All' && t.scoreType !== selectedPriority) return false;
    return true;
  });

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
    <div className="flex flex-col w-full pb-16 animate-fadeIn space-y-6">
      {/* 1. TOP HEADER & PRIMARY ACTIONS */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
            <span className="text-primary font-bold">Clinical Operations</span>
            <span className="text-outline text-xs">/</span>
            <span className="font-semibold text-on-surface-variant">Transfers &amp; Logistics</span>
            <span className="text-outline text-xs">/</span>
            <span className="text-primary font-semibold">Regional Redistribution Hub</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
            Redistribution Hub: Stock Movement &amp; MOU Logistics
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl leading-relaxed">
            Autonomous and peer-to-peer hospital stock rebalancing across Metropolitan District 4 mutual-aid facilities.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* View Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-surface-container-high shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-surface-container-lowest text-on-surface shadow-xs font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className={`material-symbols-outlined text-[16px] ${viewMode === 'kanban' ? 'text-primary' : 'text-outline'}`}>view_kanban</span>
              <span>Kanban Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-surface-container-lowest text-on-surface shadow-xs font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className={`material-symbols-outlined text-[16px] ${viewMode === 'list' ? 'text-primary' : 'text-outline'}`}>format_list_bulleted</span>
              <span>List View</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-xs hover:bg-surface-container-high transition-all cursor-pointer border border-surface-container-high/60"
          >
            <span className="material-symbols-outlined text-[18px] text-outline">ios_share</span>
            <span>Export Manifest</span>
          </button>

          <button
            type="button"
            onClick={() => setIsInitiateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md shadow-md hover:bg-primary-container transition-all active:scale-95 cursor-pointer font-semibold"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Initiate Transfer</span>
          </button>
        </div>
      </div>

      {/* 2. OPERATIONAL KPI RIBBON */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-xs border border-surface-container-high/60 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Active Reallocations</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-headline-lg text-headline-lg font-bold text-on-surface">18 Transfers</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-fixed/40 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">swap_horiz</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
            <span>Total Volume</span>
            <span className="font-semibold text-on-surface font-mono">2,485 Units</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-xs border border-surface-container-high/60 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">In Transit Now</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-headline-lg text-headline-lg font-bold text-on-surface">6 Convoys</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-tertiary-fixed/40 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[22px]">local_shipping</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
            <span>Schedule Health</span>
            <span className="font-semibold text-tertiary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> 100% On Schedule
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-xs border border-surface-container-high/60 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Avg Fulfillment Time</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-headline-lg text-headline-lg font-bold text-on-surface">48 mins</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[22px]">timer</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
            <span>District SLA (&lt; 90m)</span>
            <span className="font-semibold text-primary font-mono">-42m Delta</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-xs border border-surface-container-high/60 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Prevented Stockouts</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-headline-lg text-headline-lg font-bold text-on-surface">12 Units</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-error-container/60 flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-[22px]">shield</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
            <span>Critical Patients Protected</span>
            <span className="font-semibold text-on-surface">1,240 Patients</span>
          </div>
        </div>
      </div>

      {/* 3. OPERATIONAL FILTER STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-surface-container-low border border-surface-container-high/40">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 text-xs font-semibold text-outline uppercase tracking-wider">Filters:</span>

          {/* Facility Filter */}
          <div className="relative">
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              aria-label="Filter transfers by facility"
              className="appearance-none flex items-center gap-1.5 pl-8 pr-7 py-1.5 rounded-xl bg-surface-container-lowest text-on-surface text-xs font-medium shadow-xs cursor-pointer hover:bg-surface-container-high transition-colors border border-surface-container-high/60 outline-none"
            >
              <option value="All">Facility: All 6 Centers</option>
              <option value="MedCare General">MedCare General</option>
              <option value="Valley Trauma Center">Valley Trauma Center</option>
              <option value="St. Jude Regional">St. Jude Regional</option>
              <option value="North District Clinic">North District Clinic</option>
              <option value="Central Children's">Central Children's</option>
              <option value="Highland Memorial">Highland Memorial</option>
            </select>
            <span className="material-symbols-outlined text-[15px] text-primary absolute left-2.5 top-2 pointer-events-none">domain</span>
            <span className="material-symbols-outlined text-[14px] text-outline absolute right-2 top-2 pointer-events-none">expand_more</span>
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              aria-label="Filter transfers by priority level"
              className="appearance-none flex items-center gap-1.5 pl-8 pr-7 py-1.5 rounded-xl bg-surface-container-lowest text-on-surface text-xs font-medium shadow-xs cursor-pointer hover:bg-surface-container-high transition-colors border border-surface-container-high/60 outline-none"
            >
              <option value="All">Priority: All Levels</option>
              <option value="critical">Critical Surge (&gt;90)</option>
              <option value="routine">Routine Rebalance</option>
            </select>
            <span className="material-symbols-outlined text-[15px] text-error absolute left-2.5 top-2 pointer-events-none">flag</span>
            <span className="material-symbols-outlined text-[14px] text-outline absolute right-2 top-2 pointer-events-none">expand_more</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-semibold">
            {filteredTransfers.length} Active Manifests
          </span>
        </div>
      </div>

      {/* 4. WORKSPACE CONTAINER */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start w-full">
          {columns.map((col) => {
            const colTransfers = filteredTransfers.filter((t) => t.column === col.id);
            const count = colTransfers.length;

            return (
              <div
                key={col.id}
                className={`flex flex-col gap-3 bg-surface-container-low/60 p-3.5 rounded-2xl min-h-[640px] border ${
                  col.highlight ? 'border-primary/40 ring-1 ring-primary/20' : 'border-surface-container-high/50'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-1 border-b border-surface-container-high/40">
                  <div className="flex items-center gap-2">
                    <span className="font-label-md text-label-md text-on-surface font-bold">{col.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.countBadge}`}>
                      {count}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-outline font-mono">{col.totalVal}</span>
                </div>

                <p className="text-[11px] text-on-surface-variant leading-tight">{col.subtitle}</p>

                {/* Cards Container */}
                <div className="flex flex-col gap-3 flex-1">
                  {colTransfers.map((item) => {
                    const isSelected = selectedTransferId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedTransferId(item.id);
                          setIsDrawerOpen(true);
                        }}
                        className={`p-3.5 rounded-xl bg-surface-container-lowest transition-all cursor-pointer flex flex-col gap-2.5 relative border ${
                          isSelected
                            ? 'border-primary shadow-md ring-2 ring-primary/20'
                            : 'border-surface-container-high/60 shadow-xs hover:shadow-md hover:border-primary/40'
                        }`}
                      >
                        {/* Top ID & Live status */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-primary">#{item.id}</span>
                          {item.timeAgo === 'Live GPS' ? (
                            <span className="flex items-center gap-1 text-[11px] text-tertiary font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping"></span> GPS Live
                            </span>
                          ) : item.column === 'completed' ? (
                            <span className="flex items-center gap-1 text-[11px] text-tertiary font-semibold">
                              <span className="material-symbols-outlined text-[13px]">check_circle</span> Done
                            </span>
                          ) : (
                            <span className="text-[11px] text-outline">{item.timeAgo}</span>
                          )}
                        </div>

                        {/* Title & Specs */}
                        <div>
                          <h4 className="font-label-md text-label-md text-on-surface font-bold leading-snug">{item.skuName}</h4>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="px-2 py-0.5 rounded bg-surface-container-high text-[11px] font-semibold text-on-surface">
                              {item.quantity}
                            </span>
                            {item.regimeType === 'cold' ? (
                              <span className="px-1.5 py-0.5 rounded bg-primary-fixed/40 text-[10px] text-on-primary-fixed flex items-center gap-0.5 font-semibold">
                                <span className="material-symbols-outlined text-[11px]">ac_unit</span> Cold Chain
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-secondary-fixed/50 text-[10px] text-on-secondary-fixed font-semibold">
                                Ambient
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar if in transit */}
                        {item.progress && (
                          <div className="flex flex-col gap-1 py-0.5">
                            <div className="flex justify-between text-[11px] text-on-surface-variant">
                              <span>{item.progress}% Completed</span>
                              <span className="font-semibold text-on-surface">ETA {item.eta}</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${item.progress}%` }}></div>
                            </div>
                          </div>
                        )}

                        {/* Route Indicator */}
                        <div className="p-2 rounded-lg bg-surface-container-low flex items-center justify-between text-[11px] text-on-surface-variant border border-surface-container-high/40">
                          <span className="truncate max-w-[44%] font-medium text-on-surface">{item.origin.split('(')[0].trim()}</span>
                          <span className="material-symbols-outlined text-[13px] text-primary shrink-0">arrow_forward</span>
                          <span className="truncate max-w-[44%] font-medium text-on-surface">{item.destination.split('(')[0].trim()}</span>
                        </div>

                        {/* Card Footer: Priority / ETA */}
                        <div className="flex items-center justify-between text-[11px] pt-0.5">
                          <span className={`text-[11px] font-bold ${item.scoreType === 'critical' ? 'text-error' : 'text-outline font-medium'}`}>
                            {item.scoreLabel}
                          </span>
                          <span className="text-outline font-medium">{item.distance} • {item.eta}</span>
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
        /* LIST VIEW TABLE */
        <div className="w-full bg-surface-container-lowest rounded-2xl shadow-xs border border-surface-container-high/60 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-container bg-surface-container-low/60 text-outline font-label-sm text-label-sm uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Manifest ID</th>
                <th className="py-3.5 px-4 font-semibold">Medication SKU</th>
                <th className="py-3.5 px-4 font-semibold">Origin ➔ Destination</th>
                <th className="py-3.5 px-4 font-semibold">Volume</th>
                <th className="py-3.5 px-4 font-semibold">Status Stage</th>
                <th className="py-3.5 px-4 font-semibold">Urgency</th>
                <th className="py-3.5 px-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container/60 font-body-sm text-body-sm">
              {filteredTransfers.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => {
                    setSelectedTransferId(item.id);
                    setIsDrawerOpen(true);
                  }}
                  className="hover:bg-surface-container-low/40 transition-colors cursor-pointer"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-primary">#{item.id}</td>
                  <td className="py-3.5 px-4 font-semibold text-on-surface">{item.skuName}</td>
                  <td className="py-3.5 px-4 text-on-surface-variant">
                    {item.origin} <span className="text-primary font-bold">➔</span> {item.destination}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-on-surface">{item.quantity}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface-variant capitalize">
                      {item.column.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-xs font-bold ${item.scoreType === 'critical' ? 'text-error' : 'text-outline font-medium'}`}>
                      {item.scoreLabel}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTransferId(item.id);
                        setIsDrawerOpen(true);
                      }}
                      className="px-3 py-1 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary text-xs font-semibold transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. SLIDE-OVER DETAIL DRAWER (OFFCANVAS) */}
      {isDrawerOpen && selectedTransfer && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => setIsDrawerOpen(false)}
          ></div>

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-surface-container-lowest shadow-2xl p-6 flex flex-col gap-4 overflow-y-auto border-l border-surface-container-high animate-slideInRight">
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-surface-container">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-outline font-semibold">Transfer Manifest</span>
                    <span className="px-2 py-0.5 rounded bg-primary-fixed text-primary font-mono font-bold text-xs">#{selectedTransfer.id}</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mt-1">Transfer Details</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="Close details"
                  className="w-8 h-8 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Status Alert */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-primary-fixed/20 border border-primary/20">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="text-xs font-bold text-on-primary-fixed uppercase tracking-wider">
                    {selectedTransfer.column === 'under-review' ? 'UNDER REVIEW • ACTION REQUIRED' : selectedTransfer.column.replace('-', ' ')}
                  </span>
                </div>
                <span className="text-xs font-semibold text-primary">SLA: 18m left</span>
              </div>

              {/* SKU & Batch Specifics */}
              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2 border border-surface-container-high/60">
                <span className="text-xs uppercase text-outline font-bold">Stock Item Specification</span>
                <h4 className="font-bold text-on-surface text-base">{selectedTransfer.skuName}</h4>
                <div className="grid grid-cols-2 gap-2 mt-1 pt-2 text-xs border-t border-surface-container-high/50">
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
                <div className="mt-1 pt-2 flex flex-col gap-1 text-xs border-t border-surface-container-high/50">
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

              {/* AI Surge Justification */}
              <div className="p-4 rounded-xl bg-secondary-container/30 flex flex-col gap-2 border border-secondary-container/60">
                <div className="flex items-center gap-2 text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-[18px] text-primary">neurology</span>
                  <span className="text-xs font-bold uppercase tracking-wider">AI Epidemiologic Surge Match</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {selectedTransfer.justification}
                </p>
                {selectedTransfer.impact && (
                  <div className="flex items-center gap-1.5 pt-1 text-tertiary text-xs font-semibold">
                    <span className="material-symbols-outlined text-[15px]">verified</span>
                    <span>{selectedTransfer.impact}</span>
                  </div>
                )}
              </div>

              {/* Corridor Telemetry */}
              <div className="p-3 rounded-xl bg-surface-container-high/40 flex items-center justify-between text-xs">
                <div>
                  <span className="text-outline block">Route:</span>
                  <span className="text-on-surface font-semibold">{selectedTransfer.distance}</span>
                </div>
                <div>
                  <span className="text-outline block">Courier:</span>
                  <span className="text-on-surface font-semibold">{selectedTransfer.courier}</span>
                </div>
                <div>
                  <span className="text-outline block">Dispatch Pool:</span>
                  <span className="text-primary font-semibold">MOU Verified</span>
                </div>
              </div>

              {/* Stepper */}
              <div className="flex flex-col gap-2 mt-1">
                <span className="text-xs uppercase tracking-wider text-outline font-bold">Verification Ledger Steps</span>
                <div className="flex flex-col gap-3 relative mt-1 pl-4">
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
                        <span className={`text-xs ${step.active ? 'text-primary font-bold' : 'text-on-surface font-semibold'}`}>
                          {step.label}
                        </span>
                        <span className="text-[11px] text-outline">
                          {step.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto pt-4 flex flex-col gap-2 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => {
                    handleApproveTransfer(selectedTransfer.id);
                    setIsDrawerOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md hover:bg-primary-container transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span>Approve Transfer &amp; Dispatch</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleRejectTransfer(selectedTransfer.id);
                    setIsDrawerOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-container-low text-on-surface-variant font-semibold text-xs hover:bg-error-container hover:text-on-error-container transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  <span>Reject / Request Modification</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INITIATE EMERGENCY TRANSFER MODAL */}
      {isInitiateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-surface-container-high space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">add_circle</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Initiate Transfer</h3>
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
                const form = e.target;
                const newTrx = {
                  id: `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
                  column: 'under-review',
                  skuName: form.sku.value,
                  subtitle: 'Manual Requisition',
                  quantity: form.quantity.value,
                  regime: form.regime.value,
                  regimeType: form.regime.value.toLowerCase().includes('cold') ? 'cold' : 'ambient',
                  origin: 'MedCare General',
                  destination: form.destination.value,
                  distance: '14.2 km',
                  eta: '30m',
                  courier: 'Staged Courier',
                  score: 90,
                  scoreLabel: 'Urgent Borrow',
                  scoreType: 'critical',
                  timeAgo: 'Just now',
                  batch: '#LOT-NEW-01',
                  expiry: 'Dec 2025',
                  justification: form.reason.value || 'Clinical emergency request under regional MOU framework.',
                  steps: [
                    { label: 'Manual Requisition Created', time: 'Just now', done: true },
                    { label: 'Director Authorization', time: 'Awaiting', active: true },
                    { label: 'Dispatch', time: 'Pending' }
                  ]
                };
                setTransfers((prev) => [newTrx, ...prev]);
                setIsInitiateModalOpen(false);
                if (onToast) onToast(`Transfer ${newTrx.id} created successfully!`);
              }}
              className="space-y-4 pt-2"
            >
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Medication SKU</label>
                <select name="sku" required className="w-full p-2.5 rounded-xl bg-surface-container-low text-xs border border-surface-container-high text-on-surface">
                  <option value="Paracetamol 500mg IV Infusion">Paracetamol 500mg IV Infusion</option>
                  <option value="Propofol 10mg/mL Emulsion">Propofol 10mg/mL Emulsion</option>
                  <option value="Ceftriaxone 1g Powder">Ceftriaxone 1g Powder</option>
                  <option value="Packed Red Blood Cells (O-)">Packed Red Blood Cells (O-)</option>
                  <option value="Norepinephrine 4mg/4mL">Norepinephrine 4mg/4mL</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Quantity</label>
                  <input name="quantity" type="text" required placeholder="e.g. 200 vials" className="w-full p-2.5 rounded-xl bg-surface-container-low text-xs border border-surface-container-high text-on-surface" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Storage Regime</label>
                  <select name="regime" className="w-full p-2.5 rounded-xl bg-surface-container-low text-xs border border-surface-container-high text-on-surface">
                    <option value="Ambient Regulated">Ambient Regulated</option>
                    <option value="Cold Chain 2-8°C">Cold Chain 2-8°C</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Destination Facility</label>
                <select name="destination" required className="w-full p-2.5 rounded-xl bg-surface-container-low text-xs border border-surface-container-high text-on-surface">
                  <option value="Valley Trauma Center">Valley Trauma Center</option>
                  <option value="St. Jude Regional">St. Jude Regional</option>
                  <option value="North District Clinic">North District Clinic</option>
                  <option value="Central Children's">Central Children's</option>
                  <option value="Highland Memorial">Highland Memorial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Clinical Justification</label>
                <textarea name="reason" rows="2" placeholder="State reason for emergency stock requisition..." className="w-full p-2.5 rounded-xl bg-surface-container-low text-xs border border-surface-container-high text-on-surface"></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container">
                <button type="button" onClick={() => setIsInitiateModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-outline hover:text-on-surface">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container shadow-md">Create Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPORT MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-6 shadow-2xl border border-surface-container-high space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Export Transfer Manifest</h3>
              <button type="button" onClick={() => setIsExportModalOpen(false)} className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <p className="text-xs text-secondary">Export cryptographic transfer ledger verified under DSCSA Title 21 CFR Part 11.</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsExportModalOpen(false);
                  if (onToast) onToast('Transfer manifest exported as CSV.');
                }}
                className="w-full p-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center justify-between transition-colors cursor-pointer border border-surface-container-high"
              >
                <span>Export as CSV (.csv)</span>
                <span className="material-symbols-outlined text-primary text-[18px]">download</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsExportModalOpen(false);
                  if (onToast) onToast('Transfer manifest exported as Signed PDF.');
                }}
                className="w-full p-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center justify-between transition-colors cursor-pointer border border-surface-container-high"
              >
                <span>Export as Signed PDF (.pdf)</span>
                <span className="material-symbols-outlined text-primary text-[18px]">picture_as_pdf</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
