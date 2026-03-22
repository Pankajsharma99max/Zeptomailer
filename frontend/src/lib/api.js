const API_BASE = '';

function getHeaders(extraHeaders = {}) {
  const pwd = localStorage.getItem('app_password');
  return {
    ...extraHeaders,
    ...(pwd ? { 'x-api-key': pwd } : {})
  };
}

async function handleResponse(res) {
  if (res.status === 401) {
    localStorage.removeItem('app_password');
    window.location.reload();
  }
  if (!res.ok) {
    let err = { detail: 'API Error' };
    try { err = await res.json(); } catch(e) {}
    throw new Error(err.detail || 'API Error');
  }
  // For file responses like template image
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return res;
}

export async function uploadCSV(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/api/upload/csv`, {
    method: 'POST',
    headers: getHeaders(),
    body: formData,
  });
  return handleResponse(res);
}

export async function uploadTemplate(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/api/upload/template`, {
    method: 'POST',
    headers: getHeaders(),
    body: formData,
  });
  return handleResponse(res);
}

export async function fetchPreviews(config) {
  const res = await fetch(`${API_BASE}/api/preview`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(config),
  });
  return handleResponse(res);
}

export async function startCampaign(config) {
  const res = await fetch(`${API_BASE}/api/campaign/start`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(config),
  });
  return handleResponse(res);
}

export async function stopCampaign() {
  const res = await fetch(`${API_BASE}/api/campaign/stop`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function fetchProgress() {
  const res = await fetch(`${API_BASE}/api/campaign/progress`, { headers: getHeaders() });
  return handleResponse(res);
}

export function getFailedCSVUrl() {
  const pwd = localStorage.getItem('app_password') || '';
  return `${API_BASE}/api/campaign/failed-csv?token=${pwd}`;
}

export async function fetchStatus() {
  const res = await fetch(`${API_BASE}/api/status`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function fetchHistory() {
  const res = await fetch(`${API_BASE}/api/status/history`, { headers: getHeaders() });
  return handleResponse(res);
}

export function getTemplateImageUrl() {
  const pwd = localStorage.getItem('app_password') || '';
  return `${API_BASE}/api/upload/template-image?token=${pwd}`;
}

export function createProgressSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const pwd = localStorage.getItem('app_password') || '';
  return new WebSocket(`${protocol}//${host}/ws/progress?token=${pwd}`);
}
