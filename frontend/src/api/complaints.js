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

export async function fetchComplaints(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.category) params.append('category', filters.category);
  if (filters.search) params.append('search', filters.search);

  const response = await fetch(`${API_BASE}/api/complaints?${params.toString()}`);
  return handleResponse(response);
}

export async function upvoteComplaint(id, currentUpvotes) {
  const response = await fetch(`${API_BASE}/api/complaints/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ upvotes: currentUpvotes + 1 }),
  });
  return handleResponse(response);
}

export async function updateComplaintStatus(id, newStatus, passcode) {
  const response = await fetch(`${API_BASE}/api/complaints/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Passcode': passcode,
    },
    body: JSON.stringify({ status: newStatus }),
  });
  return handleResponse(response);
}

export async function submitComplaintFeedback(id, feedback) {
  const response = await fetch(`${API_BASE}/api/complaints/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ feedback }),
  });
  return handleResponse(response);
}

