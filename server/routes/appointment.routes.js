import { Router } from 'express';
import { appointmentController } from '../controllers/appointment.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', authenticateJwt, appointmentController.getAppointments);
router.post('/book', authenticateJwt, appointmentController.book);
router.post('/check-in', authenticateJwt, appointmentController.checkIn);
router.post('/cancel', authenticateJwt, appointmentController.cancel);

export default router;
