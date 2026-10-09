import React, { useEffect, useState } from 'react';
import { fetchInventory, saveDailyUsage, saveSurveillanceReport } from '../services/api';

const today = new Date().toISOString().slice(0, 10);

export function ForecastDataEntry({ onToast }) {
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState('');
  const [usage, setUsage] = useState({ usage_date: today, quantity_dispensed: '', quantity_requested: '', quantity_issued: '', stockout_flag: false });
  const [surveillance, setSurveillance] = useState({ report_date: today, syndrome: '', new_cases: '', admissions: '', icu_admissions: '', outbreak_flag: false, alert_level: 'normal' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchInventory().then((items) => {
      setBatches(items);
      if (items[0]) setBatchId(String(items[0].id));
    }).catch((error) => setMessage(error.message));
  }, []);

  const selectedBatch = batches.find((batch) => String(batch.id) === batchId);
  const saveUsage = async (event) => {
    event.preventDefault();
    if (!selectedBatch) return;
    setSaving(true);
    setMessage('');
    try {
      await saveDailyUsage({
        sku_code: selectedBatch.sku_code,
        sku_name: selectedBatch.sku_name,
        ...usage,
        quantity_dispensed: Number(usage.quantity_dispensed || 0),
        quantity_requested: Number(usage.quantity_requested || 0),
        quantity_issued: Number(usage.quantity_issued || 0),
      });
      onToast?.('Daily medicine usage saved.');
      setMessage('Usage saved and inventory reduced by the dispensed quantity. The next forecast will use this record.');
    } catch (error) {
      setMessage(error.message || 'Could not save usage.');
    } finally {
      setSaving(false);
    }
  };

  const saveSurveillance = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await saveSurveillanceReport({
        ...surveillance,
        new_cases: Number(surveillance.new_cases || 0),
        admissions: Number(surveillance.admissions || 0),
        icu_admissions: Number(surveillance.icu_admissions || 0),
      });
      onToast?.('Surveillance report saved.');
      setMessage('Surveillance saved. Use verified hospital data only.');
    } catch (error) {
      setMessage(error.message || 'Could not save surveillance.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-space-lg animate-fadeIn">
      <header className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-md border border-outline/20">
        <span className="font-label-sm uppercase tracking-wider text-primary font-semibold">Forecast data</span>
        <h1 className="mt-1 font-headline-lg text-on-surface">Daily usage and surveillance</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Add verified hospital records here. The forecasting screen uses these records to calculate medicine demand and shortage risk.
        </p>
      </header>
      <section className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-md border border-outline/20">
      <span className="font-label-sm uppercase tracking-wider text-primary font-semibold">Improve future forecasts</span>
      <h2 className="mt-1 font-headline-sm text-on-surface">Add real daily data</h2>
      <p className="mt-1 text-sm text-on-surface-variant">Enter actual usage and surveillance records. The model will not use invented values.</p>
      {message && <p className="mt-3 rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface">{message}</p>}
      <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-5">
        <form onSubmit={saveUsage} className="rounded-xl border border-outline/20 p-4 space-y-3">
          <h3 className="font-semibold text-on-surface">Medicine daily usage</h3>
          <p className="text-xs text-on-surface-variant">
            The dispensed quantity is deducted from inventory. Requested and issued quantities are used for forecasting context.
          </p>
          <select value={batchId} onChange={(event) => setBatchId(event.target.value)} className="w-full rounded-lg border border-outline/30 bg-surface-container-low px-3 py-2">
            {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.sku_name} ({batch.sku_code})</option>)}
          </select>
          <input type="date" value={usage.usage_date} onChange={(event) => setUsage({ ...usage, usage_date: event.target.value })} className="w-full rounded-lg border border-outline/30 px-3 py-2" required />
          <div className="grid grid-cols-3 gap-2">
            {['quantity_dispensed', 'quantity_requested', 'quantity_issued'].map((field) => (
              <input key={field} type="number" min="0" placeholder={field.replace('quantity_', '')} value={usage[field]} onChange={(event) => setUsage({ ...usage, [field]: event.target.value })} className="min-w-0 rounded-lg border border-outline/30 px-2 py-2 text-sm" />
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={usage.stockout_flag} onChange={(event) => setUsage({ ...usage, stockout_flag: event.target.checked })} /> Stockout occurred</label>
          <button disabled={saving || !selectedBatch} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-50">Save usage</button>
        </form>
        <form onSubmit={saveSurveillance} className="rounded-xl border border-outline/20 p-4 space-y-3">
          <h3 className="font-semibold text-on-surface">Hospital surveillance</h3>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={surveillance.report_date} onChange={(event) => setSurveillance({ ...surveillance, report_date: event.target.value })} className="rounded-lg border border-outline/30 px-3 py-2" required />
            <input placeholder="Syndrome" value={surveillance.syndrome} onChange={(event) => setSurveillance({ ...surveillance, syndrome: event.target.value })} className="rounded-lg border border-outline/30 px-3 py-2" required />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['new_cases', 'admissions', 'icu_admissions'].map((field) => (
              <input key={field} type="number" min="0" placeholder={field.replace('_', ' ')} value={surveillance[field]} onChange={(event) => setSurveillance({ ...surveillance, [field]: event.target.value })} className="min-w-0 rounded-lg border border-outline/30 px-2 py-2 text-sm" />
            ))}
          </div>
          <select value={surveillance.alert_level} onChange={(event) => setSurveillance({ ...surveillance, alert_level: event.target.value })} className="w-full rounded-lg border border-outline/30 bg-surface-container-low px-3 py-2">
            <option value="normal">Normal</option><option value="watch">Watch</option><option value="surge">Surge</option>
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={surveillance.outbreak_flag} onChange={(event) => setSurveillance({ ...surveillance, outbreak_flag: event.target.checked })} /> Verified outbreak signal</label>
          <button disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-50">Save surveillance</button>
        </form>
      </div>
      </section>
    </div>
  );
}
