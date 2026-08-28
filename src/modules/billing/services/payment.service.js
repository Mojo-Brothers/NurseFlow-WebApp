/**
 * Billing & Payment Domain — Service Layer
 * Centralizes revenue management and simulated payment processing.
 */
import { db } from '../../../core/firebase.js';
import { 
  collection, doc, getDoc, getDocs, query, where, 
  serverTimestamp, runTransaction 
} from 'firebase/firestore';
import { COLLECTIONS, AUDIT_ACTIONS } from '../../../core/constants.js';
import { assertClinicalContextLock } from '../../../core/clinicalRuntimeSafetyContract.js';

/**
 * Payment & Revenue Breakdown Service (ASC - Phase 30)
 * JCI Standard for Financial Reconciliation & Multi-source settlement.
 */
export const getBillingBreakdown = async (encounterId) => {
  try {
    // 1. Fetch Billing Record
    const bQuery = query(collection(db, COLLECTIONS.BILLING), where('encounter_id', '==', encounterId));
    const bSnap = await getDocs(bQuery);
    if (bSnap.empty) throw new Error('Billing record not found.');
    
    const billingData = { id: bSnap.docs[0].id, ...bSnap.docs[0].data() };
    
    // 2. Fetch Pharmacy Charges (Simulation: Base price + markup)
    const pQuery = query(collection(db, COLLECTIONS.PHARMACY_QUEUE), where('encounter_id', '==', encounterId));
    const pSnap = await getDocs(pQuery);
    const pharmacyCharges = pSnap.docs.map(d => ({
      name: d.data().medication_name,
      qty: 1,
      price: 15000, // Harga flat demo per item
      total: 15000
    }));

    // 3. Static Charges (Bed, Admin, Diagnostics)
    const staticCharges = [
      { name: 'Admission & Admin Fee', total: 50000 },
      { name: 'Room/Bed Charge (General)', total: 250000 },
      { name: 'Diagnostic/Lab Services', total: 75000 }
    ];

    const grandTotal = [...pharmacyCharges, ...staticCharges].reduce((acc, curr) => acc + curr.total, 0);

    return {
      billingId: billingData.id,
      items: [...pharmacyCharges, ...staticCharges],
      grandTotal,
      status: billingData.status,
      patientId: billingData.patient_id
    };
  } catch (err) {
    console.error('[PaymentService] Breakdown failed:', err);
    throw err;
  }
};

/**
 * Simulasi pemrosesan pembayaran digital.
 */
export const processSimulatedPayment = async (billingId, method) => {
  assertClinicalContextLock({ patientId: 'PATIENT_FINANCIAL', encounterId: billingId, actorId: 'CASHIER', role: 'CASHIER' });

  return runTransaction(db, async (transaction) => {
    const bRef = doc(db, COLLECTIONS.BILLING, billingId);
    const bSnap = await transaction.get(bRef);
    
    if (!bSnap.exists()) throw new Error('Billing record not found.');
    
    transaction.update(bRef, {
      status: 'PAID',
      payment_method: method,
      paid_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });

    // Log Transaction
    const pRef = doc(collection(db, COLLECTIONS.PAYMENTS));
    transaction.set(pRef, {
      billing_id: billingId,
      amount: bSnap.data().total_amount || 0,
      method: method,
      status: 'SUCCESS',
      created_at: serverTimestamp()
    });

    return { success: true, transactionId: pRef.id };
  });
};
