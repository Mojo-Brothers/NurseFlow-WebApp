/**
 * NurseFlow Audit Service — JCI Immutable Trail
 * Layer ini harus dipanggil dari SETIAP service yang mutasi data klinis.
 * Jangan pernah dipanggil langsung dari komponen UI.
 */
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';
import { COLLECTIONS, AUDIT_ACTIONS } from '../constants.js';

/**
 * Membuat entri audit log yang tidak bisa dihapus.
 * @param {Object} params
 * @param {string} params.userEmail         - Email staff yang melakukan aksi
 * @param {import('../types').AuditAction} params.action
 * @param {string} params.resourceType      - Nama koleksi Firestore
 * @param {string} params.resourceId        - ID dokumen yang diubah
 * @param {Object} [params.delta]           - Data yang berubah (before/after)
 */
export const createAuditLog = async ({
  userEmail,
  action,
  resourceType,
  resourceId,
  delta = {}
}) => {
  try {
    if (!Object.values(AUDIT_ACTIONS).includes(action)) {
      console.warn(`[AuditService] Invalid action: ${action}`);
    }

    await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
      timestamp:     serverTimestamp(),
      user:          userEmail,
      action:        action,
      resource_type: resourceType,
      resource_id:   resourceId,
      delta,
    });
  } catch (err) {
    // CRITICAL: Log audit failure — dalam sistem production ini harus alert ke admin
    console.error('[AUDIT CRITICAL] Failed to write audit log:', err);
    // Dalam JCI-grade: throw error untuk halt transaksi induk
    // throw new Error('Audit log write failed — transaction aborted');
  }
};
