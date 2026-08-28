/**
 * Billing Domain — Service Layer (PostgreSQL 16 Authoritative)
 * Managing Patient Invoicing, Multi-Payer Splits, and Cashier Settlements.
 * Standards: Joint Commission International (JCI), Permenkes 24/2022, ACID Transactions
 */

import { apiClient, requestApi } from '../../../core/apiClient.js';
import { assertClinicalContextLock } from '../../../core/clinicalRuntimeSafetyContract.js';

/**
 * Membuat faktur tagihan pasien langsung di PostgreSQL 16.
 */
export const createBill = async ({ encounterId, patientId, createdBy }) => {
  assertClinicalContextLock({ patientId, encounterId, actorId: createdBy, role: 'CASHIER' });

  const payload = {
    encounterId,
    patientId,
    payerCategory: 'PERSONAL_CASH',
    invoiceType: 'FINAL_BILL',
    coverageType: 'GENERAL_CARE',
    lineItems: []
  };

  const res = await apiClient.patientFinancial.generateSplitInvoice(payload);
  if (!res.ok) throw new Error(res.error || 'Gagal menerbitkan faktur tagihan di PostgreSQL');
  return res.data?.id || res.data?.invoice_number;
};

/**
 * Tambah / update line items tagihan di PostgreSQL.
 */
export const updateBillItems = async (billId, lineItems, updatedBy) => {
  const res = await requestApi(`/api/v1/patient-financial/invoices/${billId}/items`, {
    method: 'PUT',
    body: { lineItems, updatedBy }
  });
  if (!res.ok) throw new Error(res.error || 'Gagal memperbarui item tagihan');
  return res.data;
};

/**
 * Finalize tagihan (mengunci invoice).
 */
export const finalizeBill = async (billId, finalizedBy) => {
  const res = await requestApi(`/api/v1/patient-financial/invoices/${billId}/finalize`, {
    method: 'POST',
    body: { finalizedBy }
  });
  if (!res.ok) throw new Error(res.error || 'Gagal memfinalisasi faktur tagihan');
  return res.data;
};

/**
 * Tandai tagihan sebagai LUNAS + discharge encounter secara atomik di PostgreSQL.
 */
export const markAsPaid = async (billId, paidBy, paymentDetails = {}) => {
  const payload = {
    invoiceId: billId,
    amount: paymentDetails.amount || 0,
    paymentMethod: paymentDetails.method || 'CASH',
    cashierName: paidBy || 'Petugas Kasir'
  };

  const res = await apiClient.patientFinancial.recordPayment(payload);
  if (!res.ok) throw new Error(res.error || 'Gagal memproses pelunasan pembayaran di PostgreSQL');
  return res.data;
};

/**
 * Ambil tagihan untuk satu encounter dari PostgreSQL.
 */
export const getBillByEncounter = async (encounterId) => {
  try {
    const res = await requestApi(`/api/v1/patient-financial/invoices/encounter/${encounterId}`);
    if (res.ok && res.data) {
      return res.data;
    }
    return null;
  } catch (err) {
    console.error('[BillingService] Failed to fetch invoice by encounter:', err);
    return null;
  }
};

/**
 * Ambil semua tagihan tertunda dari PostgreSQL.
 */
export const getPendingBills = async () => {
  try {
    const res = await requestApi('/api/v1/patient-financial/invoices?status=UNPAID');
    if (res.ok && res.data) {
      return Array.isArray(res.data) ? res.data : (res.data.data || []);
    }
    return [];
  } catch (err) {
    console.error('[BillingService] Failed to fetch pending bills:', err);
    return [];
  }
};
