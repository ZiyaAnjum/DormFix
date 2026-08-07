const API_BASE = import.meta.env.VITE_API_URL || '';

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
}

export async function fetchMeta() {
  const response = await fetch(`${API_BASE}/api/complaints/meta`);
  return handleResponse(response);
}

export async function uploadPhoto(file) {
  const formData = new FormData();
  formData.append('photo', file);

  const response = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse(response);
}

export async function createComplaint(payload) {
  const response = await fetch(`${API_BASE}/api/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}
