/**
 * NurseFlow Enterprise HIS 2026 — Master Universal CPOE Controller
 * Domain: Canonical Clinical Ordering Backbone
 * Standards: Canonical JSON Response Envelope ({ data, meta } / { error, meta })
 */

import { cpoeApplicationService, CpoeDomainError } from '../services/cpoeApplication.service.js';

export const cpoeController = {
  /**
   * Create Universal CPOE Order
   * POST /api/v1/orders/cpoe
   */
  createOrder: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'USR-DOC-001',
        username: 'dr_siti',
        role: 'ROLE_DOCTOR_DPJP'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await cpoeApplicationService.createOrder(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: result.isIdempotentReplay
            ? 'Order CPOE telah terdaftar sebelumnya (Idempotent Replay)'
            : 'Order CPOE berhasil diterbitkan dan disimpan durable di PostgreSQL',
          orderId: result.id,
          orderNumber: result.order_number,
          auditSignature: result.auditSignature,
          outboxEventId: result.outboxEventId,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof CpoeDomainError ? 400 : 500);
      const code = err.code || 'CPOE_ORDER_FAILED';

      return res.status(statusCode).json({
        success: false,
        error: {
          code,
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Cancel CPOE Order
   * POST /api/v1/orders/cpoe/:id/cancel
   */
  cancelOrder: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'USR-DOC-001',
        username: 'dr_siti',
        role: 'ROLE_DOCTOR_DPJP'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await cpoeApplicationService.cancelOrder(
        {
          orderId: req.params.id,
          cancellationReason: req.body.cancellationReason || req.body.reason,
          expectedVersion: req.body.expectedVersion || req.body.version
        },
        actor,
        clientIp,
        correlationId
      );

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          message: 'Order CPOE berhasil dibatalkan dengan alasan medicolegal tercatat',
          orderId: result.id,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof CpoeDomainError ? 400 : 500);
      const code = err.code || 'CPOE_CANCEL_FAILED';

      return res.status(statusCode).json({
        success: false,
        error: {
          code,
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Get CPOE Order by ID
   * GET /api/v1/orders/cpoe/:id
   */
  getOrderById: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const order = await cpoeApplicationService.getOrderById(req.params.id);
      return res.status(200).json({
        success: true,
        data: order,
        meta: { requestId, correlationId, timestamp }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof CpoeDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'GET_CPOE_ORDER_FAILED',
          message: err.message
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Get CPOE Orders by Encounter ID
   * GET /api/v1/orders/cpoe/encounter/:encounterId
   */
  getOrdersByEncounter: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const orders = await cpoeApplicationService.getOrdersByEncounterId(req.params.encounterId);
      return res.status(200).json({
        success: true,
        count: orders.length,
        data: orders,
        meta: {
          encounterId: req.params.encounterId,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof CpoeDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'GET_ENCOUNTER_ORDERS_FAILED',
          message: err.message
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  }
};
