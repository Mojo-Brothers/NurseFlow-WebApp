/**
 * NurseFlow Enterprise HIS 2026 — Master Clinical Notes Application Service
 * Domain Authority: Structured Physician SOAP & Multidisciplinary CPPT Documentation
 * Standards: Permenkes 24/2022, JCI 7th Edition (Integrated Care), SATUSEHAT HL7 FHIR Composition,
 * Medicolegal Immutability & Amendment Provenance, ACID Transactions
 */

import crypto from 'crypto';
import { postgresPoolService } from '../db/postgresPool.js';

export class ClinicalNotesDomainError extends Error {
  constructor(message, code = 'CLINICAL_NOTES_DOMAIN_ERROR', statusCode = 400, details = []) {
    super(message);
    this.name = 'ClinicalNotesDomainError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

const AUTHORIZED_SOAP_ROLES = [
  'ROLE_SUPER_ADMIN',
  'ROLE_DOCTOR_DPJP',
  'ROLE_DOCTOR_EMERGENCY'
];

const AUTHORIZED_CPPT_ROLES = [
  'ROLE_SUPER_ADMIN',
  'ROLE_DOCTOR_DPJP',
  'ROLE_DOCTOR_EMERGENCY',
  'ROLE_NURSE',
  'ROLE_PHARMACIST'
];

export const clinicalNotesApplicationService = {
  /**
   * Record Signed/Final Doctor SOAP Note (ACID Transaction)
   */
  recordSoapNote: async ({
    encounterId,
    patientId = null,
    episodeId = null,
    subjective,
    objective,
    assessment,
    plan,
    primaryIcd10 = 'Z00.0',
    primaryIcd10Name = 'General medical examination',
    secondaryDiagnoses = [],
    proceduresIcd9 = []
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    // 1. Author Identity & Role Enforcement from Authenticated Principal (JWT)
    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!AUTHORIZED_SOAP_ROLES.includes(authorRole)) {
      throw new ClinicalNotesDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki izin mencatat SOAP Medis DPJP.`,
        'FORBIDDEN_CLINICAL_ROLE',
        403,
        [{ role: authorRole, required: AUTHORIZED_SOAP_ROLES }]
      );
    }

    const physicianId = actor.userId || 'DOC-SYSTEM-001';
    const physicianName = actor.username || actor.fullName || 'Dokter Pemeriksa';

    // 2. Validate Invariants
    if (!encounterId) {
      throw new ClinicalNotesDomainError('Encounter ID wajib disertakan.', 'VALIDATION_FAILED', 400, [{ field: 'encounterId' }]);
    }
    if (!subjective || !objective || !assessment || !plan) {
      throw new ClinicalNotesDomainError(
        'Dokumentasi SOAP wajib lengkap: Subjective, Objective, Assessment, dan Plan tidak boleh kosong.',
        'INCOMPLETE_SOAP_DOCUMENTATION',
        400
      );
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      // 3. Lock & Verify Encounter Scope
      const encRes = await client.query('SELECT * FROM encounters WHERE id = $1 FOR UPDATE;', [encounterId]);
      if (encRes.rows.length === 0) {
        throw new ClinicalNotesDomainError(`Encounter dengan ID ${encounterId} tidak ditemukan.`, 'ENCOUNTER_NOT_FOUND', 404);
      }
      const encounter = encRes.rows[0];
      const targetPatientId = patientId || encounter.patient_id;
      const targetEpisodeId = episodeId || encounter.episode_id;

      // 4. Server-Authoritative Clock & Unique ID
      const serverTimestamp = new Date();
      const soapId = crypto.randomUUID();
      const targetTenantId = encounter.tenant_id || actor.tenantId || '00000000-0000-0000-0000-000000000001';

      // 5. Insert Record into soap_notes
      const insertSql = `
        INSERT INTO soap_notes (
          id, tenant_id, episode_id, encounter_id, patient_id,
          subjective, objective, assessment, plan,
          primary_icd10, primary_icd10_name, secondary_diagnoses, procedures_icd9,
          physician_id, physician_name, is_signed,
          signature_timestamp, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12, $13,
          $14, $15, $16,
          $17, $18, $19
        ) RETURNING *;
      `;

      const insertRes = await client.query(insertSql, [
        soapId,
        targetTenantId,
        targetEpisodeId,
        encounterId,
        targetPatientId,
        subjective,
        objective,
        assessment,
        plan,
        primaryIcd10,
        primaryIcd10Name,
        JSON.stringify(secondaryDiagnoses),
        JSON.stringify(proceduresIcd9),
        physicianId,
        physicianName,
        true,
        serverTimestamp,
        serverTimestamp,
        serverTimestamp
      ]);

      const createdSoap = insertRes.rows[0];

      // 6. Compute Cryptographic SHA-256 Audit Signature
      const auditPayload = {
        action: 'SOAP_NOTE_SIGNED',
        soapId,
        encounterId,
        patientId: targetPatientId,
        physicianId,
        primaryIcd10,
        serverTimestamp: serverTimestamp.toISOString(),
        correlationId
      };
      const signatureHash = crypto.createHash('sha256').update(JSON.stringify(auditPayload)).digest('hex');

      await client.query(`
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
        physicianId,
        physicianName,
        authorRole,
        clientIp,
        'CREATE',
        'SOAP_NOTE',
        soapId,
        targetPatientId,
        JSON.stringify(createdSoap),
        `Dokumentasi medis SOAP oleh ${physicianName}`,
        signatureHash,
        serverTimestamp
      ]);

      await client.query('COMMIT;');

      return {
        ...createdSoap,
        auditSignature: signatureHash,
        serverRecordedAt: serverTimestamp.toISOString()
      };
    } catch (err) {
      await client.query('ROLLBACK;');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Amend Signed SOAP Note (Creates New Version, Preserving Original Record)
   */
  amendSoapNote: async ({
    originalSoapId,
    amendmentReason = 'Revisi klinis pasca-diskusi DPJP',
    subjective,
    objective,
    assessment,
    plan,
    primaryIcd10,
    primaryIcd10Name
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!AUTHORIZED_SOAP_ROLES.includes(authorRole)) {
      throw new ClinicalNotesDomainError('Wewenang ditolak: Tidak memiliki izin melakukan amandemen SOAP.', 'FORBIDDEN', 403);
    }
    if (!originalSoapId) {
      throw new ClinicalNotesDomainError('originalSoapId wajib disertakan untuk amandemen.', 'VALIDATION_FAILED', 400);
    }
    if (!amendmentReason || amendmentReason.trim().length === 0) {
      throw new ClinicalNotesDomainError('Alasan amandemen (amendmentReason) wajib diisi untuk rekam jejak medikolegal.', 'AMENDMENT_REASON_REQUIRED', 400);
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      // 1. Fetch & Lock Original SOAP Record
      const origRes = await client.query('SELECT * FROM soap_notes WHERE id = $1 FOR UPDATE;', [originalSoapId]);
      if (origRes.rows.length === 0) {
        throw new ClinicalNotesDomainError(`Dokumen SOAP asli dengan ID ${originalSoapId} tidak ditemukan.`, 'SOAP_NOT_FOUND', 404);
      }
      const original = origRes.rows[0];

      // 2. Create Amended Note Version
      const serverTimestamp = new Date();
      const amendedId = crypto.randomUUID();
      const physicianId = actor.userId || original.physician_id;
      const physicianName = actor.username || actor.fullName || original.physician_name;
      const targetTenantId = original.tenant_id || actor.tenantId || '00000000-0000-0000-0000-000000000001';

      const insertSql = `
        INSERT INTO soap_notes (
          id, tenant_id, episode_id, encounter_id, patient_id,
          subjective, objective, assessment, plan,
          primary_icd10, primary_icd10_name, secondary_diagnoses, procedures_icd9,
          physician_id, physician_name, is_signed,
          signature_timestamp, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12, $13,
          $14, $15, $16,
          $17, $18, $19
        ) RETURNING *;
      `;

      const insertRes = await client.query(insertSql, [
        amendedId,
        targetTenantId,
        original.episode_id,
        original.encounter_id,
        original.patient_id,
        subjective || original.subjective,
        objective || original.objective,
        assessment || original.assessment,
        plan || original.plan,
        primaryIcd10 || original.primary_icd10,
        primaryIcd10Name || original.primary_icd10_name,
        JSON.stringify(original.secondary_diagnoses || []),
        JSON.stringify(original.procedures_icd9 || []),
        physicianId,
        physicianName,
        true,
        serverTimestamp,
        serverTimestamp,
        serverTimestamp
      ]);

      const amendedSoap = insertRes.rows[0];

      // 3. Record Audit Trail with Parent Provenance
      const auditPayload = {
        action: 'SOAP_NOTE_AMENDED',
        amendedId,
        originalSoapId,
        amendmentReason,
        physicianId,
        serverTimestamp: serverTimestamp.toISOString(),
        correlationId
      };
      const signatureHash = crypto.createHash('sha256').update(JSON.stringify(auditPayload)).digest('hex');

      await client.query(`
        INSERT INTO universal_audit_logs (
          id, actor_id, actor_name, actor_role, client_ip, action_type,
          resource_type, resource_id, patient_id, before_state, after_state,
          reason_for_action, signature_hash, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14
        );
      `, [
        crypto.randomUUID(),
        physicianId,
        physicianName,
        authorRole,
        clientIp,
        'AMEND',
        'SOAP_NOTE',
        amendedId,
        original.patient_id,
        JSON.stringify(original),
        JSON.stringify(amendedSoap),
        amendmentReason,
        signatureHash,
        serverTimestamp
      ]);

      await client.query('COMMIT;');

      return {
        ...amendedSoap,
        originalSoapId,
        amendmentReason,
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
   * Record Multidisciplinary CPPT Entry (ACID Transaction)
   */
  recordCpptEntry: async ({
    encounterId,
    patientId = null,
    episodeId = null,
    professionalType = 'PERAWAT',
    sbarSituation = '',
    sbarBackground = '',
    sbarAssessment = '',
    sbarRecommendation = '',
    soapNotes = '',
    instructionNotes = ''
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!AUTHORIZED_CPPT_ROLES.includes(authorRole)) {
      throw new ClinicalNotesDomainError(`Wewenang ditolak: Peran [${authorRole}] tidak berwenang mencatat CPPT.`, 'FORBIDDEN', 403);
    }
    if (!encounterId) {
      throw new ClinicalNotesDomainError('Encounter ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const encRes = await client.query('SELECT * FROM encounters WHERE id = $1 FOR UPDATE;', [encounterId]);
      if (encRes.rows.length === 0) {
        throw new ClinicalNotesDomainError(`Encounter ${encounterId} tidak ditemukan.`, 'ENCOUNTER_NOT_FOUND', 404);
      }
      const encounter = encRes.rows[0];

      const serverTimestamp = new Date();
      const cpptId = crypto.randomUUID();
      const authorId = actor.userId || 'USR-PPA-001';
      const authorName = actor.username || actor.fullName || 'Tenaga Kesehatan (PPA)';
      const isDoctor = ['ROLE_DOCTOR_DPJP', 'ROLE_DOCTOR_EMERGENCY'].includes(authorRole);

      const targetTenantId = encounter.tenant_id || actor.tenantId || '00000000-0000-0000-0000-000000000001';

      const insertSql = `
        INSERT INTO cppt_notes (
          id, tenant_id, episode_id, encounter_id, patient_id,
          professional_type, author_id, author_name,
          sbar_situation, sbar_background, sbar_assessment, sbar_recommendation,
          soap_notes, instruction_notes, dpjp_verified,
          dpjp_verifier_name, dpjp_verified_at, created_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15,
          $16, $17, $18
        ) RETURNING *;
      `;

      const insertRes = await client.query(insertSql, [
        cpptId,
        targetTenantId,
        episodeId || encounter.episode_id,
        encounterId,
        patientId || encounter.patient_id,
        professionalType,
        authorId,
        authorName,
        sbarSituation,
        sbarBackground,
        sbarAssessment,
        sbarRecommendation,
        soapNotes,
        instructionNotes,
        isDoctor, // Doctor entries are verified immediately
        isDoctor ? authorName : null,
        isDoctor ? serverTimestamp : null,
        serverTimestamp
      ]);

      const createdCppt = insertRes.rows[0];

      // Audit Log
      const auditPayload = {
        action: 'CPPT_ENTRY_RECORDED',
        cpptId,
        encounterId,
        authorId,
        professionalType,
        serverTimestamp: serverTimestamp.toISOString(),
        correlationId
      };
      const signatureHash = crypto.createHash('sha256').update(JSON.stringify(auditPayload)).digest('hex');

      await client.query(`
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
        authorId,
        authorName,
        authorRole,
        clientIp,
        'CREATE',
        'CPPT_NOTE',
        cpptId,
        encounter.patient_id,
        JSON.stringify(createdCppt),
        `Catatan perkembangan terintegrasi (${professionalType})`,
        signatureHash,
        serverTimestamp
      ]);

      await client.query('COMMIT;');

      return {
        ...createdCppt,
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
   * DPJP Verifies CPPT Entry of Non-Physician PPA
   */
  verifyCpptEntry: async ({ cpptId }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!['ROLE_DOCTOR_DPJP', 'ROLE_SUPER_ADMIN'].includes(authorRole)) {
      throw new ClinicalNotesDomainError('Hanya Dokter DPJP yang berwenang memverifikasi CPPT terintegrasi.', 'FORBIDDEN', 403);
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const cpptRes = await client.query('SELECT * FROM cppt_notes WHERE id = $1 FOR UPDATE;', [cpptId]);
      if (cpptRes.rows.length === 0) {
        throw new ClinicalNotesDomainError(`CPPT ${cpptId} tidak ditemukan.`, 'CPPT_NOT_FOUND', 404);
      }
      const cppt = cpptRes.rows[0];
      const now = new Date();
      const dpjpName = actor.username || actor.fullName || 'dr. DPJP';

      const updateSql = `
        UPDATE cppt_notes SET
          dpjp_verified = TRUE,
          dpjp_verifier_name = $1,
          dpjp_verified_at = $2
        WHERE id = $3
        RETURNING *;
      `;

      const updateRes = await client.query(updateSql, [dpjpName, now, cpptId]);
      await client.query('COMMIT;');

      return updateRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK;');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Get SOAP Notes by Encounter
   */
  getSoapNotesByEncounter: async (encounterId) => {
    const pool = postgresPoolService.getPool();
    const sql = `
      SELECT s.*, p.full_name as patient_name, p.mrn
      FROM soap_notes s
      JOIN master_patients p ON s.patient_id = p.id
      WHERE s.encounter_id = $1
      ORDER BY s.created_at DESC;
    `;
    const res = await pool.query(sql, [encounterId]);
    return res.rows;
  },

  /**
   * Get CPPT Notes by Encounter
   */
  getCpptNotesByEncounter: async (encounterId) => {
    const pool = postgresPoolService.getPool();
    const sql = `
      SELECT c.*, p.full_name as patient_name, p.mrn
      FROM cppt_notes c
      JOIN master_patients p ON c.patient_id = p.id
      WHERE c.encounter_id = $1
      ORDER BY c.created_at DESC;
    `;
    const res = await pool.query(sql, [encounterId]);
    return res.rows;
  }
};
