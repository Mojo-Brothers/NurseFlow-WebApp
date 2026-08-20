import { Router } from 'express';
import { commandCenterController } from '../controllers/commandCenter.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.get('/capacity', authenticateJwt, requireRole(['ADMIN', 'EXECUTIVE', 'HOSPITAL_DIRECTOR', 'DOCTOR', 'NURSE', 'SUPERVISOR']), commandCenterController.getCapacity);
router.get('/emergency', authenticateJwt, requireRole(['ADMIN', 'EXECUTIVE', 'HOSPITAL_DIRECTOR', 'DOCTOR', 'NURSE', 'SUPERVISOR']), commandCenterController.getEmergency);
router.get('/financial', authenticateJwt, requireRole(['ADMIN', 'EXECUTIVE', 'HOSPITAL_DIRECTOR', 'FINANCE', 'SUPERVISOR']), commandCenterController.getFinancial);
router.get('/safety', authenticateJwt, requireRole(['ADMIN', 'EXECUTIVE', 'HOSPITAL_DIRECTOR', 'DOCTOR', 'NURSE', 'SUPERVISOR']), commandCenterController.getSafety);
router.get('/alerts', authenticateJwt, requireRole(['ADMIN', 'EXECUTIVE', 'HOSPITAL_DIRECTOR', 'SUPERVISOR']), commandCenterController.getAlerts);

export default router;
