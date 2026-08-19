import { describe, it, expect, beforeEach } from 'vitest';
import { persistenceAdapter, DB_ENGINE_TYPES } from '../src/core/services/persistenceAdapter.service.js';
import { careStateEngine, CARE_STATES, CLINICAL_EVENTS } from '../src/core/services/careStateEngine.service.js';
import { soapEngineService } from '../src/modules/emr/services/soapEngine.service.js';
import { pointOfCareFiveRightsValidator, FIVE_RIGHTS_STATUS } from '../src/core/services/pointOfCareFiveRightsValidator.service.js';
import { universalOrderEngineService } from '../src/modules/orders/services/universalOrderEngine.service.js';
import { billingEngineService } from '../src/modules/billing/services/billingEngine.service.js';
import { clinicalSecurityEngine, CLINICAL_ROLES, CLINICAL_ACTIONS, CLINICAL_RESOURCES } from '../src/core/security/clinicalSecurityEngine.service.js';

describe('⚡ Gap 1: Concurrent Users Torture Test (7 Simultaneous Hospital Roles on 1 Encounter)', () => {
  let sharedPatient;
  let sharedEncounter;

  beforeEach(async () => {
    persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);
    persistenceAdapter.memoryStore.clear();

    sharedPatient = {
      id: 'PAT-CONCURRENT-01',
      mrn: 'MRN-2026-991001',
      name: 'Bpk. Herman Kusumo',
      gender: 'M',
      dob: '1968-11-20',
      allergies: ['Penicillin']
    };
    await persistenceAdapter.save('patients', sharedPatient.id, sharedPatient);

    sharedEncounter = {
      id: 'ENC-CONCURRENT-01',
      episodeId: 'EOC-CONCURRENT-01',
      patientId: sharedPatient.id,
      patientName: sharedPatient.name,
      mrn: sharedPatient.mrn,
      primaryState: CARE_STATES.INPATIENT_ACTIVE,
      currentLocation: 'Bangsal Melati Bed 02',
      isTerminal: false
    };
    await persistenceAdapter.save('encounters', sharedEncounter.id, sharedEncounter);
  });

  it('Stress Test: 7 Distinct Hospital Actors Executing Actions on 1 Patient Simultaneously', async () => {
    // Setup 7 concurrent clinical promises:
    
    // Actor 1: Dokter DPJP — Writes CPPT SOAP
    const doctorTask = soapEngineService.recordSoapNote({
      episodeId: sharedEncounter.episodeId,
      encounterId: sharedEncounter.id,
      patientId: sharedPatient.id,
      patientName: sharedPatient.name,
      mrn: sharedPatient.mrn,
      subjective: 'Keluhan sesak berkurang, batuk produktif minimal.',
      objective: 'TTV: TD 130/85, HR 78, RR 18, SpO2 97%, Temp 36.6.',
      assessment: 'J18.9 - Pneumonia, unspecified - Resolving',
      plan: 'Lanjutkan ceftriaxone hari ke-3, nebulizer combivent 2x1.',
      primaryIcd10: 'J18.9',
      primaryIcd10Name: 'Pneumonia, unspecified',
      physicianId: 'DOC-DPJP-01',
      physicianName: 'dr. Surya Johnson, Sp.PD-KP'
    });

    // Actor 2: Perawat Bed 1 (Nurse 1) — Point of Care eMAR verification
    const orderMed1 = {
      id: 'ORD-CONCURRENT-MED1',
      orderNumber: 'RX-2026-CONC-01',
      encounterId: sharedEncounter.id,
      patientId: sharedPatient.id,
      patientName: sharedPatient.name,
      mrn: sharedPatient.mrn,
      medicationCode: 'MED-CEFTRIAXONE-1G',
      medicationName: 'Ceftriaxone 1g Vial',
      dose: 1000,
      doseUnit: 'mg',
      route: 'IV',
      frequency: 'QD',
      isHighAlert: false,
      status: 'ORDERED',
      version: 1,
      scheduleSlots: [{
        slotId: 'SLOT-0800',
        scheduledTime: '08:00',
        targetTimestamp: '2026-08-19T08:00:00Z',
        status: 'SCHEDULED',
        version: 1
      }]
    };
    await persistenceAdapter.save('medication_orders', orderMed1.id, orderMed1);

    const nurse1Task = pointOfCareFiveRightsValidator.validateFiveRights({
      rawPatientBarcode: sharedPatient.mrn,
      rawMedicationBarcode: 'MED-CEFTRIAXONE-1G',
      orderId: orderMed1.id,
      slotId: 'SLOT-0800',
      currentTimestamp: '2026-08-19T08:02:00Z'
    });

    // Actor 3: Perawat Bed 2 (Nurse 2) — Creates Vital Signs & Handover Task
    const nurse2Task = universalOrderEngineService.createOrder({
      patientId: sharedPatient.id,
      patientName: sharedPatient.name,
      mrn: sharedPatient.mrn,
      encounterId: sharedEncounter.id,
      orderCategory: 'PROCEDURE',
      priority: 'ROUTINE',
      clinicalIndication: 'Monitoring Balans Cairan & Output Drain 24 Jam',
      orderedBy: 'Ns. Ratna Sari, S.Kep'
    });

    // Actor 4: Apoteker Farmasi — Dispenses Oral Inhaler
    const pharmacistTask = universalOrderEngineService.createOrder({
      patientId: sharedPatient.id,
      patientName: sharedPatient.name,
      mrn: sharedPatient.mrn,
      encounterId: sharedEncounter.id,
      orderCategory: 'PHARMACY',
      priority: 'ROUTINE',
      clinicalIndication: 'Combivent Inhaler 2.5ml Unit Dose',
      orderedBy: 'apt. Dimas Anggara, S.Farm'
    });

    // Actor 5: Analis Laboratorium (LIS) — Publishes Blood Gas Analysis
    const labTask = universalOrderEngineService.createOrder({
      patientId: sharedPatient.id,
      patientName: sharedPatient.name,
      mrn: sharedPatient.mrn,
      encounterId: sharedEncounter.id,
      orderCategory: 'LABORATORY',
      priority: 'CITO',
      clinicalIndication: 'Analisa Gas Darah (AGD) Post-Nebulizer',
      orderedBy: 'dr. Sp.PK (Lab Analyser LIS)'
    });

    // Actor 6: Radiografer (PACS) — Acquires Follow-up Chest X-Ray
    const radTask = universalOrderEngineService.createOrder({
      patientId: sharedPatient.id,
      patientName: sharedPatient.name,
      mrn: sharedPatient.mrn,
      encounterId: sharedEncounter.id,
      orderCategory: 'RADIOLOGY',
      priority: 'ROUTINE',
      clinicalIndication: 'Evaluasi Infiltrat Paru Kanan',
      orderedBy: 'dr. Sp.Rad (PACS)'
    });

    // Actor 7: Kasir / Casemix Billing — Generates Real-time Ledger Invoice
    const cashierTask = billingEngineService.generateInvoice({
      episodeId: sharedEncounter.episodeId,
      patientId: sharedPatient.id,
      patientName: sharedPatient.name,
      guarantorType: 'BPJS',
      cashierName: 'Kasir Central 1'
    });

    // Execute ALL 7 actions concurrently in parallel
    const [
      soapResult,
      fiveRightsResult,
      nurse2Result,
      pharmResult,
      labResult,
      radResult,
      invoiceResult
    ] = await Promise.all([
      doctorTask,
      nurse1Task,
      nurse2Task,
      pharmacistTask,
      labTask,
      radTask,
      cashierTask
    ]);

    // Assert zero race condition and complete integrity
    expect(soapResult.assessment).toContain('J18.9');
    expect(fiveRightsResult.status).toBe(FIVE_RIGHTS_STATUS.PASS);
    expect(fiveRightsResult.canAdminister).toBe(true);
    expect(nurse2Result.order_category).toBe('PROCEDURE');
    expect(pharmResult.order_category).toBe('PHARMACY');
    expect(labResult.order_category).toBe('LABORATORY');
    expect(radResult.order_category).toBe('RADIOLOGY');
    expect(invoiceResult.patient_name).toBe(sharedPatient.name);

    // Verify Encounter State is STILL active and untouched
    const freshEncounter = await persistenceAdapter.findById('encounters', sharedEncounter.id);
    expect(freshEncounter.primaryState).toBe(CARE_STATES.INPATIENT_ACTIVE);
    expect(freshEncounter.isTerminal).toBe(false);
  });

  it('Anti-Cross-Contamination: Concurrent Access on 2 Separate Patients in Multi-Tab', async () => {
    const patientA = { id: 'PAT-TAB-A', mrn: 'MRN-TAB-A', name: 'Pasien Tab A' };
    const patientB = { id: 'PAT-TAB-B', mrn: 'MRN-TAB-B', name: 'Pasien Tab B' };

    await persistenceAdapter.save('patients', patientA.id, patientA);
    await persistenceAdapter.save('patients', patientB.id, patientB);

    // Action on Tab A with patientA context
    const authTabA = await clinicalSecurityEngine.evaluateAccess({
      actorId: 'DOC-01',
      actorRole: CLINICAL_ROLES.DOCTOR,
      resource: CLINICAL_RESOURCES.SOAP_NOTE,
      action: CLINICAL_ACTIONS.WRITE,
      patientId: patientA.id,
      targetPatientId: patientA.id
    });
    expect(authTabA.allowed).toBe(true);

    // Illegal Cross-Tab attempt (Tab A session targeting patient B record)
    const authCrossTabMismatch = await clinicalSecurityEngine.evaluateAccess({
      actorId: 'DOC-01',
      actorRole: CLINICAL_ROLES.DOCTOR,
      resource: CLINICAL_RESOURCES.SOAP_NOTE,
      action: CLINICAL_ACTIONS.WRITE,
      patientId: patientA.id,
      targetPatientId: patientB.id
    });

    expect(authCrossTabMismatch.allowed).toBe(false);
    expect(authCrossTabMismatch.reason).toContain('Cross-patient access violation');
  });
});
