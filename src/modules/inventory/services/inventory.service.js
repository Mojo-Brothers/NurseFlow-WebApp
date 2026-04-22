import { db } from '../../../core/firebase.js';
import { collection, doc, getDocs, updateDoc, increment, query, where } from 'firebase/firestore';
import { COLLECTIONS } from '../../../core/constants.js';

/**
 * InventoryService — Intelligent supply chain management for clinical assets.
 */

export const getInventoryLevels = async () => {
  const snap = await getDocs(collection(db, COLLECTIONS.INVENTORY));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const deductStock = async (medicationId, quantity, location = 'MAIN_PHARMACY') => {
  const q = query(
    collection(db, COLLECTIONS.INVENTORY), 
    where('medication_id', '==', medicationId),
    where('location', '==', location)
  );
  
  const snap = await getDocs(q);
  if (!snap.empty) {
    const stockDoc = snap.docs[0];
    await updateDoc(doc(db, COLLECTIONS.INVENTORY, stockDoc.id), {
      current_stock: increment(-quantity),
      last_transaction: new Date()
    });
    return true;
  }
  return false;
};

/**
 * Predictive Forecast: Estimates days of supply remaining based on consumption velocity.
 */
export const getPredictiveForecast = (stockItem) => {
  const avgDailyConsumption = stockItem.avg_daily_usage || 5; 
  const daysLeft = Math.floor(stockItem.current_stock / avgDailyConsumption);
  
  return {
    daysRemaining: daysLeft,
    status: daysLeft < 3 ? 'CRITICAL' : daysLeft < 7 ? 'WARNING' : 'OPTIMAL',
    reorderSuggested: daysLeft < 7
  };
};

export const bootstrapInventory = async () => {
  // Utility to seed initial stock for testing
};
