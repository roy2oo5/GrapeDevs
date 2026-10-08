import React, { useState } from 'react';

export function InventorySKUsView({ onToast, onOpenReceiveShipment }) {
  const [expandedRows, setExpandedRows] = useState({ para: true });
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [batchForm, setBatchForm] = useState({
    sku_code: '',
    medicine_name: '',
    quantity: '',
    lot_number: '',
    expires_on: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [storageFilter, setStorageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activePin, setActivePin] = useState(null); // 'cold' | 'reorder' | 'transit' | 'quarantine' | null

  // Lot States for Paracetamol
  const [lots, setLots] = useState([
    {
      id: 'lot-1',
      code: '#LOT-99214-A',
      rfid: 'RFID: 0x9AF84-C',
      bin: 'Bin A-14-02',
      qty: '90 vials',
      exp: 'Exp: Nov 18, 2024',
      expNote: '18 days remaining',
      expColor: 'text-tertiary font-semibold',
      state: 'usable',
      stateLabel: 'Usable / Clear',
      stateClass: 'bg-tertiary-fixed/30 text-on-tertiary-fixed-variant',
      stateDot: 'bg-tertiary',
      stateIcon: null,
      destroyed: false
    },
    {
      id: 'lot-2',
      code: '#LOT-99214-B',
      rfid: 'RFID: 0x9AF84-D',
      bin: 'Bin A-14-03',
      qty: '35 vials',
      exp: 'Exp: Dec 04, 2024',
      expNote: '34 days remaining',
      expColor: 'text-on-surface-variant font-semibold',
      state: 'quarantined',
      stateLabel: 'Quarantined / Hold',
      stateClass: 'bg-secondary-fixed text-on-secondary-fixed',
      stateDot: null,
      stateIcon: 'lock',
      destroyed: false
    },
    {
      id: 'lot-3',
      code: '#LOT-98842-X',
      rfid: 'Excursion Alert',
      bin: 'Bin Q-HOLD-01',
      qty: '15 vials',
      exp: 'Exp: Oct 28, 2024',
      expNote: 'Expired / Compromised',
      expColor: 'text-error font-semibold',
      state: 'damaged',
      stateLabel: 'Damaged / Compromised',
      stateClass: 'bg-error-container text-on-error-container',
      stateDot: null,
      stateIcon: 'block',
      destroyed: false
    }
  ]);

  const toggleRow = (key) => {
    setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleQuarantineLot = (lotId, lotCode) => {
    setLots((prev) =>
      prev.map((l) =>
        l.id === lotId
          ? {
              ...l,
              state: 'quarantined',
              stateLabel: 'Quarantined / Hold',
              stateClass: 'bg-secondary-fixed text-on-secondary-fixed',
              stateDot: null,
              stateIcon: 'lock'
            }
          : l
      )
    );
    if (onToast) onToast(`Batch Quarantined: ${lotCode} moved to temporary isolation hold. Quality audit initiated.`);
  };

  const handleReleaseLot = (lotId, lotCode) => {
    setLots((prev) =>
      prev.map((l) =>
        l.id === lotId
          ? {
              ...l,
              state: 'usable',
              stateLabel: 'Usable / Clear',
              stateClass: 'bg-tertiary-fixed/30 text-on-tertiary-fixed-variant',
              stateDot: 'bg-tertiary',
              stateIcon: null
            }
          : l
      )
    );
    if (onToast) onToast(`Batch Released: ${lotCode} cleared for patient dispensing and OR requisition.`);
  };

  const handleMarkDamaged = (lotId, lotCode) => {
    setLots((prev) =>
      prev.map((l) =>
        l.id === lotId
          ? {
              ...l,
              state: 'damaged',
              stateLabel: 'Damaged / Compromised',
              stateClass: 'bg-error-container text-on-error-container',
              stateDot: null,
              stateIcon: 'block'
            }
          : l
      )
    );
    if (onToast) onToast(`Batch Compromised: ${lotCode} marked for quarantine disposal pursuant to hazardous protocol.`);
  };

  const handleLogDestruction = (lotId, lotCode) => {
    setLots((prev) => prev.map((l) => (l.id === lotId ? { ...l, destroyed: true } : l)));
    if (onToast) onToast(`Destruction Logged: Disposal protocol filed with DEA / State Pharmacy Board for ${lotCode}.`);
  };

  // SKU List
  const [skus, setSkus] = useState([
    {
      key: 'para',
      code: 'MED-PARA-500',
      depot: 'DEPOT-A04',
      name: 'Paracetamol 500mg IV Infusion',
      unit: '100ml vial',
      atc: 'ATC: N02BE01',
      storage: 'Ambient (15-25°C)',
      storageType: 'ambient',
      storageIcon: 'thermostat',
      stock: '140 vials',
      bufferPct: '18%',
      bufferColor: 'text-error font-bold',
      bufferBar: 'bg-error',
      inbound: '+600 vials',
      inboundSub: 'St. Jude Regional • ETA 45m',
      reorder: '350 vials',
      minSafety: '200',
      status: 'Critical Lead Time',
      statusClass: 'bg-error-container text-on-error-container',
      ping: true,
      category: 'Analgesics & Antipyretics'
    },
    {
      key: 'prop',
      code: 'MED-PROP-10M',
      depot: 'VAULT-CRYO-02',
      name: 'Propofol 10mg/mL Injectable Emulsion',
      unit: '20ml ampoule',
      atc: 'ATC: N01AX10',
      storage: 'Cold Chain (2-8°C • Monitored)',
      storageType: 'cold',
      storageIcon: 'ac_unit',
      stock: '28 ampoules',
      bufferPct: '32%',
      bufferColor: 'text-secondary font-bold',
      bufferBar: 'bg-secondary',
      inbound: '+150 ampoules',
      inboundSub: 'North District Logistics • ETA 3h 20m',
      reorder: '80 ampoules',
      minSafety: '50',
      status: 'Buffer Warning',
      statusClass: 'bg-secondary-fixed text-on-secondary-fixed',
      ping: false,
      category: 'Anaesthetics & Sedatives',
      subContent: 'Lot Breakdown: #LOT-PROP-881 (28 ampoules in Bin C-02-01, Exp: Jan 15, 2025). Temp Sensor #S-882 Active (4.1°C).'
    },
    {
      key: 'ceft',
      code: 'MED-CEFT-01G',
      depot: 'DEPOT-B11',
      name: 'Ceftriaxone 1g Powder for Injection',
      unit: 'Vial + Diluent',
      atc: 'ATC: J01DD04',
      storage: 'Ambient (<25°C)',
      storageType: 'ambient',
      storageIcon: 'thermostat',
      stock: '310 vials',
      bufferPct: '78%',
      bufferColor: 'text-tertiary font-bold',
      bufferBar: 'bg-tertiary',
      inbound: '+500 vials',
      inboundSub: 'PO #PO-8812 Scheduled',
      reorder: '250 vials',
      minSafety: '150',
      status: 'Optimal',
      statusClass: 'bg-tertiary-fixed/30 text-on-tertiary-fixed-variant',
      ping: false,
      category: 'Antibiotics & Anti-infectives',
      subContent: '2 verified lots in storage (LOT-CFT-100 and LOT-CFT-101). No deviations recorded. Next inspection due in 45 days.'
    },
    {
      key: 'enxr',
      code: 'MED-ENXR-40M',
      depot: 'DEPOT-C09',
      name: 'Enoxaparin Sodium 40mg/0.4mL Pre-filled Syringes',
      unit: 'LMWH Heparin',
      atc: 'ATC: B01AB05',
      storage: 'Ambient (15-25°C, do not freeze)',
      storageType: 'ambient',
      storageIcon: 'thermostat',
      stock: '420 syringes',
      bufferPct: '85%',
      bufferColor: 'text-tertiary font-bold',
      bufferBar: 'bg-tertiary',
      inbound: '0 units',
      inboundSub: 'No pending shipments',
      reorder: '200 syringes',
      minSafety: '120',
      status: 'Optimal',
      statusClass: 'bg-tertiary-fixed/30 text-on-tertiary-fixed-variant',
      ping: false,
      category: 'Cardiovascular',
      subContent: 'LOT-ENX-442-A (420 units, Exp: Feb 2026). All unit blisters intact.'
    },
    {
      key: 'sevo',
      code: 'MED-SEVO-250',
      depot: 'DEPOT-SURG-01',
      name: 'Sevoflurane 250ml Inhalation Liquid',
      unit: 'Volatile Anaesthetic',
      atc: 'ATC: N01AB08',
      storage: 'Ambient (<25°C)',
      storageType: 'ambient',
      storageIcon: 'thermostat',
      stock: '24 bottles',
      bufferPct: '22%',
      bufferColor: 'text-secondary font-bold',
      bufferBar: 'bg-secondary',
      inbound: '+40 bottles',
      inboundSub: 'St. Jude Express • ETA 1h 10m',
      reorder: '60 bottles',
      minSafety: '30',
      status: 'Reorder Now',
      statusClass: 'bg-secondary-fixed text-on-secondary-fixed',
      ping: false,
      category: 'Anaesthetics & Sedatives',
      subContent: 'LOT-SEV-99 (24 bottles in OR Pharmacy Satellite). Transfer order created for OR Suite 4.'
    },
    {
      key: 'epin',
      code: 'MED-EPIN-01M',
      depot: 'CRASH-CART-MAIN',
      name: 'Epinephrine 1mg/mL (1:1000) Auto-Injector',
      unit: 'Emergency / Resus',
      atc: 'ATC: C01CA24',
      storage: 'Light-sensitive Ambient',
      storageType: 'ambient',
      storageIcon: 'thermostat',
      stock: '85 units',
      bufferPct: 'Optimal (90%)',
      bufferColor: 'text-tertiary font-bold',
      bufferBar: 'bg-tertiary',
      inbound: '0 units',
      inboundSub: 'Adequate Reserve',
      reorder: '60 units',
      minSafety: '40',
      status: 'Optimal',
      statusClass: 'bg-tertiary-fixed/30 text-on-tertiary-fixed-variant',
      ping: false,
      category: 'Emergency & Critical Care',
      subContent: '85 units distributed across 6 Rapid Response Crash Carts and Main Emergency Stock. Lot #EPI-2024-X expires in 11 months.'
    }
  ]);

  const handleAddBatch = (event) => {
    event.preventDefault();
    const code = batchForm.sku_code.trim();
    const name = batchForm.medicine_name.trim();
    const unit = 'units';
    const quantity = Number(batchForm.quantity);
    const lotNumber = batchForm.lot_number.trim();
    const expiryDescription = batchForm.expires_on
      ? `Exp: ${new Date(`${batchForm.expires_on}T00:00:00`).toLocaleDateString()}`
      : 'Expiry not recorded';
    const key = `batch-${Date.now()}`;
    const sku = {
      key,
      code,
      depot: 'Current hospital',
      name,
      unit,
      atc: 'New inventory batch',
      storage: 'Ambient (15-25°C)',
      storageType: 'ambient',
      storageIcon: 'thermostat',
      stock: `${quantity} ${unit}`,
      bufferPct: 'New',
      bufferColor: 'text-primary font-bold',
      bufferBar: 'bg-primary',
      inbound: '0 units',
      inboundSub: 'No pending shipments',
      reorder: 'Not set',
      minSafety: 'Not set',
      status: 'New Batch',
      statusClass: 'bg-primary-fixed text-on-primary-fixed-variant',
      ping: false,
      category: 'New Inventory',
      subContent: `Lot ${lotNumber || 'not recorded'} • ${quantity} ${unit} on hand • ${expiryDescription}`,
    };

    setSkus((current) => [sku, ...current]);
    setExpandedRows((current) => ({ ...current, [key]: true }));
    setBatchForm({
      sku_code: '',
      medicine_name: '',
      quantity: '',
      lot_number: '',
      expires_on: '',
    });
    setIsAddBatchOpen(false);
    if (onToast) onToast(`Inventory batch added locally: ${code} (${quantity} ${unit}).`);
  };

  const filteredSKUs = skus.filter((item) => {
    if (searchQuery.trim()) {
      const match =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.atc.toLowerCase().includes(searchQuery.toLowerCase());
      if (!match) return false;
    }
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (storageFilter === 'cold' && item.storageType !== 'cold') return false;
    if (storageFilter === 'ambient' && item.storageType !== 'ambient') return false;
    if (activePin === 'cold' && item.storageType !== 'cold') return false;
    if (activePin === 'reorder' && item.status !== 'Critical Lead Time' && item.status !== 'Reorder Now' && item.status !== 'Buffer Warning') return false;
    if (activePin === 'transit' && item.inbound === '0 units') return false;
    return true;
  });

  return (
    <div className="flex flex-col w-full pb-12 animate-fadeIn">
      {/* Breadcrumb & Control Tower Operational Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md pb-space-lg">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
              Clinical Operations
            </span>
            <span className="text-outline text-xs">/</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
              Inventory Management
            </span>
          </div>

          <div className="flex items-baseline gap-space-sm mt-1">
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
              Inventory &amp; Supply Chain
            </h1>
            <span className="hidden md:inline-flex px-2 py-0.5 rounded-md bg-surface-container-high font-label-sm text-label-sm text-on-surface-variant font-semibold">
              DSCSA Ledger v4.19
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl leading-relaxed">
            Real-time SKU monitoring, temperature-regulated cold chain tracking, and lot-level batch verification across hospital nodes.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-space-sm flex-wrap xl:self-start">
          <button
            type="button"
            onClick={() => setIsAddBatchOpen(true)}
            className="flex items-center gap-2 px-space-md py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary transition-colors font-label-md text-label-md shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add Inventory</span>
          </button>
          <button
            type="button"
            onClick={() => onToast && onToast('Stock manifest exported (CSV & PDF).')}
            className="flex items-center gap-2 px-space-md py-2.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container-high text-on-surface transition-all font-label-md text-label-md shadow-sm active:scale-95 cursor-pointer border border-surface-container-high/60"
          >
            <span className="material-symbols-outlined text-[18px] text-outline">description</span>
            <span>Export Stock Manifest</span>
          </button>
        </div>
      </div>

      {isAddBatchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsAddBatchOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-inventory-title"
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-surface-container-high bg-surface-container-lowest p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="add-inventory-title" className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Add inventory batch
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Enter a batch record. This preview is stored in this screen only.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close add inventory form"
                onClick={() => setIsAddBatchOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-outline hover:bg-surface-container hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddBatch} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-on-surface">
                SKU code
                <input
                  required
                  maxLength={80}
                  value={batchForm.sku_code}
                  onChange={(event) => setBatchForm({ ...batchForm, sku_code: event.target.value })}
                  placeholder="IV-PARA-500"
                  className="h-10 rounded-lg border border-surface-container-high bg-surface-container-low px-3 font-normal"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-on-surface">
                Medicine name
                <input
                  required
                  maxLength={200}
                  value={batchForm.medicine_name}
                  onChange={(event) => setBatchForm({ ...batchForm, medicine_name: event.target.value })}
                  placeholder="Paracetamol 500mg IV"
                  className="h-10 rounded-lg border border-surface-container-high bg-surface-container-low px-3 font-normal"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-on-surface">
                Quantity
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={batchForm.quantity}
                  onChange={(event) => setBatchForm({ ...batchForm, quantity: event.target.value })}
                  placeholder="140"
                  className="h-10 rounded-lg border border-surface-container-high bg-surface-container-low px-3 font-normal"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-on-surface">
                Lot number
                <input
                  maxLength={100}
                  value={batchForm.lot_number}
                  onChange={(event) => setBatchForm({ ...batchForm, lot_number: event.target.value })}
                  placeholder="LOT-99214-A"
                  className="h-10 rounded-lg border border-surface-container-high bg-surface-container-low px-3 font-normal"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-on-surface">
                Expiration date
                <input
                  type="date"
                  value={batchForm.expires_on}
                  onChange={(event) => setBatchForm({ ...batchForm, expires_on: event.target.value })}
                  className="h-10 rounded-lg border border-surface-container-high bg-surface-container-low px-3 font-normal"
                />
              </label>
              <div className="flex justify-end gap-2 border-t border-surface-container pt-4 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setIsAddBatchOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-container"
                >
                  Add batch
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Summary KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md pb-space-lg">
        {/* Card 1 */}
        <div className="relative overflow-hidden p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between border border-surface-container-high/40">
          <div className="flex items-center justify-between pb-space-sm">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
              Total Active SKUs
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-on-surface font-bold">1,420</span>
            <span className="font-label-sm text-label-sm text-outline">SKUs Registered</span>
          </div>
          <div className="flex items-center gap-1.5 pt-space-xs mt-2">
            <span className="w-2 h-2 rounded-full bg-tertiary"></span>
            <span className="font-body-sm text-body-sm text-tertiary font-semibold">98.2%</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">in optimal buffer window</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-transparent opacity-40"></div>
        </div>

        {/* Card 2 */}
        <div className="relative overflow-hidden p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between border border-surface-container-high/40">
          <div className="flex items-center justify-between pb-space-sm">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
              Cold Chain Monitored
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary-container">
              <span className="material-symbols-outlined text-[18px]">ac_unit</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-on-surface font-bold">318</span>
            <span className="font-label-sm text-label-sm text-outline">Cryo / Refrigerated</span>
          </div>
          <div className="flex items-center gap-1.5 pt-space-xs mt-2">
            <span className="px-1.5 py-0.5 rounded bg-tertiary-fixed/30 text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">
              2°C - 8°C Strict
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Telemetry online (100%)</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-container to-transparent opacity-40"></div>
        </div>
      </div>

      {/* Filtration & Tactical Search Bar */}
      <div className="p-space-md rounded-2xl bg-surface-container-lowest shadow-sm mb-space-md flex flex-col gap-space-sm border border-surface-container-high/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          {/* Search input */}
          <div className="relative flex-1 max-w-2xl">
            <div className="flex items-center gap-space-sm px-space-md py-2.5 rounded-xl bg-surface-container-low text-on-surface focus-within:bg-surface-container-lowest focus-within:shadow-[0_0_0_2px_rgba(0,123,185,0.4)] transition-all border border-surface-container-high/50">
              <span className="material-symbols-outlined text-outline text-[20px]">search</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search generic or brand name, SKU code, ATC group..."
                className="w-full bg-transparent border-none outline-none font-body-md text-body-md text-on-surface placeholder:text-outline"
                type="text"
              />
              <kbd className="px-2 py-0.5 rounded bg-surface-container-high text-outline font-label-sm text-label-sm font-mono">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Dropdown Filters */}
          <div className="flex items-center gap-space-sm flex-wrap">
            {/* Category Selector */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container font-label-md text-label-md text-on-surface outline-none cursor-pointer transition-colors border border-surface-container-high/60"
              >
                <option value="all">All Categories</option>
                <option value="Antibiotics & Anti-infectives">Antibiotics &amp; Anti-infectives</option>
                <option value="Anaesthetics & Sedatives">Anaesthetics &amp; Sedatives</option>
                <option value="Analgesics & Antipyretics">Analgesics &amp; Antipyretics</option>
                <option value="Cardiovascular">Cardiovascular</option>
                <option value="Emergency & Critical Care">Emergency &amp; Critical Care</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-outline text-[16px] pointer-events-none">
                expand_more
              </span>
            </div>

            {/* Storage Selector */}
            <div className="relative">
              <select
                value={storageFilter}
                onChange={(e) => setStorageFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container font-label-md text-label-md text-on-surface outline-none cursor-pointer transition-colors border border-surface-container-high/60"
              >
                <option value="all">Storage: All</option>
                <option value="ambient">Ambient (15-25°C)</option>
                <option value="cold">Cold Chain (2-8°C)</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-outline text-[16px] pointer-events-none">
                expand_more
              </span>
            </div>

            {/* Status Selector */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container font-label-md text-label-md text-on-surface outline-none cursor-pointer transition-colors border border-surface-container-high/60"
              >
                <option value="all">Stock Status: All</option>
                <option value="optimal">Optimal</option>
                <option value="reorder">Reorder Required</option>
                <option value="low">Low Stock / Buffer Warning</option>
                <option value="critical">Critical Stockout Risk</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-outline text-[16px] pointer-events-none">
                expand_more
              </span>
            </div>

            {/* Density toggle */}
            <button
              type="button"
              onClick={() => onToast && onToast('Table column layout customized.')}
              className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-outline hover:text-on-surface transition-colors cursor-pointer border border-surface-container-high/60"
              title="Toggle Table View Columns"
            >
              <span className="material-symbols-outlined text-[18px]">view_column</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Tags */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider pr-1 font-semibold">
            Filter Pins:
          </span>
          <button
            type="button"
            onClick={() => setActivePin(activePin === 'cold' ? null : 'cold')}
            className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1.5 transition-colors cursor-pointer border ${
              activePin === 'cold'
                ? 'bg-primary-fixed text-on-primary-fixed font-bold border-primary'
                : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface border-surface-container-high/50'
            }`}
          >
            <span className="material-symbols-outlined text-[14px] text-primary">ac_unit</span>
            <span>Cold Chain Only</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePin(activePin === 'reorder' ? null : 'reorder')}
            className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1.5 transition-colors cursor-pointer border ${
              activePin === 'reorder'
                ? 'bg-error-container text-on-error-container font-bold border-error'
                : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface border-surface-container-high/50'
            }`}
          >
            <span className="material-symbols-outlined text-[14px] text-error">crisis_alert</span>
            <span>Below Reorder Point</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePin(activePin === 'transit' ? null : 'transit')}
            className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1.5 transition-colors cursor-pointer border ${
              activePin === 'transit'
                ? 'bg-secondary-fixed text-on-secondary-fixed font-bold border-secondary'
                : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface border-surface-container-high/50'
            }`}
          >
            <span className="material-symbols-outlined text-[14px] text-secondary">local_shipping</span>
            <span>Active Transit</span>
          </button>
          {activePin && (
            <button
              type="button"
              onClick={() => setActivePin(null)}
              className="text-xs text-primary hover:underline font-semibold ml-1 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main High-Density Master Pharmacist Data Table */}
      <div className="w-full rounded-2xl bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col border border-surface-container-high/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider border-b border-surface-container">
                <th className="py-3 px-4 w-12 text-center"></th>
                <th className="py-3 px-4 font-semibold">SKU &amp; Code</th>
                <th className="py-3 px-4 font-semibold min-w-[280px]">Generic Name &amp; Classification</th>
                <th className="py-3 px-4 font-semibold min-w-[190px]">Current Stock</th>
                <th className="py-3 px-4 font-semibold min-w-[180px]">Inbound Transit</th>
                <th className="py-3 px-4 font-semibold min-w-[140px]">Reorder Buffer</th>
                <th className="py-3 px-4 font-semibold min-w-[140px]">Status</th>
                <th className="py-3 px-4 text-right pr-6">Command</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container/60" id="inventoryTableBody">
              {filteredSKUs.map((sku) => {
                const isExpanded = !!expandedRows[sku.key];
                return (
                  <React.Fragment key={sku.key}>
                    {/* Master Row */}
                    <tr
                      onClick={() => toggleRow(sku.key)}
                      className={`group hover:bg-surface-container-low/50 transition-colors cursor-pointer ${
                        isExpanded ? 'bg-surface-container-low/30' : ''
                      }`}
                    >
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${
                            isExpanded ? 'rotate-90 text-primary' : 'text-outline group-hover:text-primary'
                          }`}
                        >
                          expand_more
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-semibold text-primary">{sku.code}</span>
                          <span className="font-body-sm text-body-sm text-outline">{sku.depot}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-label-lg text-label-lg text-on-surface font-semibold leading-tight">
                            {sku.name}
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface-variant font-medium">
                              {sku.unit}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-surface-container-high font-label-sm text-label-sm text-outline font-semibold">
                              {sku.atc}
                            </span>
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm font-medium">
                              <span className="material-symbols-outlined text-[13px] text-tertiary">{sku.storageIcon}</span>
                              {sku.storage}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-baseline justify-between">
                            <span className={`font-label-lg text-label-lg ${sku.bufferColor}`}>{sku.stock}</span>
                            <span className={`font-label-sm text-label-sm ${sku.bufferColor}`}>{sku.bufferPct} Buffer</span>
                          </div>
                          <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${sku.bufferBar}`} style={{ width: sku.bufferPct.replace(/[^0-9]/g, '') ? `${sku.bufferPct.replace(/[^0-9]/g, '')}%` : '50%' }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1">
                            {sku.inbound !== '0 units' && (
                              <span className="material-symbols-outlined text-secondary text-[15px]">local_shipping</span>
                            )}
                            {sku.inbound}
                          </span>
                          <span className="font-body-sm text-body-sm text-outline">{sku.inboundSub}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md text-on-surface font-medium">{sku.reorder}</span>
                          <span className="font-body-sm text-body-sm text-outline">Min safety: {sku.minSafety}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-label-sm font-semibold ${sku.statusClass}`}>
                          {sku.ping && <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>}
                          {sku.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onToast && onToast(`Opened SKU diagnostics for ${sku.name}`)}
                          className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
                          title="SKU Actions"
                        >
                          <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>
                      </td>
                    </tr>

                    {/* EXPANDED ROW CONTENT */}
                    {isExpanded && (
                      <tr className="bg-surface-container-lowest transition-all">
                        <td className="p-0" colSpan={8}>
                          <div className="py-4 px-6 bg-surface-container-low/40 border-y border-surface-container">
                            {sku.key === 'para' ? (
                              <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-sm border border-surface-container-high/50">
                                <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                                  <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[20px]">fact_check</span>
                                    <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface font-bold">
                                      Inventory Batches &amp; Lot Verification
                                    </span>
                                    <span className="font-body-sm text-body-sm text-outline hidden md:inline">
                                      • Lot Breakdown for Paracetamol 500mg IV (3 Active Batches on Depot Shelves)
                                    </span>
                                  </div>
                                  <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-medium">
                                    RFID Tagged • ISO 13485 Verified
                                  </span>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left">
                                    <thead>
                                      <tr className="text-outline font-label-sm text-label-sm uppercase tracking-wider bg-surface-container-low/60 rounded-lg">
                                        <th className="py-2.5 px-3 rounded-l-lg font-semibold">Batch / RFID Tag</th>
                                        <th className="py-2.5 px-3 font-semibold">Quantity on Hand</th>
                                        <th className="py-2.5 px-3 font-semibold">Manufacturing &amp; Expiry</th>
                                        <th className="py-2.5 px-3 rounded-r-lg font-semibold">Lot State</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-container-low">
                                      {lots.map((lot) => (
                                        <tr
                                          key={lot.id}
                                          className={`hover:bg-surface-container-low/20 transition-colors ${
                                            lot.destroyed ? 'opacity-35 pointer-events-none' : ''
                                          }`}
                                        >
                                          <td className="py-3 px-3">
                                            <div className="flex items-center gap-2">
                                              <span className="material-symbols-outlined text-tertiary text-[18px]">qr_code_2</span>
                                              <div className="flex flex-col">
                                                <span className="font-label-md text-label-md font-bold text-on-surface">{lot.code}</span>
                                                <span className="font-body-sm text-body-sm text-outline">{lot.rfid}</span>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="py-3 px-3">
                                            <span className="font-label-md text-label-md text-on-surface font-bold">{lot.qty}</span>
                                          </td>
                                          <td className="py-3 px-3">
                                            <div className="flex flex-col">
                                              <span className="font-body-md text-body-md text-on-surface">{lot.exp}</span>
                                              <span className={`font-label-sm text-label-sm ${lot.expColor}`}>{lot.expNote}</span>
                                            </div>
                                          </td>
                                          <td className="py-3 px-3">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${lot.stateClass}`}>
                                              {lot.stateDot && <span className={`w-1.5 h-1.5 rounded-full ${lot.stateDot}`}></span>}
                                              {lot.stateIcon && <span className="material-symbols-outlined text-[13px]">{lot.stateIcon}</span>}
                                              {lot.stateLabel}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 bg-surface-container-lowest rounded-xl shadow-sm text-on-surface-variant font-body-sm text-body-sm flex items-center justify-between border border-surface-container-high/50">
                                <span>{sku.subContent}</span>
                                <span className="font-mono text-xs text-outline">RFID-NODE-VERIFIED</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Pagination & Audit Footer */}
        <div className="p-space-md bg-surface-container-lowest flex flex-col md:flex-row items-center justify-between gap-space-md border-t border-surface-container">
          <div className="flex items-center gap-space-sm text-on-surface-variant font-body-sm text-body-sm">
            <span>
              Showing <strong className="text-on-surface font-semibold">1-{filteredSKUs.length}</strong> of{' '}
              <strong className="text-on-surface font-semibold">1,420</strong> registered pharmaceutical SKUs
            </span>
          </div>

          {/* Pagination Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-lg bg-primary text-on-primary font-label-md text-label-md flex items-center justify-center font-semibold"
            >
              1
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-lg hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center justify-center transition-colors cursor-pointer"
            >
              2
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-lg hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center justify-center transition-colors cursor-pointer"
            >
              3
            </button>
            <span className="px-1 text-outline font-label-md text-label-md">...</span>
            <button
              type="button"
              className="w-8 h-8 rounded-lg hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center justify-center transition-colors cursor-pointer"
            >
              71
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Regulatory Ledger & Compliance Verification Banner */}
      <div className="mt-space-md p-space-md rounded-2xl bg-surface-container-low/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md border border-surface-container-high/50">
        <div className="flex items-center gap-space-sm">
          <div className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
            <span className="material-symbols-outlined text-[22px]">policy</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-md text-label-md text-on-surface font-bold">
              Pharmacopeia Traceability Audit System
            </span>
            <span className="font-body-sm text-body-sm text-outline max-w-3xl leading-relaxed">
              All lot status transitions (Quarantine / Damage declaration) are cryptographically logged to the MedCare Central Pharmacy Ledger pursuant to DSCSA &amp; FDA Title 21 CFR Part 11 compliance.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
