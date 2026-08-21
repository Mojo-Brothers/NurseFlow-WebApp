/**
 * NurseFlow Enterprise HIS 2026 — Master Patient Financial & Revenue Cycle Closed Loop Service
 * Domain: Itemized Charge Capture, Deposit Management, Multi-Payer Split Invoicing,
 * Cashier Multi-Payment (Cash/QRIS/EDC/VA/GL), Credit & Debit Notes, Deposit Refunds,
 * End-of-Day Shift Cash Reconciliation & Accounts Receivable (AR) Aging Lifecycle.
 * Standards: PMK 24/2022, Permenkes 3/2023, JCI MOI / FMS, PostgreSQL 16 ACID.
 */

import crypto from 'crypto';
import { postgresPoolService } from '../db/postgresPool.js';
import { careCoordinationAndTimelineService } from './careCoordinationAndTimeline.service.js';
import { ENTERPRISE_ROLES } from '../../src/shared/constants/roles.js';

export class PatientFinancialDomainError extends Error {
  constructor(message, code = 'FINANCIAL_DOMAIN_ERROR', statusCode = 400, details = []) {
    super(message);
    this.name = 'PatientFinancialDomainError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const patientFinancialAndRevenueCycleService = {
  /**
   * 1. Record Patient Admission / Surgical Prepayment Deposit
   */
  recordPatientDeposit: async (payload, actor, clientIp = '127.0.0.1', correlationId = null) => {
    const {
      encounterId,
      patientId,
      depositType = 'ADMISSION_DEPOSIT',
      amountIdr,
      paymentMethod = 'CASH'
    } = payload;

    if (!encounterId || !patientId || !amountIdr || Number(amountIdr) <= 0) {
      throw new PatientFinancialDomainError(
        'Data setoran deposit tidak lengkap atau nominal deposit tidak valid.',
        'VALIDATION_FAILED',
        400
      );
    }

    const client = await postgresPoolService.getPool().connect();
    const corrId = correlationId || `CORR-DEP-${Date.now()}`;
    const receivedById = actor.userId || actor.id || 'CASHIER-01';
    const receivedByName = actor.fullName || actor.name || 'Petugas Kasir';

    try {
      await client.query('BEGIN');

      const depositId = crypto.randomUUID();
      const depositNumber = `DEP-${Date.now().toString().slice(-6)}`;
      const timestamp = new Date().toISOString();

      const sigPayload = `${depositId}|${encounterId}|${depositType}|${amountIdr}|${receivedById}|${timestamp}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

      const insertSql = `
        INSERT INTO patient_deposit_ledgers (
          id, encounter_id, patient_id, deposit_number, deposit_type,
          amount_idr, remaining_balance_idr, payment_method, status,
          received_by_id, received_by_name, digital_signature_hash,
          correlation_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $6, $7, 'ACTIVE', $8, $9, $10, $11, NOW(), NOW())
        RETURNING *;
      `;

      const res = await client.query(insertSql, [
        depositId, encounterId, patientId, depositNumber, depositType,
        amountIdr, paymentMethod, receivedById, receivedByName,
        digitalSignatureHash, corrId
      ]);

      const depositRecord = res.rows[0];

      // Record Timeline Event
      await careCoordinationAndTimelineService.recordTimelineEvent({
        encounterId,
        patientId,
        eventCategory: 'PATIENT_FINANCIAL',
        eventTitle: `Penerimaan Deposit Pasien: Rp ${Number(amountIdr).toLocaleString('id-ID')}`,
        eventSummary: `Tipe: ${depositType}. Metode Pembayaran: ${paymentMethod}. Kasir: ${receivedByName}.`,
        domainSourceTable: 'patient_deposit_ledgers',
        domainSourceId: depositRecord.id,
        clinicalSeverity: 'INFO'
      }, actor, clientIp, corrId, client);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type, event_payload, status, correlation_id, created_at
        ) VALUES ($1, 'FINANCIAL', $2, 'PATIENT_DEPOSIT_RECORDED', $3, 'PENDING', $4, NOW());
      `, [crypto.randomUUID(), depositRecord.id, JSON.stringify({ depositId: depositRecord.id, amountIdr, depositType }), corrId]);

      await client.query('COMMIT');
      return depositRecord;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * 2. Generate Multi-Payer Split Invoice (Auto Deposit Application)
   */
  generatePatientSplitInvoice: async (payload, actor, clientIp = '127.0.0.1', correlationId = null) => {
    const {
      encounterId,
      patientId,
      payerType = 'MANDIRI_UMUM',
      totalGrossIdr,
      discountIdr = 0.00,
      payerCoveredIdr = 0.00,
      applyActiveDeposit = true
    } = payload;

    if (!encounterId || !patientId || !totalGrossIdr || Number(totalGrossIdr) < 0) {
      throw new PatientFinancialDomainError(
        'Data penagihan invoice tidak lengkap atau total tagihan bruto tidak valid.',
        'VALIDATION_FAILED',
        400
      );
    }

    const client = await postgresPoolService.getPool().connect();
    const corrId = correlationId || `CORR-INV-${Date.now()}`;
    const issuedById = actor.userId || actor.id || 'BILLING-OFFICER-01';
    const issuedByName = actor.fullName || actor.name || 'Petugas Penagihan & Kasir';

    try {
      await client.query('BEGIN');

      const gross = Number(totalGrossIdr);
      const discount = Number(discountIdr);
      const payerCovered = Number(payerCoveredIdr);
      const patientShare = Math.max(0, gross - discount - payerCovered);

      let depositApplied = 0.00;

      // Auto-apply active deposit if available
      if (applyActiveDeposit) {
        const depRes = await client.query(`
          SELECT * FROM patient_deposit_ledgers
          WHERE encounter_id = $1 AND status IN ('ACTIVE', 'PARTIALLY_APPLIED') AND remaining_balance_idr > 0
          ORDER BY created_at ASC;
        `, [encounterId]);

        let remainingToCover = patientShare;

        for (const dep of depRes.rows) {
          if (remainingToCover <= 0) break;
          const available = Number(dep.remaining_balance_idr);
          const deduction = Math.min(available, remainingToCover);
          depositApplied += deduction;
          remainingToCover -= deduction;

          const newBalance = available - deduction;
          const newStatus = newBalance === 0 ? 'FULLY_APPLIED' : 'PARTIALLY_APPLIED';

          await client.query(`
            UPDATE patient_deposit_ledgers
            SET remaining_balance_idr = $1, status = $2, updated_at = NOW()
            WHERE id = $3;
          `, [newBalance, newStatus, dep.id]);
        }
      }

      const netPatientPayable = Math.max(0, patientShare - depositApplied);
      const invoiceStatus = netPatientPayable === 0 ? 'PAID' : 'ISSUED';

      const invoiceId = crypto.randomUUID();
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      const timestamp = new Date().toISOString();

      const sigPayload = `${invoiceId}|${encounterId}|${payerType}|${netPatientPayable}|${issuedById}|${timestamp}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

      const insertSql = `
        INSERT INTO patient_split_invoices (
          id, invoice_number, encounter_id, patient_id, payer_type,
          total_gross_idr, discount_idr, payer_covered_idr, patient_share_idr,
          deposit_applied_idr, net_patient_payable_idr, paid_amount_idr,
          invoice_status, issued_by_id, issued_by_name, digital_signature_hash,
          correlation_id, issued_at, settled_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), $18, NOW(), NOW())
        RETURNING *;
      `;

      const res = await client.query(insertSql, [
        invoiceId, invoiceNumber, encounterId, patientId, payerType,
        gross, discount, payerCovered, patientShare,
        depositApplied, netPatientPayable,
        invoiceStatus === 'PAID' ? patientShare : 0.00,
        invoiceStatus, issuedById, issuedByName, digitalSignatureHash,
        corrId, invoiceStatus === 'PAID' ? new Date().toISOString() : null
      ]);

      const invoiceRecord = res.rows[0];

      // Record Timeline Event
      await careCoordinationAndTimelineService.recordTimelineEvent({
        encounterId,
        patientId,
        eventCategory: 'PATIENT_FINANCIAL',
        eventTitle: `Penerbitan Tagihan Pasien (${payerType}): ${invoiceNumber}`,
        eventSummary: `Bruto: Rp ${gross.toLocaleString('id-ID')}, Dijamin Penjamin: Rp ${payerCovered.toLocaleString('id-ID')}, Potong Deposit: Rp ${depositApplied.toLocaleString('id-ID')}, Tagihan Pasien: Rp ${netPatientPayable.toLocaleString('id-ID')}. Status: ${invoiceStatus}.`,
        domainSourceTable: 'patient_split_invoices',
        domainSourceId: invoiceRecord.id,
        clinicalSeverity: 'INFO'
      }, actor, clientIp, corrId, client);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type, event_payload, status, correlation_id, created_at
        ) VALUES ($1, 'FINANCIAL', $2, 'PATIENT_INVOICE_ISSUED', $3, 'PENDING', $4, NOW());
      `, [crypto.randomUUID(), invoiceRecord.id, JSON.stringify({ invoiceId: invoiceRecord.id, invoiceNumber, netPatientPayable, invoiceStatus }), corrId]);

      await client.query('COMMIT');
      return invoiceRecord;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * 3. Record Cashier Payment Transaction (Multi-Method: Cash, QRIS, EDC, VA)
   */
  recordCashierPayment: async (payload, actor, clientIp = '127.0.0.1', correlationId = null) => {
    const {
      invoiceId,
      paymentMethod = 'CASH',
      paymentReferenceNumber = null,
      amountPaidIdr,
      cashierShiftId = null
    } = payload;

    if (!invoiceId || !amountPaidIdr || Number(amountPaidIdr) <= 0) {
      throw new PatientFinancialDomainError(
        'Data pembayaran kasir tidak lengkap atau nominal pembayaran tidak valid.',
        'VALIDATION_FAILED',
        400
      );
    }

    const client = await postgresPoolService.getPool().connect();
    const corrId = correlationId || `CORR-PAY-${Date.now()}`;
    const cashierId = actor.userId || actor.id || 'CASHIER-01';
    const cashierName = actor.fullName || actor.name || 'Petugas Kasir';

    try {
      await client.query('BEGIN');

      const invRes = await client.query('SELECT * FROM patient_split_invoices WHERE id = $1', [invoiceId]);
      if (invRes.rows.length === 0) {
        throw new PatientFinancialDomainError('Tagihan invoice tidak ditemukan.', 'NOT_FOUND', 404);
      }

      const invoice = invRes.rows[0];
      if (invoice.invoice_status === 'PAID') {
        throw new PatientFinancialDomainError('Tagihan invoice ini sudah lunas.', 'ALREADY_PAID', 422);
      }

      const netPayable = Number(invoice.net_patient_payable_idr);
      const currentPaid = Number(invoice.paid_amount_idr || 0.00);
      const remainingPayable = Math.max(0, netPayable - currentPaid);

      const paid = Number(amountPaidIdr);
      const changeAmount = paymentMethod === 'CASH' && paid > remainingPayable ? paid - remainingPayable : 0.00;
      const effectivePayment = Math.min(paid, remainingPayable);
      const newTotalPaid = currentPaid + effectivePayment;

      const newInvoiceStatus = newTotalPaid >= netPayable ? 'PAID' : 'PARTIALLY_PAID';

      // Update invoice
      await client.query(`
        UPDATE patient_split_invoices
        SET paid_amount_idr = $1, invoice_status = $2,
            settled_at = CASE WHEN $2 = 'PAID' THEN NOW() ELSE settled_at END,
            updated_at = NOW()
        WHERE id = $3;
      `, [newTotalPaid, newInvoiceStatus, invoiceId]);

      const txId = crypto.randomUUID();
      const transactionNumber = `TX-${Date.now().toString().slice(-6)}`;
      const timestamp = new Date().toISOString();

      const sigPayload = `${txId}|${invoiceId}|${paymentMethod}|${paid}|${cashierId}|${timestamp}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

      const insertSql = `
        INSERT INTO cashier_payment_transactions (
          id, invoice_id, encounter_id, patient_id, transaction_number,
          payment_method, payment_reference_number, amount_paid_idr,
          change_amount_idr, cashier_shift_id, cashier_id, cashier_name,
          digital_signature_hash, correlation_id, paid_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        RETURNING *;
      `;

      const res = await client.query(insertSql, [
        txId, invoiceId, invoice.encounter_id, invoice.patient_id, transactionNumber,
        paymentMethod, paymentReferenceNumber, paid,
        changeAmount, cashierShiftId, cashierId, cashierName,
        digitalSignatureHash, corrId
      ]);

      const paymentRecord = res.rows[0];

      // Record Timeline Event
      await careCoordinationAndTimelineService.recordTimelineEvent({
        encounterId: invoice.encounter_id,
        patientId: invoice.patient_id,
        eventCategory: 'PATIENT_FINANCIAL',
        eventTitle: `Pembayaran Kasir (${paymentMethod}): Rp ${paid.toLocaleString('id-ID')}`,
        eventSummary: `No Transaksi: ${transactionNumber}. Kembalian: Rp ${changeAmount.toLocaleString('id-ID')}. Status Tagihan: ${newInvoiceStatus}. Kasir: ${cashierName}.`,
        domainSourceTable: 'cashier_payment_transactions',
        domainSourceId: paymentRecord.id,
        clinicalSeverity: 'INFO'
      }, actor, clientIp, corrId, client);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type, event_payload, status, correlation_id, created_at
        ) VALUES ($1, 'FINANCIAL', $2, 'CASHIER_PAYMENT_PROCESSED', $3, 'PENDING', $4, NOW());
      `, [crypto.randomUUID(), paymentRecord.id, JSON.stringify({ transactionId: paymentRecord.id, invoiceId, paidAmount: paid, changeAmount, invoiceStatus: newInvoiceStatus }), corrId]);

      await client.query('COMMIT');
      return paymentRecord;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * 4. Execute Financial Adjustment or Refund (Credit Note, Debit Note, Deposit Refund)
   */
  executeFinancialAdjustmentOrRefund: async (payload, actor, clientIp = '127.0.0.1', correlationId = null) => {
    const {
      invoiceId,
      adjustmentType, // 'CREDIT_NOTE', 'DEBIT_NOTE', 'DEPOSIT_REFUND', 'OVERPAYMENT_REFUND'
      amountIdr,
      reasonCategory,
      reasonDetails
    } = payload;

    if (!invoiceId || !adjustmentType || !amountIdr || Number(amountIdr) <= 0 || !reasonCategory || !reasonDetails) {
      throw new PatientFinancialDomainError(
        'Data penyesuaian/refund tidak lengkap. Parameter wajib: invoiceId, adjustmentType, amountIdr, reasonCategory, reasonDetails.',
        'VALIDATION_FAILED',
        400
      );
    }

    const client = await postgresPoolService.getPool().connect();
    const corrId = correlationId || `CORR-ADJ-${Date.now()}`;
    const authorizerId = actor.userId || actor.id || 'FIN-MANAGER-01';
    const authorizerName = actor.fullName || actor.name || 'Manajer Keuangan';

    try {
      await client.query('BEGIN');

      const invRes = await client.query('SELECT * FROM patient_split_invoices WHERE id = $1', [invoiceId]);
      if (invRes.rows.length === 0) {
        throw new PatientFinancialDomainError('Tagihan invoice tidak ditemukan.', 'NOT_FOUND', 404);
      }
      const invoice = invRes.rows[0];

      const adjId = crypto.randomUUID();
      const adjustmentNumber = `ADJ-${Date.now().toString().slice(-6)}`;
      const timestamp = new Date().toISOString();

      const sigPayload = `${adjId}|${invoiceId}|${adjustmentType}|${amountIdr}|${authorizerId}|${timestamp}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

      const insertSql = `
        INSERT INTO financial_adjustments_and_refunds (
          id, invoice_id, encounter_id, patient_id, adjustment_number,
          adjustment_type, amount_idr, reason_category, reason_details,
          authorized_by_id, authorized_by_name, status,
          digital_signature_hash, correlation_id, created_at, executed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'EXECUTED', $12, $13, NOW(), NOW())
        RETURNING *;
      `;

      const res = await client.query(insertSql, [
        adjId, invoiceId, invoice.encounter_id, invoice.patient_id, adjustmentNumber,
        adjustmentType, amountIdr, reasonCategory, reasonDetails,
        authorizerId, authorizerName,
        digitalSignatureHash, corrId
      ]);

      const adjRecord = res.rows[0];

      // Update invoice if CREDIT_NOTE
      if (adjustmentType === 'CREDIT_NOTE') {
        const newNet = Math.max(0, Number(invoice.net_patient_payable_idr) - Number(amountIdr));
        await client.query(`
          UPDATE patient_split_invoices
          SET net_patient_payable_idr = $1, invoice_status = 'CREDITED', updated_at = NOW()
          WHERE id = $2;
        `, [newNet, invoiceId]);
      }

      // Record Timeline Event
      await careCoordinationAndTimelineService.recordTimelineEvent({
        encounterId: invoice.encounter_id,
        patientId: invoice.patient_id,
        eventCategory: 'PATIENT_FINANCIAL',
        eventTitle: `Penyesuaian Finansial (${adjustmentType}): Rp ${Number(amountIdr).toLocaleString('id-ID')}`,
        eventSummary: `Alasan: [${reasonCategory}] ${reasonDetails}. Otorisator: ${authorizerName}.`,
        domainSourceTable: 'financial_adjustments_and_refunds',
        domainSourceId: adjRecord.id,
        clinicalSeverity: 'INFO'
      }, actor, clientIp, corrId, client);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type, event_payload, status, correlation_id, created_at
        ) VALUES ($1, 'FINANCIAL', $2, 'FINANCIAL_ADJUSTMENT_EXECUTED', $3, 'PENDING', $4, NOW());
      `, [crypto.randomUUID(), adjRecord.id, JSON.stringify({ adjustmentId: adjRecord.id, adjustmentType, amountIdr, reasonCategory }), corrId]);

      await client.query('COMMIT');
      return adjRecord;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * 5. End-of-Day Shift Close & Cashier Financial Reconciliation
   */
  reconcileCashierShift: async (payload, actor, clientIp = '127.0.0.1', correlationId = null) => {
    const {
      cashierShiftId = null,
      shiftStart = new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      shiftEnd = new Date().toISOString(),
      expectedCashIdr,
      actualCashCountedIdr,
      totalNonCashIdr = 0.00,
      totalTransactionsCount = 0,
      varianceExplanation = null,
      supervisorSignOffId = null
    } = payload;

    if (expectedCashIdr === undefined || actualCashCountedIdr === undefined) {
      throw new PatientFinancialDomainError(
        'Data penutupan shift kasir tidak lengkap. Nilai expectedCashIdr dan actualCashCountedIdr wajib disertakan.',
        'VALIDATION_FAILED',
        400
      );
    }

    const client = await postgresPoolService.getPool().connect();
    const corrId = correlationId || `CORR-SHIFT-${Date.now()}`;
    const cashierId = actor.userId || actor.id || 'CASHIER-01';
    const cashierName = actor.fullName || actor.name || 'Petugas Kasir Shift';

    try {
      await client.query('BEGIN');

      const expected = Number(expectedCashIdr);
      const actual = Number(actualCashCountedIdr);
      const variance = actual - expected;
      const shiftStatus = variance === 0 ? 'CLOSED_BALANCED' : 'CLOSED_WITH_VARIANCE';

      const shiftId = crypto.randomUUID();
      const shiftNumber = `SFT-REC-${Date.now().toString().slice(-6)}`;
      const timestamp = new Date().toISOString();

      const sigPayload = `${shiftId}|${cashierId}|${expected}|${actual}|${variance}|${timestamp}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

      const insertSql = `
        INSERT INTO cashier_shift_reconciliations (
          id, shift_number, cashier_id, cashier_name, shift_start, shift_end,
          expected_cash_idr, actual_cash_counted_idr, cash_variance_idr,
          total_non_cash_idr, total_transactions_count, shift_status,
          variance_explanation, supervisor_sign_off_id,
          digital_signature_hash, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
        RETURNING *;
      `;

      const res = await client.query(insertSql, [
        shiftId, shiftNumber, cashierId, cashierName, shiftStart, shiftEnd,
        expected, actual, variance,
        totalNonCashIdr, totalTransactionsCount, shiftStatus,
        varianceExplanation, supervisorSignOffId,
        digitalSignatureHash, corrId
      ]);

      const shiftRecord = res.rows[0];

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type, event_payload, status, correlation_id, created_at
        ) VALUES ($1, 'FINANCIAL', $2, 'CASHIER_SHIFT_RECONCILED', $3, 'PENDING', $4, NOW());
      `, [crypto.randomUUID(), shiftRecord.id, JSON.stringify({ shiftId: shiftRecord.id, shiftNumber, shiftStatus, cashVariance: variance }), corrId]);

      await client.query('COMMIT');
      return shiftRecord;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * 6. Manage Accounts Receivable (AR) Aging Lifecycle
   */
  manageAccountsReceivableAging: async (payload, actor, clientIp = '127.0.0.1', correlationId = null) => {
    const {
      invoiceId,
      encounterId,
      patientId,
      payerName,
      originalArAmountIdr,
      currentBalanceIdr,
      agingBucket = 'CURRENT_0_30',
      arStatus = 'OUTSTANDING',
      dueDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    } = payload;

    if (!invoiceId || !encounterId || !patientId || !payerName || !originalArAmountIdr) {
      throw new PatientFinancialDomainError(
        'Data pencatatan piutang (AR) tidak lengkap.',
        'VALIDATION_FAILED',
        400
      );
    }

    const client = await postgresPoolService.getPool().connect();
    const corrId = correlationId || `CORR-AR-${Date.now()}`;
    const arOfficerId = actor.userId || actor.id || 'AR-STAFF-01';

    try {
      await client.query('BEGIN');

      const arId = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      const current = currentBalanceIdr !== undefined ? Number(currentBalanceIdr) : Number(originalArAmountIdr);

      const sigPayload = `${arId}|${invoiceId}|${payerName}|${originalArAmountIdr}|${current}|${timestamp}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

      const insertSql = `
        INSERT INTO accounts_receivable_aging_ledgers (
          id, invoice_id, encounter_id, patient_id, payer_name,
          original_ar_amount_idr, current_balance_idr, aging_bucket,
          ar_status, due_date, digital_signature_hash, correlation_id,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *;
      `;

      const res = await client.query(insertSql, [
        arId, invoiceId, encounterId, patientId, payerName,
        originalArAmountIdr, current, agingBucket,
        arStatus, dueDate, digitalSignatureHash, corrId
      ]);

      const arRecord = res.rows[0];

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type, event_payload, status, correlation_id, created_at
        ) VALUES ($1, 'FINANCIAL', $2, 'ACCOUNTS_RECEIVABLE_UPDATED', $3, 'PENDING', $4, NOW());
      `, [crypto.randomUUID(), arRecord.id, JSON.stringify({ arId: arRecord.id, payerName, currentBalance: current, agingBucket, arStatus }), corrId]);

      await client.query('COMMIT');
      return arRecord;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};
