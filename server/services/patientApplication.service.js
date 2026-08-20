/**
 * NurseFlow Enterprise HIS 2026 — Master Patient Application Service
 * Domain Authority: Patient Identity & Master Patient Index (MPI)
 * Standards: Permenkes 24/2022, JCI IPSG 1 (Patient Identification), ACID Transaction Boundaries
 */

import crypto from 'crypto';
import { postgresPoolService } from '../db/postgresPool.js';

export class PatientDomainError extends Error {
  constructor(message, code = 'PATIENT_DOMAIN_ERROR', statusCode = 400, details = []) {
    super(message);
    this.name = 'PatientDomainError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const patientApplicationService = {
  /**
   * Generate Next Server-Side Sequential Medical Record Number (MRN)
   * Pattern: MRN-YYYY-XXXXX (e.g. MRN-2026-00001)
   */
  generateNextMrn: async (client) => {
    const year = new Date().getFullYear();
    const prefix = `MRN-${year}-`;
    
    // Acquire advisory lock or query highest MRN for current year with row-level lock
    const query = `
      SELECT mrn FROM master_patients 
      WHERE mrn LIKE $1 
      ORDER BY mrn DESC 
      LIMIT 1 
      FOR UPDATE;
    `;
    const res = await client.query(query, [`${prefix}%`]);

    let nextSeq = 1;
    if (res.rows.length > 0) {
      const lastMrn = res.rows[0].mrn;
      const parts = lastMrn.split('-');
      if (parts.length === 3) {
        const parsed = parseInt(parts[2], 10);
        if (!isNaN(parsed)) {
          nextSeq = parsed + 1;
        }
      }
    }

    return `${prefix}${nextSeq.toString().padStart(5, '0')}`;
  },

  /**
   * Register New Patient to PostgreSQL with MPI Validation & Immutable Audit Trail
   */
  registerPatient: async ({
    fullName,
    nik,
    birthDate,
    birthPlace = 'Jakarta',
    gender,
    bloodType = 'UNKNOWN',
    maritalStatus = 'SINGLE',
    religion = 'ISLAM',
    education = 'SMA',
    occupation = 'KARYAWAN',
    phoneNumber,
    email = '',
    address = 'Jl. Rawamangun No. 1, Jakarta',
    guarantorType = 'UMUM',
    bpjsCardNumber = null
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    // 1. Invariant Validations
    if (!fullName || !fullName.trim()) {
      throw new PatientDomainError('Nama lengkap pasien wajib diisi.', 'VALIDATION_FAILED', 400, [{ field: 'fullName' }]);
    }
    if (!nik || !/^\d{16}$/.test(nik.trim())) {
      throw new PatientDomainError('NIK wajib 16 digit numerik sesuai KTP.', 'INVALID_NIK_FORMAT', 400, [{ field: 'nik' }]);
    }
    if (!birthDate) {
      throw new PatientDomainError('Tanggal lahir wajib diisi.', 'VALIDATION_FAILED', 400, [{ field: 'birthDate' }]);
    }
    if (!gender || !['MALE', 'FEMALE'].includes(gender)) {
      throw new PatientDomainError("Jenis kelamin wajib 'MALE' atau 'FEMALE'.", 'VALIDATION_FAILED', 400, [{ field: 'gender' }]);
    }
    if (!phoneNumber || !phoneNumber.trim()) {
      throw new PatientDomainError('Nomor telepon pasien wajib diisi.', 'VALIDATION_FAILED', 400, [{ field: 'phoneNumber' }]);
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      // 2. BEGIN ATOMIC TRANSACTION
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      // 3. MPI Duplicate Check (Strict NIK & BPJS Uniqueness)
      const duplicateNikCheck = await client.query(
        'SELECT id, mrn, full_name FROM master_patients WHERE nik = $1 LIMIT 1 FOR UPDATE;',
        [nik.trim()]
      );
      if (duplicateNikCheck.rows.length > 0) {
        const existing = duplicateNikCheck.rows[0];
        throw new PatientDomainError(
          `Pasien dengan NIK ${nik} sudah terdaftar di Master Patient Index dengan MRN: ${existing.mrn} (${existing.full_name}).`,
          'CLINICAL_DUPLICATE_PATIENT_DETECTED',
          409,
          [{ field: 'nik', issue: 'DUPLICATE_MPI_ENTRY', existingMrn: existing.mrn }]
        );
      }

      if (bpjsCardNumber && bpjsCardNumber.trim()) {
        const duplicateBpjsCheck = await client.query(
          'SELECT id, mrn, full_name FROM master_patients WHERE bpjs_card_number = $1 LIMIT 1 FOR UPDATE;',
          [bpjsCardNumber.trim()]
        );
        if (duplicateBpjsCheck.rows.length > 0) {
          const existing = duplicateBpjsCheck.rows[0];
          throw new PatientDomainError(
            `Nomor Kartu BPJS ${bpjsCardNumber} sudah terdaftar pada MRN: ${existing.mrn}.`,
            'DUPLICATE_BPJS_CARD',
            409,
            [{ field: 'bpjsCardNumber', existingMrn: existing.mrn }]
          );
        }
      }

      // 4. Server-Side Sequential MRN & UUID Generation
      const patientId = crypto.randomUUID();
      const mrn = await patientApplicationService.generateNextMrn(client);
      const now = new Date();

      // 5. Insert Patient Record
      const insertQuery = `
        INSERT INTO master_patients (
          id, mrn, nik, full_name, birth_place, birth_date, gender, blood_type,
          marital_status, religion, education, occupation, phone_number, email,
          address_line, guarantor_type, bpjs_card_number, is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20
        ) RETURNING *;
      `;

      const insertValues = [
        patientId,
        mrn,
        nik.trim(),
        fullName.trim(),
        birthPlace.trim(),
        birthDate,
        gender,
        bloodType || 'UNKNOWN',
        maritalStatus || 'SINGLE',
        religion || 'ISLAM',
        education || 'SMA',
        occupation || 'KARYAWAN',
        phoneNumber.trim(),
        email ? email.trim() : null,
        address.trim(),
        guarantorType || 'UMUM',
        bpjsCardNumber ? bpjsCardNumber.trim() : null,
        true,
        now,
        now
      ];

      const patientResult = await client.query(insertQuery, insertValues);
      const createdPatient = patientResult.rows[0];

      // 6. Compute Cryptographic Audit Hash & Insert Universal Audit Log
      const auditPayload = {
        action: 'PATIENT_REGISTER',
        patientId: createdPatient.id,
        mrn: createdPatient.mrn,
        nik: createdPatient.nik,
        fullName: createdPatient.full_name,
        registeredAt: now.toISOString(),
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

      const auditValues = [
        crypto.randomUUID(),
        actor.userId || 'USR-REG-001',
        actor.username || actor.fullName || 'Petugas Pendaftaran Loket',
        actor.role || 'ROLE_REGISTRATION_CLERK',
        clientIp,
        'CREATE',
        'PATIENT',
        createdPatient.id,
        createdPatient.id,
        JSON.stringify(createdPatient),
        'Pendaftaran pasien baru di Loket Admisi / Front Office',
        signatureHash,
        now
      ];

      await client.query(auditQuery, auditValues);

      // 7. COMMIT TRANSACTION
      await client.query('COMMIT;');

      return {
        ...createdPatient,
        auditSignature: signatureHash
      };
    } catch (err) {
      // 8. ATOMIC ROLLBACK ON ANY FAILURE
      await client.query('ROLLBACK;');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Search Patients Directly from PostgreSQL Master Patient Index
   */
  searchPatients: async (query = '', limit = 50, offset = 0) => {
    const pool = postgresPoolService.getPool();
    const cleanQuery = query ? query.trim() : '';

    if (!cleanQuery) {
      const sql = `
        SELECT * FROM master_patients 
        WHERE is_active = true 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2;
      `;
      const res = await pool.query(sql, [limit, offset]);
      return res.rows;
    }

    const sql = `
      SELECT * FROM master_patients 
      WHERE is_active = true AND (
        mrn ILIKE $1 OR 
        nik ILIKE $1 OR 
        full_name ILIKE $1 OR 
        phone_number ILIKE $1 OR 
        bpjs_card_number ILIKE $1
      )
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3;
    `;
    const res = await pool.query(sql, [`%${cleanQuery}%`, limit, offset]);
    return res.rows;
  },

  /**
   * Get Patient Details By ID
   */
  getPatientById: async (id) => {
    const pool = postgresPoolService.getPool();
    const sql = 'SELECT * FROM master_patients WHERE id = $1 LIMIT 1;';
    const res = await pool.query(sql, [id]);
    return res.rows[0] || null;
  }
};
