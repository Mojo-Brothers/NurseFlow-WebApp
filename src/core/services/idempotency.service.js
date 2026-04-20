/**
 * NurseFlow — core/services/idempotency.service.js
 * 
 * JCI-Grade Distributed Integrity:
 * Menjamin sebuah operasi (seperti billing atau dosis obat) hanya dieksekusi tepat satu kali.
 * Menggunakan Atomic Transaction Lock di Firestore.
 */

import { db } from '../firebase.js';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '../constants.js';

/**
 * Membungkus fungsi asinkron dalam transaksi kunci idempotensi.
 * @param {string} operationId - Unique ID untuk operasi (misal: "billing_enc123_q4")
 * @param {Function} action - Callback async yang berisi logika bisnis
 * @returns {Promise<any>} Hasil dari action
 */
export const executeAtomicOperation = async (operationId, action) => {
  if (!operationId) {
    console.warn('[Idempotency] No Operation ID provided. Proceeding without protection...');
    return await action();
  }

  const lockRef = doc(db, COLLECTIONS.IDEMPOTENCY_LOCKS, operationId);

  try {
    return await runTransaction(db, async (transaction) => {
      const lockDoc = await transaction.get(lockRef);

      if (lockDoc.exists()) {
        const data = lockDoc.data();
        console.warn(`[Idempotency] Duplicate detected for ${operationId}. Status: ${data.status}`);
        
        // Jika sudah sukses, kembalikan hasil sebelumnya (jika ada)
        if (data.status === 'SUCCESS') {
          return data.result;
        }
        
        throw new Error(`CONCURRENCY_ERROR: Operation ${operationId} is already ${data.status}`);
      }

      // 1. Kunci operasi dengan status PENDING
      transaction.set(lockRef, {
        status: 'PENDING',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      try {
        // 2. Jalankan aksi bisnis
        const result = await action(transaction);

        // 3. Update status menjadi SUCCESS dan simpan hasil (opsional)
        transaction.update(lockRef, {
          status: 'SUCCESS',
          result: result || null,
          updated_at: serverTimestamp()
        });

        return result;
      } catch (error) {
        // 4. Jika gagal, tandai sebagai FAILED agar bisa di-retry secara eksplisit
        transaction.update(lockRef, {
          status: 'FAILED',
          error: error.message,
          updated_at: serverTimestamp()
        });
        throw error;
      }
    });
  } catch (error) {
    if (error.message.includes('CONCURRENCY_ERROR')) {
      console.error('[Idempotency] Transaction Aborted: Duplicate request blocked.');
    }
    throw error;
  }
};
