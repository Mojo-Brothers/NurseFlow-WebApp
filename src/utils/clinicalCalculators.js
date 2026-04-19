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

  return score;
};

export const getTriageColor = (news2Score) => {
  if (news2Score >= 7) return 'red'; // High clinical risk
  if (news2Score >= 5) return 'orange'; // Medium clinical risk
  if (news2Score >= 1) return 'yellow'; // Low clinical risk
  return 'green'; // Normal
};
