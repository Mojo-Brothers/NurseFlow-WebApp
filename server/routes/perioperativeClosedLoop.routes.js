/**
 * NurseFlow Enterprise HIS 2026 — Perioperative & Operating Theatre Closed Loop Routes
 * Standards: Native PostgreSQL 16 Durability, JCI IPSG 4 (Safe Surgery), WHO Checklist, Modified Aldrete
 */

import { Router } from 'express';
import { perioperativeClosedLoopController } from '../controllers/perioperativeClosedLoop.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';

const router = Router();

// 1. Create Pre-Operative Anesthesia Evaluation
router.post('/preop-evaluations', authenticateJwt, perioperativeClosedLoopController.createPreOpEvaluation);

// 2. Execute WHO Surgical Safety Checklist Phase (SIGN_IN, TIME_OUT, SIGN_OUT)
router.post('/who-checklist', authenticateJwt, perioperativeClosedLoopController.executeWhoChecklist);

// 3. Record Intraoperative UDI Medical Implant Traceability
router.post('/implants', authenticateJwt, perioperativeClosedLoopController.recordImplant);

// 4. Record PACU Post-Anesthesia Recovery Assessment (Modified Aldrete Score)
router.post('/pacu-records', authenticateJwt, perioperativeClosedLoopController.recordPacuRecovery);

// 5. Finalize Surgical Closed Loop & Exactly-Once Charge Capture
router.post('/cases/:id/finalize', authenticateJwt, perioperativeClosedLoopController.finalizeSurgery);

// 6. Record Surgical Cancellation or Intraoperative Abort Pathway
router.post('/cases/:id/abort', authenticateJwt, perioperativeClosedLoopController.abortSurgery);

// 7. Trigger Intraoperative Emergency & Resuscitation Bridge
router.post('/cases/:id/emergency', authenticateJwt, perioperativeClosedLoopController.triggerEmergency);

// 8. Record Surgical Specimen Collection & Chain of Custody
router.post('/cases/:id/specimens', authenticateJwt, perioperativeClosedLoopController.recordSpecimen);

export default router;
