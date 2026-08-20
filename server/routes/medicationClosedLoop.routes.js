/**
 * NurseFlow Enterprise HIS 2026 — Medication Closed-Loop Routes (Patient Safety Core & Clinical Hardened)
 * Standards: Native PostgreSQL 16 Durability, CDSS Safety Gates, Pharmacist MMU.4, FEFO Stock, Bedside eMAR 6-Rights, Reconciliation
 */

import { Router } from 'express';
import { medicationClosedLoopController } from '../controllers/medicationClosedLoop.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/rbacMiddleware.js';

const router = Router();

// 1. e-Prescribe Medication from CPOE Order
router.post('/prescribe', authenticateJwt, requirePermission('CPOE_ORDER_CREATE'), medicationClosedLoopController.prescribeMedication);

// 2. Pharmacist MMU.4 Clinical Review
router.post('/:id/pharmacist-review', authenticateJwt, requirePermission('PHARMACY_REVIEW'), medicationClosedLoopController.pharmacistReview);

// 3. FEFO Inventory Stock Allocation & Dispensing
router.post('/:id/dispense', authenticateJwt, requirePermission('PHARMACY_DISPENSE'), medicationClosedLoopController.dispenseFEFO);

// 4. Bedside 6-Rights Barcode Verification & eMAR Administration
router.post('/:id/administer', authenticateJwt, requirePermission('MEDICATION_ADMINISTER'), medicationClosedLoopController.administerBedside);

// 5. Medication Reconciliation (Admission)
router.post('/reconciliation/admission', authenticateJwt, requirePermission('CPOE_ORDER_CREATE'), medicationClosedLoopController.reconcileAdmission);

// 6. Medication Reconciliation (Discharge)
router.post('/reconciliation/discharge', authenticateJwt, requirePermission('PHARMACY_REVIEW'), medicationClosedLoopController.reconcileDischarge);

// 7. Adverse Drug Reaction Documentation
router.post('/administrations/:id/adverse-reaction', authenticateJwt, medicationClosedLoopController.documentAdverseReaction);

// 8. Cancel Medication Order
router.post('/:id/cancel', authenticateJwt, requirePermission('CPOE_ORDER_CANCEL'), medicationClosedLoopController.cancelOrder);

export default router;
