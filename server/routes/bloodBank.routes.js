import { Router } from 'express';
import { bloodBankController } from '../controllers/bloodBank.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.get('/units', authenticateJwt, requireRole(['BLOOD_BANK_OFFICER', 'LAB_ANALYST', 'DOCTOR', 'NURSE', 'ADMIN', 'SUPERVISOR']), bloodBankController.getInventory);
router.post('/units', authenticateJwt, requireRole(['BLOOD_BANK_OFFICER', 'ADMIN', 'SUPERVISOR']), bloodBankController.intakeDonorUnit);
router.post('/crossmatch', authenticateJwt, requireRole(['BLOOD_BANK_OFFICER', 'LAB_ANALYST', 'ADMIN']), bloodBankController.executeCrossmatch);
router.post('/transfusion/verify', authenticateJwt, requireRole(['NURSE', 'BLOOD_BANK_OFFICER', 'DOCTOR', 'ADMIN']), bloodBankController.verifyBedsideTransfusion);

export default router;
