import { Router } from 'express';
import { ordersApiService } from '../../src/modules/orders/services/ordersApi.service.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/rbacMiddleware.js';

const router = Router();

// GET /api/v1/orders
router.get('/', authenticateJwt, async (req, res) => {
  const orders = await ordersApiService.getOrders();
  return res.json({ success: true, count: orders.length, data: orders });
});

// POST /api/v1/orders/prescription
router.post('/prescription', authenticateJwt, requirePermission('ORDER_CREATE_PHARMACY'), async (req, res) => {
  try {
    const result = await ordersApiService.createPrescription(req.body);
    return res.status(201).json({
      success: true,
      message: 'E-Resep Farmasi berhasil dibuat',
      data: result
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/v1/orders/lab
router.post('/lab', authenticateJwt, requirePermission('ORDER_CREATE_LAB'), async (req, res) => {
  try {
    const result = await ordersApiService.createLabOrder(req.body);
    return res.status(201).json({
      success: true,
      message: 'Order Laboratorium LIS berhasil diterbitkan',
      data: result
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/v1/orders/radiology
router.post('/radiology', authenticateJwt, requirePermission('ORDER_CREATE_RAD'), async (req, res) => {
  try {
    const result = await ordersApiService.createRadiologyOrder(req.body);
    return res.status(201).json({
      success: true,
      message: 'Order Radiologi & DICOM Study UID berhasil dibuat',
      data: result
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
