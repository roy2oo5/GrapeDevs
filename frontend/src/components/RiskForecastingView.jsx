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
  const [demandForecast, setDemandForecast] = useState(null);
  const [isDemandForecasting, setIsDemandForecasting] = useState(false);
  const [partnerAvailability, setPartnerAvailability] = useState(null);
  const [mouRequest, setMouRequest] = useState(null);
  const [isMouRequesting, setIsMouRequesting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllRiskRows, setShowAllRiskRows] = useState(false);

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
      const result = await fetchInventoryForecast(7);
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
      const forecast = await fetchInventoryForecast(7);
      setForecastRows(forecast.forecasts);
      if (onToast) onToast(`Forecast calculated for ${forecast.forecasts.length} inventory batches.`);
    } catch (error) {
      setForecastError(error.message || 'Could not calculate hospital inventory forecasts.');
    }
  };

  const handleInventorySelection = (event) => {
    const batchId = event.target.value;
    setSelectedInventoryBatch(batchId);
    setDemandForecast(null);
    setForecastError('');
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
  }).sort((a, b) => {
    const severity = { Critical: 0, 'At Risk': 1, 'In Range': 2 };
    return severity[a.status] - severity[b.status] || a.rank - b.rank;
  });
  const filteredShortageData = shortageData.filter((item) => (
    `${item.sku} ${item.code} ${item.status}`.toLowerCase().includes(searchQuery.trim().toLowerCase())
  ));
  const visibleShortageData = showAllRiskRows ? filteredShortageData : filteredShortageData.slice(0, 5);
  const forecastableBatches = inventoryBatches.filter((batch) => Number(batch.quantity) > 0);
  const selectedBatch = inventoryBatches.find(
    (batch) => String(batch.id) === String(demandForecast?.inventory_batch_id),
  );
  const forecastUnit = selectedBatch?.unit || 'units';
  const expectedUse = demandForecast?.daily_forecast?.reduce(
    (total, day) => total + Number(day.predicted_demand || 0),
    0,
  ) ?? null;
  const daysUntilStockout = demandForecast?.days_until_stockout;
  const stockoutEstimate = daysUntilStockout == null
    ? 'Not enough information'
    : `About ${Math.max(1, Math.round(daysUntilStockout))} days`;
  return (
    <div className="flex flex-col w-full gap-space-lg pb-12 animate-fadeIn">
      <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-md">
        <div className="flex flex-col gap-1 min-w-0">
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">Medicine forecast</h1>
        </div>
      </section>
      <section className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-md border border-primary/20">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-on-surface-variant">Choose a medicine with stock to see expected use and when it may run out.</p>
        </div>
        {forecastError && <div role="alert" className="mt-4 rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 text-sm text-on-error-container">{forecastError}</div>}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_auto] gap-3 items-end">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-on-surface">
            Medicine in your inventory
            <select
              value={selectedInventoryBatch}
              onChange={handleInventorySelection}
              disabled={!forecastableBatches.length}
              className="rounded-lg border border-outline/30 bg-surface-container-low px-3 py-2.5 text-on-surface"
            >
              <option value="">Select a medicine</option>
              {forecastableBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.sku_name} — {batch.quantity} {batch.unit} available
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleRunDemandForecast}
            disabled={isDemandForecasting || !selectedInventoryBatch}
            className="rounded-lg bg-primary px-4 py-2.5 font-semibold text-on-primary disabled:opacity-50"
          >
            {isDemandForecasting ? 'Checking...' : 'Check forecast'}
          </button>
        </div>
        {demandForecast && (
          <div className="mt-5">
            <div role="status" className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
              demandForecast.data_source === 'lightgbm_real_history'
                ? 'border-tertiary/40 bg-tertiary-container/50 text-on-tertiary-container'
                : demandForecast.data_source === 'inventory_batch_average'
                  ? 'border-secondary/40 bg-secondary-container/50 text-on-secondary-container'
                  : 'border-outline/30 bg-surface-container-low text-on-surface'
            }`}>
              {demandForecast.data_source === 'lightgbm_real_history'
                ? 'ML is running.'
                : demandForecast.data_source === 'inventory_batch_average'
                  ? 'Previous usage data is required.'
                  : 'Using previous usage data.'}
            </div>
            <div aria-label="Forecast result" className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-surface-container-low px-3 py-3">
                <span className="block text-xs text-on-surface-variant">Stock available now</span>
                <strong className="mt-1 block text-base text-on-surface">
                  {demandForecast.current_quantity} {forecastUnit}
                </strong>
              </div>
              <div className="rounded-lg bg-surface-container-low px-3 py-3">
                <span className="block text-xs text-on-surface-variant">
                  Estimated use in {demandForecast.horizon_days} days
                </span>
                <strong className="mt-1 block text-base text-on-surface">
                  {expectedUse === null ? 'Not available' : `About ${Math.round(expectedUse)} ${forecastUnit}`}
                </strong>
              </div>
              <div className="rounded-lg bg-surface-container-low px-3 py-3">
                <span className="block text-xs text-on-surface-variant">Stock may run out in</span>
                <strong className="mt-1 block text-base text-on-surface">{stockoutEstimate}</strong>
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
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search forecasts by medicine or status" className="min-w-0 flex-1 rounded-lg border border-outline/30 bg-surface-container-lowest px-3 py-2 text-sm" />
              <span className="text-xs text-on-surface-variant">{filteredShortageData.length} forecast records</span>
            </div>
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
                  {visibleShortageData.map((item) => (
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
                  {visibleShortageData.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-sm text-on-surface-variant">No forecasts match your search.</td></tr>}
                </tbody>
              </table>
            </div>
            {!showAllRiskRows && filteredShortageData.length > 5 && (
              <button type="button" onClick={() => setShowAllRiskRows(true)} className="mt-3 w-full py-2 text-sm font-semibold text-primary">Show all {filteredShortageData.length} forecasts</button>
            )}
            {showAllRiskRows && filteredShortageData.length > 5 && (
              <button type="button" onClick={() => setShowAllRiskRows(false)} className="mt-3 w-full py-2 text-sm font-semibold text-primary">Show top 5 forecasts</button>
            )}
          </div>

        </div>
      </section>

      {/* MOU partner inventory details */}
      {mouDialog && (
        <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-xl w-full p-space-xl flex flex-col gap-space-md border border-surface-container-high">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed/40 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">local_shipping</span>
                </div>
                <div className="flex flex-col">
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{mouDialog.title}</h4>
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
