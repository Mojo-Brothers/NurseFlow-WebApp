/**
 * NurseFlow Enterprise HIS 2026 — Clinical Monitoring & Deterioration Response Routes
 * Standards: Native PostgreSQL 16 Durability, NEWS2 Scoring, ISBAR Escalation, Rapid Response / Code Blue, Reassessment
 */

import { Router } from 'express';
import { clinicalMonitoringController } from '../controllers/clinicalMonitoring.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/rbacMiddleware.js';

const router = Router();

// 1. Record Vital Sign Observation & Calculate EWS (NEWS2)
router.post('/observations', authenticateJwt, clinicalMonitoringController.recordObservation);

// 2. Escalate Clinical Deterioration (ISBAR)
router.post('/observations/:id/escalate', authenticateJwt, clinicalMonitoringController.escalateDeterioration);

// 3. Acknowledge Escalation (Closed-Loop Read-Back)
router.post('/escalations/:id/acknowledge', authenticateJwt, clinicalMonitoringController.acknowledgeEscalation);

// 4. Rapid Response / Code Blue Resuscitation Event
router.post('/rapid-response', authenticateJwt, clinicalMonitoringController.activateRapidResponse);

// 5. Record Closed-Loop Reassessment
router.post('/observations/:id/reassess', authenticateJwt, clinicalMonitoringController.recordReassessment);

export default router;
