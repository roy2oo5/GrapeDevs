import React, { useState } from 'react';

export function ScenarioSimulationView({ onToast }) {
  // Knobs state
  const [multiplier, setMultiplier] = useState(2.4);
  const [delay, setDelay] = useState(14);
  const [r0, setR0] = useState(0.78);
  const [archetype, setArchetype] = useState('Epidemic Outbreak (Pathogen Surge)');
  const [selectedSkuFilter, setSelectedSkuFilter] = useState('all');
  const [isRunningSim, setIsRunningSim] = useState(false);
  const [simSeed, setSimSeed] = useState('#SIM-2024-884');

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState(false);
  const [selectedProtocolAction, setSelectedProtocolAction] = useState(null);
  const [approvedAll, setApprovedAll] = useState(false);

  const resetDefaults = () => {
    setMultiplier(2.4);
    setDelay(14);
    setR0(0.78);
    setArchetype('Epidemic Outbreak (Pathogen Surge)');
    if (onToast) onToast('Reset simulation parameters to standard scenario baseline.');
  };

  const handleRunSimulation = () => {
    setIsRunningSim(true);
    setTimeout(() => {
      setIsRunningSim(false);
      const newSeed = `#SIM-2024-${Math.floor(100 + Math.random() * 900)}`;
      setSimSeed(newSeed);
      if (onToast) onToast(`Monte Carlo 10,000 MCMC runs recalculated with seed ${newSeed}!`);
    }, 1200);
  };

  const handleApproveAll = () => {
    setApprovedAll(true);
    if (onToast) onToast('All High-Impact Mitigation Transfers Approved & Dispatched to Logistics Mesh!');
  };

  // Dynamically calculated risk values based on sliders
  const dynamicRiskSKUs = Math.min(14, Math.max(3, Math.round(multiplier * 3.5 + delay * 0.15)));
  const dynamicZeroDay = Math.max(2, Math.round(8 - multiplier * 1.5 - delay * 0.1));
  const dynamicVulnerability = Math.min(99.4, (multiplier * 22 + delay * 1.6 + r0 * 18).toFixed(1));

  return (
    <div className="flex flex-col w-full animate-fadeIn">
      {/* Top Breadcrumb & Metadata Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm mb-space-md">
        <div className="flex items-center gap-2">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Clinical Operations</span>
          <span className="text-outline text-label-sm">/</span>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Risk &amp; Disaster Intelligence</span>
          <span className="text-outline text-label-sm">/</span>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold">Scenario Simulation Engine</span>
        </div>

        {/* Quick Telemetry Chips */}
        <div className="flex items-center gap-space-sm">
          <div className="flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-pulse"></span>
            <span>Stochastic Core Active</span>
          </div>
          <div className="px-space-sm py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-semibold">
            MCMC Iterations: 10,000
          </div>
        </div>
      </div>

      {/* Screen Header Banner */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-md mb-space-lg bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] relative overflow-hidden">
        {/* Ambient cyan backdrop glow */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col gap-1 z-10 max-w-3xl">
          <div className="flex items-center gap-space-sm">
            <div className="w-8 h-8 rounded-lg bg-primary-container/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">psychology</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">Scenario Simulation Engine &amp; Stress Testing</h1>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Monte Carlo stochastic sandbox for multi-facility epidemic surges, pharmaceutical supply chokeholds, and proactive mutual-aid mitigation.
          </p>
        </div>

        {/* Header Actions & Preset Selector */}
        <div className="flex flex-wrap items-center gap-space-sm z-10">
          {/* Preset Dropdown */}
          <div className="relative flex items-center">
            <div className="flex items-center gap-space-sm px-space-md py-2 rounded-xl bg-surface-container-low text-on-surface cursor-pointer hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-[18px] text-primary">bookmark</span>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-outline">Scenario Preset</span>
                <span className="font-label-md text-label-md text-on-surface font-semibold truncate max-w-[200px]">Tri-State RSV &amp; Avian Flu Surge</span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-outline ml-1">expand_more</span>
            </div>
          </div>

          {/* Export Button */}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-space-md py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all font-label-md text-label-md font-semibold cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export Sensitivity Report</span>
          </button>

          {/* Save Preset Button */}
          <button
            type="button"
            onClick={() => setIsSavePresetModalOpen(true)}
            className="flex items-center gap-1.5 px-space-md py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all font-label-md text-label-md font-semibold cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
            <span>Save Preset</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 30% Configuration Left Panel / 70% Results Right Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* LEFT PANEL: Scenario Controls & Knobs (4 Cols) */}
        <aside className="lg:col-span-4 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] flex flex-col gap-space-md relative">
            {/* Header Strip */}
            <div className="flex items-center justify-between pb-space-sm bg-surface-container-low/40 -mx-space-lg -mt-space-lg px-space-lg pt-space-md rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Simulation Parameters</span>
              </div>
              <button
                type="button"
                onClick={resetDefaults}
                className="font-label-sm text-label-sm text-primary hover:underline font-semibold cursor-pointer"
              >
                Reset Defaults
              </button>
            </div>

            {/* Non-destructive Sandbox Badge */}
            <div className="flex items-center justify-between px-space-md py-2 rounded-xl bg-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse"></span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Sandbox Environment</span>
              </div>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-semibold">Non-Destructive</span>
            </div>

            {/* Archetype Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface-variant font-semibold">Select Scenario Archetype</label>
              <div className="relative">
                <select
                  value={archetype}
                  onChange={(e) => setArchetype(e.target.value)}
                  className="w-full h-11 px-space-md rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md appearance-none cursor-pointer focus:outline-none focus:bg-surface-container-lowest transition-colors pr-9 border-none"
                >
                  <option>Epidemic Outbreak (Pathogen Surge)</option>
                  <option>Critical Supplier &amp; Port Delay</option>
                  <option>Acute Unplanned Demand Spike</option>
                  <option>Compound Multi-Vector Shock</option>
                </select>
                <span className="material-symbols-outlined text-[18px] text-outline absolute right-3 top-3 pointer-events-none">expand_more</span>
              </div>
            </div>

            {/* Target Therapeutic Group */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface-variant font-semibold">Target Therapeutic Group</label>
              <div className="p-space-sm rounded-xl bg-surface-container-low flex flex-col gap-1">
                <span className="font-label-md text-label-md text-on-surface font-semibold">Broad-Spectrum Antibiotics &amp; Antivirals</span>
                <span className="font-body-sm text-body-sm text-outline truncate">Ceftriaxone, Remdesivir, Tamiflu, IV Paracetamol</span>
              </div>
            </div>

            {/* Knobs & Sliders */}
            <div className="flex flex-col gap-space-md pt-space-xs">
              {/* Slider 1: Outbreak Case Surge Multiplier */}
              <div className="flex flex-col gap-2 p-space-sm rounded-xl bg-surface-container-low/60">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">"What-If" Case Surge (e.g. +20% Dengue)</span>
                  <span className="font-headline-sm text-headline-sm text-primary font-semibold">+{Math.round((multiplier - 1) * 100)}% Surge</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="3.5"
                  step="0.1"
                  value={multiplier}
                  onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between items-center text-outline font-label-sm text-label-sm">
                  <span>+0% Normal</span>
                  <span>+250% Epidemic Surge</span>
                </div>
                <span className="font-body-sm text-body-sm text-outline leading-tight">
                  Simulates immediate impact on hospital inventory levels &amp; predicts critical shortages across network hospitals.
                </span>
              </div>

              {/* Slider 2: Chokehold Delay */}
              <div className="flex flex-col gap-2 p-space-sm rounded-xl bg-surface-container-low/60">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">Supplier Delay / Port Chokehold</span>
                  <span className="font-headline-sm text-headline-sm text-error font-semibold">{delay} Days</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={delay}
                  onChange={(e) => setDelay(parseInt(e.target.value, 10))}
                  className="w-full accent-error cursor-pointer"
                />
                <div className="flex justify-between items-center text-outline font-label-sm text-label-sm">
                  <span>0 Days (On-time)</span>
                  <span>30 Days (Complete Halt)</span>
                </div>
                <span className="font-body-sm text-body-sm text-outline leading-tight">
                  Disrupted primary distributor (Amerisource &amp; Cardinal Health depot).
                </span>
              </div>

              {/* Slider 3: Outbreak R0 Vector */}
              <div className="flex flex-col gap-2 p-space-sm rounded-xl bg-surface-container-low/60">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">Outbreak Severity Index (R₀)</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">{r0.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.01"
                  value={r0}
                  onChange={(e) => setR0(parseFloat(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between items-center">
                  <span className="font-label-sm text-label-sm text-outline">0.0 (Endemic)</span>
                  <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">
                    High Virulence / Cluster Alpha
                  </span>
                </div>
              </div>

              {/* Additional Disaster Parameters */}
              <div className="grid grid-cols-2 gap-space-sm">
                <div className="p-space-sm rounded-xl bg-surface-container-low flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-outline">ICU Occupancy Surge</span>
                  <span className="font-label-lg text-label-lg text-on-surface font-semibold">145% Capacity</span>
                  <span className="font-body-sm text-body-sm text-error font-semibold">+45% overflow</span>
                </div>
                <div className="p-space-sm rounded-xl bg-surface-container-low flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-outline">MOU Compact</span>
                  <span className="font-label-lg text-label-lg text-on-surface font-semibold">Bilateral Active</span>
                  <span className="font-body-sm text-body-sm text-tertiary font-semibold">Tier 1 &amp; Tier 2 Open</span>
                </div>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-col gap-space-sm pt-space-xs">
              <button
                type="button"
                disabled={isRunningSim}
                onClick={handleRunSimulation}
                className="w-full py-3.5 px-space-md rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg font-semibold shadow-[0_2px_10px_rgba(0,123,185,0.25)] flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
              >
                {isRunningSim ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                    <span>Running 10,000 MCMC Runs...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">bolt</span>
                    <span>Run Stochastic Simulation</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onToast) onToast('Cleared simulation cache. Ready for fresh parameter run.');
                }}
                className="w-full py-2.5 px-space-md rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant font-label-md text-label-md font-semibold transition-all cursor-pointer"
              >
                Clear Sandbox Cache
              </button>
            </div>

            {/* Model Metadata Monospace Box */}
            <div className="p-space-sm rounded-xl bg-surface-container-low flex flex-col gap-1">
              <div className="flex items-center justify-between text-outline font-label-sm text-label-sm">
                <span>Bayesian MCMC Engine v4.8</span>
                <span className="text-tertiary font-semibold">95% Conf. Band</span>
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                <span>Seed: {simSeed}</span>
                <span>Computed in 1.4s</span>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL: Simulation Results & Prescriptive Interventions (8 Cols) */}
        <main className="lg:col-span-8 flex flex-col gap-space-lg">
          {/* Section 1: Comparative Delta Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            {/* Card 1: Baseline */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] flex flex-col justify-between gap-space-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-outline">Baseline Trajectory</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-semibold">Normal Burn</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="font-headline-xl text-headline-xl text-on-surface font-semibold tracking-tight">2 SKUs</div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Projected Shortages</span>
              </div>
              <div className="pt-space-xs flex flex-col gap-1 bg-surface-container-low/40 p-space-sm rounded-lg">
                <div className="flex justify-between items-center text-outline font-body-sm text-body-sm">
                  <span>Avg Runout Horizon:</span>
                  <span className="font-semibold text-on-surface">14.2 Days</span>
                </div>
                <div className="flex justify-between items-center text-outline font-body-sm text-body-sm">
                  <span>Projected Deficit:</span>
                  <span className="font-semibold text-on-surface">324 Units</span>
                </div>
              </div>
            </div>

            {/* Card 2: Simulated Stress Scenario */}
            <div className="bg-error-container/20 p-space-md rounded-xl shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] flex flex-col justify-between gap-space-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-error font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  Simulated Shock Surge
                </span>
                <span className="px-2 py-0.5 rounded-full bg-error text-on-error font-label-sm text-label-sm font-semibold">Tier-3 Alert</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="font-headline-xl text-headline-xl text-error font-semibold tracking-tight">{dynamicRiskSKUs} SKUs</div>
                <span className="font-label-sm text-label-sm text-error font-semibold">+{dynamicRiskSKUs - 2} SKUs at Immediate Risk</span>
              </div>
              <div className="pt-space-xs flex flex-col gap-1 bg-surface-container-lowest/80 p-space-sm rounded-lg">
                <div className="flex justify-between items-center text-outline font-body-sm text-body-sm">
                  <span>First Critical Zero:</span>
                  <span className="font-semibold text-error">Day {dynamicZeroDay} (14:00)</span>
                </div>
                <div className="flex justify-between items-center text-outline font-body-sm text-body-sm">
                  <span>Network Gap Deficit:</span>
                  <span className="font-semibold text-error">2,485 Units</span>
                </div>
              </div>
            </div>

            {/* Card 3: Network Vulnerability Index */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] flex flex-col justify-between gap-space-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-outline">Network Vulnerability</span>
                <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">Code Amber</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="font-headline-xl text-headline-xl text-primary font-semibold tracking-tight">
                  {dynamicVulnerability} <span className="text-headline-sm font-label-sm text-outline font-normal">/ 100</span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Baseline was 18.2 / 100 (+{(dynamicVulnerability - 18.2).toFixed(1)})</span>
              </div>
              <div className="pt-space-xs flex flex-col gap-1 bg-surface-container-low/40 p-space-sm rounded-lg">
                <div className="flex justify-between items-center text-outline font-body-sm text-body-sm">
                  <span>Resilience Index:</span>
                  <span className="font-semibold text-error">Fragile (Tier 1-A)</span>
                </div>
                <div className="flex justify-between items-center text-outline font-body-sm text-body-sm">
                  <span>District Impact:</span>
                  <span className="font-semibold text-on-surface">District 4 Triggered</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Interactive Dual-Line Depletion Chart */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] flex flex-col gap-space-md">
            {/* Chart Header & SKU Switcher */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-sm">
              <div className="flex flex-col">
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Stock Depletion &amp; Buffer Trajectory (14-Day Horizon)</h2>
                <span className="font-body-sm text-body-sm text-outline">Aggregated demand forecast across 6 synced tertiary trauma network facilities</span>
              </div>

              {/* SKU Selector Pills */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-surface-container-low">
                {['all', 'paracetamol', 'ceftriaxone', 'propofol'].map((filterKey) => (
                  <button
                    key={filterKey}
                    type="button"
                    onClick={() => setSelectedSkuFilter(filterKey)}
                    className={`px-3 py-1 rounded-lg font-label-sm text-label-sm cursor-pointer transition-all ${
                      selectedSkuFilter === filterKey
                        ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {filterKey === 'all' && 'All High-Risk SKUs'}
                    {filterKey === 'paracetamol' && 'Paracetamol 500mg IV'}
                    {filterKey === 'ceftriaxone' && 'Ceftriaxone 1g'}
                    {filterKey === 'propofol' && 'Propofol 10mg/mL'}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-space-md px-space-sm py-2 rounded-lg bg-surface-container-low/50">
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 bg-primary rounded-full"></span>
                <span className="font-label-sm text-label-sm text-on-surface font-medium">Baseline Runout Trajectory</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-0.5 border-b-2 border-dashed border-error"></span>
                <span className="font-label-sm text-label-sm text-error font-medium">Simulated Scenario Depletion</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-primary-container/15 rounded"></span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Safe Operational Buffer (5-Day Reserve)</span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
                <span className="font-label-sm text-label-sm text-error font-semibold">Critical Zero Depletion (Day {dynamicZeroDay} // 14:00)</span>
              </div>
            </div>

            {/* Rich SVG Interactive Chart */}
            <div className="relative w-full h-[320px] bg-surface-container-low/20 rounded-xl overflow-hidden p-2">
              <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 800 280">
                <defs>
                  <linearGradient id="bufferGradientSim" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#007bb9" stopOpacity="0.12"></stop>
                    <stop offset="100%" stopColor="#007bb9" stopOpacity="0.02"></stop>
                  </linearGradient>
                  <linearGradient id="scenarioGradientSim" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ba1a1a" stopOpacity="0.18"></stop>
                    <stop offset="100%" stopColor="#ba1a1a" stopOpacity="0.0"></stop>
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                <line stroke="#e0e3e5" strokeDasharray="3 3" strokeWidth="1" x1="40" x2="780" y1="30" y2="30"></line>
                <line stroke="#e0e3e5" strokeDasharray="3 3" strokeWidth="1" x1="40" x2="780" y1="90" y2="90"></line>
                <line stroke="#e0e3e5" strokeDasharray="3 3" strokeWidth="1" x1="40" x2="780" y1="150" y2="150"></line>
                <line stroke="#e0e3e5" strokeDasharray="3 3" strokeWidth="1" x1="40" x2="780" y1="210" y2="210"></line>
                <line stroke="#707881" strokeWidth="1" x1="40" x2="780" y1="240" y2="240"></line>

                {/* Y-Axis Labels */}
                <text fill="#707881" fontSize="10" textAnchor="end" x="35" y="34">3,500u</text>
                <text fill="#707881" fontSize="10" textAnchor="end" x="35" y="94">2,500u</text>
                <text fill="#707881" fontSize="10" textAnchor="end" x="35" y="154">1,500u</text>
                <text fill="#707881" fontSize="10" textAnchor="end" x="35" y="214">500u</text>
                <text fill="#707881" fontSize="10" textAnchor="end" x="35" y="244">0u</text>

                {/* Safe Operational Reserve Area */}
                <rect fill="url(#bufferGradientSim)" height="60" width="740" x="40" y="180"></rect>
                <line stroke="#007bb9" strokeDasharray="4 4" strokeOpacity="0.6" strokeWidth="1.5" x1="40" x2="780" y1="180" y2="180"></line>
                <text fill="#006194" fontSize="9.5" fontWeight="600" x="48" y="194">5-DAY SAFETY THRESHOLD (800 UNITS)</text>

                {/* Baseline Trajectory Curve */}
                <path d="M 60,45 Q 260,110 440,165 T 760,205" fill="none" stroke="#006194" strokeLinecap="round" strokeWidth="3"></path>

                {/* Simulated Scenario Depletion Curve */}
                <path d="M 60,45 Q 160,120 260,240 L 760,240" fill="none" stroke="#ba1a1a" strokeDasharray="6 4" strokeLinecap="round" strokeWidth="3"></path>
                <path d="M 60,45 Q 160,120 260,240 L 60,240 Z" fill="url(#scenarioGradientSim)"></path>

                {/* Vertical Marker for Day 4 Stockout */}
                <line stroke="#ba1a1a" strokeDasharray="4 3" strokeWidth="2" x1="260" x2="260" y1="30" y2="240"></line>
                <circle cx="260" cy="240" fill="#ba1a1a" r="5"></circle>
                <circle className="animate-ping" cx="260" cy="240" fill="none" r="10" stroke="#ba1a1a" strokeOpacity="0.5" strokeWidth="1.5"></circle>

                {/* X-Axis Labels */}
                <text fill="#707881" fontSize="10" textAnchor="middle" x="60" y="260">Day 1 (Today)</text>
                <text fill="#707881" fontSize="10" textAnchor="middle" x="125" y="260">Day 2</text>
                <text fill="#707881" fontSize="10" textAnchor="middle" x="190" y="260">Day 3</text>
                <text fill="#ba1a1a" fontSize="10" fontWeight="700" textAnchor="middle" x="260" y="260">Day {dynamicZeroDay} [ZERO]</text>
                <text fill="#707881" fontSize="10" textAnchor="middle" x="350" y="260">Day 6</text>
                <text fill="#707881" fontSize="10" textAnchor="middle" x="450" y="260">Day 8</text>
                <text fill="#707881" fontSize="10" textAnchor="middle" x="550" y="260">Day 10</text>
                <text fill="#707881" fontSize="10" textAnchor="middle" x="650" y="260">Day 12</text>
                <text fill="#707881" fontSize="10" textAnchor="middle" x="750" y="260">Day 14</text>
              </svg>

              {/* Interactive Tooltip Callout */}
              <div className="absolute left-[33%] top-6 bg-surface-container-lowest p-space-sm rounded-xl shadow-[0_12px_20px_-3px_rgba(15,23,42,0.12)] max-w-xs z-20 pointer-events-none">
                <div className="flex items-center justify-between pb-1">
                  <span className="font-label-sm text-label-sm text-error font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                    Day {dynamicZeroDay} Critical Outage
                  </span>
                  <span className="font-label-sm text-label-sm text-outline">14:00 EST</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface leading-tight font-medium">
                  Paracetamol 500mg IV drops to 0 units.
                </p>
                <div className="flex items-center justify-between pt-1 mt-1 bg-surface-container-low px-2 py-1 rounded text-outline font-label-sm text-label-sm">
                  <span>Surge Burn: 680u/day</span>
                  <span className="text-error font-bold">Deficit: -1,220u</span>
                </div>
              </div>
            </div>

            {/* Telemetry Details Strip below chart */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm pt-space-xs">
              <div className="flex items-center gap-2 p-space-sm rounded-lg bg-surface-container-low">
                <span className="material-symbols-outlined text-primary text-[20px]">trending_down</span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-outline">Daily Consumption Surge</span>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">+140% above baseline rate</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-space-sm rounded-lg bg-surface-container-low">
                <span className="material-symbols-outlined text-error text-[20px]">timer_off</span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-outline">Stockout Cliff</span>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">74.5 Hours remaining</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-space-sm rounded-lg bg-surface-container-low">
                <span className="material-symbols-outlined text-tertiary text-[20px]">handshake</span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-outline">Mutual Aid Relievers</span>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">3 MOU Nodes with surplus</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Recommended Interventions & Automated Mitigation Plan */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] flex flex-col gap-space-md">
            {/* Header & Mass Approve Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Recommended Interventions &amp; Automated Mitigation Plan</h3>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Algorithmic Prescriptive Actions ranked by urgency and runout extension yield</span>
              </div>
              <button
                type="button"
                onClick={handleApproveAll}
                className={`flex items-center gap-1.5 px-space-md py-2 rounded-xl text-on-tertiary font-label-md text-label-md font-semibold transition-all shadow-[0_2px_8px_rgba(0,133,91,0.2)] cursor-pointer ${
                  approvedAll ? 'bg-tertiary' : 'bg-tertiary-container hover:bg-tertiary'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{approvedAll ? 'verified' : 'done_all'}</span>
                <span>{approvedAll ? '3 Transfers Initiated to Logistics' : 'Approve All High-Impact Transfers'}</span>
              </button>
            </div>

            {/* Prescriptive Actions List */}
            <div className="flex flex-col gap-space-sm">
              {/* Action 1: Critical Immediate MOU Express Corridor */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container-high/60 transition-colors">
                <div className="flex items-start gap-space-md flex-1">
                  <div className="flex flex-col items-center gap-1 min-w-[100px]">
                    <span className="px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold tracking-wide">
                      CRITICAL
                    </span>
                    <span className="font-body-sm text-body-sm text-outline">Immediate</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                      Redistribute 500 units of Paracetamol 500mg IV from Valley Trauma Center
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Route via MOU Express Corridor to prevent zero-stockout on Day 4. Valley Trauma has 21 days surplus and agreed emergency rate.
                    </p>
                    <div className="flex flex-wrap items-center gap-space-sm mt-1">
                      <span className="px-2 py-0.5 rounded bg-surface-container-high font-label-sm text-label-sm text-tertiary font-semibold">
                        +4.2 Days Buffer Restored
                      </span>
                      <span className="font-body-sm text-body-sm text-outline">•</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                        District Courier • 28 min ETA
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-space-sm lg:self-center pl-space-md">
                  <button
                    type="button"
                    onClick={() => onToast && onToast('Transfer executed for 500u Paracetamol 500mg IV via CryoExpress!')}
                    className="px-space-md py-2 rounded-xl bg-tertiary-container hover:bg-tertiary text-on-tertiary font-label-sm text-label-sm font-semibold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Execute Transfer</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProtocolAction('Redistribute 500 units Paracetamol')}
                    className="p-2 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface-variant transition-colors cursor-pointer"
                    title="Review Protocol"
                  >
                    <span className="material-symbols-outlined text-[18px]">description</span>
                  </button>
                </div>
              </div>

              {/* Action 2: Emergency Compounding Batch */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container-high/60 transition-colors">
                <div className="flex items-start gap-space-md flex-1">
                  <div className="flex flex-col items-center gap-1 min-w-[100px]">
                    <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold tracking-wide">
                      HIGH
                    </span>
                    <span className="font-body-sm text-body-sm text-outline">&lt; 24h Window</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                      Pre-authorize Emergency Compounding Batch #CMP-409 at MedCare Central Depo
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Yield: +400 units sterile solution. Active pharmaceutical ingredients (API) present in cleanroom storage with 48h stability validation.
                    </p>
                    <div className="flex flex-wrap items-center gap-space-sm mt-1">
                      <span className="px-2 py-0.5 rounded bg-surface-container-high font-label-sm text-label-sm text-tertiary font-semibold">
                        Deficit Resolved (100%)
                      </span>
                      <span className="font-body-sm text-body-sm text-outline">•</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                        Internal Depo • Ready in 6h
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-space-sm lg:self-center pl-space-md">
                  <button
                    type="button"
                    onClick={() => onToast && onToast('Compounding Batch #CMP-409 Authorized for Cleanroom Queue.')}
                    className="px-space-md py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Authorize Batch</span>
                    <span className="material-symbols-outlined text-[16px]">science</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProtocolAction('Emergency Compounding Batch #CMP-409')}
                    className="p-2 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface-variant transition-colors cursor-pointer"
                    title="Review Protocol"
                  >
                    <span className="material-symbols-outlined text-[18px]">description</span>
                  </button>
                </div>
              </div>

              {/* Action 3: Tier-2 Mutual Aid Compact */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container-high/60 transition-colors">
                <div className="flex items-start gap-space-md flex-1">
                  <div className="flex flex-col items-center gap-1 min-w-[100px]">
                    <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold tracking-wide">
                      HIGH
                    </span>
                    <span className="font-body-sm text-body-sm text-outline">&lt; 24h Window</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                      Activate Tier-2 Mutual Aid Compact with North District Clinic for Ceftriaxone 1g
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Requisition 300 vials under Regional Emergency Response Charter #MOU-88. Automatic reciprocal replenishments queued upon shipment arrival.
                    </p>
                    <div className="flex flex-wrap items-center gap-space-sm mt-1">
                      <span className="px-2 py-0.5 rounded bg-surface-container-high font-label-sm text-label-sm text-tertiary font-semibold">
                        +2.5 Days Runout Extended
                      </span>
                      <span className="font-body-sm text-body-sm text-outline">•</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                        CryoCourier • 45 min ETA
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-space-sm lg:self-center pl-space-md">
                  <button
                    type="button"
                    onClick={() => onToast && onToast('Mutual Aid Request for Ceftriaxone 1g submitted to North District Clinic.')}
                    className="px-space-md py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Request Transfer</span>
                    <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProtocolAction('Tier-2 Mutual Aid Compact for Ceftriaxone')}
                    className="p-2 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface-variant transition-colors cursor-pointer"
                    title="Review Protocol"
                  >
                    <span className="material-symbols-outlined text-[18px]">description</span>
                  </button>
                </div>
              </div>

              {/* Action 4: Clinical Alternative Substitution Protocol */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container-high/60 transition-colors">
                <div className="flex items-start gap-space-md flex-1">
                  <div className="flex flex-col items-center gap-1 min-w-[100px]">
                    <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-semibold tracking-wide">
                      MODERATE
                    </span>
                    <span className="font-body-sm text-body-sm text-outline">&lt; 72h Window</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                      Switch non-ICU patients to oral alternative (Acetaminophen 650mg PO)
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Reduces parenteral IV demand burn rate by 32% across general pediatric &amp; geriatric inpatient wards. Automated EHR order set override ready.
                    </p>
                    <div className="flex flex-wrap items-center gap-space-sm mt-1">
                      <span className="px-2 py-0.5 rounded bg-surface-container-high font-label-sm text-label-sm text-tertiary font-semibold">
                        Conserves 220 IV Units/Day
                      </span>
                      <span className="font-body-sm text-body-sm text-outline">•</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                        Clinical Protocol Override
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-space-sm lg:self-center pl-space-md">
                  <button
                    type="button"
                    onClick={() => onToast && onToast('Clinical Order Set Deployed across Inpatient EHR Units.')}
                    className="px-space-md py-2 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-sm text-label-sm font-semibold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Deploy Order Set</span>
                    <span className="material-symbols-outlined text-[16px]">clinical_notes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProtocolAction('Oral Substitution Protocol (Acetaminophen PO)')}
                    className="p-2 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface-variant transition-colors cursor-pointer"
                    title="Review Protocol"
                  >
                    <span className="material-symbols-outlined text-[18px]">tune</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* EXPORT SENSITIVITY REPORT MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-space-md animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-space-lg flex flex-col gap-space-md shadow-2xl border border-surface-container-high">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">download</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Export Sensitivity Analysis</h3>
                  <p className="text-xs text-secondary">Monte Carlo Stochastic Summary</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant font-body-sm">
              Generates a comprehensive PDF and raw CSV report encompassing 10,000 MCMC probabilistic runout curves, supplier bottleneck sensitivity deltas, and multi-facility mutual-aid relief models.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-secondary text-sm font-semibold hover:bg-surface-container cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsExportModalOpen(false);
                  if (onToast) onToast('Sensitivity Report PDF & Raw CSV exported successfully!');
                }}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-md hover:bg-primary-container cursor-pointer"
              >
                Download Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVE PRESET MODAL */}
      {isSavePresetModalOpen && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-space-md animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-space-lg flex flex-col gap-space-md shadow-2xl border border-surface-container-high">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-tertiary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">bookmark_add</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Save Scenario Preset</h3>
                  <p className="text-xs text-secondary">Save custom parameter configuration</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSavePresetModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsSavePresetModalOpen(false);
                if (onToast) onToast('Custom Simulation Preset saved to Regional Library!');
              }}
              className="space-y-3 pt-2"
            >
              <div>
                <label className="block text-xs font-semibold text-outline uppercase mb-1">Preset Name</label>
                <input
                  type="text"
                  required
                  defaultValue="Custom Winter Surge & 14D Delay"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high text-on-surface text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSavePresetModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-secondary text-sm font-semibold hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-md hover:bg-primary-container cursor-pointer"
                >
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROTOCOL REVIEW DIALOG */}
      {selectedProtocolAction && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-space-md animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-space-lg flex flex-col gap-space-md shadow-2xl border border-surface-container-high">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">description</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Clinical Protocol Review</h3>
                  <p className="text-xs text-secondary">{selectedProtocolAction}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProtocolAction(null)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-3 bg-surface-container-low rounded-xl text-xs font-body-sm text-on-surface space-y-2">
              <div className="flex justify-between"><span className="text-outline">Governance Accord:</span><span className="font-semibold">MOU-2024-D4 Section 4.2</span></div>
              <div className="flex justify-between"><span className="text-outline">Legal Indemnification:</span><span className="text-tertiary font-semibold">Pre-Authorized Active Compact</span></div>
              <div className="flex justify-between"><span className="text-outline">DSCSA Serialization:</span><span className="font-mono">FIPS 140-3 Level 3 Validated</span></div>
              <div className="flex justify-between"><span className="text-outline">Cold Chain Transport:</span><span>CryoExpress Logistics Fleet (SLA &lt; 45m)</span></div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedProtocolAction(null)}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-md hover:bg-primary-container cursor-pointer"
              >
                Close Protocol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
