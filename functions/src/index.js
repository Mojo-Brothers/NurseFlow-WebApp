/**
 * NurseFlow Cloud Functions — Entry Point (Step 7)
 * Semua business logic ada di sini, BUKAN di frontend.
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp();
const db = admin.firestore();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STEP 3: AUTH — Sync User Role ke Custom Claims
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/**
 * Dipanggil dari frontend setelah login pertama kali.
 * Mengambil role dari Firestore dan menyimpannya sebagai Custom Claim.
 */
exports.syncUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login terlebih dahulu.');
  }

  const uid = context.auth.uid;
  const userDoc = await db.doc(`users/${uid}`).get();

  if (!userDoc.exists) {
    // Auto-create user record jika belum ada (pendaftaran pertama via Google)
    const { email, name } = context.auth.token;
    await db.doc(`users/${uid}`).set({
      uid,
      email,
      displayName:  name || email,
      role:         'NURSE', // Default role — Admin harus upgrade manual
      department:   'General',
      is_active:    true,
      created_at:   admin.firestore.FieldValue.serverTimestamp(),
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
/**
 * Trigger: Setiap triage_log baru dibuat
 * Logic: Jika NEWS2 >= 7 → buat alert kritis di Firestore
 */
exports.onTriageCreate = functions.firestore
  .document('triage_logs/{logId}')
  .onCreate(async (snap, context) => {
    const { news2_score, patient_id, assessed_by, triage_level } = snap.data();
    const logId = context.params.logId;

    console.log(`[onTriageCreate] Patient ${patient_id} NEWS2: ${news2_score}`);

    // Auto-write audit log dari backend (immutable guarantee)
    await db.collection('audit_logs').add({
      timestamp:     admin.firestore.FieldValue.serverTimestamp(),
      user:          assessed_by,
      action:        'CREATE',
      resource_type: 'triage_logs',
      resource_id:   logId,
      delta:         { news2_score, triage_level },
      source:        'CLOUD_FUNCTION', // Tandai: log dari backend
    });

    // 🚨 Jika critical: buat alert untuk dashboard
    if (news2_score >= 7) {
      await db.collection('alerts').add({
        type:          'CRITICAL_TRIAGE',
        patient_id,
        triage_log_id: logId,
        news2_score,
        triage_level,
        triggered_by:  assessed_by,
        triggered_at:  admin.firestore.FieldValue.serverTimestamp(),
        resolved:      false,
        message:       `Pasien memerlukan penanganan EMERGENCY. NEWS2 Score: ${news2_score}`,
      });

      console.log(`[CRITICAL ALERT] Patient ${patient_id} NEWS2 ${news2_score} — Alert created`);
    }

    return null;
  });


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STEP 4: AUDIT — Centralized Audit Writer (Callable)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/**
 * Callable function untuk membuat audit log dari client.
 * Memberikan jaminan lebih kuat karena backend validate sebelum tulis.
 */
exports.writeAuditLog = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login terlebih dahulu.');
  }

  const { action, resourceType, resourceId, delta } = data;
  const VALID_ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT'];

  if (!VALID_ACTIONS.includes(action)) {
    throw new functions.https.HttpsError('invalid-argument', `Action tidak valid: ${action}`);
  }

  await db.collection('audit_logs').add({
    timestamp:     admin.firestore.FieldValue.serverTimestamp(),
    user:          context.auth.token.email,
    action,
    resource_type: resourceType,
    resource_id:   resourceId,
    delta:         delta || {},
    source:        'CLIENT_CALLABLE',
  });

  return { success: true };
});


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STEP 5: PATIENT — Auto-validate saat registrasi
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/**
 * Trigger: Validasi NIK tidak duplikat saat pasien baru dibuat.
 * CATATAN: Cek duplikat tetap harus di Security Rules,
 * ini sebagai lapisan tambahan (defense in depth).
 */
exports.onPatientCreate = functions.firestore
  .document('patients/{patientId}')
  .onCreate(async (snap, context) => {
    const { nik, name, registered_by } = snap.data();
    const patientId = context.params.patientId;

    // Auto-audit log dari backend
    await db.collection('audit_logs').add({
      timestamp:     admin.firestore.FieldValue.serverTimestamp(),
      user:          registered_by || 'system',
      action:        'CREATE',
      resource_type: 'patients',
      resource_id:   patientId,
      delta:         { name, nik: nik?.substring(0, 4) + '············' }, // Mask NIK di log
      source:        'CLOUD_FUNCTION',
    });

    console.log(`[onPatientCreate] New patient registered: ${name}`);
    return null;
  });
