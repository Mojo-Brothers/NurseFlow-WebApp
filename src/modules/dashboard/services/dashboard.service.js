import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../core/firebase.js';

/**
 * Mendengarkan (listen) metrik bangsal secara Realtime
 */
export const listenToWardMetrics = (wardId, callback) => {
  const wardRef = doc(db, 'ward_metrics', wardId);
  return onSnapshot(wardRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      console.warn("Dokumen Ward tidak ditemukan!");
      callback(null);
    }
  }, (error) => {
    console.error("Error mendengarkan metrik bangsal:", error);
  });
};

/**
 * Mendengarkan (listen) daftar alert triage secara Realtime
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
