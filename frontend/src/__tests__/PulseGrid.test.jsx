import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Header } from '../components/Header';
import { LeftTelemetryPanel } from '../components/LeftTelemetryPanel';
import { AuthFormPanel } from '../components/AuthFormPanel';
import { Footer } from '../components/Footer';
import { InfoModal } from '../components/InfoModal';
import { Sidebar } from '../components/Sidebar';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardView } from '../components/DashboardView';
import { CommandPalette } from '../components/CommandPalette';
import { ActionModals } from '../components/ActionModals';
import { TransfersLogisticsView } from '../components/TransfersLogisticsView';
import { MOUPartnersView } from '../components/MOUPartnersView';
import { CollaborationMOUView } from '../components/CollaborationMOUView';
import { ScenarioSimulationView } from '../components/ScenarioSimulationView';
import { HospitalSettingsView } from '../components/HospitalSettingsView';
import App from '../App';

describe('PulseGrid Control Tower Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Header Component', () => {
    it('renders PulseGrid brand and clearance indicators', () => {
      render(<Header backendStatus="online" />);

      expect(screen.getByText('PulseGrid')).toBeInTheDocument();
      expect(screen.getByText('Supply Intelligence Control Tower')).toBeInTheDocument();
      expect(screen.getByText('ENCRYPTED NODE')).toBeInTheDocument();
      expect(screen.getByText('v2.4.8-SEC')).toBeInTheDocument();
      expect(screen.getByText('CLEARANCE LEVEL 4')).toBeInTheDocument();
    });

    it('shows local node indicator when offline', () => {
      render(<Header backendStatus="offline" />);
      expect(screen.getByText('LOCAL NODE')).toBeInTheDocument();
    });
  });

  describe('LeftTelemetryPanel Component', () => {
    it('renders bio-surveillance telemetry and capability badges', () => {
      render(<LeftTelemetryPanel />);

      expect(screen.getByText('LIVE SYNC')).toBeInTheDocument();
      expect(screen.getByText('Epidemic Defense & Logistics')).toBeInTheDocument();
      expect(
        screen.getByText('Predictive inventory, zero-stockout allocation.')
      ).toBeInTheDocument();
      expect(screen.getByText('Outbreak Spike Detection')).toBeInTheDocument();
      expect(screen.getByText('Expiry-Aware Redistribution')).toBeInTheDocument();
      expect(screen.getByText('Reconciliation Audit Log')).toBeInTheDocument();
      expect(screen.getByText('System Telemetry Status')).toBeInTheDocument();
      expect(screen.getByText('6 Facilities Active')).toBeInTheDocument();
      expect(screen.getByText('1,420 Monitored SKUs')).toBeInTheDocument();
    });
  });

  describe('AuthFormPanel Component', () => {
    it('defaults to Sign In tab and allows password visibility toggle', () => {
      render(<AuthFormPanel />);

      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(screen.getByText('Access Control Tower')).toBeInTheDocument();

      const passInput = screen.getByLabelText(/Terminal Access Key/i);
      expect(passInput).toHaveAttribute('type', 'password');

      const toggleBtn = screen.getByLabelText('Toggle password visibility');
      fireEvent.click(toggleBtn);
      expect(passInput).toHaveAttribute('type', 'text');

      fireEvent.click(toggleBtn);
      expect(passInput).toHaveAttribute('type', 'password');
    });

    it('switches between Sign In and Register Facility tabs', () => {
      render(<AuthFormPanel />);

      const registerTab = screen.getByRole('button', { name: /Register Facility/i });
      fireEvent.click(registerTab);

      expect(screen.getByText('Join Network')).toBeInTheDocument();
      expect(screen.getByLabelText(/Lead Administrator/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Facility Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Facility Level/i)).toBeInTheDocument();
      expect(screen.getByText('Pharmacy')).toBeInTheDocument();
      expect(screen.getByText('District Health')).toBeInTheDocument();
      expect(screen.getByText('Logistics')).toBeInTheDocument();

      const signinTab = screen.getByRole('button', { name: /Sign In/i });
      fireEvent.click(signinTab);
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
    });

    it('validates password mismatch during facility onboarding', async () => {
      render(<AuthFormPanel />);

      fireEvent.click(screen.getByRole('button', { name: /Register Facility/i }));

      fireEvent.change(screen.getByLabelText(/Lead Administrator/i), {
        target: { value: 'Dr. Elena Vance' },
      });
      fireEvent.change(screen.getByLabelText(/Official Email/i), {
        target: { value: 'elena@metrohealth.org' },
      });
      fireEvent.change(screen.getByLabelText(/Facility Name/i), {
        target: { value: 'Metro General' },
      });
      fireEvent.change(screen.getByLabelText(/^Set Password/i), {
        target: { value: 'Password1234!' },
      });
      fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
        target: { value: 'DifferentPassword!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Submit Onboarding Request/i }));

      expect(
        await screen.findByText(/Terminal Access Keys do not match/i)
      ).toBeInTheDocument();
    });

    it('handles sign in submission with simulated cryptographic verification', async () => {
      const handleLogin = vi.fn();
      render(<AuthFormPanel onLoginSuccess={handleLogin} />);

      fireEvent.change(screen.getByLabelText(/Administrator ID/i), {
        target: { value: 'admin@metropolitan-health.org' },
      });
      fireEvent.change(screen.getByLabelText(/Terminal Access Key/i), {
        target: { value: 'validPassword123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Access Control Tower/i }));

      expect(
        screen.getByText(/Verifying Cryptographic Credentials/i)
      ).toBeInTheDocument();

      await waitFor(
        () => {
          expect(handleLogin).toHaveBeenCalledWith(
            expect.objectContaining({
              email: 'admin@metropolitan-health.org',
              role: 'Lead Administrator',
            })
          );
        },
        { timeout: 3000 }
      );
    });

    it('triggers callbacks for reset access keys and SSO options', () => {
      const handleReset = vi.fn();
      const handleSSO = vi.fn();
      render(<AuthFormPanel onResetKeyClick={handleReset} onSSOClick={handleSSO} />);

      fireEvent.click(screen.getByText('Reset access keys?'));
      expect(handleReset).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText(/Hospital Network Single Sign-On/i));
      expect(handleSSO).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dashboard & Sidebar Components', () => {
    it('renders Sidebar navigation elements', () => {
      const handleView = vi.fn();
      render(<Sidebar currentView="dashboard" onViewChange={handleView} onOpenAuth={vi.fn()} />);

      expect(screen.getByText('PulseGrid AI')).toBeInTheDocument();
      expect(screen.getByText('Supply Control Tower')).toBeInTheDocument();
      expect(screen.getByText('Inventory & SKUs')).toBeInTheDocument();
      expect(screen.getByText('Outbreak Surveillance')).toBeInTheDocument();
      expect(screen.getByText('Transfers & Logistics')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Inventory & SKUs'));
      expect(handleView).toHaveBeenCalledWith('inventory-and-skus');
    });

    it('renders DashboardHeader with facility and notification count', () => {
      render(<DashboardHeader currentFacility="MedCare General Hospital" onOpenSearch={vi.fn()} />);

      expect(screen.getByText('MedCare General Hospital')).toBeInTheDocument();
      expect(screen.getByText('6 Facilities Active // Synced')).toBeInTheDocument();
      expect(screen.getByText('Dr. Sarah Lin')).toBeInTheDocument();
    });

    it('renders DashboardView KPI cards and attention alerts', () => {
      const handleToast = vi.fn();
      const handleEmergency = vi.fn();
      render(
        <DashboardView
          onToast={handleToast}
          onOpenEmergencyModal={handleEmergency}
          onOpenAuditModal={vi.fn()}
          onTakeAction={vi.fn()}
        />
      );

      expect(screen.getByText('Executive Command Console')).toBeInTheDocument();
      expect(screen.getByText('$1.24M')).toBeInTheDocument();
      expect(screen.getByText('$45.8K')).toBeInTheDocument();
      expect(screen.getByText('3 Items')).toBeInTheDocument();
      expect(screen.getByText('5 Partners')).toBeInTheDocument();

      expect(screen.getByText('Paracetamol 500mg IV Infusion (100ml)')).toBeInTheDocument();
      expect(screen.getByText('Propofol 10mg/mL Injectable Emulsion (20ml)')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Emergency Stock Request'));
      expect(handleEmergency).toHaveBeenCalledTimes(1);
    });
  });

  describe('CommandPalette & ActionModals', () => {
    it('filters items in CommandPalette', () => {
      const handleAction = vi.fn();
      render(<CommandPalette isOpen={true} onClose={vi.fn()} onSelectAction={handleAction} />);

      expect(screen.getByPlaceholderText(/Type a SKU name/i)).toBeInTheDocument();
      expect(screen.getByText('Paracetamol 500mg IV Infusion')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Emergency Stock Request'));
      expect(handleAction).toHaveBeenCalledWith('emergency-request');
    });

    it('submits Emergency Stock Request in ActionModal', () => {
      const handleConfirm = vi.fn();
      render(
        <ActionModals
          modalData={{ type: 'emergency-request' }}
          onClose={vi.fn()}
          onConfirm={handleConfirm}
        />
      );

      expect(screen.getByText('Initiate Emergency Stock Request')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Broadcast Emergency Request'));
      expect(handleConfirm).toHaveBeenCalled();
    });
  });

  describe('TransfersLogisticsView Component (Screen 4)', () => {
    it('renders Kanban board with 5 columns and KPI ribbons', () => {
      render(<TransfersLogisticsView onToast={vi.fn()} />);

      expect(screen.getByText('Redistribution Hub: Stock Movement & MOU Logistics')).toBeInTheDocument();
      expect(screen.getByText('18 Transfers')).toBeInTheDocument();
      expect(screen.getByText('6 Convoys')).toBeInTheDocument();
      expect(screen.getByText('48 mins')).toBeInTheDocument();
      expect(screen.getAllByText('12 Units').length).toBeGreaterThanOrEqual(1);

      // Check Kanban columns
      expect(screen.getByText('Proposed')).toBeInTheDocument();
      expect(screen.getByText('Under Review')).toBeInTheDocument();
      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('In Transit')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();

      // Check default selected transfer details in drawer
      expect(screen.getByText('Transfer Details')).toBeInTheDocument();
      expect(screen.getAllByText(/Paracetamol 500mg IV Infusion/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('AI Epidemiologic Surge Match')).toBeInTheDocument();
      expect(screen.getByText('Approve Transfer & Dispatch')).toBeInTheDocument();
    });

    it('allows toggling between Kanban and List view', () => {
      render(<TransfersLogisticsView onToast={vi.fn()} />);

      const listBtn = screen.getByRole('button', { name: /List View/i });
      fireEvent.click(listBtn);

      expect(screen.getByText('Manifest ID')).toBeInTheDocument();
      expect(screen.getByText('Origin ➔ Destination')).toBeInTheDocument();
      expect(screen.getAllByText(/TRX-9402/).length).toBeGreaterThanOrEqual(1);
    });

    it('handles approving a transfer and toast callback', () => {
      const handleToast = vi.fn();
      render(<TransfersLogisticsView onToast={handleToast} />);

      const approveBtn = screen.getByRole('button', { name: /Approve Transfer & Dispatch/i });
      fireEvent.click(approveBtn);

      expect(handleToast).toHaveBeenCalledWith(expect.stringContaining('Authorized'));
    });
  });

  describe('MOUPartnersView Component (Screen 5)', () => {
    it('renders marketplace header, KPIs, and surplus cards', () => {
      render(<MOUPartnersView onToast={vi.fn()} />);

      expect(screen.getByText('Safe Surplus Network: Regional MOU Marketplace')).toBeInTheDocument();
      expect(screen.getByText('$412,800')).toBeInTheDocument();
      expect(screen.getByText('6 Facilities Synced')).toBeInTheDocument();
      expect(screen.getByText('38 mins')).toBeInTheDocument();
      expect(screen.getByText('$84,200')).toBeInTheDocument();

      // Check marketplace listings
      expect(screen.getAllByText(/Paracetamol 500mg IV Infusion/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Propofol 10mg/mL Injectable')).toBeInTheDocument();
      expect(screen.getByText('Ceftriaxone 1g Powder')).toBeInTheDocument();
      expect(screen.getByText('Enoxaparin Sodium 40mg/0.4mL')).toBeInTheDocument();
      expect(screen.getByText('Epinephrine 1mg/mL Auto-Injectors')).toBeInTheDocument();
    });

    it('opens transfer modal when Request Transfer is clicked', () => {
      render(<MOUPartnersView onToast={vi.fn()} />);

      const requestButtons = screen.getAllByRole('button', { name: /Request Transfer/i });
      fireEvent.click(requestButtons[0]);

      expect(screen.getByText('Rebalance Requisition')).toBeInTheDocument();
      expect(screen.getByText('Sign & Dispatch Courier')).toBeInTheDocument();
    });

    it('allows opening and closing Post Surplus Lot modal', () => {
      render(<MOUPartnersView onToast={vi.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: /Post Surplus Lot/i }));
      expect(screen.getByText('Post Safe Surplus Lot')).toBeInTheDocument();
      expect(screen.getByText('Publish Surplus Listing')).toBeInTheDocument();
    });
  });

  describe('CollaborationMOUView Component (Screen 6)', () => {
    it('renders collaboration directory, KPI metrics, and policy switches', () => {
      render(<CollaborationMOUView onToast={vi.fn()} />);

      expect(screen.getByText('Collaboration & MOU Management')).toBeInTheDocument();
      expect(screen.getByText('6 Hospitals')).toBeInTheDocument();
      expect(screen.getByText('$840,200')).toBeInTheDocument();
      expect(screen.getByText('1 Agreement')).toBeInTheDocument();
      expect(screen.getByText('18 Months')).toBeInTheDocument();

      // Check Directory listings
      expect(screen.getAllByText('Valley Trauma Center').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('St. Jude Regional Hospital').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('North District Community Clinic')).toBeInTheDocument();

      // Check Section A policy switches & Section B table
      expect(screen.getByText(/Section A: Global Exchange Protocols/i)).toBeInTheDocument();
      expect(screen.getByText('Emergency Transfers Allowed')).toBeInTheDocument();
      expect(screen.getByText('Requires Bilateral Approval')).toBeInTheDocument();
      expect(screen.getByText(/Section B: Category-Specific Supply Inclusions/i)).toBeInTheDocument();
      expect(screen.getByText('Critical Injectables & Anaesthetics')).toBeInTheDocument();
    });

    it('allows opening Create New MOU modal and submitting', () => {
      const handleToast = vi.fn();
      render(<CollaborationMOUView onToast={handleToast} />);

      fireEvent.click(screen.getByRole('button', { name: /\+ Create New MOU/i }));
      expect(screen.getByText('Initiate Bilateral MOU Compact')).toBeInTheDocument();

      const form = screen.getByText('Initiate Bilateral MOU Compact').closest('.bg-surface-container-lowest').querySelector('form');
      fireEvent.submit(form);
      expect(handleToast).toHaveBeenCalledWith(expect.stringContaining('Broadcasted'));
    });

    it('allows opening and closing Export Compliance Ledger modal', () => {
      render(<CollaborationMOUView onToast={vi.fn()} />);

      const exportBtn = screen.getByRole('button', { name: /Export Compliance Ledger/i });
      fireEvent.click(exportBtn);
      expect(screen.getAllByText('Export Compliance Ledger').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Download Archive')).toBeInTheDocument();
    });
  });

  describe('ScenarioSimulationView Component (Screen 7)', () => {
    it('renders simulation parameters, delta cards, and prescriptive interventions', () => {
      render(<ScenarioSimulationView onToast={vi.fn()} />);

      expect(screen.getByText('Scenario Simulation Engine & Stress Testing')).toBeInTheDocument();
      expect(screen.getByText('Simulation Parameters')).toBeInTheDocument();
      expect(screen.getByText('Respiratory Demand Multiplier')).toBeInTheDocument();
      expect(screen.getByText('Supplier Delay / Port Chokehold')).toBeInTheDocument();

      // Check Comparative Delta Cards
      expect(screen.getByText('Baseline Trajectory')).toBeInTheDocument();
      expect(screen.getByText('Simulated Shock Surge')).toBeInTheDocument();
      expect(screen.getByText('Network Vulnerability')).toBeInTheDocument();

      // Check Chart & Prescriptive Interventions
      expect(screen.getByText('Stock Depletion & Buffer Trajectory (14-Day Horizon)')).toBeInTheDocument();
      expect(screen.getByText('Recommended Interventions & Automated Mitigation Plan')).toBeInTheDocument();
      expect(screen.getByText('Approve All High-Impact Transfers')).toBeInTheDocument();
      expect(screen.getByText(/Redistribute 500 units of Paracetamol 500mg IV/i)).toBeInTheDocument();
    });

    it('handles running stochastic simulation feedback', async () => {
      const handleToast = vi.fn();
      render(<ScenarioSimulationView onToast={handleToast} />);

      const runSimBtn = screen.getByRole('button', { name: /Run Stochastic Simulation/i });
      fireEvent.click(runSimBtn);

      expect(screen.getByText(/Running 10,000 MCMC Runs/i)).toBeInTheDocument();
    });

    it('handles approving all prescriptive mitigation actions', () => {
      const handleToast = vi.fn();
      render(<ScenarioSimulationView onToast={handleToast} />);

      const approveAllBtn = screen.getByRole('button', { name: /Approve All High-Impact Transfers/i });
      fireEvent.click(approveAllBtn);

      expect(screen.getByText(/3 Transfers Initiated to Logistics/i)).toBeInTheDocument();
      expect(handleToast).toHaveBeenCalledWith(expect.stringContaining('Approved'));
    });
  });

  describe('HospitalSettingsView Component (Screen 8)', () => {
    it('renders hospital configuration tabs, calibration table, and parameter knobs', () => {
      render(<HospitalSettingsView onToast={vi.fn()} />);

      expect(screen.getByText('Settings & Hospital Configuration')).toBeInTheDocument();
      expect(screen.getByText('MedCare General Hospital (Node #MC-01)')).toBeInTheDocument();
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Supply Chain Rules')).toBeInTheDocument();
      expect(screen.getByText('Hospital Metrics')).toBeInTheDocument();
      expect(screen.getByText('API & Integrations')).toBeInTheDocument();

      // Check table items
      expect(screen.getByText('Paracetamol 500mg IV Infusion')).toBeInTheDocument();
      expect(screen.getByText('Ceftriaxone 1g Powder for Injection')).toBeInTheDocument();
      expect(screen.getByText('Propofol 10mg/mL Injectable Emulsion')).toBeInTheDocument();

      // Check sensitivity sliders & actions
      expect(screen.getByText('Global Algorithmic Sensitivity Multipliers')).toBeInTheDocument();
      expect(screen.getByText('Shortage Window Trigger')).toBeInTheDocument();
      expect(screen.getByText('Save & Deploy Changes')).toBeInTheDocument();
    });

    it('allows opening MQTT IoT Broker modal', () => {
      render(<HospitalSettingsView onToast={vi.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: /Configure MQTT/i }));
      expect(screen.getByText('MQTT IoT Broker Settings')).toBeInTheDocument();
      expect(screen.getByText('Test & Save Broker')).toBeInTheDocument();
    });

    it('handles saving and deploying parameter changes with toast', () => {
      const handleToast = vi.fn();
      render(<HospitalSettingsView onToast={handleToast} />);

      const deployBtn = screen.getByRole('button', { name: /Save & Deploy Changes/i });
      fireEvent.click(deployBtn);

      expect(handleToast).toHaveBeenCalledWith(expect.stringContaining('deployed'));
    });
  });

  describe('App Full Integration', () => {
    it('renders full PulseGrid Executive Command Console by default and allows switching to auth', async () => {
      render(<App />);
      expect(screen.getByText('Executive Command Console')).toBeInTheDocument();
      expect(screen.getByText('MedCare General Hospital')).toBeInTheDocument();

      // Switch to Auth mode
      fireEvent.click(screen.getByText(/Switch Terminal \/ Sign Out/i));
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(
        screen.getByText('Predictive inventory, zero-stockout allocation.')
      ).toBeInTheDocument();
    });
  });
});
