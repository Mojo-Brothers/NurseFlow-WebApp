/**
 * Clinical Decision Support (CDS) — Intelligence Engine
 * Evaluates patient risk profiles using qSOFA and trend analysis.
 */
import { 
  collection, getDocs, query, where, orderBy, limit 
} from 'firebase/firestore';
import { db } from '../../core/firebase.js';
import { COLLECTIONS } from '../../core/constants.js';

/**
 * qSOFA Criteria (Quick Sequential Organ Failure Assessment)
 * Used to identify patients with suspected infection who are at high risk for poor outcomes.
 */
export const evaluateSepsisRisk = (vitals) => {
  let score = 0;
  const indicators = [];

  // 1. Respiratory Rate >= 22 breaths/min
  if (parseFloat(vitals.respRate) >= 22) {
    score++;
    indicators.push('Tachypnea (RR >= 22)');
  }

  // 2. Systolic Blood Pressure <= 100 mmHg
  if (parseFloat(vitals.systolicBP) <= 100) {
    score++;
    indicators.push('Hypotension (SBP <= 100)');
  }

  // 3. Altered Mental Status (GCS < 15)
  // Di sistem kita, ini bisa dideteksi jika perawat menandai status kesadaran
  if (vitals.mental_status && vitals.mental_status !== 'ALERTA') {
    score++;
    indicators.push('Altered Mental Status');
  }

  return {
    score,
    level: score >= 2 ? 'HIGH' : score === 1 ? 'MODERATE' : 'LOW',
    indicators,
    recommendation: score >= 2 ? 'SEPSIS ALERT: Consider immediate Fluid Bolus and Lactate check.' : null
  };
};

/**
 * Analisis Tren Pemburukan (Deterioration Forecasting)
 * Membandingkan data vital saat ini dengan data sebelumnya.
 */
export const analyzeVitalTrend = (currentVitals, previousVitals) => {
  if (!previousVitals) return null;

  const alerts = [];
  
  // Heart Rate Progression
  if (parseFloat(currentVitals.heartRate) > parseFloat(previousVitals.heartRate) + 15) {
    alerts.push('Rapid Tachycardia Progression');
  }

  // NEWS2 Jump
  if (parseFloat(currentVitals.news2_score) >= (parseFloat(previousVitals.news2_score) + 2)) {
    alerts.push('Acute NEWS2 Escalation');
  }

  return alerts.length > 0 ? alerts : null;
};

/**
 * Evaluasi Keselamatan Obat (Medication Safety)
 * Deteksi risiko reaksi alergi silang.
 */
export const evaluateMedicationRisk = (medications, patientAllergies) => {
  const risks = [];
  if (!patientAllergies || patientAllergies.length === 0) return risks;

  medications.forEach(med => {
    patientAllergies.forEach(allergy => {
      if (med.medication_name.toLowerCase().includes(allergy.toLowerCase())) {
        risks.push({
          medication: med.medication_name,
          allergy,
          severity: 'CRITICAL',
          type: 'ALLERGY_CONFLICT'
        });
      }
    });
  });

  return risks;
};

/**
 * Fetch the latest vitals for an encounter to trigger CDS.
 */
export const getLatestVitals = async (encounterId) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.TRIAGE_LOGS),
      where('encounter_id', '==', encounterId),
      orderBy('timestamp', 'desc'),
      limit(2) // Get last 2 for trend analysis
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
  } catch (err) {
    console.error('[CDS] Fetch failed:', err);
    return [];
  }
};
