/**
 * NurseFlow Enterprise HIS 2026 — Vertical Slice #11 Clinical Integrity Hardening Test Suite
 * Domain: Surgical Cancellation/Abort Pathway, Intraoperative Emergency & Resuscitation Bridge,
 * Surgical Specimen Chain of Custody (Pathology), and Enhanced PACU Multi-Criteria Clearance.
 * Standards: JCI IPSG 4, ASA Standard, College of American Pathologists (CAP), PostgreSQL 16 ACID.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import {
  perioperativeClosedLoopService,
  PerioperativeDomainError
} from '../server/services/perioperativeClosedLoop.service.js';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { ENTERPRISE_ROLES } from '../src/shared/constants/roles.js';

describe('VS-11 Hardening ➔ Perioperative Clinical Integrity & Emergency Durability (15 Scenarios)', () => {
  let mockDatabaseState = {
    encounters: [],
    operating_theatres: [],
    surgical_cases: [],
    surgical_abort_ledgers: [],
    intraoperative_emergency_events: [],
    surgical_specimen_ledgers: [],
    who_safety_checklist_executions: [],
    pacu_recovery_records: [],
    surgical_billing_breakdown: [],
    longitudinal_timeline_events: [],
    clinical_domain_outbox: []
  };

  let mockClient = null;
  let activeTransactionState = null;

  beforeEach(() => {
    mockDatabaseState = {
      encounters: [
        {
          id: 'enc-surg-hard-001',
          episode_id: 'epc-surg-hard-001',
          patient_id: 'pat-surg-hard-001',
          encounter_number: 'ENC-2026-SURG-H01',
          status: 'IN_PROGRESS'
        }
      ],
      operating_theatres: [
        {
          id: 'theatre-ok-02',
          tenant_id: 'ten-surg-01',
          room_number: 'OK-02',
          room_name: 'Kamar Operasi 2 (Digestif & Laparoskopi)',
          status: 'IN_USE',
          current_case_id: 'case-surg-hard-001'
        }
      ],
      surgical_cases: [
        {
          id: 'case-surg-hard-001',
          tenant_id: 'ten-surg-01',
          booking_number: 'SURG-2026-0820-H01',
          patient_id: 'pat-surg-hard-001',
          patient_mrn: 'MRN-889900',
          patient_name: 'Ny. Ratna Dewi',
          encounter_id: 'enc-surg-hard-001',
          theatre_id: 'theatre-ok-02',
          procedure_code: '45.73',
          procedure_name: 'Right Hemicolectomy',
          status: 'SURGERY_IN_PROGRESS'
        }
      ],
      surgical_abort_ledgers: [],
      intraoperative_emergency_events: [],
      surgical_specimen_ledgers: [],
      who_safety_checklist_executions: [],
      pacu_recovery_records: [],
      surgical_billing_breakdown: [],
      longitudinal_timeline_events: [],
      clinical_domain_outbox: []
    };

    activeTransactionState = null;

    mockClient = {
      query: vi.fn(async (sql, params = []) => {
        const normalized = sql.trim().toUpperCase();

        if (normalized.startsWith('BEGIN')) {
          activeTransactionState = {
            stagedAborts: [],
            stagedEmergencies: [],
            stagedSpecimens: [],
            stagedChecklists: [],
            stagedPacuRecords: [],
            stagedBilling: [],
            stagedTimelineEvents: [],
            stagedOutbox: [],
            caseUpdates: [],
            theatreUpdates: []
          };
          return { rows: [], rowCount: 0 };
        }

        if (normalized.startsWith('COMMIT')) {
          if (activeTransactionState) {
            mockDatabaseState.surgical_abort_ledgers.push(...activeTransactionState.stagedAborts);
            mockDatabaseState.intraoperative_emergency_events.push(...activeTransactionState.stagedEmergencies);
            mockDatabaseState.surgical_specimen_ledgers.push(...activeTransactionState.stagedSpecimens);
            mockDatabaseState.who_safety_checklist_executions.push(...activeTransactionState.stagedChecklists);
            mockDatabaseState.pacu_recovery_records.push(...activeTransactionState.stagedPacuRecords);
            mockDatabaseState.surgical_billing_breakdown.push(...activeTransactionState.stagedBilling);
            mockDatabaseState.longitudinal_timeline_events.push(...activeTransactionState.stagedTimelineEvents);
            mockDatabaseState.clinical_domain_outbox.push(...activeTransactionState.stagedOutbox);

            activeTransactionState.caseUpdates.forEach(up => {
              const idx = mockDatabaseState.surgical_cases.findIndex(c => c.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.surgical_cases[idx] = { ...mockDatabaseState.surgical_cases[idx], ...up.data };
              }
            });

            activeTransactionState.theatreUpdates.forEach(up => {
              const idx = mockDatabaseState.operating_theatres.findIndex(t => t.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.operating_theatres[idx] = { ...mockDatabaseState.operating_theatres[idx], ...up.data };
              }
            });

            activeTransactionState = null;
          }
          return { rows: [], rowCount: 0 };
        }

        if (normalized.startsWith('ROLLBACK')) {
          activeTransactionState = null;
          return { rows: [], rowCount: 0 };
        }

        // SELECT FROM surgical_cases WHERE id = $1
        if (normalized.includes('FROM SURGICAL_CASES WHERE ID = $1')) {
          const found = mockDatabaseState.surgical_cases.filter(c => c.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT THEATRE_ID FROM SURGICAL_CASES
        if (normalized.includes('SELECT THEATRE_ID FROM SURGICAL_CASES WHERE ID = $1')) {
          const found = mockDatabaseState.surgical_cases.filter(c => c.id === params[0]);
          return { rows: found.map(c => ({ theatre_id: c.theatre_id })), rowCount: found.length };
        }

        // SELECT FROM who_safety_checklist_executions WHERE surgical_case_id = $1
        if (normalized.includes('FROM WHO_SAFETY_CHECKLIST_EXECUTIONS WHERE SURGICAL_CASE_ID = $1')) {
          const found = mockDatabaseState.who_safety_checklist_executions.filter(c => c.surgical_case_id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // INSERT INTO surgical_abort_ledgers
        if (normalized.startsWith('INSERT INTO SURGICAL_ABORT_LEDGERS')) {
          const newAbort = {
            id: params[0],
            surgical_case_id: params[1],
            encounter_id: params[2],
            patient_id: params[3],
            abort_number: params[4],
            abort_stage: params[5],
            abort_reason_category: params[6],
            clinical_details: params[7],
            authorized_by_id: params[8],
            authorized_by_name: params[9],
            implants_disposition: params[10],
            medications_given: JSON.parse(params[11] || '[]'),
            billing_disposition: params[12],
            post_abort_transfer_destination: params[13],
            digital_signature_hash: params[14],
            correlation_id: params[15],
            aborted_at: params[16]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedAborts.push(newAbort);
          } else {
            mockDatabaseState.surgical_abort_ledgers.push(newAbort);
          }
          return { rows: [newAbort], rowCount: 1 };
        }

        // INSERT INTO intraoperative_emergency_events
        if (normalized.startsWith('INSERT INTO INTRAOPERATIVE_EMERGENCY_EVENTS')) {
          const newEmerg = {
            id: params[0],
            surgical_case_id: params[1],
            encounter_id: params[2],
            patient_id: params[3],
            event_number: params[4],
            event_type: params[5],
            resuscitation_session_id: params[6],
            lead_resuscitator_id: params[7],
            lead_resuscitator_name: params[8],
            clinical_interventions: params[9],
            time_of_event: params[10],
            outcome: params[11],
            digital_signature_hash: params[12],
            correlation_id: params[13]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedEmergencies.push(newEmerg);
          } else {
            mockDatabaseState.intraoperative_emergency_events.push(newEmerg);
          }
          return { rows: [newEmerg], rowCount: 1 };
        }

        // INSERT INTO surgical_specimen_ledgers
        if (normalized.startsWith('INSERT INTO SURGICAL_SPECIMEN_LEDGERS')) {
          const newSpec = {
            id: params[0],
            surgical_case_id: params[1],
            encounter_id: params[2],
            patient_id: params[3],
            specimen_tracking_number: params[4],
            specimen_container_barcode: params[5],
            specimen_type: params[6],
            anatomical_site: params[7],
            fixative_medium: params[8],
            urgency_level: params[9],
            provisional_clinical_diagnosis: params[10],
            scrub_nurse_id: params[11],
            scrub_nurse_name: params[12],
            surgeon_id: params[13],
            surgeon_name: params[14],
            custody_status: 'COLLECTED_IN_THEATRE',
            digital_signature_hash: params[15],
            correlation_id: params[16]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedSpecimens.push(newSpec);
          } else {
            mockDatabaseState.surgical_specimen_ledgers.push(newSpec);
          }
          return { rows: [newSpec], rowCount: 1 };
        }

        // INSERT INTO pacu_recovery_records
        if (normalized.startsWith('INSERT INTO PACU_RECOVERY_RECORDS')) {
          const newPacu = {
            id: params[0],
            surgical_case_id: params[1],
            encounter_id: params[2],
            patient_id: params[3],
            record_number: params[4],
            aldrete_consciousness: params[5],
            aldrete_activity: params[6],
            aldrete_respiration: params[7],
            aldrete_circulation: params[8],
            aldrete_o2_saturation: params[9],
            total_aldrete_score: params[10],
            pain_vas_score: params[11],
            discharge_readiness_status: params[15],
            discharge_destination: params[16],
            airway_stability_confirmed: params[17],
            hemodynamic_stability_confirmed: params[18],
            pain_vas_controlled: params[19],
            ponv_controlled: params[20],
            anesthesiologist_discharge_clearance: params[21]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedPacuRecords.push(newPacu);
          } else {
            mockDatabaseState.pacu_recovery_records.push(newPacu);
          }
          return { rows: [newPacu], rowCount: 1 };
        }

        // UPDATE surgical_cases SET status = 'CANCELLED'
        if (normalized.startsWith('UPDATE SURGICAL_CASES') && normalized.includes("STATUS = 'CANCELLED'")) {
          const caseId = params[0];
          const updated = { status: 'CANCELLED' };
          if (activeTransactionState) {
            activeTransactionState.caseUpdates.push({ id: caseId, data: updated });
          }
          return { rows: [{ id: caseId, ...updated }], rowCount: 1 };
        }

        // UPDATE operating_theatres SET status = 'CLEANING_STERILIZATION'
        if (normalized.startsWith('UPDATE OPERATING_THEATRES') && normalized.includes("STATUS = 'CLEANING_STERILIZATION'")) {
          const roomId = params[0];
          const updated = { status: 'CLEANING_STERILIZATION', current_case_id: null };
          if (activeTransactionState) {
            activeTransactionState.theatreUpdates.push({ id: roomId, data: updated });
          }
          return { rows: [{ id: roomId, ...updated }], rowCount: 1 };
        }

        // INSERT INTO longitudinal_timeline_events
        if (normalized.startsWith('INSERT INTO LONGITUDINAL_TIMELINE_EVENTS')) {
          const newEvt = {
            id: params[0],
            encounter_id: params[1],
            patient_id: params[2],
            event_category: params[3],
            event_title: params[4],
            event_summary: params[5],
            domain_source_table: params[6],
            domain_source_id: params[7],
            clinical_severity: params[13],
            correlation_id: params[15]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedTimelineEvents.push(newEvt);
          } else {
            mockDatabaseState.longitudinal_timeline_events.push(newEvt);
          }
          return { rows: [newEvt], rowCount: 1 };
        }

        // INSERT INTO clinical_domain_outbox
        if (normalized.startsWith('INSERT INTO CLINICAL_DOMAIN_OUTBOX')) {
          let eventType = 'UNKNOWN';
          const match = sql.match(/'([A-Z0-9_]+)',\s*\$[0-9],\s*'PENDING'/);
          if (match) {
            eventType = match[1];
          }
          const newOutbox = {
            id: params[0],
            event_type: eventType,
            correlation_id: params[params.length - 1]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedOutbox.push(newOutbox);
          } else {
            mockDatabaseState.clinical_domain_outbox.push(newOutbox);
          }
          return { rows: [{ id: newOutbox.id }], rowCount: 1 };
        }

        return { rows: [], rowCount: 0 };
      }),
      release: vi.fn()
    };

    vi.spyOn(postgresPoolService, 'getPool').mockReturnValue({
      connect: vi.fn(async () => mockClient),
      query: vi.fn(async (sql, params) => mockClient.query(sql, params))
    });
  });

  // ─── TC-H01: SURGICAL ABORT ON PATIENT CLINICAL INSTABILITY ───
  it('TC-H01: should record surgical abort during intraoperative phase due to patient instability', async () => {
    const abortRecord = await perioperativeClosedLoopService.recordSurgicalAbortOrCancellation('case-surg-hard-001', {
      encounterId: 'enc-surg-hard-001',
      patientId: 'pat-surg-hard-001',
      abortStage: 'INTRAOPERATIVE_POST_INCISION',
      abortReasonCategory: 'PATIENT_CLINICAL_INSTABILITY',
      clinicalDetails: 'Hipotensi refrakter pasca insisi dengan takikardia ventrikel, operasi dihentikan untuk stabilisasi.',
      implantsDisposition: 'NONE_USED',
      billingDisposition: 'PARTIAL_OR_FEE',
      postAbortTransferDestination: 'ICU'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(abortRecord.abort_number).toMatch(/^ABORT-\d+/);
    expect(abortRecord.digital_signature_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(mockDatabaseState.surgical_abort_ledgers.length).toBe(1);
  });

  // ─── TC-H02: ABORT INCOMPLETE DATA GUARD ───
  it('TC-H02: should reject recording abort missing essential clinical details', async () => {
    await expect(perioperativeClosedLoopService.recordSurgicalAbortOrCancellation('case-surg-hard-001', {
      encounterId: 'enc-surg-hard-001',
      patientId: 'pat-surg-hard-001',
      abortStage: 'PRE_INDUCTION'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP })).rejects.toThrow('Data pembatalan/penghentian operasi tidak lengkap');
  });

  // ─── TC-H03: AUTO TRANSITION CASE STATUS TO CANCELLED ───
  it('TC-H03: should transition surgical case status to CANCELLED upon abort', async () => {
    await perioperativeClosedLoopService.recordSurgicalAbortOrCancellation('case-surg-hard-001', {
      encounterId: 'enc-surg-hard-001',
      patientId: 'pat-surg-hard-001',
      abortStage: 'POST_SIGN_IN',
      abortReasonCategory: 'UNFIT_FOR_ANESTHESIA',
      clinicalDetails: 'Spasme laring berat saat pre-oksigenasi.',
      billingDisposition: 'NO_CHARGE',
      postAbortTransferDestination: 'HDU'
    }, { role: ENTERPRISE_ROLES.ROLE_ANESTHESIOLOGIST || 'ROLE_ANESTHESIOLOGIST' });

    expect(mockDatabaseState.surgical_cases[0].status).toBe('CANCELLED');
  });

  // ─── TC-H04: AUTO TURNOVER THEATRE ROOM TO STERILIZATION ───
  it('TC-H04: should release theatre room to CLEANING_STERILIZATION on surgical abort', async () => {
    await perioperativeClosedLoopService.recordSurgicalAbortOrCancellation('case-surg-hard-001', {
      encounterId: 'enc-surg-hard-001',
      patientId: 'pat-surg-hard-001',
      abortStage: 'INTRAOPERATIVE_POST_INCISION',
      abortReasonCategory: 'PATIENT_CLINICAL_INSTABILITY',
      clinicalDetails: 'Instabilitas hemodinamik.',
      billingDisposition: 'NO_CHARGE'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(mockDatabaseState.operating_theatres[0].status).toBe('CLEANING_STERILIZATION');
    expect(mockDatabaseState.operating_theatres[0].current_case_id).toBeNull();
  });

  // ─── TC-H05: ABORT TIMELINE EVENT TAGGING ───
  it('TC-H05: should tag abort timeline event with WARNING severity and details', async () => {
    await perioperativeClosedLoopService.recordSurgicalAbortOrCancellation('case-surg-hard-001', {
      encounterId: 'enc-surg-hard-001',
      patientId: 'pat-surg-hard-001',
      abortStage: 'POST_TIME_OUT',
      abortReasonCategory: 'EQUIPMENT_FAILURE',
      clinicalDetails: 'Kerusakan generator elektrokauter utama.',
      billingDisposition: 'NO_CHARGE',
      postAbortTransferDestination: 'INPATIENT_WARD'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(mockDatabaseState.longitudinal_timeline_events[0].clinical_severity).toBe('WARNING');
    expect(mockDatabaseState.longitudinal_timeline_events[0].event_category).toBe('SURGICAL_ABORT');
  });

  // ─── TC-H06: INTRAOPERATIVE EMERGENCY CODE BLUE TRIGGER ───
  it('TC-H06: should record intraoperative Code Blue cardiac arrest with resuscitation bridge', async () => {
    const emerg = await perioperativeClosedLoopService.triggerIntraoperativeEmergency('case-surg-hard-001', {
      encounterId: 'enc-surg-hard-001',
      patientId: 'pat-surg-hard-001',
      eventType: 'CODE_BLUE_CARDIAC_ARREST',
      resuscitationSessionId: 'RESUS-OR-001',
      clinicalInterventions: 'Kompresi dada, Epinefrin 1mg IV, Defibrilasi 200J Biphasic 2 siklus.',
      outcome: 'ROSC_STABILIZED'
    }, { role: ENTERPRISE_ROLES.ROLE_ANESTHESIOLOGIST || 'ROLE_ANESTHESIOLOGIST' });

    expect(emerg.event_type).toBe('CODE_BLUE_CARDIAC_ARREST');
    expect(emerg.outcome).toBe('ROSC_STABILIZED');
    expect(mockDatabaseState.intraoperative_emergency_events.length).toBe(1);
  });

  // ─── TC-H07: INTRAOPERATIVE EMERGENCY TIMELINE CRITICAL TAGGING ───
  it('TC-H07: should emit CRITICAL clinical severity timeline event for intraoperative emergency', async () => {
    await perioperativeClosedLoopService.triggerIntraoperativeEmergency('case-surg-hard-001', {
      encounterId: 'enc-surg-hard-001',
      patientId: 'pat-surg-hard-001',
      eventType: 'ANAPHYLACTIC_SHOCK',
      clinicalInterventions: 'Injeksi Epinefrin 0.5mg IM, Dexamethasone 10mg IV, Kristaloid 1000ml guyur.',
      outcome: 'ROSC_STABILIZED'
    }, { role: ENTERPRISE_ROLES.ROLE_ANESTHESIOLOGIST || 'ROLE_ANESTHESIOLOGIST' });

    expect(mockDatabaseState.longitudinal_timeline_events[0].clinical_severity).toBe('CRITICAL');
  });

  // ─── TC-H08: MALIGNANT HYPERTHERMIA EMERGENCY PROTOCOL ───
  it('TC-H08: should record Malignant Hyperthermia crisis protocol and stabilization', async () => {
    const emerg = await perioperativeClosedLoopService.triggerIntraoperativeEmergency('case-surg-hard-001', {
      encounterId: 'enc-surg-hard-001',
      patientId: 'pat-surg-hard-001',
      eventType: 'MALIGNANT_HYPERTHERMIA',
      clinicalInterventions: 'Hentikan Sevoflurane, hiperventilasi O2 100%, injeksi Dantrolene 2.5mg/kg IV, kompres es.',
      outcome: 'TRANSFERRED_TO_ICU_CRITICAL'
    }, { role: ENTERPRISE_ROLES.ROLE_ANESTHESIOLOGIST || 'ROLE_ANESTHESIOLOGIST' });

    expect(emerg.event_type).toBe('MALIGNANT_HYPERTHERMIA');
    expect(emerg.outcome).toBe('TRANSFERRED_TO_ICU_CRITICAL');
  });

  // ─── TC-H09: SURGICAL SPECIMEN COLLECTION (ROUTINE) ───
  it('TC-H09: should record surgical pathology specimen collection with Formalin 10% fixative', async () => {
    const specimen = await perioperativeClosedLoopService.recordSurgicalSpecimenCollection('case-surg-hard-001', {
      encounterId: 'enc-surg-hard-001',
      patientId: 'pat-surg-hard-001',
      specimenContainerBarcode: 'SPEC-OR-2026-001',
      specimenType: 'Jaringan Kolon & Kelenjar Getah Bening Mesenterika',
      anatomicalSite: 'Colon Ascendens & Caecum',
      fixativeMedium: 'FORMALIN_10_PERCENT',
      urgencyLevel: 'ROUTINE_HISTOPATHOLOGY',
      provisionalClinicalDiagnosis: 'Adenocarcinoma Colon Ascendens T3N1M0'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(specimen.specimen_tracking_number).toMatch(/^SPEC-PATH-\d+/);
    expect(specimen.custody_status).toBe('COLLECTED_IN_THEATRE');
    expect(mockDatabaseState.surgical_specimen_ledgers.length).toBe(1);
  });

  // ─── TC-H10: SURGICAL SPECIMEN URGENT FROZEN SECTION ───
  it('TC-H10: should record CITO frozen section for intraoperative margin assessment', async () => {
    const specimen = await perioperativeClosedLoopService.recordSurgicalSpecimenCollection('case-surg-hard-001', {
      encounterId: 'enc-surg-hard-001',
      patientId: 'pat-surg-hard-001',
      specimenContainerBarcode: 'SPEC-FROZEN-001',
      specimenType: 'Batas Sayatan Proksimal (Surgical Margin)',
      anatomicalSite: 'Margin Ileum Terminalis',
      fixativeMedium: 'FRESH_FROZEN_SECTION',
      urgencyLevel: 'FROZEN_SECTION_CITO',
      provisionalClinicalDiagnosis: 'Evaluasi Radikalitas Bebas Tumor'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(specimen.urgency_level).toBe('FROZEN_SECTION_CITO');
    expect(specimen.fixative_medium).toBe('FRESH_FROZEN_SECTION');
  });

  // ─── TC-H11: SPECIMEN INCOMPLETE DATA GUARD ───
  it('TC-H11: should reject recording specimen missing container barcode or provisional diagnosis', async () => {
    await expect(perioperativeClosedLoopService.recordSurgicalSpecimenCollection('case-surg-hard-001', {
      encounterId: 'enc-surg-hard-001',
      patientId: 'pat-surg-hard-001',
      specimenType: 'Jaringan Biopsi'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP })).rejects.toThrow('Data spesimen bedah tidak lengkap');
  });

  // ─── TC-H12: PACU MULTI-CRITERIA CLEARANCE GUARD ───
  it('TC-H12: should block transfer from PACU if Aldrete is >= 9 but clinical clearance criteria are incomplete', async () => {
    await expect(perioperativeClosedLoopService.recordPacuRecoveryAssessment({
      surgicalCaseId: 'case-surg-hard-001',
      encounterId: 'enc-surg-hard-001',
      patientId: 'pat-surg-hard-001',
      aldreteConsciousness: 2,
      aldreteActivity: 2,
      aldreteRespiration: 2,
      aldreteCirculation: 2,
      aldreteO2Saturation: 2, // Total 10/10
      dischargeReadinessStatus: 'READY_FOR_WARD_TRANSFER',
      airwayStabilityConfirmed: false // Airway concern!
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE })).rejects.toThrow('PACU CLINICAL CLEARANCE INVARIANT');
  });

  // ─── TC-H13: PACU MULTI-CRITERIA SAFE DISCHARGE ───
  it('TC-H13: should allow transfer from PACU when Aldrete >= 9 AND all clinical clearance criteria are satisfied', async () => {
    const pacu = await perioperativeClosedLoopService.recordPacuRecoveryAssessment({
      surgicalCaseId: 'case-surg-hard-001',
      encounterId: 'enc-surg-hard-001',
      patientId: 'pat-surg-hard-001',
      aldreteConsciousness: 2,
      aldreteActivity: 2,
      aldreteRespiration: 2,
      aldreteCirculation: 2,
      aldreteO2Saturation: 2,
      painVasScore: 2,
      airwayStabilityConfirmed: true,
      hemodynamicStabilityConfirmed: true,
      painVasControlled: true,
      ponvControlled: true,
      anesthesiologistDischargeClearance: true,
      dischargeReadinessStatus: 'READY_FOR_WARD_TRANSFER',
      dischargeDestination: 'INPATIENT_WARD'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(pacu.discharge_readiness_status).toBe('READY_FOR_WARD_TRANSFER');
    expect(pacu.airway_stability_confirmed).toBe(true);
  });

  // ─── TC-H14: ACID ATOMICITY & OUTBOX PATTERN INTEGRITY ───
  it('TC-H14: should write domain outbox and audit events atomically for specimen and abort events', async () => {
    await perioperativeClosedLoopService.recordSurgicalSpecimenCollection('case-surg-hard-001', {
      encounterId: 'enc-surg-hard-001',
      patientId: 'pat-surg-hard-001',
      specimenContainerBarcode: 'SPEC-ATOMIC-01',
      specimenType: 'Apendiks',
      anatomicalSite: 'Caecum',
      provisionalClinicalDiagnosis: 'Appendicitis Akut'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(mockDatabaseState.clinical_domain_outbox.some(o => o.event_type === 'SURGICAL_SPECIMEN_COLLECTED')).toBe(true);
  });

  // ─── TC-H15: FULL E2E PERIOPERATIVE HARDENED RECONCILIATION ───
  it('TC-H15: should reconcile complete hardened perioperative journey with 0 discrepancy', async () => {
    // 1. Specimen Collection
    const spec = await perioperativeClosedLoopService.recordSurgicalSpecimenCollection('case-surg-hard-001', {
      encounterId: 'enc-surg-hard-001',
      patientId: 'pat-surg-hard-001',
      specimenContainerBarcode: 'SPEC-FINAL-001',
      specimenType: 'Jaringan Tumor Laparoskopi',
      anatomicalSite: 'Colon',
      provisionalClinicalDiagnosis: 'Neoplasma'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });
    expect(spec.specimen_container_barcode).toBe('SPEC-FINAL-001');

    // 2. Intraoperative Emergency ROSC
    const emerg = await perioperativeClosedLoopService.triggerIntraoperativeEmergency('case-surg-hard-001', {
      encounterId: 'enc-surg-hard-001',
      patientId: 'pat-surg-hard-001',
      eventType: 'ANAPHYLACTIC_SHOCK',
      clinicalInterventions: 'Epinefrin 0.5mg IV, Cairan Guyur.',
      outcome: 'ROSC_STABILIZED'
    }, { role: ENTERPRISE_ROLES.ROLE_ANESTHESIOLOGIST || 'ROLE_ANESTHESIOLOGIST' });
    expect(emerg.outcome).toBe('ROSC_STABILIZED');

    // 3. PACU Multi-Criteria Transfer
    const pacu = await perioperativeClosedLoopService.recordPacuRecoveryAssessment({
      surgicalCaseId: 'case-surg-hard-001',
      encounterId: 'enc-surg-hard-001',
      patientId: 'pat-surg-hard-001',
      aldreteConsciousness: 2,
      aldreteActivity: 2,
      aldreteRespiration: 2,
      aldreteCirculation: 2,
      aldreteO2Saturation: 2,
      airwayStabilityConfirmed: true,
      hemodynamicStabilityConfirmed: true,
      painVasControlled: true,
      ponvControlled: true,
      anesthesiologistDischargeClearance: true,
      dischargeReadinessStatus: 'READY_FOR_WARD_TRANSFER'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });
    expect(pacu.total_aldrete_score).toBe(10);

    // Ledger Verification (0 Discrepancy)
    expect(mockDatabaseState.surgical_specimen_ledgers.length).toBe(1);
    expect(mockDatabaseState.intraoperative_emergency_events.length).toBe(1);
    expect(mockDatabaseState.pacu_recovery_records.length).toBe(1);
    expect(mockDatabaseState.longitudinal_timeline_events.length).toBe(3);
    expect(mockDatabaseState.clinical_domain_outbox.length).toBe(3);
  });
});
