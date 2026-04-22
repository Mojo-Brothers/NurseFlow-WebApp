/**
 * Pharmacy Inventory Domain — Service Layer
 * Manages drug stock levels with atomic transaction support.
 */
import { 
  collection, getDocs, doc, runTransaction, query, orderBy 
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
 * Pengurangan stok secara atomik saat obat diserahkan (Dispensed).
 * @param {Array} medications - List of items to deduct { id, qty }
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
      
      const currentStock = medSnap.data().stock_quantity || 0;
      const newStock = currentStock - (med.qty || 1);
      
      if (newStock < 0) {
        throw new Error(`Stok tidak mencukupi untuk ${med.medication_name}. Sisa: ${currentStock}`);
      }
      
      transaction.update(medRef, { 
        stock_quantity: newStock,
        updated_at: new Date()
      });
      
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
    transaction.update(medRef, { 
      stock_quantity: newQuantity,
      updated_at: new Date()
    });
  });
};
