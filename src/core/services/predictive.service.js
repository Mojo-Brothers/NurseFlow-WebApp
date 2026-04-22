import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase.js';
import { COLLECTIONS } from '../constants.js';

/**
 * PredictiveService — AI Simulation for Resource Optimization.
 * Analyzes historical patterns to forecast surges.
 */
export const fetchSurgeForecast = async () => {
  const encountersSnap = await getDocs(collection(db, COLLECTIONS.ENCOUNTERS));
  const encounters = encountersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // 1. Analyze Hourly Distribution (Historical)
  const hourlyIntensity = new Array(24).fill(0);
  encounters.forEach(e => {
    if (e.admitted_at) {
      const hour = e.admitted_at.toDate().getHours();
      hourlyIntensity[hour]++;
    }
  });

  // 2. Generate 24h Forecast (Simulated with weight on historical intensity)
  const forecastData = hourlyIntensity.map((count, hour) => {
    const baseline = 5; // Minimum patient load
    const weight = 1.2; // Simulation growth factor
    const predicted = Math.floor(baseline + (count * weight));
    
    // Staffing Recommendation (1 Nurse : 4 Patients)
    const recommendedNurses = Math.ceil(predicted / 4);
    
    return {
      hour: `${hour}:00`,
      predicted,
      recommendedNurses,
      intensity: predicted > 15 ? 'HIGH' : predicted > 10 ? 'MEDIUM' : 'NORMAL'
    };
  });

  // 3. Current Shift Optimization (Mocking for current hour)
  const currentHour = new Date().getHours();
  const nextShift = forecastData[(currentHour + 4) % 24];

  return {
    timeline: forecastData,
    nextShiftRecommendation: {
      headcount: nextShift.recommendedNurses,
      reason: nextShift.intensity === 'HIGH' ? 'Expected Admission Surge' : 'Baseline Continuity',
      risk: nextShift.predicted > 20 ? 'CRITICAL_UNDERSTAFFING_RISK' : 'OPTIMAL'
    },
    weeklyTrend: '+14% Expected'
  };
};

export const getStaffingRatios = () => ({
   WARD: '1:4',
   ICU:  '1:1',
   ED:   '1:3'
});
