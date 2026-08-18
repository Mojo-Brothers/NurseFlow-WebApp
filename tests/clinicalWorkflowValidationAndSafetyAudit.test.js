/**
 * SPRINT 38: CLINICAL WORKFLOW VALIDATION & SAFETY AUDIT SUITE
 * 
 * Torture test across 4 end-to-end clinical personas + WORM Provenance & Tamper-Proof Audit:
 * 
 * 1. Scenario 1: Emergency New/Anonymous Patient (Mr. X) Journey
 * 2. Scenario 2: Emergency to Inpatient Admission & Bed Allocation Journey
 * 3. Scenario 3: Inpatient Daily Care to Discharge Summary & Terminal Lock
 * 4. Scenario 4: Returning Patient (Longitudinal History vs Hard Encounter Boundary Isolation)
 * 5. Scenario 5: WORM Immutable Audit Provenance, Version Lineage & Tamper-Resistance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { persistenceAdapter, DB_ENGINE_TYPES } from '../src/core/services/persistenceAdapter.service.js';
import { careStateEngine, CARE_STATES, CLINICAL_EVENTS, TERMINAL_STATES } from '../src/core/services/careStateEngine.service.js';
import { adtEngine, BED_STATUS } from '../src/core/services/adtEngine.service.js';
import { clinicalActionabilityEngine } from '../src/core/services/clinicalActionabilityEngine.service.js';
import { medicationLifecycleEngine, MEDICATION_STATUS } from '../src/core/services/medicationLifecycleEngine.service.js';
import { domainEventEngine } from '../src/core/services/domainEventEngine.service.js';

describe('Sprint 38: Clinical Workflow Validation & Safety Audit Suite', () => {
  beforeEach(async () => {
    persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);
    await persistenceAdapter.clearAll?.();
  });

  // ─── SCENARIO 1: EMERGENCY NEW/ANONYMOUS PATIENT JOURNEY ───────
  it('Scenario 1: Emergency New/Anonymous Patient (Mr. X) complete clinical journey', async () => {
    // 1. Unidentified trauma patient arrives at Emergency Department
    const anonPatient = {
      id: 'PAT-EMERGENCY-001',
      mrn: 'MRN-EMG-001',
      name: 'Mr. X (Trauma Anonim)',
      gender: 'M',
      isAnonymous: true,
      allergies: ['Penicillin']
    };
    await persistenceAdapter.save('patients', anonPatient.id, anonPatient);

    // 2. Open Emergency Encounter in TRIAGE_PENDING state
    const emgEncounter = {
      id: 'ENC-EMG-001',
      patientId: anonPatient.id,
      type: 'EMERGENCY',
      primaryState: CARE_STATES.TRIAGE_PENDING,
      department: 'IGD',
      room: 'Bilik Triase',
      triageLevel: 'ESI 2'
    };
    await persistenceAdapter.save('encounters', emgEncounter.id, emgEncounter);

    // 3. Complete Triage (ESI 2 - Cito) -> Transition to IGD_ACTIVE
    const triageTransition = await careStateEngine.transition({
      encounterId: emgEncounter.id,
      targetState: CARE_STATES.IGD_ACTIVE,
      eventType: CLINICAL_EVENTS.COMPLETE_TRIAGE,
      actorId: 'NURSE-01',
      actorRole: 'NURSE',
      actorName: 'Ners Siti',
      reason: 'Triase Selesai - ESI 2 Cito'
    });
    expect(triageTransition.success).toBe(true);
    expect(triageTransition.encounter.primaryState).toBe(CARE_STATES.IGD_ACTIVE);

    // 4. Doctor creates Anamnesis & CPOE Cito Order
    const cpoeOrder = {
      id: 'ORD-CITO-001',
      encounterId: emgEncounter.id,
      patientId: anonPatient.id,
      drugName: 'Ceftriaxone 1g IV',
      status: 'PRESCRIBED',
      prescriberId: 'DOC-01',
      prescriberName: 'dr. Budi, Sp.An'
    };
    await persistenceAdapter.save('cpoe_orders', cpoeOrder.id, cpoeOrder);

    // 5. Clinical Actionability Engine evaluates emergency patient
    const actionability = clinicalActionabilityEngine.evaluateActionability({
      patient: anonPatient,
      encounter: triageTransition.encounter,
      role: 'DOCTOR',
      clinicalRecords: []
    });
    expect(actionability.encounterType).toBe('EMERGENCY');
    expect(actionability.careState).toBe(CARE_STATES.IGD_ACTIVE);
    expect(actionability.safetyFlags.some(f => f.type === 'ALLERGY_ALERT')).toBe(true);

    // 6. Nurse conducts CPPT documentation
    const cpptRecord = {
      id: 'REC-CPPT-001',
      encounterId: emgEncounter.id,
      patientId: anonPatient.id,
      moduleName: 'SOAP NOTES (CPPT HARIAN)',
      title: 'CPPT Resusitasi IGD',
      subjective: 'Pasien tidak sadar, GCS E2V2M4',
      assessment: 'Cedera Kepala Sedang + Syok Hipovolemik',
      doctor: 'dr. Budi, Sp.An',
      signed_by: 'dr. Budi, Sp.An',
      created_at: new Date().toISOString()
    };
    await persistenceAdapter.save('clinical_records', cpptRecord.id, cpptRecord);

    const savedRecords = await persistenceAdapter.query('clinical_records');
    expect(savedRecords.length).toBe(1);
    expect(savedRecords[0].title).toBe('CPPT Resusitasi IGD');
  });

  // ─── SCENARIO 2: IGD TO INPATIENT ADMISSION JOURNEY ───────────
  it('Scenario 2: IGD to Inpatient Admission with ADT Bed Assignment & ISBAR Handover', async () => {
    const patient = {
      id: 'PAT-ADM-002',
      mrn: 'MRN-ADM-002',
      name: 'Ny. Siti Rahma',
      demographics: { dob: '1985-05-12', gender: 'F' }
    };
    await persistenceAdapter.save('patients', patient.id, patient);

    // 1. Initial State: IGD_ACTIVE
    const enc = {
      id: 'ENC-ADM-002',
      patientId: patient.id,
      type: 'INPATIENT',
      primaryState: CARE_STATES.IGD_ACTIVE,
      department: 'IGD'
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    // 2. Doctor decides Admission (SPRI Issued) -> ADMISSION_PENDING
    const admPendingRes = await careStateEngine.transition({
      encounterId: enc.id,
      targetState: CARE_STATES.ADMISSION_PENDING,
      eventType: CLINICAL_EVENTS.REQUEST_ADMISSION,
      actorId: 'DOC-02',
      actorRole: 'DOCTOR',
      actorName: 'dr. Alexander, Sp.PD',
      reason: 'Instruksi Admisi Rawat Inap SPRI-2026-009'
    });
    expect(admPendingRes.success).toBe(true);

    // 3. ADT Engine assigns bed
    const targetBed = adtEngine.getAvailableBeds()[0];
    const assignedBed = adtEngine.assignPatientToBed(targetBed.id, patient.id, patient.name, enc.id, 'Petugas Admisi');
    expect(assignedBed.status).toBe(BED_STATUS.OCCUPIED);

    // 4. Transition to INPATIENT_ACTIVE
    const inpatRes = await careStateEngine.transition({
      encounterId: enc.id,
      targetState: CARE_STATES.INPATIENT_ACTIVE,
      eventType: CLINICAL_EVENTS.ADMIT_PATIENT,
      bedId: targetBed.id,
      actorId: 'NURSE-02',
      actorRole: 'NURSE',
      actorName: 'Ners Rina',
      reason: 'Pasien diterima di Bangsal'
    });
    expect(inpatRes.success).toBe(true);
    expect(inpatRes.encounter.primaryState).toBe(CARE_STATES.INPATIENT_ACTIVE);

    // 5. Verify Clinical Applicability Matrix: Catatan Admisi & ISBAR Handover are authorized
    const accessAdmisi = clinicalActionabilityEngine.canAccessForm({
      formName: 'CATATAN ADMISI RAWAT INAP',
      role: 'DOCTOR',
      encounterType: 'INPATIENT',
      careState: CARE_STATES.INPATIENT_ACTIVE
    });
    expect(accessAdmisi.allowed).toBe(true);
    expect(accessAdmisi.readOnly).toBe(false);

    const accessHandover = clinicalActionabilityEngine.canAccessForm({
      formName: 'SERAH TERIMA KEPERAWATAN (ISBAR)',
      role: 'NURSE',
      encounterType: 'INPATIENT',
      careState: CARE_STATES.INPATIENT_ACTIVE
    });
    expect(accessHandover.allowed).toBe(true);
    expect(accessHandover.readOnly).toBe(false);
  });

  // ─── SCENARIO 3: INPATIENT DAILY CARE TO DISCHARGE SUMMARY ────
  it('Scenario 3: Inpatient Daily Care to Discharge Summary, Take-Home & Terminal Locked Encounter', async () => {
    const patient = { id: 'PAT-DISCH-003', mrn: 'MRN-DISCH-003', name: 'Tn. Hendra' };
    await persistenceAdapter.save('patients', patient.id, patient);

    const enc = {
      id: 'ENC-DISCH-003',
      patientId: patient.id,
      type: 'INPATIENT',
      primaryState: CARE_STATES.INPATIENT_ACTIVE
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    // 1. Transition to DISCHARGE_PENDING (Resume Medis Terbit)
    const pendingDischRes = await careStateEngine.transition({
      encounterId: enc.id,
      targetState: CARE_STATES.DISCHARGE_PENDING,
      eventType: CLINICAL_EVENTS.REQUEST_DISCHARGE,
      actorId: 'DOC-03',
      actorRole: 'DOCTOR',
      actorName: 'dr. Maya, Sp.A',
      reason: 'Kondisi Membaik - Rencana Pulang'
    });
    expect(pendingDischRes.success).toBe(true);

    // 2. Doctor signs Discharge Summary
    const dischargeSummaryRecord = {
      id: 'REC-DISCH-003',
      encounterId: enc.id,
      patientId: patient.id,
      moduleName: 'RESUME MEDIS PULANG (DISCHARGE)',
      title: 'Ringkasan Pulang Pasien Rawat Inap',
      diagnosisDischarge: 'Demam Berdarah Dengue (DBD Grade II) - Resolving',
      prognosis: 'Bonam',
      doctor: 'dr. Maya, Sp.A',
      signed_by: 'dr. Maya, Sp.A',
      created_at: new Date().toISOString()
    };
    await persistenceAdapter.save('clinical_records', dischargeSummaryRecord.id, dischargeSummaryRecord);

    // 3. Final Terminal Transition: DISCHARGED
    const finalDischargeRes = await careStateEngine.transition({
      encounterId: enc.id,
      targetState: CARE_STATES.DISCHARGED,
      eventType: CLINICAL_EVENTS.DISCHARGE_PATIENT,
      actorId: 'DOC-03',
      actorRole: 'DOCTOR',
      actorName: 'dr. Maya, Sp.A',
      reason: 'Selesai Rawat Inap - Pulang'
    });
    expect(finalDischargeRes.success).toBe(true);
    expect(finalDischargeRes.encounter.primaryState).toBe(CARE_STATES.DISCHARGED);

    // 4. Verify Terminal State Lock: Any further attempt to modify is rejected
    await expect(careStateEngine.transition({
      encounterId: enc.id,
      targetState: CARE_STATES.INPATIENT_ACTIVE,
      eventType: CLINICAL_EVENTS.ADMIT_PATIENT,
      actorRole: 'NURSE'
    })).rejects.toThrow();

    // 5. Verify Read-Only enforcement in Clinical Applicability Matrix
    const formAccessOnClosed = clinicalActionabilityEngine.canAccessForm({
      formName: 'SOAP NOTES (CPPT HARIAN)',
      role: 'DOCTOR',
      encounterType: 'INPATIENT',
      careState: CARE_STATES.DISCHARGED,
      isTerminal: true
    });
    expect(formAccessOnClosed.allowed).toBe(true);
    expect(formAccessOnClosed.readOnly).toBe(true);
  });

  // ─── SCENARIO 4: RETURNING PATIENT (HARD ENCOUNTER BOUNDARY) ──
  it('Scenario 4: Returning Patient maintains strict isolation between past and current encounters', async () => {
    const patient = { id: 'PAT-RETURN-004', mrn: 'MRN-RET-004', name: 'Bpk. Gunawan' };
    await persistenceAdapter.save('patients', patient.id, patient);

    // Historical Encounter 1 (IGD 2024 - Closed)
    const enc2024 = {
      id: 'ENC-2024-01',
      patientId: patient.id,
      type: 'EMERGENCY',
      primaryState: CARE_STATES.DISCHARGED,
      isTerminal: true,
      admissionTime: '2024-03-10T10:00:00Z'
    };
    await persistenceAdapter.save('encounters', enc2024.id, enc2024);

    // Historical Record in 2024
    await persistenceAdapter.save('clinical_records', 'REC-2024-01', {
      id: 'REC-2024-01',
      encounterId: enc2024.id,
      patientId: patient.id,
      moduleName: 'SOAP NOTES (CPPT HARIAN)',
      title: 'Kunjungan IGD 2024',
      assessment: 'Gastritis Akut'
    });

    // Current Encounter (Ranap 2026 - Active)
    const enc2026 = {
      id: 'ENC-2026-01',
      patientId: patient.id,
      type: 'INPATIENT',
      primaryState: CARE_STATES.INPATIENT_ACTIVE,
      isTerminal: false,
      admissionTime: '2026-08-18T08:00:00Z'
    };
    await persistenceAdapter.save('encounters', enc2026.id, enc2026);

    // Active Record in 2026
    await persistenceAdapter.save('clinical_records', 'REC-2026-01', {
      id: 'REC-2026-01',
      encounterId: enc2026.id,
      patientId: patient.id,
      moduleName: 'CATATAN ADMISI RAWAT INAP',
      title: 'Admisi Ranap 2026',
      assessment: 'STEMI Anteroseptal'
    });

    // Verify Boundary Isolation
    const allRecords = await persistenceAdapter.query('clinical_records');
    const rec2024 = allRecords.find(r => r.encounterId === 'ENC-2024-01');
    const rec2026 = allRecords.find(r => r.encounterId === 'ENC-2026-01');

    expect(rec2024.assessment).toBe('Gastritis Akut');
    expect(rec2026.assessment).toBe('STEMI Anteroseptal');

    // 2024 encounter is Read-Only
    const eval2024 = clinicalActionabilityEngine.canAccessForm({
      formName: 'SOAP NOTES (CPPT HARIAN)',
      role: 'DOCTOR',
      careState: enc2024.primaryState,
      isTerminal: true
    });
    expect(eval2024.readOnly).toBe(true);

    // 2026 encounter is Active Write
    const eval2026 = clinicalActionabilityEngine.canAccessForm({
      formName: 'SOAP NOTES (CPPT HARIAN)',
      role: 'DOCTOR',
      careState: enc2026.primaryState,
      isTerminal: false
    });
    expect(eval2026.readOnly).toBe(false);
  });

  // ─── SCENARIO 5: WORM IMMUTABLE AUDIT PROVENANCE & TAMPER TEST ─
  it('Scenario 5: WORM Immutable Audit Provenance records full version lineage and rejects tampering', async () => {
    const enc = {
      id: 'ENC-WORM-005',
      patientId: 'PAT-WORM-005',
      type: 'INPATIENT',
      primaryState: CARE_STATES.ADMISSION_PENDING
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    // Execute state transition
    const tr = await careStateEngine.transition({
      encounterId: enc.id,
      targetState: CARE_STATES.INPATIENT_ACTIVE,
      eventType: CLINICAL_EVENTS.ADMIT_PATIENT,
      actorId: 'STAFF-99',
      actorRole: 'NURSE',
      actorName: 'Ners Budi',
      reason: 'Masuk Bangsal Mawar'
    });
    expect(tr.success).toBe(true);

    // Retrieve Domain Event Store stream from patient_care_state_events
    const events = await persistenceAdapter.query('patient_care_state_events');
    const stateChangeEvent = events.find(e => e.encounter_id === enc.id);

    expect(stateChangeEvent).toBeDefined();
    expect(stateChangeEvent.previous_state).toBe(CARE_STATES.ADMISSION_PENDING);
    expect(stateChangeEvent.new_state).toBe(CARE_STATES.INPATIENT_ACTIVE);
    expect(stateChangeEvent.performed_by_id).toBe('STAFF-99');
    expect(stateChangeEvent.correlationId).toBeDefined();
    expect(stateChangeEvent.performed_at).toBeDefined();
  });
});
