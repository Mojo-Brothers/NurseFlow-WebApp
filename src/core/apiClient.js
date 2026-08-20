/**
 * NurseFlow Enterprise HIS 2026 — Canonical HTTP REST API Client
 * Standards: NIST SP 800-162 / Zero-Trust JWT Transport / JCI MOI
 * Automatically attaches Bearer token, enforces session headers, and handles 401/403 errors.
 */

const BASE_URL = '';

export async function requestApi(endpoint, { method = 'GET', body = null, headers = {} } = {}) {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

  const finalHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...headers
  };

  const config = {
    method,
    headers: finalHeaders,
    ...(body ? { body: JSON.stringify(body) } : {})
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    // 1. Session Expiry / Unauthorized Handling
    if (response.status === 401) {
      console.warn(`[API_CLIENT] 401 Unauthorized on ${endpoint}`);
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        // Clear stale session
        localStorage.removeItem('access_token');
        sessionStorage.removeItem('access_token');
      }
    }

    // 2. Forbidden Handling
    if (response.status === 403) {
      console.warn(`[API_CLIENT] 403 Forbidden on ${endpoint}`);
    }

    const data = await response.json().catch(() => ({}));
    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    console.error(`[API_CLIENT_NETWORK_ERROR] ${method} ${endpoint}:`, error);
    return {
      ok: false,
      status: 0,
      error: error.message,
      data: null
    };
  }
}

export const apiClient = {
  get: (endpoint, headers) => requestApi(endpoint, { method: 'GET', headers }),
  post: (endpoint, body, headers) => requestApi(endpoint, { method: 'POST', body, headers }),
  put: (endpoint, body, headers) => requestApi(endpoint, { method: 'PUT', body, headers }),
  delete: (endpoint, headers) => requestApi(endpoint, { method: 'DELETE', headers }),

  // ─── Domain Specific Endpoints ───
  bloodBank: {
    getUnits: () => apiClient.get('/api/v1/blood-bank/units'),
    intakeUnit: (payload) => apiClient.post('/api/v1/blood-bank/units', payload),
    crossmatch: (payload) => apiClient.post('/api/v1/blood-bank/crossmatch', payload),
    verifyTransfusion: (payload) => apiClient.post('/api/v1/blood-bank/transfusion/verify', payload)
  },
  staffPrivileges: {
    getStaff: () => apiClient.get('/api/v1/staff-privileges/staff'),
    createStaff: (payload) => apiClient.post('/api/v1/staff-privileges/staff', payload),
    addCredential: (payload) => apiClient.post('/api/v1/staff-privileges/credentials', payload),
    grantPrivilege: (payload) => apiClient.post('/api/v1/staff-privileges/privileges', payload),
    verify: (payload) => apiClient.post('/api/v1/staff-privileges/verify', payload)
  },
  masterData: {
    list: (entityType, params = '') => apiClient.get(`/api/v1/master-data/${entityType}${params ? `?${params}` : ''}`),
    get: (entityType, id) => apiClient.get(`/api/v1/master-data/${entityType}/${id}`),
    create: (entityType, payload) => apiClient.post(`/api/v1/master-data/${entityType}`, payload),
    update: (entityType, id, payload) => apiClient.put(`/api/v1/master-data/${entityType}/${id}`, payload)
  },
  appointments: {
    list: () => apiClient.get('/api/v1/appointments'),
    book: (payload) => apiClient.post('/api/v1/appointments/book', payload),
    checkIn: (payload) => apiClient.post('/api/v1/appointments/check-in', payload),
    cancel: (payload) => apiClient.post('/api/v1/appointments/cancel', payload)
  },
  inventory: {
    getStock: (warehouseId = 'WH-MAIN-PHARMACY') => apiClient.get(`/api/v1/inventory/stock?warehouseId=${warehouseId}`),
    receive: (payload) => apiClient.post('/api/v1/inventory/receive', payload),
    transfer: (payload) => apiClient.post('/api/v1/inventory/transfer', payload),
    getMovements: () => apiClient.get('/api/v1/inventory/movements')
  },
  satusehat: {
    getLogs: () => apiClient.get('/api/v1/satusehat/logs'),
    getToken: () => apiClient.get('/api/v1/satusehat/token'),
    validate: (payload) => apiClient.post('/api/v1/satusehat/validate', payload),
    transmit: (payload) => apiClient.post('/api/v1/satusehat/transmit', payload)
  },
  commandCenter: {
    getCapacity: () => apiClient.get('/api/v1/command-center/capacity'),
    getEmergency: () => apiClient.get('/api/v1/command-center/emergency'),
    getFinancial: () => apiClient.get('/api/v1/command-center/financial'),
    getSafety: () => apiClient.get('/api/v1/command-center/safety'),
    getAlerts: () => apiClient.get('/api/v1/command-center/alerts')
  }
};
