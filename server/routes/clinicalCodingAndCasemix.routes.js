/**
 * NurseFlow Enterprise HIS 2026 — Clinical Coding, Casemix & Revenue Integrity Routes
 * Standards: Permenkes 3/2023 INA-CBG, JCI MOI / FMS, SCD2 Versioned Coding, CDI Physician Query Loop
 */

import { Router } from 'express';
import { clinicalCodingAndCasemixController } from '../controllers/clinicalCodingAndCasemix.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';

const router = Router();

// 1. Record or Update Clinical Coding Record (SCD2 Versioned)
router.post('/coding-records', authenticateJwt, clinicalCodingAndCasemixController.recordCoding);

// 2. Create Physician-Coder Clarification Query (CDI Loop)
router.post('/queries', authenticateJwt, clinicalCodingAndCasemixController.createPhysicianQuery);

// 3. Respond to Physician Clarification Query (CDI Loop)
router.post('/queries/:id/respond', authenticateJwt, clinicalCodingAndCasemixController.respondPhysicianQuery);

// 4. Execute Permenkes 3/2023 INA-CBG Grouping Engine
router.post('/encounters/:id/grouping', authenticateJwt, clinicalCodingAndCasemixController.executeGrouping);

// 5. Perform Revenue Integrity Cross-Audit (Leakage Protection)
router.post('/encounters/:id/cross-audit', authenticateJwt, clinicalCodingAndCasemixController.crossAuditRevenue);

// 6. Submit Electronic Claim Lifecycle
router.post('/claims', authenticateJwt, clinicalCodingAndCasemixController.submitClaim);

export default router;
