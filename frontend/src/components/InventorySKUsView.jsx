import React, { useEffect, useState } from 'react';
import { createInventoryBatch, deleteInventoryBatch, fetchInventory } from '../services/api';
import { ConfirmationDialog } from './ConfirmationDialog';

export function InventorySKUsView({ onToast, onSendStock }) {
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
  const [showAllRows, setShowAllRows] = useState(false);
  const [storageFilter, setStorageFilter] = useState('all');
  const [activePin, setActivePin] = useState(null);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [deletingBatchId, setDeletingBatchId] = useState(null);
  const [batchPendingDeletion, setBatchPendingDeletion] = useState(null);

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
    if (onToast) onToast(`Demo only: ${lotCode} marked quarantined in this view; no server update or audit was recorded.`);
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
    if (onToast) onToast(`Demo only: ${lotCode} marked usable in this view; no server update was recorded.`);
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
    if (onToast) onToast(`Demo only: ${lotCode} marked damaged in this view; no server update was recorded.`);
  };

  const handleLogDestruction = (lotId, lotCode) => {
    setLots((prev) => prev.map((l) => (l.id === lotId ? { ...l, destroyed: true } : l)));
    if (onToast) onToast(`Demo only: destruction of ${lotCode} was not logged or filed with any authority.`);
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

  const toInventoryRow = (batch) => {
    const isCold = batch.storage_regime.toLowerCase().includes('cold');
    const daysRemaining = batch.average_daily_use > 0 ? batch.quantity / batch.average_daily_use : null;
    const isCritical = daysRemaining !== null && daysRemaining <= 3;
    const isLow = daysRemaining !== null && daysRemaining <= 7;
    const expiryText = batch.expires_on
      ? `Exp: ${new Date(`${batch.expires_on}T00:00:00`).toLocaleDateString()}`
      : 'Expiry not recorded';
    return {
      key: batch.id,
      id: batch.id,
      code: batch.sku_code,
      depot: 'Current hospital',
      name: batch.sku_name,
      unit: batch.unit,
      atc: batch.lot_number ? `Lot: ${batch.lot_number}` : 'Hospital inventory',
      storage: batch.storage_regime,
      storageType: isCold ? 'cold' : 'ambient',
      storageIcon: isCold ? 'ac_unit' : 'thermostat',
      stock: `${batch.quantity} ${batch.unit}`,
      bufferPct: daysRemaining === null ? 'Usage not set' : `${Math.min(100, Math.round(daysRemaining * 10))}%`,
      bufferColor: isCritical ? 'text-error font-bold' : isLow ? 'text-secondary font-bold' : 'text-tertiary font-bold',
      bufferBar: isCritical ? 'bg-error' : isLow ? 'bg-secondary' : 'bg-tertiary',
      inbound: '0 units',
      inboundSub: 'No pending shipments',
      reorder: 'Not set',
      minSafety: 'Not set',
      status: isCritical ? 'Critical Lead Time' : isLow ? 'Buffer Warning' : 'On Hand',
      statusClass: isCritical ? 'bg-error-container text-on-error-container' : isLow ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-tertiary-fixed/30 text-on-tertiary-fixed-variant',
      ping: isCritical,
      category: 'Hospital Inventory',
      expiresOn: batch.expires_on,
      subContent: `Lot ${batch.lot_number || 'not recorded'} • ${batch.quantity} ${batch.unit} • ${expiryText} • Average daily use: ${batch.average_daily_use}`,
    };
  };

  const loadInventory = async () => {
    setInventoryLoading(true);
    setInventoryError('');
    try {
      const batches = await fetchInventory();
      setSkus(batches.map(toInventoryRow));
    } catch (error) {
      setSkus([]);
      setInventoryError(error.message || 'Could not load hospital inventory.');
    } finally {
      setInventoryLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleAddBatch = async (event) => {
    event.preventDefault();
    const code = batchForm.sku_code.trim();
    const name = batchForm.medicine_name.trim();
    const quantity = Number(batchForm.quantity);
    setInventoryError('');
    try {
      const created = await createInventoryBatch({
        sku_code: code,
        sku_name: name,
        quantity,
        lot_number: batchForm.lot_number.trim() || null,
        expires_on: batchForm.expires_on || null,
      });
      const row = toInventoryRow(created);
      setSkus((current) => [row, ...current.filter((item) => item.id !== row.id)]);
      setExpandedRows((current) => ({ ...current, [row.key]: true }));
      setBatchForm({ sku_code: '', medicine_name: '', quantity: '', lot_number: '', expires_on: '' });
      setIsAddBatchOpen(false);
      if (onToast) onToast(`Inventory batch saved: ${code} (${created.quantity} ${created.unit}).`);
    } catch (error) {
      setInventoryError(error.message || 'Could not save inventory batch.');
    }
  };

  const handleDeleteBatch = async (batch) => {
    if (!batch.id) return;
    setDeletingBatchId(batch.id);
    setInventoryError('');
    try {
      await deleteInventoryBatch(batch.id);
      setSkus((current) => current.filter((item) => item.id !== batch.id));
      setActiveMenuId(null);
      setBatchPendingDeletion(null);
      if (onToast) onToast(`Inventory batch deleted: ${batch.code}.`);
    } catch (error) {
      setBatchPendingDeletion(null);
      setInventoryError(error.message || 'Could not delete inventory batch.');
    } finally {
      setDeletingBatchId(null);
    }
  };

  const filteredSKUs = skus.filter((item) => {
    if (searchQuery.trim()) {
      const match =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.atc.toLowerCase().includes(searchQuery.toLowerCase());
      if (!match) return false;
    }
    if (storageFilter === 'cold' && item.storageType !== 'cold') return false;
    if (storageFilter === 'ambient' && item.storageType !== 'ambient') return false;
    if (activePin === 'reorder' && item.status !== 'Critical Lead Time' && item.status !== 'Reorder Now' && item.status !== 'Buffer Warning') return false;
    return true;
  });
  const displayedSKUs = inventoryLoading ? [] : filteredSKUs.slice(0, showAllRows ? filteredSKUs.length : 5);
  const totalStock = skus.reduce((sum, item) => sum + (Number.parseInt(item.stock, 10) || 0), 0);
  const riskBatchCount = skus.filter((item) => item.status === 'Critical Lead Time' || item.status === 'Buffer Warning').length;
  const expiringBatchCount = skus.filter((item) => {
    if (!item.expiresOn) return false;
    const days = (new Date(`${item.expiresOn}T00:00:00`) - new Date(new Date().toISOString().slice(0, 10))) / 86400000;
    return days >= 0 && days <= 30;
  }).length;

  return (
    <div className="flex flex-col w-full pb-12 animate-fadeIn">
      {batchPendingDeletion && (
        <ConfirmationDialog
          title="Delete inventory batch?"
          message={`Delete ${batchPendingDeletion.name} (${batchPendingDeletion.code}) from this hospital's inventory?`}
          confirmLabel="Delete batch"
          isConfirming={deletingBatchId === batchPendingDeletion.id}
          onCancel={() => setBatchPendingDeletion(null)}
          onConfirm={() => handleDeleteBatch(batchPendingDeletion)}
        />
      )}
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
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl leading-relaxed">
            Review your recorded medicine quantities, usage, expiry dates, and stockout risk.
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
                  Add a hospital inventory batch and optional daily usage for stock forecasting.
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

      {inventoryError && (
        <div role="alert" className="mb-space-md rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 text-sm text-on-error-container">
          {inventoryError}
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          ['Inventory batches', inventoryLoading ? '…' : skus.length],
          ['Units on hand', inventoryLoading ? '…' : totalStock.toLocaleString()],
          ['At-risk / expiring batches', inventoryLoading ? '…' : `${riskBatchCount} / ${expiringBatchCount}`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-surface-container-high/40 bg-surface-container-lowest p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-outline">{label}</p>
            <p className="mt-1 text-xl font-bold text-on-surface">{value}</p>
          </div>
        ))}
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

          </div>
        </div>

        {/* Quick Filter Tags */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider pr-1 font-semibold">
            Filter Pins:
          </span>
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
                <th className="py-3 px-4 font-semibold min-w-[140px]">Expiry Date</th>
                <th className="py-3 px-4 font-semibold min-w-[140px]">Status</th>
                <th className="py-3 px-4 text-right pr-6">Command</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container/60" id="inventoryTableBody">
              {displayedSKUs.map((sku) => {
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
                        <span className={`font-label-lg text-label-lg ${sku.bufferColor}`}>{sku.stock}</span>
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
                        <span className="font-label-md text-label-md text-on-surface font-medium">
                          {sku.expiresOn ? new Date(`${sku.expiresOn}T00:00:00`).toLocaleDateString() : 'Not recorded'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-label-sm font-semibold ${sku.statusClass}`}>
                          {sku.ping && <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>}
                          {sku.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={() => onSendStock?.({ sku_name: sku.name, sku_code: sku.code, unit: sku.unit })}
                            className="mr-2 rounded-lg border border-primary/30 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5"
                          >
                            Send stock
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveMenuId((current) => current === sku.key ? null : sku.key)}
                            className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
                            title="Inventory actions"
                            aria-label={`Inventory actions for ${sku.name}`}
                            aria-expanded={activeMenuId === sku.key}
                            aria-haspopup="menu"
                          >
                            <span className="material-symbols-outlined text-[20px]">more_vert</span>
                          </button>
                          {activeMenuId === sku.key && (
                            <div role="menu" className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-surface-container-high bg-surface-container-lowest p-1 text-left shadow-xl">
                              {sku.id ? (
                                <button
                                  type="button"
                                  role="menuitem"
                                  disabled={deletingBatchId === sku.id}
                                  onClick={() => setBatchPendingDeletion(sku)}
                                  className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-error hover:bg-error-container/50 disabled:opacity-50"
                                >
                                  {deletingBatchId === sku.id ? 'Deleting…' : 'Delete inventory batch'}
                                </button>
                              ) : (
                                <span className="block px-3 py-2 text-xs text-outline">No server inventory batch</span>
                              )}
                            </div>
                          )}
                        </div>
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
              {!inventoryLoading && filteredSKUs.length > 5 && (
                <tr>
                  <td colSpan={8} className="p-3 text-center">
                    <button type="button" onClick={() => setShowAllRows((visible) => !visible)} className="text-sm font-semibold text-primary">
                      {showAllRows ? 'Show top 5' : `Show all ${filteredSKUs.length} batches`}
                    </button>
                  </td>
                </tr>
              )}
              {!inventoryLoading && filteredSKUs.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-sm text-on-surface-variant">
                    {inventoryError ? 'Inventory is unavailable.' : 'No inventory matches your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
