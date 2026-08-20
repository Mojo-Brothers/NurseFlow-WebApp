import { Router } from 'express';
import { masterDataHubController } from '../controllers/masterDataHub.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.get('/:entityType', authenticateJwt, masterDataHubController.listEntities);
router.get('/:entityType/:id', authenticateJwt, masterDataHubController.getEntity);
router.post('/:entityType', authenticateJwt, requireRole(['ADMIN', 'SUPERVISOR']), masterDataHubController.createEntity);
router.put('/:entityType/:id', authenticateJwt, requireRole(['ADMIN', 'SUPERVISOR']), masterDataHubController.updateEntity);

export default router;
