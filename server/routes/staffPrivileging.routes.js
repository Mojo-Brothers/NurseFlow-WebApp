import { Router } from 'express';
import { staffPrivilegingController } from '../controllers/staffPrivileging.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/staff', authenticateJwt, staffPrivilegingController.getStaffList);
router.post('/staff', authenticateJwt, staffPrivilegingController.createStaff);
router.post('/credentials', authenticateJwt, staffPrivilegingController.addCredential);
router.post('/privileges', authenticateJwt, staffPrivilegingController.grantPrivilege);
router.post('/verify', authenticateJwt, staffPrivilegingController.verifyAuthorization);

export default router;
