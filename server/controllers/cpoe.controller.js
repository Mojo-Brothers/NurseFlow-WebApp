/**
 * NurseFlow Enterprise HIS 2026 — Master Universal CPOE Controller (Canonical Reference)
 * Domain: Canonical Clinical Ordering Backbone
 * Standards: Canonical Response Helpers (respond.*), RFC 7807 Global Error Handling, X-Correlation-ID
 * P0-2B Wave 1B.3 C1-A: L1 Fail-Closed Tenant Gate & Authenticated Actor Provenance
 */

import { cpoeApplicationService, CpoeDomainError } from '../services/cpoeApplication.service.js';
import { respond } from '../utils/apiResponse.js';
import { isValidUuid } from '../db/unitOfWork.js';

export const cpoeController = {
  /**
   * Create Universal CPOE Order
   * POST /api/v1/orders/cpoe
   */
  createOrder: async (req, res, next) => {
    const requestId = req.headers?.['x-request-id'] || req.requestId || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers?.['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const resolvedTenantId = req.tenantId || req.user?.tenantId;
      if (!resolvedTenantId || !isValidUuid(resolvedTenantId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'TENANT_CONTEXT_REQUIRED',
            message: 'Konteks tenant valid (UUID) wajib disertakan dalam request.'
          },
          meta: { requestId, correlationId, timestamp }
        });
      }

      if (!req.user || (!req.user.userId && !req.user.id)) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Autentikasi diperlukan. Identitas aktor tidak ditemukan.'
          },
          meta: { requestId, correlationId, timestamp }
        });
      }

      const actor = {
        userId: req.user.userId || req.user.id,
        username: req.user.username || req.user.fullName || '',
        role: req.user.role || (Array.isArray(req.user.roles) ? req.user.roles[0] : 'UNAUTHENTICATED'),
        authorizedRoles: req.user.authorizedRoles || (req.user.role ? [req.user.role] : []),
        fullName: req.user.fullName || req.user.username || '',
        tenantId: resolvedTenantId
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
      const idempotencyKey = req.idempotencyKey || req.headers?.['idempotency-key'] || req.headers?.['Idempotency-Key'] || req.body?.idempotencyKey;

      const result = await cpoeApplicationService.createOrder(
        { ...req.body, idempotencyKey },
        actor,
        clientIp,
        correlationId
      );

      if (result.isIdempotentReplay && typeof res.setHeader === 'function') {
        res.setHeader('X-Idempotent-Replay', 'true');
      }

      return respond.created(res, {
        data: result,
        meta: {
          message: result.isIdempotentReplay
            ? 'Order CPOE telah terdaftar sebelumnya (Idempotent Replay)'
            : 'Order CPOE berhasil diterbitkan dan disimpan durable di PostgreSQL',
          orderId: result.id,
          orderNumber: result.order_number,
          auditSignature: result.auditSignature,
          outboxEventId: result.outboxEventId,
          requestId
        },
        correlationId
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof CpoeDomainError ? 400 : 500);
      const code = err.code || 'INTERNAL_ERROR';

      return res.status(statusCode).json({
        success: false,
        error: {
          code,
          message: err.message,
          details: err.details || []
        },
        meta: { message: err.message, requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Cancel CPOE Order
   * POST /api/v1/orders/cpoe/:id/cancel
   */
  cancelOrder: async (req, res, next) => {
    const requestId = req.headers?.['x-request-id'] || req.requestId || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers?.['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const resolvedTenantId = req.tenantId || req.user?.tenantId;
      if (!resolvedTenantId || !isValidUuid(resolvedTenantId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'TENANT_CONTEXT_REQUIRED',
            message: 'Konteks tenant valid (UUID) wajib disertakan dalam request.'
          },
          meta: { requestId, correlationId, timestamp }
        });
      }

      if (!req.user || (!req.user.userId && !req.user.id)) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Autentikasi diperlukan. Identitas aktor tidak ditemukan.'
          },
          meta: { requestId, correlationId, timestamp }
        });
      }

      const actor = {
        userId: req.user.userId || req.user.id,
        username: req.user.username || req.user.fullName || '',
        role: req.user.role || (Array.isArray(req.user.roles) ? req.user.roles[0] : 'UNAUTHENTICATED'),
        authorizedRoles: req.user.authorizedRoles || (req.user.role ? [req.user.role] : []),
        fullName: req.user.fullName || req.user.username || '',
        tenantId: resolvedTenantId
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await cpoeApplicationService.cancelOrder(
        {
          orderId: req.params.id,
          cancellationReason: req.body?.cancellationReason || req.body?.reason,
          expectedVersion: req.body?.expectedVersion || req.body?.version,
          safetyDecision: req.body?.safetyDecision
        },
        actor,
        clientIp,
        correlationId
      );

      return respond.ok(res, {
        data: result,
        meta: {
          message: 'Order CPOE berhasil dibatalkan dengan alasan medicolegal tercatat',
          orderId: result.id,
          requestId
        },
        correlationId
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof CpoeDomainError ? 400 : 500);
      const code = err.code || 'INTERNAL_ERROR';

      return res.status(statusCode).json({
        success: false,
        error: {
          code,
          message: err.message,
          details: err.details || []
        },
        meta: { message: err.message, requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Get CPOE Order by ID
   * GET /api/v1/orders/cpoe/:id
   */
  getOrderById: async (req, res, next) => {
    const requestId = req.headers?.['x-request-id'] || req.requestId || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers?.['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const resolvedTenantId = req.tenantId || req.user?.tenantId;
      if (!resolvedTenantId || !isValidUuid(resolvedTenantId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'TENANT_CONTEXT_REQUIRED',
            message: 'Konteks tenant valid (UUID) wajib disertakan dalam request.'
          },
          meta: { requestId, correlationId, timestamp }
        });
      }

      const tenantContext = { tenantId: resolvedTenantId };
      const order = await cpoeApplicationService.getOrderById(req.params.id, tenantContext);
      return respond.ok(res, {
        data: order,
        meta: { requestId },
        correlationId
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof CpoeDomainError ? 400 : 500);
      const code = err.code || 'INTERNAL_ERROR';

      return res.status(statusCode).json({
        success: false,
        error: {
          code,
          message: err.message,
          details: err.details || []
        },
        meta: { message: err.message, requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Get CPOE Orders by Encounter ID
   * GET /api/v1/orders/cpoe/encounter/:encounterId
   */
  getOrdersByEncounter: async (req, res, next) => {
    const requestId = req.headers?.['x-request-id'] || req.requestId || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers?.['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const resolvedTenantId = req.tenantId || req.user?.tenantId;
      if (!resolvedTenantId || !isValidUuid(resolvedTenantId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'TENANT_CONTEXT_REQUIRED',
            message: 'Konteks tenant valid (UUID) wajib disertakan dalam request.'
          },
          meta: { requestId, correlationId, timestamp }
        });
      }

      const tenantContext = { tenantId: resolvedTenantId };
      const orders = await cpoeApplicationService.getOrdersByEncounterId(req.params.encounterId, tenantContext);
      return respond.collection(res, {
        data: orders,
        page: 1,
        pageSize: orders.length || 20,
        total: orders.length,
        meta: {
          encounterId: req.params.encounterId,
          requestId
        },
        correlationId
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof CpoeDomainError ? 400 : 500);
      const code = err.code || 'INTERNAL_ERROR';

      return res.status(statusCode).json({
        success: false,
        error: {
          code,
          message: err.message,
          details: err.details || []
        },
        meta: { message: err.message, requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * List all CPOE Orders with filters
   * GET /api/v1/orders/cpoe
   * GET /api/v1/orders (Compatibility route CS 71)
   */
  listOrders: async (req, res, next) => {
    const requestId = req.headers?.['x-request-id'] || req.requestId || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers?.['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const resolvedTenantId = req.tenantId || req.user?.tenantId;
      if (!resolvedTenantId || !isValidUuid(resolvedTenantId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'TENANT_CONTEXT_REQUIRED',
            message: 'Konteks tenant valid (UUID) wajib disertakan dalam request.'
          },
          meta: { requestId, correlationId, timestamp }
        });
      }

      const filters = {
        encounterId: req.query?.encounterId,
        patientId: req.query?.patientId,
        status: req.query?.status,
        orderCategory: req.query?.orderCategory
      };
      const tenantContext = { tenantId: resolvedTenantId };
      const orders = await cpoeApplicationService.listOrders(filters, tenantContext);
      return respond.collection(res, {
        data: orders,
        page: 1,
        pageSize: orders.length || 20,
        total: orders.length,
        meta: {
          filters,
          requestId
        },
        correlationId
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof CpoeDomainError ? 400 : 500);
      const code = err.code || 'INTERNAL_ERROR';

      return res.status(statusCode).json({
        success: false,
        error: {
          code,
          message: err.message,
          details: err.details || []
        },
        meta: { message: err.message, requestId, correlationId, timestamp }
      });
    }
  }
};
