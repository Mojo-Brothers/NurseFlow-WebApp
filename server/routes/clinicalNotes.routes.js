/**
 * NurseFlow Enterprise HIS 2026 — Clinical Notes Routes (SOAP & CPPT)
 */

import { Router } from 'express';
import { clinicalNotesController } from '../controllers/clinicalNotes.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/rbacMiddleware.js';

const router = Router();

// ─── Doctor SOAP Routes ───
// POST /api/v1/clinical-notes/soap — Record Signed Doctor SOAP Note
router.post('/soap', authenticateJwt, requirePermission('EMR_WRITE_SOAP'), clinicalNotesController.recordSoap);

// POST /api/v1/clinical-notes/soap/:id/amend — Amend Signed SOAP Note
router.post('/soap/:id/amend', authenticateJwt, requirePermission('EMR_WRITE_SOAP'), clinicalNotesController.amendSoap);

// GET /api/v1/clinical-notes/soap/encounter/:encounterId — Get SOAP Notes by Encounter
router.get('/soap/encounter/:encounterId', authenticateJwt, requirePermission('EMR_READ'), clinicalNotesController.getSoapNotes);

// ─── Multidisciplinary CPPT Routes ───
// POST /api/v1/clinical-notes/cppt — Record Multidisciplinary CPPT Entry
router.post('/cppt', authenticateJwt, requirePermission('CPPT_WRITE'), clinicalNotesController.recordCppt);

// PATCH /api/v1/clinical-notes/cppt/:id/verify — DPJP 24h CPPT Verification
router.patch('/cppt/:id/verify', authenticateJwt, requirePermission('CPPT_VERIFY'), clinicalNotesController.verifyCppt);

// GET /api/v1/clinical-notes/cppt/encounter/:encounterId — Get CPPT Notes by Encounter
router.get('/cppt/encounter/:encounterId', authenticateJwt, requirePermission('EMR_READ'), clinicalNotesController.getCpptNotes);

export default router;
