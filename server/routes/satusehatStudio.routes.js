import { Router } from 'express';
import { satusehatStudioController } from '../controllers/satusehatStudio.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/logs', authenticateJwt, satusehatStudioController.getLogs);
router.get('/token', authenticateJwt, satusehatStudioController.getToken);
router.post('/validate', authenticateJwt, satusehatStudioController.validate);
router.post('/transmit', authenticateJwt, satusehatStudioController.transmit);

export default router;
