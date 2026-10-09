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
  const shortageItems = inventoryBatches
    .map((batch) => {
      const dailyUse = Number(batch.average_daily_use) || 0;
      const availableQuantity = Math.max(
        0,
        Number(batch.quantity) - Number(batch.reserved_quantity || 0),
      );
      const daysRemaining = dailyUse > 0 ? availableQuantity / dailyUse : null;
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
  const metricCards = [
    { label: 'Inventory batches', value: isLoading ? '…' : inventoryBatches.length.toLocaleString(), detail: 'View recorded stock', view: 'inventory-and-skus' },
    { label: 'Low stock', value: isLoading ? '…' : shortageItems.length.toLocaleString(), detail: 'Seven days of stock or less', view: 'outbreak-surveillance' },
    { label: 'Expiring soon', value: isLoading ? '…' : expiringBatches.length.toLocaleString(), detail: 'Expires within 30 days', view: 'inventory-and-skus' },
    { label: 'Active transfers', value: isLoading ? '…' : Number(dashboardData.active_transfer_count || 0).toLocaleString(), detail: 'View sent and received stock', view: 'transfers-and-logistics' },
  ];

  const resolveRequest = async (transfer, status, approvedQuantity) => {
    try {
      await onResolveTransfer?.(transfer.id, status, approvedQuantity);
      onToast?.(status === 'approved'
        ? `Transfer request approved for ${approvedQuantity} ${transfer.unit}.`
        : 'Transfer request rejected.');
    } catch (error) {
      onToast?.(error.message || 'Could not update transfer request.');
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Hospital overview</p>
          <h1 className="mt-1 text-2xl font-bold text-on-surface">Stock and transfers</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            A quick view of stock, expiry dates, and hospital requests.
          </p>
        </div>
        <button type="button" onClick={onOpenEmergencyModal} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary">
          Request stock
        </button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                <div className="mt-2 rounded-lg bg-surface-container-low p-2 text-xs text-on-surface-variant">
                  <p className="font-semibold text-on-surface">
                    Suggested allocation: {transfer.allocation_suggested_quantity ?? 0} {transfer.unit}
                    {transfer.allocation_recipient_stock_days !== null
                      && transfer.allocation_recipient_stock_days !== undefined
                      ? ` · ${transfer.allocation_recipient_stock_days} days of stock`
                      : ''}
                  </p>
                  <p className="mt-1">
                    {transfer.allocation_explanation || 'No verified usage data is available for this request.'}
                  </p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => resolveRequest(transfer, 'rejected')} className="rounded-lg border border-outline/30 px-3 py-1.5 text-sm text-on-surface-variant">Decline</button>
                  <button
                    type="button"
                    disabled={!transfer.allocation_suggested_quantity}
                    onClick={() => resolveRequest(transfer, 'approved', transfer.allocation_suggested_quantity)}
                    className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Approve {transfer.allocation_suggested_quantity ?? 0}
                  </button>
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
