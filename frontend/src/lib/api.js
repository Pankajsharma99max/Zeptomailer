const API_BASE = '';

function getHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('auth_token');
  return {
    ...extraHeaders,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

async function handleResponse(res) {
  if (res.status === 401) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    window.location.reload();
  }
  if (!res.ok) {
    let err = { detail: 'API Error' };
    try { err = await res.json(); } catch(e) {}
    throw new Error(err.detail || 'API Error');
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return res;
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

export async function fetchUsers() {
  const res = await fetch(`${API_BASE}/api/auth/users`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function createUser(userData) {
  const res = await fetch(`${API_BASE}/api/auth/users`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(userData),
  });
  return handleResponse(res);
}

export async function deleteUser(userId) {
  const res = await fetch(`${API_BASE}/api/auth/users/${userId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(res);
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

export async function uploadTemplate(files) {
  const formData = new FormData();
  if (files instanceof FileList || Array.isArray(files)) {
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
  } else {
    formData.append('files', files);
  }
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

export async function submitCampaign(config) {
  const res = await fetch(`${API_BASE}/api/campaign/submit`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(config),
  });
  return handleResponse(res);
}

export async function fetchPendingCampaigns() {
  const res = await fetch(`${API_BASE}/api/campaign/pending`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function approveCampaign(campaignId) {
  const res = await fetch(`${API_BASE}/api/campaign/approve/${campaignId}`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function rejectCampaign(campaignId) {
  const res = await fetch(`${API_BASE}/api/campaign/reject/${campaignId}`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function retryFailedCampaign(campaignId) {
  const res = await fetch(`${API_BASE}/api/campaign/retry-failed/${campaignId}`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function sendQuickTest(config) {
  const res = await fetch(`${API_BASE}/api/campaign/test-single`, {
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

export async function pauseCampaign() {
  const res = await fetch(`${API_BASE}/api/campaign/pause`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function resumeCampaign() {
  const res = await fetch(`${API_BASE}/api/campaign/resume`, {
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
  const token = localStorage.getItem('auth_token') || '';
  return `${API_BASE}/api/campaign/failed-csv?token=${token}`;
}

export async function fetchStatus() {
  const res = await fetch(`${API_BASE}/api/status`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function fetchHistory() {
  const res = await fetch(`${API_BASE}/api/status/history`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function clearHistory() {
  const res = await fetch(`${API_BASE}/api/status/history`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(res);
}

export async function deleteHistoryItem(id) {
  const res = await fetch(`${API_BASE}/api/status/history/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(res);
}
export function getTemplateImageUrl(index = 0) {
  const token = localStorage.getItem('auth_token') || '';
  return `${API_BASE}/api/upload/template-image?index=${index}&token=${token}`;
}

export async function fetchSettings() {
  const res = await fetch(`${API_BASE}/api/settings`, { headers: getHeaders() });
  return handleResponse(res);
}

export async function updateSettings(settings) {
  const res = await fetch(`${API_BASE}/api/settings`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(settings),
  });
  return handleResponse(res);
}

export function createProgressSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const token = localStorage.getItem('auth_token') || '';
  return new WebSocket(`${protocol}//${host}/ws/progress?token=${token}`);
}
