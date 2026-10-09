// Use the same-origin Vite proxy by default so LAN clients call the dev server's
// backend proxy instead of trying to reach their own localhost:8000.
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const ACCESS_TOKEN_KEY = 'pulsegrid_access_token';

export function getAccessToken() {
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getCurrentHospitalId() {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const encodedPayload = token.split('.')[1];
    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
    return payload.hospital_id || null;
  } catch {
    return null;
  }
}

export function openRealtimeConnection({ onMessage, onClose } = {}) {
  const token = getAccessToken();
  if (!token) return null;
  const configuredUrl = import.meta.env.VITE_API_URL;
  const websocketBase = configuredUrl
    ? configuredUrl.replace(/^http/, 'ws')
    : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
  const websocket = new WebSocket(`${websocketBase}/api/ws?token=${encodeURIComponent(token)}`);
  websocket.addEventListener('message', (event) => {
    try {
      onMessage?.(JSON.parse(event.data));
    } catch {
      console.warn('Received an invalid realtime event.');
    }
  });
  websocket.addEventListener('close', () => onClose?.());
  return websocket;
}

export function setAccessToken(token) {
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

async function request(path, options = {}, authenticated = false) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (authenticated) {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.detail || `Request failed with status ${response.status}`);
  }
  return payload;
}

export function registerHospital(hospital) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(hospital),
  });
}

export async function loginHospital(credentials) {
  const session = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  setAccessToken(session.access_token);
  return session;
}

export async function fetchCurrentHospital() {
  return request('/api/hospitals/me', {}, true);
}

export function fetchHospitals() {
  return request('/api/hospitals', {}, true);
}

export function fetchDashboard() {
  return request('/api/dashboard', {}, true);
}

export function fetchInventory(params = {}) {
  const query = new URLSearchParams(params);
  return request(`/api/inventory/batches${query.size ? `?${query}` : ''}`, {}, true);
}

export function createInventoryBatch(batch) {
  return request('/api/inventory/batches', { method: 'POST', body: JSON.stringify(batch) }, true);
}

export function updateInventoryBatch(batchId, quantity) {
  return request(`/api/inventory/batches/${batchId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  }, true);
}

export function deleteInventoryBatch(batchId) {
  const id = typeof batchId === 'object' && batchId !== null
    ? (batchId.id || batchId.batch_id || batchId.key)
    : batchId;
  if (!id) {
    throw new Error('A valid batch ID is required to delete an inventory batch.');
  }
  return request(`/api/inventory/batches/${id}`, { method: 'DELETE' }, true);
}

export const deleteInventory = deleteInventoryBatch;
export const deleteItem = deleteInventoryBatch;

export function updateInventoryUsage(batchId, averageDailyUse) {
  return request(`/api/inventory/batches/${batchId}/usage`, {
    method: 'PATCH',
    body: JSON.stringify({ average_daily_use: averageDailyUse }),
  }, true);
}

export function fetchInventoryForecast(horizonDays = 30) {
  return request(`/api/inventory/forecast?horizon_days=${horizonDays}`, {}, true);
}

export function fetchMouInventoryAvailability(skuCode) {
  return request(`/api/inventory/mou-availability?sku_code=${encodeURIComponent(skuCode)}`, {}, true);
}

export function requestMouInventory(payload) {
  return request('/api/inventory/mou-availability/request', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, true);
}

export function saveDailyUsage(payload) {
  return request('/api/data/usage', { method: 'POST', body: JSON.stringify(payload) }, true);
}

export function saveSurveillanceReport(payload) {
  return request('/api/data/surveillance', { method: 'POST', body: JSON.stringify(payload) }, true);
}

export function fetchDemandForecast(forecast) {
  return request('/api/forecast/predict', {
    method: 'POST',
    body: JSON.stringify(forecast),
  }, true);
}

export function fetchDemandForecastModelInfo() {
  return request('/api/forecast/model-info', {}, true);
}

export function fetchTransfers(params = {}) {
  const query = new URLSearchParams(params);
  return request(`/api/transfers${query.size ? `?${query}` : ''}`, {}, true);
}

export function createTransfer(transfer) {
  return request('/api/transfers', { method: 'POST', body: JSON.stringify(transfer) }, true);
}

export function updateTransferStatus(transferId, status) {
  return request(`/api/transfers/${transferId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }, true);
}

export function fetchTransferDrivers() {
  return request('/api/transfers/fleet/drivers', {}, true);
}

export function createTransferDriver(payload) {
  return request('/api/transfers/fleet/drivers', { method: 'POST', body: JSON.stringify(payload) }, true);
}

export function fetchTransferVehicles() {
  return request('/api/transfers/fleet/vehicles', {}, true);
}

export function createTransferVehicle(payload) {
  return request('/api/transfers/fleet/vehicles', { method: 'POST', body: JSON.stringify(payload) }, true);
}

export function assignTransferLogistics(transferId, payload) {
  return request(`/api/transfers/${transferId}/assignment`, { method: 'PATCH', body: JSON.stringify(payload) }, true);
}

export function addTransferCustodyEvent(transferId, payload) {
  return request(`/api/transfers/${transferId}/custody`, { method: 'POST', body: JSON.stringify(payload) }, true);
}

export function submitTransferReceipt(transferId, payload) {
  return request(`/api/transfers/${transferId}/receipt`, { method: 'POST', body: JSON.stringify(payload) }, true);
}

export function reportTransferIncident(transferId, payload) {
  return request(`/api/transfers/${transferId}/incidents`, { method: 'POST', body: JSON.stringify(payload) }, true);
}

export function startTransferTracking(transferId, payload) {
  return request(`/api/transfers/${transferId}/tracking`, { method: 'POST', body: JSON.stringify(payload) }, true);
}

export function addTransferLocationPoint(transferId, sessionId, payload) {
  return request(`/api/transfers/${transferId}/tracking/${sessionId}/points`, { method: 'POST', body: JSON.stringify(payload) }, true);
}

export function fetchSurplusListings(params = {}) {
  const query = new URLSearchParams(params);
  return request(`/api/marketplace/listings${query.size ? `?${query}` : ''}`, {}, true);
}

export function fetchMySurplusListings() {
  return request('/api/marketplace/mine', {}, true);
}

export function publishSurplusListing(listing) {
  return request('/api/marketplace/listings', { method: 'POST', body: JSON.stringify(listing) }, true);
}

export function requestSurplusListing(listingId, requestDetails) {
  return request(`/api/marketplace/listings/${listingId}/request`, {
    method: 'POST',
    body: JSON.stringify(requestDetails),
  }, true);
}

export function deleteSurplusListing(listingId) {
  return request(`/api/marketplace/listings/${listingId}`, { method: 'DELETE' }, true);
}

export function fetchAgreements() {
  return request('/api/agreements', {}, true);
}

export function createAgreement(agreement) {
  return request('/api/agreements', { method: 'POST', body: JSON.stringify(agreement) }, true);
}

export function updateAgreementStatus(agreementId, status) {
  return request(`/api/agreements/${agreementId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }, true);
}

export function fetchHospitalSettings() {
  return request('/api/operations/settings', {}, true);
}

export function saveHospitalSettings(settings) {
  return request('/api/operations/settings', {
    method: 'PUT',
    body: JSON.stringify({ settings }),
  }, true);
}

export function runScenario(scenario) {
  return request('/api/operations/scenarios', { method: 'POST', body: JSON.stringify(scenario) }, true);
}

export function fetchScenarioRuns() {
  return request('/api/operations/scenarios', {}, true);
}

export async function fetchHealth() {
  try {
    return await request('/api/health');
  } catch (error) {
    console.error('Failed to fetch health check:', error);
    throw error;
  }
}
