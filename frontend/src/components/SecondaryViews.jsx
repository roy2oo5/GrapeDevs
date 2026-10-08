import React from 'react';
import { RiskForecastingView } from './RiskForecastingView';
import { InventorySKUsView } from './InventorySKUsView';
import { TransfersLogisticsView } from './TransfersLogisticsView';
import { MOUPartnersView } from './MOUPartnersView';
import { CollaborationMOUView } from './CollaborationMOUView';
import { ScenarioSimulationView } from './ScenarioSimulationView';
import { HospitalSettingsView } from './HospitalSettingsView';

export function SecondaryViews({ view, onToast }) {
  if (view === 'outbreak-surveillance' || view === 'risk-intelligence') {
    return <RiskForecastingView onToast={onToast} />;
  }

  if (view === 'inventory-and-skus' || view === 'inventory') {
    return <InventorySKUsView onToast={onToast} />;
  }

  if (view === 'transfers-and-logistics') {
    return <TransfersLogisticsView onToast={onToast} />;
  }

  if (view === 'mou-partners' || view === 'pulsegrid-safe-surplus-network-and-mou-marketplace' || view === 'surplus-marketplace') {
    return <MOUPartnersView onToast={onToast} />;
  }

  if (view === 'collaboration-and-mou-management' || view === 'hospital-network' || view === 'mou-management' || view === 'collaboration') {
    return <CollaborationMOUView onToast={onToast} />;
  }

  if (view === 'scenario-simulation-engine' || view === 'scenario-simulation' || view === 'simulation' || view === 'stress-testing') {
    return <ScenarioSimulationView onToast={onToast} />;
  }

  if (view === 'system-settings' || view === 'settings' || view === 'hospital-configuration') {
    return <HospitalSettingsView onToast={onToast} />;
  }

  // Fallback for other sections
  return (
    <div className="p-12 text-center bg-surface-container-lowest rounded-3xl border border-surface-container-high shadow-sm space-y-4 animate-fadeIn">
      <div className="w-14 h-14 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center mx-auto shadow-inner">
        <span className="material-symbols-outlined text-[32px]">domain_verification</span>
      </div>
      <h2 className="font-headline-lg text-lg text-on-surface font-semibold capitalize">{view.replace(/-/g, ' ')}</h2>
      <p className="text-secondary text-sm max-w-md mx-auto">
        Operating in synchronized node mode under FIPS 140-3 Level 3 clearance. All data feeds are verified continuously.
      </p>
      <button
        type="button"
        onClick={() => onToast && onToast('Telemetry refreshed')}
        className="px-5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold transition-colors cursor-pointer"
      >
        Refresh Data Stream
      </button>
    </div>
  );
}
