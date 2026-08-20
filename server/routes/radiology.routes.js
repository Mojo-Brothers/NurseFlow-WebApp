/**
 * NurseFlow Enterprise HIS 2026 — Radiology Information System (RIS) & PACS Routes
 * Standards: Native PostgreSQL 16 Durability, DICOM MWL, Structured Reporting & Critical Findings
 */

import { Router } from 'express';
import { radiologyController } from '../controllers/radiology.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/rbacMiddleware.js';

const router = Router();

// ─── 1. MODALITY WORKLIST (MWL) & DICOM ACQUISITION ───

// POST /api/v1/radiology/worklist/generate — Generate Modality Worklist for CPOE Order
router.post('/worklist/generate', authenticateJwt, requirePermission('CPOE_ORDER_READ'), radiologyController.generateModalityWorklist);

// POST /api/v1/radiology/studies/acquire — Ingest DICOM C-STORE Study & Instances to PACS
router.post('/studies/acquire', authenticateJwt, requirePermission('RAD_IMAGE_ACQUIRE'), radiologyController.acquireStudy);


// ─── 2. STRUCTURED REPORTING & AMENDMENT ───

// POST /api/v1/radiology/studies/:id/reports — Draft or Finalize Structured Radiology Report
router.post('/studies/:id/reports', authenticateJwt, requirePermission('RAD_REPORT_WRITE'), radiologyController.saveReport);

// POST /api/v1/radiology/reports/:id/amend — Medicolegal Report Amendment / Addendum
router.post('/reports/:id/amend', authenticateJwt, requirePermission('RAD_REPORT_VERIFY'), radiologyController.amendReport);


// ─── 3. CRITICAL FINDINGS CLOSED-LOOP NOTIFICATION ───

// POST /api/v1/radiology/critical-alerts/:id/acknowledge — Read-Back Confirmation
router.post('/critical-alerts/:id/acknowledge', authenticateJwt, requirePermission('RAD_CRITICAL_ACKNOWLEDGE'), radiologyController.acknowledgeCriticalFinding);

// POST /api/v1/radiology/critical-alerts/:id/escalate — Escalate Unacknowledged Critical Finding
router.post('/critical-alerts/:id/escalate', authenticateJwt, radiologyController.escalateCriticalFinding);


// ─── 4. QUERIES ───

// GET /api/v1/radiology/orders/:orderId/studies — Get Studies and Reports for CPOE Order
router.get('/orders/:orderId/studies', authenticateJwt, requirePermission('CPOE_ORDER_READ'), radiologyController.getStudiesByOrder);

export default router;
