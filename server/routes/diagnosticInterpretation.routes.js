/**
 * NurseFlow Enterprise HIS 2026 — Diagnostic Results & Clinical Interpretation Routes
 * Standards: Native PostgreSQL 16 Durability, JCI IPSG 2 TBAK Read-Back, Delta Checks, Secondary Actions
 */

import { Router } from 'express';
import { diagnosticInterpretationController } from '../controllers/diagnosticInterpretation.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';

const router = Router();

// 1. Publish Diagnostic Result Notification
router.post('/notifications', authenticateJwt, diagnosticInterpretationController.publishNotification);

// 2. Acknowledge Diagnostic Result Notification (Closed-Loop Read-Back)
router.post('/notifications/:id/acknowledge', authenticateJwt, diagnosticInterpretationController.acknowledgeNotification);

// 3. Record Physician Clinical Interpretation & Delta Check
router.post('/notifications/:id/interpret', authenticateJwt, diagnosticInterpretationController.recordInterpretation);

// 4. Execute Secondary Clinical Action (Downstream CPOE Order)
router.post('/interpretations/:id/actions', authenticateJwt, diagnosticInterpretationController.executeSecondaryAction);

export default router;
