/**
 * COEP मित्र — Centralised API Client
 * All backend calls route through here. Token is auto-attached.
 */

// Use the VITE_API_URL environment variable, defaulting to localhost for development
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

console.log('[API] Environment:', import.meta.env.MODE);
console.log('[API] Base URL:', BASE_URL);

function getToken() {
  try { return localStorage.getItem('mitr_token') || null; }
  catch { return null; }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Ensure BASE_URL doesn't end with a slash if endpoint starts with one, or vice versa
  const cleanBase = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${cleanBase}${cleanEndpoint}`;

  console.log(`[API] ${options.method || 'GET'} ${fullUrl}`);

  let res;
  try {
    res = await fetch(fullUrl, { ...options, headers });
  } catch (networkErr) {
    console.error('[API] Network error — is the backend running?', networkErr.message);
    throw networkErr;
  }

  let data;
  try { data = await res.json(); }
  catch {
    console.error('[API] Non-JSON response, status:', res.status);
    throw new Error(`Server returned non-JSON response (${res.status})`);
  }

  if (!res.ok) {
    console.error(`[API] Error ${res.status}:`, data);
    const error = new Error(data.message || 'Something went wrong');
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  loginStudent: (misId, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ misId, password }) }),
  loginAdmin: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getMe: () => request('/auth/me'),
  completeOnboarding: () => request('/auth/onboarding', { method: 'PATCH' }),
};

// ── Events ────────────────────────────────────────────────────────────────────
export const eventsAPI = {
  getAll: (category) =>
    request(`/events${category && category !== 'All' ? `?category=${category}` : ''}`),
  create: (data) =>
    request('/events', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) =>
    request(`/events/${id}`, { method: 'DELETE' }),
};

// ── Wellness Info ─────────────────────────────────────────────────────────────
export const wellnessAPI = {
  get: () => request('/wellness-info'),
  upsert: (data) =>
    request('/wellness-info', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Event Reports ─────────────────────────────────────────────────────────────
export const eventReportsAPI = {
  getAll: () => request('/event-reports'),
  create: (data) =>
    request('/event-reports', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) =>
    request(`/event-reports/${id}`, { method: 'DELETE' }),
};

// ── Challenge ─────────────────────────────────────────────────────────────────
export const challengeAPI = {
  getActive: () => request('/challenge/active'),
  getAll: () => request('/challenge'),
  createOrUpdate: (data) =>
    request('/challenge', { method: 'POST', body: JSON.stringify(data) }),
  activateDay: (day) =>
    request('/challenge/activate', { method: 'PUT', body: JSON.stringify({ day }) }),
};

// ── Submissions ───────────────────────────────────────────────────────────────
export const submissionsAPI = {
  submit: (data) =>
    request('/submissions', { method: 'POST', body: JSON.stringify(data) }),
  getMy: () => request('/submissions/my'),
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return request(`/submissions?${params.toString()}`);
  },
};

// ── User Progress ─────────────────────────────────────────────────────────────
export const userAPI = {
  getProgress: () => request('/user/progress'),
};

// ── Journal ───────────────────────────────────────────────────────────────────
export const journalAPI = {
  create: (data) => request('/journal', { method: 'POST', body: JSON.stringify(data) }),
  getMy: () => request('/journal'),
  delete: (id) => request(`/journal/${id}`, { method: 'DELETE' }),
};

// ── Admin Analytics ───────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => request('/admin/stats'),
  getChallengeStats: () => request('/admin/challenge-stats'),
};
