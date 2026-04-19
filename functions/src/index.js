/**
 * NurseFlow Cloud Functions — Entry Point (Full)
 * Steps 3 + 4 + 7: Auth, Audit, Triage, Patient, Pharmacy, Billing
 */
const admin     = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp();
const db = admin.firestore();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STEP 3: AUTH — Sync User Role ke Custom Claims
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
exports.syncUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login terlebih dahulu.');

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
    return { role: 'NURSE', isNew: true };
  }

  const { role } = userDoc.data();
  await admin.auth().setCustomUserClaims(uid, { role });
  return { role, isNew: false };
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STEP 7: TRIAGE — Auto Alert jika NEWS2 Kritis
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
exports.onTriageCreate = functions.firestore
  .document('triage_logs/{logId}')
  .onCreate(async (snap, context) => {
    const { news2_score, patient_id, assessed_by, triage_level } = snap.data();
    const logId = context.params.logId;

    // Backend audit (double-layer guarantee)
    await db.collection('audit_logs').add({
      timestamp:     admin.firestore.FieldValue.serverTimestamp(),
      user:          assessed_by, action: 'CREATE',
      resource_type: 'triage_logs', resource_id: logId,
      delta:         { news2_score, triage_level }, source: 'CLOUD_FUNCTION',
    });

    // Buat alert critical jika NEWS2 >= 7
    if (news2_score >= 7) {
      await db.collection('alerts').add({
        type: 'CRITICAL_TRIAGE', patient_id, triage_log_id: logId,
        news2_score, triage_level, triggered_by: assessed_by,
        triggered_at: admin.firestore.FieldValue.serverTimestamp(),
        resolved: false,
        message: `⚠️ CRITICAL: NEWS2 Score ${news2_score} — Penanganan segera diperlukan!`,
      });
    }

    return null;
  });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STEP 4: AUDIT — Callable Audit Writer
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
exports.writeAuditLog = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login terlebih dahulu.');

  const { action, resourceType, resourceId, delta } = data;
  const VALID = ['CREATE','UPDATE','DELETE','VIEW','LOGIN','LOGOUT'];
  if (!VALID.includes(action)) throw new functions.https.HttpsError('invalid-argument', `Invalid action: ${action}`);

  await db.collection('audit_logs').add({
    timestamp:     admin.firestore.FieldValue.serverTimestamp(),
    user:          context.auth.token.email,
    action, resource_type: resourceType, resource_id: resourceId,
    delta:         delta || {}, source: 'CLIENT_CALLABLE',
  });

  return { success: true };
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STEP 5: PATIENT — Registration & Auto-audit
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * JCI-Compliant Patient Registration
 * Melakukan generate MRN di sisi server untuk menjamin integritas.
 */
exports.registerPatient = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login diperlukan.');

  const { name, dob, gender, nik, address, phone } = data;
  if (!name || !dob || !nik) throw new functions.https.HttpsError('invalid-argument', 'Data wajib (nama, lahir, NIK) kurang.');

  // Generate MRN (00-00-00 format)
  const randomNum = Math.floor(100000 + Math.random() * 900000); // 6 digits
  const s = String(randomNum);
  const mrn = `${s.substring(0,2)}-${s.substring(2,4)}-${s.substring(4,6)}`;

  const payload = {
    name, dob, gender, nik, address, phone,
    mrn,
    is_active:     true,
    registered_at: admin.firestore.FieldValue.serverTimestamp(),
    registered_by: context.auth.token.email,
  };

  // Transactional Write: Patient + Audit
  const batch = db.batch();
  const patientRef = db.collection('patients').doc();
  const auditRef   = db.collection('audit_logs').doc();

  batch.set(patientRef, payload);
  batch.set(auditRef, {
    timestamp:     admin.firestore.FieldValue.serverTimestamp(),
    user:          context.auth.token.email,
    action:        'CREATE',
    resource_type: 'patients',
    resource_id:   patientRef.id,
    delta:         { name, mrn },
    source:        'CLOUD_FUNCTION_CALLABLE'
  });

  await batch.commit();

  return { id: patientRef.id, mrn };
});

// Trigger audit untuk backup jika ada penulisan langsung (Emergency workaround)
exports.onPatientCreate = functions.firestore
  .document('patients/{patientId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (data.registered_by === 'system_auto') return null; // Skip if already handled by callable
    
    // Fallback audit
    await db.collection('audit_logs').add({
      timestamp:     admin.firestore.FieldValue.serverTimestamp(),
      user:          data.registered_by || 'unknown',
      action:        'CREATE',
      resource_type: 'patients',
      resource_id:   context.params.patientId,
      delta:         { mrn: data.mrn },
      source:        'CLOUD_FUNCTION_TRIGGER',
    });
    return null;
  });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NEW: PHARMACY — Alert saat resep baru masuk
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
exports.onMedicationCreate = functions.firestore
  .document('medications/{medId}')
  .onCreate(async (snap, context) => {
    const { patient_id, medication_name, route, prescribed_by } = snap.data();
    const medId = context.params.medId;

    // Audit: setiap resep baru
    await db.collection('audit_logs').add({
      timestamp:     admin.firestore.FieldValue.serverTimestamp(),
      user:          prescribed_by, action: 'CREATE',
      resource_type: 'medications', resource_id: medId,
      delta:         { medication_name, route }, source: 'CLOUD_FUNCTION',
    });

    // Alert farmasi jika IV (parenteral — urgent)
    if (['IV', 'SC', 'IM'].includes(route)) {
      await db.collection('alerts').add({
        type:         'URGENT_MEDICATION',
        patient_id,   medication_id: medId,
        medication:   medication_name, route,
        triggered_by: prescribed_by,
        triggered_at: admin.firestore.FieldValue.serverTimestamp(),
        resolved:     false,
        message:      `Resep parenteral (${route}) baru: ${medication_name} — Perlu segera disiapkan farmasi.`,
      });
    }
    return null;
  });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NEW: BILLING — Audit on bill create
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
exports.onBillingCreate = functions.firestore
  .document('billing/{billId}')
  .onCreate(async (snap, context) => {
    const { patient_id, encounter_id, created_by } = snap.data();
    await db.collection('audit_logs').add({
      timestamp:     admin.firestore.FieldValue.serverTimestamp(),
      user:          created_by || 'system', action: 'CREATE',
      resource_type: 'billing', resource_id: context.params.billId,
      delta:         { patient_id, encounter_id }, source: 'CLOUD_FUNCTION',
    });
    return null;
  });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NEW: ENCOUNTER — Auto-billing saat encounter dibuka
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
exports.onEncounterCreate = functions.firestore
  .document('encounters/{encId}')
  .onCreate(async (snap, context) => {
    const { patient_id } = snap.data();
    const encId = context.params.encId;

    // Auto-buat tagihan DRAFT saat encounter dibuka
    await db.collection('billing').add({
      encounter_id:  encId,
      patient_id,
      line_items:    [],
      subtotal:      0,
      discount:      0,
      total:         0,
      status:        'DRAFT',
      created_at:    admin.firestore.FieldValue.serverTimestamp(),
      created_by:    'system_auto',
    });

    console.log(`[onEncounterCreate] Auto-billing created for encounter ${encId}`);
    return null;
  });
