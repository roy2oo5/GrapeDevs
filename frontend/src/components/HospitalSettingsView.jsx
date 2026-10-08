import React, { useState } from 'react';

export function HospitalSettingsView({ onToast }) {
  const [activeModule, setActiveModule] = useState('supply-chain-rules');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');

  // Sliders
  const [shortageWindow, setShortageWindow] = useState(72);
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);

  // Modals
  const [isMQTTModalOpen, setIsMQTTModalOpen] = useState(false);
  const [isSandboxModalOpen, setIsSandboxModalOpen] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(3);

  // Medication parameter items
  const [medications, setMedications] = useState([
    {
      id: 'MED-PARA-500',
      name: 'Paracetamol 500mg IV Infusion',
      atc: 'N02BE01',
      category: 'Analgesics',
      aiLeadDays: 4,
      adjustedDays: 6,
      reorderUnits: 350,
      bufferDays: 4.8,
      criticality: 'High',
      impactText: 'Shortage alert accelerates by 1.2d',
      impactType: 'warning',
      isModified: true
    },
    {
      id: 'MED-CEFT-01G',
      name: 'Ceftriaxone 1g Powder for Injection',
      atc: 'J01DD04',
      category: 'Antibiotics',
      aiLeadDays: 10,
      adjustedDays: 10,
      reorderUnits: 250,
      bufferDays: 6.5,
      criticality: 'High',
      impactText: 'Aligned with regional distributor SLA',
      impactType: 'success'
    },
    {
      id: 'MED-PROP-10M',
      name: 'Propofol 10mg/mL Injectable Emulsion',
      atc: 'N01AX10',
      category: 'Anesthetics',
      coldChain: '2-8°C Staged',
      aiLeadDays: 14,
      adjustedDays: 14,
      reorderUnits: 80,
      bufferDays: 3.9,
      criticality: 'High',
      impactText: 'Cold chain shipping buffer included',
      impactType: 'info'
    },
    {
      id: 'MED-ENXR-40M',
      name: 'Enoxaparin Sodium 40mg/0.4mL Pre-filled Syringes',
      atc: 'B01AB05',
      category: 'Anticoagulants',
      aiLeadDays: 5,
      adjustedDays: 5,
      reorderUnits: 200,
      bufferDays: 7.1,
      criticality: 'Med',
      impactText: 'Stable buffer trajectory',
      impactType: 'success'
    },
    {
      id: 'MED-SEVO-250',
      name: 'Sevoflurane 250ml Inhalation Liquid',
      atc: 'N01AB08',
      category: 'Anesthetics',
      aiLeadDays: 8,
      adjustedDays: 8,
      reorderUnits: 60,
      bufferDays: 5.0,
      criticality: 'Med',
      impactText: 'Stable',
      impactType: 'neutral'
    },
    {
      id: 'MED-EPIN-01M',
      name: 'Epinephrine 1mg/mL Auto-Injector',
      atc: 'C01CA24',
      category: 'Emergency Resus',
      badge: 'Crash Cart Ready',
      aiLeadDays: 3,
      adjustedDays: 3,
      reorderUnits: 60,
      bufferDays: 8.4,
      criticality: 'High',
      impactText: 'Code Blue emergency reserve locked',
      impactType: 'locked'
    },
    {
      id: 'MED-NSAL-1000',
      name: 'Normal Saline 0.9% 1000mL IV Bags',
      atc: 'B05CB01',
      category: 'IV Fluids',
      aiLeadDays: 4,
      adjustedDays: 4,
      reorderUnits: 1500,
      bufferDays: 5.5,
      criticality: 'Low',
      impactText: 'High-volume bulk replenishment',
      impactType: 'bulk'
    }
  ]);

  const updateAdjustedDays = (id, delta) => {
    setMedications(prev =>
      prev.map(m => {
        if (m.id === id) {
          const next = Math.max(1, m.adjustedDays + delta);
          return { ...m, adjustedDays: next, isModified: next !== m.aiLeadDays };
        }
        return m;
      })
    );
    setUnsavedChanges(prev => prev + 1);
  };

  const updateReorderUnits = (id, val) => {
    const num = parseInt(val, 10) || 0;
    setMedications(prev =>
      prev.map(m => (m.id === id ? { ...m, reorderUnits: num, isModified: true } : m))
    );
    setUnsavedChanges(prev => prev + 1);
  };

  const resetToDefaults = () => {
    setMedications(prev =>
      prev.map(m => ({ ...m, adjustedDays: m.aiLeadDays, isModified: false }))
    );
    setShortageWindow(72);
    setConfidenceThreshold(85);
    setUnsavedChanges(0);
    if (onToast) onToast('Reset all parameter rules to AI ML Recommended Defaults.');
  };

  const handleSaveAndDeploy = () => {
    setUnsavedChanges(0);
    if (onToast) {
      onToast('Parameters deployed! Recalculated 2 downstream MCMC predictive models.');
    }
  };

  const filteredMeds = medications.filter(m => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!m.name.toLowerCase().includes(q) && !m.id.toLowerCase().includes(q) && !m.atc.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (selectedCategory !== 'All' && m.category !== selectedCategory) return false;
    if (selectedPriority !== 'All' && m.criticality !== selectedPriority) return false;
    return true;
  });

  return (
    <div className="flex flex-col w-full animate-fadeIn">
      {/* Top Command Context Bar */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-md mb-space-lg">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-xs text-outline font-label-sm text-label-sm tracking-wider uppercase">
            <span>Administration</span>
            <span className="text-outline-variant font-normal">/</span>
            <span>System Settings</span>
            <span className="text-outline-variant font-normal">/</span>
            <span className="text-primary font-semibold">Hospital Configuration</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
            Settings &amp; Hospital Configuration
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
            Manage enterprise node parameters, machine learning predictive thresholds, and inter-hospital protocol calibrations across real-time telemetry pipelines.
          </p>
        </div>

        {/* Node Identity Capsule */}
        <div className="flex items-center gap-space-md self-start xl:self-auto bg-surface-container-lowest px-space-md py-2.5 rounded-xl shadow-sm border border-surface-container">
          <div className="flex items-center gap-space-sm">
            <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">domain_verification</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface leading-tight font-semibold">MedCare General Hospital (Node #MC-01)</span>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                <span className="font-body-sm text-body-sm text-outline">Configuration Synced • Last deployed 3h ago</span>
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 pl-space-md border-l-0">
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface-variant font-medium">Tier-1 Trauma Hub</span>
          </div>
        </div>
      </div>

      {/* Workspace Grid Layout: Tabs Sidebar + Settings Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Vertical Configuration Navigation (3 cols) */}
        <nav className="lg:col-span-3 xl:col-span-3 flex flex-col gap-space-sm bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container">
          <div className="px-space-sm pb-space-xs">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Calibration Modules</span>
          </div>

          {/* Tab 1: User Management */}
          <button
            type="button"
            onClick={() => setActiveModule('user-management')}
            className={`group flex items-start gap-space-sm p-space-sm rounded-xl text-left transition-colors cursor-pointer ${
              activeModule === 'user-management'
                ? 'bg-primary-container text-on-primary-container shadow-md font-semibold'
                : 'hover:bg-surface-container-high text-on-surface-variant'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-outline group-hover:text-on-surface">
              <span className="material-symbols-outlined text-[20px]">group</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-label-lg text-label-lg text-on-surface">User Management</span>
              <span className="font-body-sm text-body-sm text-outline truncate">Roles, RBAC &amp; 2FA Tokens</span>
            </div>
          </button>

          {/* Tab 2: Supply Chain Rules (ACTIVE by default) */}
          <button
            type="button"
            onClick={() => setActiveModule('supply-chain-rules')}
            className={`group flex items-start gap-space-sm p-space-sm rounded-xl text-left transition-colors cursor-pointer ${
              activeModule === 'supply-chain-rules'
                ? 'bg-primary-container text-on-primary-container shadow-md font-semibold'
                : 'hover:bg-surface-container-high text-on-surface-variant'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              activeModule === 'supply-chain-rules' ? 'bg-on-primary-container/15 text-on-primary-container' : 'bg-surface-container-low text-outline'
            }`}>
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className={`font-label-lg text-label-lg leading-tight ${activeModule === 'supply-chain-rules' ? 'text-on-primary-container font-semibold' : 'text-on-surface'}`}>Supply Chain Rules</span>
                {unsavedChanges > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-surface-container-lowest text-primary font-label-sm text-[10px] leading-tight font-bold">Modified</span>
                )}
              </div>
              <span className={`font-body-sm text-body-sm truncate ${activeModule === 'supply-chain-rules' ? 'text-on-primary-container/80' : 'text-outline'}`}>ML Triggers, Lead Times &amp; Thresholds</span>
            </div>
          </button>

          {/* Tab 3: Hospital Metrics */}
          <button
            type="button"
            onClick={() => setActiveModule('hospital-metrics')}
            className={`group flex items-start gap-space-sm p-space-sm rounded-xl text-left transition-colors cursor-pointer ${
              activeModule === 'hospital-metrics'
                ? 'bg-primary-container text-on-primary-container shadow-md font-semibold'
                : 'hover:bg-surface-container-high text-on-surface-variant'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-outline group-hover:text-on-surface">
              <span className="material-symbols-outlined text-[20px]">local_hospital</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-label-lg text-label-lg text-on-surface">Hospital Metrics</span>
              <span className="font-body-sm text-body-sm text-outline truncate">Bed Capacity, ICU Surge Multipliers</span>
            </div>
          </button>

          {/* Tab 4: API & Integrations */}
          <button
            type="button"
            onClick={() => setActiveModule('api-integrations')}
            className={`group flex items-start gap-space-sm p-space-sm rounded-xl text-left transition-colors cursor-pointer ${
              activeModule === 'api-integrations'
                ? 'bg-primary-container text-on-primary-container shadow-md font-semibold'
                : 'hover:bg-surface-container-high text-on-surface-variant'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-outline group-hover:text-on-surface">
              <span className="material-symbols-outlined text-[20px]">api</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-label-lg text-label-lg text-on-surface">API &amp; Integrations</span>
              <span className="font-body-sm text-body-sm text-outline truncate">EHR Webhooks, DSCSA Ledger API</span>
            </div>
          </button>

          {/* Sub-group: System Defaults */}
          <div className="pt-space-md mt-space-xs px-space-sm">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">System Defaults</span>
          </div>

          <button
            type="button"
            onClick={() => setActiveModule('audit-log')}
            className={`group flex items-center gap-space-sm px-space-sm py-2 rounded-xl text-left transition-colors cursor-pointer ${
              activeModule === 'audit-log' ? 'bg-surface-container text-on-surface font-semibold' : 'hover:bg-surface-container-high text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] text-outline">history</span>
            <span className="font-label-md text-label-md text-on-surface">Immutable Audit Log</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule('data-vault')}
            className={`group flex items-center gap-space-sm px-space-sm py-2 rounded-xl text-left transition-colors cursor-pointer ${
              activeModule === 'data-vault' ? 'bg-surface-container text-on-surface font-semibold' : 'hover:bg-surface-container-high text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] text-outline">database</span>
            <span className="font-label-md text-label-md text-on-surface">Data Retention &amp; Vault</span>
          </button>

          {/* Quick Telemetry Diagnostic Footprint */}
          <div className="mt-space-md p-space-sm rounded-xl bg-surface-container-low flex flex-col gap-1.5 border border-surface-container-high/60">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline">Regional Consensus</span>
              <span className="font-label-sm text-label-sm text-tertiary font-semibold">99.98%</span>
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
              <div className="bg-tertiary h-full rounded-full" style={{ width: '98.4%' }}></div>
            </div>
            <span className="font-body-sm text-[11px] text-on-surface-variant">Active node validator: US-EAST-CLINICAL-04</span>
          </div>
        </nav>

        {/* Main Content Area (9 cols) */}
        <div className="lg:col-span-9 xl:col-span-9 flex flex-col gap-space-lg">
          {/* Critical Impact Warning Banner */}
          <div className="relative overflow-hidden rounded-xl bg-error-container text-on-error-container p-space-md shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md">
              <div className="flex items-start gap-space-sm">
                <span className="material-symbols-outlined text-error text-[24px] mt-0.5">warning</span>
                <div className="flex flex-col">
                  <span className="font-label-lg text-label-lg text-error font-semibold leading-tight">
                    Warning: Modifying Dynamic Baseline Lead Times Impacts Downstream MCMC Forecasting
                  </span>
                  <p className="font-body-sm text-body-sm text-on-error-container/90 mt-0.5 max-w-2xl">
                    Altering procurement lead times directly recalculates the AI shortage prediction curves. Operational changes will cascade immediately into regional mutual-aid surge balancing triggers.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest text-error font-label-sm text-label-sm shadow-sm whitespace-nowrap font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                Audit Event #CFG-8821 Staged
              </span>
            </div>
          </div>

          {/* Section Title & Advanced Search / Filters */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md border border-surface-container">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div className="flex flex-col">
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Machine Learning &amp; Operational Parameters per Medicine
                </h2>
                <p className="font-body-sm text-body-sm text-outline">
                  Tune baseline supplier lead times, buffer thresholds, and crisis priority overrides used by the predictive outage model.
                </p>
              </div>
              <button
                type="button"
                onClick={resetToDefaults}
                className="inline-flex items-center gap-1.5 px-space-md py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest transition-colors text-on-surface-variant font-label-md text-label-md shadow-sm self-start md:self-auto cursor-pointer font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                Reset to ML Recommended Defaults
              </button>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-space-sm pt-space-xs">
              {/* Text Search Filter */}
              <div className="sm:col-span-6 lg:col-span-5 flex items-center gap-space-sm px-space-md py-2.5 rounded-xl bg-surface-container-low text-on-surface border border-surface-container-high/60">
                <span className="material-symbols-outlined text-[20px] text-outline">search</span>
                <input
                  className="bg-transparent border-0 outline-none w-full font-body-sm text-body-sm placeholder:text-outline text-on-surface"
                  placeholder="Filter medication, SKU, ATC code..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category Selector */}
              <div className="sm:col-span-3 lg:col-span-4 relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full appearance-none pl-9 pr-8 py-2.5 rounded-xl bg-surface-container-low text-on-surface-variant font-body-sm text-body-sm border-none outline-none cursor-pointer"
                >
                  <option value="All">All Therapeutic Classes</option>
                  <option value="Analgesics">Analgesics</option>
                  <option value="Antibiotics">Antibiotics</option>
                  <option value="Anesthetics">Anesthetics</option>
                  <option value="Anticoagulants">Anticoagulants</option>
                  <option value="Emergency Resus">Emergency Resus</option>
                  <option value="IV Fluids">IV Fluids</option>
                </select>
                <span className="material-symbols-outlined text-[18px] text-outline absolute left-3 top-3 pointer-events-none">category</span>
                <span className="material-symbols-outlined text-[18px] text-outline absolute right-3 top-3 pointer-events-none">expand_more</span>
              </div>

              {/* Priority Filter */}
              <div className="sm:col-span-3 lg:col-span-3 relative">
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full appearance-none pl-9 pr-8 py-2.5 rounded-xl bg-surface-container-low text-on-surface-variant font-body-sm text-body-sm border-none outline-none cursor-pointer"
                >
                  <option value="All">All Criticality</option>
                  <option value="High">High</option>
                  <option value="Med">Med</option>
                  <option value="Low">Low</option>
                </select>
                <span className="material-symbols-outlined text-[18px] text-outline absolute left-3 top-3 pointer-events-none">filter_list</span>
                <span className="material-symbols-outlined text-[18px] text-outline absolute right-3 top-3 pointer-events-none">expand_more</span>
              </div>
            </div>

            {/* Responsive Configuration Table */}
            <div className="overflow-x-auto -mx-space-lg px-space-lg pt-space-sm">
              <table className="w-full text-left border-collapse min-w-[920px]">
                <thead>
                  <tr className="bg-surface-container-low/70 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                    <th className="py-3 px-space-md rounded-l-xl">Medicine Formulation &amp; Identifiers</th>
                    <th className="py-3 px-space-md text-center">AI Lead Time vs Adjusted</th>
                    <th className="py-3 px-space-md text-center">Reorder Trigger</th>
                    <th className="py-3 px-space-md text-center">Dynamic Buffer</th>
                    <th className="py-3 px-space-md text-center">Criticality Override</th>
                    <th className="py-3 px-space-md rounded-r-xl">Model Impact Indicator</th>
                  </tr>
                </thead>
                <tbody className="divide-y-0 text-on-surface font-body-sm text-body-sm">
                  {filteredMeds.map((med) => (
                    <tr key={med.id} className="hover:bg-surface-container-low/50 transition-colors border-b border-surface-container-high/40">
                      <td className="py-space-md px-space-md">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-label-lg text-label-lg text-on-surface font-semibold leading-tight">{med.name}</span>
                            {med.coldChain && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-primary-fixed text-primary font-label-sm text-[10px]">
                                <span className="material-symbols-outlined text-[11px]">ac_unit</span> Cold Chain
                              </span>
                            )}
                            {med.badge && (
                              <span className="px-1.5 py-0.2 rounded bg-error-container text-error font-label-sm text-[10px] font-semibold">
                                {med.badge}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 pt-1 font-body-sm text-outline">
                            <span className="font-mono text-[11px] bg-surface-container-high px-1.5 py-0.5 rounded">SKU: {med.id}</span>
                            <span>•</span>
                            <span className="font-mono text-[11px]">ATC: {med.atc}</span>
                            {med.coldChain && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-[11px] text-primary">{med.coldChain}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-space-md px-space-md">
                        <div className="flex items-center justify-center gap-2">
                          {med.adjustedDays !== med.aiLeadDays && (
                            <span className="text-outline line-through text-[11px]">{med.aiLeadDays}d</span>
                          )}
                          <div className="flex items-center bg-surface-container-low rounded-lg p-1 shadow-inner">
                            <button
                              type="button"
                              onClick={() => updateAdjustedDays(med.id, -1)}
                              className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-container-high text-on-surface text-sm font-bold transition-colors cursor-pointer"
                            >
                              −
                            </button>
                            <input
                              className={`w-8 text-center bg-transparent border-0 outline-none font-semibold font-mono text-body-sm ${
                                med.adjustedDays !== med.aiLeadDays ? 'text-primary' : 'text-on-surface'
                              }`}
                              type="text"
                              value={med.adjustedDays}
                              readOnly
                            />
                            <button
                              type="button"
                              onClick={() => updateAdjustedDays(med.id, 1)}
                              className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-container-high text-on-surface text-sm font-bold transition-colors cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-outline text-[11px]">Days</span>
                        </div>
                      </td>
                      <td className="py-space-md px-space-md">
                        <div className="flex items-center justify-center">
                          <div className="flex items-center bg-surface-container-low rounded-lg px-2.5 py-1 shadow-inner">
                            <input
                              className="w-14 text-center bg-transparent border-0 outline-none font-mono font-semibold text-on-surface text-body-sm"
                              type="text"
                              value={med.reorderUnits}
                              onChange={(e) => updateReorderUnits(med.id, e.target.value)}
                            />
                            <span className="text-outline text-[11px] ml-1">Units</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-space-md px-space-md text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                          {med.bufferDays} Days Buffer
                        </span>
                      </td>
                      <td className="py-space-md px-space-md text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-sm text-label-sm font-semibold ${
                          med.criticality === 'High'
                            ? 'bg-error-container text-error'
                            : med.criticality === 'Med'
                            ? 'bg-secondary-container text-on-secondary-container'
                            : 'bg-tertiary-fixed/30 text-on-tertiary-fixed-variant'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            med.criticality === 'High' ? 'bg-error' : med.criticality === 'Med' ? 'bg-secondary' : 'bg-tertiary'
                          }`}></span>
                          {med.criticality}
                          <span className="material-symbols-outlined text-[14px]">unfold_more</span>
                        </span>
                      </td>
                      <td className="py-space-md px-space-md">
                        <div className="flex items-center gap-1.5">
                          {med.impactType === 'warning' && (
                            <>
                              <span className="material-symbols-outlined text-[16px] text-error">speed</span>
                              <span className="font-body-sm text-[12px] font-medium leading-tight text-error">{med.impactText}</span>
                            </>
                          )}
                          {med.impactType === 'success' && (
                            <>
                              <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                              <span className="font-body-sm text-[12px] leading-tight text-on-surface-variant">{med.impactText}</span>
                            </>
                          )}
                          {med.impactType === 'info' && (
                            <>
                              <span className="material-symbols-outlined text-[16px] text-primary">thermostat</span>
                              <span className="font-body-sm text-[12px] leading-tight font-medium text-primary">{med.impactText}</span>
                            </>
                          )}
                          {med.impactType === 'neutral' && (
                            <>
                              <span className="material-symbols-outlined text-[16px] text-outline">horizontal_rule</span>
                              <span className="font-body-sm text-[12px] leading-tight text-outline">{med.impactText}</span>
                            </>
                          )}
                          {med.impactType === 'locked' && (
                            <>
                              <span className="material-symbols-outlined text-[16px] text-error">lock</span>
                              <span className="font-body-sm text-[12px] leading-tight font-medium text-error">{med.impactText}</span>
                            </>
                          )}
                          {med.impactType === 'bulk' && (
                            <>
                              <span className="material-symbols-outlined text-[16px] text-tertiary">inventory</span>
                              <span className="font-body-sm text-[12px] leading-tight text-on-surface-variant">{med.impactText}</span>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Secondary Configuration Card: Global Sensitivity Multipliers */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md border border-surface-container">
            <div className="flex flex-col">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[22px]">vital_signs</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Global Algorithmic Sensitivity Multipliers
                </h3>
              </div>
              <p className="font-body-sm text-body-sm text-outline mt-0.5">
                Parametric tolerances dictating synthetic alert sensitivity, automated routing probability, and sensor ping frequency.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md pt-space-xs">
              {/* Sensitivity Multiplier 1 */}
              <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between gap-space-md">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Shortage Window Trigger</span>
                    <span className="px-2 py-0.5 rounded bg-primary text-on-primary font-mono font-semibold text-[11px]">{shortageWindow} Hours</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-outline">Advance notification lead margin before critical stock depletion threshold is crossed.</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <input
                    type="range"
                    min="24"
                    max="168"
                    value={shortageWindow}
                    onChange={(e) => {
                      setShortageWindow(parseInt(e.target.value, 10));
                      setUnsavedChanges(prev => prev + 1);
                    }}
                    className="w-full accent-primary h-1.5 bg-surface-container-highest rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between font-label-sm text-[10px] text-outline">
                    <span>24h (Urgent)</span>
                    <span>72h (Standard)</span>
                    <span>168h (7d Extended)</span>
                  </div>
                </div>
              </div>

              {/* Sensitivity Multiplier 2 */}
              <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between gap-space-md">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Automated Mutual-Aid Confidence</span>
                    <span className="px-2 py-0.5 rounded bg-tertiary text-on-tertiary font-mono font-semibold text-[11px]">&gt; {confidenceThreshold}% Conf.</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-outline">Minimum predictive certitude required before auto-dispatching regional inter-facility transfer requests.</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <input
                    type="range"
                    min="50"
                    max="99"
                    value={confidenceThreshold}
                    onChange={(e) => {
                      setConfidenceThreshold(parseInt(e.target.value, 10));
                      setUnsavedChanges(prev => prev + 1);
                    }}
                    className="w-full accent-tertiary h-1.5 bg-surface-container-highest rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between font-label-sm text-[10px] text-outline">
                    <span>50% (Permissive)</span>
                    <span>85% (Conservative)</span>
                    <span>99% (Deterministic)</span>
                  </div>
                </div>
              </div>

              {/* Sensitivity Multiplier 3 */}
              <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between gap-space-md">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Cold Chain Heartbeat</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono font-semibold text-[11px]">5 Minutes</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-outline">BLE / Cellular temperature probe sampling frequency across static and mobile depot points.</p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                    <span className="font-label-sm text-label-sm text-on-surface font-medium">1,248 Connected IoT Probes</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMQTTModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest font-label-sm text-label-sm text-primary transition-colors cursor-pointer font-semibold"
                  >
                    Configure MQTT
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="h-16"></div>
        </div>
      </div>

      {/* Floating Command & Action Bar */}
      {unsavedChanges > 0 && (
        <div className="sticky bottom-4 z-30 w-full mt-4 animate-slideUp">
          <div className="bg-inverse-surface/95 text-inverse-on-surface backdrop-blur-xl px-space-lg py-space-md rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-space-md">
            {/* Status Notice */}
            <div className="flex items-center gap-space-md w-full sm:w-auto">
              <div className="relative flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-primary-fixed-dim animate-ping absolute"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed relative"></span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-label-lg text-label-lg font-semibold text-inverse-on-surface">
                    {unsavedChanges} unsaved parameter changes detected
                  </span>
                  <span className="px-2 py-0.2 rounded-full bg-inverse-primary/20 text-inverse-primary font-mono text-[10px] font-semibold">
                    DIFF: #MED-PARA-500, #GLB-T{shortageWindow}, #CONF-{confidenceThreshold}
                  </span>
                </div>
                <span className="font-body-sm text-[12px] text-inverse-on-surface/70">
                  Propagates to 2 predictive MCMC models upon cluster commit
                </span>
              </div>
            </div>

            {/* Action Cluster */}
            <div className="flex items-center gap-space-sm w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  setUnsavedChanges(0);
                  if (onToast) onToast('Discarded uncommitted parameter changes.');
                }}
                className="px-space-md py-2.5 rounded-xl text-inverse-on-surface/80 hover:text-inverse-on-surface hover:bg-inverse-on-surface/10 transition-colors font-label-md text-label-md cursor-pointer"
              >
                Discard Changes
              </button>
              <button
                type="button"
                onClick={() => setIsSandboxModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-space-md py-2.5 rounded-xl bg-inverse-on-surface/15 hover:bg-inverse-on-surface/20 text-inverse-on-surface transition-colors font-label-md text-label-md shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">science</span>
                Test in Sandbox
              </button>
              <button
                type="button"
                onClick={handleSaveAndDeploy}
                className="inline-flex items-center gap-1.5 px-space-lg py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg font-semibold transition-all shadow-md active:scale-[0.99] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">save_as</span>
                Save &amp; Deploy Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIGURE MQTT MODAL */}
      {isMQTTModalOpen && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-space-md animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-space-lg flex flex-col gap-space-md shadow-2xl border border-surface-container-high">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">sensors</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">MQTT IoT Broker Settings</h3>
                  <p className="text-xs text-secondary">Cold-Chain Temperature Ingestion</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMQTTModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3 font-body-sm text-xs">
              <div>
                <label className="block font-semibold text-outline uppercase mb-1">Broker Endpoint</label>
                <input
                  type="text"
                  defaultValue="mqtts://iot-telemetry.pulsegrid.health:8883"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high font-mono text-on-surface"
                />
              </div>
              <div>
                <label className="block font-semibold text-outline uppercase mb-1">Topic Subscription Mask</label>
                <input
                  type="text"
                  defaultValue="pulsegrid/district4/coldchain/+/telemetry"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high font-mono text-on-surface"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsMQTTModalOpen(false)}
                className="px-4 py-2 rounded-xl text-secondary text-sm font-semibold hover:bg-surface-container cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMQTTModalOpen(false);
                  if (onToast) onToast('MQTT IoT Broker connection verified (1,248 sensors online).');
                }}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-md hover:bg-primary-container cursor-pointer"
              >
                Test &amp; Save Broker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEST IN SANDBOX MODAL */}
      {isSandboxModalOpen && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-space-md animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-space-lg flex flex-col gap-space-md shadow-2xl border border-surface-container-high">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-tertiary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">science</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Sandbox Validation</h3>
                  <p className="text-xs text-secondary">Synthetic MCMC Run Assessment</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSandboxModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-3 bg-surface-container-low rounded-xl text-xs font-body-sm text-on-surface space-y-1.5">
              <div className="flex justify-between font-semibold"><span>Model Convergence:</span><span className="text-tertiary">99.8% OK</span></div>
              <div className="flex justify-between"><span>Projected False Positive Alerts:</span><span>0.4% (Extremely Low)</span></div>
              <div className="flex justify-between"><span>Downstream Nodes Impacted:</span><span>MedCare Gen, Valley Trauma</span></div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSandboxModalOpen(false)}
                className="px-4 py-2 rounded-xl text-secondary text-sm font-semibold hover:bg-surface-container cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSandboxModalOpen(false);
                  handleSaveAndDeploy();
                }}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-md hover:bg-primary-container cursor-pointer"
              >
                Deploy Approved Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
