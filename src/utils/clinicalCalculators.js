/**
 * Simple NEWS2 (National Early Warning Score) Calculator Draft
 * JCI Standard requires automatic flagging of deteriorating patients.
 */

export const calculateNEWS2 = (vitals) => {
  let score = 0;
  
  // Heart Rate
  const hr = parseFloat(vitals.heartRate);
  if (hr) {
    if (hr <= 40 || hr >= 131) score += 3;
    else if (hr >= 111 && hr <= 130) score += 2;
    else if (hr <= 50 || (hr >= 91 && hr <= 110)) score += 1;
  }

  // Systolic BP (Simplification)
  const sbp = parseFloat(vitals.systolicBP);
  if (sbp) {
    if (sbp <= 90 || sbp >= 220) score += 3;
    else if (sbp >= 91 && sbp <= 100) score += 2;
    else if (sbp >= 101 && sbp <= 110) score += 1;
  }

  // SpO2
  const spo2 = parseFloat(vitals.spo2);
  if (spo2) {
    if (spo2 <= 91) score += 3;
    else if (spo2 >= 92 && spo2 <= 93) score += 2;
    else if (spo2 >= 94 && spo2 <= 95) score += 1;
  }
  
  // Temperature
  const temp = parseFloat(vitals.temperature);
  if (temp) {
    if (temp <= 35.0) score += 3;
    else if (temp >= 39.1) score += 2;
    else if (temp <= 36.0 || temp >= 38.1) score += 1;
  }

  let riskLevel = 'LOW';
  let frequency = '12_hourly';

  if (score >= 7) {
    riskLevel = 'HIGH';
    frequency = 'continuous';
  } else if (score >= 5) {
    riskLevel = 'MEDIUM';
    frequency = '1_hourly';
  } else if (score >= 1) {
    riskLevel = 'LOW';
    frequency = '4_6_hourly';
  }

  return { score, riskLevel, frequency };
};

export const getTriageColor = (news2Result) => {
  const score = typeof news2Result === 'object' ? news2Result.score : news2Result;
  if (score >= 7) return 'error';   // High clinical risk (Red)
  if (score >= 5) return 'warning'; // Medium clinical risk (Orange/Yellow)
  if (score >= 1) return 'warning'; // Low clinical risk (Yellow)
  return 'success';                      // Normal (Green)
};

/**
 * Menghitung umur dari tanggal lahir secara presisi.
 * @param {string} dob - ISO Date string (YYYY-MM-DD)
 * @returns {number}
 */
export const calculateAge = (dob) => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};
