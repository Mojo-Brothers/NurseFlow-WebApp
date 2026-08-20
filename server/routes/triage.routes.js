/**
 * NurseFlow Enterprise HIS 2026 — Triage Routes
 */

import { Router } from 'express';
import { triageController } from '../controllers/triage.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/rbacMiddleware.js';

const router = Router();

// POST /api/v1/triage/assessments — Record Triage Assessment
router.post('/assessments', authenticateJwt, requirePermission('TRIAGE_WRITE'), triageController.recordAssessment);

// POST /api/v1/triage/first-physician-contact — Stop SLA Timer
router.post('/first-physician-contact', authenticateJwt, triageController.recordFirstPhysicianContact);

// GET /api/v1/triage/encounter/:encounterId — Get Triage by Encounter
router.get('/encounter/:encounterId', authenticateJwt, requirePermission('TRIAGE_READ'), triageController.getTriageByEncounterId);

export default router;
