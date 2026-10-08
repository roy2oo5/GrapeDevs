import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, Terminal } from 'lucide-react';
import { fetchDashboard, fetchHealth, fetchInventory, fetchTransfers } from '../services/api';

export function ApiTester({ onStatusChange }) {
  const [health, setHealth] = useState(null);
  const [summary, setSummary] = useState(null);
  const [counts, setCounts] = useState({ inventory: 0, transfers: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('// Authenticated API checks will appear here...\n');

  const logConsole = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleOutput((previous) => `[${timestamp}] ${message}\n${previous}`);
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const healthData = await fetchHealth();
      setHealth(healthData);
      logConsole('GET /api/health -> 200 OK');
      const [dashboard, inventory, transfers] = await Promise.all([
        fetchDashboard(),
        fetchInventory(),
        fetchTransfers(),
      ]);
      setSummary(dashboard);
      setCounts({ inventory: inventory.length, transfers: transfers.length });
      onStatusChange?.('online');
      logConsole('GET /api/dashboard -> 200 OK');
      logConsole(`GET /api/inventory/batches -> 200 OK (${inventory.length} batches)`);
      logConsole(`GET /api/transfers -> 200 OK (${transfers.length} transfers)`);
    } catch (loadError) {
      setError(loadError.message || 'Authenticated API request failed.');
      onStatusChange?.('offline');
      logConsole(`ERROR: ${loadError.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div id="api-explorer" className="api-section">
      <div className="section-header">
        <div>
          <h2>Hospital API Diagnostics</h2>
          <p className="feature-desc">Authenticated checks for hospital data endpoints</p>
        </div>
        <button className="btn btn-secondary" onClick={loadData} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh Sync
        </button>
      </div>

      {error && (
        <div className="glass-card" role="alert" style={{ borderColor: 'rgba(244, 63, 94, 0.4)', marginBottom: '1.5rem', background: 'rgba(244, 63, 94, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#f43f5e' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="features-grid" style={{ marginTop: 0 }}>
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>System Telemetry</h3>
            {health ? (
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                <CheckCircle2 size={16} /> Operational
              </span>
            ) : <span style={{ color: '#f43f5e', fontSize: '0.85rem' }}>Offline</span>}
          </div>
          {health && <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <p><strong>Framework:</strong> {health.framework}</p>
            <p><strong>Environment:</strong> {health.environment}</p>
            <p><strong>Python:</strong> {health.python_version}</p>
            <p><strong>Uptime:</strong> {health.uptime_seconds?.toFixed(1)}s</p>
          </div>}
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Hospital Data</h3>
          {summary ? <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <p><strong>Inventory units:</strong> {summary.inventory_units}</p>
            <p><strong>Expiring within 30 days:</strong> {summary.units_expiring_within_30_days}</p>
            <p><strong>Surplus batches:</strong> {summary.surplus_batch_count}</p>
            <p><strong>Active transfers:</strong> {summary.active_transfer_count}</p>
            <p><strong>Loaded records:</strong> {counts.inventory} batches, {counts.transfers} transfers</p>
          </div> : <p>Waiting for authenticated hospital data.</p>}
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <Terminal size={14} /> Live API Telemetry
        </div>
        <pre className="code-console">{consoleOutput}</pre>
      </div>
    </div>
  );
}
