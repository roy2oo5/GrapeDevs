import React, { useState } from 'react';

export function MOUPartnersView({ onToast }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRadius, setSelectedRadius] = useState('all');
  const [minQty, setMinQty] = useState('0');
  const [activeRegime, setActiveRegime] = useState('all');
  const [activeMOUOnly, setActiveMOUOnly] = useState(true);
  const [sortBy, setSortBy] = useState('expiry');
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  // Modals state
  const [selectedTransferItem, setSelectedTransferItem] = useState(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isPostSurplusModalOpen, setIsPostSurplusModalOpen] = useState(false);
  const [isGovernanceModalOpen, setIsGovernanceModalOpen] = useState(false);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [inspectItem, setInspectItem] = useState(null);
  const [isDispatching, setIsDispatching] = useState(false);

  // Marketplace items dataset
  const [listings, setListings] = useState([
    {
      id: 'LST-001',
      drugName: 'Paracetamol 500mg IV Infusion',
      subtitle: '100ml Infusion Bottle • Analgesic / Antipyretic',
      category: 'analgesic',
      mouTier: 'MOU Level 1: Full Swap',
      surgeMatch: '+28% Surge Match',
      storageRegime: 'Ambient Regulated (15–25°C)',
      regimeType: 'ambient',
      offeringNode: 'St. Jude Regional Hospital',
      distanceKm: 12.4,
      distanceEta: '12.4 km (~22 mins staged)',
      lotQuantity: 450,
      unit: 'vials',
      packageInfo: '9 sealed cartons',
      expiration: 'Nov 24, 2024',
      daysRemaining: 27,
      isNearExpiry: true,
      costNote: '$65 courier cost pre-covered by District Pool',
      isRestricted: false,
      batchLot: '#LOT-99214-A',
      tempStatus: 'Ambient OK'
    },
    {
      id: 'LST-002',
      drugName: 'Propofol 10mg/mL Injectable',
      subtitle: '20ml Ampoules • General Anaesthetic',
      category: 'anesthetic',
      mouTier: 'MOU Level 1: Full Swap',
      telemetryBadge: '3.4°C Telemetry OK',
      storageRegime: 'Cold Chain (2–8°C Monitored)',
      regimeType: 'cold',
      offeringNode: 'Valley Trauma Center (Surgical)',
      distanceKm: 18.2,
      distanceEta: '18.2 km (~35 mins staged)',
      lotQuantity: 220,
      unit: 'ampoules',
      packageInfo: '11 cases (secure pack)',
      expiration: 'Dec 08, 2024',
      daysRemaining: 41,
      isNearExpiry: false,
      costNote: 'Validated Reefer Transport Unit Assigned',
      isRestricted: false,
      batchLot: '#LOT-44109-P',
      tempStatus: '3.4°C Telemetry OK'
    },
    {
      id: 'LST-003',
      drugName: 'Ceftriaxone 1g Powder',
      subtitle: 'Vial for Reconstitution • Broad Antibiotic',
      category: 'antibiotic',
      mouTier: 'MOU Level 1: Verified',
      surgeMatch: 'Epi-Urgent Match',
      isUrgent: true,
      storageRegime: 'Ambient (<25°C)',
      regimeType: 'ambient',
      offeringNode: 'North District Community Clinic',
      distanceKm: 8.6,
      distanceEta: '8.6 km (~16 mins staged)',
      lotQuantity: 600,
      unit: 'vials',
      packageInfo: 'Direct clinic surplus',
      expiration: 'Nov 18, 2024',
      daysRemaining: 21,
      isNearExpiry: true,
      costNote: 'Local courier en route via District Hub',
      isRestricted: false,
      batchLot: '#LOT-88120-C',
      tempStatus: 'Ambient (<25°C)'
    },
    {
      id: 'LST-004',
      drugName: 'Enoxaparin Sodium 40mg/0.4mL',
      subtitle: 'Prefilled Syringes • Anticoagulant LMWH',
      category: 'anticoagulant',
      mouTier: 'MOU Level 1: Verified',
      storageRegime: 'Ambient (15–25°C)',
      regimeType: 'ambient',
      offeringNode: 'Highland Mercy Medical Center',
      distanceKm: 24.5,
      distanceEta: '24.5 km (~42 mins staged)',
      lotQuantity: 380,
      unit: 'syringes',
      packageInfo: '38 retail boxes',
      expiration: 'Dec 15, 2024',
      daysRemaining: 48,
      isNearExpiry: false,
      costNote: 'Inter-hospital direct exchange courier ready',
      isRestricted: false,
      batchLot: '#LOT-77402-E',
      tempStatus: 'Ambient OK'
    },
    {
      id: 'LST-005',
      drugName: 'Remdesivir 100mg Lyophilized',
      subtitle: 'Antiviral Vials • Strategic National Buffer',
      category: 'antiviral',
      mouTier: 'Aggregate Visibility Only',
      storageRegime: 'Cold Chain (2–8°C Monitored)',
      regimeType: 'cold',
      offeringNode: 'Metro Bio-Defense Reserve',
      distanceKm: 31.0,
      distanceEta: '31.0 km away',
      lotQuantity: 180,
      unit: 'vials',
      packageInfo: 'Strategic stockpile reserve',
      expiration: 'Dec 02, 2024',
      daysRemaining: 35,
      isNearExpiry: false,
      costNote: 'Elevated Level 3 Biosecurity Courier',
      isRestricted: true,
      batchLot: '#LOT-55102-R',
      restrictionNote: 'MOU Upgrade Required: Current Level 2 compact permits aggregate visibility only. Antiviral requisition requires Level 3 Direct Rebalance Clearance.',
      tempStatus: 'Level 3 Vault Monitored'
    },
    {
      id: 'LST-006',
      drugName: 'Epinephrine 1mg/mL Auto-Injectors',
      subtitle: '0.3mg & 0.15mg Twin-Packs • Emergency Resus',
      category: 'emergency',
      mouTier: 'MOU Level 1: Verified',
      bufferBadge: 'Pediatric Buffer Optimal',
      storageRegime: 'Ambient Light-Protected (20–25°C)',
      regimeType: 'ambient',
      offeringNode: "Children's Specialty Health Center",
      distanceKm: 14.1,
      distanceEta: '14.1 km (~26 mins staged)',
      lotQuantity: 95,
      unit: 'units',
      packageInfo: 'Emergency stock rotation',
      expiration: 'Jan 10, 2025',
      daysRemaining: 74,
      isNearExpiry: false,
      costNote: 'District courier pre-authorized for immediate pickup',
      isRestricted: false,
      batchLot: '#LOT-22910-E',
      tempStatus: 'Light Protected 20-25°C'
    }
  ]);

  const toggleBookmark = (id) => {
    setBookmarkedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
    if (onToast) {
      onToast(bookmarkedIds.includes(id) ? 'Removed from Watchlist' : 'Saved to Watchlist');
    }
  };

  const handleRequestTransfer = (item) => {
    setSelectedTransferItem(item);
    setIsTransferModalOpen(true);
  };

  const handleConfirmTransfer = () => {
    setIsDispatching(true);
    setTimeout(() => {
      setIsDispatching(false);
      setIsTransferModalOpen(false);
      if (onToast) {
        onToast(`Transfer Dispatched for ${selectedTransferItem?.drugName}! Signed to District 4 Ledger.`);
      }
    }, 1200);
  };

  const filteredListings = listings.filter(item => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        item.drugName.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.offeringNode.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (selectedRadius !== 'all' && item.distanceKm > parseFloat(selectedRadius)) {
      return false;
    }

    if (minQty && item.lotQuantity < parseInt(minQty, 10)) {
      return false;
    }

    if (activeRegime === 'cold' && item.regimeType !== 'cold') return false;
    if (activeRegime === 'ambient' && item.regimeType !== 'ambient') return false;
    if (activeRegime === 'controlled' && item.category !== 'anesthetic') return false;

    if (activeMOUOnly && item.isRestricted) return false;

    return true;
  });

  return (
    <div className="flex flex-col w-full gap-space-lg animate-fadeIn">
      {/* Title & Operational Clearance Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-tertiary-container/15 text-tertiary font-label-sm text-label-sm font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
              District 4 Compact Active
            </span>
            <span className="font-label-sm text-label-sm text-outline">Protocol Rev. 2024.4</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Safe Surplus Network: Regional MOU Marketplace</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Decentralized peer-to-peer clinical inventory exchange under District 4 mutual-aid compact.</p>
        </div>
        <div className="flex items-center gap-space-sm self-start lg:self-center">
          <button
            type="button"
            onClick={() => setIsGovernanceModalOpen(true)}
            className="flex items-center gap-2 px-space-md py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">policy</span>
            MOU Network Map &amp; Governance
          </button>
          <button
            type="button"
            onClick={() => setIsPostSurplusModalOpen(true)}
            className="flex items-center gap-2 px-space-md py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_box</span>
            Post Surplus Lot
          </button>
        </div>
      </div>

      {/* KPI Summary Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {/* Stat 1 */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Active Surplus Pool</span>
            <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            </div>
          </div>
          <div className="mt-space-md flex flex-col">
            <span className="font-headline-lg text-headline-lg text-on-surface leading-tight">$412,800</span>
            <div className="flex items-center gap-1.5 mt-1 font-body-sm text-body-sm text-on-surface-variant">
              <span className="font-semibold text-primary">48 SKU listings</span>
              <span>across verified nodes</span>
            </div>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">MOU Certified Partners</span>
            <div className="w-8 h-8 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[20px]">handshake</span>
            </div>
          </div>
          <div className="mt-space-md flex flex-col">
            <span className="font-headline-lg text-headline-lg text-on-surface leading-tight">6 Facilities Synced</span>
            <div className="flex items-center gap-1.5 mt-1 font-body-sm text-body-sm text-tertiary">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              <span className="font-semibold">100% Interoperable (Level 1-3)</span>
            </div>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Avg Fulfillment Delta</span>
            <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-container">
              <span className="material-symbols-outlined text-[20px]">local_shipping</span>
            </div>
          </div>
          <div className="mt-space-md flex flex-col">
            <span className="font-headline-lg text-headline-lg text-on-surface leading-tight">38 mins</span>
            <div className="flex items-center gap-1.5 mt-1 font-body-sm text-body-sm text-on-surface-variant">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
              <span>Rapid Courier Staged (4 vans)</span>
            </div>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Waste Prevented (MTD)</span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary-container">
              <span className="material-symbols-outlined text-[20px]">eco</span>
            </div>
          </div>
          <div className="mt-space-md flex flex-col">
            <span className="font-headline-lg text-headline-lg text-on-surface leading-tight">$84,200</span>
            <div className="flex items-center gap-1.5 mt-1 font-body-sm text-body-sm text-tertiary">
              <span className="font-semibold">1,840 vials saved</span>
              <span className="text-on-surface-variant font-normal">from destruction</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Search & Filter Controller */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-md">
        {/* Search Bar */}
        <div className="flex items-center gap-space-sm bg-surface-container-low px-space-md py-2.5 rounded-xl">
          <span className="material-symbols-outlined text-outline text-[20px]">search</span>
          <input
            className="bg-transparent border-0 outline-none w-full font-body-md text-body-md text-on-surface placeholder:text-outline"
            placeholder="Search generic medicine, SKU, ATC code, or formulation..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-outline">
            <span>⌘K</span>
          </div>
        </div>

        {/* Filter Pills & Parameters */}
        <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
          <div className="flex flex-wrap items-center gap-space-sm">
            {/* Distance Pills */}
            <div className="flex items-center bg-surface-container-low p-1 rounded-xl">
              <span className="px-2 font-label-sm text-label-sm text-outline uppercase">Radius</span>
              {['15', '30', '50', 'all'].map((rad) => (
                <button
                  key={rad}
                  type="button"
                  onClick={() => setSelectedRadius(rad)}
                  className={`px-3 py-1 rounded-lg font-label-sm text-label-sm cursor-pointer transition-all ${
                    selectedRadius === rad
                      ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {rad === 'all' ? 'All (75 km)' : `< ${rad} km`}
                </button>
              ))}
            </div>

            {/* Min Qty Dropdown */}
            <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-xl font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container transition-colors">
              <span className="text-outline">Min Qty:</span>
              <select
                aria-label="Filter minimum quantity"
                value={minQty}
                onChange={(e) => setMinQty(e.target.value)}
                className="bg-transparent font-semibold text-on-surface border-none outline-none cursor-pointer"
              >
                <option value="0">All Quantities</option>
                <option value="50">≥ 50 units</option>
                <option value="100">≥ 100 units</option>
                <option value="250">≥ 250 units</option>
              </select>
            </div>

            {/* Storage Regime Selection */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveRegime(activeRegime === 'cold' ? 'all' : 'cold')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-label-sm text-label-sm transition-all cursor-pointer ${
                  activeRegime === 'cold'
                    ? 'bg-primary-fixed text-on-primary-fixed font-semibold'
                    : 'bg-surface-container-high text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[14px] text-primary">ac_unit</span>
                Cold Chain 2-8°C
              </button>
              <button
                type="button"
                onClick={() => setActiveRegime(activeRegime === 'ambient' ? 'all' : 'ambient')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-label-sm text-label-sm transition-all cursor-pointer ${
                  activeRegime === 'ambient'
                    ? 'bg-primary-fixed text-on-primary-fixed font-semibold'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                Ambient
              </button>
              <button
                type="button"
                onClick={() => setActiveRegime(activeRegime === 'controlled' ? 'all' : 'controlled')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-label-sm text-label-sm transition-all cursor-pointer ${
                  activeRegime === 'controlled'
                    ? 'bg-primary-fixed text-on-primary-fixed font-semibold'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                Controlled Substance
              </button>
            </div>

            {/* MOU State Filter Toggle */}
            <div
              onClick={() => setActiveMOUOnly(!activeMOUOnly)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                activeMOUOnly
                  ? 'bg-tertiary-fixed/30 text-on-tertiary-fixed-variant'
                  : 'bg-surface-container-low text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-tertiary text-[16px]">verified_user</span>
              <span className="font-label-sm text-label-sm font-semibold">Active MOU Only</span>
              {activeMOUOnly && <span className="material-symbols-outlined text-[14px]">check</span>}
            </div>
          </div>

          {/* Sorting Selector */}
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm text-outline">Sort by:</span>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-container-low font-label-sm text-label-sm text-on-surface">
              <select
                aria-label="Sort marketplace offers"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-semibold text-on-surface border-none outline-none cursor-pointer"
              >
                <option value="expiry">Surplus Expiry (Nearest)</option>
                <option value="distance">Distance (Closest)</option>
                <option value="quantity">Lot Quantity (Highest)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Marketplace Offer Cards Grid (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-lg">
        {filteredListings.map((item) => {
          const isBookmarked = bookmarkedIds.includes(item.id);

          if (item.isRestricted) {
            return (
              <div key={item.id} className="relative bg-surface-container-low rounded-xl shadow-sm flex flex-col justify-between overflow-hidden">
                <div className="p-space-lg flex flex-col gap-space-md relative z-20">
                  {/* Badges & Verification */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">lock</span>
                        {item.mouTier}
                      </span>
                    </div>
                    <span className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-outline">
                      <span className="material-symbols-outlined text-[18px]">lock</span>
                    </span>
                  </div>

                  {/* Drug Specification */}
                  <div className="flex flex-col opacity-75">
                    <span className="font-headline-sm text-headline-sm text-on-surface">{item.drugName}</span>
                    <span className="font-body-sm text-body-sm text-outline">{item.subtitle}</span>
                  </div>

                  {/* Informative MOU Restricted Banner */}
                  <div className="bg-surface-container-highest p-space-sm rounded-xl flex items-start gap-2">
                    <span className="material-symbols-outlined text-outline text-[18px] mt-0.5">info</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                      <strong className="text-on-surface font-semibold">MOU Upgrade Required:</strong> {item.restrictionNote}
                    </p>
                  </div>

                  {/* Storage & Facilities Detail */}
                  <div className="bg-surface-container p-space-sm rounded-xl flex flex-col gap-space-xs font-body-sm text-body-sm opacity-70">
                    <div className="flex items-center justify-between">
                      <span className="text-outline">Offering Node</span>
                      <span className="font-semibold text-on-surface truncate">{item.offeringNode}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-outline">Distance</span>
                      <span className="font-medium text-outline">{item.distanceEta}</span>
                    </div>
                  </div>

                  {/* Inventory Metrics */}
                  <div className="grid grid-cols-2 gap-space-sm pt-space-xs opacity-75">
                    <div className="flex flex-col bg-surface-container p-space-sm rounded-lg">
                      <span className="font-label-sm text-label-sm text-outline">Lot Quantity</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface">
                        {item.lotQuantity} <span className="font-label-sm text-label-sm text-outline font-normal">{item.unit}</span>
                      </span>
                    </div>
                    <div className="flex flex-col bg-surface-container p-space-sm rounded-lg">
                      <span className="font-label-sm text-label-sm text-outline">Expiration</span>
                      <span className="font-label-lg text-label-lg text-on-surface font-semibold">{item.expiration}</span>
                      <span className="font-body-sm text-body-sm text-outline">{item.daysRemaining} days</span>
                    </div>
                  </div>
                </div>

                {/* Action Footer (Locked Button) */}
                <div className="bg-surface-container-high px-space-lg py-space-md flex flex-col items-center justify-center gap-space-sm relative z-20">
                  <button
                    type="button"
                    onClick={() => {
                      if (onToast) onToast('MOU Elevation Request transmitted to District 4 Governance Board.');
                    }}
                    className="w-full py-2.5 px-space-md rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-dim font-label-md text-label-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                    MOU Upgrade Required (Request Elevation)
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={item.id} className="bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between overflow-hidden transition-all hover:shadow-md">
              <div className="p-space-lg flex flex-col gap-space-md">
                {/* Badges & Verification */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-tertiary-container/15 text-tertiary font-label-sm text-label-sm font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      {item.mouTier}
                    </span>
                    {item.surgeMatch && (
                      <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${
                        item.isUrgent ? 'bg-error-container text-on-error-container' : 'bg-primary-fixed text-on-primary-fixed-variant'
                      }`}>
                        {item.surgeMatch}
                      </span>
                    )}
                    {item.telemetryBadge && (
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">ac_unit</span>
                        {item.telemetryBadge}
                      </span>
                    )}
                    {item.bufferBadge && (
                      <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-semibold">
                        {item.bufferBadge}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleBookmark(item.id)}
                    aria-label={`Bookmark ${item.drugName}`}
                    className="w-7 h-7 rounded-lg bg-surface-container-low flex items-center justify-center text-outline hover:text-on-surface cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isBookmarked ? 'bookmark' : 'bookmark_border'}
                    </span>
                  </button>
                </div>

                {/* Drug Specification */}
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">{item.drugName}</span>
                  <span className="font-body-sm text-body-sm text-outline">{item.subtitle}</span>
                </div>

                {/* Storage & Facilities Detail */}
                <div className="bg-surface-container-low p-space-sm rounded-xl flex flex-col gap-space-xs font-body-sm text-body-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-outline">Storage Regime</span>
                    <span className={`font-medium ${item.regimeType === 'cold' ? 'text-primary flex items-center gap-1' : 'text-on-surface'}`}>
                      {item.regimeType === 'cold' && <span className="material-symbols-outlined text-[14px]">ac_unit</span>}
                      {item.storageRegime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-outline">Offering Node</span>
                    <span className="font-semibold text-on-surface truncate">{item.offeringNode}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-outline">Distance &amp; ETA</span>
                    <span className="font-medium text-primary">{item.distanceEta}</span>
                  </div>
                </div>

                {/* Inventory Metrics */}
                <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
                  <div className="flex flex-col bg-surface-container-low/50 p-space-sm rounded-lg">
                    <span className="font-label-sm text-label-sm text-outline">Lot Quantity</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface">
                      {item.lotQuantity} <span className="font-label-sm text-label-sm text-on-surface-variant font-normal">{item.unit}</span>
                    </span>
                    <span className="font-body-sm text-body-sm text-outline">{item.packageInfo}</span>
                  </div>
                  <div className="flex flex-col bg-surface-container-low/50 p-space-sm rounded-lg">
                    <span className="font-label-sm text-label-sm text-outline">Expiration</span>
                    <span className="font-label-lg text-label-lg text-on-surface font-semibold">{item.expiration}</span>
                    <span className={`font-body-sm text-body-sm font-medium ${item.isNearExpiry ? 'text-error' : 'text-outline'}`}>
                      {item.daysRemaining} days remaining
                    </span>
                  </div>
                </div>

                {/* Transit Info */}
                <div className="flex items-center gap-1.5 text-outline font-body-sm text-body-sm">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                  <span>{item.costNote}</span>
                </div>
              </div>

              {/* Action Footer */}
              <div className="bg-surface-container-low px-space-lg py-space-md flex items-center justify-between gap-space-sm">
                <button
                  type="button"
                  onClick={() => {
                    setInspectItem(item);
                    setIsInspectModalOpen(true);
                  }}
                  className="font-label-sm text-label-sm text-outline hover:text-on-surface transition-colors cursor-pointer"
                >
                  Inspect Lot Details
                </button>
                <button
                  type="button"
                  onClick={() => handleRequestTransfer(item)}
                  className="px-space-md py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  Request Transfer
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Regional Healthcare Accord Governance Banner */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg">
        <div className="flex items-start gap-space-md max-w-4xl">
          <div className="w-10 h-10 rounded-xl bg-surface-container-high flex-shrink-0 flex items-center justify-center text-primary mt-1">
            <span className="material-symbols-outlined text-[24px]">gavel</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-label-lg text-label-lg text-on-surface font-semibold">District 4 Inter-Hospital Logistics Accord (MOU-2024-D4)</span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface-variant font-medium">DSCSA Title II Compliant</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Peer-to-peer rebalances automatically trigger cryptographically sealed ownership transfers, automated legal indemnity waivers under Regional Compact Article 14, and real-time cold-chain courier tracking.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-space-sm flex-shrink-0 self-end lg:self-center">
          <button
            type="button"
            onClick={() => onToast && onToast('District 4 Inter-Hospital Logistics Accord PDF downloaded')}
            className="px-space-md py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
          >
            Download Accord PDF
          </button>
          <button
            type="button"
            onClick={() => onToast && onToast('MOU Distributed Audit Registry ledger verified')}
            className="px-space-md py-2 rounded-xl bg-primary-fixed hover:bg-primary-fixed-dim text-on-primary-fixed font-label-md text-label-md font-semibold transition-colors cursor-pointer"
          >
            Audit Registry (Ledger)
          </button>
        </div>
      </div>

      {/* REBALANCE REQUISITION / TRANSFER REQUEST MODAL */}
      {isTransferModalOpen && selectedTransferItem && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-space-md animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl max-w-lg w-full p-space-lg flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Rebalance Requisition</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 p-space-md bg-surface-container-low rounded-xl font-body-sm text-body-sm">
              <div className="flex justify-between">
                <span className="text-outline">Item:</span>
                <span className="font-semibold text-on-surface">{selectedTransferItem.drugName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Source Facility:</span>
                <span className="text-on-surface">{selectedTransferItem.offeringNode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Courier Tier:</span>
                <span className="text-tertiary font-medium">District Rapid Tier-1 (&lt; 45 mins)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Mutual Indemnity:</span>
                <span className="text-on-surface font-mono">D4-VERIFIED-TX-9021</span>
              </div>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              By authorizing this transfer, both parties consent to automated batch logging and temperature record syncing upon handover.
            </p>

            <div className="flex items-center justify-end gap-space-sm pt-space-xs">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-space-md py-2 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md cursor-pointer hover:bg-surface-container-high"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDispatching}
                onClick={handleConfirmTransfer}
                className={`px-space-md py-2 rounded-xl text-on-primary font-label-md text-label-md font-semibold transition-all cursor-pointer ${
                  isDispatching ? 'bg-tertiary' : 'bg-primary hover:bg-primary-container'
                }`}
              >
                {isDispatching ? 'Transfer Dispatched!' : 'Sign & Dispatch Courier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POST SURPLUS LOT MODAL */}
      {isPostSurplusModalOpen && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-space-md animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-space-lg flex flex-col gap-space-md shadow-2xl border border-surface-container-high">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">add_box</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Post Safe Surplus Lot</h3>
                  <p className="text-xs text-secondary">Offer verified buffer to District 4 Network</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPostSurplusModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsPostSurplusModalOpen(false);
                if (onToast) onToast('Surplus Lot published to Regional MOU Marketplace!');
              }}
              className="space-y-3 pt-2 font-body-sm"
            >
              <div>
                <label className="block text-xs font-semibold text-outline uppercase mb-1">Medication SKU / Formulation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol 500mg IV Infusion"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high text-on-surface text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-outline uppercase mb-1">Surplus Quantity</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 300"
                    className="w-full px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high text-on-surface text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-outline uppercase mb-1">Batch Lot Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. #LOT-99214-B"
                    className="w-full px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high text-on-surface text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-outline uppercase mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high text-on-surface text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-outline uppercase mb-1">Storage Condition</label>
                  <select className="w-full px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high text-on-surface text-sm focus:outline-none focus:border-primary">
                    <option>Ambient Regulated (15-25°C)</option>
                    <option>Cold Chain (2-8°C Monitored)</option>
                    <option>Deep Freeze (-20°C)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPostSurplusModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-secondary text-sm font-semibold hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-md hover:bg-primary-container transition-all cursor-pointer"
                >
                  Publish Surplus Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT LOT DETAILS MODAL */}
      {isInspectModalOpen && inspectItem && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-space-md animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-space-lg flex flex-col gap-space-md shadow-2xl border border-surface-container-high">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">verified</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">DSCSA Serialization Ledger</h3>
                  <p className="text-xs text-secondary">{inspectItem.batchLot}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInspectModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2 p-3 bg-surface-container-low rounded-xl text-xs font-body-sm text-on-surface">
              <div className="flex justify-between"><span className="text-outline">Item:</span><span className="font-semibold">{inspectItem.drugName}</span></div>
              <div className="flex justify-between"><span className="text-outline">Offering Center:</span><span>{inspectItem.offeringNode}</span></div>
              <div className="flex justify-between"><span className="text-outline">Lot Quantity:</span><span className="font-semibold">{inspectItem.lotQuantity} {inspectItem.unit}</span></div>
              <div className="flex justify-between"><span className="text-outline">Expiration:</span><span className="text-error font-medium">{inspectItem.expiration} ({inspectItem.daysRemaining}d)</span></div>
              <div className="flex justify-between"><span className="text-outline">Thermal Telemetry:</span><span className="text-tertiary font-semibold">{inspectItem.tempStatus}</span></div>
              <div className="flex justify-between"><span className="text-outline">FDA DSCSA Barcode:</span><span className="font-mono text-primary">0100367345892019</span></div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsInspectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-secondary text-sm font-semibold hover:bg-surface-container cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsInspectModalOpen(false);
                  handleRequestTransfer(inspectItem);
                }}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-md hover:bg-primary-container cursor-pointer"
              >
                Proceed to Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOU GOVERNANCE & NETWORK MAP MODAL */}
      {isGovernanceModalOpen && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-space-md animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full p-space-lg flex flex-col gap-space-md shadow-2xl border border-surface-container-high">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-tertiary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">policy</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">District 4 Mutual Aid Governance</h3>
                  <p className="text-xs text-secondary">Inter-Hospital Network Compact (6 Facilities Synced)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGovernanceModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-body-sm">
              <div className="p-3 bg-surface-container-low rounded-xl space-y-1">
                <div className="font-bold text-primary">Level 1: Peer Stock Swap</div>
                <p className="text-outline">Immediate autonomous rebalancing of safe surplus lots with pre-cleared indemnification.</p>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl space-y-1">
                <div className="font-bold text-tertiary">Level 2: Strategic Borrowing</div>
                <p className="text-outline">Cross-facility loans for surge defense with automated 14-day replenishment tracking.</p>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl space-y-1">
                <div className="font-bold text-amber-700">Level 3: Strategic Reserve (Biosecurity)</div>
                <p className="text-outline">Requires Chief Pharmacy / Clinical Director elevation for restricted national antidotes.</p>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl space-y-1">
                <div className="font-bold text-on-surface">Cold Chain Fleet Pool</div>
                <p className="text-outline">4 dedicated reefer vans with real-time GPS telemetry and SLA &lt; 45 mins.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsGovernanceModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-md hover:bg-primary-container cursor-pointer"
              >
                Close Governance Map
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
