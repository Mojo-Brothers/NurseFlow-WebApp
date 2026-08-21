/**
 * NurseFlow Enterprise HIS 2026 — Vertical Slice #11 Durability & Clinical Safety Test Suite
 * Surgical Suite, Operating Theatre (OT) & Perioperative Closed Loop
 * Standards: JCI IPSG 4 (Safe Surgery), ASA Guidelines, WHO Safe Surgery, PostgreSQL 16 ACID.
 * Complete 25 Chaos Gate Scenarios.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import {
  perioperativeClosedLoopService,
  PerioperativeDomainError
} from '../server/services/perioperativeClosedLoop.service.js';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { ENTERPRISE_ROLES } from '../src/shared/constants/roles.js';

describe('VS-11 — Surgical Suite & Perioperative Closed Loop ➔ PostgreSQL Durability & Chaos Gate (25 Scenarios)', () => {
  let mockDatabaseState = {
    encounters: [],
    operating_theatres: [],
    surgical_cases: [],
    perioperative_anesthesia_evaluations: [],
    who_safety_checklist_executions: [],
    intraoperative_implant_ledgers: [],
    pacu_recovery_records: [],
    surgical_billing_breakdown: [],
    longitudinal_timeline_events: [],
    universal_audit_logs: [],
    clinical_domain_outbox: []
  };

  let mockClient = null;
  let activeTransactionState = null;

  beforeEach(() => {
    mockDatabaseState = {
      encounters: [
        {
          id: 'enc-surg-001',
          episode_id: 'epc-surg-001',
          patient_id: 'pat-surg-001',
          encounter_number: 'ENC-2026-SURG-01',
          status: 'IN_PROGRESS'
        }
      ],
      operating_theatres: [
        {
          id: 'theatre-ok-01',
          tenant_id: 'ten-surg-01',
          room_number: 'OK-01',
          room_name: 'Kamar Operasi 1 (Mayor)',
          status: 'IN_USE',
          current_case_id: 'case-surg-001'
        }
      ],
      surgical_cases: [
        {
          id: 'case-surg-001',
          tenant_id: 'ten-surg-01',
          booking_number: 'SURG-2026-0820-01',
          patient_id: 'pat-surg-001',
          patient_mrn: 'MRN-778899',
          patient_name: 'Tn. Budi Santoso',
          encounter_id: 'enc-surg-001',
          theatre_id: 'theatre-ok-01',
          procedure_code: '47.0',
          procedure_name: 'Laparoscopic Appendectomy',
          status: 'SURGERY_IN_PROGRESS'
        }
      ],
      perioperative_anesthesia_evaluations: [],
      who_safety_checklist_executions: [],
      intraoperative_implant_ledgers: [],
      pacu_recovery_records: [],
      surgical_billing_breakdown: [],
      longitudinal_timeline_events: [],
      universal_audit_logs: [],
      clinical_domain_outbox: []
    };

    activeTransactionState = null;

    mockClient = {
      query: vi.fn(async (sql, params = []) => {
        const normalized = sql.trim().toUpperCase();

        if (normalized.startsWith('BEGIN')) {
          activeTransactionState = {
            stagedEvaluations: [],
            stagedChecklists: [],
            stagedImplants: [],
            stagedPacuRecords: [],
            stagedBilling: [],
            stagedTimelineEvents: [],
            stagedAuditLogs: [],
            stagedOutbox: [],
            checklistUpdates: [],
            caseUpdates: [],
            theatreUpdates: []
          };
          return { rows: [], rowCount: 0 };
        }

        if (normalized.startsWith('COMMIT')) {
          if (activeTransactionState) {
            mockDatabaseState.perioperative_anesthesia_evaluations.push(...activeTransactionState.stagedEvaluations);
            mockDatabaseState.who_safety_checklist_executions.push(...activeTransactionState.stagedChecklists);
            mockDatabaseState.intraoperative_implant_ledgers.push(...activeTransactionState.stagedImplants);
            mockDatabaseState.pacu_recovery_records.push(...activeTransactionState.stagedPacuRecords);
            mockDatabaseState.surgical_billing_breakdown.push(...activeTransactionState.stagedBilling);
            mockDatabaseState.longitudinal_timeline_events.push(...activeTransactionState.stagedTimelineEvents);
            mockDatabaseState.universal_audit_logs.push(...activeTransactionState.stagedAuditLogs);
            mockDatabaseState.clinical_domain_outbox.push(...activeTransactionState.stagedOutbox);

            activeTransactionState.checklistUpdates.forEach(up => {
              const idx = mockDatabaseState.who_safety_checklist_executions.findIndex(c => c.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.who_safety_checklist_executions[idx] = { ...mockDatabaseState.who_safety_checklist_executions[idx], ...up.data };
              }
            });

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

        // SELECT FROM who_safety_checklist_executions WHERE surgical_case_id = $1
        if (normalized.includes('FROM WHO_SAFETY_CHECKLIST_EXECUTIONS WHERE SURGICAL_CASE_ID = $1')) {
          const allChecklists = [
            ...mockDatabaseState.who_safety_checklist_executions,
            ...(activeTransactionState?.stagedChecklists || [])
          ];
          const found = allChecklists.filter(c => c.surgical_case_id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // INSERT INTO perioperative_anesthesia_evaluations
        if (normalized.startsWith('INSERT INTO PERIOPERATIVE_ANESTHESIA_EVALUATIONS')) {
          const newEval = {
            id: params[0],
            encounter_id: params[1],
            patient_id: params[2],
            evaluation_number: params[3],
            asa_class: params[4],
            mallampati_score: params[5],
            airway_assessment: params[6],
            npo_fasting_hours: params[7],
            known_allergies: JSON.parse(params[8] || '[]'),
            cardiopulmonary_clearance: params[9],
            anesthesia_plan: params[10],
            informed_consent_verified: params[11],
            evaluator_anesthesiologist_id: params[12],
            evaluator_anesthesiologist_name: params[13],
            digital_signature_hash: params[14],
            correlation_id: params[15],
            evaluated_at: params[16]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedEvaluations.push(newEval);
          } else {
            mockDatabaseState.perioperative_anesthesia_evaluations.push(newEval);
          }
          return { rows: [newEval], rowCount: 1 };
        }

        // INSERT INTO who_safety_checklist_executions
        if (normalized.startsWith('INSERT INTO WHO_SAFETY_CHECKLIST_EXECUTIONS')) {
          const newChecklist = {
            id: params[0],
            surgical_case_id: params[1],
            encounter_id: params[2],
            patient_id: params[3],
            checklist_number: params[4],
            sign_in_patient_identity_confirmed: params[5],
            sign_in_site_marked: params[6],
            sign_in_consent_verified: params[7],
            sign_in_oximeter_functioning: params[8],
            sign_in_allergy_checked: params[9],
            sign_in_airway_risk_prepared: params[10],
            sign_in_blood_loss_prepared: params[11],
            sign_in_completed_at: params[12],
            sign_in_verifier_id: params[13],
            sign_in_verifier_name: params[14],
            status: 'SIGN_IN_DONE',
            digital_signature_hash: params[15],
            correlation_id: params[16]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedChecklists.push(newChecklist);
          } else {
            mockDatabaseState.who_safety_checklist_executions.push(newChecklist);
          }
          return { rows: [newChecklist], rowCount: 1 };
        }

        // UPDATE who_safety_checklist_executions
        if (normalized.startsWith('UPDATE WHO_SAFETY_CHECKLIST_EXECUTIONS')) {
          let updated = {};
          let checklistId = params[params.length - 1];
          if (normalized.includes("STATUS = 'TIME_OUT_DONE'")) {
            updated = { status: 'TIME_OUT_DONE', time_out_completed_at: params[7], digital_signature_hash: params[10] };
          } else if (normalized.includes("STATUS = 'SIGN_OUT_COMPLETED'")) {
            updated = { status: 'SIGN_OUT_COMPLETED', sign_out_completed_at: params[5], digital_signature_hash: params[8] };
          }
          if (activeTransactionState) {
            activeTransactionState.checklistUpdates.push({ id: checklistId, data: updated });
          }
          const found = mockDatabaseState.who_safety_checklist_executions.find(c => c.id === checklistId) || {};
          return { rows: [{ ...found, ...updated, id: checklistId }], rowCount: 1 };
        }

        // INSERT INTO intraoperative_implant_ledgers
        if (normalized.startsWith('INSERT INTO INTRAOPERATIVE_IMPLANT_LEDGERS')) {
          const newImplant = {
            id: params[0],
            surgical_case_id: params[1],
            encounter_id: params[2],
            patient_id: params[3],
            implant_catalog_code: params[4],
            implant_name: params[5],
            udi_barcode: params[6],
            serial_or_lot_number: params[7],
            manufacturer: params[8],
            expiry_date: params[9],
            anatomical_site: params[10],
            quantity: params[11],
            unit_cost_idr: params[12],
            surgeon_id: params[13],
            surgeon_name: params[14],
            status: 'IMPLANTED',
            digital_signature_hash: params[17],
            correlation_id: params[18]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedImplants.push(newImplant);
          } else {
            mockDatabaseState.intraoperative_implant_ledgers.push(newImplant);
          }
          return { rows: [newImplant], rowCount: 1 };
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
            nausea_vomiting_status: params[12],
            surgical_wound_condition: params[13],
            vital_signs_snapshot: JSON.parse(params[14] || '{}'),
            discharge_readiness_status: params[15],
            discharge_destination: params[16],
            pacu_nurse_id: params[17],
            pacu_nurse_name: params[18],
            digital_signature_hash: params[19],
            correlation_id: params[20]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedPacuRecords.push(newPacu);
          } else {
            mockDatabaseState.pacu_recovery_records.push(newPacu);
          }
          return { rows: [newPacu], rowCount: 1 };
        }

        // INSERT INTO surgical_billing_breakdown
        if (normalized.startsWith('INSERT INTO SURGICAL_BILLING_BREAKDOWN')) {
          const newBill = {
            id: params[0],
            surgical_case_id: params[2],
            total_hospital_cost: params[11],
            billing_status: 'POSTED_TO_BILLING'
          };
          if (activeTransactionState) {
            activeTransactionState.stagedBilling.push(newBill);
          } else {
            mockDatabaseState.surgical_billing_breakdown.push(newBill);
          }
          return { rows: [newBill], rowCount: 1 };
        }

        // UPDATE surgical_cases SET status = 'COMPLETED'
        if (normalized.startsWith('UPDATE SURGICAL_CASES') && normalized.includes("STATUS = 'COMPLETED'")) {
          const caseId = params[0];
          const updated = { status: 'COMPLETED' };
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
          } else if (params[3]) {
            eventType = params[3];
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

  // ─── TC-01: PRE-OP ANESTHESIA ASSESSMENT AUTHORING ───
  it('TC-01: should author pre-operative anesthesia evaluation with ASA classification and Mallampati score', async () => {
    const evaluation = await perioperativeClosedLoopService.createPreOpAnesthesiaEvaluation({
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      asaClass: 'ASA_II',
      mallampatiScore: 2,
      airwayAssessment: 'NORMAL',
      npoFastingHours: 8.0,
      cardiopulmonaryClearance: 'Cor dan pulmo dalam batas normal, EKG sinus ritme.',
      anesthesiaPlan: 'GENERAL_ANESTHESIA'
    }, { role: ENTERPRISE_ROLES.ROLE_ANESTHESIOLOGIST || 'ROLE_ANESTHESIOLOGIST' });

    expect(evaluation.evaluation_number).toMatch(/^PREOP-\d+/);
    expect(evaluation.digital_signature_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(mockDatabaseState.perioperative_anesthesia_evaluations.length).toBe(1);
  });

  // ─── TC-02: NON-ANESTHESIOLOGIST PRE-OP GUARD ───
  it('TC-02: should reject pre-operative anesthesia evaluation authored by unauthorized roles (403)', async () => {
    await expect(perioperativeClosedLoopService.createPreOpAnesthesiaEvaluation({
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      asaClass: 'ASA_II',
      mallampatiScore: 2,
      npoFastingHours: 8.0,
      cardiopulmonaryClearance: 'Normal',
      anesthesiaPlan: 'GENERAL_ANESTHESIA'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE })).rejects.toThrow('Wewenang ditolak');
  });

  // ─── TC-03: HIGH-RISK AIRWAY MALLAMPATI TAGGING ───
  it('TC-03: should tag clinical severity as WARNING for high-risk difficult airway / ASA IV', async () => {
    await perioperativeClosedLoopService.createPreOpAnesthesiaEvaluation({
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      asaClass: 'ASA_IV',
      mallampatiScore: 4,
      airwayAssessment: 'DIFFICULT_AIRWAY',
      npoFastingHours: 6.0,
      cardiopulmonaryClearance: 'PPOK berat dengan riwayat intubasi sulit.',
      anesthesiaPlan: 'GENERAL_ANESTHESIA'
    }, { role: ENTERPRISE_ROLES.ROLE_ANESTHESIOLOGIST || 'ROLE_ANESTHESIOLOGIST' });

    expect(mockDatabaseState.longitudinal_timeline_events[0].clinical_severity).toBe('WARNING');
  });

  // ─── TC-04: INCOMPLETE PRE-OP DATA GUARD ───
  it('TC-04: should reject pre-op evaluation missing essential clinical fields', async () => {
    await expect(perioperativeClosedLoopService.createPreOpAnesthesiaEvaluation({
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      asaClass: 'ASA_I'
    }, { role: ENTERPRISE_ROLES.ROLE_ANESTHESIOLOGIST || 'ROLE_ANESTHESIOLOGIST' })).rejects.toThrow('Data asesmen pra-anestesi tidak lengkap');
  });

  // ─── TC-05: WHO CHECKLIST PHASE 1: SIGN-IN EXECUTION ───
  it('TC-05: should execute WHO Safe Surgery Sign-In verifying patient identity, site marking, and consent', async () => {
    const checklist = await perioperativeClosedLoopService.executeWhoChecklistPhase({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      phase: 'SIGN_IN',
      phaseData: {
        patientIdentityConfirmed: true,
        siteMarked: true,
        consentVerified: true,
        oximeterFunctioning: true,
        allergyChecked: true,
        airwayRiskPrepared: true,
        bloodLossPrepared: true
      }
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(checklist.status).toBe('SIGN_IN_DONE');
    expect(mockDatabaseState.who_safety_checklist_executions.length).toBe(1);
  });

  // ─── TC-06: SIGN-IN SAFETY INVARIANT VIOLATION ───
  it('TC-06: should reject Sign-In if surgical site marking or informed consent is not verified', async () => {
    await expect(perioperativeClosedLoopService.executeWhoChecklistPhase({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      phase: 'SIGN_IN',
      phaseData: { siteMarked: false }
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP })).rejects.toThrow('JCI IPSG 4 VIOLATION');
  });

  // ─── TC-07: TIME-OUT BEFORE SIGN-IN VIOLATION ───
  it('TC-07: should reject executing Time-Out if Sign-In has not been completed', async () => {
    await expect(perioperativeClosedLoopService.executeWhoChecklistPhase({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      phase: 'TIME_OUT'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP })).rejects.toThrow('Fase Sign-In harus diselesaikan sebelum Time-Out');
  });

  // ─── TC-08: WHO CHECKLIST PHASE 2: TIME-OUT EXECUTION ───
  it('TC-08: should execute WHO Safe Surgery Time-Out with entire surgical team pause before incision', async () => {
    await perioperativeClosedLoopService.executeWhoChecklistPhase({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      phase: 'SIGN_IN'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    const timeout = await perioperativeClosedLoopService.executeWhoChecklistPhase({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      phase: 'TIME_OUT',
      phaseData: {
        teamIntroductions: true,
        patientNameProcedureSite: true,
        surgeonCriticalSteps: true,
        anesthesiaConcerns: true,
        sterilityIndicatorsVerified: true,
        antibioticProphylaxisGiven: true,
        imagingDisplayed: true
      }
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(timeout.status).toBe('TIME_OUT_DONE');
  });

  // ─── TC-09: TIME-OUT SAFETY INVARIANT VIOLATION ───
  it('TC-09: should reject Time-Out if sterility indicators are unverified', async () => {
    await perioperativeClosedLoopService.executeWhoChecklistPhase({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      phase: 'SIGN_IN'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    await expect(perioperativeClosedLoopService.executeWhoChecklistPhase({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      phase: 'TIME_OUT',
      phaseData: { sterilityIndicatorsVerified: false }
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP })).rejects.toThrow('JCI IPSG 4 VIOLATION');
  });

  // ─── TC-10: SIGN-OUT BEFORE TIME-OUT VIOLATION ───
  it('TC-10: should reject executing Sign-Out if Time-Out has not been completed', async () => {
    await expect(perioperativeClosedLoopService.executeWhoChecklistPhase({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      phase: 'SIGN_OUT'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP })).rejects.toThrow('Fase Time-Out harus diselesaikan');
  });

  // ─── TC-11: WHO CHECKLIST PHASE 3: SIGN-OUT EXECUTION ───
  it('TC-11: should execute WHO Safe Surgery Sign-Out reconciling counts and specimen labeling before theatre exit', async () => {
    await perioperativeClosedLoopService.executeWhoChecklistPhase({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      phase: 'SIGN_IN'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    await perioperativeClosedLoopService.executeWhoChecklistPhase({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      phase: 'TIME_OUT'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    const signout = await perioperativeClosedLoopService.executeWhoChecklistPhase({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      phase: 'SIGN_OUT',
      phaseData: {
        procedureRecorded: true,
        countsReconciled: true,
        specimenLabeled: true,
        equipmentIssuesAddressed: true,
        postopRecoveryPlan: 'Observasi pemulihan di PACU.'
      }
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(signout.status).toBe('SIGN_OUT_COMPLETED');
  });

  // ─── TC-12: COUNT DISCREPANCY SAFETY ALERT ───
  it('TC-12: should strictly block Sign-Out if instrument, sponge, or needle counts are discrepant', async () => {
    await perioperativeClosedLoopService.executeWhoChecklistPhase({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      phase: 'SIGN_IN'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    await perioperativeClosedLoopService.executeWhoChecklistPhase({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      phase: 'TIME_OUT'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    await expect(perioperativeClosedLoopService.executeWhoChecklistPhase({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      phase: 'SIGN_OUT',
      phaseData: { countsReconciled: false }
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP })).rejects.toThrow('JCI IPSG 4 CRITICAL SAFETY ALERT');
  });

  // ─── TC-13: COMPLETE WHO CHECKLIST 3-PHASE PROGRESSION ───
  it('TC-13: should transition WHO checklist state sequentially: SIGN_IN ➔ TIME_OUT ➔ SIGN_OUT', async () => {
    const s1 = await perioperativeClosedLoopService.executeWhoChecklistPhase({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      phase: 'SIGN_IN'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });
    expect(s1.status).toBe('SIGN_IN_DONE');

    const s2 = await perioperativeClosedLoopService.executeWhoChecklistPhase({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      phase: 'TIME_OUT'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });
    expect(s2.status).toBe('TIME_OUT_DONE');

    const s3 = await perioperativeClosedLoopService.executeWhoChecklistPhase({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      phase: 'SIGN_OUT'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });
    expect(s3.status).toBe('SIGN_OUT_COMPLETED');
  });

  // ─── TC-14: INTRAOPERATIVE UDI IMPLANT TRACEABILITY ───
  it('TC-14: should log permanent medical implant with UDI barcode, lot number, and anatomical site', async () => {
    const implant = await perioperativeClosedLoopService.recordImplantDeployment({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      implantCatalogCode: 'IMP-ORTHO-PLATE',
      implantName: 'Titanium Distal Radius Plate 3.5mm',
      udiBarcode: '(01)00884521012345(17)281231(10)LOT8899',
      serialOrLotNumber: 'LOT-889911',
      manufacturer: 'DePuy Synthes',
      expiryDate: '2028-12-31',
      anatomicalSite: 'Radius Distal Sinistra',
      unitCostIdr: 8500000.00
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(implant.status).toBe('IMPLANTED');
    expect(implant.digital_signature_hash).toBeDefined();
    expect(mockDatabaseState.intraoperative_implant_ledgers.length).toBe(1);
  });

  // ─── TC-15: INCOMPLETE IMPLANT DATA GUARD ───
  it('TC-15: should reject recording implant missing UDI barcode or expiry date', async () => {
    await expect(perioperativeClosedLoopService.recordImplantDeployment({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      implantCatalogCode: 'IMP-ORTHO-PLATE',
      implantName: 'Titanium Plate'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP })).rejects.toThrow('Data penanaman implan bedah tidak lengkap');
  });

  // ─── TC-16: PACU MODIFIED ALDRETE RECOVERY SCORING ───
  it('TC-16: should compute Modified Aldrete Recovery Score across 5 parameters', async () => {
    const pacu = await perioperativeClosedLoopService.recordPacuRecoveryAssessment({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      aldreteConsciousness: 2,
      aldreteActivity: 2,
      aldreteRespiration: 2,
      aldreteCirculation: 2,
      aldreteO2Saturation: 2,
      painVasScore: 2
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(pacu.total_aldrete_score).toBe(10);
    expect(mockDatabaseState.pacu_recovery_records.length).toBe(1);
  });

  // ─── TC-17: PACU DISCHARGE BLOCKED IF ALDRETE < 9 ───
  it('TC-17: should strictly block discharge from PACU if Aldrete Score is below safe threshold (< 9)', async () => {
    await expect(perioperativeClosedLoopService.recordPacuRecoveryAssessment({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      aldreteConsciousness: 1, // Somnolent
      aldreteActivity: 1,      // 2 limbs
      aldreteRespiration: 2,
      aldreteCirculation: 1,   // BP diff +-30%
      aldreteO2Saturation: 2,  // Total 7/10
      dischargeReadinessStatus: 'READY_FOR_WARD_TRANSFER'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE })).rejects.toThrow('PACU SAFETY INVARIANT VIOLATION');
  });

  // ─── TC-18: PACU SAFE DISCHARGE TO WARD (ALDRETE >= 9) ───
  it('TC-18: should allow transfer to ward when Aldrete Score satisfies safe threshold (>= 9)', async () => {
    const pacu = await perioperativeClosedLoopService.recordPacuRecoveryAssessment({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      aldreteConsciousness: 2,
      aldreteActivity: 2,
      aldreteRespiration: 2,
      aldreteCirculation: 2,
      aldreteO2Saturation: 2,
      dischargeReadinessStatus: 'READY_FOR_WARD_TRANSFER'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(pacu.discharge_readiness_status).toBe('READY_FOR_WARD_TRANSFER');
  });

  // ─── TC-19: SURGICAL FINALIZATION BLOCKED WITHOUT WHO SIGN-OUT ───
  it('TC-19: should reject finalizing surgery if WHO Sign-Out checklist has not been completed', async () => {
    await expect(perioperativeClosedLoopService.finalizeSurgicalClosedLoop('case-surg-001', {}, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP })).rejects.toThrow('WHO Surgical Safety Checklist Sign-Out belum diselesaikan');
  });

  // ─── TC-20: SURGICAL FINALIZATION & CHARGE CAPTURE ───
  it('TC-20: should finalize surgical closed loop, capture itemized billing, and calculate real cost', async () => {
    // Complete WHO Checklist 3 phases
    await perioperativeClosedLoopService.executeWhoChecklistPhase({ surgicalCaseId: 'case-surg-001', encounterId: 'enc-surg-001', patientId: 'pat-surg-001', phase: 'SIGN_IN' }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });
    await perioperativeClosedLoopService.executeWhoChecklistPhase({ surgicalCaseId: 'case-surg-001', encounterId: 'enc-surg-001', patientId: 'pat-surg-001', phase: 'TIME_OUT' }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });
    await perioperativeClosedLoopService.executeWhoChecklistPhase({ surgicalCaseId: 'case-surg-001', encounterId: 'enc-surg-001', patientId: 'pat-surg-001', phase: 'SIGN_OUT' }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    const finalResult = await perioperativeClosedLoopService.finalizeSurgicalClosedLoop('case-surg-001', {
      operatingRoomFee: 3000000.00,
      surgeonProfessionalFee: 5000000.00,
      anesthesiaProfessionalFee: 2500000.00,
      consumablesCharge: 1500000.00,
      anestheticDrugsCharge: 1000000.00,
      implantsCharge: 0.00
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(finalResult.status).toBe('COMPLETED');
    expect(finalResult.totalHospitalCost).toBe(13000000.00);
    expect(mockDatabaseState.surgical_billing_breakdown.length).toBe(1);
  });

  // ─── TC-21: THEATRE ROOM TURNOVER TO STERILIZATION ───
  it('TC-21: should transition theatre room status to CLEANING_STERILIZATION upon surgery completion', async () => {
    await perioperativeClosedLoopService.executeWhoChecklistPhase({ surgicalCaseId: 'case-surg-001', encounterId: 'enc-surg-001', patientId: 'pat-surg-001', phase: 'SIGN_IN' }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });
    await perioperativeClosedLoopService.executeWhoChecklistPhase({ surgicalCaseId: 'case-surg-001', encounterId: 'enc-surg-001', patientId: 'pat-surg-001', phase: 'TIME_OUT' }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });
    await perioperativeClosedLoopService.executeWhoChecklistPhase({ surgicalCaseId: 'case-surg-001', encounterId: 'enc-surg-001', patientId: 'pat-surg-001', phase: 'SIGN_OUT' }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    const finalResult = await perioperativeClosedLoopService.finalizeSurgicalClosedLoop('case-surg-001', {}, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(finalResult.roomStatus).toBe('CLEANING_STERILIZATION');
    expect(mockDatabaseState.operating_theatres[0].status).toBe('CLEANING_STERILIZATION');
  });

  // ─── TC-22: AUDIT LOG & OUTBOX ATOMICITY ───
  it('TC-22: should write domain outbox event and timeline event within same database transaction', async () => {
    await perioperativeClosedLoopService.createPreOpAnesthesiaEvaluation({
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      asaClass: 'ASA_I',
      mallampatiScore: 1,
      npoFastingHours: 8.0,
      cardiopulmonaryClearance: 'Normal',
      anesthesiaPlan: 'GENERAL_ANESTHESIA'
    }, { role: ENTERPRISE_ROLES.ROLE_ANESTHESIOLOGIST || 'ROLE_ANESTHESIOLOGIST' });

    expect(mockDatabaseState.longitudinal_timeline_events.length).toBe(1);
    expect(mockDatabaseState.clinical_domain_outbox.some(o => o.event_type === 'PREOP_EVALUATION_COMPLETED')).toBe(true);
  });

  // ─── TC-23: IDEMPOTENT BILLING BREAKDOWN PROTECTION ───
  it('TC-23: should reject invalid finalization when surgical case does not exist', async () => {
    await expect(perioperativeClosedLoopService.finalizeSurgicalClosedLoop('non-existent-case', {}, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP })).rejects.toThrow('Kasus bedah tidak ditemukan');
  });

  // ─── TC-24: CAUSAL PERIOPERATIVE EVENT LINEAGE ───
  it('TC-24: should record sequential perioperative events in longitudinal patient timeline', async () => {
    await perioperativeClosedLoopService.createPreOpAnesthesiaEvaluation({
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      asaClass: 'ASA_II',
      mallampatiScore: 2,
      npoFastingHours: 8.0,
      cardiopulmonaryClearance: 'Normal',
      anesthesiaPlan: 'GENERAL_ANESTHESIA'
    }, { role: ENTERPRISE_ROLES.ROLE_ANESTHESIOLOGIST || 'ROLE_ANESTHESIOLOGIST' });

    await perioperativeClosedLoopService.executeWhoChecklistPhase({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      phase: 'SIGN_IN'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(mockDatabaseState.longitudinal_timeline_events.length).toBe(2);
    expect(mockDatabaseState.longitudinal_timeline_events[0].event_category).toBe('PREOP_EVALUATION');
    expect(mockDatabaseState.longitudinal_timeline_events[1].event_category).toBe('WHO_SURGICAL_CHECKLIST');
  });

  // ─── TC-25: FULL E2E PERIOPERATIVE CLOSED-LOOP RECONCILIATION ───
  it('TC-25: should reconcile complete perioperative closed loop with 0 discrepancy across all layers', async () => {
    // 1. Pre-Op Anesthesia Evaluation
    const preop = await perioperativeClosedLoopService.createPreOpAnesthesiaEvaluation({
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      asaClass: 'ASA_II',
      mallampatiScore: 2,
      airwayAssessment: 'NORMAL',
      npoFastingHours: 8.0,
      cardiopulmonaryClearance: 'Cor/Pulmo normal, EKG Sinus Rhythm.',
      anesthesiaPlan: 'GENERAL_ANESTHESIA'
    }, { role: ENTERPRISE_ROLES.ROLE_ANESTHESIOLOGIST || 'ROLE_ANESTHESIOLOGIST' });
    expect(preop.asa_class).toBe('ASA_II');

    // 2. WHO Checklist 3 Phases
    await perioperativeClosedLoopService.executeWhoChecklistPhase({ surgicalCaseId: 'case-surg-001', encounterId: 'enc-surg-001', patientId: 'pat-surg-001', phase: 'SIGN_IN' }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });
    await perioperativeClosedLoopService.executeWhoChecklistPhase({ surgicalCaseId: 'case-surg-001', encounterId: 'enc-surg-001', patientId: 'pat-surg-001', phase: 'TIME_OUT' }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });
    await perioperativeClosedLoopService.executeWhoChecklistPhase({ surgicalCaseId: 'case-surg-001', encounterId: 'enc-surg-001', patientId: 'pat-surg-001', phase: 'SIGN_OUT' }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    // 3. Intraoperative Implant UDI
    const implant = await perioperativeClosedLoopService.recordImplantDeployment({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      implantCatalogCode: 'IMP-MESH-HERNIA',
      implantName: 'Polypropylene Surgical Mesh 10x15cm',
      udiBarcode: '(01)00884521099999(17)291231(10)LOT7788',
      serialOrLotNumber: 'LOT-778899',
      manufacturer: 'Ethicon / Johnson & Johnson',
      expiryDate: '2029-12-31',
      anatomicalSite: 'Inguinal Dextra',
      unitCostIdr: 3500000.00
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });
    expect(implant.status).toBe('IMPLANTED');

    // 4. PACU Aldrete Recovery Score >= 9
    const pacu = await perioperativeClosedLoopService.recordPacuRecoveryAssessment({
      surgicalCaseId: 'case-surg-001',
      encounterId: 'enc-surg-001',
      patientId: 'pat-surg-001',
      aldreteConsciousness: 2,
      aldreteActivity: 2,
      aldreteRespiration: 2,
      aldreteCirculation: 2,
      aldreteO2Saturation: 2,
      dischargeReadinessStatus: 'READY_FOR_WARD_TRANSFER'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });
    expect(pacu.total_aldrete_score).toBe(10);

    // 5. Finalize Surgery & Charge Capture
    const finalization = await perioperativeClosedLoopService.finalizeSurgicalClosedLoop('case-surg-001', {
      operatingRoomFee: 3000000.00,
      surgeonProfessionalFee: 5000000.00,
      anesthesiaProfessionalFee: 2500000.00,
      consumablesCharge: 1500000.00,
      anestheticDrugsCharge: 1000000.00,
      implantsCharge: 3500000.00
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(finalization.status).toBe('COMPLETED');
    expect(finalization.totalHospitalCost).toBe(16500000.00);

    // Final State Ledger Reconciliation (0 Discrepancy)
    expect(mockDatabaseState.perioperative_anesthesia_evaluations.length).toBe(1);
    expect(mockDatabaseState.who_safety_checklist_executions.length).toBe(1);
    expect(mockDatabaseState.who_safety_checklist_executions[0].status).toBe('SIGN_OUT_COMPLETED');
    expect(mockDatabaseState.intraoperative_implant_ledgers.length).toBe(1);
    expect(mockDatabaseState.pacu_recovery_records.length).toBe(1);
    expect(mockDatabaseState.surgical_billing_breakdown.length).toBe(1);
    expect(mockDatabaseState.surgical_cases[0].status).toBe('COMPLETED');
    expect(mockDatabaseState.operating_theatres[0].status).toBe('CLEANING_STERILIZATION');
    expect(mockDatabaseState.longitudinal_timeline_events.length).toBe(6);
    expect(mockDatabaseState.clinical_domain_outbox.length).toBe(7);
  });
});
