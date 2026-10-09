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
import { RiskForecastingView } from '../components/RiskForecastingView';
import App from '../App';

describe('PulseGrid Control Tower Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
  });

  describe('Header Component', () => {
    it('renders simple branding and API status without fake security badges', () => {
      render(<Header backendStatus="online" />);

      expect(screen.getByText('PulseGrid')).toBeInTheDocument();
      expect(screen.getByText('Supply Chain Management')).toBeInTheDocument();
      expect(screen.getByText('API connected')).toBeInTheDocument();
      expect(screen.queryByText(/LOCAL NODE|ENCRYPTED NODE|CLEARANCE LEVEL|v2\.4/)).not.toBeInTheDocument();
    });

    it('shows API availability when offline', () => {
      render(<Header backendStatus="offline" />);
      expect(screen.getByText('API unavailable')).toBeInTheDocument();
    });
  });

  describe('LeftTelemetryPanel Component', () => {
    it('explains the main hospital inventory and transfer tasks', () => {
      render(<LeftTelemetryPanel />);

      expect(screen.getByText('Hospital stock, made easier')).toBeInTheDocument();
      expect(screen.getByText('Track medicine stock and expiry dates')).toBeInTheDocument();
      expect(screen.getByText('Review medicine use and forecasts')).toBeInTheDocument();
      expect(screen.getByText('Coordinate transfers with hospitals')).toBeInTheDocument();
      expect(screen.queryByText(/Hospitals Active|Monitored SKUs|LIVE SYNC/)).not.toBeInTheDocument();
    });
  });

  describe('InfoModal Component', () => {
    it('does not claim that unsupported sign-in services are active', () => {
      render(<InfoModal modalType="sso" onClose={vi.fn()} />);

      expect(screen.getByText(/Single sign-on is not set up for this hospital/)).toBeInTheDocument();
      expect(screen.queryByText(/Kaiser|NHS|FIPS|SAML 2.0/)).not.toBeInTheDocument();
    });

    it('explains that access key recovery is unavailable without pretending to send a request', () => {
      render(<InfoModal modalType="reset" onClose={vi.fn()} />);

      expect(screen.getByText(/Access key recovery is not available here/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Send Challenge/i })).not.toBeInTheDocument();
    });
  });

  describe('AuthFormPanel Component', () => {
    it('defaults to Sign In tab and allows password visibility toggle', () => {
      render(<AuthFormPanel />);

      expect(screen.getByText('Hospital Login')).toBeInTheDocument();
      expect(screen.getByText(/Sign in to manage your hospital/)).toBeInTheDocument();

      const passInput = screen.getByLabelText('Password');
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
      fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'validPassword123' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Sign in', exact: true }));

      expect(
        screen.getByText(/Signing in/i)
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

    it('keeps sign-in focused on the hospital ID and password', () => {
      render(<AuthFormPanel />);
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.queryByText(/FIPS Hardware Key|Enterprise Directory|Reset access keys/i)).not.toBeInTheDocument();
    });
  });

  describe('Dashboard & Sidebar Components', () => {
    it('renders Sidebar navigation elements', () => {
      const handleView = vi.fn();
      render(<Sidebar currentView="dashboard" onViewChange={handleView} onOpenAuth={vi.fn()} />);

      expect(screen.getByText('PulseGrid')).toBeInTheDocument();
      expect(screen.getByText('Supply Chain Management')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Medicine forecast')).toBeInTheDocument();
      expect(screen.getByText('Transfers')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Inventory'));
      expect(handleView).toHaveBeenCalledWith('inventory-and-skus');
    });

    it('renders DashboardHeader with hospital name', () => {
      render(<DashboardHeader currentHospital="MedCare General Hospital" onOpenSearch={vi.fn()} />);

      expect(screen.getAllByText('MedCare General Hospital').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText('Surplus Redistribution Terminal')).not.toBeInTheDocument();
      expect(screen.queryByText('person')).not.toBeInTheDocument();
      expect(screen.queryByText('local_hospital')).not.toBeInTheDocument();
    });

    it('renders real inventory risk metrics and supply priorities', () => {
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

      expect(screen.getByText('Stock and transfers')).toBeInTheDocument();
      expect(screen.getByText('Inventory batches')).toBeInTheDocument();
      expect(screen.getByText('Low stock')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Low stock2Seven days of stock or less/ })).toBeInTheDocument();
      expect(screen.queryByText(/units\/day|Safe surplus estimate/)).not.toBeInTheDocument();
      expect(screen.getByText('Priority supplies')).toBeInTheDocument();

      expect(screen.getByText('Paracetamol 500mg IV Infusion (100ml)')).toBeInTheDocument();
      expect(screen.getByText('Propofol 10mg/mL Injectable Emulsion (20ml)')).toBeInTheDocument();
      expect(screen.queryByText('Add usage/surveillance data')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('Request stock'));
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
      const fetchMock = vi.fn((url, options = {}) => {
        if (options.method === 'DELETE') return Promise.resolve({ ok: true, status: 204, json: async () => null });
        return Promise.resolve({ ok: true, json: async () => [batch] });
      });
      vi.stubGlobal('fetch', fetchMock);
      render(<InventorySKUsView onToast={onToast} />);

      await screen.findByText('MED-DELETE-001');
      expect(screen.queryByText('Cold Chain Only')).not.toBeInTheDocument();
      expect(screen.queryByText('Pharmacopeia Traceability Audit System')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Inventory actions for Delete Test Medicine/i }));
      fireEvent.click(screen.getByRole('menuitem', { name: /Delete inventory batch/i }));
      expect(screen.getByRole('alertdialog')).toHaveTextContent('Delete Test Medicine');
      expect(fetchMock).not.toHaveBeenCalledWith(
        expect.stringContaining('/api/inventory/batches/batch-delete-001'),
        expect.objectContaining({ method: 'DELETE' }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Delete batch' }));

      await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/inventory/batches/batch-delete-001'),
        expect.objectContaining({ method: 'DELETE' }),
      ));
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
      expect(screen.queryByLabelText(/Average daily use/i)).not.toBeInTheDocument();
      expect(screen.getByText('Expiry Date')).toBeInTheDocument();
      expect(screen.queryByText('Reorder Buffer')).not.toBeInTheDocument();
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
      const createCall = fetch.mock.calls.find(([, options]) => options?.method === 'POST');
      expect(createCall).toBeDefined();
      expect(JSON.parse(createCall[1].body)).not.toHaveProperty('average_daily_use');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/inventory/batches'),
        expect.objectContaining({ method: 'POST' }),
      );
      expect(onToast).toHaveBeenCalledWith(expect.stringContaining('Inventory batch saved'));
    });
  });

  describe('RiskForecastingView', () => {
    it('removes the demand chart and sorts shortage rows by severity', async () => {
      const batches = [
        { id: 'in-range-id', sku_code: 'IN-1', sku_name: 'In Range Medicine', quantity: 100, unit: 'units', storage_regime: 'ambient', average_daily_use: 1 },
        { id: 'critical-id', sku_code: 'CR-1', sku_name: 'Critical Medicine', quantity: 2, unit: 'units', storage_regime: 'ambient', average_daily_use: 1 },
        { id: 'at-risk-id', sku_code: 'AR-1', sku_name: 'At Risk Medicine', quantity: 10, unit: 'units', storage_regime: 'ambient', average_daily_use: 1 },
      ];
      const forecasts = [
        { inventory_batch_id: 'in-range-id', sku_code: 'IN-1', medicine_name: 'In Range Medicine', current_quantity: 100, average_daily_use: 1, days_until_stockout: 100, stockout_within_horizon: false, horizon_days: 7, risk_level: 'no_shortage_projected', projected_quantity: 93, data_source: 'daily_usage_records', surveillance_status: 'no_recent_surveillance', surveillance_multiplier: 1, daily_forecast: [{ predicted_demand: 1 }, { predicted_demand: 1 }, { predicted_demand: 1 }, { predicted_demand: 1 }, { predicted_demand: 1 }, { predicted_demand: 1 }, { predicted_demand: 1 }] },
        { inventory_batch_id: 'critical-id', sku_code: 'CR-1', medicine_name: 'Critical Medicine', current_quantity: 2, average_daily_use: 1, days_until_stockout: 2, stockout_within_horizon: true, horizon_days: 7, risk_level: 'critical_shortage', projected_quantity: 0, data_source: 'daily_usage_records', surveillance_status: 'no_recent_surveillance', surveillance_multiplier: 1, daily_forecast: [{ predicted_demand: 2 }, { predicted_demand: 2 }, { predicted_demand: 2 }, { predicted_demand: 2 }, { predicted_demand: 2 }, { predicted_demand: 2 }, { predicted_demand: 2 }] },
        { inventory_batch_id: 'at-risk-id', sku_code: 'AR-1', medicine_name: 'At Risk Medicine', current_quantity: 10, average_daily_use: 1, days_until_stockout: 10, stockout_within_horizon: true, horizon_days: 7, risk_level: 'shortage_within_horizon', projected_quantity: 3, data_source: 'daily_usage_records', surveillance_status: 'watch', surveillance_multiplier: 1.1, daily_forecast: [{ predicted_demand: 1 }, { predicted_demand: 1 }, { predicted_demand: 1 }, { predicted_demand: 1 }, { predicted_demand: 1 }, { predicted_demand: 1 }, { predicted_demand: 1 }] },
      ];
      vi.stubGlobal('fetch', vi.fn((url) => {
        if (String(url).includes('/api/inventory/forecast')) {
          return Promise.resolve({ ok: true, json: async () => ({ forecasts }) });
        }
        if (String(url).includes('/api/inventory/batches')) {
          return Promise.resolve({ ok: true, json: async () => batches });
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      }));
      render(<RiskForecastingView />);

      const critical = await screen.findByText('Critical Medicine');
      const table = critical.closest('table');
      const rowNames = [...table.querySelectorAll('tbody tr')].map((row) => row.cells[0].textContent.trim());
      expect(rowNames).toEqual(['Critical MedicineCR-1', 'At Risk MedicineAR-1', 'In Range MedicineIN-1']);
      expect(screen.queryByText('Expected daily demand')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Forecast result')).not.toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'In Range Medicine — 100 units available' })).toBeInTheDocument();
      fireEvent.change(screen.getByLabelText('Medicine in your inventory'), { target: { value: 'in-range-id' } });
      fireEvent.click(screen.getByRole('button', { name: 'Check forecast' }));
      expect(await screen.findByRole('status')).toHaveTextContent('Using previous usage data.');
      expect(screen.getByLabelText('Forecast result')).toHaveTextContent('100 units');
      expect(screen.getByLabelText('Forecast result')).toHaveTextContent('About 7 units');
      expect(screen.getByLabelText('Forecast result')).toHaveTextContent('About 100 days');
      expect(screen.queryByText(/LightGBM|horizon|surveillance/i)).not.toBeInTheDocument();
    });
  });

  describe('CommandPalette & ActionModals', () => {
    it('filters items in CommandPalette', () => {
      const handleAction = vi.fn();
      render(<CommandPalette isOpen={true} onClose={vi.fn()} onSelectAction={handleAction} />);

      expect(screen.getByPlaceholderText(/Search medicine, transfers/i)).toBeInTheDocument();
      expect(screen.getByText('Open Inventory')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Emergency Stock Request'));
      expect(handleAction).toHaveBeenCalledWith('emergency-request');
    });

    it('searches real hospital records and navigates with the result', async () => {
      const handleAction = vi.fn();
      window.sessionStorage.setItem(
        'pulsegrid_access_token',
        `header.${window.btoa(JSON.stringify({ hospital_id: 'hospital-current' }))}.signature`,
      );
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [{
            type: 'Inventory',
            id: 'batch-1',
            title: 'Actual medicine',
            detail: 'MED-001 · 12 units',
            view: 'inventory-and-skus',
          }],
        }),
      }));
      render(<CommandPalette isOpen onClose={vi.fn()} onSelectAction={handleAction} />);
      fireEvent.change(screen.getByPlaceholderText(/Search medicine, transfers/i), { target: { value: 'Actual medicine' } });

      fireEvent.click(await screen.findByText('Actual medicine'));
      expect(handleAction).toHaveBeenCalledWith('search-result', expect.objectContaining({
        id: 'batch-1',
        view: 'inventory-and-skus',
      }));
    });

    it('submits Emergency Stock Request in ActionModal', async () => {
      const handleConfirm = vi.fn();
      window.sessionStorage.setItem(
        'pulsegrid_access_token',
        `header.${window.btoa(JSON.stringify({ hospital_id: 'hospital-current' }))}.signature`,
      );
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ id: 'hospital-source', name: 'Source Hospital' }],
      }));
      render(
        <ActionModals
          modalData={{ type: 'emergency-request' }}
          onClose={vi.fn()}
          onConfirm={handleConfirm}
        />
      );

      expect(screen.getByText('Initiate Emergency Stock Request')).toBeInTheDocument();
      fireEvent.change(await screen.findByLabelText('Source hospital'), { target: { value: 'hospital-source' } });
      fireEvent.change(screen.getByPlaceholderText('Enter exact source inventory SKU'), { target: { value: 'MED-01' } });
      fireEvent.click(screen.getByText('Send stock request'));
      expect(handleConfirm).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ source_hospital_id: 'hospital-source', sku_code: 'MED-01' }),
      );
    });
  });

  describe('TransfersLogisticsView Component (Screen 4)', () => {
    it('renders the minimal real transfer workflow', async () => {
      render(<TransfersLogisticsView onToast={vi.fn()} />);

      expect(screen.getByText('Internal logistics')).toBeInTheDocument();
      expect(screen.getByText('Transfers')).toBeInTheDocument();
      expect(await screen.findByText('Sending')).toBeInTheDocument();
      expect(screen.getByText('Receiving')).toBeInTheDocument();
      expect(screen.getByText('No sending transfers.')).toBeInTheDocument();
      expect(screen.getByText('No receiving transfers.')).toBeInTheDocument();
    });

    it('opens the minimal transfer form', () => {
      render(<TransfersLogisticsView onToast={vi.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: 'New transfer' }));
      expect(screen.getByPlaceholderText('Medicine name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('SKU code')).toBeInTheDocument();
      expect(screen.getByLabelText('Destination hospital')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create transfer' })).toBeInTheDocument();
    });

    it('prefills a transfer when started from an inventory item', async () => {
      const onInitialDraftConsumed = vi.fn();
      render(
        <TransfersLogisticsView
          onToast={vi.fn()}
          initialDraft={{ sku_name: 'Actual medicine', sku_code: 'MED-001', unit: 'packs' }}
          onInitialDraftConsumed={onInitialDraftConsumed}
        />,
      );

      expect(await screen.findByDisplayValue('Actual medicine')).toBeInTheDocument();
      expect(screen.getByDisplayValue('MED-001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('packs')).toBeInTheDocument();
      expect(onInitialDraftConsumed).toHaveBeenCalledTimes(1);
    });

    it('prepares a transfer before dispatching it in transit', async () => {
      window.sessionStorage.setItem(
        'pulsegrid_access_token',
        `header.${window.btoa(JSON.stringify({ hospital_id: 'hospital-source' }))}.signature`,
      );
      let transfer = {
        id: 'transfer-outbound-001',
        sku_name: 'Paracetamol',
        sku_code: 'MED-01',
        quantity: 12,
        unit: 'vials',
        urgency: 'normal',
        status: 'approved',
        requesting_hospital_id: 'hospital-destination',
        source_hospital_id: 'hospital-source',
      };
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url, options = {}) => {
        if (options.method === 'POST') {
          return Promise.resolve({ ok: true, json: async () => transfer });
        }
        if (options.method === 'PATCH') {
          transfer = { ...transfer, status: JSON.parse(options.body).status };
          return Promise.resolve({ ok: true, json: async () => transfer });
        }
        if (String(url).includes('/api/hospitals')) {
          return Promise.resolve({
            ok: true,
            json: async () => [
              { id: 'hospital-source', name: 'Source Hospital' },
              { id: 'hospital-destination', name: 'Destination Hospital' },
            ],
          });
        }
        return Promise.resolve({ ok: true, json: async () => [transfer] });
      }));
      render(<TransfersLogisticsView onToast={vi.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: 'New transfer' }));
      await screen.findByRole('option', { name: 'Destination Hospital' });
      fireEvent.change(screen.getByPlaceholderText('Medicine name'), { target: { value: 'Paracetamol' } });
      fireEvent.change(screen.getByPlaceholderText('SKU code'), { target: { value: 'MED-01' } });
      fireEvent.change(screen.getByPlaceholderText('Quantity'), { target: { value: '12' } });
      fireEvent.change(screen.getByLabelText('Destination hospital'), { target: { value: 'hospital-destination' } });
      fireEvent.click(screen.getByRole('button', { name: 'Create transfer' }));

      await waitFor(() => {
        const createCall = fetch.mock.calls.find(([, options]) => options?.method === 'POST');
        expect(createCall).toBeDefined();
        expect(JSON.parse(createCall[1].body)).toEqual(expect.objectContaining({
          destination_hospital_id: 'hospital-destination',
          sku_code: 'MED-01',
          quantity: 12,
        }));
      });
      fireEvent.click(await screen.findByRole('button', { name: 'Prepare and send' }));
      fireEvent.click(await screen.findByRole('button', { name: 'Dispatch shipment' }));
      await waitFor(() => expect(screen.getByText('In transit')).toBeInTheDocument());
    });

    it('lets the receiving hospital accept an in-transit delivery', async () => {
      window.sessionStorage.setItem(
        'pulsegrid_access_token',
        `header.${window.btoa(JSON.stringify({ hospital_id: 'hospital-destination' }))}.signature`,
      );
      let transfer = {
        id: 'transfer-inbound-001',
        sku_name: 'Paracetamol',
        sku_code: 'MED-01',
        quantity: 12,
        unit: 'vials',
        urgency: 'normal',
        status: 'in_transit',
        requesting_hospital_id: 'hospital-destination',
        source_hospital_id: 'hospital-source',
      };
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url, options = {}) => {
        if (String(url).endsWith('/receipt') && options.method === 'POST') {
          transfer = { ...transfer, status: 'completed' };
          return Promise.resolve({ ok: true, json: async () => ({ status: 'completed' }) });
        }
        if (String(url).includes('/api/hospitals')) {
          return Promise.resolve({
            ok: true,
            json: async () => [
              { id: 'hospital-source', name: 'Source Hospital' },
              { id: 'hospital-destination', name: 'Destination Hospital' },
            ],
          });
        }
        return Promise.resolve({ ok: true, json: async () => [transfer] });
      }));
      render(<TransfersLogisticsView onToast={vi.fn()} />);

      await screen.findByText(/transfer-inbound-001/);
      fireEvent.click(screen.getByRole('button', { name: 'Received' }));

      await waitFor(() => {
        const receiptCall = fetch.mock.calls.find(([url, options]) => (
          String(url).endsWith('/receipt') && options?.method === 'POST'
        ));
        expect(receiptCall).toBeDefined();
        expect(JSON.parse(receiptCall[1].body)).toEqual(expect.objectContaining({
          accepted_quantity: 12,
          rejected_quantity: 0,
        }));
      });
      expect(screen.getByText('Receiving')).toBeInTheDocument();
      await waitFor(() => expect(screen.getByText('Received')).toBeInTheDocument());
    });

    it('does not show canceled transfers in the transfer lists', async () => {
      window.sessionStorage.setItem(
        'pulsegrid_access_token',
        `header.${window.btoa(JSON.stringify({ hospital_id: 'hospital-source' }))}.signature`,
      );
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
        if (String(url).includes('/api/hospitals')) {
          return Promise.resolve({ ok: true, json: async () => [] });
        }
        return Promise.resolve({
          ok: true,
          json: async () => [{
            id: 'transfer-canceled-001',
            sku_name: 'Canceled medicine',
            sku_code: 'MED-02',
            quantity: 4,
            unit: 'packs',
            status: 'canceled',
            source_hospital_id: 'hospital-source',
            requesting_hospital_id: 'hospital-destination',
            requesting_hospital_name: 'Destination Hospital',
          }],
        });
      }));
      render(<TransfersLogisticsView onToast={vi.fn()} />);

      await screen.findByText('No sending transfers.');
      expect(screen.getByText('No sending transfers.')).toBeInTheDocument();
      expect(screen.getByText('No receiving transfers.')).toBeInTheDocument();
      expect(screen.queryByText('Canceled medicine')).not.toBeInTheDocument();
      expect(screen.queryByText('Cancelled')).not.toBeInTheDocument();
    });

    it('persists transfer approval and reloads the hospital transfer list', async () => {
      const handleToast = vi.fn();
      window.sessionStorage.setItem(
        'pulsegrid_access_token',
        `header.${window.btoa(JSON.stringify({ hospital_id: 'hospital-source' }))}.signature`,
      );
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

      await screen.findByText(/transfer-test-001/);
      const approveBtn = await screen.findByRole('button', { name: 'Approve request' });
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
        if (String(url).includes('/api/marketplace/inventory')) {
          return Promise.resolve({
            ok: true,
            json: async () => [{
              id: 'batch-001',
              sku_name: 'Paracetamol 500mg IV',
              sku_code: 'IV-PARA-500',
              quantity_available: 100,
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
        if (String(url).includes('/api/marketplace/inventory')) {
          return Promise.resolve({
            ok: true,
            json: async () => [{
              id: 'batch-001',
              sku_name: 'Paracetamol 500mg IV',
              sku_code: 'IV-PARA-500',
              quantity_available: 100,
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
      expect(screen.getByRole('alertdialog')).toHaveTextContent('Remove Owned surplus');
      expect(fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/api/marketplace/listings/listing-owned-001'),
        expect.objectContaining({ method: 'DELETE' }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Remove listing' }));

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
      expect(screen.getByText(/Surplus sharing is commercial/)).toBeInTheDocument();
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
    it('shows only editable hospital details, location, and password', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          name: 'Metro General Hospital',
          administrator_name: 'Alex Morgan',
          settings: { latitude: 12.9716, longitude: 77.5946 },
        }),
      }));
      render(<HospitalSettingsView onToast={vi.fn()} />);

      expect(await screen.findByDisplayValue('Metro General Hospital')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Alex Morgan')).toBeInTheDocument();
      expect(screen.getByLabelText('Latitude')).toHaveValue(12.9716);
      expect(screen.getByLabelText('Longitude')).toHaveValue(77.5946);
      expect(screen.getByRole('heading', { name: 'Password' })).toBeInTheDocument();
      expect(screen.queryByText(/Local node|clearance|algorithmic|MQTT/i)).not.toBeInTheDocument();
    });
  });

  describe('App Full Integration', () => {
    it('requires hospital login before showing the dashboard', async () => {
      render(<App />);
      expect(screen.getByText('Hospital Login')).toBeInTheDocument();
      expect(screen.queryByText('Executive Command Console')).not.toBeInTheDocument();
      expect(
        screen.getByText('Keep medicine stock moving where it is needed.')
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

      expect(await screen.findByText('Stock and transfers')).toBeInTheDocument();
      expect(screen.getAllByText('North District Hospital').length).toBeGreaterThan(0);
      const hospitalRequest = fetchMock.mock.calls.find(([url]) => String(url).includes('/api/hospitals/me'));
      expect(hospitalRequest[1].headers.get('Authorization')).toBe('Bearer saved-hospital-token');
    });
  });
});
