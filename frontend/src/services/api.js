const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const ACCESS_TOKEN_KEY = 'pulsegrid_access_token';

export function getAccessToken() {
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
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

export async function fetchHealth() {
  try {
    return await request('/api/health');
  } catch (error) {
    console.error('Failed to fetch health check:', error);
    throw error;
  }
}

export async function fetchItems() {
  try {
    return await request('/api/items', {}, true);
  } catch (error) {
    console.error('Failed to fetch items:', error);
    throw error;
  }
}

export async function addItem(item) {
  try {
    return await request('/api/items', {
      method: 'POST',
      body: JSON.stringify(item),
    }, true);
  } catch (error) {
    console.error('Failed to add item:', error);
    throw error;
  }
}

export async function deleteItem(id) {
  try {
    return await request(`/api/items/${id}`, {
      method: 'DELETE',
    }, true);
  } catch (error) {
    console.error('Failed to delete item:', error);
    throw error;
  }
}
