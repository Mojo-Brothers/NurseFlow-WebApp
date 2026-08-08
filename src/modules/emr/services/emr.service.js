import { db } from '../../../core/firebase.js';
import { deductStock } from '../../inventory/services/inventory.service.js';
import { DEMO_RECORDS } from '../../../core/demoData.js';
import { 
  collection, 
  doc, 
  runTransaction, 
  serverTimestamp, 
  query, 
  where, 
  limit, 
  getDocs, 
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { COLLECTIONS, AUDIT_ACTIONS, ENCOUNTER_STATUSES } from '../../../core/constants.js';

/**
 * 🛡️ DECOUPLED OPERATIONAL BRIDGES
 * Separated from main EMR transaction to allow for targeted retries.
 */

export const triggerBillingItem = async ({ encounterId, doctorEmail }) => {
  const billingQuery = query(
    collection(db, COLLECTIONS.BILLING),
    where('encounter_id', '==', encounterId),
    limit(1)
  );
  const billingSnap = await getDocs(billingQuery);
  
  if (billingSnap.empty) throw new Error('Billing record not found for this encounter.');

  const billDoc = billingSnap.docs[0];
  const billRef = doc(db, COLLECTIONS.BILLING, billDoc.id);
  const currentBill = billDoc.data();
  const timestamp = serverTimestamp();

  const billingItem = {
    description: `Consultation - Dr. ${doctorEmail.split('@')[0].toUpperCase()}`,
    qty: 1,
    unit_price: 150000,
    total: 150000,
    timestamp: timestamp
  };

  await updateDoc(billRef, {
    line_items: [...(currentBill.line_items || []), billingItem],
    total: (currentBill.total || 0) + 150000,
    updated_at: timestamp
  });

  return { ok: true, id: billDoc.id, item: billingItem };
};

export const triggerPharmacyOrder = async ({ medications, patientId, encounterId, doctorEmail }) => {
  if (!medications?.length) return { ok: true, count: 0 };

  const timestamp = serverTimestamp();
  let count = 0;

  // We use batch-like setDoc for independent med orders
  for (const med of medications) {
    const medRef = doc(collection(db, COLLECTIONS.MEDICATIONS));
    await setDoc(medRef, {
      ...med,
      patient_id: patientId,
      encounter_id: encounterId,
      prescribed_by: doctorEmail,
      status: 'PENDING',
      prescribed_at: timestamp
    });

    // 📦 Synchronize to Core eMAR Service Pipeline
    try {
      const { emarService } = await import('../../../core/services/eMARService.js');
      emarService.createEMARRecord({
        encounterId,
        medicationId: med.id || 'MED-AMX-500',
        dosage: med.dosage || '1 Tablet',
        route: med.route || 'Oral',
        frequency: med.frequency || '3 x 1',
        prescribedBy: doctorEmail,
        notes: med.notes || ''
      });
    } catch (e) {
      console.error(`eMAR record generation failed for ${med.medication_name}:`, e);
    }
    
    // 📦 Logistical Loop: Deduct stock per prescription entry
    try {
      await deductStock(med.id, 1); 
    } catch (e) {
      console.error(`Inventory deduction failed for ${med.medication_name}:`, e);
    }
    
    count++;
  }

  return { ok: true, count };
};

export const triggerLabOrder = async ({ labs, patientId, encounterId, doctorEmail }) => {
  if (!labs?.length) return { ok: true, count: 0 };
  const timestamp = serverTimestamp();
  let count = 0;
  for (const lab of labs) {
    const labRef = doc(collection(db, COLLECTIONS.DIAGNOSTICS)); // Reuse diagnostics or new collection
    await setDoc(labRef, {
      ...lab,
      type: 'LABORATORY',
      patient_id: patientId,
      encounter_id: encounterId,
      ordered_by: doctorEmail,
      status: 'PENDING',
      ordered_at: timestamp
    });
    count++;
  }
  return { ok: true, count };
};

export const triggerRadOrder = async ({ rads, patientId, encounterId, doctorEmail }) => {
  if (!rads?.length) return { ok: true, count: 0 };
  const timestamp = serverTimestamp();
  let count = 0;
  for (const rad of rads) {
    const radRef = doc(collection(db, COLLECTIONS.DIAGNOSTICS));
    await setDoc(radRef, {
      ...rad,
      type: 'RADIOLOGY',
      patient_id: patientId,
      encounter_id: encounterId,
      ordered_by: doctorEmail,
      status: 'PENDING',
      ordered_at: timestamp
    });
    count++;
  }
  return { ok: true, count };
};


/**
 * CORE EMR TRANSACTION
 * Saves the soap note and audit log. Operational effects are returned for external triggering.
 */
export const saveSoapNote = async ({ patientId, encounterId, doctorEmail, soapData, status = 'SIGNED' }) => {
  if (!encounterId) throw new Error('Encounter ID wajib disediakan.');

  const soapRef = doc(collection(db, COLLECTIONS.MEDICAL_RECORDS)); // V6 Primary Collection
  const encounterRef = doc(db, COLLECTIONS.ENCOUNTERS, encounterId);

  try {
    const coreResult = await runTransaction(db, async (transaction) => {
      const timestamp = serverTimestamp();
      
      // 1. 🛡️ REAL-TIME VALIDATION
      const encounterSnap = await transaction.get(encounterRef);
      if (!encounterSnap.exists()) throw new Error('Clinical encounter not found.');
      
      const encounter = encounterSnap.data();
      if (['DISCHARGED', 'CANCELLED'].includes(encounter.status)) {
        throw new Error(`LOCKDOWN: Encounter finalized by ${encounter.updated_by} at ${encounter.updated_at?.toDate().toLocaleString()}`);
      }

      // 2. CORE SOAP PAYLOAD
      const soapPayload = {
        patientId,
        encounterId,
        doctor:           doctorEmail,
        status:           status,
        subjective:       soapData.subjective,
        objective:        soapData.objective,
        assessment:       soapData.assessment,
        icd10:            soapData.icd10 || [],
        plan_medications: soapData.plan_medications || [],
        plan_labs:        soapData.plan_labs || [],
        plan_rads:        soapData.plan_rads || [],
        plan_instructions: soapData.plan_instructions || '',
        created_at:       timestamp,
        signed_at:        status === 'SIGNED' ? timestamp : null,
        signed_by:        status === 'SIGNED' ? doctorEmail : null,
      };

      transaction.set(soapRef, soapPayload);

      // 3. CORE AUDIT
      const auditRef = doc(collection(db, COLLECTIONS.AUDIT_LOGS));
      transaction.set(auditRef, {
        timestamp,
        user: doctorEmail,
        action: status === 'SIGNED' ? AUDIT_ACTIONS.UPDATE : 'DRAFT_SAVED',
        resource_type: COLLECTIONS.MEDICAL_RECORDS,
        resource_id: soapRef.id,
        reason: status === 'SIGNED' ? 'CLINICAL_SIGN_OFF' : 'DRAFT_PERSISTENCE',
        delta: { status, encounterId }
      });

      return { soapId: soapRef.id, status };
    });

    // 🚀 THE HIGHWAY: Trigger operational side-effects if SIGNED
    const receipt = { 
      ...coreResult, 
      billing: { ok: false }, 
      pharmacy: { ok: false },
      lab: { ok: false },
      rad: { ok: false }
    };

    if (status === 'SIGNED') {
      try {
        receipt.billing = await triggerBillingItem({ encounterId, patientId, doctorEmail });
      } catch (e) {
        receipt.billing = { ok: false, error: e.message };
      }

      try {
        receipt.pharmacy = await triggerPharmacyOrder({ 
          medications: soapData.plan_medications, 
          patientId, 
          encounterId, 
          doctorEmail 
        });
      } catch (e) {
        receipt.pharmacy = { ok: false, error: e.message };
      }

      try {
        receipt.lab = await triggerLabOrder({ 
          labs: soapData.plan_labs, 
          patientId, 
          encounterId, 
          doctorEmail 
        });
      } catch (e) {
        receipt.lab = { ok: false, error: e.message };
      }

      try {
        receipt.rad = await triggerRadOrder({ 
          rads: soapData.plan_rads, 
          patientId, 
          encounterId, 
          doctorEmail 
        });
      } catch (e) {
        receipt.rad = { ok: false, error: e.message };
      }
    }

    return receipt;
  } catch (err) {
    console.error('[EmrService] SOAP transaction failed:', err);
    throw err;
  }
};

export const saveClinicalRecord = async ({ patientId, encounterId, author, moduleName, data, status = 'SIGNED' }) => {
  if (!encounterId) throw new Error('Encounter ID wajib disediakan.');

  const recordRef = doc(collection(db, COLLECTIONS.MEDICAL_RECORDS));
  const timestamp = serverTimestamp();

  try {
    await runTransaction(db, async (transaction) => {
      // Core Record Payload
      const payload = {
        patientId,
        encounterId,
        moduleName,
        signed_by: author,
        status: status,
        data: data,
        assessment: moduleName, // For backward compatibility in list view
        created_at: timestamp,
        signed_at: status === 'SIGNED' ? timestamp : null,
      };

      transaction.set(recordRef, payload);

      // Audit Log
      const auditRef = doc(collection(db, COLLECTIONS.AUDIT_LOGS));
      transaction.set(auditRef, {
        timestamp,
        user: author,
        action: AUDIT_ACTIONS.CREATE,
        resource_type: COLLECTIONS.MEDICAL_RECORDS,
        resource_id: recordRef.id,
        reason: 'JCI_CLINICAL_DOCUMENTATION',
        delta: { moduleName, status }
      });
    });

    return { recordId: recordRef.id, status };
  } catch (err) {
    console.error('[EmrService] Clinical record save failed:', err);
    throw err;
  }
};



export const getPatientRecords = async (patientId) => {
  if (!patientId) return [];

  let localRecords = [];
  try {
    const raw = localStorage.getItem('nurseflow_medical_records_master');
    if (raw) localRecords = JSON.parse(raw);
  } catch (e) {}

  const matchingLocal = localRecords.filter(r => r.patientId === patientId || r.patient_id === patientId || r.mrn === patientId);
  const matchingDemo = DEMO_RECORDS.filter(r => r.patientId === patientId || r.patient_id === patientId || r.mrn === patientId);

  try {
    const q = query(
      collection(db, COLLECTIONS.MEDICAL_RECORDS),
      where('patientId', '==', patientId)
    );
    const snapshot = await getDocs(q);
    const firestoreRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const firestoreIds = new Set(firestoreRecords.map(r => r.id));
    const combined = [
      ...firestoreRecords,
      ...matchingLocal.filter(r => !firestoreIds.has(r.id)),
      ...matchingDemo.filter(r => !firestoreIds.has(r.id))
    ];

    const seen = new Set();
    return combined.filter(r => {
      const k = r.id || `${r.moduleName}-${r.date}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  } catch (error) {
    console.error('[EmrService] Failed to fetch records:', error);
    const combined = [...matchingLocal, ...matchingDemo];
    const seen = new Set();
    return combined.filter(r => {
      const k = r.id || `${r.moduleName}-${r.date}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
};
