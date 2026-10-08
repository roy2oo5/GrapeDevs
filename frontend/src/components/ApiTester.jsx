import React, { useState, useEffect } from 'react';
import { fetchHealth, fetchItems, addItem, deleteItem } from '../services/api';
import { Plus, Trash2, RefreshCw, CheckCircle2, AlertCircle, Terminal } from 'lucide-react';

export function ApiTester({ onStatusChange }) {
  const [health, setHealth] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('// Console logs will appear here...\n');

  const logConsole = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleOutput((prev) => `[${timestamp}] ${msg}\n` + prev);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const healthData = await fetchHealth();
      setHealth(healthData);
      onStatusChange('online');
      logConsole(`GET /api/health -> 200 OK: System uptime ${healthData.uptime_seconds?.toFixed(1)}s`);

      const itemsData = await fetchItems();
      setItems(itemsData.items || []);
      logConsole(`GET /api/items -> 200 OK: Loaded ${itemsData.count} items`);
    } catch (err) {
      setError('Could not connect to FastAPI server. Ensure backend is running on http://localhost:8000.');
      onStatusChange('offline');
      logConsole(`ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    try {
      const newItem = await addItem({
        name: nameInput.trim(),
        description: descInput.trim() || 'No description provided',
      });
      logConsole(`POST /api/items -> 201 Created: "${newItem.item.name}" (ID: ${newItem.item.id})`);
      setNameInput('');
      setDescInput('');
      await loadData();
    } catch (err) {
      logConsole(`POST /api/items ERROR: ${err.message}`);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await deleteItem(id);
      logConsole(`DELETE /api/items/${id} -> 200 OK`);
      await loadData();
    } catch (err) {
      logConsole(`DELETE /api/items/${id} ERROR: ${err.message}`);
    }
  };

  return (
    <div id="api-explorer" className="api-section">
      <div className="section-header">
        <div>
          <h2>Interactive API Explorer</h2>
          <p className="feature-desc">Test real-time REST API endpoints connected to your FastAPI backend</p>
        </div>
        <button className="btn btn-secondary" onClick={loadData} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh Sync
        </button>
      </div>

      {error && (
        <div className="glass-card" style={{ borderColor: 'rgba(244, 63, 94, 0.4)', marginBottom: '1.5rem', background: 'rgba(244, 63, 94, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#f43f5e' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="features-grid" style={{ marginTop: '0' }}>
        {/* Backend Info & Health */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>System Telemetry</h3>
            {health ? (
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                <CheckCircle2 size={16} /> Operational
              </span>
            ) : (
              <span style={{ color: '#f43f5e', fontSize: '0.85rem' }}>Offline</span>
            )}
          </div>

          {health ? (
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <p style={{ margin: '0.4rem 0' }}><strong style={{ color: '#fff' }}>Framework:</strong> {health.framework}</p>
              <p style={{ margin: '0.4rem 0' }}><strong style={{ color: '#fff' }}>Environment:</strong> {health.environment}</p>
              <p style={{ margin: '0.4rem 0' }}><strong style={{ color: '#fff' }}>Python Version:</strong> {health.python_version}</p>
              <p style={{ margin: '0.4rem 0' }}><strong style={{ color: '#fff' }}>Uptime:</strong> {health.uptime_seconds?.toFixed(1)}s</p>
            </div>
          ) : (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Start the FastAPI server via <code style={{ color: '#38bdf8' }}>python backend/run.py</code> to see telemetry data.
            </p>
          )}
        </div>

        {/* Item Creator & List */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Manage Items (FastAPI CRUD)</h3>
          
          <form onSubmit={handleAddItem} className="form-group" style={{ flexDirection: 'column', gap: '0.6rem' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Item Name (e.g. Neural Model)"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              required
            />
            <input
              type="text"
              className="input-field"
              placeholder="Description (optional)"
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1rem', justifyContent: 'center' }}>
              <Plus size={16} /> Add Item
            </button>
          </form>

          <div className="items-list">
            {items.map((item) => (
              <div key={item.id} className="item-card">
                <div className="item-info">
                  <span className="item-name">{item.name}</span>
                  <span className="item-desc">{item.description}</span>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteItem(item.id)}
                  title="Delete Item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {items.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', textAlign: 'center', padding: '1rem 0' }}>
                No items added yet. Try adding one above!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Terminal Log Output */}
      <div style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <Terminal size={14} /> Live API Telemetry Output
        </div>
        <pre className="code-console">{consoleOutput}</pre>
      </div>
    </div>
  );
}
