import { db } from '../../../core/firebase.js';
import { COLLECTIONS, AUDIT_ACTIONS, ENCOUNTER_STATUSES, SYNC_PRIORITIES } from '../../../core/constants.js';
import { logAudit } from '../../../core/services/audit.service.js';

/**
 * Menyimpan SOAP note dan memicu audit log secara atomik (Spark compatible).
 * @param {Object} params
 */
export const saveSoapNote = async ({ patientId, encounterId, doctorEmail, soapData }) => {
  if (!encounterId) throw new Error('Encounter ID wajib disediakan untuk registrasi EMR.');

  const recordRef = doc(collection(db, COLLECTIONS.MEDICAL_RECORDS));
  const encounterRef = doc(db, COLLECTIONS.ENCOUNTERS, encounterId);
  const auditRef = doc(collection(db, COLLECTIONS.AUDIT_LOGS));

  try {
    await runTransaction(db, async (transaction) => {
      const timestamp = serverTimestamp();

      const payload = {
        patientId,
        encounterId,
        doctor:           doctorEmail,
        type:             'SOAP_NOTE',
        subjective:       soapData.subjective,
        objective:        soapData.objective,
        assessment:       soapData.assessment,
        plan_medications: soapData.plan_medications || [],
        plan_instructions: soapData.plan_instructions || '',
        created_at:       timestamp,
        schema_version:   5.1,
        is_locked:        true,
      };

      // 1. Simpan SOAP Note
      transaction.set(recordRef, payload);

      // 2. Automated Pharmacy Orders (The Highway)
      if (soapData.plan_medications && soapData.plan_medications.length > 0) {
        soapData.plan_medications.forEach(medName => {
          const medRef = doc(collection(db, COLLECTIONS.MEDICATIONS));
          transaction.set(medRef, {
            medication_name: medName,
            patient_id:      patientId,
            encounter_id:    encounterId,
            prescribed_by:   doctorEmail,
            prescribed_at:   timestamp,
            status:          'PENDING',
            dosage:          'As per SOAP plan',
            source_soap_id:  recordRef.id
          });
        });
      }

      // 3. Automated Billing Itemization (Financial Bridge)
      // JCI Requirement: Professional fees must be linked to clinical action
      const billingQuery = query(
        collection(db, COLLECTIONS.BILLING),
        where('encounter_id', '==', encounterId),
        limit(1)
      );
      const billingSnap = await getDocs(billingQuery);
      
      if (!billingSnap.empty) {
        const billDoc = billingSnap.docs[0];
        const currentItems = billDoc.data().line_items || [];
        const updatedItems = [
          ...currentItems,
          {
            description: `Professional Consultation - ${doctorEmail}`,
            qty: 1,
            unit_price: 150000, 
            total: 150000,
            linked_record_id: recordRef.id,
            timestamp: timestamp
          }
        ];
        const subtotal = updatedItems.reduce((sum, i) => sum + i.total, 0);
        transaction.update(billDoc.ref, { 
          line_items: updatedItems, 
          subtotal, 
          total: subtotal,
          updated_at: timestamp 
        });
      }

      // 4. Lifecycle Transition (Workflow Intelligence)
      transaction.update(encounterRef, {
        status:     ENCOUNTER_STATUSES.IN_TREATMENT,
        updated_at: timestamp,
        updated_by: doctorEmail
      });

      // 5. JCI Clinical Signature Audit
      transaction.set(auditRef, {
        timestamp,
        user:          doctorEmail,
        action:        AUDIT_ACTIONS.MEDICAL_ACTION,
        resource_type: COLLECTIONS.MEDICAL_RECORDS,
        resource_id:   recordRef.id,
        reason:        'CLINICAL_DOCUMENTATION_COMPLETE',
        delta: {
          assessment: soapData.assessment,
          order_count: soapData.plan_medications?.length || 0,
          new_status: ENCOUNTER_STATUSES.IN_TREATMENT
        },
        source: 'WEB_APP_CORE_SOAP'
      });
    });

    return recordRef.id;
  } catch (err) {
    console.error('[EmrService] SOAP transaction failed:', err);
    throw err;
  }
};

/**
 * Mengambil semua rekam medis pasien (diurutkan terbaru).
 * @param {string} patientId
 * @returns {Promise<import('../../core/types').SoapNote[]>}
 */
export const getPatientRecords = async (patientId) => {
  const q = query(
    collection(db, COLLECTIONS.MEDICAL_RECORDS),
    where('patientId', '==', patientId),
    orderBy('created_at', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
