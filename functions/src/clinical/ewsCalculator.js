const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Calculate NEWS2 Score
function calculateNEWS2(vitals) {
  let score = 0;
  
  // Respiration Rate
  const rr = vitals.respRate || vitals.respiratoryRate;
  if (rr <= 8) score += 3;
  else if (rr >= 9 && rr <= 11) score += 1;
  else if (rr >= 12 && rr <= 20) score += 0;
  else if (rr >= 21 && rr <= 24) score += 2;
  else if (rr >= 25) score += 3;

  // SpO2
  const spo2 = vitals.spo2;
  if (spo2 <= 91) score += 3;
  else if (spo2 >= 92 && spo2 <= 93) score += 2;
  else if (spo2 >= 94 && spo2 <= 95) score += 1;
  else if (spo2 >= 96) score += 0;

  // Temperature
  const temp = vitals.temperature;
  if (temp <= 35.0) score += 3;
  else if (temp >= 35.1 && temp <= 36.0) score += 1;
  else if (temp >= 36.1 && temp <= 38.0) score += 0;
  else if (temp >= 38.1 && temp <= 39.0) score += 1;
  else if (temp >= 39.1) score += 2;

  // Systolic BP
  const sbp = vitals.systolicBP;
  if (sbp <= 90) score += 3;
  else if (sbp >= 91 && sbp <= 100) score += 2;
  else if (sbp >= 101 && sbp <= 110) score += 1;
  else if (sbp >= 111 && sbp <= 219) score += 0;
  else if (sbp >= 220) score += 3;

  // Heart Rate
  const hr = vitals.heartRate;
  if (hr <= 40) score += 3;
  else if (hr >= 41 && hr <= 50) score += 1;
  else if (hr >= 51 && hr <= 90) score += 0;
  else if (hr >= 91 && hr <= 110) score += 1;
  else if (hr >= 111 && hr <= 130) score += 2;
  else if (hr >= 131) score += 3;

  return score;
}

exports.calculateEWS = functions.firestore
  .document('fhir_observations/{obsId}')
  .onWrite(async (change, context) => {
    // Only calculate on create or update
    if (!change.after.exists) return null;

    const observation = change.after.data();

    // Check if this observation is vital signs
    if (!observation.category || !observation.category.find(c => c.coding.find(code => code.code === 'vital-signs'))) {
      return null;
    }

    const vitals = observation._ehis_vitals; // Custom payload for easy calc
    if (!vitals) return null;

    const score = calculateNEWS2(vitals);
    let priorityLevel = 5; // Resuscitation (1) to Non-Urgent (5)
    let alertLevel = 'NONE';

    if (score >= 7) {
      priorityLevel = 1; // Resuscitation / Emergency
      alertLevel = 'CODE_BLUE';
    } else if (score >= 5) {
      priorityLevel = 2; // Urgent
      alertLevel = 'HIGH';
    } else if (score >= 3) {
      priorityLevel = 3; // Less Urgent
      alertLevel = 'MEDIUM';
    } else if (score >= 1) {
      priorityLevel = 4; // Not Urgent
      alertLevel = 'LOW';
    }

    const db = admin.firestore();
    const batch = db.batch();

    // Update the observation with the calculated score
    if (observation._ehis_ews_score !== score) {
      batch.update(change.after.ref, { 
        _ehis_ews_score: score,
        _ehis_ews_alert: alertLevel
      });
    }

    // Update the encounter with the latest priority
    if (observation.encounter && observation.encounter.reference) {
      const encounterId = observation.encounter.reference.split('/')[1];
      const encounterRef = db.collection('fhir_encounters').doc(encounterId);
      
      batch.update(encounterRef, {
        '_ehis.triage_priority': priorityLevel,
        '_ehis.last_ews_score': score,
        '_ehis.last_ews_alert': alertLevel
      });
    }

    await batch.commit();
    return null;
  });
