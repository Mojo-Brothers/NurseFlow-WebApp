/**
 * Billing Domain — Service Layer
 * Mengelola tagihan pasien dan proses discharge resmi.
 * Billing bersifat immutable setelah di-finalize.
 */
import {
  collection, addDoc, getDocs, query,
  where, orderBy, updateDoc, doc, serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { COLLECTIONS, AUDIT_ACTIONS, ENCOUNTER_STATUSES } from '../../../core/constants.js';
import { createAuditLog } from '../../../core/audit/audit.service.js';

/**
 * @typedef {'DRAFT' | 'FINALIZED' | 'PAID' | 'WAIVED'} BillingStatus
 */

/**
 * Membuat tagihan awal saat encounter dibuka.
 */
export const createBill = async ({ encounterId, patientId, createdBy }) => {
  const payload = {
    encounter_id:  encounterId,
    patient_id:    patientId,
    line_items:    [],           // Array: { description, qty, unit_price, total }
    subtotal:      0,
    discount:      0,
    total:         0,
    status:        'DRAFT',
    created_at:    serverTimestamp(),
    created_by:    createdBy,
    finalized_at:  null,
    paid_at:       null,
    notes:         '',
  };
  const ref = await addDoc(collection(db, 'billing'), payload);

  await createAuditLog({
    userEmail:    createdBy,
    action:       AUDIT_ACTIONS.CREATE,
    resourceType: 'billing',
    resourceId:   ref.id,
    delta:        { encounterId, patientId },
  });

  return ref.id;
};

/**
 * Tambah / update line items tagihan.
 */
export const updateBillItems = async (billId, lineItems, updatedBy) => {
  const subtotal = lineItems.reduce((sum, i) => sum + i.total, 0);
  const ref = doc(db, 'billing', billId);
  await updateDoc(ref, { line_items: lineItems, subtotal, total: subtotal });

  await createAuditLog({
    userEmail:    updatedBy,
    action:       AUDIT_ACTIONS.UPDATE,
    resourceType: 'billing',
    resourceId:   billId,
    delta:        { lineItems, subtotal },
  });
};

/**
 * Finalize tagihan (tidak bisa diedit lagi).
 */
export const finalizeBill = async (billId, finalizedBy) => {
  await updateDoc(doc(db, 'billing', billId), {
    status:       'FINALIZED',
    finalized_at: serverTimestamp(),
  });

  await createAuditLog({
    userEmail:    finalizedBy,
    action:       AUDIT_ACTIONS.UPDATE,
    resourceType: 'billing',
    resourceId:   billId,
    delta:        { status: { before: 'DRAFT', after: 'FINALIZED' } },
  });
};

/**
 * Tandai tagihan sebagai LUNAS + discharge encounter secara atomik.
 */
export const markAsPaid = async (billId, paidBy) => {
  const billRef = doc(db, COLLECTIONS.BILLING, billId);

  try {
    await runTransaction(db, async (transaction) => {
      const billSnap = await transaction.get(billRef);
      if (!billSnap.exists()) throw new Error('Tagihan tidak ditemukan.');
      const billData = billSnap.data();

      const timestamp = serverTimestamp();

      // 1. Update status Billing
      transaction.update(billRef, {
        status:  'PAID',
        paid_at: timestamp,
      });

      // 2. Automated Discharge (JCI Requirement: Account Closure)
      if (billData.encounter_id) {
        const encounterRef = doc(db, COLLECTIONS.ENCOUNTERS, billData.encounter_id);
        transaction.update(encounterRef, {
          status:     ENCOUNTER_STATUSES.DISCHARGED,
          updated_at: timestamp,
          updated_by: paidBy
        });
      }

      // 3. Persistent Audit Logging
      const auditRef = doc(collection(db, COLLECTIONS.AUDIT_LOGS));
      transaction.set(auditRef, {
        timestamp,
        user:          paidBy,
        action:        AUDIT_ACTIONS.UPDATE,
        resource_type: COLLECTIONS.BILLING,
        resource_id:   billId,
        reason:        'PAYMENT_RECEIVED_AND_ENCOUNTER_CLOSED',
        delta: { 
          billing_status: 'PAID',
          encounter_status: ENCOUNTER_STATUSES.DISCHARGED
        },
        source: 'WEB_APP_BILLING_GATE'
      });
    });
  } catch (err) {
    console.error('[BillingService] Payment transaction failed:', err);
    throw err;
  }
};

/**
 * Ambil tagihan untuk satu encounter.
 */
export const getBillByEncounter = async (encounterId) => {
  const q = query(
    collection(db, 'billing'),
    where('encounter_id', '==', encounterId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
};

/**
 * Ambil semua tagihan DRAFT (belum dibayar).
 */
export const getPendingBills = async () => {
  const q = query(
    collection(db, 'billing'),
    where('status', 'in', ['DRAFT', 'FINALIZED']),
    orderBy('created_at', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
