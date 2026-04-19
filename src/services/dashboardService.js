import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Mendengarkan (listen) metrik bangsal secara Realtime
 * @param {string} wardId - ID dari dokumen ward (e.g., 'central_medical')
 * @param {function} callback - Fungsi yang dijalankan ketika data berubah
 * @returns {function} unsubscribe - Fungsi untuk menghentikan listener
 */
export const listenToWardMetrics = (wardId, callback) => {
  const wardRef = doc(db, 'ward_metrics', wardId);
  
  // onSnapshot akan mem-push data baru secara realtime via WebSocket ke UI kita
  return onSnapshot(wardRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      console.warn("Dokumen Ward tidak ditemukan!");
      // Kembalikan null jika dokumen belum dibuat di Firestore
      callback(null);
    }
  }, (error) => {
    console.error("Error mendengarkan metrik bangsal:", error);
  });
};

/**
 * Mendengarkan (listen) daftar alert triage secara Realtime
 * @param {function} callback - Fungsi yang dijalankan ketika data alert berubah
 * @returns {function} unsubscribe 
 */
export const listenToAlerts = (callback) => {
  const alertsRef = collection(db, 'alerts');
  
  return onSnapshot(alertsRef, (querySnapshot) => {
    const alertsList = [];
    let highRiskCount = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      alertsList.push({ id: doc.id, ...data });
      if (data.type === 'High Risk Patient') {
        highRiskCount++;
      }
    });
    
    callback({
      total: alertsList.length,
      highRiskCount: highRiskCount,
      allAlerts: alertsList
    });
  });
};
