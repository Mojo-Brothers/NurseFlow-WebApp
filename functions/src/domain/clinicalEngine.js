/**
 * NurseFlow Clinical Engine (Server-Side Domain)
 * 🛡️ Source of Truth for NEWS2 & Escalation Logic.
 */

const ESCALATION_LEVELS = {
  NONE: 'NONE',
  WATCH: 'WATCH',
  URGENT: 'URGENT',
  CRITICAL: 'CRITICAL',
};

const ESCALATION_SOURCES = {
  SYSTEM: 'SYSTEM',
  NURSE: 'NURSE',
  DOCTOR: 'DOCTOR'
};

/**
 * Calculates NEWS2
 */
exports.calculateNEWS2 = (vitals, baseline = null) => {
  let score = 0;
  
  const hr = Number(vitals.heartRate);
  const restingHR = baseline?.value || 70;
  
  if (baseline?.chronic_flag) {
    if (hr > restingHR * 1.3 || hr < restingHR * 0.7) score += 2;
  } else {
    if (hr > 110 || hr < 50) score += 2;
  }

  if (vitals.systolicBP < 90) score += 3;
  if (vitals.spo2 < 92) score += 3;
  if (vitals.temperature > 38.5 || vitals.temperature < 35.5) score += 2;
  
  return score;
};

/**
 * Maps NEWS2 Score and Trend to Escalation Level
 */
exports.determineEscalation = (score, trends = {}, manualOverride = null) => {
  let level = ESCALATION_LEVELS.NONE;
  let source = ESCALATION_SOURCES.SYSTEM;

  if (manualOverride) {
    source = manualOverride;
  }

  if (score >= 7 || (trends.hrVelocity && trends.hrVelocity > 4)) {
    level = ESCALATION_LEVELS.CRITICAL;
  } else if (score >= 5 || (trends.hrVelocity && trends.hrVelocity > 2)) {
    level = ESCALATION_LEVELS.URGENT;
  } else if (score >= 3) {
    level = ESCALATION_LEVELS.WATCH;
  }

  return { level, source };
};
