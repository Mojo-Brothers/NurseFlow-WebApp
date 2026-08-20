import { Router } from 'express';
import { enterpriseInventoryController } from '../controllers/enterpriseInventory.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.get('/stock', authenticateJwt, requireRole(['PHARMACIST', 'LOGISTICS_OFFICER', 'ADMIN', 'DOCTOR', 'NURSE']), enterpriseInventoryController.getStock);
router.post('/receive', authenticateJwt, requireRole(['PHARMACIST', 'LOGISTICS_OFFICER', 'ADMIN']), enterpriseInventoryController.receive);
router.post('/transfer', authenticateJwt, requireRole(['PHARMACIST', 'LOGISTICS_OFFICER', 'ADMIN']), enterpriseInventoryController.transfer);
router.get('/movements', authenticateJwt, requireRole(['PHARMACIST', 'LOGISTICS_OFFICER', 'ADMIN', 'SUPERVISOR']), enterpriseInventoryController.getMovements);

export default router;
