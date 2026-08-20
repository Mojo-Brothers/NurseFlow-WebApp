/**
 * NurseFlow Enterprise HIS 2026 — Care Coordination & Longitudinal Timeline Routes
 * Standards: Native PostgreSQL 16 Durability, JCI COP / IPSG 2, SBAR Handover, Discharge Summary
 */

import { Router } from 'express';
import { careCoordinationAndTimelineController } from '../controllers/careCoordinationAndTimeline.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';

const router = Router();

// 1. Get Unified Longitudinal Timeline (Chronological Causal Graph)
router.get('/encounters/:encounterId/timeline', authenticateJwt, careCoordinationAndTimelineController.getTimeline);

// 2. Create or Update Inter-Disciplinary Care Plan (ICP)
router.post('/care-plans', authenticateJwt, careCoordinationAndTimelineController.createOrUpdateCarePlan);

// 3. Create SBAR Shift Handover
router.post('/handovers', authenticateJwt, careCoordinationAndTimelineController.createShiftHandover);

// 4. Acknowledge Shift Handover (Dual Sign-Off)
router.post('/handovers/:id/acknowledge', authenticateJwt, careCoordinationAndTimelineController.acknowledgeShiftHandover);

// 5. Create & Lock JCI Medical Discharge Resume
router.post('/discharge-summaries', authenticateJwt, careCoordinationAndTimelineController.createDischargeSummary);

export default router;
