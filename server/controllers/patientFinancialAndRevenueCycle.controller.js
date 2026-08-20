/**
 * NurseFlow Enterprise HIS 2026 — Master Patient Financial & Revenue Cycle Closed Loop Controller
 * Domain: Itemized Charge Capture, Deposit Management, Multi-Payer Split Invoicing,
 * Cashier Multi-Payment (Cash/QRIS/EDC/VA/GL), Credit & Debit Notes, Deposit Refunds,
 * End-of-Day Shift Cash Reconciliation & Accounts Receivable (AR) Aging Lifecycle.
 * Standards: Canonical JSON Response Envelope ({ success, data, meta } / { success, error, meta })
 */

import {
  patientFinancialAndRevenueCycleService,
  PatientFinancialDomainError
} from '../services/patientFinancialAndRevenueCycle.service.js';

export const patientFinancialAndRevenueCycleController = {
  /**
   * 1. Record Patient Admission / Surgical Prepayment Deposit
   * POST /api/v1/patient-financial/deposits
   */
  recordDeposit: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'CASHIER-01',
        username: 'petugas_kasir_01',
        role: 'ROLE_ADMIN'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await patientFinancialAndRevenueCycleService.recordPatientDeposit(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `Setoran deposit pasien (${result.deposit_number}) sebesar Rp ${Number(result.amount_idr).toLocaleString('id-ID')} berhasil dicatat`,
          depositId: result.id,
          depositNumber: result.deposit_number,
          amount: result.amount_idr,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof PatientFinancialDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'DEPOSIT_RECORDING_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 2. Generate Multi-Payer Split Invoice
   * POST /api/v1/patient-financial/invoices
   */
  generateSplitInvoice: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'BILLING-OFFICER-01',
        username: 'petugas_billing_01',
        role: 'ROLE_ADMIN'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await patientFinancialAndRevenueCycleService.generatePatientSplitInvoice(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `Tagihan invoice pasien (${result.invoice_number}) berhasil diterbitkan dengan status ${result.invoice_status}`,
          invoiceId: result.id,
          invoiceNumber: result.invoice_number,
          netPayable: result.net_patient_payable_idr,
          status: result.invoice_status,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof PatientFinancialDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'INVOICE_GENERATION_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 3. Record Cashier Payment Transaction
   * POST /api/v1/patient-financial/payments
   */
  recordPayment: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'CASHIER-01',
        username: 'petugas_kasir_01',
        role: 'ROLE_ADMIN'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await patientFinancialAndRevenueCycleService.recordCashierPayment(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `Pembayaran kasir (${result.transaction_number}) sebesar Rp ${Number(result.amount_paid_idr).toLocaleString('id-ID')} via ${result.payment_method} berhasil diproses`,
          transactionId: result.id,
          transactionNumber: result.transaction_number,
          paidAmount: result.amount_paid_idr,
          changeAmount: result.change_amount_idr,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof PatientFinancialDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'PAYMENT_PROCESSING_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 4. Execute Financial Adjustment or Refund
   * POST /api/v1/patient-financial/adjustments
   */
  executeAdjustment: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'FIN-MANAGER-01',
        username: 'manajer_keuangan',
        role: 'ROLE_ADMIN'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await patientFinancialAndRevenueCycleService.executeFinancialAdjustmentOrRefund(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `Penyesuaian finansial / refund (${result.adjustment_number} - ${result.adjustment_type}) sebesar Rp ${Number(result.amount_idr).toLocaleString('id-ID')} berhasil dieksekusi`,
          adjustmentId: result.id,
          adjustmentNumber: result.adjustment_number,
          adjustmentType: result.adjustment_type,
          amount: result.amount_idr,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof PatientFinancialDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'ADJUSTMENT_EXECUTION_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 5. End-of-Day Shift Close & Cashier Financial Reconciliation
   * POST /api/v1/patient-financial/shifts/reconcile
   */
  reconcileShift: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'CASHIER-01',
        username: 'petugas_kasir_01',
        role: 'ROLE_ADMIN'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await patientFinancialAndRevenueCycleService.reconcileCashierShift(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          message: `Rekonsiliasi penutupan shift kasir (${result.shift_number}) berhasil diselesaikan dengan status ${result.shift_status}`,
          shiftId: result.id,
          shiftNumber: result.shift_number,
          shiftStatus: result.shift_status,
          cashVariance: result.cash_variance_idr,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof PatientFinancialDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'SHIFT_RECONCILIATION_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 6. Manage Accounts Receivable (AR) Aging Lifecycle
   * POST /api/v1/patient-financial/ar
   */
  recordAr: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'AR-STAFF-01',
        username: 'staf_piutang_ar',
        role: 'ROLE_ADMIN'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await patientFinancialAndRevenueCycleService.manageAccountsReceivableAging(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `Pencatatan piutang klaim AR (${result.payer_name}) sebesar Rp ${Number(result.current_balance_idr).toLocaleString('id-ID')} (${result.aging_bucket}) berhasil dicatat`,
          arId: result.id,
          payerName: result.payer_name,
          currentBalance: result.current_balance_idr,
          agingBucket: result.aging_bucket,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof PatientFinancialDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'AR_MANAGEMENT_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  }
};
