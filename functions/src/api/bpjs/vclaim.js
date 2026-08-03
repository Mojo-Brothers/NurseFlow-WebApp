const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Mock BPJS VClaim API - Generate SEP
 * Mensimulasikan bridging ke VClaim BPJS untuk penerbitan SEP
 */
exports.createSEP = functions.https.onCall(async (data, context) => {
  // Hanya tim medis atau admin yang berhak membuat SEP
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Harus login untuk akses VClaim.');
  }
  
  const role = context.auth.token.role;
  if (!['ADMIN', 'DOCTOR', 'NURSE'].includes(role)) {
    throw new functions.https.HttpsError('permission-denied', 'Tidak memiliki hak akses VClaim.');
  }

  const { noKartu, tglSep, jnsPelayanan, klsRawat, noMR, asalRujukan, tglRujukan, noRujukan, ppkRujukan, diagAwal, poli, user } = data;

  if (!noKartu || !noMR || !diagAwal || !poli) {
    throw new functions.https.HttpsError('invalid-argument', 'Data payload BPJS tidak lengkap.');
  }

  // Simulasi network delay dari BPJS
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Generate 19-digit SEP (contoh: 0301R0110826V000001)
  const ppk = '0301R011';
  const monthYear = (new Date()).toISOString().substring(2, 7).replace('-', ''); // e.g. 2608
  const randomSuffix = Math.floor(1000000 + Math.random() * 9000000).toString().substring(1); // 6 digits
  const noSep = `${ppk}${monthYear}V${randomSuffix}`;

  // Log to audit events to simulate external system call
  const db = admin.firestore();
  await db.collection('audit_events').add({
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    resource_type: 'bpjs_sep',
    resource_id: noSep,
    action: 'CREATE',
    actor_id: context.auth.uid,
    delta: { before: null, after: { noSep, noKartu, noMR } },
    source: 'EHIS_VCLAIM_MOCK'
  });

  return {
    metaData: {
      code: "200",
      message: "Sukses"
    },
    response: {
      sep: {
        noSep: noSep,
        tglSep: tglSep || new Date().toISOString().substring(0, 10),
        peserta: {
          noKartu: noKartu,
          noMr: noMR,
          hakKelas: klsRawat || "1",
        },
        diagnosa: diagAwal,
        poli: poli
      }
    }
  };
});
