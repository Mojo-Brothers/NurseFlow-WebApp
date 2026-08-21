/**
 * NurseFlow Enterprise HIS 2026 — Master Care Coordination & Longitudinal Timeline Service
 * Domain: Unified Longitudinal Timeline Reconstruction, Causal Event Lineage,
 * Inter-Disciplinary Care Plan (ICP), SBAR Shift Handover, and JCI Medical Discharge Resume.
 * Standards: JCI COP / IPSG 2, ISO 13606, HL7 FHIR CarePlan / Composition, PostgreSQL 16 ACID.
 */

import crypto from 'crypto';
import { postgresPoolService } from '../db/postgresPool.js';
import { ENTERPRISE_ROLES } from '../../src/shared/constants/roles.js';

export class CareCoordinationDomainError extends Error {
  constructor(message, code = 'CARE_COORDINATION_ERROR', statusCode = 400, details = []) {
    super(message);
    this.name = 'CareCoordinationDomainError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

const AUTHORIZED_CARE_PLAN_ROLES = [
  'ROLE_SUPER_ADMIN',
  'ROLE_DOCTOR_DPJP',
  'ROLE_DOCTOR_EMERGENCY',
  'ROLE_DOCTOR_SPECIALIST',
  'ROLE_ICU_SPECIALIST',
  'ROLE_NURSE'
];

const AUTHORIZED_DISCHARGE_ROLES = [
  'ROLE_SUPER_ADMIN',
  'ROLE_DOCTOR_DPJP',
  'ROLE_DOCTOR_EMERGENCY',
  'ROLE_DOCTOR_SPECIALIST'
];

export const careCoordinationAndTimelineService = {
  /**
   * 1. Record Atomic Longitudinal Timeline Event
   */
  recordTimelineEvent: async (eventPayload, actor, clientIp = '127.0.0.1', correlationId = null, externalClient = null) => {
    const {
      encounterId,
      patientId,
      eventCategory,
      eventTitle,
      eventSummary,
      domainSourceTable,
      domainSourceId,
      parentEventId = null,
      clinicalSeverity = 'INFO',
      eventTimestamp = new Date().toISOString()
    } = eventPayload;

    if (!encounterId || !patientId || !eventCategory || !eventTitle || !domainSourceTable || !domainSourceId) {
      throw new CareCoordinationDomainError(
        'Data event timeline tidak lengkap. encounterId, patientId, eventCategory, eventTitle, domainSourceTable, domainSourceId wajib ada.',
        'VALIDATION_FAILED',
        400
      );
    }

    const client = externalClient || await postgresPoolService.getPool().connect();
    const shouldManageTx = !externalClient;

    try {
      if (shouldManageTx) await client.query('BEGIN');

      const eventId = crypto.randomUUID();
      const corrId = correlationId || `CORR-EVT-${Date.now()}`;
      const actorId = actor.userId || actor.id || 'SYS-ACTOR';
      const actorName = actor.fullName || actor.name || actor.username || 'System Engine';
      const actorRole = actor.role || 'ROLE_DOCTOR_DPJP';

      const signaturePayload = `${eventId}|${encounterId}|${patientId}|${eventCategory}|${eventTitle}|${domainSourceTable}|${domainSourceId}|${eventTimestamp}|${actorId}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(signaturePayload).digest('hex');

      const insertSql = `
        INSERT INTO longitudinal_timeline_events (
          id, encounter_id, patient_id, event_category, event_title, event_summary,
          domain_source_table, domain_source_id, parent_event_id,
          actor_id, actor_name, actor_role, event_timestamp,
          clinical_severity, digital_signature_hash, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
        RETURNING *;
      `;

      const res = await client.query(insertSql, [
        eventId, encounterId, patientId, eventCategory, eventTitle, eventSummary || '',
        domainSourceTable, domainSourceId, parentEventId,
        actorId, actorName, actorRole, eventTimestamp,
        clinicalSeverity, digitalSignatureHash, corrId
      ]);

      if (shouldManageTx) await client.query('COMMIT');
      return res.rows[0];
    } catch (err) {
      if (shouldManageTx) await client.query('ROLLBACK');
      throw err;
    } finally {
      if (shouldManageTx) client.release();
    }
  },

  /**
   * 2. Get Unified Longitudinal Timeline (Chronological Causal Graph)
   */
  getUnifiedLongitudinalTimeline: async (encounterId, options = {}) => {
    if (!encounterId) {
      throw new CareCoordinationDomainError('Encounter ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const client = await postgresPoolService.getPool().connect();
    try {
      const sql = `
        SELECT * FROM longitudinal_timeline_events
        WHERE encounter_id = $1
        ORDER BY event_timestamp ASC;
      `;
      const res = await client.query(sql, [encounterId]);
      const events = res.rows || [];

      // Causal Graph Mapping
      const eventMap = new Map();
      events.forEach(evt => eventMap.set(evt.id, { ...evt, downstreamChildren: [] }));

      const rootEvents = [];
      events.forEach(evt => {
        const mapped = eventMap.get(evt.id);
        if (evt.parent_event_id && eventMap.has(evt.parent_event_id)) {
          eventMap.get(evt.parent_event_id).downstreamChildren.push(mapped);
        } else {
          rootEvents.push(mapped);
        }
      });

      return {
        encounterId,
        totalEvents: events.length,
        chronologicalEvents: events,
        causalGraph: rootEvents
      };
    } finally {
      client.release();
    }
  },

  /**
   * 3. Create or Update Inter-Disciplinary Care Plan (ICP)
   */
  createOrUpdateCarePlan: async (payload, actor, clientIp = '127.0.0.1', correlationId = null) => {
    const {
      carePlanId = null,
      encounterId,
      patientId,
      title,
      problemList = [],
      goals = [],
      interventions = [],
      multiDisciplinaryContributors = []
    } = payload;

    if (!encounterId || !patientId || !title) {
      throw new CareCoordinationDomainError(
        'Encounter ID, Patient ID, dan Judul Rencana Asuhan wajib disertakan.',
        'VALIDATION_FAILED',
        400
      );
    }

    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!AUTHORIZED_CARE_PLAN_ROLES.includes(authorRole)) {
      throw new CareCoordinationDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki wewenang menyusun Rencana Asuhan Terpadu.`,
        'FORBIDDEN_CARE_PLAN_ROLE',
        403
      );
    }

    const client = await postgresPoolService.getPool().connect();
    const corrId = correlationId || `CORR-ICP-${Date.now()}`;
    const authorId = actor.userId || actor.id || 'DOC-DPJP-01';
    const authorName = actor.fullName || actor.name || 'dr. DPJP Utama, Sp.PD';

    try {
      await client.query('BEGIN');

      // Verify encounter is active
      const encRes = await client.query('SELECT id, status FROM encounters WHERE id = $1', [encounterId]);
      if (encRes.rows.length === 0) {
        throw new CareCoordinationDomainError('Encounter tidak ditemukan.', 'ENCOUNTER_NOT_FOUND', 404);
      }
      if (['CLOSED', 'CANCELLED'].includes(encRes.rows[0].status)) {
        throw new CareCoordinationDomainError('Encounter telah ditutup.', 'ENCOUNTER_TERMINATED', 409);
      }

      let carePlanRecord = null;
      let version = 1;
      let planId = carePlanId || crypto.randomUUID();
      const planNumber = `ICP-${Date.now().toString().slice(-6)}`;

      if (carePlanId) {
        const existingRes = await client.query('SELECT * FROM longitudinal_care_plans WHERE id = $1', [carePlanId]);
        if (existingRes.rows.length === 0) {
          throw new CareCoordinationDomainError('Care Plan tidak ditemukan.', 'NOT_FOUND', 404);
        }
        version = (existingRes.rows[0].version || 1) + 1;
      }

      const sigPayload = `${planId}|${encounterId}|${patientId}|${title}|${version}|${authorId}|${new Date().toISOString()}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

      if (carePlanId) {
        const updateSql = `
          UPDATE longitudinal_care_plans
          SET title = $1, problem_list = $2, goals = $3, interventions = $4,
              multi_disciplinary_contributors = $5, version = $6, digital_signature_hash = $7,
              updated_at = NOW()
          WHERE id = $8
          RETURNING *;
        `;
        const res = await client.query(updateSql, [
          title, JSON.stringify(problemList), JSON.stringify(goals), JSON.stringify(interventions),
          JSON.stringify(multiDisciplinaryContributors), version, digitalSignatureHash, carePlanId
        ]);
        carePlanRecord = res.rows[0];
      } else {
        const insertSql = `
          INSERT INTO longitudinal_care_plans (
            id, encounter_id, patient_id, care_plan_number, title, status,
            problem_list, goals, interventions, lead_dpjp_id, lead_dpjp_name,
            multi_disciplinary_contributors, version, digital_signature_hash,
            correlation_id, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
          RETURNING *;
        `;
        const res = await client.query(insertSql, [
          planId, encounterId, patientId, planNumber, title,
          JSON.stringify(problemList), JSON.stringify(goals), JSON.stringify(interventions),
          authorId, authorName, JSON.stringify(multiDisciplinaryContributors),
          version, digitalSignatureHash, corrId
        ]);
        carePlanRecord = res.rows[0];
      }

      // Record Timeline Event
      await careCoordinationAndTimelineService.recordTimelineEvent({
        encounterId,
        patientId,
        eventCategory: 'CARE_PLAN_SYNCHRONIZED',
        eventTitle: `Rencana Asuhan Terpadu (ICP) v${version}: ${title}`,
        eventSummary: `Disusun oleh ${authorName} (${authorRole}). ${problemList.length} masalah aktif, ${goals.length} target sasaran.`,
        domainSourceTable: 'longitudinal_care_plans',
        domainSourceId: carePlanRecord.id,
        clinicalSeverity: 'INFO'
      }, actor, clientIp, corrId, client);

      // Audit Log
      await client.query(`
        INSERT INTO universal_audit_logs (
          id, event_type, event_name, event_category, actor_id, actor_name, actor_role,
          resource_type, resource_id, encounter_id, patient_id, client_ip, correlation_id, created_at
        ) VALUES ($1, 'CARE_PLAN_SAVED', 'Penyusunan Rencana Asuhan Terpadu', 'CLINICAL', $2, $3, $4, 'longitudinal_care_plans', $5, $6, $7, $8, $9, NOW());
      `, [crypto.randomUUID(), authorId, authorName, authorRole, carePlanRecord.id, encounterId, patientId, clientIp, corrId]);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type, event_payload, status, correlation_id, created_at
        ) VALUES ($1, 'CARE_PLAN', $2, 'CARE_PLAN_SYNCHRONIZED', $3, 'PENDING', $4, NOW());
      `, [crypto.randomUUID(), carePlanRecord.id, JSON.stringify({ carePlanId: carePlanRecord.id, version, title }), corrId]);

      await client.query('COMMIT');
      return carePlanRecord;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * 4. Create SBAR Shift Handover
   */
  createShiftHandover: async (payload, actor, clientIp = '127.0.0.1', correlationId = null) => {
    const {
      encounterId,
      patientId,
      shiftName,
      departmentId,
      departmentName,
      incomingPractitionerId,
      incomingPractitionerName,
      incomingPractitionerRole,
      sbarSituation,
      sbarBackground,
      sbarAssessment,
      sbarRecommendation,
      highRiskFlags = [],
      pendingDiagnosticOrders = [],
      vitalSignsSnapshot = {}
    } = payload;

    if (!encounterId || !patientId || !shiftName || !incomingPractitionerId || !sbarSituation || !sbarAssessment || !sbarRecommendation) {
      throw new CareCoordinationDomainError(
        'Data operan jaga SBAR tidak lengkap. Parameter wajib: encounterId, patientId, shiftName, incomingPractitionerId, sbarSituation, sbarAssessment, sbarRecommendation.',
        'VALIDATION_FAILED',
        400
      );
    }

    const client = await postgresPoolService.getPool().connect();
    const corrId = correlationId || `CORR-HND-${Date.now()}`;
    const outgoingId = actor.userId || actor.id || 'NURSE-OUT-01';
    const outgoingName = actor.fullName || actor.name || 'Ners Siti (Shift Pagi)';
    const outgoingRole = actor.role || 'ROLE_NURSE';

    try {
      await client.query('BEGIN');

      const handoverId = crypto.randomUUID();
      const handoverNumber = `HND-${Date.now().toString().slice(-6)}`;
      const timestamp = new Date().toISOString();

      const sigPayload = `${handoverId}|${encounterId}|${patientId}|${shiftName}|${outgoingId}|${incomingPractitionerId}|${timestamp}`;
      const digitalSignatureOutgoing = crypto.createHash('sha256').update(sigPayload).digest('hex');

      const insertSql = `
        INSERT INTO clinical_handovers (
          id, encounter_id, patient_id, handover_number, shift_name,
          department_id, department_name, outgoing_practitioner_id, outgoing_practitioner_name,
          outgoing_practitioner_role, incoming_practitioner_id, incoming_practitioner_name,
          incoming_practitioner_role, sbar_situation, sbar_background, sbar_assessment,
          sbar_recommendation, high_risk_flags, pending_diagnostic_orders,
          vital_signs_snapshot, handover_timestamp, handover_status,
          digital_signature_outgoing, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, 'PENDING_ACKNOWLEDGMENT', $22, $23, NOW())
        RETURNING *;
      `;

      const res = await client.query(insertSql, [
        handoverId, encounterId, patientId, handoverNumber, shiftName,
        departmentId || 'DEP-WARD-01', departmentName || 'Ruang Rawat Inap',
        outgoingId, outgoingName, outgoingRole,
        incomingPractitionerId, incomingPractitionerName || 'Incoming Staff', incomingPractitionerRole || 'ROLE_NURSE',
        sbarSituation, sbarBackground || '', sbarAssessment, sbarRecommendation,
        JSON.stringify(highRiskFlags), JSON.stringify(pendingDiagnosticOrders),
        JSON.stringify(vitalSignsSnapshot), timestamp, digitalSignatureOutgoing, corrId
      ]);

      const handoverRecord = res.rows[0];

      // Record Timeline Event
      await careCoordinationAndTimelineService.recordTimelineEvent({
        encounterId,
        patientId,
        eventCategory: 'SHIFT_HANDOVER_INITIATED',
        eventTitle: `Operan Jaga SBAR (${shiftName}): Diserahkan ke ${incomingPractitionerName}`,
        eventSummary: `Situation: ${sbarSituation}. Assessment: ${sbarAssessment}. Recommendation: ${sbarRecommendation}`,
        domainSourceTable: 'clinical_handovers',
        domainSourceId: handoverRecord.id,
        clinicalSeverity: highRiskFlags.length > 0 ? 'WARNING' : 'INFO'
      }, actor, clientIp, corrId, client);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type, event_payload, status, correlation_id, created_at
        ) VALUES ($1, 'HANDOVER', $2, 'SHIFT_HANDOVER_RECORDED', $3, 'PENDING', $4, NOW());
      `, [crypto.randomUUID(), handoverRecord.id, JSON.stringify({ handoverId: handoverRecord.id, shiftName, incomingPractitionerId }), corrId]);

      await client.query('COMMIT');
      return handoverRecord;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * 5. Acknowledge Shift Handover (Incoming Dual Sign-Off)
   */
  acknowledgeShiftHandover: async (handoverId, actor, clientIp = '127.0.0.1', correlationId = null) => {
    if (!handoverId) {
      throw new CareCoordinationDomainError('Handover ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const client = await postgresPoolService.getPool().connect();
    const corrId = correlationId || `CORR-ACK-HND-${Date.now()}`;
    const incomingId = actor.userId || actor.id || 'NURSE-INC-01';
    const incomingName = actor.fullName || actor.name || 'Ners Dewi (Shift Sore)';

    try {
      await client.query('BEGIN');

      const existingRes = await client.query('SELECT * FROM clinical_handovers WHERE id = $1', [handoverId]);
      if (existingRes.rows.length === 0) {
        throw new CareCoordinationDomainError('Operan jaga tidak ditemukan.', 'NOT_FOUND', 404);
      }
      const existing = existingRes.rows[0];

      if (existing.handover_status === 'COMPLETED') {
        throw new CareCoordinationDomainError('Operan jaga ini sudah dikonfirmasi sebelumnya.', 'ALREADY_ACKNOWLEDGED', 409);
      }

      const timestamp = new Date().toISOString();
      const sigPayload = `${handoverId}|${existing.encounter_id}|${incomingId}|${timestamp}|ACKNOWLEDGED`;
      const digitalSignatureIncoming = crypto.createHash('sha256').update(sigPayload).digest('hex');

      const updateSql = `
        UPDATE clinical_handovers
        SET handover_status = 'COMPLETED', acknowledged_at = $1, digital_signature_incoming = $2
        WHERE id = $3
        RETURNING *;
      `;
      const res = await client.query(updateSql, [timestamp, digitalSignatureIncoming, handoverId]);
      const updated = res.rows[0];

      // Record Timeline Event
      await careCoordinationAndTimelineService.recordTimelineEvent({
        encounterId: existing.encounter_id,
        patientId: existing.patient_id,
        eventCategory: 'SHIFT_HANDOVER_ACKNOWLEDGED',
        eventTitle: `Operan Jaga SBAR Diterima & Diverifikasi oleh ${incomingName}`,
        eventSummary: `Tanggung jawab asuhan pasien telah dialihkan ke shift berikutnya.`,
        domainSourceTable: 'clinical_handovers',
        domainSourceId: updated.id,
        clinicalSeverity: 'INFO'
      }, actor, clientIp, corrId, client);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type, event_payload, status, correlation_id, created_at
        ) VALUES ($1, 'HANDOVER', $2, 'SHIFT_HANDOVER_COMPLETED', $3, 'PENDING', $4, NOW());
      `, [crypto.randomUUID(), updated.id, JSON.stringify({ handoverId: updated.id, acknowledgedBy: incomingName }), corrId]);

      await client.query('COMMIT');
      return updated;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * 6. Create & Lock JCI Medical Discharge Resume (Discharge Summary)
   */
  createDischargeSummary: async (payload, actor, clientIp = '127.0.0.1', correlationId = null) => {
    const {
      encounterId,
      patientId,
      admissionDatetime,
      dischargeDatetime = new Date().toISOString(),
      admissionDiagnosisIcd10,
      admissionDiagnosisName,
      dischargeDiagnosisIcd10,
      dischargeDiagnosisName,
      secondaryDiagnoses = [],
      proceduresPerformed = [],
      hospitalCourseSummary,
      significantDiagnosticFindings,
      dischargeCondition,
      dischargeVitalSigns = {},
      dischargeMedications = [],
      followUpInstructions,
      emergencyWarningSigns
    } = payload;

    if (
      !encounterId || !patientId || !admissionDiagnosisIcd10 || !dischargeDiagnosisIcd10 ||
      !hospitalCourseSummary || !dischargeCondition || !followUpInstructions || !emergencyWarningSigns
    ) {
      throw new CareCoordinationDomainError(
        'Data Resume Medis Pulang tidak lengkap. Parameter wajib: encounterId, patientId, admissionDiagnosisIcd10, dischargeDiagnosisIcd10, hospitalCourseSummary, dischargeCondition, followUpInstructions, emergencyWarningSigns.',
        'VALIDATION_FAILED',
        400
      );
    }

    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!AUTHORIZED_DISCHARGE_ROLES.includes(authorRole)) {
      throw new CareCoordinationDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki wewenang mengesahkan Resume Medis Pulang DPJP.`,
        'FORBIDDEN_DISCHARGE_ROLE',
        403
      );
    }

    const client = await postgresPoolService.getPool().connect();
    const corrId = correlationId || `CORR-DISC-${Date.now()}`;
    const authorId = actor.userId || actor.id || 'DOC-DPJP-01';
    const authorName = actor.fullName || actor.name || 'dr. DPJP Utama, Sp.PD';

    try {
      await client.query('BEGIN');

      // Verify encounter
      const encRes = await client.query('SELECT id, status, start_time FROM encounters WHERE id = $1', [encounterId]);
      if (encRes.rows.length === 0) {
        throw new CareCoordinationDomainError('Encounter tidak ditemukan.', 'ENCOUNTER_NOT_FOUND', 404);
      }

      const summaryId = crypto.randomUUID();
      const summaryNumber = `DISC-${Date.now().toString().slice(-6)}`;
      const admissionTime = admissionDatetime || encRes.rows[0].start_time || new Date().toISOString();

      const sigPayload = `${summaryId}|${encounterId}|${patientId}|${dischargeDiagnosisIcd10}|${dischargeCondition}|${dischargeDatetime}|${authorId}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

      const insertSql = `
        INSERT INTO clinical_discharge_summaries (
          id, encounter_id, patient_id, summary_number,
          admission_datetime, discharge_datetime,
          admission_diagnosis_icd10, admission_diagnosis_name,
          discharge_diagnosis_icd10, discharge_diagnosis_name,
          secondary_diagnoses, procedures_performed,
          hospital_course_summary, significant_diagnostic_findings,
          discharge_condition, discharge_vital_signs, discharge_medications,
          follow_up_instructions, emergency_warning_signs,
          discharging_dpjp_id, discharging_dpjp_name,
          digital_signature_hash, status, correlation_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, 'LOCKED', $23, NOW(), NOW())
        RETURNING *;
      `;

      const res = await client.query(insertSql, [
        summaryId, encounterId, patientId, summaryNumber,
        admissionTime, dischargeDatetime,
        admissionDiagnosisIcd10, admissionDiagnosisName || admissionDiagnosisIcd10,
        dischargeDiagnosisIcd10, dischargeDiagnosisName || dischargeDiagnosisIcd10,
        JSON.stringify(secondaryDiagnoses), JSON.stringify(proceduresPerformed),
        hospitalCourseSummary, significantDiagnosticFindings || 'Dalam batas aman/stabil',
        dischargeCondition, JSON.stringify(dischargeVitalSigns), JSON.stringify(dischargeMedications),
        followUpInstructions, emergencyWarningSigns,
        authorId, authorName,
        digitalSignatureHash, corrId
      ]);

      const summaryRecord = res.rows[0];

      // Update encounter status to DISCHARGED
      await client.query(`
        UPDATE encounters
        SET status = 'DISCHARGED', end_time = $1, discharge_disposition = $2, updated_at = NOW()
        WHERE id = $3;
      `, [dischargeDatetime, dischargeCondition, encounterId]);

      // Record Timeline Event
      await careCoordinationAndTimelineService.recordTimelineEvent({
        encounterId,
        patientId,
        eventCategory: 'DISCHARGE_SUMMARY_LOCKED',
        eventTitle: `Resume Medis Pulang (Discharge Summary) Disahkan: ${dischargeDiagnosisName || dischargeDiagnosisIcd10}`,
        eventSummary: `Kondisi: ${dischargeCondition}. DPJP: ${authorName}. ${dischargeMedications.length} obat pulang direkonsiliasi.`,
        domainSourceTable: 'clinical_discharge_summaries',
        domainSourceId: summaryRecord.id,
        clinicalSeverity: 'INFO'
      }, actor, clientIp, corrId, client);

      // Audit Log
      await client.query(`
        INSERT INTO universal_audit_logs (
          id, event_type, event_name, event_category, actor_id, actor_name, actor_role,
          resource_type, resource_id, encounter_id, patient_id, client_ip, correlation_id, created_at
        ) VALUES ($1, 'DISCHARGE_SUMMARY_LOCKED', 'Pengesahan Resume Medis Pulang', 'CLINICAL', $2, $3, $4, 'clinical_discharge_summaries', $5, $6, $7, $8, $9, NOW());
      `, [crypto.randomUUID(), authorId, authorName, authorRole, summaryRecord.id, encounterId, patientId, clientIp, corrId]);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type, event_payload, status, correlation_id, created_at
        ) VALUES ($1, 'DISCHARGE_SUMMARY', $2, 'DISCHARGE_SUMMARY_FINALIZED', $3, 'PENDING', $4, NOW());
      `, [crypto.randomUUID(), summaryRecord.id, JSON.stringify({ summaryId: summaryRecord.id, encounterId, dischargeCondition }), corrId]);

      await client.query('COMMIT');
      return summaryRecord;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};
