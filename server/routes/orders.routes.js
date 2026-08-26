/**
 * NurseFlow Enterprise HIS 2026 — Universal Clinical Orders & CPOE Routes
 * Standards: Native PostgreSQL 16 Durability, Idempotency Guard, RBAC/ABAC Security
 */

import { Router } from 'express';
import { cpoeController } from '../controllers/cpoe.controller.js';
import { ordersApiService } from '../../src/modules/orders/services/ordersApi.service.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/rbacMiddleware.js';
import { idempotencyMiddleware } from '../middlewares/idempotency.middleware.js';
import { respond } from '../utils/apiResponse.js';

const router = Router();

// ─── 1. UNIVERSAL CPOE TRANSACTION CORE ROUTES (POSTGRESQL 16 SINGLE SOURCE OF TRUTH) ───

// POST /api/v1/orders/cpoe — Create Master Universal CPOE Order (ACID + Idempotency)
router.post('/cpoe', authenticateJwt, requirePermission('CPOE_ORDER_CREATE'), idempotencyMiddleware('POST /api/v1/orders/cpoe'), cpoeController.createOrder);

// POST /api/v1/orders/cpoe/:id/cancel — Cancel CPOE Order with Medicolegal Rationale
router.post('/cpoe/:id/cancel', authenticateJwt, requirePermission('CPOE_ORDER_CANCEL'), cpoeController.cancelOrder);

// GET /api/v1/orders/cpoe — List CPOE Orders from PostgreSQL
router.get('/cpoe', authenticateJwt, requirePermission('CPOE_ORDER_READ'), cpoeController.listOrders);

// GET /api/v1/orders/cpoe/:id — Get CPOE Order Details with Items
router.get('/cpoe/:id', authenticateJwt, requirePermission('CPOE_ORDER_READ'), cpoeController.getOrderById);

// GET /api/v1/orders/cpoe/encounter/:encounterId — Get all CPOE Orders for Encounter
router.get('/cpoe/encounter/:encounterId', authenticateJwt, requirePermission('CPOE_ORDER_READ'), cpoeController.getOrdersByEncounter);


// ─── 2. COMPATIBILITY & DIRECT DISPATCH ENDPOINTS ───

// GET /api/v1/orders — List all orders directly from PostgreSQL
router.get('/', authenticateJwt, cpoeController.listOrders);


// POST /api/v1/orders/prescription
router.post('/prescription', authenticateJwt, requirePermission('ORDER_CREATE_PHARMACY'), async (req, res, next) => {
  try {
    const result = await ordersApiService.createPrescription(req.body);
    return respond.created(res, {
      data: result,
      meta: { message: 'E-Resep Farmasi berhasil dibuat' },
      correlationId: req.correlationId
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/orders/lab
router.post('/lab', authenticateJwt, requirePermission('ORDER_CREATE_LAB'), async (req, res, next) => {
  try {
    const result = await ordersApiService.createLabOrder(req.body);
    return respond.created(res, {
      data: result,
      meta: { message: 'Order Laboratorium LIS berhasil diterbitkan' },
      correlationId: req.correlationId
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/orders/radiology
router.post('/radiology', authenticateJwt, requirePermission('ORDER_CREATE_RAD'), async (req, res, next) => {
  try {
    const result = await ordersApiService.createRadiologyOrder(req.body);
    return respond.created(res, {
      data: result,
      meta: { message: 'Order Radiologi & DICOM Study UID berhasil dibuat' },
      correlationId: req.correlationId
    });
  } catch (err) {
    next(err);
  }
});

export default router;

