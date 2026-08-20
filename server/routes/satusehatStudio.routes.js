import { Router } from 'express';
import { satusehatStudioController } from '../controllers/satusehatStudio.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.get('/logs', authenticateJwt, requireRole(['ADMIN', 'IT_ADMIN', 'SUPERVISOR']), satusehatStudioController.getLogs);
router.get('/token', authenticateJwt, requireRole(['ADMIN', 'IT_ADMIN', 'SUPERVISOR']), satusehatStudioController.getToken);
router.post('/validate', authenticateJwt, requireRole(['ADMIN', 'IT_ADMIN', 'DOCTOR', 'NURSE', 'SUPERVISOR']), satusehatStudioController.validate);
router.post('/transmit', authenticateJwt, requireRole(['ADMIN', 'IT_ADMIN', 'SUPERVISOR']), satusehatStudioController.transmit);

export default router;
