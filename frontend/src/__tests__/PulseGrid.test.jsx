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
          dashboardData={{
            surplus_batch_count: 14,
            surplus_units: 1240000,
            units_expiring_within_30_days: 45800,
            active_transfer_count: 18,
            pending_agreement_count: 5,
          }}
            inventoryBatches={[
              { id: 'batch-para', sku_code: 'IV-PARA-500', sku_name: 'Paracetamol 500mg IV Infusion (100ml)', quantity: 140, unit: 'vials', average_daily_use: 82 },
              { id: 'batch-prop', sku_code: 'ANES-PROP-10M', sku_name: 'Propofol 10mg/mL Injectable Emulsion (20ml)', quantity: 28, unit: 'ampoules', average_daily_use: 31 },
            ]}
          pendingTransfers={[]}
          onOpenEmergencyModal={handleEmergency}
          onTakeAction={vi.fn()}
        />
      );

      expect(screen.getByText('Executive Command Console')).toBeInTheDocument();
      expect(screen.getByText('1,240,000 Units')).toBeInTheDocument();
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
    it('deletes the selected inventory batch from its row actions menu', async () => {
      const onToast = vi.fn();
      const batch = {
        id: 'batch-delete-001',
        hospital_id: 'hospital-test-001',
        sku_code: 'MED-DELETE-001',
        sku_name: 'Delete Test Medicine',
        quantity: 12,
        unit: 'units',
        lot_number: 'LOT-DELETE-12',
        expires_on: '2027-04-30',
        storage_regime: 'ambient',
        average_daily_use: 0,
      };
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const fetchMock = vi.fn((url, options = {}) => {
        if (options.method === 'DELETE') return Promise.resolve({ ok: true, status: 204, json: async () => null });
        return Promise.resolve({ ok: true, json: async () => [batch] });
      });
      vi.stubGlobal('fetch', fetchMock);
      render(<InventorySKUsView onToast={onToast} />);

      await screen.findByText('MED-DELETE-001');
      fireEvent.click(screen.getByRole('button', { name: /Inventory actions for Delete Test Medicine/i }));
      fireEvent.click(screen.getByRole('menuitem', { name: /Delete inventory batch/i }));

      await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/inventory/batches/batch-delete-001'),
        expect.objectContaining({ method: 'DELETE' }),
      ));
      expect(confirmSpy).toHaveBeenCalled();
      await waitFor(() => expect(screen.queryByText('MED-DELETE-001')).not.toBeInTheDocument());
      expect(onToast).toHaveBeenCalledWith(expect.stringContaining('Inventory batch deleted'));
    });

    it('persists a new inventory batch through the hospital API', async () => {
      const onToast = vi.fn();
      const createdBatch = {
        id: 'batch-test-001',
        hospital_id: 'hospital-test-001',
        sku_code: 'MED-TEST-001',
        sku_name: 'Test Saline Infusion',
        quantity: 24,
        unit: 'units',
        lot_number: 'LOT-TEST-24',
        expires_on: '2027-04-30',
        storage_regime: 'ambient',
        average_daily_use: 0,
      };
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url, options = {}) => {
        if (options.method === 'POST') {
          return Promise.resolve({ ok: true, json: async () => createdBatch });
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      }));
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

      expect(await screen.findByText('MED-TEST-001')).toBeInTheDocument();
      expect(screen.getByText('Test Saline Infusion')).toBeInTheDocument();
      expect(screen.getByText('24 units')).toBeInTheDocument();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/inventory/batches'),
        expect.objectContaining({ method: 'POST' }),
      );
      expect(onToast).toHaveBeenCalledWith(expect.stringContaining('Inventory batch saved'));
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

    it('persists transfer approval and reloads the hospital transfer list', async () => {
      const handleToast = vi.fn();
      const transfer = {
        id: 'transfer-test-001',
        sku_name: 'Paracetamol 500mg IV Infusion',
        sku_code: 'IV-PARA-500',
        quantity: 600,
        unit: 'vials',
        urgency: 'critical',
        status: 'requested',
        created_at: new Date().toISOString(),
        requesting_hospital_id: 'hospital-current',
        source_hospital_id: 'hospital-source',
      };
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url, options = {}) => {
        if (options.method === 'PATCH') {
          return Promise.resolve({ ok: true, json: async () => ({ ...transfer, status: 'approved' }) });
        }
        if (String(url).includes('/api/hospitals')) {
          return Promise.resolve({ ok: true, json: async () => [{ id: 'hospital-source', name: 'Source Hospital' }] });
        }
        return Promise.resolve({ ok: true, json: async () => [transfer] });
      }));
      render(<TransfersLogisticsView onToast={handleToast} />);

      const card = await screen.findByText(/transfer-test-001/);
      fireEvent.click(card);

      const approveBtn = screen.getByRole('button', { name: /Approve Transfer & Dispatch/i });
      fireEvent.click(approveBtn);

      await waitFor(() => expect(handleToast).toHaveBeenCalledWith(expect.stringContaining('approved')));
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/transfers/transfer-test-001'),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  describe('MOUPartnersView Component (Screen 5)', () => {
    it('renders the surplus posting form and nearby hospital listings', async () => {
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
        if (String(url).includes('/api/inventory/batches')) {
          return Promise.resolve({
            ok: true,
            json: async () => [{
              id: 'batch-001',
              sku_name: 'Paracetamol 500mg IV',
              sku_code: 'IV-PARA-500',
              quantity: 100,
              unit: 'vials',
            }],
          });
        }
        if (String(url).includes('/api/marketplace/mine')) {
          return Promise.resolve({ ok: true, json: async () => [] });
        }
        return Promise.resolve({
          ok: true,
          json: async () => [{
            id: 'listing-001',
            sku_name: 'Ceftriaxone 1g',
            hospital_name: 'Nearby General Hospital',
            quantity_available: 50,
            unit: 'vials',
            storage_regime: 'ambient',
            expires_on: '2026-12-01',
          }],
        });
      }));
      render(<MOUPartnersView onToast={vi.fn()} />);

      expect(screen.getByText('Surplus marketplace')).toBeInTheDocument();
      expect(screen.getByText('Post your surplus')).toBeInTheDocument();
      expect(screen.getByText('Nearby hospital surplus')).toBeInTheDocument();
      expect(await screen.findByText('Ceftriaxone 1g')).toBeInTheDocument();
      expect(screen.getByText('Nearby General Hospital')).toBeInTheDocument();
    });

    it('posts the selected inventory batch as surplus', async () => {
      const handleToast = vi.fn();
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url, options = {}) => {
        if (options.method === 'POST') {
          return Promise.resolve({ ok: true, json: async () => ({ id: 'listing-new' }) });
        }
        if (String(url).includes('/api/inventory/batches')) {
          return Promise.resolve({
            ok: true,
            json: async () => [{
              id: 'batch-001',
              sku_name: 'Paracetamol 500mg IV',
              sku_code: 'IV-PARA-500',
              quantity: 100,
              unit: 'vials',
            }],
          });
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      }));
      render(<MOUPartnersView onToast={handleToast} />);

      await screen.findByRole('option', { name: /Paracetamol 500mg IV/ });
      fireEvent.change(screen.getByLabelText('Inventory batch'), { target: { value: 'batch-001' } });
      fireEvent.change(screen.getByLabelText('Quantity to share'), { target: { value: '25' } });
      fireEvent.change(screen.getByLabelText('Expiry date'), { target: { value: '2027-04-30' } });
      fireEvent.click(screen.getByRole('button', { name: /Post surplus/i }));

      await waitFor(() => expect(handleToast).toHaveBeenCalledWith('Surplus posted for nearby hospitals.'));
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/marketplace/listings'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('removes a posted surplus listing', async () => {
      const handleToast = vi.fn();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url, options = {}) => {
        if (options.method === 'DELETE') {
          return Promise.resolve({ ok: true, json: async () => null });
        }
        if (String(url).includes('/api/marketplace/mine')) {
          return Promise.resolve({
            ok: true,
            json: async () => [{
              id: 'listing-owned-001',
              sku_name: 'Owned surplus',
              quantity_available: 10,
              unit: 'vials',
              status: 'active',
              buyers: [],
            }],
          });
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      }));
      render(<MOUPartnersView onToast={handleToast} />);

      const deleteButton = await screen.findByRole('button', { name: /Delete Owned surplus surplus/i });
      fireEvent.click(deleteButton);

      await waitFor(() => expect(handleToast).toHaveBeenCalledWith('Surplus listing removed.'));
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/marketplace/listings/listing-owned-001'),
        expect.objectContaining({ method: 'DELETE' }),
      );
      expect(screen.getByText('You have not posted any surplus yet.')).toBeInTheDocument();
    });
  });

  describe('CollaborationMOUView Component (Screen 6)', () => {
    it('renders direct MOU request sections', async () => {
      render(<CollaborationMOUView onToast={vi.fn()} />);

      expect(screen.getByText('Direct MOUs')).toBeInTheDocument();
      expect(screen.getByText('Send an MOU request')).toBeInTheDocument();
      expect(screen.getByText('Requests sent by me')).toBeInTheDocument();
      expect(screen.getByText('Requests received')).toBeInTheDocument();
    });

    it('sends a direct MOU request', async () => {
      const handleToast = vi.fn();
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url, options = {}) => {
        if (String(url).includes('/api/hospitals/me')) {
          return Promise.resolve({ ok: true, json: async () => ({ id: 'hospital-current', name: 'Current Hospital' }) });
        }
        if (String(url).includes('/api/hospitals')) {
          return Promise.resolve({ ok: true, json: async () => [{ id: 'hospital-partner', name: 'Partner Hospital' }] });
        }
        if (String(url).includes('/api/agreements') && options.method === 'POST') {
          return Promise.resolve({ ok: true, json: async () => ({
            id: 'agreement-new',
            hospital_id: 'hospital-current',
            hospital_name: 'Current Hospital',
            partner_hospital_id: 'hospital-partner',
            partner_hospital_name: 'Partner Hospital',
            title: 'Emergency Hospital Mutual Aid',
            signatory: 'Alex Morgan',
            agreement_type: 'full_peer_stock_swap',
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }) });
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      }));
      render(<CollaborationMOUView onToast={handleToast} />);

      await waitFor(() => expect(screen.getByRole('option', { name: 'Partner Hospital' })).toBeInTheDocument());
      fireEvent.change(screen.getByLabelText('Hospital'), { target: { value: 'hospital-partner' } });
      fireEvent.click(screen.getByRole('checkbox', { name: /I confirm that I have authority/i }));
      fireEvent.submit(screen.getByRole('button', { name: /Send MOU request/i }).closest('form'));
      await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/agreements'), expect.objectContaining({ method: 'POST' })));
      await waitFor(() => expect(handleToast).toHaveBeenCalledWith('MOU request sent.'));
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
        if (String(url).includes('/api/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ inventory_units: 0, units_expiring_within_30_days: 0, active_transfer_count: 0 }),
          });
        }
        if (String(url).includes('/api/transfers') || String(url).includes('/api/inventory/batches')) {
          return Promise.resolve({ ok: true, json: async () => [] });
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
