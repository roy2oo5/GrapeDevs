import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Header } from '../components/Header';
import { LeftTelemetryPanel } from '../components/LeftTelemetryPanel';
import { AuthFormPanel } from '../components/AuthFormPanel';
import { Footer } from '../components/Footer';
import { InfoModal } from '../components/InfoModal';
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

  describe('Footer Component', () => {
    it('renders security certifications and modal trigger links', () => {
      const handleModal = vi.fn();
      render(<Footer onOpenModal={handleModal} />);

      expect(screen.getByText('SOC2 TYPE II')).toBeInTheDocument();
      expect(screen.getByText('HIPAA VERIFIED')).toBeInTheDocument();
      expect(screen.getByText(/FIPS 140-3 Hardware Boundary/i)).toBeInTheDocument();

      fireEvent.click(screen.getByText('Protocol Terms'));
      expect(handleModal).toHaveBeenCalledWith('terms');

      fireEvent.click(screen.getByText('Cryptographic Audit'));
      expect(handleModal).toHaveBeenCalledWith('audit');

      fireEvent.click(screen.getByText('Incident Telemetry'));
      expect(handleModal).toHaveBeenCalledWith('telemetry');
    });
  });

  describe('InfoModal Component', () => {
    it('renders Protocol Terms content correctly', () => {
      const handleClose = vi.fn();
      render(<InfoModal modalType="terms" onClose={handleClose} />);

      expect(screen.getByText('PulseGrid Protocol Terms')).toBeInTheDocument();
      expect(
        screen.getByText(/Mutual Aid Redistribution Protocol/i)
      ).toBeInTheDocument();

      fireEvent.click(screen.getByText('Close'));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('renders Cryptographic Audit report details', () => {
      render(<InfoModal modalType="audit" onClose={vi.fn()} />);
      expect(screen.getByText('Cryptographic Audit Report')).toBeInTheDocument();
      expect(screen.getByText(/TLS_AES_256_GCM_SHA384/i)).toBeInTheDocument();
    });

    it('renders SSO provider directory', () => {
      render(<InfoModal modalType="sso" onClose={vi.fn()} />);
      expect(screen.getByText('Institutional SSO Provider')).toBeInTheDocument();
      expect(
        screen.getByText('Metro Health Unified Federation')
      ).toBeInTheDocument();
    });
  });

  describe('App Full Integration', () => {
    it('renders full PulseGrid application without errors', async () => {
      render(<App />);
      expect(screen.getAllByText('PulseGrid').length).toBeGreaterThanOrEqual(2);
      expect(
        screen.getByText('Predictive inventory, zero-stockout allocation.')
      ).toBeInTheDocument();
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
    });
  });
});
