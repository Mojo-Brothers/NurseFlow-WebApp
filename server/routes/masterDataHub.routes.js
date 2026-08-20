import { Router } from 'express';
import { masterDataHubController } from '../controllers/masterDataHub.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/:entityType', authenticateJwt, masterDataHubController.listEntities);
router.get('/:entityType/:id', authenticateJwt, masterDataHubController.getEntity);
router.post('/:entityType', authenticateJwt, masterDataHubController.createEntity);
router.put('/:entityType/:id', authenticateJwt, masterDataHubController.updateEntity);

export default router;
