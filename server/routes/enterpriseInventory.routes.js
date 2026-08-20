import { Router } from 'express';
import { enterpriseInventoryController } from '../controllers/enterpriseInventory.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/stock', authenticateJwt, enterpriseInventoryController.getStock);
router.post('/receive', authenticateJwt, enterpriseInventoryController.receive);
router.post('/transfer', authenticateJwt, enterpriseInventoryController.transfer);
router.get('/movements', authenticateJwt, enterpriseInventoryController.getMovements);

export default router;
