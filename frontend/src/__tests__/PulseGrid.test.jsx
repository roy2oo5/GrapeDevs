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
import { HospitalSettingsView } from '../components/HospitalSettingsView';
import { InventorySKUsView } from '../components/InventorySKUsView';
import App from '../App';

describe('PulseGrid Control Tower Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
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
      expect(screen.getByText('6 Hospitals Active')).toBeInTheDocument();
      expect(screen.getByText('1,420 Monitored SKUs')).toBeInTheDocument();
    });
  });

  describe('AuthFormPanel Component', () => {
    it('defaults to Sign In tab and allows password visibility toggle', () => {
      render(<AuthFormPanel />);

      expect(screen.getByText('Hospital Login')).toBeInTheDocument();
      expect(screen.getByText('Access Control Tower')).toBeInTheDocument();

      const passInput = screen.getByLabelText(/Terminal Access Key/i);
      expect(passInput).toHaveAttribute('type', 'password');

      const toggleBtn = screen.getByLabelText('Toggle password visibility');
      fireEvent.click(toggleBtn);
      expect(passInput).toHaveAttribute('type', 'text');

      fireEvent.click(toggleBtn);
      expect(passInput).toHaveAttribute('type', 'password');
    });

    it('switches between Sign In and Register Hospital tabs', () => {
      render(<AuthFormPanel />);

      const registerTab = screen.getByRole('button', { name: /Register Hospital/i });
      fireEvent.click(registerTab);

      expect(screen.getByText('Join Network')).toBeInTheDocument();
      expect(screen.getByLabelText(/Hospital Administrator Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Hospital Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Hospital Classification/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Hospital Administrator ID/i)).toBeInTheDocument();
      expect(screen.getByText('Pharmacy')).toBeInTheDocument();
      expect(screen.getByText('District Health')).toBeInTheDocument();
      expect(screen.getByText('Logistics')).toBeInTheDocument();

      const signinTab = screen.getByRole('button', { name: /Sign In/i });
      fireEvent.click(signinTab);
      expect(screen.getByText('Hospital Login')).toBeInTheDocument();
    });

    it('validates password mismatch during hospital registration', async () => {
      render(<AuthFormPanel />);

      fireEvent.click(screen.getByRole('button', { name: /Register Hospital/i }));

      fireEvent.change(screen.getByLabelText(/Hospital Administrator Name/i), {
        target: { value: 'Dr. Elena Vance' },
      });
      fireEvent.change(screen.getByLabelText(/Official Email/i), {
        target: { value: 'elena@metrohealth.org' },
      });
      fireEvent.change(screen.getByLabelText(/Hospital Name/i), {
        target: { value: 'Metro General' },
      });
      fireEvent.change(screen.getByLabelText(/Hospital Administrator ID/i), {
        target: { value: 'METRO-ADMIN-001' },
      });
      fireEvent.change(screen.getByLabelText(/^Set Password/i), {
        target: { value: 'Password1234!' },
      });
      fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
        target: { value: 'DifferentPassword!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Create Hospital Account/i }));

      expect(
        await screen.findByText(/Terminal Access Keys do not match/i)
      ).toBeInTheDocument();
    });

    it('logs in to a hospital and hands the returned token to the app', async () => {
      const handleLogin = vi.fn();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'signed-hospital-token',
          hospital_id: '00000000-0000-4000-8000-000000000001',
          hospital_name: 'Metro General Hospital',
          administrator_id: 'METRO-ADMIN-001',
          role: 'Hospital Administrator',
        }),
      }));
      render(<AuthFormPanel onLoginSuccess={handleLogin} />);

      fireEvent.change(screen.getByLabelText(/Hospital Administrator ID/i), {
        target: { value: 'METRO-ADMIN-001' },
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
              hospital_name: 'Metro General Hospital',
              role: 'Hospital Administrator',
            })
          );
        },
        { timeout: 3000 }
      );
      expect(window.sessionStorage.getItem('pulsegrid_access_token')).toBe('signed-hospital-token');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('registers a hospital and returns to login without issuing a session token', async () => {
      const registered = vi.fn();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          hospital_id: '00000000-0000-4000-8000-000000000001',
          hospital_name: 'Metro General Hospital',
          hospital_administrator_id: 'METRO-ADMIN-001',
          status: 'active',
        }),
      }));
      render(<AuthFormPanel onRegisterSuccess={registered} />);
      fireEvent.click(screen.getByRole('button', { name: /Register Hospital/i }));
      fireEvent.change(screen.getByLabelText(/Hospital Administrator Name/i), { target: { value: 'Alex Morgan' } });
      fireEvent.change(screen.getByLabelText(/Official Email/i), { target: { value: 'alex@metro.example' } });
      fireEvent.change(screen.getByLabelText(/Hospital Name/i), { target: { value: 'Metro General Hospital' } });
      fireEvent.change(screen.getByLabelText(/Hospital Administrator ID/i), { target: { value: 'METRO-ADMIN-001' } });
      fireEvent.change(screen.getByLabelText(/^Set Password/i), { target: { value: 'CorrectHorseBattery9!' } });
      fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'CorrectHorseBattery9!' } });
      fireEvent.click(screen.getByRole('button', { name: /Create Hospital Account/i }));

      expect(await screen.findByText(/Hospital Registered/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Hospital Administrator ID/i)).toHaveValue('METRO-ADMIN-001');
      expect(registered).toHaveBeenCalledWith(expect.objectContaining({ hospital_name: 'Metro General Hospital' }));
      expect(window.sessionStorage.getItem('pulsegrid_access_token')).toBeNull();
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

    it('renders DashboardHeader with hospital name', () => {
      render(<DashboardHeader currentHospital="MedCare General Hospital" onOpenSearch={vi.fn()} />);

      expect(screen.getAllByText('MedCare General Hospital').length).toBeGreaterThanOrEqual(1);
    });

    it('renders DashboardView KPI cards and attention alerts', () => {
      const handleToast = vi.fn();
      const handleEmergency = vi.fn();
      render(
        <DashboardView
          onToast={handleToast}
          onOpenEmergencyModal={handleEmergency}
          onTakeAction={vi.fn()}
        />
      );

      expect(screen.getByText('Executive Command Console')).toBeInTheDocument();
      expect(screen.getByText('1.24M Units')).toBeInTheDocument();
      expect(screen.getByText('45,800 Units')).toBeInTheDocument();
      expect(screen.getByText('18 Requests')).toBeInTheDocument();
      expect(screen.getByText('5 Pending MOUs')).toBeInTheDocument();

      expect(screen.getByText('Paracetamol 500mg IV Infusion (100ml)')).toBeInTheDocument();
      expect(screen.getByText('Propofol 10mg/mL Injectable Emulsion (20ml)')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Emergency Stock Request'));
      expect(handleEmergency).toHaveBeenCalledTimes(1);
    });
  });

  describe('InventorySKUsView Component', () => {
    it('adds a new inventory batch to the local inventory table', () => {
      const onToast = vi.fn();
      render(<InventorySKUsView onToast={onToast} />);

      fireEvent.click(screen.getByRole('button', { name: /Add Inventory/i }));
      expect(screen.queryByLabelText(/^Unit$/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Storage regime/i)).not.toBeInTheDocument();
      fireEvent.change(screen.getByLabelText(/SKU code/i), {
        target: { value: 'MED-TEST-001' },
      });
      fireEvent.change(screen.getByLabelText(/Medicine name/i), {
        target: { value: 'Test Saline Infusion' },
      });
      fireEvent.change(screen.getByLabelText(/^Quantity$/i), {
        target: { value: '24' },
      });
      fireEvent.change(screen.getByLabelText(/Lot number/i), {
        target: { value: 'LOT-TEST-24' },
      });
      fireEvent.change(screen.getByLabelText(/Expiration date/i), {
        target: { value: '2027-04-30' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Add batch/i }));

      expect(screen.getByText('MED-TEST-001')).toBeInTheDocument();
      expect(screen.getByText('Test Saline Infusion')).toBeInTheDocument();
      expect(screen.getByText('24 units')).toBeInTheDocument();
      expect(onToast).toHaveBeenCalledWith(expect.stringContaining('added locally'));
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

      // Click a transfer card to open drawer
      const card = screen.getAllByText(/TRX-9402/)[0];
      fireEvent.click(card);

      // Check selected transfer details in drawer
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

      const card = screen.getAllByText(/TRX-9402/)[0];
      fireEvent.click(card);

      const approveBtn = screen.getByRole('button', { name: /Approve Transfer & Dispatch/i });
      fireEvent.click(approveBtn);

      expect(handleToast).toHaveBeenCalledWith(expect.stringContaining('Authorized'));
    });
  });

  describe('MOUPartnersView Component (Screen 5)', () => {
    it('renders marketplace header, KPIs, and surplus cards', () => {
      render(<MOUPartnersView onToast={vi.fn()} />);

      expect(screen.getByText('Safe Surplus Network: Regional MOU Marketplace')).toBeInTheDocument();
      expect(screen.getByText('41,280 Units')).toBeInTheDocument();
      expect(screen.getByText('6 Facilities Synced')).toBeInTheDocument();
      expect(screen.getByText('38 mins')).toBeInTheDocument();
      expect(screen.getByText('1,840 Vials')).toBeInTheDocument();

      // Check marketplace listings
      expect(screen.getAllByText(/Paracetamol 500mg IV Infusion/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Propofol 10mg/mL Injectable')).toBeInTheDocument();
      expect(screen.getByText('Ceftriaxone 1g Powder')).toBeInTheDocument();
      expect(screen.getByText('Enoxaparin Sodium 40mg/0.4mL')).toBeInTheDocument();
      expect(screen.getByText('Epinephrine 1mg/mL Auto-Injectors')).toBeInTheDocument();
    });

    it('opens transfer modal when Request Surplus is clicked', () => {
      render(<MOUPartnersView onToast={vi.fn()} />);

      const requestButtons = screen.getAllByRole('button', { name: /Request Surplus/i });
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
      expect(screen.getByText('8,400 Units')).toBeInTheDocument();
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


  describe('HospitalSettingsView Component (Screen 8)', () => {
    it('renders hospital configuration tabs, calibration table, and parameter knobs', () => {
      render(<HospitalSettingsView onToast={vi.fn()} />);

      expect(screen.getByText('Settings & Hospital Configuration')).toBeInTheDocument();
      expect(screen.getByText('MedCare General Hospital (Node #MC-01)')).toBeInTheDocument();
      expect(screen.getByText('Hospital Profile')).toBeInTheDocument();
      expect(screen.getByText('Network Preferences')).toBeInTheDocument();
      expect(screen.getByText('Notification Alerts')).toBeInTheDocument();
      expect(screen.getByText('Supply Chain Rules')).toBeInTheDocument();

      // Switch to Supply Chain Rules tab
      fireEvent.click(screen.getByText('Supply Chain Rules'));

      // Check table items
      expect(screen.getByText('Paracetamol 500mg IV Infusion')).toBeInTheDocument();
      expect(screen.getByText('Ceftriaxone 1g Powder for Injection')).toBeInTheDocument();
      expect(screen.getByText('Propofol 10mg/mL Injectable Emulsion')).toBeInTheDocument();

      // Check sensitivity sliders & actions
      expect(screen.getByText('Global Algorithmic Sensitivity Multipliers')).toBeInTheDocument();
      expect(screen.getByText('Shortage Window Trigger')).toBeInTheDocument();
    });

    it('allows opening MQTT IoT Broker modal', () => {
      render(<HospitalSettingsView onToast={vi.fn()} />);

      // Switch to Supply Chain Rules tab to find Configure MQTT button
      fireEvent.click(screen.getByText('Supply Chain Rules'));

      fireEvent.click(screen.getByRole('button', { name: /Configure MQTT/i }));
      expect(screen.getByText('MQTT IoT Broker Settings')).toBeInTheDocument();
      expect(screen.getByText('Test & Save Broker')).toBeInTheDocument();
    });

    it('handles saving and deploying parameter changes with toast', () => {
      const handleToast = vi.fn();
      render(<HospitalSettingsView onToast={handleToast} />);

      // Make a change first in Supply Chain Rules tab so unsavedChanges > 0
      fireEvent.click(screen.getByText('Supply Chain Rules'));
      const reorderInputs = screen.getAllByRole('textbox');
      if (reorderInputs.length > 1) {
        fireEvent.change(reorderInputs[1], { target: { value: '500' } });
      }

      // Click Hospital Profile save button
      fireEvent.click(screen.getByText('Hospital Profile'));
      const saveBtn = screen.getByRole('button', { name: /Save Hospital Profile/i });
      fireEvent.click(saveBtn);

      expect(handleToast).toHaveBeenCalledWith(expect.stringContaining('updated'));
    });
  });

  describe('App Full Integration', () => {
    it('requires hospital login before showing the dashboard', async () => {
      render(<App />);
      expect(screen.getByText('Hospital Login')).toBeInTheDocument();
      expect(screen.queryByText('Executive Command Console')).not.toBeInTheDocument();
      expect(
        screen.getByText('Predictive inventory, zero-stockout allocation.')
      ).toBeInTheDocument();
    });

    it('routes a valid stored hospital token into that hospital dashboard', async () => {
      window.sessionStorage.setItem('pulsegrid_access_token', 'saved-hospital-token');
      const fetchMock = vi.fn((url) => {
        if (String(url).includes('/api/hospitals/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ name: 'North District Hospital' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'healthy' }),
        });
      });
      vi.stubGlobal('fetch', fetchMock);

      render(<App />);

      expect(await screen.findByText('Executive Command Console')).toBeInTheDocument();
      expect(screen.getAllByText('North District Hospital').length).toBeGreaterThan(0);
      const hospitalRequest = fetchMock.mock.calls.find(([url]) => String(url).includes('/api/hospitals/me'));
      expect(hospitalRequest[1].headers.get('Authorization')).toBe('Bearer saved-hospital-token');
    });
  });
});
