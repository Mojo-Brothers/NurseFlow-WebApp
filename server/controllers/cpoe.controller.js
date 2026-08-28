/**
 * NurseFlow Enterprise HIS 2026 — Master Universal CPOE Controller (Canonical Reference)
 * Domain: Canonical Clinical Ordering Backbone
 * Standards: Canonical Response Helpers (respond.*), RFC 7807 Global Error Handling, X-Correlation-ID
 */

import { cpoeApplicationService } from '../services/cpoeApplication.service.js';
import { respond } from '../utils/apiResponse.js';

export const cpoeController = {
  /**
   * Create Universal CPOE Order
   * POST /api/v1/orders/cpoe
   */
  createOrder: async (req, res, next) => {
    try {
      const requestId = req.headers?.['x-request-id'] || req.requestId || `REQ-${Date.now()}`;
      const actor = req.user || {
        userId: 'USR-DOC-001',
        username: 'dr_siti',
        role: 'ROLE_DOCTOR_DPJP'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
      const correlationId = req.correlationId || req.headers?.['x-correlation-id'] || `CORR-${Date.now()}`;
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
      if (typeof next === 'function') {
        next(err);
      } else {
        return res.status(err.statusCode || 500).json({
          success: false,
          error: err.code || 'INTERNAL_ERROR',
          message: err.message,
          meta: { message: err.message }
        });
      }
    }
  },


  /**
   * Cancel CPOE Order
   * POST /api/v1/orders/cpoe/:id/cancel
   */
  cancelOrder: async (req, res, next) => {
    try {
      const requestId = req.headers?.['x-request-id'] || req.requestId || `REQ-${Date.now()}`;
      const actor = req.user || {
        userId: 'USR-DOC-001',
        username: 'dr_siti',
        role: 'ROLE_DOCTOR_DPJP'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
      const correlationId = req.correlationId || req.headers?.['x-correlation-id'] || `CORR-${Date.now()}`;

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
      if (typeof next === 'function') {
        next(err);
      } else {
        return res.status(err.statusCode || 500).json({
          success: false,
          error: err.code || 'INTERNAL_ERROR',
          message: err.message,
          meta: { message: err.message }
        });
      }
    }
  },


  /**
   * Get CPOE Order by ID
   * GET /api/v1/orders/cpoe/:id
   */
  getOrderById: async (req, res, next) => {
    try {
      const requestId = req.headers?.['x-request-id'] || req.requestId || `REQ-${Date.now()}`;
      const order = await cpoeApplicationService.getOrderById(req.params.id);
      return respond.ok(res, {
        data: order,
        meta: { requestId },
        correlationId: req.correlationId
      });
    } catch (err) {
      if (typeof next === 'function') {
        next(err);
      } else {
        return res.status(err.statusCode || 500).json({
          success: false,
          error: err.code || 'INTERNAL_ERROR',
          message: err.message,
          meta: { message: err.message }
        });
      }
    }
  },


  /**
   * Get CPOE Orders by Encounter ID
   * GET /api/v1/orders/cpoe/encounter/:encounterId
   */
  getOrdersByEncounter: async (req, res, next) => {
    try {
      const requestId = req.headers?.['x-request-id'] || req.requestId || `REQ-${Date.now()}`;
      const orders = await cpoeApplicationService.getOrdersByEncounterId(req.params.encounterId);
      return respond.collection(res, {
        data: orders,
        page: 1,
        pageSize: orders.length || 20,
        total: orders.length,
        meta: {
          encounterId: req.params.encounterId,
          requestId
        },
        correlationId: req.correlationId
      });
    } catch (err) {
      if (typeof next === 'function') {
        next(err);
      } else {
        return res.status(err.statusCode || 500).json({
          success: false,
          error: err.code || 'INTERNAL_ERROR',
          message: err.message,
          meta: { message: err.message }
        });
      }
    }
  },


  /**
   * List all CPOE Orders with filters
   * GET /api/v1/orders/cpoe
   */
  listOrders: async (req, res, next) => {
    try {
      const requestId = req.headers?.['x-request-id'] || req.requestId || `REQ-${Date.now()}`;
      const filters = {
        encounterId: req.query.encounterId,
        patientId: req.query.patientId,
        status: req.query.status,
        orderCategory: req.query.orderCategory
      };
      const orders = await cpoeApplicationService.listOrders(filters);
      return respond.collection(res, {
        data: orders,
        page: 1,
        pageSize: orders.length || 20,
        total: orders.length,
        meta: {
          filters,
          requestId
        },
        correlationId: req.correlationId
      });
    } catch (err) {
      next(err);
    }
  }
};


