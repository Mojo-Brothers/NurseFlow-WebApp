/**
 * NurseFlow Enterprise HIS 2026 — Patient Financial & Revenue Cycle Routes
 * Standards: PMK 24/2022, Permenkes 3/2023, JCI MOI / FMS, PostgreSQL 16 ACID
 */

import { Router } from 'express';
import { patientFinancialAndRevenueCycleController } from '../controllers/patientFinancialAndRevenueCycle.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';

const router = Router();

// 1. Record Patient Deposit
router.post('/deposits', authenticateJwt, patientFinancialAndRevenueCycleController.recordDeposit);

// 2. Generate Multi-Payer Split Invoice
router.post('/invoices', authenticateJwt, patientFinancialAndRevenueCycleController.generateSplitInvoice);

// 3. Record Cashier Payment Transaction
router.post('/payments', authenticateJwt, patientFinancialAndRevenueCycleController.recordPayment);

// 4. Execute Financial Adjustment or Refund (Credit Note, Debit Note, Deposit Refund)
router.post('/adjustments', authenticateJwt, patientFinancialAndRevenueCycleController.executeAdjustment);

// 5. End-of-Day Shift Close & Cashier Financial Reconciliation
router.post('/shifts/reconcile', authenticateJwt, patientFinancialAndRevenueCycleController.reconcileShift);

// 6. Manage Accounts Receivable (AR) Aging Lifecycle
router.post('/ar', authenticateJwt, patientFinancialAndRevenueCycleController.recordAr);

export default router;
