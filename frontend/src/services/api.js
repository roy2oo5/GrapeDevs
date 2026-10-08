const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch health check:', error);
    throw error;
  }
}

export async function fetchItems() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/items`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch items:', error);
    throw error;
  }
}

export async function addItem(item) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Failed to add item:', error);
    throw error;
  }
}

export async function deleteItem(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/items/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Failed to delete item:', error);
    throw error;
  }
}
