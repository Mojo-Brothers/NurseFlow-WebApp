import { Router } from 'express';
import { patientController } from '../controllers/patient.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/rbacMiddleware.js';

const router = Router();

// GET /api/v1/patients — Search / List MPI Patients
router.get('/', authenticateJwt, patientController.getPatients);

// GET /api/v1/patients/:id — Get Patient Detail
router.get('/:id', authenticateJwt, patientController.getPatientById);

// POST /api/v1/patients — Register New Patient (ACID Transaction)
router.post('/', authenticateJwt, requirePermission('PATIENT_REGISTER'), patientController.createPatient);

export default router;
