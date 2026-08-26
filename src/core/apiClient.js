/**
 * NurseFlow Enterprise HIS 2026 — Canonical HTTP REST API Client
 * Standards: Joint Commission International (JCI), ISO/IEC 27001, RFC 7807 Problem Details
 * Automatically attaches Bearer token, enforces X-Correlation-ID & Idempotency-Key headers,
 * safely handles HTTP 204 Zero-Body, extracts canonical envelopes { data, meta }, and normalizes RFC 7807 errors.
 */

const BASE_URL = '';

/**
 * Generate a cryptographically robust Correlation ID for end-to-end tracing.
 */
export function generateCorrelationId() {
  const ts = Date.now();
  const rand = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `CORR-${ts}-${rand}`;
}

/**
 * Generate an authoritative Idempotency Key for mutating requests.
 */
export function generateIdempotencyKey() {
  const ts = Date.now();
  const rand = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `IDEMP-${ts}-${rand}`;
}

/**
 * Canonical HTTP Request Dispatcher
 */
export async function requestApi(endpoint, {
  method = 'GET',
  body = null,
  headers = {},
  correlationId = null,
  idempotencyKey = null
} = {}) {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('access_token') || sessionStorage.getItem('access_token'))
    : null;

  const reqCorrelationId = correlationId || headers['X-Correlation-ID'] || headers['x-correlation-id'] || generateCorrelationId();
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
  const reqIdempotencyKey = isMutation
    ? (idempotencyKey || headers['Idempotency-Key'] || headers['idempotency-key'] || generateIdempotencyKey())
    : null;

  const finalHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, application/problem+json',
    'X-Correlation-ID': reqCorrelationId,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(reqIdempotencyKey ? { 'Idempotency-Key': reqIdempotencyKey } : {}),
    ...headers
  };

  const config = {
    method,
    headers: finalHeaders,
    ...(body ? { body: JSON.stringify(body) } : {})
  };

  const baseUrl = typeof window !== 'undefined'
    ? (window.location?.origin || '')
    : (process.env.API_BASE_URL || 'http://127.0.0.1:3000');
  const targetUrl = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  try {
    const response = await fetch(targetUrl, config);
    const respCorrelationId = response.headers.get('x-correlation-id') || reqCorrelationId;
    const isReplay = response.headers.get('x-idempotent-replay') === 'true';
    const contentType = response.headers.get('content-type') || '';

    // 1. Session Expiry / Unauthorized Handling (RFC 7235)
    if (response.status === 401) {
      console.warn(`[API_CLIENT] 401 Unauthorized on ${endpoint} [${respCorrelationId}]`);

      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        localStorage.removeItem('access_token');
        sessionStorage.removeItem('access_token');
      }
    }

    // 2. Forbidden Handling (Zero-Trust RBAC)
    if (response.status === 403) {
      console.warn(`[API_CLIENT] 403 Forbidden on ${endpoint} [${respCorrelationId}]`);
    }

    // 3. HTTP 204 No Content Handling (Strict Zero-Body Discipline)
    if (response.status === 204) {
      return {
        ok: true,
        status: 204,
        data: null,
        meta: {
          correlationId: respCorrelationId
        },
        raw: null,
        correlationId: respCorrelationId,
        isReplay
      };
    }

    // 4. Parse JSON Response Body
    let responseBody = null;
    if (contentType.includes('json')) {
      try {
        responseBody = await response.json();
      } catch (jsonErr) {
        console.warn(`[API_CLIENT] Failed to parse JSON response on ${endpoint}:`, jsonErr.message);
        responseBody = null;
      }
    }

    // 5. Success Handling (Canonical Envelope { data, meta })
    if (response.ok) {
      const hasEnvelope = responseBody && typeof responseBody === 'object' && 'data' in responseBody;
      const extractedData = hasEnvelope ? responseBody.data : responseBody;
      const extractedMeta = (hasEnvelope && responseBody.meta)
        ? { ...responseBody.meta, correlationId: respCorrelationId }
        : { correlationId: respCorrelationId };

      return {
        ok: true,
        status: response.status,
        data: extractedData,
        meta: extractedMeta,
        raw: responseBody,
        correlationId: respCorrelationId,
        isReplay
      };
    }

    // 6. RFC 7807 Problem Details Error Normalization
    const problem = (responseBody && typeof responseBody === 'object') ? responseBody : {};
    const errorMessage = problem.detail || problem.title || `HTTP Error ${response.status}`;
    const errorCode = problem.code || `HTTP_${response.status}`;

    return {
      ok: false,
      status: response.status,
      error: errorMessage,
      code: errorCode,
      problem,
      correlationId: problem.correlationId || respCorrelationId,
      meta: { correlationId: problem.correlationId || respCorrelationId },
      raw: responseBody,
      isConcurrentConflict: response.status === 409,
      isFailClosed: response.status === 500 || response.status === 503,
      data: null
    };

  } catch (error) {
    // 7. Network / Outage / Fail-Closed Catch
    console.error(`[API_CLIENT_NETWORK_ERROR] ${method} ${endpoint} [${reqCorrelationId}]:`, error);
    return {
      ok: false,
      status: 0,
      error: error.message || 'Koneksi jaringan atau layanan backend database tidak tersedia (Fail-Closed).',
      code: 'NETWORK_ERROR',
      problem: {
        title: 'Network / Database Outage',
        detail: error.message,
        status: 0,
        correlationId: reqCorrelationId
      },
      correlationId: reqCorrelationId,
      meta: { correlationId: reqCorrelationId },
      isFailClosed: true,
      isNetworkError: true,
      isConcurrentConflict: false,
      data: null
    };
  }
}

/**
 * NurseFlow Master Domain API Client (24 Authoritative Domains)
 */
export const apiClient = {
  get: (endpoint, headers) => requestApi(endpoint, { method: 'GET', headers }),
  post: (endpoint, body, headers) => requestApi(endpoint, { method: 'POST', body, headers }),
  put: (endpoint, body, headers) => requestApi(endpoint, { method: 'PUT', body, headers }),
  patch: (endpoint, body, headers) => requestApi(endpoint, { method: 'PATCH', body, headers }),
  delete: (endpoint, headers) => requestApi(endpoint, { method: 'DELETE', headers }),

  // ─── 1. Authentication & Security ───
  auth: {
    login: (credentials) => apiClient.post('/api/v1/auth/login', credentials),
    logout: () => apiClient.post('/api/v1/auth/logout'),
    getMe: () => apiClient.get('/api/v1/auth/me')
  },

  // ─── 2. Master Patient Index (MPI) ───
  patients: {
    list: (params = '') => apiClient.get(`/api/v1/patients${params ? `?${params}` : ''}`),
    get: (id) => apiClient.get(`/api/v1/patients/${id}`),
    register: (payload) => apiClient.post('/api/v1/patients', payload),
    update: (id, payload) => apiClient.put(`/api/v1/patients/${id}`, payload)
  },

  // ─── 3. Episodes & Encounters ───
  encounters: {
    list: (params = '') => apiClient.get(`/api/v1/encounters${params ? `?${params}` : ''}`),
    get: (id) => apiClient.get(`/api/v1/encounters/${id}`),
    create: (payload) => apiClient.post('/api/v1/encounters', payload),
    update: (id, payload) => apiClient.put(`/api/v1/encounters/${id}`, payload)
  },

  // ─── 4. ADT & Bed Management ───
  beds: {
    list: (params = '') => apiClient.get(`/api/v1/beds${params ? `?${params}` : ''}`),
    get: (id) => apiClient.get(`/api/v1/beds/${id}`),
    admit: (payload) => apiClient.post('/api/v1/beds/admit', payload),
    transfer: (payload) => apiClient.post('/api/v1/beds/transfer', payload),
    discharge: (payload) => apiClient.post('/api/v1/beds/discharge', payload)
  },

  // ─── 5. Emergency & Triage ───
  triage: {
    list: (params = '') => apiClient.get(`/api/v1/triage${params ? `?${params}` : ''}`),
    submit: (payload) => apiClient.post('/api/v1/triage', payload)
  },

  // ─── 6. Clinical Notes (SOAP & CPPT) ───
  clinicalNotes: {
    getSoap: (encounterId) => apiClient.get(`/api/v1/clinical-notes/soap/${encounterId}`),
    saveSoap: (payload) => apiClient.post('/api/v1/clinical-notes/soap', payload),
    listCppt: (encounterId) => apiClient.get(`/api/v1/clinical-notes/cppt/${encounterId}`),
    createCppt: (payload) => apiClient.post('/api/v1/clinical-notes/cppt', payload),
    verifyCppt: (id, payload) => apiClient.post(`/api/v1/clinical-notes/cppt/${id}/verify`, payload)
  },

  // ─── 7. Universal CPOE Orders ───
  cpoe: {
    getOrders: (params = '') => apiClient.get(`/api/v1/orders/cpoe${params ? `?${params}` : ''}`),
    getOrderById: (id) => apiClient.get(`/api/v1/orders/cpoe/${id}`),
    getOrdersByEncounter: (encounterId) => apiClient.get(`/api/v1/orders/cpoe/encounter/${encounterId}`),
    createOrder: (payload) => apiClient.post('/api/v1/orders/cpoe', payload),
    cancelOrder: (id, payload) => apiClient.post(`/api/v1/orders/cpoe/${id}/cancel`, payload)
  },
  orders: {
    list: (params = '') => apiClient.get(`/api/v1/orders/cpoe${params ? `?${params}` : ''}`),
    create: (payload) => apiClient.post('/api/v1/orders/cpoe', payload),
    cancel: (id, payload) => apiClient.post(`/api/v1/orders/cpoe/${id}/cancel`, payload)
  },

  // ─── 8. Pharmacy & Closed-Loop Medications ───
  medications: {
    getOrders: (params = '') => apiClient.get(`/api/v1/medications/orders${params ? `?${params}` : ''}`),
    dispense: (payload) => apiClient.post('/api/v1/medications/dispense', payload),
    administer: (payload) => apiClient.post('/api/v1/medications/administer', payload)
  },

  // ─── 9. Laboratory (LIS) ───
  laboratory: {
    getOrders: (params = '') => apiClient.get(`/api/v1/laboratory/orders${params ? `?${params}` : ''}`),
    createOrder: (payload) => apiClient.post('/api/v1/laboratory/orders', payload),
    releaseResult: (payload) => apiClient.post('/api/v1/laboratory/results/release', payload)
  },

  // ─── 10. Radiology & PACS (RIS) ───
  radiology: {
    getOrders: (params = '') => apiClient.get(`/api/v1/radiology/orders${params ? `?${params}` : ''}`),
    createOrder: (payload) => apiClient.post('/api/v1/radiology/orders', payload),
    releaseReport: (payload) => apiClient.post('/api/v1/radiology/reports/release', payload)
  },

  // ─── 11. Patient Billing & Invoicing ───
  billing: {
    getInvoices: (params = '') => apiClient.get(`/api/v1/billing/invoices${params ? `?${params}` : ''}`),
    createInvoice: (payload) => apiClient.post('/api/v1/billing/invoices', payload),
    recordPayment: (payload) => apiClient.post('/api/v1/billing/payments', payload)
  },

  // ─── 12. Patient Deposits & Ledgers ───
  patientFinancial: {
    getDeposits: (params = '') => apiClient.get(`/api/v1/patient-financial/deposits${params ? `?${params}` : ''}`),
    createDeposit: (payload) => apiClient.post('/api/v1/patient-financial/deposits', payload),
    debitDeposit: (payload) => apiClient.post('/api/v1/patient-financial/deposits/debit', payload),
    generateSplitInvoice: (payload) => apiClient.post('/api/v1/patient-financial/invoices', payload),
    recordPayment: (payload) => apiClient.post('/api/v1/patient-financial/payments', payload)
  },


  // ─── 13. Blood Bank (BDRS / ISBT-128) ───
  bloodBank: {
    getUnits: (headers) => apiClient.get('/api/v1/blood-bank/units', headers),
    intakeUnit: (payload, headers) => apiClient.post('/api/v1/blood-bank/units', payload, headers),
    crossmatch: (payload, headers) => apiClient.post('/api/v1/blood-bank/crossmatch', payload, headers),
    verifyTransfusion: (payload, headers) => apiClient.post('/api/v1/blood-bank/transfusion/verify', payload, headers)
  },

  // ─── 14. Staff Credentialing & Privileges ───
  staffPrivileges: {
    getStaff: (headers) => apiClient.get('/api/v1/staff-privileges/staff', headers),
    createStaff: (payload, headers) => apiClient.post('/api/v1/staff-privileges/staff', payload, headers),
    addCredential: (payload, headers) => apiClient.post('/api/v1/staff-privileges/credentials', payload, headers),
    grantPrivilege: (payload, headers) => apiClient.post('/api/v1/staff-privileges/privileges', payload, headers),
    verify: (payload, headers) => apiClient.post('/api/v1/staff-privileges/verify', payload, headers)
  },


  // ─── 15. Spatial Master Data Hub ───
  masterData: {
    list: (entityType, params = '') => apiClient.get(`/api/v1/master-data/${entityType}${params ? `?${params}` : ''}`),
    get: (entityType, id) => apiClient.get(`/api/v1/master-data/${entityType}/${id}`),
    create: (entityType, payload) => apiClient.post(`/api/v1/master-data/${entityType}`, payload),
    update: (entityType, id, payload) => apiClient.put(`/api/v1/master-data/${entityType}/${id}`, payload)
  },

  // ─── 16. Outpatient Scheduling & Appointments ───
  appointments: {
    list: (params = '') => apiClient.get(`/api/v1/appointments${params ? `?${params}` : ''}`),
    book: (payload) => apiClient.post('/api/v1/appointments/book', payload),
    checkIn: (payload) => apiClient.post('/api/v1/appointments/check-in', payload),
    cancel: (payload) => apiClient.post('/api/v1/appointments/cancel', payload)
  },

  // ─── 17. Pharmacy Warehouse & FEFO Inventory ───
  inventory: {
    getStock: (warehouseId = '7a419b4c-2f35-4c27-b63f-cd549201d400') => apiClient.get(`/api/v1/inventory/stock?warehouseId=${warehouseId}`),
    receive: (payload) => apiClient.post('/api/v1/inventory/receive', payload),
    transfer: (payload) => apiClient.post('/api/v1/inventory/transfer', payload),
    getMovements: () => apiClient.get('/api/v1/inventory/movements')
  },

  // ─── 18. SATUSEHAT FHIR Interoperability ───
  satusehat: {
    getLogs: () => apiClient.get('/api/v1/satusehat/logs'),
    getToken: () => apiClient.get('/api/v1/satusehat/token'),
    validate: (payload) => apiClient.post('/api/v1/satusehat/validate', payload),
    transmit: (payload) => apiClient.post('/api/v1/satusehat/transmit', payload)
  },

  // ─── 19. Hospital Executive Command Center ───
  commandCenter: {
    getCapacity: () => apiClient.get('/api/v1/command-center/capacity'),
    getEmergency: () => apiClient.get('/api/v1/command-center/emergency'),
    getFinancial: () => apiClient.get('/api/v1/command-center/financial'),
    getSafety: () => apiClient.get('/api/v1/command-center/safety'),
    getAlerts: () => apiClient.get('/api/v1/command-center/alerts')
  },

  // ─── 20. Perioperative & Operating Theatre ───
  perioperative: {
    listCases: (params = '') => apiClient.get(`/api/v1/perioperative/cases${params ? `?${params}` : ''}`),
    createCase: (payload) => apiClient.post('/api/v1/perioperative/cases', payload),
    recordChecklist: (payload) => apiClient.post('/api/v1/perioperative/checklist', payload)
  },

  // ─── 21. Casemix, ICD Coding & INA-CBG ───
  casemix: {
    getCoding: (encounterId) => apiClient.get(`/api/v1/casemix/coding/${encounterId}`),
    saveCoding: (payload) => apiClient.post('/api/v1/casemix/coding', payload),
    groupInaCbg: (payload) => apiClient.post('/api/v1/casemix/grouping', payload)
  }
};

export default apiClient;
