import React, { useEffect, useState } from 'react';
import {
  fetchInventory,
  fetchInventoryForecast,
  fetchMouInventoryAvailability,
  requestMouInventory,
} from '../services/api';

export function RiskForecastingView({ onToast }) {
  const [forecastRows, setForecastRows] = useState([]);
  const [forecastError, setForecastError] = useState('');
  const [inventoryBatches, setInventoryBatches] = useState([]);
  const [selectedInventoryBatch, setSelectedInventoryBatch] = useState('');
  const [forecastHorizon, setForecastHorizon] = useState(7);
  const [demandForecast, setDemandForecast] = useState(null);
  const [isDemandForecasting, setIsDemandForecasting] = useState(false);
  const [partnerAvailability, setPartnerAvailability] = useState(null);
  const [mouRequest, setMouRequest] = useState(null);
  const [isMouRequesting, setIsMouRequesting] = useState(false);

  // Modal State for Inter-Hospital MOU Dispatch
  const [mouDialog, setMouDialog] = useState(null); // { title, sku, hospital, route }

  useEffect(() => {
    fetchInventory()
      .then((batches) => {
        setInventoryBatches(batches);
        if (batches[0]) setSelectedInventoryBatch(String(batches[0].id));
      })
      .catch((error) => setForecastError(error.message || 'Could not load your inventory.'));
    handleLoadForecast();
  }, []);

  const handleRunDemandForecast = async () => {
    if (!selectedInventoryBatch) return;
    setIsDemandForecasting(true);
    setForecastError('');
    try {
      const result = await fetchInventoryForecast(forecastHorizon);
      const selected = result.forecasts.find((forecast) => forecast.inventory_batch_id === selectedInventoryBatch);
      if (!selected) throw new Error('The selected inventory batch could not be forecast.');
      setDemandForecast(selected);
      onToast?.(`Forecast loaded for ${selected.medicine_name}.`);
    } catch (error) {
      setForecastError(error.message || 'Could not calculate medicine demand forecast.');
    } finally {
      setIsDemandForecasting(false);
    }
  };

  const handleLoadForecast = async () => {
    setForecastError('');
    try {
      const forecast = await fetchInventoryForecast(forecastHorizon);
      setForecastRows(forecast.forecasts);
      const firstForecast = forecast.forecasts.find(
        (item) => item.inventory_batch_id === selectedInventoryBatch,
      ) || forecast.forecasts[0];
      if (firstForecast) {
        setSelectedInventoryBatch(firstForecast.inventory_batch_id);
        setDemandForecast(firstForecast);
      }
      if (onToast) onToast(`Forecast calculated for ${forecast.forecasts.length} inventory batches.`);
    } catch (error) {
      setForecastError(error.message || 'Could not calculate hospital inventory forecasts.');
    }
  };

  const handleInventorySelection = (event) => {
    const batchId = event.target.value;
    setSelectedInventoryBatch(batchId);
    const selectedForecast = forecastRows.find((item) => item.inventory_batch_id === batchId);
    if (selectedForecast) setDemandForecast(selectedForecast);
  };

  const handleOpenBorrow = async (sku, hospital, code) => {
    try {
      const availability = await fetchMouInventoryAvailability(code);
      setPartnerAvailability(availability);
      setMouRequest(null);
      setMouDialog({
        title: 'MOU hospital inventory',
        sku,
        hospital,
        route: 'Same medicine at active MOU hospitals',
      });
    } catch (error) {
      setForecastError(error.message || 'Could not load MOU hospital inventory.');
    }
  };

  const handleRequestMouInventory = async (event, partner) => {
    event.preventDefault();
    const quantity = Number(mouRequest?.quantity);
    if (!quantity || quantity > partner.quantity_shareable) {
      setForecastError(`Request between 1 and ${partner.quantity_shareable} units.`);
      return;
    }
    setIsMouRequesting(true);
    try {
      await requestMouInventory({
        inventory_batch_id: partner.inventory_batch_id,
        quantity,
        urgency: mouRequest.urgency,
        department: mouRequest.department.trim() || null,
        notes: mouRequest.notes.trim() || null,
      });
      setMouRequest(null);
      onToast?.(`Request sent to ${partner.hospital_name}. They must approve it.`);
    } catch (error) {
      setForecastError(error.message || 'Could not send the MOU inventory request.');
    } finally {
      setIsMouRequesting(false);
    }
  };

  const shortageData = forecastRows.map((forecast, index) => {
    const critical = forecast.days_until_stockout !== null && forecast.days_until_stockout <= 3;
    const atRisk = forecast.stockout_within_horizon;
    return {
      id: forecast.inventory_batch_id,
      sku: forecast.medicine_name,
      code: forecast.sku_code,
      stock: `${forecast.current_quantity} units`,
      stockBar: critical ? 'w-1/6 bg-error' : atRisk ? 'w-2/5 bg-secondary' : 'w-3/5 bg-tertiary',
      burn: `${forecast.average_daily_use} units/day`,
      burnSub: `${forecast.horizon_days}-day forecast`,
      burnColor: critical ? 'text-error' : 'text-on-surface-variant',
      depletion: forecast.days_until_stockout === null ? 'No usage rate' : `${forecast.days_until_stockout}d`,
      status: critical ? 'Critical' : atRisk ? 'At Risk' : 'In Range',
      statusClass: critical ? 'bg-error-container text-on-error-container' : atRisk ? 'bg-secondary-container text-on-secondary-fixed' : 'bg-tertiary-fixed/40 text-on-tertiary-fixed-variant',
      ping: critical,
      actionText: 'Check MOU stock',
      actionClass: critical ? 'bg-error text-on-error hover:opacity-90' : 'bg-surface-container-high text-on-surface',
      hospitalMatch: 'Select partner in transfers',
      rank: index,
    };
  });

  return (
    <div className="flex flex-col w-full gap-space-lg pb-12 animate-fadeIn">
      {/* Top Operational Context / Breadcrumb & Header Action Strip */}
      <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-md">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold">
              Clinical Intelligence
            </span>
            <span className="text-outline text-xs">/</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
              Predictive Modeling
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed font-label-sm text-label-sm font-semibold ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Inventory forecast ready
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
            Risk Intelligence &amp; AI Forecasting
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl leading-relaxed">
            Automatic forecast for every medicine batch in your hospital inventory. Review shortage risk first, then check active MOU hospitals for the same medicine.
          </p>
        </div>
      </section>
      <section className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-md border border-primary/20">
        <div className="flex flex-col gap-1">
          <span className="font-label-sm uppercase tracking-wider text-primary font-semibold">Your inventory forecast</span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Medicine demand and shortage forecast</h2>
          <p className="text-sm text-on-surface-variant">
            Select a medicine batch from your hospital inventory. The forecast uses its current quantity and recorded average daily use.
          </p>
        </div>
        {forecastError && <div role="alert" className="mt-4 rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 text-sm text-on-error-container">{forecastError}</div>}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_auto] gap-3 items-end">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-on-surface">
            Medicine in your inventory
            <select
              value={selectedInventoryBatch}
              onChange={handleInventorySelection}
              disabled={!inventoryBatches.length}
              className="rounded-lg border border-outline/30 bg-surface-container-low px-3 py-2.5 text-on-surface"
            >
              {!inventoryBatches.length && <option>Loading your inventory...</option>}
              {inventoryBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.sku_name} ({batch.quantity} {batch.unit})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-on-surface">
            Forecast period
            <select value={forecastHorizon} onChange={(event) => setForecastHorizon(Number(event.target.value))} className="rounded-lg border border-outline/30 bg-surface-container-low px-3 py-2.5 text-on-surface">
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
            </select>
          </label>
          <button
            type="button"
            onClick={handleRunDemandForecast}
            disabled={isDemandForecasting || !selectedInventoryBatch}
            className="rounded-lg bg-primary px-4 py-2.5 font-semibold text-on-primary disabled:opacity-50"
          >
            {isDemandForecasting ? 'Loading...' : 'Refresh forecast'}
          </button>
        </div>
        {demandForecast && (
          <div className="mt-5">
            <div className={`mb-3 rounded-lg border px-4 py-3 text-sm ${
              demandForecast.data_source === 'lightgbm_real_history'
                ? 'border-tertiary/40 bg-tertiary-container/50 text-on-tertiary-container'
                : demandForecast.data_source === 'inventory_batch_average'
                  ? 'border-secondary/40 bg-secondary-container/50 text-on-secondary-container'
                  : 'border-outline/30 bg-surface-container-low text-on-surface'
            }`}>
              <strong>
                {demandForecast.data_source === 'lightgbm_real_history'
                  ? 'ML forecast active'
                  : demandForecast.data_source === 'inventory_batch_average'
                    ? 'Not enough history yet'
                    : 'Using database fallback'}
              </strong>
              <span className="ml-2">
                {demandForecast.data_source === 'lightgbm_real_history'
                  ? 'LightGBM is using this medicine’s real usage history.'
                  : demandForecast.data_source === 'inventory_batch_average'
                    ? 'Add 28 consecutive daily usage records to activate ML forecasting.'
                    : 'This forecast uses your recorded usage data, not the ML model.'}
              </span>
            </div>
            <div className={`rounded-lg border px-4 py-3 ${
              demandForecast.risk_level === 'critical_shortage'
                ? 'border-error/40 bg-error-container/50 text-on-error-container'
                : demandForecast.risk_level === 'shortage_within_horizon'
                  ? 'border-secondary/40 bg-secondary-container/60 text-on-secondary-container'
                  : 'border-tertiary/40 bg-tertiary-container/50 text-on-tertiary-container'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide">Predicted demand risk</div>
                  <div className="mt-1 text-lg font-bold capitalize">
                    {demandForecast.risk_level.replaceAll('_', ' ')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs">Projected remaining stock</div>
                  <div className="text-lg font-bold">
                    {Number(demandForecast.projected_quantity).toFixed(0)} units
                  </div>
                </div>
              </div>
              <p className="mt-2 text-sm">
                Current stock: {demandForecast.current_quantity} units.
                Expected use: {Number(demandForecast.average_daily_use).toFixed(1)} units/day.
                <span className="block mt-1">
                  Source: {demandForecast.data_source === 'lightgbm_real_history'
                    ? `LightGBM trained on ${demandForecast.ml_model_version || 'your real history'}`
                    : demandForecast.data_source === 'daily_usage_records'
                      ? 'your daily usage records'
                      : 'inventory average'}.
                  {demandForecast.surveillance_status !== 'no_recent_surveillance'
                    ? ` Surveillance: ${demandForecast.surveillance_status} (${Math.round((demandForecast.surveillance_multiplier - 1) * 100)}% demand adjustment).`
                    : ' No recent surveillance adjustment.'}
                </span>
                {demandForecast.days_until_stockout === null
                  ? ' No usage rate is recorded yet.'
                  : ` Estimated stockout in ${demandForecast.days_until_stockout} days.`}
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div className="rounded-lg bg-surface-container-low px-3 py-2">
                <span className="block text-xs text-on-surface-variant">Current stock</span>
                <strong className="text-on-surface">{demandForecast.current_quantity} units</strong>
              </div>
              <div className="rounded-lg bg-surface-container-low px-3 py-2">
                <span className="block text-xs text-on-surface-variant">Daily demand</span>
                <strong className="text-on-surface">{Number(demandForecast.average_daily_use).toFixed(1)} units</strong>
              </div>
              <div className="rounded-lg bg-surface-container-low px-3 py-2">
                <span className="block text-xs text-on-surface-variant">Stockout estimate</span>
                <strong className="text-on-surface">
                  {demandForecast.days_until_stockout === null ? 'Unknown' : `${demandForecast.days_until_stockout} days`}
                </strong>
              </div>
              <div className="rounded-lg bg-surface-container-low px-3 py-2">
                <span className="block text-xs text-on-surface-variant">Data used</span>
                <strong className="text-on-surface">
                  {demandForecast.data_source === 'lightgbm_real_history'
                    ? 'LightGBM + real history'
                    : demandForecast.data_source === 'daily_usage_records'
                      ? 'Daily records'
                      : 'Inventory average'}
                </strong>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant mt-4">
              <span>Medicine: <strong className="text-on-surface">{demandForecast.medicine_name}</strong></span>
              <span>SKU: <strong className="text-on-surface">{demandForecast.sku_code}</strong></span>
              <span>Horizon: <strong className="text-on-surface">{demandForecast.horizon_days} days</strong></span>
            </div>
            <div className="mt-4 rounded-xl border border-outline/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-on-surface">Expected daily demand</h3>
                  <p className="text-xs text-on-surface-variant">Bars show expected use. Labels show projected stock after use.</p>
                </div>
                <span className="text-xs text-on-surface-variant">{demandForecast.horizon_days} days</span>
              </div>
              <div className="mt-5 flex h-48 items-end gap-1.5 overflow-x-auto border-b border-outline/20 px-1">
                {demandForecast.daily_forecast.map((prediction) => {
                  const maximum = Math.max(...demandForecast.daily_forecast.map((item) => Number(item.predicted_demand)), 1);
                  const height = Math.max(8, (Number(prediction.predicted_demand) / maximum) * 100);
                  return (
                    <div key={prediction.date} className="flex h-full min-w-[38px] flex-1 flex-col items-center justify-end gap-1">
                      <span className="text-[10px] font-semibold text-on-surface">
                        {Number(prediction.predicted_demand).toFixed(0)}
                      </span>
                      <div
                        className="w-full rounded-t-md bg-primary transition-all"
                        style={{ height: `${height}%` }}
                        title={`${prediction.date}: ${Number(prediction.predicted_demand).toFixed(1)} units expected; ${prediction.projected_quantity} remaining`}
                      />
                      <span className="text-[10px] text-on-surface-variant">{prediction.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
        {/* Left (50%): Shortage Risks Table */}
        <div className="flex flex-col p-space-lg rounded-2xl bg-surface-container-lowest shadow-md justify-between border border-surface-container-high/40">
          <div className="flex flex-col gap-space-md">
            {/* Panel Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-[22px]">warning</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Shortage Risks</h3>
                  <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">
                    {shortageData.length} medicines
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Review stockout timing and check active MOU hospitals when needed.
                </span>
              </div>
            </div>

            {/* Shortage Risks Table Layout */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-outline font-label-sm text-label-sm uppercase tracking-wider bg-surface-container-low/60 rounded-lg">
                    <th className="py-2.5 px-3 rounded-l-lg">Medicine / SKU</th>
                    <th className="py-2.5 px-2">Stock Level</th>
                    <th className="py-2.5 px-2">Projected Burn</th>
                    <th className="py-2.5 px-2">Depletion</th>
                    <th className="py-2.5 px-2">Status</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Intervention</th>
                  </tr>
                </thead>
                <tbody className="divide-y-0 text-body-sm">
                  {shortageData.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors group">
                      <td className="py-3 px-3">
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-md text-label-md text-on-surface font-bold group-hover:text-primary transition-colors">
                            {item.sku}
                          </span>
                          <span className="font-body-sm text-body-sm text-outline">{item.code}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md text-on-surface font-semibold">{item.stock}</span>
                          <div className="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-1">
                            <div className={`h-full rounded-full ${item.stockBar}`}></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">{item.burn}</span>
                        <span className={`block text-[11px] font-medium ${item.burnColor}`}>{item.burnSub}</span>
                      </td>
                      <td className="py-3 px-2">
                        <div className={`flex items-center gap-1.5 font-headline-sm text-headline-sm font-bold ${
                          item.status === 'Critical' || item.status === 'Borrow' ? 'text-error' : 'text-on-surface'
                        }`}>
                          <span>{item.depletion}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${item.statusClass}`}>
                          {item.ping && <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>}
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenBorrow(item.sku, item.hospitalMatch, item.code)}
                          className={`px-3 py-1.5 rounded-xl font-label-sm text-label-sm font-semibold shadow-sm transition-all cursor-pointer ${item.actionClass}`}
                        >
                          {item.actionText}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </section>

      {/* MOU partner inventory details */}
      {mouDialog && (
        <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-lg w-full p-space-lg flex flex-col gap-space-md border border-surface-container-high">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed/40 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">local_shipping</span>
                </div>
                <div className="flex flex-col">
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{mouDialog.title}</h4>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">District 4 Rapid Stock Redistribution</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMouDialog(null)}
                className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-outline hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-2 border border-surface-container-high/50">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-outline">Target SKU / Batch:</span>
                <span className="font-label-md text-label-md text-on-surface font-semibold">{mouDialog.sku}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-outline">Target Hospital:</span>
                <span className="font-label-md text-label-md text-primary font-semibold">{mouDialog.hospital}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-outline">Protocol Route:</span>
                <span className="font-label-md text-label-md text-tertiary font-semibold">{mouDialog.route}</span>
              </div>
            </div>
            <div className="rounded-xl border border-outline/20 p-4">
              <h5 className="font-semibold text-on-surface">Available from active MOU hospitals</h5>
              {!partnerAvailability?.partners?.length && (
                <p className="mt-2 text-sm text-on-surface-variant">
                  No same-medicine stock was found at an active MOU hospital.
                </p>
              )}
              {partnerAvailability?.partners?.map((partner) => (
                <div key={`${partner.hospital_id}-${partner.sku_code}`} className="mt-3 flex flex-col gap-1 rounded-lg bg-surface-container-low p-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold text-on-surface">{partner.hospital_name}</span>
                    <span className="font-semibold text-primary">{partner.quantity_shareable} shareable</span>
                  </div>
                  <span className="text-on-surface-variant">
                    {partner.quantity_on_hand} on hand; {partner.protected_reserve} reserved for their 14-day demand
                  </span>
                  {partner.expires_on && <span className="text-on-surface-variant">Expires {partner.expires_on}</span>}
                  {partner.quantity_shareable > 0 && (
                    mouRequest?.inventory_batch_id === partner.inventory_batch_id ? (
                      <form onSubmit={(event) => handleRequestMouInventory(event, partner)} className="mt-2 grid gap-2 border-t border-outline/20 pt-2">
                        <label className="text-xs font-medium text-on-surface">
                          Quantity
                          <input
                            type="number"
                            min="1"
                            max={partner.quantity_shareable}
                            value={mouRequest.quantity}
                            onChange={(event) => setMouRequest({ ...mouRequest, quantity: event.target.value })}
                            className="mt-1 w-full rounded-lg border border-outline/30 bg-surface-container-lowest px-2 py-1.5"
                            required
                          />
                        </label>
                        <label className="text-xs font-medium text-on-surface">
                          Reason
                          <textarea
                            value={mouRequest.notes}
                            onChange={(event) => setMouRequest({ ...mouRequest, notes: event.target.value })}
                            className="mt-1 w-full rounded-lg border border-outline/30 bg-surface-container-lowest px-2 py-1.5"
                            rows="2"
                            placeholder="Explain the demand or shortage"
                          />
                        </label>
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setMouRequest(null)} className="rounded-lg px-3 py-1.5 text-xs text-on-surface-variant">
                            Cancel
                          </button>
                          <button type="submit" disabled={isMouRequesting} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary disabled:opacity-60">
                            {isMouRequesting ? 'Sending...' : 'Send request'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setMouRequest({
                          inventory_batch_id: partner.inventory_batch_id,
                          quantity: String(Math.min(1, partner.quantity_shareable)),
                          urgency: 'normal',
                          department: '',
                          notes: '',
                        })}
                        className="mt-2 self-start rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary"
                      >
                        Request medicine
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container">
              <button
                type="button"
                onClick={() => setMouDialog(null)}
                className="px-4 py-2 rounded-xl bg-surface-container-low text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
