import React, { useEffect, useMemo, useState } from 'react';
import { createTransfer, fetchHospitals, fetchTransfers, getCurrentHospitalId, submitTransferReceipt, updateTransferStatus } from '../services/api';

const STATUS_LABELS = {
  requested: 'Requested',
  approved: 'Approved',
  pending_pickup: 'Pending pickup',
  in_transit: 'In transit',
  arrived_awaiting_inspection: 'Awaiting inspection',
  completed: 'Delivered',
  rejected: 'Rejected',
  returned: 'Returned',
  exception: 'Exception',
  canceled: 'Canceled',
};

export function TransfersLogisticsView({ onToast, initialDraft, onInitialDraftConsumed }) {
  const [transfers, setTransfers] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [draft, setDraft] = useState(initialDraft || {});

  useEffect(() => {
    if (!initialDraft) return;
    setDraft(initialDraft);
    setShowForm(true);
    onInitialDraftConsumed?.();
  }, [initialDraft, onInitialDraftConsumed]);

  const hospitalNames = useMemo(
    () => Object.fromEntries(hospitals.map((hospital) => [hospital.id, hospital.name])),
    [hospitals],
  );

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [transferRows, hospitalRows] = await Promise.all([fetchTransfers(), fetchHospitals()]);
      setTransfers(transferRows);
      setHospitals(hospitalRows);
    } catch (requestError) {
      setError(requestError.message || 'Could not load transfers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const currentHospitalId = getCurrentHospitalId();
  const move = async (transfer, nextStatus) => {
    try {
      await updateTransferStatus(transfer.id, nextStatus);
      await load();
      onToast?.(`Transfer moved to ${STATUS_LABELS[nextStatus].toLowerCase()}.`);
    } catch (requestError) {
      setError(requestError.message || 'Could not update this transfer.');
    }
  };

  const reject = async (transfer) => {
    await move(transfer, 'rejected');
  };

  const receive = async (transfer) => {
    try {
      await submitTransferReceipt(transfer.id, {
        received_by_name: hospitalNames[currentHospitalId] || 'Receiving hospital',
        inspected_at: new Date().toISOString(),
        accepted_quantity: transfer.quantity,
        rejected_quantity: 0,
      });
      await load();
      onToast?.('Delivery accepted. The transfer is delivered.');
    } catch (requestError) {
      setError(requestError.message || 'Could not accept this delivery.');
    }
  };

  const create = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await createTransfer({
        destination_hospital_id: form.elements.namedItem('destination_hospital_id').value,
        sku_code: form.elements.namedItem('sku_code').value.trim(),
        sku_name: form.elements.namedItem('sku_name').value.trim(),
        quantity: Number(form.elements.namedItem('quantity').value),
        unit: form.elements.namedItem('unit').value.trim() || 'units',
        urgency: form.elements.namedItem('urgency').value,
        notes: form.elements.namedItem('notes').value.trim() || null,
      });
      form.reset();
      setShowForm(false);
      await load();
      onToast?.('Transfer sent. It is now in transit.');
    } catch (requestError) {
      setError(requestError.message || 'Could not create transfer.');
    }
  };

  const renderTransferCard = (transfer, direction) => {
    const isSource = transfer.source_hospital_id === currentHospitalId;
    const isReceivingHospital = transfer.requesting_hospital_id === currentHospitalId;
    const statusAction = (
      (transfer.status === 'requested' && isSource && { label: 'Approve request', next: 'approved' })
      || (transfer.status === 'approved' && isSource && { label: 'Prepare pickup', next: 'pending_pickup' })
      || (transfer.status === 'pending_pickup' && isSource && { label: 'Dispatch shipment', next: 'in_transit' })
      || (transfer.status === 'in_transit' && isSource && { label: 'Confirm returned to source', next: 'returned' })
      || (transfer.status === 'exception' && isReceivingHospital && { label: 'Confirm arrived for inspection', next: 'arrived_awaiting_inspection' })
      || (transfer.status === 'exception' && isSource && { label: 'Confirm returned to source', next: 'returned' })
    );
    const canCancel = (
      (transfer.status === 'requested' && isReceivingHospital)
      || (['approved', 'pending_pickup'].includes(transfer.status) && (isSource || isReceivingHospital))
    );

    return (
      <article key={transfer.id} className="rounded-lg border border-outline/20 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-on-surface-variant">{transfer.id}</p>
            <p className="font-semibold text-on-surface">{transfer.sku_name}</p>
            <p className="mt-1 text-xs text-on-surface-variant">{transfer.sku_code || 'SKU not provided'} · {transfer.quantity} {transfer.unit}</p>
          </div>
          <span className="shrink-0 rounded-full bg-surface-container-high px-2 py-1 text-xs text-on-surface-variant">
            {STATUS_LABELS[transfer.status] || transfer.status}
          </span>
        </div>
        <p className="mt-2 text-xs text-on-surface-variant">
          {direction === 'sending' ? 'To' : 'From'}: {direction === 'sending'
            ? hospitalNames[transfer.requesting_hospital_id] || 'Receiving hospital'
            : hospitalNames[transfer.source_hospital_id] || 'Source hospital'}
        </p>
        {transfer.notes && <p className="mt-2 text-xs text-on-surface-variant">{transfer.notes}</p>}
        {statusAction && (
          <button type="button" onClick={() => move(transfer, statusAction.next)} className="mt-4 w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-on-primary">
            {statusAction.label}
          </button>
        )}
        {isReceivingHospital && ['in_transit', 'arrived_awaiting_inspection'].includes(transfer.status) && (
          <button type="button" onClick={() => receive(transfer)} className="mt-4 w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-on-primary">
            Accept delivery
          </button>
        )}
        {transfer.status === 'requested' && isSource && (
          <button type="button" onClick={() => reject(transfer)} className="mt-2 w-full rounded-lg border border-error/30 px-3 py-2 text-sm font-semibold text-error">
            Reject request
          </button>
        )}
        {transfer.status === 'requested' && isReceivingHospital && (
          <p className="mt-3 text-xs text-on-surface-variant">Waiting for the sending hospital to respond.</p>
        )}
        {canCancel && (
          <button type="button" onClick={() => move(transfer, 'canceled')} className="mt-2 w-full rounded-lg border border-outline/30 px-3 py-2 text-sm font-semibold text-on-surface-variant">
            Cancel transfer
          </button>
        )}
      </article>
    );
  };

  const outgoingTransfers = transfers.filter((transfer) => transfer.source_hospital_id === currentHospitalId);
  const incomingTransfers = transfers.filter((transfer) => transfer.requesting_hospital_id === currentHospitalId);
  const renderTransferGroup = (title, direction, rows) => {
    const filteredRows = rows.filter((transfer) => [
      transfer.sku_name,
      transfer.sku_code,
      transfer.status,
      transfer.notes,
      hospitalNames[direction === 'sending' ? transfer.requesting_hospital_id : transfer.source_hospital_id],
    ].some((value) => String(value || '').toLowerCase().includes(searchQuery.trim().toLowerCase())));
    const visibleRows = showAll ? filteredRows : filteredRows.slice(0, 5);
    return (
    <section className="rounded-xl border border-outline/20 bg-surface-container-lowest p-4">
      <div className="mb-4 flex items-center justify-between border-b border-outline/20 pb-3">
        <h2 className="font-semibold text-on-surface">{title}</h2>
        <span className="rounded-full bg-surface-container-high px-2 py-1 text-xs text-on-surface-variant">{filteredRows.length}</span>
      </div>
      {filteredRows.length === 0 ? (
        <p className="py-3 text-sm text-on-surface-variant">{searchQuery ? 'No transfers match your search.' : `No ${direction} transfers.`}</p>
      ) : (
        <div className="space-y-3">
          {visibleRows.map((transfer) => renderTransferCard(transfer, direction))}
          {!showAll && filteredRows.length > 5 && (
            <button type="button" onClick={() => setShowAll(true)} className="w-full py-2 text-sm font-semibold text-primary">
              Show all {filteredRows.length} transfers
            </button>
          )}
        </div>
      )}
    </section>
    );
  };

  return (
    <div className="flex w-full flex-col gap-5 animate-fadeIn">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">Internal logistics</span>
          <h1 className="mt-1 text-2xl font-bold text-on-surface">Transfers</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Send stock to another hospital. It stays in transit until they accept delivery.</p>
        </div>
        <button type="button" onClick={() => setShowForm((visible) => !visible)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary">
          {showForm ? 'Close' : 'New transfer'}
        </button>
      </header>

      {error && <div role="alert" className="rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 text-sm text-on-error-container">{error}</div>}
      <label className="block">
        <span className="sr-only">Search transfers</span>
        <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search transfers by medicine, hospital, or status" className="w-full rounded-lg border border-outline/30 bg-surface-container-lowest px-3 py-2 text-sm" />
      </label>

      {showForm && (
        <form onSubmit={create} className="grid gap-3 rounded-xl border border-outline/20 bg-surface-container-lowest p-4 md:grid-cols-2">
          <p className="text-xs text-on-surface-variant md:col-span-2">
            Stock is reserved when sent and leaves your inventory when the receiving hospital accepts delivery.
          </p>
          <input key={`name-${draft.sku_name || ''}`} name="sku_name" required defaultValue={draft.sku_name || ''} placeholder="Medicine name" className="rounded-lg border border-outline/30 px-3 py-2" />
          <input key={`code-${draft.sku_code || ''}`} name="sku_code" required defaultValue={draft.sku_code || ''} placeholder="SKU code" className="rounded-lg border border-outline/30 px-3 py-2" />
          <input name="quantity" required min="1" type="number" placeholder="Quantity" className="rounded-lg border border-outline/30 px-3 py-2" />
          <input key={`unit-${draft.unit || ''}`} name="unit" defaultValue={draft.unit || 'units'} placeholder="Unit" className="rounded-lg border border-outline/30 px-3 py-2" />
          <label htmlFor="transfer-destination-hospital" className="sr-only">Destination hospital</label>
          <select id="transfer-destination-hospital" name="destination_hospital_id" required className="rounded-lg border border-outline/30 px-3 py-2">
            <option value="">Choose destination hospital</option>
            {hospitals.filter((hospital) => hospital.id !== currentHospitalId).map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name}</option>)}
          </select>
          <select name="urgency" defaultValue="normal" className="rounded-lg border border-outline/30 px-3 py-2">
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <textarea name="notes" placeholder="Reason (optional)" className="rounded-lg border border-outline/30 px-3 py-2 md:col-span-2" rows="2" />
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary md:col-span-2">Create transfer</button>
        </form>
      )}

      {loading ? <p className="text-sm text-on-surface-variant">Loading transfers...</p> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {renderTransferGroup('Sending', 'sending', outgoingTransfers)}
          {renderTransferGroup('Received', 'received', incomingTransfers)}
        </div>
      )}
    </div>
  );
}
