/**
 * NurseFlow Enterprise HIS 2026 — Laboratory Information System (LIS) Routes
 * Standards: Native PostgreSQL 16 Durability, Specimen Chain of Custody, Critical Panic Alerts
 */

import { Router } from 'express';
import { laboratoryController } from '../controllers/laboratory.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/rbacMiddleware.js';

const router = Router();

// ─── 1. SPECIMEN LIFECYCLE & ACCESSION ───

// POST /api/v1/laboratory/specimens/generate — Generate Specimens for CPOE Order
router.post('/specimens/generate', authenticateJwt, requirePermission('CPOE_ORDER_READ'), laboratoryController.generateSpecimens);

// POST /api/v1/laboratory/specimens/:id/collect — Record Specimen Collection (Phlebotomy)
router.post('/specimens/:id/collect', authenticateJwt, requirePermission('LAB_SPECIMEN_COLLECT'), laboratoryController.collectSpecimen);

// POST /api/v1/laboratory/specimens/:id/accession — Receive & Accession Specimen in Lab
router.post('/specimens/:id/accession', authenticateJwt, requirePermission('LAB_SPECIMEN_RECEIVE'), laboratoryController.accessionSpecimen);


// ─── 2. RESULTS & VERIFICATION ───

// POST /api/v1/laboratory/specimens/:id/results — Enter Analyzer Test Result
router.post('/specimens/:id/results', authenticateJwt, requirePermission('LAB_ANALYZER_RUN'), laboratoryController.enterResult);

// POST /api/v1/laboratory/results/:id/release — Verify & Release Final Result to Medical Record
router.post('/results/:id/release', authenticateJwt, requirePermission('LAB_RESULT_VALIDATE'), laboratoryController.verifyAndRelease);


// ─── 3. PANIC / CRITICAL VALUE ESCALATION ───

// POST /api/v1/laboratory/panic-alerts/:id/acknowledge — Closed-loop Panic Read-Back Confirmation
router.post('/panic-alerts/:id/acknowledge', authenticateJwt, requirePermission('LAB_PANIC_ACKNOWLEDGE'), laboratoryController.acknowledgePanic);

// POST /api/v1/laboratory/panic-alerts/:id/escalate — Escalate Unacknowledged Panic Alert
router.post('/panic-alerts/:id/escalate', authenticateJwt, laboratoryController.escalatePanic);


// ─── 4. QUERIES ───

// GET /api/v1/laboratory/orders/:orderId/specimens — Get all specimens and results for Order
router.get('/orders/:orderId/specimens', authenticateJwt, requirePermission('CPOE_ORDER_READ'), laboratoryController.getSpecimensByOrder);

export default router;
