/**
 * NurseFlow — System Observability Service
 * ✅ Request Tracing (Trace ID)
 * ✅ Sync Health Monitoring
 * ✅ Latency Tracking
 */

import { db } from '../firebase.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const trackMetric = async (type, payload) => {
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    const metric = {
      type,
      ...payload,
      requestId,
      timestamp: serverTimestamp(),
      environment: import.meta.env.MODE,
    };

    // [Observability] Production Hardened

    
    // In a real production environment, we might use a dedicated metrics store
    // but for this HIS, we use a Firestore metrics collection.
    await addDoc(collection(db, 'system_metrics'), metric);
    
    return requestId;
  } catch (err) {
    console.warn('[Observability] Failed to log metric:', err);
    return null;
  }
};

/**
 * Higher-level monitoring helpers
 */
export const monitorSync = (success, duration, error = null) => {
  trackMetric('SYNC_OPERATION', {
    status: success ? 'SUCCESS' : 'FAILURE',
    duration_ms: duration,
    error: error?.message || null,
  });
};

export const monitorTriage = (latencyMs, tamperDetected) => {
  trackMetric('TRIAGE_PERFORMANCE', {
    latency_ms: latencyMs,
    tamper_detected: tamperDetected
  });
};
