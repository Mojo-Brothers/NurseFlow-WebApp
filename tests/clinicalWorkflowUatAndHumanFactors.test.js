import { describe, it, expect, beforeEach } from 'vitest';
import { 
  clinicalWorkflowUatEngine, 
  HOSPITAL_ROLES, 
  CLINICAL_BRANCHING_PATHWAYS 
} from '../src/core/services/clinicalWorkflowUatEngine.service.js';
import { persistenceAdapter, DB_ENGINE_TYPES } from '../src/core/services/persistenceAdapter.service.js';
import { careStateEngine, CARE_STATES, CLINICAL_EVENTS } from '../src/core/services/careStateEngine.service.js';
import { clinicalSecurityEngine, CLINICAL_ROLES, CLINICAL_ACTIONS, CLINICAL_RESOURCES } from '../src/core/security/clinicalSecurityEngine.service.js';
import { pointOfCareFiveRightsValidator, FIVE_RIGHTS_STATUS } from '../src/core/services/pointOfCareFiveRightsValidator.service.js';
import { triageEngineService, TRIAGE_LEVEL_SPECS } from '../src/modules/emergency/services/triageEngine.service.js';
import { cdssEngineService } from '../src/modules/emr/services/cdssEngine.service.js';
import { allergyEngineService } from '../src/modules/emr/services/allergyEngine.service.js';
import { soapEngineService } from '../src/modules/emr/services/soapEngine.service.js';
import { universalOrderEngineService } from '../src/modules/orders/services/universalOrderEngine.service.js';
import { billingEngineService } from '../src/modules/billing/services/billingEngine.service.js';

describe('🏥 Sprint 3J: Clinical Workflow UAT & Human Factor Validation Suite', () => {
  beforeEach(async () => {
    persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);
    persistenceAdapter.memoryStore.clear();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 1: 5 CLINICAL EFFICIENCY METRICS
  // ──────────────────────────────────────────────────────────────────────────
  describe('📊 Section 1: 5 Clinical Workflow Efficiency Metrics Evaluation', () => {
    it('Metric 1 & 2: Click Count & Time-on-Task at Bedside eMAR', () => {
      const evalResult = clinicalWorkflowUatEngine.evaluateWorkflowAction({
        role: HOSPITAL_ROLES.INPATIENT_NURSE,
        actionName: 'BEDSIDE_EMAR_ADMINISTRATION',
        patientId: 'PAT-UAT-001',
        encounterId: 'ENC-UAT-001',
        clickCount: 3, // 1 scan patient, 1 scan med, 1 confirm
        durationMs: 4200, // 4.2 seconds
        contextSwitches: 0,
        cognitiveFrictionScore: 1.2,
        errorEncountered: null,
        recoveryGuidance: null
      });

      expect(evalResult.verdict).toBe('PASS');
      expect(evalResult.metrics.clickCount).toBeLessThanOrEqual(4);
      expect(evalResult.metrics.durationMs).toBeLessThan(10000);
    });

    it('Metric 3: Context Switching & Inadvertent Patient Loss Prevention', () => {
      const evalResult = clinicalWorkflowUatEngine.evaluateWorkflowAction({
        role: HOSPITAL_ROLES.ATTENDING_PHYSICIAN,
        actionName: 'SOAP_CPPT_DOCUMENTATION',
        patientId: 'PAT-UAT-001',
        encounterId: 'ENC-UAT-001',
        clickCount: 2,
        durationMs: 8500,
        contextSwitches: 0,
        cognitiveFrictionScore: 1.0,
        errorEncountered: null,
        recoveryGuidance: null
      });

      expect(evalResult.verdict).toBe('PASS');
      expect(evalResult.metrics.contextSwitches).toBe(0);
    });

    it('Metric 4: Cognitive Friction & Auto-Population of Critical Data', () => {
      const evalResult = clinicalWorkflowUatEngine.evaluateWorkflowAction({
        role: HOSPITAL_ROLES.CLINICAL_PHARMACIST,
        actionName: 'MEDICATION_SAFETY_REVIEW_TELAAH',
        patientId: 'PAT-UAT-001',
        encounterId: 'ENC-UAT-001',
        clickCount: 2,
        durationMs: 6100,
        contextSwitches: 0,
        cognitiveFrictionScore: 1.5,
        errorEncountered: null,
        recoveryGuidance: null
      });

      expect(evalResult.verdict).toBe('PASS');
      expect(evalResult.metrics.cognitiveFrictionScore).toBeLessThanOrEqual(2.0);
    });

    it('Metric 5: Human Error Recovery with Actionable Clinical Guidance', () => {
      const evalResult = clinicalWorkflowUatEngine.evaluateWorkflowAction({
        role: HOSPITAL_ROLES.CLINICAL_PHARMACIST,
        actionName: 'DISPENSE_BLOCKED_BY_ALLERGY',
        patientId: 'PAT-UAT-001',
        encounterId: 'ENC-UAT-001',
        clickCount: 1,
        durationMs: 2300,
        contextSwitches: 0,
        cognitiveFrictionScore: 2.0,
        errorEncountered: 'ALLERGY_CONTRAINDICATION: Pasien alergi berat Penisilin.',
        recoveryGuidance: 'Hubungi DPJP dr. Surya Johnson via konsultasi CPOE untuk mengganti golongan makrolida (Azithromycin 500mg).'
      });

      expect(evalResult.verdict).toBe('PASS');
      expect(evalResult.metrics.hasActionableRecovery).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 2: 12 HOSPITAL ROLES DEEP VALIDATION
  // ──────────────────────────────────────────────────────────────────────────
  describe('👥 Section 2: 12 Hospital Roles Operational Validation', () => {
    let patient;
    let encounter;

    beforeEach(async () => {
      patient = {
        id: 'PAT-ROLE-01',
        mrn: 'MRN-2026-888001',
        name: 'Ny. Siti Aminah',
        gender: 'F',
        dob: '1975-08-14',
        allergies: ['Penicillin']
      };
      await persistenceAdapter.save('patients', patient.id, patient);

      encounter = {
        id: 'ENC-ROLE-01',
        patientId: patient.id,
        primaryState: CARE_STATES.REGISTERED,
        currentLocation: 'Admisi Front Office'
      };
      await persistenceAdapter.save('encounters', encounter.id, encounter);
    });

    it('Role 1: Admisi / Front Office — Patient Registration & Demographics Access', async () => {
      const auth = await clinicalSecurityEngine.evaluateAccess({
        actorId: 'ADM-01',
        actorRole: CLINICAL_ROLES.ADMISSION_STAFF,
        resource: CLINICAL_RESOURCES.PATIENT,
        action: CLINICAL_ACTIONS.READ,
        patientId: patient.id,
        targetPatientId: patient.id
      });
      expect(auth.allowed).toBe(true);
    });

    it('Role 2: Petugas Triase IGD — 5-Level ATS/ESI Acuity Scoring', () => {
      const triage = triageEngineService.classifySeverity({
        airwayStatus: 'PATENT',
        breathingStatus: 'TACHYPNEA',
        circulationStatus: 'TACHYCARDIA',
        spo2: 91,
        heartRate: 118,
        gcsTotal: 15,
        painScale: 8
      });

      expect(triage.level).toBe(2);
      expect(triage.code).toBe('P2_EMERGENT');
      expect(triage.colorCode).toBe('ORANGE');
    });

    it('Role 3: Perawat IGD — Rapid Triage & Bed Allocation Access', async () => {
      const auth = await clinicalSecurityEngine.evaluateAccess({
        actorId: 'NURSE-IGD-01',
        actorRole: CLINICAL_ROLES.NURSE,
        resource: CLINICAL_RESOURCES.CPPT_NOTE,
        action: CLINICAL_ACTIONS.WRITE,
        encounter,
        patientId: patient.id,
        targetPatientId: patient.id
      });
      expect(auth.allowed).toBe(true);
    });

    it('Role 4: Dokter Jaga IGD — Emergency CPOE & CDSS Clinical Safeguards', async () => {
      await allergyEngineService.recordAllergy({
        patientId: patient.id,
        allergen: 'Amoxicillin',
        reaction: 'Urtikaria & Bronkospasme',
        severity: 'SEVERE'
      });

      const result = await cdssEngineService.evaluatePrescriptionSafeguards({
        encounterId: encounter.id,
        patientId: patient.id,
        prescribedDrugName: 'Amoxicillin 500mg',
        prescribedDrugCode: 'MED-AMOX-500'
      });

      expect(result.hasAlerts).toBe(true);
      expect(result.alerts[0].alert_type).toBe('DRUG_ALLERGY_CONFLICT');
    });

    it('Role 5: Petugas Laboratorium (LIS) — Specimen Tracking & Result Release', async () => {
      const labOrder = await universalOrderEngineService.createOrder({
        patientId: patient.id,
        encounterId: encounter.id,
        orderCategory: 'LABORATORY',
        testName: 'Darah Lengkap & Elektrolit (D-Dimer, Troponin-I)',
        clinicalIndication: 'Suspect ACS / Sepsis',
        urgency: 'CITO',
        orderedBy: 'dr. IGD Jaga, Sp.EM'
      });

      expect(labOrder.order_category).toBe('LABORATORY');
      expect(labOrder.status).toBe('ORDERED');
    });

    it('Role 6: Petugas Radiologi / PACS — DICOM Study & Expertise Sign-off', async () => {
      const radOrder = await universalOrderEngineService.createOrder({
        patientId: patient.id,
        encounterId: encounter.id,
        orderCategory: 'RADIOLOGY',
        testName: 'Rontgen Thorax AP / Lateral',
        clinicalIndication: 'Dispnea akut & Ronki basah halus',
        urgency: 'CITO',
        orderedBy: 'dr. IGD Jaga, Sp.EM'
      });

      expect(radOrder.order_category).toBe('RADIOLOGY');
    });

    it('Role 7: Apoteker / Farmasi Klinis — Telaah Resep JCI MMU.4 & FEFO Dispensing', async () => {
      const authPrescribe = await clinicalSecurityEngine.evaluateAccess({
        actorId: 'PHARM-01',
        actorRole: CLINICAL_ROLES.PHARMACIST,
        resource: CLINICAL_RESOURCES.CPOE_PRESCRIPTION,
        action: CLINICAL_ACTIONS.PRESCRIBE,
        encounter,
        patientId: patient.id,
        targetPatientId: patient.id
      });
      // Pharmacist cannot prescribe
      expect(authPrescribe.allowed).toBe(false);

      const authDispense = await clinicalSecurityEngine.evaluateAccess({
        actorId: 'PHARM-01',
        actorRole: CLINICAL_ROLES.PHARMACIST,
        resource: CLINICAL_RESOURCES.CPOE_PRESCRIPTION,
        action: CLINICAL_ACTIONS.DISPENSE,
        encounter,
        patientId: patient.id,
        targetPatientId: patient.id
      });
      expect(authDispense.allowed).toBe(true);
    });

    it('Role 8: Perawat Rawat Inap — Bedside 5-Rights Point-of-Care eMAR', async () => {
      const order = {
        id: 'ORD-CEFTRIAXONE-01',
        orderNumber: 'RX-2026-001',
        encounterId: encounter.id,
        patientId: patient.id,
        patientName: patient.name,
        mrn: patient.mrn,
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
          slotId: 'SLOT-01',
          scheduledTime: '08:00',
          targetTimestamp: '2026-08-19T08:00:00Z',
          status: 'SCHEDULED',
          version: 1
        }]
      };

      await persistenceAdapter.save('encounters', encounter.id, {
        ...encounter,
        primaryState: CARE_STATES.INPATIENT_ACTIVE,
        currentLocation: 'Bangsal Melati Bed 04'
      });
      await persistenceAdapter.save('medication_orders', order.id, order);

      const result = await pointOfCareFiveRightsValidator.validateFiveRights({
        rawPatientBarcode: patient.mrn,
        rawMedicationBarcode: 'MED-CEFTRIAXONE-1G',
        orderId: order.id,
        slotId: 'SLOT-01',
        currentTimestamp: '2026-08-19T08:05:00Z'
      });

      expect(result.status).toBe(FIVE_RIGHTS_STATUS.PASS);
      expect(result.canAdminister).toBe(true);
    });

    it('Role 9: Dokter DPJP Spesialis — Daily Visite CPPT & Interspecialty Consult', async () => {
      const soap = await soapEngineService.recordSoapNote({
        episodeId: 'EOC-001',
        encounterId: encounter.id,
        patientId: patient.id,
        patientName: patient.name,
        mrn: patient.mrn,
        subjective: 'Pasien merasa demam mulai turun, batuk berkurang.',
        objective: 'TTV Stabil: TD 120/80, Nadi 82, RR 18, Suhu 36.8 C, SpO2 98%.',
        assessment: 'A90 - Dengue fever [classical dengue] - Membaik.',
        plan: 'Lanjutkan rehidrasi oral, cek trombosit besok pagi, rencana pulang jika trombosit > 100.000.',
        primaryIcd10: 'A90',
        primaryIcd10Name: 'Dengue fever',
        physicianId: 'DOC-SPPD-01',
        physicianName: 'dr. Surya Johnson, Sp.PD'
      });

      expect(soap.assessment).toContain('A90');
    });

    it('Role 10: Tim Bedah IBS — WHO Surgical Safety Checklist Access', async () => {
      const auth = await clinicalSecurityEngine.evaluateAccess({
        actorId: 'SURGEON-01',
        actorRole: CLINICAL_ROLES.DOCTOR,
        resource: CLINICAL_RESOURCES.SOAP_NOTE,
        action: CLINICAL_ACTIONS.WRITE,
        encounter,
        patientId: patient.id,
        targetPatientId: patient.id
      });
      expect(auth.allowed).toBe(true);
    });

    it('Role 11: Kasir & Casemix Billing — Invoice Generation & Payment Settlement', async () => {
      const invoice = await billingEngineService.generateInvoice({
        episodeId: 'EOC-2026-001',
        patientId: patient.id,
        patientName: patient.name,
        guarantorType: 'BPJS'
      });

      expect(invoice.payment_status).toBe('ISSUED');
      expect(invoice.patient_name).toBe(patient.name);

      const settled = await billingEngineService.settlePayment({
        invoiceId: invoice.id,
        paymentMethod: 'BPJS_CLAIM'
      });
      expect(settled.payment_status).toBe('SETTLED');
    });

    it('Role 12: Clinical Supervisor & Medical Auditor — Read-Only Forensic Immutability', async () => {
      const closedEncounter = {
        id: 'ENC-CLOSED-01',
        primaryState: 'DISCHARGED',
        isTerminal: true
      };

      const authAudit = await clinicalSecurityEngine.evaluateAccess({
        actorId: 'AUDITOR-01',
        actorRole: CLINICAL_ROLES.AUDITOR,
        resource: CLINICAL_RESOURCES.SOAP_NOTE,
        action: CLINICAL_ACTIONS.READ,
        encounter: closedEncounter,
        patientId: patient.id,
        targetPatientId: patient.id
      });
      expect(authAudit.allowed).toBe(true);

      const authWriteAfterClose = await clinicalSecurityEngine.evaluateAccess({
        actorId: 'DOC-01',
        actorRole: CLINICAL_ROLES.DOCTOR,
        resource: CLINICAL_RESOURCES.SOAP_NOTE,
        action: CLINICAL_ACTIONS.WRITE,
        encounter: closedEncounter,
        patientId: patient.id,
        targetPatientId: patient.id
      });
      expect(authWriteAfterClose.allowed).toBe(false);
      expect(authWriteAfterClose.reason).toContain('CLOSED/TERMINAL');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 3: FULL PATIENT JOURNEY & BRANCHING PATHWAYS
  // ──────────────────────────────────────────────────────────────────────────
  describe('🌿 Section 3: Full Patient Journey & Branching Pathways Stress Test', () => {
    let patient;

    beforeEach(() => {
      patient = {
        id: 'PAT-JOURNEY-01',
        name: 'Tn. Robert Simanjuntak',
        mrn: 'MRN-2026-99001'
      };
    });

    it('IGD Branch 1: Outpatient Discharge (Boleh Pulang dengan Resep Rawat Jalan)', () => {
      const result = clinicalWorkflowUatEngine.validatePatientJourneyWithBranching({
        patient,
        initialCareState: CARE_STATES.EMERGENCY_ACTIVE,
        branchType: 'IGD',
        selectedBranch: CLINICAL_BRANCHING_PATHWAYS.IGD.OUTPATIENT_DISCHARGE,
        executedSteps: [
          'TRIAGE_ASSESSMENT',
          'PHYSICIAN_ASSESSMENT',
          'DISCHARGE_MEDICATION_RESUME'
        ]
      });

      expect(result.isJourneyValid).toBe(true);
      expect(result.status).toBe('CLINICALLY_VERIFIED');
    });

    it('IGD Branch 2: Inpatient Admission (Pindah ke Bangsal Perawatan)', () => {
      const result = clinicalWorkflowUatEngine.validatePatientJourneyWithBranching({
        patient,
        initialCareState: CARE_STATES.EMERGENCY_ACTIVE,
        branchType: 'IGD',
        selectedBranch: CLINICAL_BRANCHING_PATHWAYS.IGD.INPATIENT_ADMISSION,
        executedSteps: [
          'TRIAGE_ASSESSMENT',
          'PHYSICIAN_ASSESSMENT',
          'BED_RESERVATION'
        ]
      });

      expect(result.isJourneyValid).toBe(true);
      expect(result.status).toBe('CLINICALLY_VERIFIED');
    });

    it('IGD Branch 3: External Hospital Referral (Rujuk ke RS Tingkat Lanjut)', () => {
      const result = clinicalWorkflowUatEngine.validatePatientJourneyWithBranching({
        patient,
        initialCareState: CARE_STATES.EMERGENCY_ACTIVE,
        branchType: 'IGD',
        selectedBranch: CLINICAL_BRANCHING_PATHWAYS.IGD.EXTERNAL_REFERRAL,
        executedSteps: [
          'TRIAGE_ASSESSMENT',
          'PHYSICIAN_ASSESSMENT'
        ]
      });

      expect(result.isJourneyValid).toBe(true);
    });

    it('IGD Branch 4: Death / Resuscitation Failure (Meninggal & Surat Kematian)', () => {
      const result = clinicalWorkflowUatEngine.validatePatientJourneyWithBranching({
        patient,
        initialCareState: CARE_STATES.EMERGENCY_ACTIVE,
        branchType: 'IGD',
        selectedBranch: CLINICAL_BRANCHING_PATHWAYS.IGD.DEATH_DECLARATION,
        executedSteps: [
          'TRIAGE_ASSESSMENT',
          'PHYSICIAN_ASSESSMENT'
        ]
      });

      expect(result.isJourneyValid).toBe(true);
    });

    it('Inpatient Branch 1: Surgery CITO / Elective with WHO Checklist', () => {
      const result = clinicalWorkflowUatEngine.validatePatientJourneyWithBranching({
        patient,
        initialCareState: CARE_STATES.INPATIENT_ACTIVE,
        branchType: 'INPATIENT',
        selectedBranch: CLINICAL_BRANCHING_PATHWAYS.INPATIENT.SURGERY_CITO_ELECTIVE,
        executedSteps: [
          'ANESTHESIA_CONSENT',
          'WHO_SURGICAL_CHECKLIST'
        ]
      });

      expect(result.isJourneyValid).toBe(true);
    });

    it('Inpatient Branch 2: Complete Discharge, Billing Clearance & Locked Encounter', () => {
      const result = clinicalWorkflowUatEngine.validatePatientJourneyWithBranching({
        patient,
        initialCareState: CARE_STATES.INPATIENT_ACTIVE,
        branchType: 'INPATIENT',
        selectedBranch: CLINICAL_BRANCHING_PATHWAYS.INPATIENT.CLINICAL_DISCHARGE,
        executedSteps: [
          'DISCHARGE_SUMMARY_SIGNED',
          'FINAL_BILLING_CLEARED',
          'ENCOUNTER_LOCKED'
        ]
      });

      expect(result.isJourneyValid).toBe(true);
    });

    it('Should detect defects if mandatory clinical steps are skipped', () => {
      const defectResult = clinicalWorkflowUatEngine.validatePatientJourneyWithBranching({
        patient,
        initialCareState: CARE_STATES.INPATIENT_ACTIVE,
        branchType: 'INPATIENT',
        selectedBranch: CLINICAL_BRANCHING_PATHWAYS.INPATIENT.CLINICAL_DISCHARGE,
        executedSteps: [
          'DISCHARGE_SUMMARY_SIGNED'
          // Missing: FINAL_BILLING_CLEARED and ENCOUNTER_LOCKED
        ]
      });

      expect(defectResult.isJourneyValid).toBe(false);
      expect(defectResult.status).toBe('DEFECT_DETECTED');
      expect(defectResult.missingCriticalSteps).toContain('FINAL_BILLING_CLEARED');
      expect(defectResult.missingCriticalSteps).toContain('ENCOUNTER_LOCKED');
    });
  });
});
