/**
 * 🦠 PREVENTION & CONTROL OF INFECTION SERVICE (PCI - Phase 30)
 * Adheres to JCI Standards for Infection Prevention and Control.
 */

const ISOLATION_MAP = {
  'COVID-19': 'AIRBORNE',
  'TB': 'AIRBORNE',
  'MRSA': 'CONTACT',
  'VRE': 'CONTACT',
  'PERTUSSIS': 'DROPLET',
  'INFLUENZA': 'DROPLET'
};

/**
 * Determine Isolation Protocol based on diagnosis
 */
export const getIsolationType = (diagnosis) => {
  if (!diagnosis) return null;
  const upperDiag = diagnosis.toUpperCase();
  for (const [key, value] of Object.entries(ISOLATION_MAP)) {
    if (upperDiag.includes(key)) return value;
  }
  return null;
};

/**
 * Detect potential HAI (Hospital Acquired Infection) risks
 * Heuristics based on clinical patterns
 */
export const detectHaiRisk = (patientData, encounters) => {
  const risks = [];
  
  // 1. Device-associated risks
  const catheterDays = patientData.catheter_days || 0;
  if (catheterDays > 7) {
    risks.push({ type: 'CAUTI_RISK', severity: 'HIGH', label: 'Prolonged Catheterization' });
  }

  // 2. Surgical Site Infection (SSI) signals
  const recentSurgery = encounters.find(e => e.type === 'SURGERY' && (new Date() - new Date(e.timestamp) < 30 * 24 * 3600 * 1000));
  if (recentSurgery && patientData.temp > 38) {
    risks.push({ type: 'SSI_RISK', severity: 'URGENT', label: 'Post-op Febrile Spike' });
  }

  return risks;
};

/**
 * Get Hospital-wide Infection Metrics
 */
export const getInfectionMetrics = async () => {
  // Simulated data for dashboard
  return {
    active_isolations: 12,
    hai_alerts_24h: 4,
    hand_hygiene_compliance: 92,
    ward_hotspots: [
      { ward: 'ICU-A', count: 5, status: 'CRITICAL' },
      { ward: 'WARD-7', count: 2, status: 'WATCH' }
    ]
  };
};
