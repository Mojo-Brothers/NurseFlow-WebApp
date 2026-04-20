/**
 * Core Domain — Telemetry Service (V10 Chaos Resilience)
 * Memantau kesehatan "Mesin" NurseFlow secara historis.
 */

import {
  collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { COLLECTIONS, SYSTEM_HEALTH_THRESHOLDS } from '../constants.js';

/**
 * Mencatat snapshot performa sistem saat ini.
 * @param {Object} metrics - { latency, sync_rate, active_sessions, fallback_active }
 */
export const recordSystemPulse = async (metrics) => {
  try {
    const pulseRef = await addDoc(collection(db, COLLECTIONS.SYSTEM_METRICS), {
      ...metrics,
      timestamp: serverTimestamp(),
      mode: metrics.latency > SYSTEM_HEALTH_THRESHOLDS.LATENCY_MAX ? 'DEGRADED' : 'OPTIMAL'
    });
    return pulseRef.id;
  } catch (error) {
    console.error('[Telemetry] Failed to record system pulse:', error);
    return null;
  }
};

/**
 * Mengambil tren latensi terakhir untuk visualisasi (Pattern Recognition).
 */
export const fetchLatencyTrend = async (count = 20) => {
  const q = query(
    collection(db, COLLECTIONS.SYSTEM_METRICS),
    orderBy('timestamp', 'desc'),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    timestamp: d.data().timestamp,
    latency: d.data().latency
  })).reverse();
};
