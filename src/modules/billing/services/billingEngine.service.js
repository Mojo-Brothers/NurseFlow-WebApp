/**
 * NurseFlow Enterprise HIS 2026 — Master Billing & Revenue Cycle Management Engine
 * Sprint 5.5: Charge Master, Invoice Settlement, Multi-Payment & INA-CBGs Claim Engine
 * Standar Kepatuhan: PMK No. 24/2022, BPJS INA-CBGs & KARS FMS.
 */

import { outboxPublisherService } from '../../front_office/services/outboxPublisher.service.js';

const INVOICES_STORAGE_KEY = 'nurseflow_hospital_invoices';
const BILLING_LEDGER_KEY = 'nurseflow_billing_projections_ledger';

let memoryInvoices = [];

const getStoredLedger = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(BILLING_LEDGER_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[BillingEngine] Failed to load ledger:', e);
  }
  return [];
};

const getStoredInvoices = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(INVOICES_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[BillingEngine] Failed to load invoices:', e);
  }
  return memoryInvoices;
};

const saveStoredInvoices = (list) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('[BillingEngine] Failed to save invoices:', e);
  }
  memoryInvoices = list;
};

export const billingEngineService = {
  /**
   * Aggregate All Ledger Charges for an Episode into an Invoice
   */
  generateInvoice: async ({
    episodeId = 'EOC-001',
    patientId = 'P-001',
    patientName = '-',
    guarantorType = 'BPJS',
    cashierName = 'Kasir Utama',
    actorEmail = 'cashier@nurseflow.id'
  } = {}) => {
    const ledger = getStoredLedger();
    const episodeCharges = ledger.filter(c => c.episode_id === episodeId);

    const totalGross = episodeCharges.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
    const isBpjs = guarantorType === 'BPJS';
    const insuranceCovered = isBpjs ? totalGross : 0;
    const patientPayable = isBpjs ? 0 : totalGross;

    const invoiceNumber = `INV-2026-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const invoice = {
      id: `INV-${Date.now()}`,
      invoice_number: invoiceNumber,
      episode_id: episodeId,
      patient_id: patientId,
      patient_name: patientName,
      total_gross: totalGross,
      discount_amount: 0,
      insurance_covered: insuranceCovered,
      patient_payable: patientPayable,
      paid_amount: 0,
      payment_status: 'ISSUED',
      items_count: episodeCharges.length,
      cashier_name: cashierName,
      created_at: now,
      settled_at: null
    };

    const invoices = getStoredInvoices();
    saveStoredInvoices([invoice, ...invoices]);

    return invoice;
  },

  /**
   * Settle & Pay Invoice
   */
  settlePayment: async ({
    invoiceId,
    paymentMethod = 'QRIS', // 'CASH' | 'QRIS' | 'DEBIT' | 'BPJS_CLAIM'
    paidAmount = 0,
    actorEmail = 'cashier@nurseflow.id'
  }) => {
    const list = getStoredInvoices();
    const index = list.findIndex(i => i.id === invoiceId);
    if (index === -1) throw new Error(`Invoice ${invoiceId} tidak ditemukan.`);

    const inv = list[index];
    const now = new Date().toISOString();

    inv.paid_amount = Number(paidAmount) || inv.patient_payable;
    inv.payment_status = 'SETTLED';
    inv.payment_method = paymentMethod;
    inv.settled_at = now;

    list[index] = inv;
    saveStoredInvoices(list);

    await outboxPublisherService.stageEvent({
      aggregateType: 'INVOICE',
      aggregateId: inv.id,
      eventName: 'INVOICE_SETTLED',
      payload: inv,
      actor: actorEmail
    });

    return inv;
  },

  /**
   * Calculate INA-CBGs Tariff & Variance
   */
  calculateInacbgVariance: (hospitalTariff, cbgTariff) => {
    const diff = Number(cbgTariff) - Number(hospitalTariff);
    return {
      hospitalTariff: Number(hospitalTariff),
      cbgTariff: Number(cbgTariff),
      variance: diff,
      status: diff >= 0 ? 'PROFITABLE_SURPLUS' : 'POTENTIAL_DEFICIT'
    };
  },

  getInvoices: () => getStoredInvoices()
};
