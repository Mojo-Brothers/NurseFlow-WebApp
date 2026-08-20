/**
 * NurseFlow Enterprise HIS 2026 — Centralized Production HTTP Client
 * Standards: RFC 7230, RFC 7807 (Problem Details), Canonical Envelope ({ data, meta } / { error, meta })
 * Injects: Bearer Token, X-Correlation-ID, X-Request-ID, X-Tenant-ID
 */

import { enterpriseAuthService } from '../security/enterpriseAuth.service.js';

export class ApiError extends Error {
  constructor({ message, statusCode, code, details, meta, rawResponse }) {
    super(message || 'Terjadi kesalahan pada layanan API backend');
    this.name = 'ApiError';
    this.statusCode = statusCode || 500;
    this.code = code || 'INTERNAL_SERVER_ERROR';
    this.details = details || [];
    this.meta = meta || {};
    this.rawResponse = rawResponse;
  }
}

const getBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    // When running in browser with Vite proxy or Express backend
    return '/api/v1';
  }
  // Fallback for Node.js / tests / scripts
  return process.env.API_BASE_URL || 'http://localhost:5000/api/v1';
};

export const httpClient = {
  /**
   * Execute Standardized HTTP Request
   */
  request: async (path, options = {}) => {
    const baseUrl = options.baseUrl || getBaseUrl();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${baseUrl}${cleanPath}`;

    // 1. Resolve Session & Authentication
    let token = options.token;
    let tenantId = options.tenantId;
    if (!token && typeof enterpriseAuthService !== 'undefined') {
      const session = enterpriseAuthService.getCurrentSession();
      if (session) {
        token = session.token;
        tenantId = tenantId || session.branchId || 'BRN-JKT-PST';
      }
    }

    // 2. Prepare Correlation & Request Headers
    const requestId = options.requestId || `REQ-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const correlationId = options.correlationId || (typeof window !== 'undefined' && window.__CORRELATION_ID__) || `CORR-${Date.now()}`;

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Request-ID': requestId,
      'X-Correlation-ID': correlationId,
      ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const fetchConfig = {
      method: options.method || 'GET',
      headers,
      ...(options.body ? { body: typeof options.body === 'string' ? options.body : JSON.stringify(options.body) } : {})
    };

    try {
      const res = await (options.fetchImpl || fetch)(url, fetchConfig);
      
      const contentType = res.headers.get('content-type') || '';
      let json = null;
      if (contentType.includes('application/json')) {
        json = await res.json();
      } else {
        const text = await res.text();
        json = { data: text };
      }

      if (!res.ok) {
        const errObj = json?.error || {};
        throw new ApiError({
          message: errObj.message || json?.message || `HTTP ${res.status} ${res.statusText}`,
          statusCode: res.status,
          code: errObj.code || json?.code || `HTTP_${res.status}`,
          details: errObj.details || json?.details || [],
          meta: json?.meta || { requestId, correlationId, timestamp: new Date().toISOString() },
          rawResponse: json
        });
      }

      // Canonical Envelope unwrapping: returns { data, meta, success: true }
      return {
        success: true,
        data: json.data !== undefined ? json.data : json,
        meta: json.meta || {
          requestId,
          correlationId,
          timestamp: new Date().toISOString()
        }
      };
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError({
        message: `Koneksi ke backend gagal: ${err.message}`,
        statusCode: 0,
        code: 'NETWORK_ERROR',
        details: [err.message],
        meta: { requestId, correlationId, timestamp: new Date().toISOString() }
      });
    }
  },

  get: (path, options = {}) => httpClient.request(path, { ...options, method: 'GET' }),
  post: (path, body, options = {}) => httpClient.request(path, { ...options, method: 'POST', body }),
  put: (path, body, options = {}) => httpClient.request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options = {}) => httpClient.request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options = {}) => httpClient.request(path, { ...options, method: 'DELETE' })
};
