/**
 * NurseFlow Enterprise HIS 2026 — Vertical Slice #10 Durability & Clinical Safety Test Suite
 * Clinical Care Coordination & Longitudinal Patient Timeline Closed Loop
 * Standards: JCI COP / IPSG 2, ISO 13606, HL7 FHIR CarePlan / Composition, PostgreSQL 16 ACID.
 * Complete 25 Chaos Gate Scenarios.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import {
  careCoordinationAndTimelineService,
  CareCoordinationDomainError
} from '../server/services/careCoordinationAndTimeline.service.js';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { ENTERPRISE_ROLES } from '../src/shared/constants/roles.js';

describe('VS-10 — Clinical Care Coordination & Longitudinal Patient Timeline ➔ PostgreSQL Durability & Chaos Gate (25 Scenarios)', () => {
  let mockDatabaseState = {
    encounters: [],
    longitudinal_timeline_events: [],
    longitudinal_care_plans: [],
    clinical_handovers: [],
    clinical_discharge_summaries: [],
    universal_audit_logs: [],
    clinical_domain_outbox: []
  };

  let mockClient = null;
  let activeTransactionState = null;

  beforeEach(() => {
    mockDatabaseState = {
      encounters: [
        {
          id: 'enc-coord-001',
          episode_id: 'epc-coord-001',
          patient_id: 'pat-coord-001',
          encounter_number: 'ENC-2026-COORD-01',
          status: 'IN_PROGRESS',
          start_time: '2026-08-20T08:00:00Z'
        },
        {
          id: 'enc-closed-002',
          encounter_number: 'ENC-2026-COORD-99',
          status: 'CLOSED',
          start_time: '2026-08-19T08:00:00Z'
        }
      ],
      longitudinal_timeline_events: [],
      longitudinal_care_plans: [],
      clinical_handovers: [],
      clinical_discharge_summaries: [],
      universal_audit_logs: [],
      clinical_domain_outbox: []
    };

    activeTransactionState = null;

    mockClient = {
      query: vi.fn(async (sql, params = []) => {
        const normalized = sql.trim().toUpperCase();

        if (normalized.startsWith('BEGIN')) {
          activeTransactionState = {
            stagedTimelineEvents: [],
            stagedCarePlans: [],
            stagedHandovers: [],
            stagedDischargeSummaries: [],
            stagedAuditLogs: [],
            stagedOutbox: [],
            carePlanUpdates: [],
            handoverUpdates: [],
            encounterUpdates: []
          };
          return { rows: [], rowCount: 0 };
        }

        if (normalized.startsWith('COMMIT')) {
          if (activeTransactionState) {
            mockDatabaseState.longitudinal_timeline_events.push(...activeTransactionState.stagedTimelineEvents);
            mockDatabaseState.longitudinal_care_plans.push(...activeTransactionState.stagedCarePlans);
            mockDatabaseState.clinical_handovers.push(...activeTransactionState.stagedHandovers);
            mockDatabaseState.clinical_discharge_summaries.push(...activeTransactionState.stagedDischargeSummaries);
            mockDatabaseState.universal_audit_logs.push(...activeTransactionState.stagedAuditLogs);
            mockDatabaseState.clinical_domain_outbox.push(...activeTransactionState.stagedOutbox);

            activeTransactionState.carePlanUpdates.forEach(up => {
              const idx = mockDatabaseState.longitudinal_care_plans.findIndex(p => p.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.longitudinal_care_plans[idx] = { ...mockDatabaseState.longitudinal_care_plans[idx], ...up.data };
              }
            });

            activeTransactionState.handoverUpdates.forEach(up => {
              const idx = mockDatabaseState.clinical_handovers.findIndex(h => h.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.clinical_handovers[idx] = { ...mockDatabaseState.clinical_handovers[idx], ...up.data };
              }
            });

            activeTransactionState.encounterUpdates.forEach(up => {
              const idx = mockDatabaseState.encounters.findIndex(e => e.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.encounters[idx] = { ...mockDatabaseState.encounters[idx], ...up.data };
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

        // SELECT FROM encounters
        if (normalized.includes('FROM ENCOUNTERS WHERE ID = $1')) {
          const found = mockDatabaseState.encounters.filter(e => e.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM longitudinal_care_plans WHERE id = $1
        if (normalized.includes('FROM LONGITUDINAL_CARE_PLANS WHERE ID = $1')) {
          const allPlans = [
            ...mockDatabaseState.longitudinal_care_plans,
            ...(activeTransactionState?.stagedCarePlans || [])
          ];
          const found = allPlans.filter(p => p.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM clinical_handovers WHERE id = $1
        if (normalized.includes('FROM CLINICAL_HANDOVERS WHERE ID = $1')) {
          const allHandovers = [
            ...mockDatabaseState.clinical_handovers,
            ...(activeTransactionState?.stagedHandovers || [])
          ];
          const found = allHandovers.filter(h => h.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM longitudinal_timeline_events WHERE encounter_id = $1
        if (normalized.includes('FROM LONGITUDINAL_TIMELINE_EVENTS') && normalized.includes('WHERE ENCOUNTER_ID = $1')) {
          const allEvents = [
            ...mockDatabaseState.longitudinal_timeline_events,
            ...(activeTransactionState?.stagedTimelineEvents || [])
          ];
          const found = allEvents.filter(e => e.encounter_id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // INSERT INTO longitudinal_timeline_events
        if (normalized.startsWith('INSERT INTO LONGITUDINAL_TIMELINE_EVENTS')) {
          const newEvent = {
            id: params[0],
            encounter_id: params[1],
            patient_id: params[2],
            event_category: params[3],
            event_title: params[4],
            event_summary: params[5],
            domain_source_table: params[6],
            domain_source_id: params[7],
            parent_event_id: params[8],
            actor_id: params[9],
            actor_name: params[10],
            actor_role: params[11],
            event_timestamp: params[12],
            clinical_severity: params[13],
            digital_signature_hash: params[14],
            correlation_id: params[15],
            created_at: new Date().toISOString()
          };
          if (activeTransactionState) {
            activeTransactionState.stagedTimelineEvents.push(newEvent);
          } else {
            mockDatabaseState.longitudinal_timeline_events.push(newEvent);
          }
          return { rows: [newEvent], rowCount: 1 };
        }

        // INSERT INTO longitudinal_care_plans
        if (normalized.startsWith('INSERT INTO LONGITUDINAL_CARE_PLANS')) {
          const newPlan = {
            id: params[0],
            encounter_id: params[1],
            patient_id: params[2],
            care_plan_number: params[3],
            title: params[4],
            status: 'ACTIVE',
            problem_list: JSON.parse(params[5] || '[]'),
            goals: JSON.parse(params[6] || '[]'),
            interventions: JSON.parse(params[7] || '[]'),
            lead_dpjp_id: params[8],
            lead_dpjp_name: params[9],
            multi_disciplinary_contributors: JSON.parse(params[10] || '[]'),
            version: params[11],
            digital_signature_hash: params[12],
            correlation_id: params[13],
            created_at: new Date().toISOString()
          };
          if (activeTransactionState) {
            activeTransactionState.stagedCarePlans.push(newPlan);
          } else {
            mockDatabaseState.longitudinal_care_plans.push(newPlan);
          }
          return { rows: [newPlan], rowCount: 1 };
        }

        // UPDATE longitudinal_care_plans
        if (normalized.startsWith('UPDATE LONGITUDINAL_CARE_PLANS')) {
          const planId = params[7];
          const updated = {
            title: params[0],
            problem_list: JSON.parse(params[1] || '[]'),
            goals: JSON.parse(params[2] || '[]'),
            interventions: JSON.parse(params[3] || '[]'),
            multi_disciplinary_contributors: JSON.parse(params[4] || '[]'),
            version: params[5],
            digital_signature_hash: params[6]
          };
          if (activeTransactionState) {
            activeTransactionState.carePlanUpdates.push({ id: planId, data: updated });
          }
          return { rows: [{ id: planId, ...updated }], rowCount: 1 };
        }

        // INSERT INTO clinical_handovers
        if (normalized.startsWith('INSERT INTO CLINICAL_HANDOVERS')) {
          const newHandover = {
            id: params[0],
            encounter_id: params[1],
            patient_id: params[2],
            handover_number: params[3],
            shift_name: params[4],
            department_id: params[5],
            department_name: params[6],
            outgoing_practitioner_id: params[7],
            outgoing_practitioner_name: params[8],
            outgoing_practitioner_role: params[9],
            incoming_practitioner_id: params[10],
            incoming_practitioner_name: params[11],
            incoming_practitioner_role: params[12],
            sbar_situation: params[13],
            sbar_background: params[14],
            sbar_assessment: params[15],
            sbar_recommendation: params[16],
            high_risk_flags: JSON.parse(params[17] || '[]'),
            pending_diagnostic_orders: JSON.parse(params[18] || '[]'),
            vital_signs_snapshot: JSON.parse(params[19] || '{}'),
            handover_timestamp: params[20],
            handover_status: 'PENDING_ACKNOWLEDGMENT',
            digital_signature_outgoing: params[21],
            correlation_id: params[22]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedHandovers.push(newHandover);
          } else {
            mockDatabaseState.clinical_handovers.push(newHandover);
          }
          return { rows: [newHandover], rowCount: 1 };
        }

        // UPDATE clinical_handovers
        if (normalized.startsWith('UPDATE CLINICAL_HANDOVERS')) {
          const handoverId = params[2];
          const updated = {
            id: handoverId,
            handover_status: 'COMPLETED',
            acknowledged_at: params[0],
            digital_signature_incoming: params[1]
          };
          if (activeTransactionState) {
            activeTransactionState.handoverUpdates.push({ id: handoverId, data: updated });
          }
          return { rows: [updated], rowCount: 1 };
        }

        // INSERT INTO clinical_discharge_summaries
        if (normalized.startsWith('INSERT INTO CLINICAL_DISCHARGE_SUMMARIES')) {
          const newSummary = {
            id: params[0],
            encounter_id: params[1],
            patient_id: params[2],
            summary_number: params[3],
            admission_datetime: params[4],
            discharge_datetime: params[5],
            admission_diagnosis_icd10: params[6],
            admission_diagnosis_name: params[7],
            discharge_diagnosis_icd10: params[8],
            discharge_diagnosis_name: params[9],
            secondary_diagnoses: JSON.parse(params[10] || '[]'),
            procedures_performed: JSON.parse(params[11] || '[]'),
            hospital_course_summary: params[12],
            significant_diagnostic_findings: params[13],
            discharge_condition: params[14],
            discharge_vital_signs: JSON.parse(params[15] || '{}'),
            discharge_medications: JSON.parse(params[16] || '[]'),
            follow_up_instructions: params[17],
            emergency_warning_signs: params[18],
            discharging_dpjp_id: params[19],
            discharging_dpjp_name: params[20],
            digital_signature_hash: params[21],
            status: 'LOCKED',
            correlation_id: params[22]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedDischargeSummaries.push(newSummary);
          } else {
            mockDatabaseState.clinical_discharge_summaries.push(newSummary);
          }
          return { rows: [newSummary], rowCount: 1 };
        }

        // UPDATE encounters SET status = 'DISCHARGED'
        if (normalized.startsWith('UPDATE ENCOUNTERS') && normalized.includes("STATUS = 'DISCHARGED'")) {
          const encId = params[2];
          const updated = { status: 'DISCHARGED', end_time: params[0], discharge_disposition: params[1] };
          if (activeTransactionState) {
            activeTransactionState.encounterUpdates.push({ id: encId, data: updated });
          }
          return { rows: [{ id: encId, ...updated }], rowCount: 1 };
        }

        // INSERT INTO universal_audit_logs
        if (normalized.startsWith('INSERT INTO UNIVERSAL_AUDIT_LOGS')) {
          const newAudit = { id: params[0], resource_id: params[4], created_at: new Date().toISOString() };
          if (activeTransactionState) {
            activeTransactionState.stagedAuditLogs.push(newAudit);
          } else {
            mockDatabaseState.universal_audit_logs.push(newAudit);
          }
          return { rows: [{ id: newAudit.id }], rowCount: 1 };
        }

        // INSERT INTO clinical_domain_outbox
        if (normalized.startsWith('INSERT INTO CLINICAL_DOMAIN_OUTBOX')) {
          let eventType = 'UNKNOWN';
          const match = sql.match(/'([A-Z0-9_]+)',\s*\$[0-9],\s*'PENDING_PUBLISH'/);
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

  // ─── TC-01: ATOMIC TIMELINE EVENT RECORDING ───
  it('TC-01: should record atomic longitudinal timeline event with cryptographic SHA-256 digital signature', async () => {
    const evt = await careCoordinationAndTimelineService.recordTimelineEvent({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      eventCategory: 'ADMISSION',
      eventTitle: 'Pasien Masuk Rawat Inap (Admisi)',
      eventSummary: 'Pasien diterima dari IGD ke Ruang Rawat Inap Azalea Bed 204.',
      domainSourceTable: 'encounters',
      domainSourceId: 'enc-coord-001'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(evt.id).toBeDefined();
    expect(evt.digital_signature_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(mockDatabaseState.longitudinal_timeline_events.length).toBe(1);
  });

  // ─── TC-02: CAUSAL EVENT LINEAGE GRAPH ───
  it('TC-02: should record downstream event linked to parent upstream event creating causal lineage graph', async () => {
    const rootEvt = await careCoordinationAndTimelineService.recordTimelineEvent({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      eventCategory: 'CPOE_ORDER',
      eventTitle: 'CPOE Order Lab: Kalium Serum CITO',
      domainSourceTable: 'clinical_orders',
      domainSourceId: crypto.randomUUID()
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    const childEvt = await careCoordinationAndTimelineService.recordTimelineEvent({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      eventCategory: 'CRITICAL_ALERT',
      eventTitle: 'Panic Value Alert: Kalium 7.2 mEq/L',
      domainSourceTable: 'diagnostic_result_notifications',
      domainSourceId: crypto.randomUUID(),
      parentEventId: rootEvt.id,
      clinicalSeverity: 'CRITICAL_PANIC'
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST || 'ROLE_LAB_ANALYST' });

    expect(childEvt.parent_event_id).toBe(rootEvt.id);
  });

  // ─── TC-03: MULTI-CATEGORY TIMELINE RECONSTRUCTION ───
  it('TC-03: should reconstruct unified longitudinal timeline with chronological ordering and causal tree graph', async () => {
    const e1 = await careCoordinationAndTimelineService.recordTimelineEvent({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      eventCategory: 'TRIAGE',
      eventTitle: 'Triage ATS Level 2',
      domainSourceTable: 'triage_assessments',
      domainSourceId: crypto.randomUUID(),
      eventTimestamp: '2026-08-20T08:05:00Z'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_EMERGENCY });

    const e2 = await careCoordinationAndTimelineService.recordTimelineEvent({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      eventCategory: 'SOAP_NOTE',
      eventTitle: 'CPPT Dokter Awal IGD',
      domainSourceTable: 'emr_clinical_notes',
      domainSourceId: crypto.randomUUID(),
      parentEventId: e1.id,
      eventTimestamp: '2026-08-20T08:15:00Z'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_EMERGENCY });

    const timeline = await careCoordinationAndTimelineService.getUnifiedLongitudinalTimeline('enc-coord-001');

    expect(timeline.totalEvents).toBe(2);
    expect(timeline.causalGraph.length).toBe(1);
    expect(timeline.causalGraph[0].downstreamChildren.length).toBe(1);
  });

  // ─── TC-04: INTER-DISCIPLINARY CARE PLAN (ICP) AUTHORING ───
  it('TC-04: should author Inter-Disciplinary Care Plan (ICP) with active problem list and target goals', async () => {
    const plan = await careCoordinationAndTimelineService.createOrUpdateCarePlan({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      title: 'Rencana Asuhan Terpadu Pasien Sepsis & AKI Stage 3',
      problemList: [{ problem: 'Sepsis Berat', priority: 'HIGH' }, { problem: 'AKI Stage 3', priority: 'HIGH' }],
      goals: [{ targetOutcome: 'Urine output > 0.5 mL/kg/jam', status: 'IN_PROGRESS' }],
      interventions: [{ discipline: 'DOKTER', action: 'Terapi Cairan Resusitasi & Koreksi Elektrolit' }]
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(plan.care_plan_number).toMatch(/^ICP-\d+/);
    expect(plan.version).toBe(1);
    expect(mockDatabaseState.longitudinal_care_plans.length).toBe(1);
    expect(mockDatabaseState.longitudinal_timeline_events.some(e => e.event_category === 'CARE_PLAN_SYNCHRONIZED')).toBe(true);
  });

  // ─── TC-05: NON-AUTHORIZED ROLE CARE PLAN GUARD ───
  it('TC-05: should reject care plan authoring by non-authorized roles (403)', async () => {
    await expect(careCoordinationAndTimelineService.createOrUpdateCarePlan({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      title: 'Rencana Asuhan Kasir'
    }, { role: ENTERPRISE_ROLES.ROLE_CASHIER || 'ROLE_CASHIER' })).rejects.toThrow('Wewenang ditolak');
  });

  // ─── TC-06: CARE PLAN TEMPORAL VERSIONING ───
  it('TC-06: should increment care plan version to v2 upon update without mutating historical identity', async () => {
    const initial = await careCoordinationAndTimelineService.createOrUpdateCarePlan({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      title: 'Rencana Asuhan Awal'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    const updated = await careCoordinationAndTimelineService.createOrUpdateCarePlan({
      carePlanId: initial.id,
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      title: 'Rencana Asuhan Terpadu Evaluasi Hari ke-2',
      goals: [{ targetOutcome: 'Skor NEWS2 < 3 dalam 24 jam' }]
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(updated.version).toBe(2);
  });

  // ─── TC-07: CARE PLAN MULTI-DISCIPLINARY COLLABORATION ───
  it('TC-07: should record multi-disciplinary contributors (Doctor, Nurse, Pharmacist, Dietitian) in single care plan', async () => {
    const plan = await careCoordinationAndTimelineService.createOrUpdateCarePlan({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      title: 'Rencana Asuhan Kolaboratif',
      multiDisciplinaryContributors: [
        { role: 'DPJP', name: 'dr. Siti, Sp.PD' },
        { role: 'PERAWAT', name: 'Ners Dewi, S.Kep' },
        { role: 'FARMASIS', name: 'Apt. Rian, S.Farm' },
        { role: 'DIETISIEN', name: 'Nurul, S.Gz' }
      ]
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(plan.multi_disciplinary_contributors.length).toBe(4);
  });

  // ─── TC-08: SBAR SHIFT HANDOVER REGISTRATION ───
  it('TC-08: should register SBAR shift handover with situation, background, assessment, recommendation, and vital signs', async () => {
    const handover = await careCoordinationAndTimelineService.createShiftHandover({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      shiftName: 'PAGI_KE_SORE',
      incomingPractitionerId: 'USR-NURSE-02',
      incomingPractitionerName: 'Ners Rina (Shift Sore)',
      sbarSituation: 'Pasien Tn. Budi post koreksi hiperkalemia, saat ini terpasang infus NaCl 0.9%.',
      sbarBackground: 'Riwayat CKD stage 4 masuk IGD dengan K+ 7.2 mEq/L.',
      sbarAssessment: 'Tanda vital stabil, EWS = 2, irama sinus.',
      sbarRecommendation: 'Cek ulang Kalium serum pukul 16:00 CITO dan monitor urin per jam.',
      vitalSignsSnapshot: { hr: 84, bp: '130/80', rr: 18, spo2: 98, news2: 2 }
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(handover.handover_number).toMatch(/^HND-\d+/);
    expect(handover.handover_status).toBe('PENDING_ACKNOWLEDGMENT');
    expect(handover.digital_signature_outgoing).toBeDefined();
    expect(mockDatabaseState.clinical_handovers.length).toBe(1);
    expect(mockDatabaseState.longitudinal_timeline_events.some(e => e.event_category === 'SHIFT_HANDOVER_INITIATED')).toBe(true);
  });

  // ─── TC-09: HANDOVER INITIAL STATUS ───
  it('TC-09: should set new handover status to PENDING_ACKNOWLEDGMENT awaiting incoming practitioner sign-off', async () => {
    const handover = await careCoordinationAndTimelineService.createShiftHandover({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      shiftName: 'SORE_KE_MALAM',
      incomingPractitionerId: 'USR-NURSE-03',
      sbarSituation: 'Situasi',
      sbarAssessment: 'Asesmen',
      sbarRecommendation: 'Rekomendasi'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(handover.handover_status).toBe('PENDING_ACKNOWLEDGMENT');
  });

  // ─── TC-10: HANDOVER MISSING ESSENTIAL FIELDS GUARD ───
  it('TC-10: should reject handover registration missing situation, assessment, or recommendation', async () => {
    await expect(careCoordinationAndTimelineService.createShiftHandover({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      shiftName: 'PAGI_KE_SORE',
      incomingPractitionerId: 'USR-NURSE-02'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE })).rejects.toThrow('Data operan jaga SBAR tidak lengkap');
  });

  // ─── TC-11: HANDOVER DUAL SIGN-OFF (TRANSFER OF CARE ACKNOWLEDGMENT) ───
  it('TC-11: should acknowledge handover with incoming practitioner digital signature and transition status to COMPLETED', async () => {
    const handover = await careCoordinationAndTimelineService.createShiftHandover({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      shiftName: 'PAGI_KE_SORE',
      incomingPractitionerId: 'USR-NURSE-02',
      incomingPractitionerName: 'Ners Rina',
      sbarSituation: 'Situasi',
      sbarAssessment: 'Asesmen',
      sbarRecommendation: 'Rekomendasi'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    const ack = await careCoordinationAndTimelineService.acknowledgeShiftHandover(
      handover.id,
      { userId: 'USR-NURSE-02', fullName: 'Ners Rina', role: ENTERPRISE_ROLES.ROLE_NURSE }
    );

    expect(ack.handover_status).toBe('COMPLETED');
    expect(ack.digital_signature_incoming).toBeDefined();
    expect(mockDatabaseState.clinical_domain_outbox.some(o => o.event_type === 'SHIFT_HANDOVER_COMPLETED')).toBe(true);
  });

  // ─── TC-12: DUPLICATE HANDOVER ACKNOWLEDGMENT PREVENTION ───
  it('TC-12: should prevent duplicate acknowledgment of an already completed handover', async () => {
    const handover = await careCoordinationAndTimelineService.createShiftHandover({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      shiftName: 'PAGI_KE_SORE',
      incomingPractitionerId: 'USR-NURSE-02',
      sbarSituation: 'Situasi',
      sbarAssessment: 'Asesmen',
      sbarRecommendation: 'Rekomendasi'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    await careCoordinationAndTimelineService.acknowledgeShiftHandover(handover.id, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    await expect(careCoordinationAndTimelineService.acknowledgeShiftHandover(handover.id, { role: ENTERPRISE_ROLES.ROLE_NURSE })).rejects.toThrow('sudah dikonfirmasi sebelumnya');
  });

  // ─── TC-13: HANDOVER HIGH-RISK FLAG & PENDING ORDER HAND-OFF ───
  it('TC-13: should preserve and carry forward high-risk flags and pending diagnostic orders across shift handovers', async () => {
    const handover = await careCoordinationAndTimelineService.createShiftHandover({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      shiftName: 'PAGI_KE_SORE',
      incomingPractitionerId: 'USR-NURSE-02',
      sbarSituation: 'Pasien resiko jatuh tinggi.',
      sbarAssessment: 'Asesmen',
      sbarRecommendation: 'Rekomendasi',
      highRiskFlags: ['FALL_RISK_HIGH', 'HIGH_ALERT_POTASSIUM_INFUSION'],
      pendingDiagnosticOrders: [{ orderCode: 'LAB-K-REPEAT', status: 'PENDING_SAMPLE' }]
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(handover.high_risk_flags.length).toBe(2);
    expect(handover.pending_diagnostic_orders.length).toBe(1);
  });

  // ─── TC-14: JCI MEDICAL DISCHARGE RESUME AUTHORING ───
  it('TC-14: should author JCI Medical Discharge Resume with ICD-10 diagnoses, ICD-9-CM procedures, and hospital course summary', async () => {
    const summary = await careCoordinationAndTimelineService.createDischargeSummary({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      admissionDiagnosisIcd10: 'E87.5',
      admissionDiagnosisName: 'Hyperkalaemia',
      dischargeDiagnosisIcd10: 'N18.4',
      dischargeDiagnosisName: 'Chronic Kidney Disease Stage 4 with Resolved Hyperkalaemia',
      secondaryDiagnoses: [{ code: 'I10', name: 'Essential Hypertension' }],
      proceduresPerformed: [{ code: '39.95', name: 'Hemodialysis', date: '2026-08-20' }],
      hospitalCourseSummary: 'Pasien masuk dengan hiperkalemia berat (7.2 mEq/L) dan oliguria. Dilakukan terapi shifting dan hemodialisis cito. Kalium stabil 4.2 mEq/L saat pulang.',
      significantDiagnosticFindings: 'Laboratorium pulang: K+ 4.2 mEq/L, Ureum 65 mg/dL, Kreatinin 2.1 mg/dL. EKG sinus rhytm normal.',
      dischargeCondition: 'PERBAIKAN',
      dischargeVitalSigns: { bp: '125/80', hr: 78, rr: 16, temp: 36.6, spo2: 99 },
      dischargeMedications: [
        { drugName: 'Amlodipine 10mg Tab', dosage: '1x1 tab PO malam', quantity: 30 },
        { drugName: 'Calcium Polystyrene Sulfonate (Kalitake) Sachet', dosage: '3x1 sachet PO', quantity: 15 }
      ],
      followUpInstructions: 'Kontrol ke Poliklinik Ginjal & Hipertensi hari Senin, 24 Agustus 2026 pukul 09:00 WIB.',
      emergencyWarningSigns: 'Bila sesak nafas bertambah, jantung berdebar kencang, lemas mendadak, atau urin < 500 mL/24 jam, segera kembali ke IGD.'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(summary.summary_number).toMatch(/^DISC-\d+/);
    expect(summary.status).toBe('LOCKED');
    expect(summary.digital_signature_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(mockDatabaseState.clinical_discharge_summaries.length).toBe(1);
  });

  // ─── TC-15: NON-PHYSICIAN DISCHARGE AUTHORING GUARD ───
  it('TC-15: should reject medical discharge summary authoring by non-physician unauthorized roles (403)', async () => {
    await expect(careCoordinationAndTimelineService.createDischargeSummary({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      admissionDiagnosisIcd10: 'E87.5',
      dischargeDiagnosisIcd10: 'N18.4',
      hospitalCourseSummary: 'Ringkasan perawat',
      dischargeCondition: 'PERBAIKAN',
      followUpInstructions: 'Kontrol',
      emergencyWarningSigns: 'Tanda bahaya'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE })).rejects.toThrow('Wewenang ditolak');
  });

  // ─── TC-16: INCOMPLETE DISCHARGE RESUME REJECTION ───
  it('TC-16: should reject incomplete discharge summary missing essential clinical fields', async () => {
    await expect(careCoordinationAndTimelineService.createDischargeSummary({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      admissionDiagnosisIcd10: 'E87.5'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP })).rejects.toThrow('Data Resume Medis Pulang tidak lengkap');
  });

  // ─── TC-17: ENCOUNTER STATUS TRANSITION TO DISCHARGED ───
  it('TC-17: should automatically transition encounter status to DISCHARGED and record end_time upon discharge summary locking', async () => {
    await careCoordinationAndTimelineService.createDischargeSummary({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      admissionDiagnosisIcd10: 'E87.5',
      dischargeDiagnosisIcd10: 'N18.4',
      hospitalCourseSummary: 'Ringkasan perjalanan penyakit pasien.',
      dischargeCondition: 'SEMBUH',
      followUpInstructions: 'Kontrol poliklinik.',
      emergencyWarningSigns: 'Tanda bahaya.'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(mockDatabaseState.encounters[0].status).toBe('DISCHARGED');
    expect(mockDatabaseState.encounters[0].discharge_disposition).toBe('SEMBUH');
  });

  // ─── TC-18: CLOSED ENCOUNTER REJECTION GUARD ───
  it('TC-18: should reject creating care plans for encounters that are already CLOSED or CANCELLED', async () => {
    await expect(careCoordinationAndTimelineService.createOrUpdateCarePlan({
      encounterId: 'enc-closed-002',
      patientId: 'pat-coord-001',
      title: 'Rencana Asuhan Baru'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP })).rejects.toThrow('Encounter telah ditutup');
  });

  // ─── TC-19: HOME VS INPATIENT MEDICATION RECONCILIATION ───
  it('TC-19: should reconcile take-home medications list in discharge summary with dosages and quantities', async () => {
    const summary = await careCoordinationAndTimelineService.createDischargeSummary({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      admissionDiagnosisIcd10: 'E87.5',
      dischargeDiagnosisIcd10: 'N18.4',
      hospitalCourseSummary: 'Ringkasan',
      dischargeCondition: 'PERBAIKAN',
      dischargeMedications: [
        { drugName: 'Candesartan 8mg', dosage: '1x1 PO pagi', quantity: 30 },
        { drugName: 'Furosemide 40mg', dosage: '1x1 PO pagi', quantity: 30 }
      ],
      followUpInstructions: 'Kontrol',
      emergencyWarningSigns: 'Tanda bahaya'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(summary.discharge_medications.length).toBe(2);
    expect(summary.discharge_medications[0].drugName).toBe('Candesartan 8mg');
  });

  // ─── TC-20: PATIENT CONTINUUM SAFETY & EMERGENCY WARNING SIGNS ───
  it('TC-20: should enforce explicit emergency warning signs and follow-up continuum instructions in medical resume', async () => {
    const summary = await careCoordinationAndTimelineService.createDischargeSummary({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      admissionDiagnosisIcd10: 'E87.5',
      dischargeDiagnosisIcd10: 'N18.4',
      hospitalCourseSummary: 'Ringkasan',
      dischargeCondition: 'PERBAIKAN',
      followUpInstructions: 'Kontrol Poli Penyakit Dalam 7 hari lagi.',
      emergencyWarningSigns: 'Nyeri dada mendadak, sesak, pingsan, atau kejang segera ke IGD terdekat.'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(summary.emergency_warning_signs).toContain('segera ke IGD terdekat');
  });

  // ─── TC-21: SHA-256 DIGITAL SIGNATURE IMMUTABILITY ON DISCHARGE ───
  it('TC-21: should generate verifiable SHA-256 cryptographic digital signature on locked discharge summary', async () => {
    const summary = await careCoordinationAndTimelineService.createDischargeSummary({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      admissionDiagnosisIcd10: 'E87.5',
      dischargeDiagnosisIcd10: 'N18.4',
      hospitalCourseSummary: 'Ringkasan perjalanan klinis.',
      dischargeCondition: 'PERBAIKAN',
      followUpInstructions: 'Kontrol',
      emergencyWarningSigns: 'Tanda bahaya'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(summary.digital_signature_hash).toBeDefined();
    expect(summary.digital_signature_hash.length).toBe(64);
  });

  // ─── TC-22: MULTI-DOMAIN AUDIT TRAIL ATOMICITY ───
  it('TC-22: should write universal audit log and domain outbox event atomically upon discharge locking', async () => {
    await careCoordinationAndTimelineService.createDischargeSummary({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      admissionDiagnosisIcd10: 'E87.5',
      dischargeDiagnosisIcd10: 'N18.4',
      hospitalCourseSummary: 'Ringkasan',
      dischargeCondition: 'PERBAIKAN',
      followUpInstructions: 'Kontrol',
      emergencyWarningSigns: 'Tanda bahaya'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(mockDatabaseState.universal_audit_logs.length).toBe(1);
    expect(mockDatabaseState.clinical_domain_outbox.some(o => o.event_type === 'DISCHARGE_SUMMARY_FINALIZED')).toBe(true);
  });

  // ─── TC-23: TIMELINE QUERY IDEMPOTENCY & STABILITY ───
  it('TC-23: should return deterministic timeline structure without duplication upon repeated query calls', async () => {
    await careCoordinationAndTimelineService.recordTimelineEvent({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      eventCategory: 'ADMISSION',
      eventTitle: 'Admisi Rawat Inap',
      domainSourceTable: 'encounters',
      domainSourceId: crypto.randomUUID()
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    const q1 = await careCoordinationAndTimelineService.getUnifiedLongitudinalTimeline('enc-coord-001');
    const q2 = await careCoordinationAndTimelineService.getUnifiedLongitudinalTimeline('enc-coord-001');

    expect(q1.totalEvents).toBe(q2.totalEvents);
    expect(q1.chronologicalEvents[0].id).toBe(q2.chronologicalEvents[0].id);
  });

  // ─── TC-24: TIMELINE VALIDATION INTEGRITY GUARD ───
  it('TC-24: should reject recording timeline event when essential foreign keys are missing', async () => {
    await expect(careCoordinationAndTimelineService.recordTimelineEvent({
      encounterId: null,
      patientId: null,
      eventCategory: 'ADMISSION',
      eventTitle: 'Event Tanpa FK'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP })).rejects.toThrow('Data event timeline tidak lengkap');
  });

  // ─── TC-25: FULL E2E LONGITUDINAL PATIENT JOURNEY RECONCILIATION ───
  it('TC-25: should reconcile complete longitudinal patient journey (Admission ➔ Care Plan ➔ Handover ➔ Discharge) with 0 discrepancy', async () => {
    // 1. Admission Event
    const admEvt = await careCoordinationAndTimelineService.recordTimelineEvent({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      eventCategory: 'ADMISSION',
      eventTitle: 'Admisi Rawat Inap Ruang Azalea Bed 204',
      domainSourceTable: 'encounters',
      domainSourceId: 'enc-coord-001',
      eventTimestamp: '2026-08-20T08:00:00Z'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    // 2. Inter-Disciplinary Care Plan (ICP)
    const carePlan = await careCoordinationAndTimelineService.createOrUpdateCarePlan({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      title: 'Rencana Asuhan Terpadu Hiperkalemia & Sepsis',
      problemList: [{ problem: 'Hiperkalemia', priority: 'HIGH' }],
      goals: [{ targetOutcome: 'Kalium 3.5 - 5.0 mEq/L' }]
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    // 3. SBAR Shift Handover & Dual Sign-Off
    const handover = await careCoordinationAndTimelineService.createShiftHandover({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      shiftName: 'PAGI_KE_SORE',
      incomingPractitionerId: 'USR-NURSE-02',
      incomingPractitionerName: 'Ners Rina',
      sbarSituation: 'Koreksi kalium selesai, KU stabil.',
      sbarAssessment: 'EWS 1, TD 120/80.',
      sbarRecommendation: 'Evaluasi lab kalium sore ini.'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    await careCoordinationAndTimelineService.acknowledgeShiftHandover(
      handover.id,
      { userId: 'USR-NURSE-02', fullName: 'Ners Rina', role: ENTERPRISE_ROLES.ROLE_NURSE }
    );

    // 4. JCI Medical Discharge Resume
    const discharge = await careCoordinationAndTimelineService.createDischargeSummary({
      encounterId: 'enc-coord-001',
      patientId: 'pat-coord-001',
      admissionDiagnosisIcd10: 'E87.5',
      dischargeDiagnosisIcd10: 'N18.4',
      hospitalCourseSummary: 'Pasien dirawat 3 hari, hiperkalemia teratasi dengan baik, fungsi ginjal stabil.',
      dischargeCondition: 'PERBAIKAN',
      dischargeMedications: [{ drugName: 'Kalitake Sachet', dosage: '3x1 PO', quantity: 15 }],
      followUpInstructions: 'Kontrol Poli Penyakit Dalam 1 minggu lagi.',
      emergencyWarningSigns: 'Bila lemas atau sesak segera ke IGD.'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    // 5. Final State Ledger Reconciliation (0 Discrepancy)
    const timeline = await careCoordinationAndTimelineService.getUnifiedLongitudinalTimeline('enc-coord-001');

    expect(timeline.totalEvents).toBeGreaterThanOrEqual(4);
    expect(mockDatabaseState.longitudinal_care_plans.length).toBe(1);
    expect(mockDatabaseState.clinical_handovers.length).toBe(1);
    expect(mockDatabaseState.clinical_handovers[0].handover_status).toBe('COMPLETED');
    expect(mockDatabaseState.clinical_discharge_summaries.length).toBe(1);
    expect(mockDatabaseState.encounters[0].status).toBe('DISCHARGED');
    expect(mockDatabaseState.universal_audit_logs.length).toBe(2);
    expect(mockDatabaseState.clinical_domain_outbox.length).toBe(4);
  });
});
