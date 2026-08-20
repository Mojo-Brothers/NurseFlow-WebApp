import { Router } from 'express';
import { commandCenterController } from '../controllers/commandCenter.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/capacity', authenticateJwt, commandCenterController.getCapacity);
router.get('/emergency', authenticateJwt, commandCenterController.getEmergency);
router.get('/financial', authenticateJwt, commandCenterController.getFinancial);
router.get('/safety', authenticateJwt, commandCenterController.getSafety);
router.get('/alerts', authenticateJwt, commandCenterController.getAlerts);

export default router;
