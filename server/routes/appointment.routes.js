import { Router } from 'express';
import { appointmentController } from '../controllers/appointment.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.get('/', authenticateJwt, appointmentController.getAppointments);
router.post('/book', authenticateJwt, requireRole(['FRONT_DESK', 'ADMIN', 'DOCTOR', 'NURSE', 'SUPERVISOR']), appointmentController.book);
router.post('/check-in', authenticateJwt, requireRole(['FRONT_DESK', 'ADMIN', 'NURSE', 'SUPERVISOR']), appointmentController.checkIn);
router.post('/cancel', authenticateJwt, requireRole(['FRONT_DESK', 'ADMIN', 'DOCTOR', 'SUPERVISOR']), appointmentController.cancel);

export default router;
