/**
 * Pharmacy Inventory Domain — Service Layer
 * Manages drug stock levels with atomic transaction support.
 */
import { 
  collection, getDocs, doc, runTransaction, query, orderBy, where, addDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { COLLECTIONS } from '../../../core/constants.js';

export const DEFAULT_PHARMACY_ITEMS = [
  { id: 'pharm-001', medication_name: 'Paracetamol 500mg Tablet', stock_quantity: 450, unit: 'Tablets', reorder_level: 100, category: 'OBAT' },
  { id: 'pharm-002', medication_name: 'Amoxicillin 500mg Kaplet', stock_quantity: 200, unit: 'Capsules', reorder_level: 50, category: 'OBAT' },
  { id: 'pharm-003', medication_name: 'Ceftriaxone Inj 1gr Vial', stock_quantity: 18, unit: 'Vials', reorder_level: 25, category: 'INJEKSI' },
  { id: 'pharm-004', medication_name: 'Cairan Infus NaCl 0.9% 500ml', stock_quantity: 120, unit: 'Botol', reorder_level: 30, category: 'BMHP' },
  { id: 'pharm-005', medication_name: 'Insulin Glargine 100 IU/ml Pen', stock_quantity: 8, unit: 'Pens', reorder_level: 15, category: 'OBAT' },
  { id: 'pharm-006', medication_name: 'Morphine Injection 10mg/ml Ampul', stock_quantity: 0, unit: 'Ampuls', reorder_level: 10, category: 'NARKOTIKA' },
  { id: 'pharm-007', medication_name: 'Furosemide Injection 20mg/2ml Ampul', stock_quantity: 75, unit: 'Ampuls', reorder_level: 20, category: 'INJEKSI' },
  { id: 'pharm-008', medication_name: 'Asam Mefenamat 500mg Kaplet', stock_quantity: 340, unit: 'Tablets', reorder_level: 50, category: 'OBAT' }
];

/**
 * Mengambil seluruh status stok obat.
 */
export const getInventoryStatus = async () => {
  try {
    const q = query(collection(db, COLLECTIONS.INVENTORY), orderBy('medication_name', 'asc'));
    const snap = await getDocs(q);
    if (snap.empty) return DEFAULT_PHARMACY_ITEMS;
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('[InventoryService] Fetch failed, returning default seed:', err);
    return DEFAULT_PHARMACY_ITEMS;
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
