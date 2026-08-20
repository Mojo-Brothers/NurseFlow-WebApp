import { Router } from 'express';
import { bloodBankController } from '../controllers/bloodBank.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/units', authenticateJwt, bloodBankController.getInventory);
router.post('/units', authenticateJwt, bloodBankController.intakeDonorUnit);
router.post('/crossmatch', authenticateJwt, bloodBankController.executeCrossmatch);
router.post('/transfusion/verify', authenticateJwt, bloodBankController.verifyBedsideTransfusion);

export default router;
