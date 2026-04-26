/**
 * Pharmacy Inventory Domain — Service Layer
 * Manages drug stock levels with atomic transaction support.
 */
import { 
  collection, getDocs, doc, runTransaction, query, orderBy, where, addDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { COLLECTIONS } from '../../../core/constants.js';

/**
 * Mengambil seluruh status stok obat.
 */
export const getInventoryStatus = async () => {
  try {
    const q = query(collection(db, COLLECTIONS.INVENTORY), orderBy('medication_name', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('[InventoryService] Fetch failed:', err);
    throw err;
  }
};

/**
 * Helper to check and trigger/resolve inventory alerts.
 * Deterministic ID ensure atomicity and prevents duplicates.
 */
const checkAndTriggerAlert = async (transaction, medId, medData, newStock) => {
  const reorderLevel = medData.reorder_level || 20;
  const alertId = `stock_vigilance_${medId}`;
  const alertRef = doc(db, COLLECTIONS.ALERTS, alertId);
  
  if (newStock <= reorderLevel) {
    // Create or update active alert
    transaction.set(alertRef, {
      type: 'INVENTORY',
      severity: newStock === 0 ? 'CRITICAL' : 'HIGH',
      title: `Low Stock: ${medData.medication_name}`,
      message: `${medData.medication_name} stock is at ${newStock}, below threshold ${reorderLevel}.`,
      metadata: {
        medication_id: medId,
        current_stock: newStock,
        reorder_level: reorderLevel
      },
      status: 'ACTIVE',
      updated_at: serverTimestamp()
    }, { merge: true });
  } else {
    // If stock is now healthy, auto-resolve any existing active alert for this item
    const alertSnap = await transaction.get(alertRef);
    if (alertSnap.exists() && alertSnap.data().status === 'ACTIVE') {
      transaction.update(alertRef, {
        status: 'RESOLVED',
        resolved_at: serverTimestamp()
      });
    }
  }
};

/**
 * Pengurangan stok secara atomik saat obat diserahkan (Dispensed).
 */
export const deductStockTransaction = async (medications) => {
  return runTransaction(db, async (transaction) => {
    const results = [];
    
    for (const med of medications) {
      const medRef = doc(db, COLLECTIONS.INVENTORY, med.id);
      const medSnap = await transaction.get(medRef);
      
      if (!medSnap.exists()) {
        throw new Error(`Obat ${med.medication_name} tidak ditemukan di gudang.`);
      }
      
      const medData = medSnap.data();
      const currentStock = medData.stock_quantity || 0;
      const newStock = currentStock - (med.qty || 1);
      
      if (newStock < 0) {
        throw new Error(`Stok tidak mencukupi untuk ${med.medication_name}. Sisa: ${currentStock}`);
      }
      
      transaction.update(medRef, { 
        stock_quantity: newStock,
        updated_at: serverTimestamp()
      });
      
      // Trigger alert if low stock
      await checkAndTriggerAlert(transaction, med.id, medData, newStock);
      
      results.push({ id: med.id, medName: med.medication_name, remaining: newStock });
    }
    
    return results;
  });
};

/**
 * Pengurangan stok berdasarkan NAMA OBAT (untuk integrasi EMR/Pharmacy).
 */
export const deductByName = async (medName, qty = 1) => {
  const q = query(collection(db, COLLECTIONS.INVENTORY), where('medication_name', '==', medName));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error(`Obat "${medName}" tidak ditemukan di database inventory.`);
  
  const medDoc = snap.docs[0];
  return deductStockTransaction([{ id: medDoc.id, medication_name: medName, qty }]);
};

/**
 * Penambahan stok manual (Restock).
 */
export const updateStockLevel = async (medId, newQuantity) => {
  const medRef = doc(db, COLLECTIONS.INVENTORY, medId);
  return runTransaction(db, async (transaction) => {
    const medSnap = await transaction.get(medRef);
    if (!medSnap.exists()) throw new Error("Medication not found.");
    const medData = medSnap.data();
    
    transaction.update(medRef, { 
      stock_quantity: newQuantity,
      updated_at: serverTimestamp()
    });

    // Auto-resolve or trigger alert based on new level
    await checkAndTriggerAlert(transaction, medId, medData, newQuantity);
  });
};
