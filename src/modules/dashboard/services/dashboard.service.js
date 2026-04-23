import { collection, doc, onSnapshot, query, orderBy, limit, setDoc } from 'firebase/firestore';
import { db } from '../../../core/firebase.js';

export const listenToMetrics = (callback) => {
  // Since metrics is usually a singleton document for the main hospital facility
  // Query specific document for main facility metrics
  const docRef = doc(db, 'system_metrics', 'main_facility');
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      // Return defaults if not seeded yet
      callback({
        triageLevels: { active: 0, l1: 0, l2: 0, l3: 0 },
        ventilators: { total: 0, available: 0 },
        bedOccupancy: { rate: 0 }
      });
    }
  }, (error) => {
    console.error("Error listening to metrics:", error);
    callback(null, error);
  });
};

export const listenToActiveTriage = (callback) => {
  // Query triage_logs, ordered by severity
  const q = query(
    collection(db, 'triage_logs'),
    orderBy('news2_score', 'desc'),
    limit(20)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const patients = [];
    querySnapshot.forEach((doc) => {
      patients.push({ id: doc.id, ...doc.data() });
    });
    callback(patients);
  }, (error) => {
    console.error("Error listening to active triage:", error);
    callback([], error);
  });
};

export const listenToAuditLogs = (callback) => {
  // Query the latest 10 audit logs
  const q = query(
    collection(db, 'audit_logs'),
    orderBy('timestamp', 'desc'),
    limit(15)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const logs = [];
    querySnapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    callback(logs);
  }, (error) => {
    console.error("Error listening to audit logs:", error);
    callback([], error);
  });
};
