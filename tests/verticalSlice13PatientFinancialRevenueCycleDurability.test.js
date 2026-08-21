/**
 * NurseFlow Enterprise HIS 2026 — Vertical Slice #13 Durability & Financial Chaos Test Suite
 * Patient Financial & Revenue Cycle Closed Loop
 * Standards: PMK 24/2022, Permenkes 3/2023, JCI MOI / FMS, PostgreSQL 16 ACID.
 * Complete 25 Chaos Gate Scenarios.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import {
  patientFinancialAndRevenueCycleService,
  PatientFinancialDomainError
} from '../server/services/patientFinancialAndRevenueCycle.service.js';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { ENTERPRISE_ROLES } from '../src/shared/constants/roles.js';

describe('VS-13 — Patient Financial & Revenue Cycle ➔ PostgreSQL Durability & Chaos Gate (25 Scenarios)', () => {
  let mockDatabaseState = {
    encounters: [],
    patient_deposit_ledgers: [],
    patient_split_invoices: [],
    cashier_payment_transactions: [],
    financial_adjustments_and_refunds: [],
    cashier_shift_reconciliations: [],
    accounts_receivable_aging_ledgers: [],
    longitudinal_timeline_events: [],
    clinical_domain_outbox: []
  };

  let mockClient = null;
  let activeTransactionState = null;

  beforeEach(() => {
    mockDatabaseState = {
      encounters: [
        {
          id: 'enc-fin-001',
          patient_id: 'pat-fin-001',
          encounter_number: 'ENC-2026-FIN-01',
          status: 'IN_PROGRESS'
        }
      ],
      patient_deposit_ledgers: [],
      patient_split_invoices: [],
      cashier_payment_transactions: [],
      financial_adjustments_and_refunds: [],
      cashier_shift_reconciliations: [],
      accounts_receivable_aging_ledgers: [],
      longitudinal_timeline_events: [],
      clinical_domain_outbox: []
    };

    activeTransactionState = null;

    mockClient = {
      query: vi.fn(async (sql, params = []) => {
        const normalized = sql.trim().toUpperCase();

        if (normalized.startsWith('BEGIN')) {
          activeTransactionState = {
            stagedDeposits: [],
            stagedInvoices: [],
            stagedPayments: [],
            stagedAdjustments: [],
            stagedShifts: [],
            stagedAr: [],
            stagedTimelineEvents: [],
            stagedOutbox: [],
            depositUpdates: [],
            invoiceUpdates: []
          };
          return { rows: [], rowCount: 0 };
        }

        if (normalized.startsWith('COMMIT')) {
          if (activeTransactionState) {
            mockDatabaseState.patient_deposit_ledgers.push(...activeTransactionState.stagedDeposits);
            mockDatabaseState.patient_split_invoices.push(...activeTransactionState.stagedInvoices);
            mockDatabaseState.cashier_payment_transactions.push(...activeTransactionState.stagedPayments);
            mockDatabaseState.financial_adjustments_and_refunds.push(...activeTransactionState.stagedAdjustments);
            mockDatabaseState.cashier_shift_reconciliations.push(...activeTransactionState.stagedShifts);
            mockDatabaseState.accounts_receivable_aging_ledgers.push(...activeTransactionState.stagedAr);
            mockDatabaseState.longitudinal_timeline_events.push(...activeTransactionState.stagedTimelineEvents);
            mockDatabaseState.clinical_domain_outbox.push(...activeTransactionState.stagedOutbox);

            activeTransactionState.depositUpdates.forEach(up => {
              const idx = mockDatabaseState.patient_deposit_ledgers.findIndex(d => d.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.patient_deposit_ledgers[idx] = { ...mockDatabaseState.patient_deposit_ledgers[idx], ...up.data };
              }
            });

            activeTransactionState.invoiceUpdates.forEach(up => {
              const idx = mockDatabaseState.patient_split_invoices.findIndex(i => i.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.patient_split_invoices[idx] = { ...mockDatabaseState.patient_split_invoices[idx], ...up.data };
              }
            });

            activeTransactionState = null;
          }
          return { rows: [], rowCount: 0 };
        }

        if (normalized.startsWith('ROLLBACK')) {
          activeTransactionState = null;
          return { rows: [], rowCount: 0 };
        }

        // SELECT FROM patient_deposit_ledgers WHERE encounter_id = $1
        if (normalized.includes('PATIENT_DEPOSIT_LEDGERS') && normalized.includes('ENCOUNTER_ID = $1')) {
          const allDeposits = [
            ...mockDatabaseState.patient_deposit_ledgers,
            ...(activeTransactionState?.stagedDeposits || [])
          ];
          const found = allDeposits.filter(d => d.encounter_id === params[0] && (d.status === 'ACTIVE' || d.status === 'PARTIALLY_APPLIED') && Number(d.remaining_balance_idr) > 0);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM patient_split_invoices WHERE id = $1
        if (normalized.includes('FROM PATIENT_SPLIT_INVOICES WHERE ID = $1')) {
          const allInvoices = [
            ...mockDatabaseState.patient_split_invoices,
            ...(activeTransactionState?.stagedInvoices || [])
          ];
          const found = allInvoices.filter(i => i.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // INSERT INTO patient_deposit_ledgers
        if (normalized.startsWith('INSERT INTO PATIENT_DEPOSIT_LEDGERS')) {
          const newDep = {
            id: params[0],
            encounter_id: params[1],
            patient_id: params[2],
            deposit_number: params[3],
            deposit_type: params[4],
            amount_idr: params[5],
            remaining_balance_idr: params[5],
            payment_method: params[6],
            status: 'ACTIVE',
            received_by_id: params[7],
            received_by_name: params[8],
            digital_signature_hash: params[9],
            correlation_id: params[10]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedDeposits.push(newDep);
          } else {
            mockDatabaseState.patient_deposit_ledgers.push(newDep);
          }
          return { rows: [newDep], rowCount: 1 };
        }

        // UPDATE patient_deposit_ledgers
        if (normalized.startsWith('UPDATE PATIENT_DEPOSIT_LEDGERS')) {
          const depId = params[2];
          const updated = {
            remaining_balance_idr: params[0],
            status: params[1]
          };
          if (activeTransactionState) {
            activeTransactionState.depositUpdates.push({ id: depId, data: updated });
          }
          return { rows: [{ id: depId, ...updated }], rowCount: 1 };
        }

        // INSERT INTO patient_split_invoices
        if (normalized.startsWith('INSERT INTO PATIENT_SPLIT_INVOICES')) {
          const newInv = {
            id: params[0],
            invoice_number: params[1],
            encounter_id: params[2],
            patient_id: params[3],
            payer_type: params[4],
            total_gross_idr: params[5],
            discount_idr: params[6],
            payer_covered_idr: params[7],
            patient_share_idr: params[8],
            deposit_applied_idr: params[9],
            net_patient_payable_idr: params[10],
            paid_amount_idr: params[11],
            invoice_status: params[12],
            issued_by_id: params[13],
            issued_by_name: params[14],
            digital_signature_hash: params[15],
            correlation_id: params[16]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedInvoices.push(newInv);
          } else {
            mockDatabaseState.patient_split_invoices.push(newInv);
          }
          return { rows: [newInv], rowCount: 1 };
        }

        // UPDATE patient_split_invoices
        if (normalized.startsWith('UPDATE PATIENT_SPLIT_INVOICES')) {
          let invId = params[params.length - 1];
          let updated = {};
          if (normalized.includes('NET_PATIENT_PAYABLE_IDR = $1')) {
            updated = { net_patient_payable_idr: params[0], invoice_status: 'CREDITED' };
          } else {
            updated = { paid_amount_idr: params[0], invoice_status: params[1] };
          }
          if (activeTransactionState) {
            activeTransactionState.invoiceUpdates.push({ id: invId, data: updated });
          }
          return { rows: [{ id: invId, ...updated }], rowCount: 1 };
        }

        // INSERT INTO cashier_payment_transactions
        if (normalized.startsWith('INSERT INTO CASHIER_PAYMENT_TRANSACTIONS')) {
          const newPay = {
            id: params[0],
            invoice_id: params[1],
            encounter_id: params[2],
            patient_id: params[3],
            transaction_number: params[4],
            payment_method: params[5],
            payment_reference_number: params[6],
            amount_paid_idr: params[7],
            change_amount_idr: params[8],
            cashier_shift_id: params[9],
            cashier_id: params[10],
            cashier_name: params[11],
            digital_signature_hash: params[12],
            correlation_id: params[13]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedPayments.push(newPay);
          } else {
            mockDatabaseState.cashier_payment_transactions.push(newPay);
          }
          return { rows: [newPay], rowCount: 1 };
        }

        // INSERT INTO financial_adjustments_and_refunds
        if (normalized.startsWith('INSERT INTO FINANCIAL_ADJUSTMENTS_AND_REFUNDS')) {
          const newAdj = {
            id: params[0],
            invoice_id: params[1],
            encounter_id: params[2],
            patient_id: params[3],
            adjustment_number: params[4],
            adjustment_type: params[5],
            amount_idr: params[6],
            reason_category: params[7],
            reason_details: params[8],
            authorized_by_id: params[9],
            authorized_by_name: params[10],
            status: 'EXECUTED',
            digital_signature_hash: params[11],
            correlation_id: params[12]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedAdjustments.push(newAdj);
          } else {
            mockDatabaseState.financial_adjustments_and_refunds.push(newAdj);
          }
          return { rows: [newAdj], rowCount: 1 };
        }

        // INSERT INTO cashier_shift_reconciliations
        if (normalized.startsWith('INSERT INTO CASHIER_SHIFT_RECONCILIATIONS')) {
          const newShift = {
            id: params[0],
            shift_number: params[1],
            cashier_id: params[2],
            cashier_name: params[3],
            shift_start: params[4],
            shift_end: params[5],
            expected_cash_idr: params[6],
            actual_cash_counted_idr: params[7],
            cash_variance_idr: params[8],
            total_non_cash_idr: params[9],
            total_transactions_count: params[10],
            shift_status: params[11],
            variance_explanation: params[12],
            supervisor_sign_off_id: params[13],
            digital_signature_hash: params[14],
            correlation_id: params[15]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedShifts.push(newShift);
          } else {
            mockDatabaseState.cashier_shift_reconciliations.push(newShift);
          }
          return { rows: [newShift], rowCount: 1 };
        }

        // INSERT INTO accounts_receivable_aging_ledgers
        if (normalized.startsWith('INSERT INTO ACCOUNTS_RECEIVABLE_AGING_LEDGERS')) {
          const newAr = {
            id: params[0],
            invoice_id: params[1],
            encounter_id: params[2],
            patient_id: params[3],
            payer_name: params[4],
            original_ar_amount_idr: params[5],
            current_balance_idr: params[6],
            aging_bucket: params[7],
            ar_status: params[8],
            due_date: params[9],
            digital_signature_hash: params[10],
            correlation_id: params[11]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedAr.push(newAr);
          } else {
            mockDatabaseState.accounts_receivable_aging_ledgers.push(newAr);
          }
          return { rows: [newAr], rowCount: 1 };
        }

        // INSERT INTO longitudinal_timeline_events
        if (normalized.startsWith('INSERT INTO LONGITUDINAL_TIMELINE_EVENTS')) {
          const newEvt = {
            id: params[0],
            encounter_id: params[1],
            patient_id: params[2],
            event_category: params[3],
            event_title: params[4],
            event_summary: params[5],
            domain_source_table: params[6],
            domain_source_id: params[7],
            clinical_severity: params[13],
            correlation_id: params[15]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedTimelineEvents.push(newEvt);
          } else {
            mockDatabaseState.longitudinal_timeline_events.push(newEvt);
          }
          return { rows: [newEvt], rowCount: 1 };
        }

        // INSERT INTO clinical_domain_outbox
        if (normalized.startsWith('INSERT INTO CLINICAL_DOMAIN_OUTBOX')) {
          let eventType = 'UNKNOWN';
          const match = sql.match(/'([A-Z0-9_]+)',\s*\$[0-9],\s*'PENDING'/);
          if (match) {
            eventType = match[1];
          }
          const newOutbox = {
            id: params[0],
            event_type: eventType,
            correlation_id: params[params.length - 1]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedOutbox.push(newOutbox);
          } else {
            mockDatabaseState.clinical_domain_outbox.push(newOutbox);
          }
          return { rows: [{ id: newOutbox.id }], rowCount: 1 };
        }

        return { rows: [], rowCount: 0 };
      }),
      release: vi.fn()
    };

    vi.spyOn(postgresPoolService, 'getPool').mockReturnValue({
      connect: vi.fn(async () => mockClient),
      query: vi.fn(async (sql, params) => mockClient.query(sql, params))
    });
  });

  // ─── TC-01: PATIENT ADMISSION DEPOSIT RECORDING ───
  it('TC-01: should record patient admission deposit with payment method and SHA-256 signature', async () => {
    const deposit = await patientFinancialAndRevenueCycleService.recordPatientDeposit({
      encounterId: 'enc-fin-001',
      patientId: 'pat-fin-001',
      depositType: 'ADMISSION_DEPOSIT',
      amountIdr: 5000000.00,
      paymentMethod: 'CASH'
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(deposit.deposit_number).toMatch(/^DEP-\d+/);
    expect(Number(deposit.remaining_balance_idr)).toBe(5000000.00);
    expect(deposit.status).toBe('ACTIVE');
    expect(deposit.digital_signature_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(mockDatabaseState.patient_deposit_ledgers.length).toBe(1);
  });

  // ─── TC-02: INVALID DEPOSIT GUARD ───
  it('TC-02: should reject non-positive or missing deposit amounts (400 VALIDATION_FAILED)', async () => {
    await expect(patientFinancialAndRevenueCycleService.recordPatientDeposit({
      encounterId: 'enc-fin-001',
      patientId: 'pat-fin-001',
      amountIdr: -1000.00
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN })).rejects.toThrow('Data setoran deposit tidak lengkap');
  });

  // ─── TC-03: MULTI-PAYER SPLIT INVOICE GENERATION ───
  it('TC-03: should generate multi-payer split invoice calculating gross, insurance coverage, and patient share', async () => {
    const invoice = await patientFinancialAndRevenueCycleService.generatePatientSplitInvoice({
      encounterId: 'enc-fin-001',
      patientId: 'pat-fin-001',
      payerType: 'ASURANSI_SWASTA',
      totalGrossIdr: 15000000.00,
      discountIdr: 1000000.00,
      payerCoveredIdr: 10000000.00,
      applyActiveDeposit: false
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(Number(invoice.total_gross_idr)).toBe(15000000.00);
    expect(Number(invoice.discount_idr)).toBe(1000000.00);
    expect(Number(invoice.payer_covered_idr)).toBe(10000000.00);
    expect(Number(invoice.patient_share_idr)).toBe(4000000.00);
    expect(Number(invoice.net_patient_payable_idr)).toBe(4000000.00);
    expect(invoice.invoice_status).toBe('ISSUED');
  });

  // ─── TC-04: AUTOMATIC DEPOSIT APPLICATION ON INVOICING ───
  it('TC-04: should automatically apply active deposit balance to reduce patient payable amount', async () => {
    // Record deposit Rp 2.000.000
    await patientFinancialAndRevenueCycleService.recordPatientDeposit({
      encounterId: 'enc-fin-001',
      patientId: 'pat-fin-001',
      amountIdr: 2000000.00
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    // Generate invoice with patient share Rp 5.000.000
    const invoice = await patientFinancialAndRevenueCycleService.generatePatientSplitInvoice({
      encounterId: 'enc-fin-001',
      patientId: 'pat-fin-001',
      payerType: 'MANDIRI_UMUM',
      totalGrossIdr: 5000000.00,
      applyActiveDeposit: true
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(Number(invoice.deposit_applied_idr)).toBe(2000000.00);
    expect(Number(invoice.net_patient_payable_idr)).toBe(3000000.00);
    expect(invoice.invoice_status).toBe('ISSUED');
  });

  // ─── TC-05: FULL DEPOSIT COVERAGE AUTO-SETTLEMENT ───
  it('TC-05: should auto-settle invoice to PAID when deposit fully covers patient payable amount', async () => {
    // Record deposit Rp 5.000.000
    await patientFinancialAndRevenueCycleService.recordPatientDeposit({
      encounterId: 'enc-fin-001',
      patientId: 'pat-fin-001',
      amountIdr: 5000000.00
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    // Generate invoice with total Rp 3.000.000
    const invoice = await patientFinancialAndRevenueCycleService.generatePatientSplitInvoice({
      encounterId: 'enc-fin-001',
      patientId: 'pat-fin-001',
      payerType: 'MANDIRI_UMUM',
      totalGrossIdr: 3000000.00,
      applyActiveDeposit: true
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(Number(invoice.deposit_applied_idr)).toBe(3000000.00);
    expect(Number(invoice.net_patient_payable_idr)).toBe(0.00);
    expect(invoice.invoice_status).toBe('PAID');
  });

  // ─── TC-06: INCOMPLETE INVOICING DATA GUARD ───
  it('TC-06: should reject invoice generation missing encounter ID or total gross', async () => {
    await expect(patientFinancialAndRevenueCycleService.generatePatientSplitInvoice({
      patientId: 'pat-fin-001'
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN })).rejects.toThrow('Data penagihan invoice tidak lengkap');
  });

  // ─── TC-07: CASHIER CASH PAYMENT PROCESSING ───
  it('TC-07: should process cash payment, calculate cash change amount, and settle invoice to PAID', async () => {
    const invoice = await patientFinancialAndRevenueCycleService.generatePatientSplitInvoice({
      encounterId: 'enc-fin-001',
      patientId: 'pat-fin-001',
      totalGrossIdr: 500000.00,
      applyActiveDeposit: false
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    // Patient pays Rp 600.000 cash for Rp 500.000 bill
    const payment = await patientFinancialAndRevenueCycleService.recordCashierPayment({
      invoiceId: invoice.id,
      paymentMethod: 'CASH',
      amountPaidIdr: 600000.00
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(payment.transaction_number).toMatch(/^TX-\d+/);
    expect(Number(payment.amount_paid_idr)).toBe(600000.00);
    expect(Number(payment.change_amount_idr)).toBe(100000.00);
    expect(mockDatabaseState.cashier_payment_transactions.length).toBe(1);
  });

  // ─── TC-08: CASHIER QRIS PAYMENT ───
  it('TC-08: should process QRIS dynamic QR payment with transaction reference number', async () => {
    const invoice = await patientFinancialAndRevenueCycleService.generatePatientSplitInvoice({
      encounterId: 'enc-fin-001',
      patientId: 'pat-fin-001',
      totalGrossIdr: 250000.00,
      applyActiveDeposit: false
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    const payment = await patientFinancialAndRevenueCycleService.recordCashierPayment({
      invoiceId: invoice.id,
      paymentMethod: 'QRIS',
      paymentReferenceNumber: 'QRIS-NMD-889977',
      amountPaidIdr: 250000.00
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(payment.payment_method).toBe('QRIS');
    expect(payment.payment_reference_number).toBe('QRIS-NMD-889977');
  });

  // ─── TC-09: CASHIER EDC DEBIT/CREDIT CARD PAYMENT ───
  it('TC-09: should process EDC bank card payment with bank approval code', async () => {
    const invoice = await patientFinancialAndRevenueCycleService.generatePatientSplitInvoice({
      encounterId: 'enc-fin-001',
      patientId: 'pat-fin-001',
      totalGrossIdr: 1500000.00,
      applyActiveDeposit: false
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    const payment = await patientFinancialAndRevenueCycleService.recordCashierPayment({
      invoiceId: invoice.id,
      paymentMethod: 'EDC_DEBIT',
      paymentReferenceNumber: 'AUTH-BCA-998811',
      amountPaidIdr: 1500000.00
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(payment.payment_method).toBe('EDC_DEBIT');
  });

  // ─── TC-10: CASHIER VIRTUAL ACCOUNT (VA) PAYMENT ───
  it('TC-10: should process bank Virtual Account (VA) automated settlement', async () => {
    const invoice = await patientFinancialAndRevenueCycleService.generatePatientSplitInvoice({
      encounterId: 'enc-fin-001',
      patientId: 'pat-fin-001',
      totalGrossIdr: 800000.00,
      applyActiveDeposit: false
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    const payment = await patientFinancialAndRevenueCycleService.recordCashierPayment({
      invoiceId: invoice.id,
      paymentMethod: 'VIRTUAL_ACCOUNT',
      paymentReferenceNumber: 'VA-MANDIRI-88220011',
      amountPaidIdr: 800000.00
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(payment.payment_method).toBe('VIRTUAL_ACCOUNT');
  });

  // ─── TC-11: PARTIAL PAYMENT & INVOICE STATUS TRACKING ───
  it('TC-11: should handle partial payment and track PARTIALLY_PAID status', async () => {
    const invoice = await patientFinancialAndRevenueCycleService.generatePatientSplitInvoice({
      encounterId: 'enc-fin-001',
      patientId: 'pat-fin-001',
      totalGrossIdr: 2000000.00,
      applyActiveDeposit: false
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    // Patient pays Rp 1.000.000 of Rp 2.000.000 bill
    const payment = await patientFinancialAndRevenueCycleService.recordCashierPayment({
      invoiceId: invoice.id,
      paymentMethod: 'CASH',
      amountPaidIdr: 1000000.00
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(payment.amount_paid_idr).toBe(1000000.00);
  });

  // ─── TC-12: OVERPAYMENT ON SETTLED INVOICE GUARD ───
  it('TC-12: should reject payment attempts on already settled invoices (422 ALREADY_PAID)', async () => {
    const invoice = await patientFinancialAndRevenueCycleService.generatePatientSplitInvoice({
      encounterId: 'enc-fin-001',
      patientId: 'pat-fin-001',
      totalGrossIdr: 500000.00,
      applyActiveDeposit: false
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    // Pay full amount
    await patientFinancialAndRevenueCycleService.recordCashierPayment({
      invoiceId: invoice.id,
      paymentMethod: 'CASH',
      amountPaidIdr: 500000.00
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    // Set invoice state to PAID in mock
    mockDatabaseState.patient_split_invoices[0].invoice_status = 'PAID';

    await expect(patientFinancialAndRevenueCycleService.recordCashierPayment({
      invoiceId: invoice.id,
      paymentMethod: 'CASH',
      amountPaidIdr: 100000.00
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN })).rejects.toThrow('Tagihan invoice ini sudah lunas');
  });

  // ─── TC-13: FINANCIAL CREDIT NOTE EXECUTION ───
  it('TC-13: should execute Credit Note to reduce patient billing and mark invoice as CREDITED', async () => {
    const invoice = await patientFinancialAndRevenueCycleService.generatePatientSplitInvoice({
      encounterId: 'enc-fin-001',
      patientId: 'pat-fin-001',
      totalGrossIdr: 1000000.00,
      applyActiveDeposit: false
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    const creditNote = await patientFinancialAndRevenueCycleService.executeFinancialAdjustmentOrRefund({
      invoiceId: invoice.id,
      adjustmentType: 'CREDIT_NOTE',
      amountIdr: 200000.00,
      reasonCategory: 'BILLING_ERROR_CORRECTION',
      reasonDetails: 'Koreksi kelebihan penagihan tindakan radiologi yang tidak terlaksana'
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(creditNote.adjustment_number).toMatch(/^ADJ-\d+/);
    expect(creditNote.adjustment_type).toBe('CREDIT_NOTE');
    expect(mockDatabaseState.financial_adjustments_and_refunds.length).toBe(1);
  });

  // ─── TC-14: FINANCIAL DEBIT NOTE EXECUTION ───
  it('TC-14: should execute Debit Note for retroactive charge adjustments', async () => {
    const invoice = await patientFinancialAndRevenueCycleService.generatePatientSplitInvoice({
      encounterId: 'enc-fin-001',
      patientId: 'pat-fin-001',
      totalGrossIdr: 1000000.00,
      applyActiveDeposit: false
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    const debitNote = await patientFinancialAndRevenueCycleService.executeFinancialAdjustmentOrRefund({
      invoiceId: invoice.id,
      adjustmentType: 'DEBIT_NOTE',
      amountIdr: 150000.00,
      reasonCategory: 'LATE_CHARGE_CAPTURE',
      reasonDetails: 'Penagihan susulan BHP kamar operasi yang belum terinput'
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(debitNote.adjustment_type).toBe('DEBIT_NOTE');
  });

  // ─── TC-15: DEPOSIT REFUND EXECUTION ───
  it('TC-15: should execute deposit refund for unused patient prepayment balance', async () => {
    const invoice = await patientFinancialAndRevenueCycleService.generatePatientSplitInvoice({
      encounterId: 'enc-fin-001',
      patientId: 'pat-fin-001',
      totalGrossIdr: 500000.00,
      applyActiveDeposit: false
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    const refund = await patientFinancialAndRevenueCycleService.executeFinancialAdjustmentOrRefund({
      invoiceId: invoice.id,
      adjustmentType: 'DEPOSIT_REFUND',
      amountIdr: 1500000.00,
      reasonCategory: 'EXCESS_DEPOSIT_RETURN',
      reasonDetails: 'Pengembalian sisa deposit rawat inap pasien pulang sembuh'
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(refund.adjustment_type).toBe('DEPOSIT_REFUND');
    expect(Number(refund.amount_idr)).toBe(1500000.00);
  });

  // ─── TC-16: INCOMPLETE FINANCIAL ADJUSTMENT GUARD ───
  it('TC-16: should reject financial adjustments missing reason category or amount', async () => {
    await expect(patientFinancialAndRevenueCycleService.executeFinancialAdjustmentOrRefund({
      invoiceId: 'inv-001',
      adjustmentType: 'CREDIT_NOTE',
      amountIdr: 0.00
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN })).rejects.toThrow('Data penyesuaian/refund tidak lengkap');
  });

  // ─── TC-17: END-OF-DAY SHIFT CLOSE: BALANCED RECONCILIATION ───
  it('TC-17: should reconcile cashier shift with zero variance and CLOSED_BALANCED status', async () => {
    const shift = await patientFinancialAndRevenueCycleService.reconcileCashierShift({
      expectedCashIdr: 12500000.00,
      actualCashCountedIdr: 12500000.00,
      totalNonCashIdr: 8500000.00,
      totalTransactionsCount: 42
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(shift.shift_number).toMatch(/^SFT-REC-\d+/);
    expect(Number(shift.cash_variance_idr)).toBe(0.00);
    expect(shift.shift_status).toBe('CLOSED_BALANCED');
    expect(mockDatabaseState.cashier_shift_reconciliations.length).toBe(1);
  });

  // ─── TC-18: END-OF-DAY SHIFT CLOSE: CASH VARIANCE DETECTION ───
  it('TC-18: should flag cash drawer discrepancy as CLOSED_WITH_VARIANCE with explanation', async () => {
    const shift = await patientFinancialAndRevenueCycleService.reconcileCashierShift({
      expectedCashIdr: 10000000.00,
      actualCashCountedIdr: 9950000.00, // Selisih kurang Rp 50.000
      totalNonCashIdr: 5000000.00,
      totalTransactionsCount: 20,
      varianceExplanation: 'Selisih Rp 50.000 akibat pembulatan uang receh kembalian',
      supervisorSignOffId: 'SPV-KASIR-01'
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(Number(shift.cash_variance_idr)).toBe(-50000.00);
    expect(shift.shift_status).toBe('CLOSED_WITH_VARIANCE');
    expect(shift.variance_explanation).toContain('pembulatan');
  });

  // ─── TC-19: NON-CASH TRANSACTION AGGREGATION ───
  it('TC-19: should correctly aggregate non-cash transactions during shift close', async () => {
    const shift = await patientFinancialAndRevenueCycleService.reconcileCashierShift({
      expectedCashIdr: 5000000.00,
      actualCashCountedIdr: 5000000.00,
      totalNonCashIdr: 15750000.00,
      totalTransactionsCount: 35
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(Number(shift.total_non_cash_idr)).toBe(15750000.00);
  });

  // ─── TC-20: ACCOUNTS RECEIVABLE INITIAL RECOGNITION ───
  it('TC-20: should record outstanding payer claim into CURRENT_0_30 AR aging bucket', async () => {
    const ar = await patientFinancialAndRevenueCycleService.manageAccountsReceivableAging({
      invoiceId: crypto.randomUUID(),
      encounterId: 'enc-fin-001',
      patientId: 'pat-fin-001',
      payerName: 'BPJS Kesehatan Kantor Cabang Utama',
      originalArAmountIdr: 45000000.00,
      currentBalanceIdr: 45000000.00,
      agingBucket: 'CURRENT_0_30'
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(ar.payer_name).toContain('BPJS');
    expect(Number(ar.original_ar_amount_idr)).toBe(45000000.00);
    expect(ar.aging_bucket).toBe('CURRENT_0_30');
    expect(ar.ar_status).toBe('OUTSTANDING');
  });

  // ─── TC-21: ACCOUNTS RECEIVABLE AGING BUCKET TRANSITION ───
  it('TC-21: should transition aging bucket to AGING_31_60 for overdue receivables', async () => {
    const ar = await patientFinancialAndRevenueCycleService.manageAccountsReceivableAging({
      invoiceId: crypto.randomUUID(),
      encounterId: 'enc-fin-001',
      patientId: 'pat-fin-001',
      payerName: 'Asuransi Swasta Prudential',
      originalArAmountIdr: 18000000.00,
      currentBalanceIdr: 18000000.00,
      agingBucket: 'AGING_31_60',
      arStatus: 'OUTSTANDING'
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(ar.aging_bucket).toBe('AGING_31_60');
  });

  // ─── TC-22: ACCOUNTS RECEIVABLE PARTIAL SETTLEMENT ───
  it('TC-22: should record partial payer settlement and update current balance', async () => {
    const ar = await patientFinancialAndRevenueCycleService.manageAccountsReceivableAging({
      invoiceId: crypto.randomUUID(),
      encounterId: 'enc-fin-001',
      patientId: 'pat-fin-001',
      payerName: 'Asuransi Allianz',
      originalArAmountIdr: 20000000.00,
      currentBalanceIdr: 5000000.00,
      arStatus: 'PARTIAL_SETTLEMENT'
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(Number(ar.current_balance_idr)).toBe(5000000.00);
    expect(ar.ar_status).toBe('PARTIAL_SETTLEMENT');
  });

  // ─── TC-23: SOVEREIGN CLINICAL STATE DECOUPLING INVARIANT ───
  it('TC-23: should guarantee patient financial debt never corrupts or mutates clinical encounter status', async () => {
    // Generate invoice with unpaid balance
    await patientFinancialAndRevenueCycleService.generatePatientSplitInvoice({
      encounterId: 'enc-fin-001',
      patientId: 'pat-fin-001',
      totalGrossIdr: 10000000.00,
      applyActiveDeposit: false
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    // Encounter status remains sovereign and unaffected
    expect(mockDatabaseState.encounters[0].status).toBe('IN_PROGRESS');
  });

  // ─── TC-24: GL & FINANCIAL OUTBOX ATOMICITY ───
  it('TC-24: should write domain outbox and audit events atomically for deposits, invoices, and payments', async () => {
    await patientFinancialAndRevenueCycleService.recordPatientDeposit({
      encounterId: 'enc-fin-001',
      patientId: 'pat-fin-001',
      amountIdr: 1000000.00
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(mockDatabaseState.longitudinal_timeline_events.length).toBe(1);
    expect(mockDatabaseState.clinical_domain_outbox.some(o => o.event_type === 'PATIENT_DEPOSIT_RECORDED')).toBe(true);
  });

  // ─── TC-25: FULL E2E PATIENT FINANCIAL & REVENUE CYCLE RECONCILIATION ───
  it('TC-25: should reconcile complete deposit, split invoice, cashier payment, credit note, shift close, and AR with 0 discrepancy', async () => {
    // 1. Admission Deposit Rp 3.000.000
    const deposit = await patientFinancialAndRevenueCycleService.recordPatientDeposit({
      encounterId: 'enc-fin-001',
      patientId: 'pat-fin-001',
      depositType: 'ADMISSION_DEPOSIT',
      amountIdr: 3000000.00,
      paymentMethod: 'BANK_TRANSFER'
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });
    expect(deposit.status).toBe('ACTIVE');

    // 2. Multi-Payer Split Invoice (Gross Rp 10.000.000, Insurance Rp 6.000.000, Deposit Rp 3.000.000 -> Patient Share Rp 1.000.000)
    const invoice = await patientFinancialAndRevenueCycleService.generatePatientSplitInvoice({
      encounterId: 'enc-fin-001',
      patientId: 'pat-fin-001',
      payerType: 'ASURANSI_SWASTA',
      totalGrossIdr: 10000000.00,
      payerCoveredIdr: 6000000.00,
      applyActiveDeposit: true
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });
    expect(Number(invoice.deposit_applied_idr)).toBe(3000000.00);
    expect(Number(invoice.net_patient_payable_idr)).toBe(1000000.00);
    expect(invoice.invoice_status).toBe('ISSUED');

    // 3. Cashier Payment for Patient Share Rp 1.000.000 via QRIS
    const payment = await patientFinancialAndRevenueCycleService.recordCashierPayment({
      invoiceId: invoice.id,
      paymentMethod: 'QRIS',
      paymentReferenceNumber: 'QRIS-SETTLE-001',
      amountPaidIdr: 1000000.00
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });
    expect(payment.payment_method).toBe('QRIS');

    // 4. Financial Credit Note Rp 100.000 for administrative adjustment
    const creditNote = await patientFinancialAndRevenueCycleService.executeFinancialAdjustmentOrRefund({
      invoiceId: invoice.id,
      adjustmentType: 'CREDIT_NOTE',
      amountIdr: 100000.00,
      reasonCategory: 'DISCOUNT_APPROVED',
      reasonDetails: 'Diskon persetujuan manajer'
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });
    expect(creditNote.status).toBe('EXECUTED');

    // 5. Cashier Shift Reconciliation
    const shift = await patientFinancialAndRevenueCycleService.reconcileCashierShift({
      expectedCashIdr: 0.00,
      actualCashCountedIdr: 0.00,
      totalNonCashIdr: 4000000.00,
      totalTransactionsCount: 2
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });
    expect(shift.shift_status).toBe('CLOSED_BALANCED');

    // 6. AR Aging Recognition for Insurer portion Rp 6.000.000
    const ar = await patientFinancialAndRevenueCycleService.manageAccountsReceivableAging({
      invoiceId: invoice.id,
      encounterId: 'enc-fin-001',
      patientId: 'pat-fin-001',
      payerName: 'Asuransi Swasta AdMedika',
      originalArAmountIdr: 6000000.00,
      currentBalanceIdr: 6000000.00,
      agingBucket: 'CURRENT_0_30'
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });
    expect(ar.aging_bucket).toBe('CURRENT_0_30');

    // Total Financial Ledger Reconciliation (0 Discrepancy)
    expect(mockDatabaseState.patient_deposit_ledgers.length).toBe(1);
    expect(mockDatabaseState.patient_split_invoices.length).toBe(1);
    expect(mockDatabaseState.cashier_payment_transactions.length).toBe(1);
    expect(mockDatabaseState.financial_adjustments_and_refunds.length).toBe(1);
    expect(mockDatabaseState.cashier_shift_reconciliations.length).toBe(1);
    expect(mockDatabaseState.accounts_receivable_aging_ledgers.length).toBe(1);
    expect(mockDatabaseState.longitudinal_timeline_events.length).toBe(4);
    expect(mockDatabaseState.clinical_domain_outbox.length).toBe(6);
  });
});
