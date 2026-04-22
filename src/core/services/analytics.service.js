import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase.js';
import { COLLECTIONS } from '../constants.js';

/**
 * AnalyticsService — The "Brain" for hospital operational intelligence.
 * Aggregates data for BOR, ALOS, and Clinical Safety.
 */
export const fetchHospitalKPIs = async () => {
  // 1. Fetch Encounters
  const encountersSnap = await getDocs(collection(db, COLLECTIONS.ENCOUNTERS));
  const encounters = encountersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // 2. Calculate BOR (Bed Occupancy Ratio)
  // Simulation: total beds = 50
  const TOTAL_BEDS = 50;
  const activeEncounters = encounters.filter(e => e.status === 'ACTIVE');
  const bor = (activeEncounters.length / TOTAL_BEDS) * 100;

  // 3. Calculate ALOS (Average Length of Stay)
  const completedEncounters = encounters.filter(e => e.status === 'DISCHARGED' && e.admitted_at && e.updated_at);
  let totalStayMs = 0;
  completedEncounters.forEach(e => {
    const start = e.admitted_at.toDate();
    const end = e.updated_at.toDate();
    totalStayMs += (end - start);
  });
  
  const alosDays = completedEncounters.length > 0 
    ? (totalStayMs / completedEncounters.length) / (1000 * 60 * 60 * 24)
    : 0;

  // 4. Clinical Distribution (Simulation based on active NEWS2)
  // Real implementation would join with triage_logs
  const clinicalSafety = {
    critical: activeEncounters.filter(e => (e.news2_score || 0) >= 7).length,
    urgent:   activeEncounters.filter(e => (e.news2_score || 0) >= 5 && (e.news2_score || 0) < 7).length,
    stable:   activeEncounters.filter(e => (e.news2_score || 0) < 5).length,
  };

  return {
    bor: bor.toFixed(1),
    alos: alosDays.toFixed(1),
    activeCount: activeEncounters.length,
    completedCount: completedEncounters.length,
    clinicalSafety,
    trends: {
      bor: '+2.4%',
      alos: '-0.5 days',
      volume: '+12%'
    }
  };
};

export const fetchWardOccupancy = async () => {
   // Simulating ward-level data aggregation
   return [
      { name: 'Ward A', total: 10, occupied: 8, color: 'var(--primary)' },
      { name: 'Ward B', total: 15, occupied: 14, color: 'var(--error)' },
      { name: 'ICU',    total: 5,  occupied: 2,  color: 'var(--secondary)' },
      { name: 'ED',     total: 20, occupied: 15, color: 'var(--tertiary)' },
   ];
};
