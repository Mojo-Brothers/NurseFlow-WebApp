/**
 * NurseFlow Enterprise HIS 2026 — Bed Management Routes
 */

import { Router } from 'express';
import { bedManagementController } from '../controllers/bedManagement.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';

const router = Router();

// GET /api/v1/beds — List & Monitor Beds
router.get('/', authenticateJwt, bedManagementController.getBeds);

// POST /api/v1/beds/assign — Assign Patient to Bed
router.post('/assign', authenticateJwt, bedManagementController.assignBed);

// POST /api/v1/beds/transfer — Transfer Patient Between Beds
router.post('/transfer', authenticateJwt, bedManagementController.transferBed);

// POST /api/v1/beds/discharge — Discharge Patient from Bed
router.post('/discharge', authenticateJwt, bedManagementController.dischargeBed);

export default router;
