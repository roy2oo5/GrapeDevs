import React, { useState } from 'react';

export function CollaborationMOUView({ onToast }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'pending' | 'archived'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMOUId, setSelectedMOUId] = useState('MOU-2024-VTC-09');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Policy switch states
  const [policies, setPolicies] = useState({
    emergencyTransfers: true,
    bilateralApproval: true,
    coldChainWaiver: true,
    surplusVisibility: true,
  });

  const togglePolicy = (key) => {
    setPolicies(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      if (onToast) onToast(`Updated Policy: ${key} is now ${updated[key] ? 'ENABLED' : 'DISABLED'}`);
      return updated;
    });
  };

  // Compact dataset
  const [agreements, setAgreements] = useState([
    {
      id: 'MOU-2024-VTC-09',
      hospitalName: 'Valley Trauma Center',
      status: 'active',
      accordType: 'Bilateral Clinical Mutual-Aid Compact',
      signatory: 'Dr. Marcus Vance (CMO)',
      validity: 'Effective: Jan 01, 2024 – Dec 31, 2025',
      renewDays: '348d',
      marketplaceSync: 'Safe-Marketplace Synced',
      dscsaVerified: true,
      fipsSigned: true,
      agreementType: 'Zero-Cost Surplus Redistribution',
      jurisdiction: 'State DHS-4 (Gov Exec Order 21-A)'
    },
    {
      id: 'MOU-2024-SJR-03',
      hospitalName: 'St. Jude Regional Hospital',
      status: 'pending',
      accordType: 'Regional Tier-2 Pediatric & Critical Accord',
      signatory: 'Elena Rostova, VP Operations',
      validity: 'Draft Revision 4 (Pending Sign-off)',
      pendingNote: 'Clause 4.2 pending bio-security legal review by external counsel. Est countersignature: Nov 15, 2024.',
      renewDays: 'Pending',
      marketplaceSync: 'Restricted Staging',
      dscsaVerified: true,
      fipsSigned: false,
      agreementType: 'Pending Mutual Agreement',
      jurisdiction: 'State DHS-4'
    },
    {
      id: 'MOU-2023-NDC-14',
      hospitalName: 'North District Community Clinic',
      status: 'active',
      accordType: 'Outpatient Emergency Redistribution Accord',
      signatory: 'J. Sterling, PharmD',
      validity: 'Jun 15, 2023 – Jun 14, 2025',
      renewDays: '220d',
      marketplaceSync: 'Clinic Outpatient Fast-Swap',
      dscsaVerified: true,
      fipsSigned: true,
      agreementType: 'Zero-Cost Surplus Redistribution',
      jurisdiction: 'State DHS-4'
    },
    {
      id: 'MOU-2024-HMM-08',
      hospitalName: 'Highland Mercy Medical Center',
      status: 'active',
      accordType: 'Full Cross-Network Emergency Accord',
      signatory: 'Dr. Arthur Pendelton',
      validity: 'Mar 01, 2024 – Feb 28, 2026',
      renewDays: '480d',
      marketplaceSync: 'Tier-1 Mutual Aid',
      dscsaVerified: true,
      fipsSigned: true,
      agreementType: 'Zero-Cost Surplus Redistribution',
      jurisdiction: 'State DHS-4'
    },
    {
      id: 'MOU-2022-MBD-01',
      hospitalName: 'Metro Bio-Defense Research Depot',
      status: 'archived',
      accordType: 'Strategic National Countermeasure MOU',
      signatory: 'Col. Raymond Shaw (Depot Lead)',
      validity: 'Expired Oct 01, 2024',
      renewDays: 'Expired',
      marketplaceSync: 'Archived / Re-negotiation Staged',
      dscsaVerified: true,
      fipsSigned: true,
      agreementType: 'Archived Agreement',
      jurisdiction: 'Federal Biosecurity Reserve'
    }
  ]);

  const selectedMOU = agreements.find(a => a.id === selectedMOUId) || agreements[0];

  const filteredAgreements = agreements.filter(a => {
    if (activeTab === 'active' && a.status !== 'active') return false;
    if (activeTab === 'pending' && a.status !== 'pending') return false;
    if (activeTab === 'archived' && a.status !== 'archived') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.hospitalName.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.signatory.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col w-full gap-space-lg animate-fadeIn">
      {/* TOP CONTEXT & COMMAND BAR */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-space-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
            <span className="text-primary font-semibold">Clinical Operations &amp; Legal</span>
            <span className="text-outline">/</span>
            <span>District 4 Inter-Hospital Governance</span>
            <span className="text-outline">/</span>
            <span className="px-2 py-0.5 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed font-semibold text-[10px]">Regulatory Protocol 4.2B</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">Collaboration &amp; MOU Management</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
            Legal mutual-aid accords, bilateral clinical compacts, and automated supply sharing governance protocols across verified network health nodes.
          </p>
        </div>

        {/* Right Actions & CTAs */}
        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-space-xs px-space-md py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-outline">description</span>
            <span>Export Compliance Ledger</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-space-xs px-space-md py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md shadow-md transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>+ Create New MOU</span>
          </button>
        </div>
      </div>

      {/* FILTER PILL TABS */}
      <div className="flex items-center justify-between border-b border-surface-container-high pb-space-sm">
        <div className="flex items-center gap-space-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-space-md py-1.5 rounded-xl font-label-md text-label-md transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface'
            }`}
          >
            <span>All Accords</span>
            <span className="w-5 h-5 rounded-full bg-surface-container-lowest text-primary font-semibold text-[11px] flex items-center justify-center">
              {agreements.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-space-md py-1.5 rounded-xl font-label-md text-label-md transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface'
            }`}
          >
            <span>Active</span>
            <span className="w-5 h-5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-semibold text-[11px] flex items-center justify-center">
              {agreements.filter(a => a.status === 'active').length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-space-md py-1.5 rounded-xl font-label-md text-label-md transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface'
            }`}
          >
            <span>Pending Review</span>
            <span className="w-5 h-5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold text-[11px] flex items-center justify-center">
              {agreements.filter(a => a.status === 'pending').length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('archived')}
            className={`flex items-center gap-2 px-space-md py-1.5 rounded-xl font-label-md text-label-md transition-all cursor-pointer ${
              activeTab === 'archived'
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface'
            }`}
          >
            <span>Expired / Archived</span>
            <span className="w-5 h-5 rounded-full bg-surface-container-high text-on-surface-variant font-semibold text-[11px] flex items-center justify-center">
              {agreements.filter(a => a.status === 'archived').length}
            </span>
          </button>
        </div>
        <div className="hidden md:flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
          <span className="material-symbols-outlined text-[16px] text-tertiary">verified_user</span>
          <span>FIPS 140-3 Cryptographic Ledger Active</span>
        </div>
      </div>

      {/* KPI / GOVERNANCE METRICS STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {/* Card 1 */}
        <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Active Bilateral Compacts</span>
              <span className="font-headline-lg text-headline-lg text-on-surface mt-1 font-bold">6 Hospitals</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-tertiary-fixed/40 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[22px]">corporate_fare</span>
            </div>
          </div>
          <div className="mt-space-sm pt-2 flex items-center justify-between border-t border-surface-container-low text-on-surface-variant font-body-sm text-body-sm">
            <div className="flex items-center gap-1.5 text-tertiary font-semibold">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
              <span>100% DSCSA Compliant</span>
            </div>
            <span className="text-outline">6 of 6 Verified</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Network Shared Volume</span>
              <span className="font-headline-lg text-headline-lg text-primary mt-1 font-bold">8,400 Units</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">swap_horizontal_circle</span>
            </div>
          </div>
          <div className="mt-space-sm pt-2 flex items-center justify-between border-t border-surface-container-low text-on-surface-variant font-body-sm text-body-sm">
            <span className="truncate">Mutual indemnification cap:</span>
            <span className="font-semibold text-on-surface">$1,500,000 max</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Pending Legal Sign-Off</span>
              <span className="font-headline-lg text-headline-lg text-on-surface mt-1 font-bold">1 Agreement</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[22px]">pending_actions</span>
            </div>
          </div>
          <div className="mt-space-sm pt-2 flex items-center justify-between border-t border-surface-container-low text-on-surface-variant font-body-sm text-body-sm">
            <span className="truncate text-secondary font-semibold">St. Jude Regional Hospital</span>
            <span className="text-outline">Tier 3 Expansion</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Avg Agreement Term</span>
              <span className="font-headline-lg text-headline-lg text-on-surface mt-1 font-bold">18 Months</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[22px]">autorenew</span>
            </div>
          </div>
          <div className="mt-space-sm pt-2 flex items-center justify-between border-t border-surface-container-low text-on-surface-variant font-body-sm text-body-sm">
            <span className="text-on-surface-variant">Auto-renew active</span>
            <span className="font-semibold text-primary">60-Day Audit Gate</span>
          </div>
        </div>
      </div>

      {/* MAIN SPLIT WORKSPACE: REGISTRY VS POLICY CONFIGURATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* LEFT PANE: DIRECTORY & COMPACT REGISTRY (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-space-md">
          <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Agreements Directory</h2>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{filteredAgreements.length} Compacts Displayed</span>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col gap-2">
              <div className="relative flex items-center">
                <span className="material-symbols-outlined text-[18px] text-outline absolute left-3">search</span>
                <input
                  className="w-full h-11 pl-9 pr-3 rounded-xl bg-surface-container-low font-body-sm text-body-sm text-on-surface placeholder-outline focus:outline-none focus:bg-surface-container-lowest shadow-inner"
                  placeholder="Search partner hospital, signatory, or accord ID..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-low text-on-surface-variant text-label-sm font-label-sm cursor-pointer">
                  <span>Status: <strong className="text-on-surface font-semibold">Active &amp; Pending</strong></span>
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-low text-on-surface-variant text-label-sm font-label-sm cursor-pointer">
                  <span>Type: <strong className="text-on-surface font-semibold">All Compacts</strong></span>
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                </div>
              </div>
            </div>

            {/* Directory Item Cards */}
            <div className="flex flex-col gap-2 mt-1">
              {filteredAgreements.map((item) => {
                const isSelected = selectedMOUId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedMOUId(item.id)}
                    className={`p-space-md rounded-xl transition-all shadow-sm flex flex-col gap-2 cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-primary-fixed/20'
                        : 'bg-surface-container-lowest hover:bg-surface-container-low'
                    } ${item.status === 'archived' ? 'opacity-70' : ''}`}
                  >
                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}

                    <div className="flex items-start justify-between pl-1">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-label-lg text-label-lg text-on-surface font-semibold">{item.hospitalName}</span>
                          {item.status === 'active' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed/40 text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
                              Active
                            </span>
                          )}
                          {item.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                              Pending Review
                            </span>
                          )}
                          {item.status === 'archived' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                              Archived
                            </span>
                          )}
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">{item.accordType}</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-primary font-semibold">{item.id}</span>
                    </div>

                    {item.pendingNote && (
                      <div className="p-2 rounded-lg bg-surface-container-low flex items-start gap-2 text-on-surface-variant text-body-sm font-body-sm">
                        <span className="material-symbols-outlined text-secondary text-[16px] mt-0.5">notification_important</span>
                        <span className="text-[12px] leading-tight">{item.pendingNote}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant pl-1 pt-1 border-t border-surface-container-low">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-primary">person_check</span>
                        <span className="truncate">{item.signatory}</span>
                      </div>
                      <div className="flex items-center gap-1 text-primary font-semibold text-[11px]">
                        <span className="material-symbols-outlined text-[14px]">event_repeat</span>
                        <span>{item.renewDays.includes('d') ? `Renews in ${item.renewDays}` : item.renewDays}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-outline pl-1 font-label-sm">
                      <span>{item.validity}</span>
                      <span className="text-tertiary font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">shield</span> {item.marketplaceSync}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveTab('all');
                if (onToast) onToast('Loaded 14 archived mutual aid accords into registry.');
              }}
              className="w-full py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Load Archived Agreements (14)</span>
              <span className="material-symbols-outlined text-[16px]">history</span>
            </button>
          </div>
        </div>

        {/* RIGHT PANE: MOU CONFIGURATION & SUPPLY PERMISSIONS (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-space-md">
          {/* Details Header Box */}
          <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm border-b border-surface-container-low">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">{selectedMOU.hospitalName}</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-tertiary-fixed/30 text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
                    Active Governance Protocol
                  </span>
                </div>
                <div className="flex items-center gap-space-sm text-body-sm font-body-sm text-on-surface-variant mt-1 flex-wrap">
                  <span className="font-mono text-outline">ID: {selectedMOU.id}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-primary font-semibold">
                    <span className="material-symbols-outlined text-[16px]">verified</span> DSCSA Track &amp; Trace Verified
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-tertiary font-semibold">
                    <span className="material-symbols-outlined text-[16px]">key</span> FIPS 140-3 Signed
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedMOU.status === 'pending' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setAgreements(prev => prev.map(a => a.id === selectedMOU.id ? { ...a, status: 'active' } : a));
                        if (onToast) onToast(`MOU Terms Accepted for ${selectedMOU.hospitalName}! Collaboration active.`);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-tertiary hover:bg-tertiary/90 text-on-tertiary font-label-md text-label-md transition-colors shadow-sm cursor-pointer font-bold"
                    >
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span>Accept Terms</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAgreements(prev => prev.map(a => a.id === selectedMOU.id ? { ...a, status: 'archived' } : a));
                        if (onToast) onToast(`Collaboration request rejected for ${selectedMOU.hospitalName}.`);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-error-container hover:bg-error text-on-error-container hover:text-on-error font-label-md text-label-md transition-colors shadow-sm cursor-pointer font-bold"
                    >
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                      <span>Reject Collaboration</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onToast && onToast(`Executed Legal Terms PDF generated for ${selectedMOU.hospitalName}`)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                      <span className="hidden sm:inline">Terms &amp; Conditions</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToast && onToast(`Configuration updates saved for ${selectedMOU.id}!`)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-sm text-label-sm transition-colors shadow-sm cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      <span>Save Changes</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* SECTION A: GLOBAL EXCHANGE PROTOCOLS */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider text-[12px] font-bold">
                  Section A: Global Exchange Protocols &amp; Policy Switches
                </span>
                <span
                  onClick={() => {
                    setPolicies({
                      emergencyTransfers: true,
                      bilateralApproval: true,
                      coldChainWaiver: true,
                      surplusVisibility: true
                    });
                    if (onToast) onToast('Reset exchange policies to standard District 4 template.');
                  }}
                  className="font-label-sm text-label-sm text-primary cursor-pointer hover:underline"
                >
                  Reset to Default Template
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Protocol 1 */}
                <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col justify-between gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">Emergency Transfers Allowed</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant text-[12px] leading-tight mt-0.5">
                        Permits autonomous fast-track dispatch during Code-Yellow/Red hospital capacity surges without prior manual procurement escalation.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={policies.emergencyTransfers}
                        onChange={() => togglePolicy('emergencyTransfers')}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-tertiary font-semibold">
                    <span className="material-symbols-outlined text-[14px]">bolt</span>
                    <span>Fast-track response latency &lt; 15 min</span>
                  </div>
                </div>

                {/* Protocol 2 */}
                <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col justify-between gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">Requires Bilateral Approval</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant text-[12px] leading-tight mt-0.5">
                        Simultaneous dual cryptographic sign-off by both hospital Chief Pharmacists for transactions exceeding $25,000 or controlled narcotics.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={policies.bilateralApproval}
                        onChange={() => togglePolicy('bilateralApproval')}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-on-surface-variant font-semibold">
                    <span className="material-symbols-outlined text-[14px]">fingerprint</span>
                    <span>Dual 2FA Hardware Token Required</span>
                  </div>
                </div>

                {/* Protocol 3 */}
                <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col justify-between gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">Automated Cold Chain Indemnity Waiver</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant text-[12px] leading-tight mt-0.5">
                        Attaches Article 14 liability transfer upon sensor confirmation of 2°C–8°C compliance at destination receiving dock.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={policies.coldChainWaiver}
                        onChange={() => togglePolicy('coldChainWaiver')}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-tertiary font-semibold">
                    <span className="material-symbols-outlined text-[14px]">ac_unit</span>
                    <span>IoT Data Logger Telemetry Linked</span>
                  </div>
                </div>

                {/* Protocol 4 */}
                <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col justify-between gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">Surplus Safe-Marketplace Visibility</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant text-[12px] leading-tight mt-0.5">
                        Broadcasts near-expiry (&lt; 45 days) non-critical inventory directly into District 4 exchange pool for immediate offset.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={policies.surplusVisibility}
                        onChange={() => togglePolicy('surplusVisibility')}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-primary font-semibold">
                    <span className="material-symbols-outlined text-[14px]">sync_alt</span>
                    <span>Automated credit debit reconciliation</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION B: CATEGORY-SPECIFIC SUPPLY INCLUSIONS */}
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider text-[12px] font-bold">
                  Section B: Category-Specific Supply Inclusions &amp; Allocation Limits
                </span>
                <div className="flex items-center gap-1 text-on-surface-variant text-label-sm font-label-sm">
                  <span className="material-symbols-outlined text-[14px]">tune</span>
                  <span>6 Therapeutic Classes</span>
                </div>
              </div>

              {/* Permissions Sub-table */}
              <div className="overflow-x-auto rounded-xl bg-surface-container-low shadow-inner">
                <table className="w-full text-left text-body-sm font-body-sm border-collapse">
                  <thead>
                    <tr className="bg-surface-container text-on-surface font-label-sm text-label-sm uppercase tracking-wider border-b border-surface-container-high">
                      <th className="py-2.5 px-3">Therapeutic Class</th>
                      <th className="py-2.5 px-2 text-center">Transfer Status</th>
                      <th className="py-2.5 px-3">Max Limit / Order</th>
                      <th className="py-2.5 px-3">Compliance &amp; Surge Trigger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high text-on-surface">
                    {/* Row 1 */}
                    <tr className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-semibold text-on-surface">Critical Injectables &amp; Anaesthetics</span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">Propofol, Fentanyl, Midazolam</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-tertiary-fixed/30 text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">
                          Allowed
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-semibold text-primary">500 ampoules</span>
                      </td>
                      <td className="py-2.5 px-3 text-[12px] text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                          Level 1 Cold-Chain verification required
                        </span>
                      </td>
                    </tr>

                    {/* Row 2 */}
                    <tr className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-semibold text-on-surface">Broad-Spectrum Antibiotics &amp; Antivirals</span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">Ceftriaxone, Remdesivir, Meropenem</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-tertiary-fixed/30 text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">
                          Allowed
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-semibold text-primary">1,200 vials</span>
                      </td>
                      <td className="py-2.5 px-3 text-[12px] text-on-surface-variant">
                        <span className="flex items-center gap-1 text-primary">
                          <span className="material-symbols-outlined text-[14px]">trending_up</span>
                          Epidemiological surge trigger active (1.5x)
                        </span>
                      </td>
                    </tr>

                    {/* Row 3 */}
                    <tr className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-semibold text-on-surface">Blood Products &amp; Cryo Precipitates</span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">Packed RBC O-Neg, Platelets, FFP</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-tertiary-fixed/30 text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">
                          Allowed
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-semibold text-primary">25 units</span>
                      </td>
                      <td className="py-2.5 px-3 text-[12px] text-on-surface-variant">
                        <span className="flex items-center gap-1 text-on-surface">
                          <span className="material-symbols-outlined text-[14px] text-primary">electric_bolt</span>
                          Dedicated rapid courier only (&lt; 35m ETA)
                        </span>
                      </td>
                    </tr>

                    {/* Row 4 */}
                    <tr className="hover:bg-surface-container-high/40 transition-colors bg-surface-container-high/20">
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-semibold text-error">Controlled Substances (Schedule II-IV)</span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">Morphine Sulfate, Hydromorphone, Oxycodone</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">
                          Restricted
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-semibold text-outline">0 units (Escrow Only)</span>
                      </td>
                      <td className="py-2.5 px-3 text-[12px] text-error font-medium">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">lock</span>
                          Requires DEA-222 digital token elevation
                        </span>
                      </td>
                    </tr>

                    {/* Row 5 */}
                    <tr className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-semibold text-on-surface">General IV Fluids &amp; Electrolytes</span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">Normal Saline 0.9%, Lactated Ringer's, D5W</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-tertiary-fixed/30 text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">
                          Allowed
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-semibold text-primary">2,500 bags</span>
                      </td>
                      <td className="py-2.5 px-3 text-[12px] text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                          Autonomous batch allocation enabled
                        </span>
                      </td>
                    </tr>

                    {/* Row 6 */}
                    <tr className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-semibold text-on-surface">Pediatric Specialized Formulations</span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">Pediatric Epinephrine, Neonatal Surfactant</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-tertiary-fixed/30 text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">
                          Allowed
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-semibold text-primary">150 units</span>
                      </td>
                      <td className="py-2.5 px-3 text-[12px] text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                          Priority emergency clinical recall clause
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* AUDIT & LEGAL SIGN-OFF FOOTER */}
            <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-on-surface-variant font-body-sm text-body-sm mt-1">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary mt-0.5">verified</span>
                <div className="flex flex-col">
                  <span className="text-on-surface font-semibold text-[13px]">
                    Last modified by MedCare General Hospital on Oct 24, 2024 at 14:22 EST
                  </span>
                  <span className="text-[11px] font-mono text-outline">
                    Cryptographic Block Hash: SHA-256 (0x7F89...9A2B) • Re-certification due in 11 months
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAuditModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">history</span>
                  <span>Audit History</span>
                </button>
                <button
                  type="button"
                  onClick={() => onToast && onToast(`Downloaded Accord Package for ${selectedMOU.hospitalName}`)}
                  className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-sm text-label-sm transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">download</span>
                  <span>Accord Package</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECONDARY TELEMETRY PANEL: REAL-TIME MUTUAL-AID READINESS */}
          <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">hub</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">District 4 Live Dispatch Telemetry</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed/40 text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">
                Carrier Courier Fleet Synced
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm pt-1">
              <div className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Transit Distance</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">{selectedMOU.distance}</span>
                <span className="text-[11px] text-tertiary font-medium">Estimated blue-light transit: {selectedMOU.transitTime}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Bi-Directional Settlement</span>
                <span className="font-headline-sm text-headline-sm text-primary font-bold">{selectedMOU.settlement}</span>
                <span className="text-[11px] text-on-surface-variant">Credits offset equally via safe-pool</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Jurisdiction</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">State DHS-4</span>
                <span className="text-[11px] text-primary font-medium">{selectedMOU.jurisdiction}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE NEW MOU MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-space-md animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-space-lg flex flex-col gap-space-md shadow-2xl border border-surface-container-high">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">add_circle</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Initiate Bilateral MOU Compact</h3>
                  <p className="text-xs text-secondary">District 4 Mutual Aid Legal Binding</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsCreateModalOpen(false);
                if (onToast) onToast('New MOU Accord Draft Broadcasted to Legal Counsel!');
              }}
              className="space-y-3 pt-2 font-body-sm"
            >
              <div>
                <label className="block text-xs font-semibold text-outline uppercase mb-1">Partner Hospital Node</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Memorial University Hospital"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high text-on-surface text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-outline uppercase mb-1">Chief Signatory</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Jane Doe, VP CMO"
                    className="w-full px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high text-on-surface text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-outline uppercase mb-1">Accord Tier</label>
                  <select className="w-full px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high text-on-surface text-sm focus:outline-none focus:border-primary">
                    <option>Tier 1: Full Peer Stock Swap</option>
                    <option>Tier 2: Critical Surge Defense Only</option>
                    <option>Tier 3: Strategic Biosecurity</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-outline uppercase mb-1">Indemnification Cap ($)</label>
                <input
                  type="text"
                  defaultValue="$1,500,000"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high text-on-surface text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-secondary text-sm font-semibold hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-md hover:bg-primary-container transition-all cursor-pointer"
                >
                  Transmit Draft Compact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPORT COMPLIANCE LEDGER MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-space-md animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-space-lg flex flex-col gap-space-md shadow-2xl border border-surface-container-high">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-tertiary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">description</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Export Compliance Ledger</h3>
                  <p className="text-xs text-secondary">FIPS 140-3 &amp; DSCSA Audit Trail</p>
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
              This will bundle all executed legal pacts, bilateral exchange logs, Article 14 liability waivers, and immutable SHA-256 ledger blocks into a certified regulatory archive.
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
                  if (onToast) onToast('Compliance Ledger Archive (ZIP/PDF) exported successfully!');
                }}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-md hover:bg-primary-container cursor-pointer"
              >
                Download Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT HISTORY MODAL */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-space-md animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-space-lg flex flex-col gap-space-md shadow-2xl border border-surface-container-high">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">history</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Compact Audit Trail</h3>
                  <p className="text-xs text-secondary">{selectedMOU.id} • Immutable Log</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto text-xs font-body-sm">
              <div className="p-3 bg-surface-container-low rounded-xl">
                <div className="flex justify-between font-semibold text-on-surface">
                  <span>Policy Modification (Surplus Safe-Marketplace)</span>
                  <span className="text-outline font-mono">Oct 24, 14:22 EST</span>
                </div>
                <div className="text-on-surface-variant mt-1">MedCare General Hospital updated Article 8.3 surplus offset terms. Block #8921.</div>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl">
                <div className="flex justify-between font-semibold text-on-surface">
                  <span>Bilateral Re-Certification Completed</span>
                  <span className="text-outline font-mono">Jan 01, 09:00 EST</span>
                </div>
                <div className="text-on-surface-variant mt-1">Dr. Marcus Vance (Valley Trauma) signed countersignature token. Block #7710.</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-md hover:bg-primary-container cursor-pointer"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
