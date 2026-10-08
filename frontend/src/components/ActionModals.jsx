import React, { useState } from 'react';

export function ActionModals({ modalData, onClose, onConfirm }) {
  const [reqSku, setReqSku] = useState('Paracetamol 500mg IV Infusion');
  const [reqQty, setReqQty] = useState(200);
  const [reqUrgency, setReqUrgency] = useState('critical');
  const [reqDept, setReqDept] = useState('Trauma Emergency ICU');

  if (!modalData) return null;
  const { type, payload } = modalData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-container flex items-center justify-between bg-surface-container-low/50">
          <div className="flex items-center gap-2 text-primary font-semibold">
            {type === 'emergency-request' && (
              <>
                <span className="material-symbols-outlined text-[22px] text-error">add_alert</span>
                <span className="font-headline-sm text-base text-on-surface">Initiate Emergency Stock Request</span>
              </>
            )}
            {type === 'take-action' && (
              <>
                <span className="material-symbols-outlined text-[22px] text-primary">hub</span>
                <span className="font-headline-sm text-base text-on-surface">Intervention Protocol: {payload}</span>
              </>
            )}
            {type === 'export-audit' && (
              <>
                <span className="material-symbols-outlined text-[22px] text-primary">receipt_long</span>
                <span className="font-headline-sm text-base text-on-surface">Export Cryptographic Audit Telemetry</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-on-surface text-sm space-y-4">
          {type === 'emergency-request' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onConfirm(
                  `Emergency stock request submitted for ${reqQty} units of ${reqSku}.`,
                  {
                    sku_name: reqSku,
                    quantity: Number(reqQty),
                    urgency: reqUrgency,
                    department: reqDept,
                  },
                );
                onClose();
              }}
              className="space-y-4"
            >
              <div className="p-3 rounded-xl bg-error-container/20 border border-error-container/50 text-xs text-on-error-container">
                This request broadcasts an urgent surplus request directly to interconnected network hospitals in District 4.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-1">Medical SKU</label>
                  <select
                    value={reqSku}
                    onChange={(e) => setReqSku(e.target.value)}
                    className="w-full h-11 px-3 bg-surface-container-low rounded-xl border border-surface-container-high focus:border-primary focus:outline-none"
                  >
                    <option value="Paracetamol 500mg IV Infusion">Paracetamol 500mg IV Infusion (100ml)</option>
                    <option value="Propofol 10mg/mL Injectable Emulsion">Propofol 10mg/mL Injectable Emulsion (20ml)</option>
                    <option value="Norepinephrine 4mg/4ml Ampoules">Norepinephrine 4mg/4ml Ampoules</option>
                    <option value="Normal Saline 1000ml (0.9%)">Normal Saline 1000ml (0.9%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-1">Quantity (Units)</label>
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    value={reqQty}
                    onChange={(e) => setReqQty(Number(e.target.value))}
                    className="w-full h-11 px-3 bg-surface-container-low rounded-xl border border-surface-container-high focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-1">Urgency Priority</label>
                  <select
                    value={reqUrgency}
                    onChange={(e) => setReqUrgency(e.target.value)}
                    className="w-full h-11 px-3 bg-surface-container-low rounded-xl border border-surface-container-high focus:border-primary focus:outline-none"
                  >
                    <option value="critical">Critical (&lt; 24h)</option>
                    <option value="high">Urgent (&lt; 48h)</option>
                    <option value="normal">Standard Rebalance</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-surface-container">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-secondary hover:bg-surface-container font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-error text-on-error font-semibold shadow-md hover:bg-error-container hover:text-on-error-container transition-colors"
                >
                  Broadcast Emergency Request
                </button>
              </div>
            </form>
          )}

          {type === 'take-action' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-surface-container-low text-xs space-y-1">
                <div className="text-outline">TARGET SKU:</div>
                <div className="font-semibold text-on-surface text-sm">{payload}</div>
                <div className="text-secondary">Depletion projected within 41 hours based on active outbreak cluster.</div>
              </div>

              <div className="border border-surface-container-high rounded-xl p-3 space-y-2">
                <div className="font-semibold text-xs text-on-surface uppercase tracking-wider">
                  Algorithmic Route Match
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                  <div>
                    <div className="font-semibold text-xs text-on-surface">St. Jude Regional Hospital</div>
                    <div className="text-[11px] text-secondary">Verified Safe Surplus: 600 units • Transit Time: ~38 min</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold">
                    FEFO MATCH
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-surface-container">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-secondary hover:bg-surface-container font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onConfirm(`Transfer request submitted for ${payload}.`, {
                      sku_name: String(payload),
                      quantity: 1,
                      urgency: 'critical',
                      notes: 'Created from the dashboard stockout intervention.',
                    });
                    onClose();
                  }}
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary font-semibold shadow-md hover:bg-primary-container"
                >
                  Authorize MOU Dispatch
                </button>
              </div>
            </div>
          )}

          {type === 'export-audit' && (
            <div className="space-y-4">
              <p className="text-secondary text-xs leading-relaxed">
                Generate a signed cryptographic audit export containing all inventory rebalance transactions, SHA-256 payload signatures, and FIPS 140-3 boundary certifications.
              </p>
              <div className="p-3 rounded-xl bg-surface-container-low font-mono text-[11px] space-y-1">
                <div><span className="text-outline">LEDGER:</span> SEC-2025-DISTRICT-4</div>
                <div><span className="text-outline">HASH:</span> SHA256:90F2-SURGE-OCT-7F83B1</div>
                <div><span className="text-outline">RECORDS:</span> 1,420 SKUs • 6 Node Facilities</div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-surface-container">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-secondary hover:bg-surface-container font-medium"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onConfirm('Telemetry audit ledger downloaded (pulsegrid-audit-oct2026.json).');
                    onClose();
                  }}
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary font-semibold shadow-md hover:bg-primary-container flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  <span>Download Telemetry JSON</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
