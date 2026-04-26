/**
 * Clinical Engine — NurseFlow Triage OS
 * Implements JCI-compliant logic for decision support.
 */

export interface Vitals {
  heartRate: string | number;
  systolicBP: string | number;
  diastolicBP: string | number;
  spo2: string | number;
  temperature: string | number;
  respRate: string | number;
  painScale: string | number;
}

/**
 * Calculates NEWS2 Score (National Early Warning Score 2)
 */
export const calculateNEWS2 = (vitals: Vitals): number => {
  let score = 0;
  const hr = Number(vitals.heartRate);
  const sbp = Number(vitals.systolicBP);
  const rr = Number(vitals.respRate);
  const spo2 = Number(vitals.spo2);
  const temp = Number(vitals.temperature);

  // RR
  if (rr <= 8 || rr >= 25) score += 3;
  else if (rr >= 21) score += 2;
  else if (rr >= 9 && rr <= 11) score += 1;

  // SpO2 (Scale 1 - most common)
  if (spo2 <= 91) score += 3;
  else if (spo2 <= 93) score += 2;
  else if (spo2 <= 95) score += 1;

  // Systolic BP
  if (sbp <= 90 || sbp >= 220) score += 3;
  else if (sbp <= 100) score += 2;
  else if (sbp <= 110) score += 1;

  // HR
  if (hr <= 40 || hr >= 131) score += 3;
  else if (hr >= 111) score += 2;
  else if (hr >= 91 || hr <= 50) score += 1;

  // Temp
  if (temp <= 35.0) score += 3;
  else if (temp >= 39.1) score += 2;
  else if (temp >= 38.1 || (temp >= 35.1 && temp <= 36.0)) score += 1;

  return score;
};

/**
 * Suggests ESI Level based on vitals and rapid triage logic
 */
export const suggestESI = (vitals: Vitals, complaint: string = ''): number => {
  const hr = Number(vitals.heartRate);
  const sbp = Number(vitals.systolicBP);
  const spo2 = Number(vitals.spo2);
  const rr = Number(vitals.respRate);

  // ESI 1: Immediate life-saving intervention needed
  if (hr > 150 || hr < 40 || sbp < 80 || spo2 < 85 || rr > 35 || rr < 8) return 1;

  // ESI 2: High risk situation, confused/lethargic, severe pain/distress
  if (hr > 120 || hr < 50 || sbp < 90 || sbp > 200 || spo2 < 92 || rr > 30) return 2;

  // ESI 3: Multiple resources needed, stable vitals
  return 3;
};

/**
 * Gets color coding based on NEWS2
 */
export const getTriageColor = (score: number): string => {
  if (score >= 7) return 'error'; // Red
  if (score >= 5) return 'warning'; // Orange
  if (score >= 1) return 'primary'; // Yellow/Blue (Low risk)
  return 'secondary'; // Green
};
