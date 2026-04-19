/**
 * Billing Domain — Service Layer
 * Mengelola tagihan pasien dan proses discharge resmi.
 * Billing bersifat immutable setelah di-finalize.
 */
import {
  collection, addDoc, getDocs, query,
  where, orderBy, updateDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../core/firebase.js';
import { COLLECTIONS, AUDIT_ACTIONS } from '../../core/constants.js';
import { createAuditLog } from '../../core/audit/auditService.js';

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
 * Tandai tagihan sebagai LUNAS + discharge encounter.
 */
export const markAsPaid = async (billId, paidBy) => {
  await updateDoc(doc(db, 'billing', billId), {
    status:  'PAID',
    paid_at: serverTimestamp(),
  });

  await createAuditLog({
    userEmail:    paidBy,
    action:       AUDIT_ACTIONS.UPDATE,
    resourceType: 'billing',
    resourceId:   billId,
    delta:        { status: { before: 'FINALIZED', after: 'PAID' } },
  });
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
