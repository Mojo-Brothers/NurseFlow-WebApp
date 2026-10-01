/**
 * NurseFlow Enterprise HIS 2026 — Master Triage Application Service
 * Domain Authority: Emergency Triage Assessment (ATS / ESI v4) & Response SLA Engine
 * Standards: WHO Emergency Care, KARS 2024 PMKP, JCI IPSG 1 & 2, ACID Transactions
 *
 * P0-2B WAVE 1B.1 — UoW Pilot Refactor
 * All request-path DB writes now execute within withUnitOfWork:
 *   BEGIN -> SET LOCAL app.current_tenant_id -> DB Work -> COMMIT/ROLLBACK -> DISCARD ALL
 * Tenant ID is resolved from encounter.tenant_id (authoritative DB source of truth).
 * actor.tenantId is accepted ONLY as a pre-validation gate — never as a write-path fallback.
 */

import crypto from 'crypto';
import { postgresPoolService } from '../db/postgresPool.js';
import { withUnitOfWork } from '../db/unitOfWork.js';

export class TriageDomainError extends Error {
  constructor(message, code = 'TRIAGE_DOMAIN_ERROR', statusCode = 400, details = []) {
    super(message);
    this.name = 'TriageDomainError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const ATS_SLA_MINUTES = {
  1: 0,   // ATS 1: Resuscitation (Immediate 0 min)
  2: 10,  // ATS 2: Emergent (<= 10 min)
  3: 30,  // ATS 3: Urgent (<= 30 min)
  4: 60,  // ATS 4: Semi-Urgent (<= 60 min)
  5: 120  // ATS 5: Non-Urgent (<= 120 min)
};

export const triageApplicationService = {
  /**
   * Evaluate Triage Level and SLA Target based on ABCDE & Vitals
   */
  evaluateTriageLevel: ({
    triageMethod = 'ATS',
    atsLevel = 3,
    esiLevel = 3,
    airwayStatus = 'PATENT',
    breathingStatus = 'NORMAL',
    circulationStatus = 'NORMAL',
    disabilityStatus = 'ALERT',
    vitalsPayload = {}
  }) => {
    // Red Flags Override -> ATS 1 / ESI 1 (Immediate Resuscitation)
    if (
      airwayStatus === 'OBSTRUCTED' ||
      breathingStatus === 'APNEA' ||
      breathingStatus === 'SEVERE_RESPIRATORY_DISTRESS' ||
      circulationStatus === 'CARDIAC_ARREST' ||
      circulationStatus === 'SHOCK' ||
      disabilityStatus === 'UNRESPONSIVE' ||
      (vitalsPayload.gcs && Number(vitalsPayload.gcs) <= 8) ||
      (vitalsPayload.spo2 && Number(vitalsPayload.spo2) < 85)
    ) {
      return {
        level: 1,
        code: 'P1_RESUSCITATION',
        triageLevel: 'ATS_1_RESUSCITATION',
        targetMinutes: 0,
        colorCode: 'RED'
      };
    }

    // High Risk Override -> ATS 2 / ESI 2
    if (
      airwayStatus === 'THREATENED' ||
      circulationStatus === 'WEAK_PULSE' ||
      disabilityStatus === 'PAIN' ||
      (vitalsPayload.painScore && Number(vitalsPayload.painScore) >= 8) ||
      (vitalsPayload.spo2 && Number(vitalsPayload.spo2) < 92) ||
      (vitalsPayload.systolicBp && Number(vitalsPayload.systolicBp) > 200)
    ) {
      return {
        level: 2,
        code: 'P2_EMERGENT',
        triageLevel: 'ATS_2_EMERGENT',
        targetMinutes: 10,
        colorCode: 'ORANGE'
      };
    }

    // Standard Level Mapping
    const selectedLevel = Math.min(5, Math.max(1, triageMethod === 'ATS' ? atsLevel : esiLevel));
    const targetMinutes = ATS_SLA_MINUTES[selectedLevel] || 30;

    const levelCodes = {
      1: { code: 'P1_RESUSCITATION', triageLevel: 'ATS_1_RESUSCITATION', colorCode: 'RED' },
      2: { code: 'P2_EMERGENT', triageLevel: 'ATS_2_EMERGENT', colorCode: 'ORANGE' },
      3: { code: 'P3_URGENT', triageLevel: 'ATS_3_URGENT', colorCode: 'YELLOW' },
      4: { code: 'P4_SEMI_URGENT', triageLevel: 'ATS_4_SEMI_URGENT', colorCode: 'GREEN' },
      5: { code: 'P5_NON_URGENT', triageLevel: 'ATS_5_NON_URGENT', colorCode: 'BLUE' }
    };

    const meta = levelCodes[selectedLevel] || levelCodes[3];
    return {
      level: selectedLevel,
      code: meta.code,
      triageLevel: meta.triageLevel,
      targetMinutes,
      colorCode: meta.colorCode
    };
  },

  /**
   * Record Triage Assessment and Start SLA Timer (ACID Transaction)
   */
  recordTriageAssessment: async ({
    encounterId,
    patientId,
    episodeId = null,
    triageMethod = 'ATS',
    atsLevel = 3,
    esiLevel = 3,
    chiefComplaint = 'Keluhan umum IGD',
    airwayStatus = 'PATENT',
    breathingStatus = 'NORMAL',
    circulationStatus = 'NORMAL',
    disabilityStatus = 'ALERT',
    exposureNotes = '',
    vitalsPayload = {},
    isTrauma = false,
    isCito = false,
    assessedBy = 'Ns. Ratna Dewi, S.Kep'
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    if (!encounterId) {
      throw new TriageDomainError('Encounter ID wajib disertakan untuk asesmen triase.', 'VALIDATION_FAILED', 400, [{ field: 'encounterId' }]);
    }
    if (!chiefComplaint || chiefComplaint.trim().length === 0) {
      throw new TriageDomainError('Keluhan utama (chief complaint) pasien wajib dicatat.', 'VALIDATION_FAILED', 400, [{ field: 'chiefComplaint' }]);
    }
    // Actor must carry a tenantId for the UoW gate.
    // Authoritative tenant_id will be resolved from the encounter row inside the transaction.
    if (!actor.tenantId) {
      throw new TriageDomainError(
        'Actor tenantId wajib disertakan untuk melakukan asesmen triase.',
        'AUTHORITATIVE_TENANT_REQUIRED',
        403,
        [{ field: 'actor.tenantId' }]
      );
    }

    return withUnitOfWork(
      {
        tenantId: actor.tenantId,
        actorId: actor.userId || null,
        userRole: actor.role || null,
        isolationLevel: 'READ COMMITTED'
      },
      async ({ query }) => {
        // 1. Lock and Verify Encounter (RLS filters by app.current_tenant_id set by UoW)
        const encRes = await query('SELECT * FROM encounters WHERE id = $1 FOR UPDATE;', [encounterId]);
        if (encRes.rows.length === 0) {
          throw new TriageDomainError(`Encounter dengan ID ${encounterId} tidak ditemukan.`, 'ENCOUNTER_NOT_FOUND', 404);
        }
        const encounter = encRes.rows[0];

        // Authoritative tenant from DB row — the encounter owns the tenant boundary
        const targetTenantId = encounter.tenant_id;
        const targetPatientId = patientId || encounter.patient_id;
        const targetEpisodeId = episodeId || encounter.episode_id;

        // 2. Evaluate Clinical Triage Level and SLA Target
        const evalResult = triageApplicationService.evaluateTriageLevel({
          triageMethod,
          atsLevel,
          esiLevel,
          airwayStatus,
          breathingStatus,
          circulationStatus,
          disabilityStatus,
          vitalsPayload
        });

        const now = new Date();
        const triageId = crypto.randomUUID();
        const slaTimerId = crypto.randomUUID();

        // 3. Insert into triage_assessments
        const insertTriageSql = `
          INSERT INTO triage_assessments (
            id, tenant_id, episode_id, encounter_id, patient_id, triage_method,
            triage_level, ats_level, esi_level, chief_complaint,
            airway_status, breathing_status, circulation_status, disability_status,
            exposure_notes, vitals_payload, is_trauma, is_cito,
            target_response_minutes, assessed_at, assessed_by
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10,
            $11, $12, $13, $14,
            $15, $16, $17, $18,
            $19, $20, $21
          ) RETURNING *;
        `;

        const triageResult = await query(insertTriageSql, [
          triageId,
          targetTenantId,
          targetEpisodeId,
          encounterId,
          targetPatientId,
          triageMethod,
          evalResult.triageLevel,
          evalResult.level,
          evalResult.level,
          chiefComplaint,
          airwayStatus,
          breathingStatus,
          circulationStatus,
          disabilityStatus,
          exposureNotes,
          JSON.stringify(vitalsPayload),
          isTrauma,
          isCito || evalResult.level === 1,
          evalResult.targetMinutes,
          now,
          assessedBy
        ]);

        const createdTriage = triageResult.rows[0];

        // 4. Insert into triage_sla_timers
        const insertSlaSql = `
          INSERT INTO triage_sla_timers (
            id, tenant_id, encounter_id, triage_level, target_response_minutes,
            started_at, status
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7
          ) RETURNING *;
        `;

        const slaResult = await query(insertSlaSql, [
          slaTimerId,
          targetTenantId,
          encounterId,
          evalResult.triageLevel,
          evalResult.targetMinutes,
          now,
          'RUNNING'
        ]);

        const createdSlaTimer = slaResult.rows[0];

        // 5. Update Encounter Status to TRIAGED (if currently ARRIVED or PLANNED)
        if (['ARRIVED', 'PLANNED'].includes(encounter.status)) {
          await query(
            'UPDATE encounters SET status = $1, updated_at = $2 WHERE id = $3;',
            ['TRIAGED', now, encounterId]
          );
        }

        // 6. Record Cryptographic Universal Audit Trail
        const auditPayload = {
          action: 'TRIAGE_ASSESSMENT_RECORDED',
          triageId,
          encounterId,
          patientId: targetPatientId,
          triageLevel: evalResult.triageLevel,
          targetMinutes: evalResult.targetMinutes,
          assessedAt: now.toISOString(),
          actorId: actor.userId || 'USR-NURSE-TRIAGE-001',
          correlationId
        };
        const signatureHash = crypto.createHash('sha256').update(JSON.stringify(auditPayload)).digest('hex');

        await query(`
          INSERT INTO universal_audit_logs (
            id, actor_id, actor_name, actor_role, client_ip, action_type,
            resource_type, resource_id, patient_id, after_state,
            reason_for_action, signature_hash, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10,
            $11, $12, $13
          );
        `, [
          crypto.randomUUID(),
          actor.userId || 'USR-NURSE-TRIAGE-001',
          actor.username || actor.fullName || assessedBy,
          actor.role || 'ROLE_NURSE',
          clientIp,
          'CREATE',
          'TRIAGE_ASSESSMENT',
          triageId,
          targetPatientId,
          JSON.stringify(createdTriage),
          `Triase gawat darurat level ${evalResult.triageLevel} (${evalResult.targetMinutes} menit)`,
          signatureHash,
          now
        ]);

        return {
          triage: createdTriage,
          slaTimer: createdSlaTimer,
          colorCode: evalResult.colorCode,
          auditSignature: signatureHash
        };
      }
    );
  },

  /**
   * Stop SLA Timer when Doctor/Physician First Contacts Patient
   *
   * P0-2B WAVE 1B.1: Now executes within withUnitOfWork.
   * Tenant ID resolved from the active SLA timer row (authoritative DB source).
   */
  recordFirstPhysicianContact: async ({
    encounterId,
    physicianId = 'DOC-EMER-001',
    physicianName = 'dr. Emergency, Sp.B'
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    if (!actor.tenantId) {
      throw new TriageDomainError(
        'Actor tenantId wajib disertakan untuk mencatat kontak dokter pertama.',
        'AUTHORITATIVE_TENANT_REQUIRED',
        403,
        [{ field: 'actor.tenantId' }]
      );
    }

    return withUnitOfWork(
      {
        tenantId: actor.tenantId,
        actorId: actor.userId || null,
        userRole: actor.role || null,
        isolationLevel: 'READ COMMITTED'
      },
      async ({ query }) => {
        const timerRes = await query(
          'SELECT * FROM triage_sla_timers WHERE encounter_id = $1 AND status = $2 ORDER BY started_at DESC LIMIT 1 FOR UPDATE;',
          [encounterId, 'RUNNING']
        );

        if (timerRes.rows.length === 0) {
          throw new TriageDomainError(`Timer SLA triase aktif tidak ditemukan untuk encounter ${encounterId}.`, 'TIMER_NOT_FOUND', 404);
        }

        const timer = timerRes.rows[0];
        const now = new Date();
        const startedAt = new Date(timer.started_at);
        const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 1000));
        const targetSeconds = timer.target_response_minutes * 60;
        const isOverdue = elapsedSeconds > targetSeconds;

        const updateSql = `
          UPDATE triage_sla_timers SET
            first_physician_contact_at = $1,
            completed_at = $1,
            elapsed_seconds = $2,
            is_overdue = $3,
            status = 'COMPLETED'
          WHERE id = $4
          RETURNING *;
        `;

        const updateResult = await query(updateSql, [
          now,
          elapsedSeconds,
          isOverdue,
          timer.id
        ]);

        // Also transition encounter to IN_PROGRESS if currently TRIAGED
        await query(
          'UPDATE encounters SET status = $1, primary_doctor_id = COALESCE($2, primary_doctor_id), primary_doctor_name = COALESCE($3, primary_doctor_name), updated_at = $4 WHERE id = $5 AND status = $6;',
          ['IN_PROGRESS', physicianId, physicianName, now, encounterId, 'TRIAGED']
        );

        return updateResult.rows[0];
      }
    );
  },

  /**
   * Get Triage Detail for Encounter
   *
   * P0-2B WAVE 1B.1: Read path wrapped in UoW so RLS policy (app.current_tenant_id)
   * filters results correctly — prevents cross-tenant data leakage on reads.
   * Signature change: now accepts actor as second param (breaking change in controller — see triage.controller.js).
   */
  getTriageByEncounterId: async (encounterId, actor = {}) => {
    if (!actor.tenantId) {
      throw new TriageDomainError(
        'Actor tenantId wajib disertakan untuk membaca data triase.',
        'AUTHORITATIVE_TENANT_REQUIRED',
        403,
        [{ field: 'actor.tenantId' }]
      );
    }

    return withUnitOfWork(
      {
        tenantId: actor.tenantId,
        actorId: actor.userId || null,
        userRole: actor.role || null,
        isolationLevel: 'READ COMMITTED'
      },
      async ({ query }) => {
        const triageSql = `
          SELECT t.*, p.full_name as patient_name, p.mrn, p.nik, e.status as encounter_status
          FROM triage_assessments t
          JOIN master_patients p ON t.patient_id = p.id
          JOIN encounters e ON t.encounter_id = e.id
          WHERE t.encounter_id = $1
          ORDER BY t.assessed_at DESC
          LIMIT 1;
        `;
        const res = await query(triageSql, [encounterId]);
        return res.rows[0] || null;
      }
    );
  }
};
