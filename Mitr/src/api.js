/**
 * COEP मित्र — Centralised API Client
 * All backend calls route through here. Token is auto-attached.
 */

// Construct Base URL: import.meta.env.VITE_API_URL + "/api"
// Default to localhost:5001 if env var is missing
const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const BASE_URL = `${API_HOST.endsWith('/') ? API_HOST.slice(0, -1) : API_HOST}/api`;

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

  // Ensure BASE_URL and endpoint joining is clean
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${BASE_URL}${cleanEndpoint}`;

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
  register: (id) => request(`/events/${id}/register`, { method: 'POST' }),
  cancelRegistration: (id) => request(`/events/${id}/register`, { method: 'DELETE' }),
  getRegistrations: (id) => request(`/events/${id}/registrations`),
  getMyRegistrations: () => request('/events/my-registrations'),
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
  getAll: () => request('/challenge'),
  getById: (id) => request(`/challenge/${id}`),
  create: (data) => request('/challenge', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/challenge/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/challenge/${id}`, { method: 'DELETE' }),
  getParticipants: (id) => request(`/challenge/${id}/participants`),
  join: (id) => request(`/challenge/${id}/join`, { method: 'POST' }),
  completeDay: (id, dayNumber) => request(`/challenge/${id}/day/${dayNumber}/complete`, { method: 'POST' }),
  submitFeedback: (id, dayNumber, data) => request(`/challenge/${id}/day/${dayNumber}/feedback`, { method: 'POST', body: JSON.stringify(data) }),
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
  adminGetAll: () => request('/journal/all'),
};

// ── Admin Analytics ───────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => request('/admin/stats'),
  getChallengeStats: () => request('/admin/challenge-stats'),
};

// ── Appointments ──────────────────────────────────────────────────────────────
export const appointmentAPI = {
  getCounselor: () => request('/appointments/counselor'),
  getAvailability: (year, month) => request(`/appointments/availability?year=${year}&month=${month}`),
  getDateSlots: (date) => request(`/appointments/availability/date?date=${date}`),
  book: (data) => request('/appointments/book', { method: 'POST', body: JSON.stringify(data) }),
  getMyAppointments: () => request('/appointments/my'),
  cancelAppointment: (id) => request(`/appointments/cancel/${id}`, { method: 'PATCH' }),
  // Admin
  adminUpdateCounselor: (data) => request('/appointments/admin/counselor', { method: 'PATCH', body: JSON.stringify(data) }),
  adminGetAll: (params = {}) => {
    const query = new URLSearchParams(params);
    return request(`/appointments/admin/all?${query}`);
  },
  adminGetStats: () => request('/appointments/admin/stats'),
  adminGetToday: () => request('/appointments/admin/today'),
  adminSetAvailability: (data) => request('/appointments/admin/availability', { method: 'POST', body: JSON.stringify(data) }),
  adminRemoveSlot: (data) => request('/appointments/admin/availability', { method: 'DELETE', body: JSON.stringify(data) }),
  adminToggleDay: (data) => request('/appointments/admin/toggle-day', { method: 'PATCH', body: JSON.stringify(data) }),
  adminUpdateStatus: (id, status) => request(`/appointments/admin/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  adminCancelAppointment: (id, reason) => request(`/appointments/admin/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
};

export const teamAPI = {
  getPublic: () => request('/team'),
  adminGetAll: () => request('/team/admin'),
  create: (data) => request('/team', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/team/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  reorder: (order) => request('/team/reorder', { method: 'PATCH', body: JSON.stringify({ order }) }),
  delete: (id) => request(`/team/${id}`, { method: 'DELETE' }),
};

export const pastEventsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params);
    const qs = query.toString();
    return request(`/past-events${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => request(`/past-events/${id}`),
  adminGetAll: () => request('/past-events/admin/all'),
  create: (data) => request('/past-events', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/past-events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/past-events/${id}`, { method: 'DELETE' }),
};

export const platformContentAPI = {
  getPublished: () => request('/platform-content'),
  adminGet: () => request('/platform-content/admin'),
  saveDraft: (data) => request('/platform-content/draft', { method: 'POST', body: JSON.stringify(data) }),
  publish: (data) => request('/platform-content/publish', { method: 'POST', body: JSON.stringify(data) }),
  revert: () => request('/platform-content/revert', { method: 'POST' }),
};
