/**
 * NurseFlow Enterprise HIS 2026 — Master Encounter Application Service
 * Domain Authority: Episodes of Care & Clinical Encounters FSM
 * Standards: HL7 FHIR R4 (Encounter & EpisodeOfCare), JCI Patient Journey Documentation, ACID Transactions
 */

import crypto from 'crypto';
import { postgresPoolService } from '../db/postgresPool.js';

export class EncounterDomainError extends Error {
  constructor(message, code = 'ENCOUNTER_DOMAIN_ERROR', statusCode = 400, details = []) {
    super(message);
    this.name = 'EncounterDomainError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const ENCOUNTER_FSM_TRANSITIONS = {
  PLANNED: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['TRIAGED', 'IN_PROGRESS', 'CANCELLED'],
  TRIAGED: ['IN_PROGRESS', 'ON_HOLD', 'CANCELLED'],
  IN_PROGRESS: ['ON_HOLD', 'COMPLETED', 'DISCHARGED'],
  ON_HOLD: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  COMPLETED: ['CLOSED'],
  DISCHARGED: ['CLOSED'],
  CLOSED: [],
  CANCELLED: []
};

export const encounterApplicationService = {
  /**
   * Generate Sequential Episode Number (EPC-YYYY-XXXXX)
   */
  generateNextEpisodeNumber: async (client) => {
    const year = new Date().getFullYear();
    const prefix = `EPC-${year}-`;
    const res = await client.query(
      'SELECT episode_number FROM episodes_of_care WHERE episode_number LIKE $1 ORDER BY episode_number DESC LIMIT 1 FOR UPDATE;',
      [`${prefix}%`]
    );
    let nextSeq = 1;
    if (res.rows.length > 0) {
      const parts = res.rows[0].episode_number.split('-');
      if (parts.length === 3) {
        const parsed = parseInt(parts[2], 10);
        if (!isNaN(parsed)) nextSeq = parsed + 1;
      }
    }
    return `${prefix}${nextSeq.toString().padStart(5, '0')}`;
  },

  /**
   * Generate Sequential Encounter Number (ENC-YYYY-XXXXX)
   */
  generateNextEncounterNumber: async (client) => {
    const year = new Date().getFullYear();
    const prefix = `ENC-${year}-`;
    const res = await client.query(
      'SELECT encounter_number FROM encounters WHERE encounter_number LIKE $1 ORDER BY encounter_number DESC LIMIT 1 FOR UPDATE;',
      [`${prefix}%`]
    );
    let nextSeq = 1;
    if (res.rows.length > 0) {
      const parts = res.rows[0].encounter_number.split('-');
      if (parts.length === 3) {
        const parsed = parseInt(parts[2], 10);
        if (!isNaN(parsed)) nextSeq = parsed + 1;
      }
    }
    return `${prefix}${nextSeq.toString().padStart(5, '0')}`;
  },

  /**
   * Create New Clinical Encounter & Episode of Care (ACID Transaction)
   */
  createEncounter: async ({
    patientId,
    episodeId = null,
    encounterClass = 'AMB', // 'AMB' | 'EMER' | 'IMP' | 'VR'
    encounterType = 'KONSULTASI_RAWAT_JALAN',
    status = 'ARRIVED',
    primaryDoctorId = 'DOC-1001',
    primaryDoctorName = 'dr. Siti Wijaya, Sp.PD-KGEH',
    serviceRoomId = 'CLI-1001',
    serviceRoomName = 'Poliklinik Penyakit Dalam',
    bedId = null,
    bedNumber = null,
    chiefComplaint = 'Pemeriksaan Rutin'
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    if (!patientId) {
      throw new EncounterDomainError('Patient ID wajib disertakan untuk membuat Encounter.', 'VALIDATION_FAILED', 400, [{ field: 'patientId' }]);
    }
    if (!primaryDoctorId || !primaryDoctorName) {
      throw new EncounterDomainError('Dokter Penanggung Jawab (DPJP) wajib ditentukan.', 'VALIDATION_FAILED', 400, [{ field: 'primaryDoctorId' }]);
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      // 1. Verify Patient Exists in Master Patient Index
      const patientCheck = await client.query('SELECT id, mrn, full_name FROM master_patients WHERE id = $1 LIMIT 1;', [patientId]);
      if (patientCheck.rows.length === 0) {
        throw new EncounterDomainError(`Pasien dengan ID ${patientId} tidak ditemukan di Master Patient Index.`, 'PATIENT_NOT_FOUND', 404);
      }
      const patient = patientCheck.rows[0];

      const now = new Date();
      let activeEpisodeId = episodeId;

      // 2. Create Episode of Care if not present
      if (!activeEpisodeId) {
        const episodeNumber = await encounterApplicationService.generateNextEpisodeNumber(client);
        activeEpisodeId = crypto.randomUUID();
        const episodeTypeMap = {
          EMER: 'GAWAT_DARURAT',
          IMP: 'RAWAT_INAP',
          AMB: 'RAWAT_JALAN',
          VR: 'TELEMEDIS'
        };
        const epType = episodeTypeMap[encounterClass] || 'RAWAT_JALAN';

        const insertEpisodeQuery = `
          INSERT INTO episodes_of_care (
            id, episode_number, patient_id, episode_type, status,
            managing_department_id, managing_department_name,
            lead_dpjp_id, lead_dpjp_name, start_time,
            general_consent_signed, financial_consent_signed, branch_id, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15
          ) RETURNING *;
        `;

        await client.query(insertEpisodeQuery, [
          activeEpisodeId,
          episodeNumber,
          patient.id,
          epType,
          'ACTIVE',
          serviceRoomId,
          serviceRoomName,
          primaryDoctorId,
          primaryDoctorName,
          now,
          true,
          true,
          'BRN-JKT-PST',
          now,
          now
        ]);
      }

      // 3. Create Encounter Record
      const encounterId = crypto.randomUUID();
      const encounterNumber = await encounterApplicationService.generateNextEncounterNumber(client);

      const insertEncounterQuery = `
        INSERT INTO encounters (
          id, encounter_number, episode_id, patient_id,
          encounter_type, encounter_class, status,
          primary_doctor_id, primary_doctor_name,
          service_room_id, service_room_name,
          bed_id, bed_number, start_time, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7,
          $8, $9,
          $10, $11,
          $12, $13, $14, $15, $16
        ) RETURNING *;
      `;

      const encounterResult = await client.query(insertEncounterQuery, [
        encounterId,
        encounterNumber,
        activeEpisodeId,
        patient.id,
        encounterType,
        encounterClass,
        status || 'ARRIVED',
        primaryDoctorId,
        primaryDoctorName,
        serviceRoomId,
        serviceRoomName,
        bedId,
        bedNumber,
        now,
        now,
        now
      ]);

      const createdEncounter = encounterResult.rows[0];

      // 4. Compute Immutable Audit Trail Signature
      const auditPayload = {
        action: 'ENCOUNTER_CREATE',
        encounterId: createdEncounter.id,
        encounterNumber: createdEncounter.encounter_number,
        patientId: patient.id,
        status: createdEncounter.status,
        createdAt: now.toISOString(),
        actorId: actor.userId || 'USR-REG-001',
        correlationId
      };
      const signatureHash = crypto.createHash('sha256').update(JSON.stringify(auditPayload)).digest('hex');

      const auditQuery = `
        INSERT INTO universal_audit_logs (
          id, actor_id, actor_name, actor_role, client_ip, action_type,
          resource_type, resource_id, patient_id, after_state,
          reason_for_action, signature_hash, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10,
          $11, $12, $13
        );
      `;

      await client.query(auditQuery, [
        crypto.randomUUID(),
        actor.userId || 'USR-REG-001',
        actor.username || actor.fullName || 'Petugas Admisi / Klinisi',
        actor.role || 'ROLE_REGISTRATION_CLERK',
        clientIp,
        'CREATE',
        'ENCOUNTER',
        createdEncounter.id,
        patient.id,
        JSON.stringify(createdEncounter),
        `Pembukaan encounter baru (${encounterClass})`,
        signatureHash,
        now
      ]);

      // 5. COMMIT TRANSACTION
      await client.query('COMMIT;');

      return {
        ...createdEncounter,
        patientName: patient.full_name,
        mrn: patient.mrn,
        auditSignature: signatureHash
      };
    } catch (err) {
      await client.query('ROLLBACK;');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Transition Encounter Status FSM (ACID Transaction)
   */
  transitionEncounterStatus: async ({
    encounterId,
    nextStatus,
    reason = 'Proses pelayanan klinis berlangsung',
    dischargeDisposition = null
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      // 1. Lock Encounter Row
      const encRes = await client.query('SELECT * FROM encounters WHERE id = $1 FOR UPDATE;', [encounterId]);
      if (encRes.rows.length === 0) {
        throw new EncounterDomainError(`Encounter dengan ID ${encounterId} tidak ditemukan.`, 'ENCOUNTER_NOT_FOUND', 404);
      }

      const encounter = encRes.rows[0];
      const currentStatus = encounter.status;

      // 2. Validate FSM State Transition Invariant
      const allowedNext = ENCOUNTER_FSM_TRANSITIONS[currentStatus] || [];
      if (!allowedNext.includes(nextStatus)) {
        throw new EncounterDomainError(
          `Transisi status Encounter ilegal: Dari '${currentStatus}' ke '${nextStatus}' tidak diizinkan oleh Clinical FSM.`,
          'CLINICAL_INVALID_STATE_TRANSITION',
          400,
          [{ currentStatus, requestedStatus: nextStatus, allowedNext }]
        );
      }

      const now = new Date();
      const isTerminal = ['DISCHARGED', 'COMPLETED', 'CLOSED', 'CANCELLED'].includes(nextStatus);

      // 3. Update Encounter Record
      const updateQuery = `
        UPDATE encounters SET 
          status = $1,
          updated_at = $2,
          end_time = CASE WHEN $3 THEN $2 ELSE end_time END,
          discharge_disposition = COALESCE($4, discharge_disposition)
        WHERE id = $5 
        RETURNING *;
      `;

      const updateResult = await client.query(updateQuery, [
        nextStatus,
        now,
        isTerminal,
        dischargeDisposition,
        encounterId
      ]);

      const updatedEncounter = updateResult.rows[0];

      // 4. Record State Transition Audit Trail
      const auditPayload = {
        action: 'ENCOUNTER_STATE_TRANSITION',
        encounterId,
        fromStatus: currentStatus,
        toStatus: nextStatus,
        reason,
        timestamp: now.toISOString(),
        actorId: actor.userId || 'USR-CLINICIAN-001',
        correlationId
      };
      const signatureHash = crypto.createHash('sha256').update(JSON.stringify(auditPayload)).digest('hex');

      const auditQuery = `
        INSERT INTO universal_audit_logs (
          id, actor_id, actor_name, actor_role, client_ip, action_type,
          resource_type, resource_id, patient_id, before_state, after_state,
          reason_for_action, signature_hash, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14
        );
      `;

      await client.query(auditQuery, [
        crypto.randomUUID(),
        actor.userId || 'USR-CLINICIAN-001',
        actor.username || actor.fullName || 'Tenaga Medis',
        actor.role || 'ROLE_DOCTOR_DPJP',
        clientIp,
        'UPDATE',
        'ENCOUNTER',
        encounterId,
        encounter.patient_id,
        JSON.stringify(encounter),
        JSON.stringify(updatedEncounter),
        reason,
        signatureHash,
        now
      ]);

      await client.query('COMMIT;');

      return {
        ...updatedEncounter,
        previousStatus: currentStatus,
        auditSignature: signatureHash
      };
    } catch (err) {
      await client.query('ROLLBACK;');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Search / List Encounters directly from PostgreSQL
   */
  getEncounters: async (filters = {}) => {
    const pool = postgresPoolService.getPool();
    let sql = `
      SELECT e.*, p.full_name as patient_name, p.mrn, p.nik
      FROM encounters e
      JOIN master_patients p ON e.patient_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (filters.patientId) {
      sql += ` AND e.patient_id = $${idx++}`;
      params.push(filters.patientId);
    }
    if (filters.status) {
      sql += ` AND e.status = $${idx++}`;
      params.push(filters.status);
    }
    if (filters.encounterClass) {
      sql += ` AND e.encounter_class = $${idx++}`;
      params.push(filters.encounterClass);
    }

    sql += ` ORDER BY e.created_at DESC LIMIT $${idx++} OFFSET $${idx++};`;
    params.push(filters.limit || 50, filters.offset || 0);

    const res = await pool.query(sql, params);
    return res.rows;
  },

  /**
   * Get Single Encounter Detail
   */
  getEncounterById: async (id) => {
    const pool = postgresPoolService.getPool();
    const sql = `
      SELECT e.*, p.full_name as patient_name, p.mrn, p.nik, ep.episode_number, ep.episode_type
      FROM encounters e
      JOIN master_patients p ON e.patient_id = p.id
      JOIN episodes_of_care ep ON e.episode_id = ep.id
      WHERE e.id = $1 LIMIT 1;
    `;
    const res = await pool.query(sql, [id]);
    return res.rows[0] || null;
  }
};
