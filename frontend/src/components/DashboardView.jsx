import React from 'react';

const dateOnly = (value) => new Date(`${value}T00:00:00`);

export function DashboardView({
  onToast,
  onOpenEmergencyModal,
  dashboardData = {},
  inventoryBatches = [],
  pendingTransfers = [],
  isLoading = false,
  onResolveTransfer,
  onNavigate,
  onFindSupply,
}) {
  const today = dateOnly(new Date().toISOString().slice(0, 10));
  const inventoryUnits = inventoryBatches.reduce((total, batch) => total + batch.quantity, 0);
  const predictedDailyDemand = inventoryBatches.reduce((total, batch) => total + (batch.average_daily_use || 0), 0);
  const shortageItems = inventoryBatches
    .map((batch) => {
      const dailyUse = Number(batch.average_daily_use) || 0;
      const daysRemaining = dailyUse > 0 ? (batch.quantity - (batch.reserved_quantity || 0)) / dailyUse : null;
      return { ...batch, daysRemaining };
    })
    .filter((batch) => batch.daysRemaining !== null && batch.daysRemaining <= 7)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
  const expiringBatches = inventoryBatches
    .map((batch) => ({
      ...batch,
      daysToExpiry: batch.expires_on
        ? Math.ceil((dateOnly(batch.expires_on) - today) / 86400000)
        : null,
    }))
    .filter((batch) => batch.daysToExpiry !== null && batch.daysToExpiry >= 0 && batch.daysToExpiry <= 30)
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  const priorityFacilities = [...pendingTransfers]
    .sort((a, b) => {
      const priority = { critical: 0, high: 1, normal: 2 };
      return (priority[a.urgency] ?? 3) - (priority[b.urgency] ?? 3)
        || new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  const surplusUnits = inventoryBatches.reduce((total, batch) => {
    const available = Math.max(0, batch.quantity - (batch.reserved_quantity || 0));
    const reserve = (Number(batch.average_daily_use) || 0) * 14;
    return total + Math.max(0, available - reserve);
  }, 0);
  const metricCards = [
    { label: 'Inventory on hand', value: isLoading ? 'Loading…' : `${inventoryUnits.toLocaleString()} units`, detail: `${inventoryBatches.length} inventory batches`, view: 'inventory-and-skus' },
    { label: 'Predicted daily demand', value: isLoading ? 'Loading…' : `${predictedDailyDemand.toFixed(1)} units/day`, detail: 'From recorded average use', view: 'outbreak-surveillance' },
    { label: 'Shortage risk', value: isLoading ? 'Loading…' : shortageItems.length.toLocaleString(), detail: 'Items with 7 or fewer days of stock', view: 'outbreak-surveillance' },
    { label: 'Expiry risk', value: isLoading ? 'Loading…' : expiringBatches.length.toLocaleString(), detail: 'Batches expiring within 30 days', view: 'inventory-and-skus' },
    { label: 'Safe surplus estimate', value: isLoading ? 'Loading…' : `${surplusUnits.toLocaleString()} units`, detail: 'After 14-day usage reserve', view: 'mou-partners' },
    { label: 'Active transfers', value: isLoading ? 'Loading…' : (dashboardData.active_transfer_count || 0).toLocaleString(), detail: 'Sending and received', view: 'transfers-and-logistics' },
  ];

  const resolveRequest = async (transfer, status) => {
    try {
      await onResolveTransfer?.(transfer.id, status);
      onToast?.(status === 'approved' ? 'Transfer request approved.' : 'Transfer request rejected.');
    } catch (error) {
      onToast?.(error.message || 'Could not update transfer request.');
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Hospital supply overview</p>
          <h1 className="mt-1 text-2xl font-bold text-on-surface">Medical Supply Intelligence</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Inventory, demand, shortage risk, expiry risk, redistribution, and priority facilities.
          </p>
        </div>
        <button type="button" onClick={onOpenEmergencyModal} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary">
          Request stock
        </button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metricCards.map((card) => (
          <button key={card.label} type="button" onClick={() => onNavigate?.(card.view)} className="rounded-xl border border-outline/20 bg-surface-container-lowest p-4 text-left hover:border-primary/40">
            <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{card.label}</span>
            <strong className="mt-2 block text-2xl text-on-surface">{card.value}</strong>
            <span className="mt-1 block text-sm text-on-surface-variant">{card.detail}</span>
          </button>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-outline/20 bg-surface-container-lowest p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold text-on-surface">Priority supplies</h2>
              <p className="text-xs text-on-surface-variant">Lowest projected stock duration first; based on recorded daily use.</p>
            </div>
            <button type="button" onClick={() => onNavigate?.('outbreak-surveillance')} className="text-sm font-semibold text-primary">Forecasts</button>
          </div>
          <div className="mt-3 divide-y divide-outline/10">
            {shortageItems.slice(0, 5).map((batch) => (
              <div key={batch.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium text-on-surface">{batch.sku_name}</p>
                  <p className="text-xs text-on-surface-variant">{batch.sku_code} · {batch.quantity} {batch.unit} · {batch.daysRemaining.toFixed(1)} days left</p>
                </div>
                <button type="button" onClick={() => onFindSupply?.(batch)} className="rounded-lg border border-primary/30 px-3 py-1.5 text-sm font-semibold text-primary">Find supply</button>
              </div>
            ))}
            {shortageItems.length === 0 && <p className="py-3 text-sm text-on-surface-variant">{isLoading ? 'Loading inventory…' : 'No recorded-use stockout risk within 7 days.'}</p>}
          </div>
        </section>

        <section className="rounded-xl border border-outline/20 bg-surface-container-lowest p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold text-on-surface">Expiry and wastage risk</h2>
              <p className="text-xs text-on-surface-variant">Inventory batches approaching expiry in the next 30 days.</p>
            </div>
            <button type="button" onClick={() => onNavigate?.('mou-partners')} className="text-sm font-semibold text-primary">Redistribute</button>
          </div>
          <div className="mt-3 divide-y divide-outline/10">
            {expiringBatches.slice(0, 5).map((batch) => (
              <div key={batch.id} className="flex items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium text-on-surface">{batch.sku_name}</p>
                  <p className="text-xs text-on-surface-variant">{batch.quantity} {batch.unit} · Lot {batch.lot_number || 'not recorded'}</p>
                </div>
                <span className="text-sm font-semibold text-error">{batch.daysToExpiry} days</span>
              </div>
            ))}
            {expiringBatches.length === 0 && <p className="py-3 text-sm text-on-surface-variant">{isLoading ? 'Loading inventory…' : 'No batches expire within 30 days.'}</p>}
          </div>
        </section>

        <section className="rounded-xl border border-outline/20 bg-surface-container-lowest p-4 xl:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold text-on-surface">Priority facilities</h2>
              <p className="text-xs text-on-surface-variant">Open stock requests, ranked by urgency.</p>
            </div>
            <button type="button" onClick={() => onNavigate?.('transfers-and-logistics')} className="text-sm font-semibold text-primary">All transfers</button>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {priorityFacilities.slice(0, 5).map((transfer) => (
              <article key={transfer.id} className="rounded-lg border border-outline/20 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-on-surface">{transfer.requesting_hospital_name || 'Nearby hospital'}</p>
                  <span className="text-xs font-semibold uppercase text-primary">{transfer.urgency}</span>
                </div>
                <p className="mt-1 text-sm text-on-surface-variant">{transfer.sku_name} · {transfer.quantity} {transfer.unit}</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => resolveRequest(transfer, 'rejected')} className="rounded-lg border border-outline/30 px-3 py-1.5 text-sm text-on-surface-variant">Decline</button>
                  <button type="button" onClick={() => resolveRequest(transfer, 'approved')} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-on-primary">Approve</button>
                </div>
              </article>
            ))}
            {priorityFacilities.length === 0 && <p className="py-3 text-sm text-on-surface-variant">{isLoading ? 'Loading facility requests…' : 'No open facility stock requests.'}</p>}
          </div>
        </section>
      </div>

    </div>
  );
}
