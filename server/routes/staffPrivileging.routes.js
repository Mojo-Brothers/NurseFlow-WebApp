import { Router } from 'express';
import { staffPrivilegingController } from '../controllers/staffPrivileging.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.get('/staff', authenticateJwt, requireRole(['ADMIN', 'SUPERVISOR', 'CLINICAL_DIRECTOR', 'DOCTOR', 'NURSE']), staffPrivilegingController.getStaffList);
router.post('/staff', authenticateJwt, requireRole(['ADMIN', 'CLINICAL_DIRECTOR', 'SUPERVISOR']), staffPrivilegingController.createStaff);
router.post('/credentials', authenticateJwt, requireRole(['ADMIN', 'CLINICAL_DIRECTOR', 'SUPERVISOR']), staffPrivilegingController.addCredential);
router.post('/privileges', authenticateJwt, requireRole(['ADMIN', 'CLINICAL_DIRECTOR', 'SUPERVISOR']), staffPrivilegingController.grantPrivilege);
router.post('/verify', authenticateJwt, staffPrivilegingController.verifyAuthorization);

export default router;
