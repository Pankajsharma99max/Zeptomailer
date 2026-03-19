const API_BASE = '';

export async function uploadCSV(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/api/upload/csv`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function uploadTemplate(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/api/upload/template`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function fetchPreviews(config) {
  const res = await fetch(`${API_BASE}/api/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Preview failed');
  }
  return res.json();
}

export async function startCampaign(config) {
  const res = await fetch(`${API_BASE}/api/campaign/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to start campaign');
  }
  return res.json();
}

export async function stopCampaign() {
  const res = await fetch(`${API_BASE}/api/campaign/stop`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to stop');
  }
  return res.json();
}

export async function fetchProgress() {
  const res = await fetch(`${API_BASE}/api/campaign/progress`);
  if (!res.ok) throw new Error('Progress fetch failed');
  return res.json();
}

export function getFailedCSVUrl() {
  return `${API_BASE}/api/campaign/failed-csv`;
}

export function createProgressSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return new WebSocket(`${protocol}//${host}/ws/progress`);
}
