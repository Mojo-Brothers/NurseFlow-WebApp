/**
 * Analytics Domain — Service Layer
 * Aggregates clinical and operational data for management dashboards.
 */
import { 
  collection, getDocs, query, where 
} from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { COLLECTIONS, ENCOUNTER_STATUSES } from '../../../core/constants.js';

/**
 * Mengambil metrik klinis makro dari seluruh bangsal.
 */
export const getClinicalMetrics = async () => {
  try {
    const [encountersSnap, bedsSnap] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.ENCOUNTERS)),
      getDocs(collection(db, COLLECTIONS.BEDS))
    ]);

    const activeEncounters = encountersSnap.docs
      .map(d => d.data())
      .filter(e => ![ENCOUNTER_STATUSES.DISCHARGED, ENCOUNTER_STATUSES.CANCELLED].includes(e.status));

    const totalBeds = bedsSnap.size;
    const occupiedBeds = bedsSnap.docs.filter(d => d.data().is_occupied).length;

    // 1. Clinical Intensity (Avg NEWS2)
    const news2Scores = activeEncounters.map(e => e.last_news2 || 0);
    const avgNews2 = news2Scores.length > 0 
      ? (news2Scores.reduce((a, b) => a + b, 0) / news2Scores.length).toFixed(1)
      : 0;

    // 2. Risk Distribution
    const riskDist = {
      STABLE:   news2Scores.filter(s => s <= 2).length,
      MEDIUM:   news2Scores.filter(s => s >= 3 && s <= 6).length,
      CRITICAL: news2Scores.filter(s => s >= 7).length,
    };

    // 3. Operational Throughput
    const occupancyRate = totalBeds > 0 
      ? ((occupiedBeds / totalBeds) * 100).toFixed(1)
      : 0;

    return {
      activePatients: activeEncounters.length,
      totalBeds,
      occupiedBeds,
      occupancyRate,
      avgNews2,
      riskDist,
      criticalCount: riskDist.CRITICAL
    };
  } catch (err) {
    console.error('[AnalyticsService] Metric aggregation failed:', err);
    throw err;
  }
};
