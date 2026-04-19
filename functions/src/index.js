/**
 * NurseFlow Cloud Functions — Entry Point (V5.5 Hardened)
 * JCI-Grade: Automated Auditing, Tamper Alerts, & Clinical Integrity
 */
const admin     = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp();
const db = admin.firestore();

const { calculateNEWS2, determineEscalation } = require('./domain/clinicalEngine');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. AUTH — Role-Claims Sync
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
exports.syncUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.');

  const uid = context.auth.uid;
  const userDoc = await db.doc(`users/${uid}`).get();

  if (!userDoc.exists) {
    const { email, name } = context.auth.token;
    await db.doc(`users/${uid}`).set({
      uid, email,
      displayName: name || email,
      role:        'NURSE',
      department:  'General',
      is_active:   true,
      created_at:  admin.firestore.FieldValue.serverTimestamp(),
    });
    await admin.auth().setCustomUserClaims(uid, { role: 'NURSE' });
    return { role: 'NURSE' };
  }

  const { role } = userDoc.data();
  await admin.auth().setCustomUserClaims(uid, { role });
  return { role };
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. CLINICAL — Unified Triage Processor
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
exports.processTriage = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.');
  
  // DEFENSE-IN-DEPTH: Role Verification
  const userRole = context.auth.token.role;
  if (!['DOCTOR', 'NURSE'].includes(userRole)) {
    throw new functions.https.HttpsError('permission-denied', 'Hanya tim medis yang berwenang melakukan Triage.');
  }

  const { patient_id, encounter_id, vitals, trends, client_score, client_level } = data;

  const patientDoc = await db.collection('patients').doc(patient_id).get();
  if (!patientDoc.exists) throw new functions.https.HttpsError('not-found', 'Patient not found.');
  
  const baseline = patientDoc.data().baseline_profile || null;
  const serverScore = calculateNEWS2(vitals, baseline);
  const serverEscalation = determineEscalation(serverScore, trends);

  // TAMPER DETECTION
  let tamperDetected = false;
  if (client_score !== undefined && client_score !== serverScore) tamperDetected = true;
  if (client_level !== undefined && client_level !== serverEscalation.level) tamperDetected = true;

  const batch = db.batch();
  const logRef = db.collection('triage_logs').doc();
  const encounterRef = db.collection('encounters').doc(encounter_id);

  batch.set(logRef, {
    patient_id, encounter_id, vitals,
    news2_score:      serverScore,
    escalation_level:  serverEscalation.level,
    escalation_source: 'SERVER_PROCESSOR',
    assessed_by:       context.auth.token.email,
    timestamp:         admin.firestore.FieldValue.serverTimestamp(),
    tamper_alert:      tamperDetected,
    _v:                1
  });

  batch.update(encounterRef, {
    last_news2:        serverScore,
    escalation_level:  serverEscalation.level,
    last_updated_at:   admin.firestore.FieldValue.serverTimestamp(),
    _v:                admin.firestore.FieldValue.increment(1)
  });

  if (tamperDetected) {
    const alertRef = db.collection('alerts').doc();
    batch.set(alertRef, {
      type: 'URGENT_TAMPER',
      patient_id,
      message: `PERINGATAN: Deteksi manipulasi skor NEWS2 pada pasien ${patient_id}. Skor diubah di sisi client.`,
      triggered_by: 'system_gatekeeper',
      triggered_at: admin.firestore.FieldValue.serverTimestamp(),
      resolved: false
    });
  }

  await batch.commit();
  return { success: true, score: serverScore, tamper_detected: tamperDetected };
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. TRIGGERS — Automated Audit Trail (JCI)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Triage Logs Audit (Immutable Record)
exports.onTriageCreate = functions.firestore
  .document('triage_logs/{logId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    await db.collection('audit_logs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      user:      data.assessed_by || 'unknown',
      action:    'CREATE',
      resource_type: 'triage_logs',
      resource_id:   context.params.logId,
      delta:         { score: data.news2_score, tamper: data.tamper_alert },
      source:        'TRIGGER_AUTO'
    });
  });

// Medication Audit (Strict)
exports.onMedicationCreate = functions.firestore
  .document('medications/{medId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    await db.collection('audit_logs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      user:      data.prescribed_by,
      action:    'CREATE',
      resource_type: 'medications',
      resource_id:   context.params.medId,
      delta:         { med: data.medication_name, dose: data.dose },
      source:        'TRIGGER_AUTO'
    });
  });

// Patient Audit
exports.onPatientCreate = functions.firestore
  .document('patients/{patientId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    await db.collection('audit_logs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      user:      data.registered_by || 'system',
      action:    'CREATE',
      resource_type: 'patients',
      resource_id:   context.params.patientId,
      delta:         { mrn: data.mrn },
      source:        'TRIGGER_AUTO'
    });
  });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. UTILITY — MRN Generation (Secure)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
exports.registerPatient = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.');

  // DEFENSE-IN-DEPTH: Role Verification
  const userRole = context.auth.token.role;
  if (!['DOCTOR', 'NURSE', 'ADMIN'].includes(userRole)) {
    throw new functions.https.HttpsError('permission-denied', 'Anda tidak memiliki wewenang untuk meregistrasi pasien.');
  }

  const { name, dob, gender, nik, address, phone } = data;
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  const s = String(randomNum);
  const mrn = `${s.substring(0,2)}-${s.substring(2,4)}-${s.substring(4,6)}`;

  const payload = {
    name, dob, gender, nik, address, phone, mrn,
    is_active: true,
    registered_at: admin.firestore.FieldValue.serverTimestamp(),
    registered_by: context.auth.token.email,
  };

  const patientRef = await db.collection('patients').add(payload);
  return { id: patientRef.id, mrn };
});
