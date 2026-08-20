/**
 * NurseFlow Enterprise HIS 2026 — Master Bed Management Application Service
 * Domain Authority: Inpatient Bed ADT (Admission, Discharge, Transfer) & Ward Hierarchy
 * Standards: Permenkes 24/2022, JCI IPSG 1, HL7 ADT Bed Mutex Integrity, ACID Transactions
 */

import crypto from 'crypto';
import { postgresPoolService } from '../db/postgresPool.js';

export class BedDomainError extends Error {
  constructor(message, code = 'BED_DOMAIN_ERROR', statusCode = 400, details = []) {
    super(message);
    this.name = 'BedDomainError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const bedManagementApplicationService = {
  /**
   * Assign Patient to Bed (Admission ADT - Mutex Protected)
   */
  assignBed: async ({
    tenantId = '00000000-0000-0000-0000-000000000001',
    bedId,
    patientId,
    encounterId,
    admittingDoctorName = 'dr. Siti Wijaya, Sp.PD-KGEH'
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    if (!bedId || !patientId || !encounterId) {
      throw new BedDomainError('bedId, patientId, dan encounterId wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      // 1. Lock and Verify Target Bed Availability
      const bedRes = await client.query(
        'SELECT * FROM master_beds WHERE id = $1 FOR UPDATE;',
        [bedId]
      );

      if (bedRes.rows.length === 0) {
        throw new BedDomainError(`Tempat tidur dengan ID ${bedId} tidak ditemukan.`, 'BED_NOT_FOUND', 404);
      }

      const bed = bedRes.rows[0];
      if (bed.bed_status !== 'AVAILABLE') {
        throw new BedDomainError(
          `Tempat tidur '${bed.bed_number}' sedang berstatus '${bed.bed_status}' dan tidak dapat ditempati.`,
          'BED_NOT_AVAILABLE',
          409,
          [{ bedId, bedNumber: bed.bed_number, currentStatus: bed.bed_status }]
        );
      }

      // 2. Check if Encounter already has an active occupancy
      const existingOccRes = await client.query(
        'SELECT * FROM bed_occupancies WHERE encounter_id = $1 AND check_out_time IS NULL LIMIT 1 FOR UPDATE;',
        [encounterId]
      );

      if (existingOccRes.rows.length > 0) {
        const existingOcc = existingOccRes.rows[0];
        throw new BedDomainError(
          `Encounter ${encounterId} telah memiliki alokasi bed aktif (${existingOcc.bed_id}). Gunakan perintah transfer bed.`,
          'ENCOUNTER_ALREADY_HAS_ACTIVE_BED',
          409,
          [{ activeBedId: existingOcc.bed_id }]
        );
      }

      const now = new Date();
      const occupancyId = crypto.randomUUID();

      // 3. Update Bed Status to OCCUPIED
      await client.query(
        'UPDATE master_beds SET bed_status = $1, version = version + 1, updated_at = $2 WHERE id = $3;',
        ['OCCUPIED', now, bedId]
      );

      // 4. Insert Bed Occupancy Record
      const insertOccQuery = `
        INSERT INTO bed_occupancies (
          id, tenant_id, bed_id, patient_id, encounter_id,
          check_in_time, occupancy_status, admitting_doctor_name, created_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9
        ) RETURNING *;
      `;

      const occResult = await client.query(insertOccQuery, [
        occupancyId,
        tenantId,
        bedId,
        patientId,
        encounterId,
        now,
        'ACTIVE',
        admittingDoctorName,
        now
      ]);

      const createdOccupancy = occResult.rows[0];

      // 5. Update Encounter bed assignment
      await client.query(
        'UPDATE encounters SET bed_id = $1, bed_number = $2, updated_at = $3 WHERE id = $4;',
        [bedId, bed.bed_number, now, encounterId]
      );

      // 6. Record Audit Trail
      const auditPayload = {
        action: 'BED_ASSIGN',
        occupancyId,
        bedId,
        bedNumber: bed.bed_number,
        patientId,
        encounterId,
        timestamp: now.toISOString(),
        actorId: actor.userId || 'USR-ADM-001',
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
        actor.userId || 'USR-ADM-001',
        actor.username || actor.fullName || 'Petugas Admisi Rawat Inap',
        actor.role || 'ROLE_REGISTRATION_CLERK',
        clientIp,
        'CREATE',
        'BED_OCCUPANCY',
        occupancyId,
        patientId,
        JSON.stringify(createdOccupancy),
        `Penempatan pasien pada tempat tidur ${bed.bed_number}`,
        signatureHash,
        now
      ]);

      await client.query('COMMIT;');

      return {
        ...createdOccupancy,
        bedNumber: bed.bed_number,
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
   * Transfer Patient Between Beds (ADT Transfer)
   */
  transferBed: async ({
    tenantId = '00000000-0000-0000-0000-000000000001',
    encounterId,
    fromBedId,
    toBedId,
    transferReason = 'Perubahan kondisi klinis pasien'
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    if (fromBedId === toBedId) {
      throw new BedDomainError('Tempat tidur asal dan tujuan tidak boleh sama.', 'INVALID_TRANSFER_SAME_BED', 400);
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      // 1. Lock Target Bed & Verify Availability
      const toBedRes = await client.query('SELECT * FROM master_beds WHERE id = $1 FOR UPDATE;', [toBedId]);
      if (toBedRes.rows.length === 0) {
        throw new BedDomainError(`Tempat tidur tujuan ${toBedId} tidak ditemukan.`, 'BED_NOT_FOUND', 404);
      }
      const toBed = toBedRes.rows[0];
      if (toBed.bed_status !== 'AVAILABLE') {
        throw new BedDomainError(`Tempat tidur tujuan '${toBed.bed_number}' sedang tidak tersedia (${toBed.bed_status}).`, 'TARGET_BED_NOT_AVAILABLE', 409);
      }

      // 2. Lock Source Active Occupancy
      const fromOccRes = await client.query(
        'SELECT * FROM bed_occupancies WHERE encounter_id = $1 AND bed_id = $2 AND check_out_time IS NULL FOR UPDATE;',
        [encounterId, fromBedId]
      );
      if (fromOccRes.rows.length === 0) {
        throw new BedDomainError(`Alokasi aktif pada bed asal tidak ditemukan untuk encounter ${encounterId}.`, 'OCCUPANCY_NOT_FOUND', 404);
      }
      const fromOcc = fromOccRes.rows[0];

      const now = new Date();

      // 3. Check out from source bed & set source bed to CLEANING
      await client.query(
        'UPDATE bed_occupancies SET check_out_time = $1, occupancy_status = $2 WHERE id = $3;',
        [now, 'TRANSFERRED', fromOcc.id]
      );
      await client.query(
        'UPDATE master_beds SET bed_status = $1, version = version + 1, updated_at = $2 WHERE id = $3;',
        ['CLEANING', now, fromBedId]
      );

      // 4. Set target bed to OCCUPIED and insert new occupancy
      await client.query(
        'UPDATE master_beds SET bed_status = $1, version = version + 1, updated_at = $2 WHERE id = $3;',
        ['OCCUPIED', now, toBedId]
      );

      const newOccId = crypto.randomUUID();
      const insertNewOccQuery = `
        INSERT INTO bed_occupancies (
          id, tenant_id, bed_id, patient_id, encounter_id,
          check_in_time, occupancy_status, admitting_doctor_name, created_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9
        ) RETURNING *;
      `;
      const newOccResult = await client.query(insertNewOccQuery, [
        newOccId,
        tenantId,
        toBedId,
        fromOcc.patient_id,
        encounterId,
        now,
        'ACTIVE',
        fromOcc.admitting_doctor_name,
        now
      ]);

      // 5. Insert Bed Transfer Immutable Log
      const transferId = crypto.randomUUID();
      const insertTransferQuery = `
        INSERT INTO bed_transfers (
          id, tenant_id, encounter_id, from_bed_id, to_bed_id,
          transfer_reason, transferred_by, transferred_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        ) RETURNING *;
      `;
      await client.query(insertTransferQuery, [
        transferId,
        tenantId,
        encounterId,
        fromBedId,
        toBedId,
        transferReason,
        actor.username || actor.fullName || 'Perawat Bangsal',
        now
      ]);

      // 6. Update Encounter bed reference
      await client.query(
        'UPDATE encounters SET bed_id = $1, bed_number = $2, updated_at = $3 WHERE id = $4;',
        [toBedId, toBed.bed_number, now, encounterId]
      );

      // 7. Audit Log
      const auditPayload = {
        action: 'BED_TRANSFER',
        transferId,
        encounterId,
        fromBedId,
        toBedId,
        toBedNumber: toBed.bed_number,
        timestamp: now.toISOString(),
        actorId: actor.userId || 'USR-NURSE-001',
        correlationId
      };
      const signatureHash = crypto.createHash('sha256').update(JSON.stringify(auditPayload)).digest('hex');

      await client.query(`
        INSERT INTO universal_audit_logs (
          id, actor_id, actor_name, actor_role, client_ip, action_type,
          resource_type, resource_id, patient_id, reason_for_action, signature_hash, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12
        );
      `, [
        crypto.randomUUID(),
        actor.userId || 'USR-NURSE-001',
        actor.username || actor.fullName || 'Perawat Bangsal',
        actor.role || 'ROLE_NURSE',
        clientIp,
        'UPDATE',
        'BED_TRANSFER',
        transferId,
        fromOcc.patient_id,
        transferReason,
        signatureHash,
        now
      ]);

      await client.query('COMMIT;');

      return {
        ...newOccResult.rows[0],
        transferredFromBedId: fromBedId,
        transferredToBedNumber: toBed.bed_number,
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
   * Discharge Patient from Bed
   */
  dischargeBed: async ({
    tenantId = '00000000-0000-0000-0000-000000000001',
    encounterId,
    bedId,
    dischargeType = 'PULANG_SELESAI_BEROBAT'
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const occRes = await client.query(
        'SELECT * FROM bed_occupancies WHERE encounter_id = $1 AND bed_id = $2 AND check_out_time IS NULL FOR UPDATE;',
        [encounterId, bedId]
      );
      if (occRes.rows.length === 0) {
        throw new BedDomainError(`Alokasi bed aktif tidak ditemukan.`, 'OCCUPANCY_NOT_FOUND', 404);
      }
      const occ = occRes.rows[0];
      const now = new Date();

      await client.query(
        'UPDATE bed_occupancies SET check_out_time = $1, occupancy_status = $2, discharge_type = $3 WHERE id = $4;',
        [now, 'DISCHARGED', dischargeType, occ.id]
      );

      await client.query(
        'UPDATE master_beds SET bed_status = $1, version = version + 1, updated_at = $2 WHERE id = $3;',
        ['CLEANING', now, bedId]
      );

      await client.query('COMMIT;');
      return { success: true, occupancyId: occ.id, bedId, dischargedAt: now.toISOString() };
    } catch (err) {
      await client.query('ROLLBACK;');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * List Beds with Real Occupancy Status
   */
  getBeds: async (filters = {}) => {
    const pool = postgresPoolService.getPool();
    let sql = `
      SELECT b.*, r.room_number, w.ward_name, w.ward_class,
             occ.patient_id, p.full_name as patient_name, p.mrn, occ.check_in_time
      FROM master_beds b
      JOIN master_rooms r ON b.room_id = r.id
      JOIN master_wards w ON r.ward_id = w.id
      LEFT JOIN bed_occupancies occ ON b.id = occ.bed_id AND occ.check_out_time IS NULL
      LEFT JOIN master_patients p ON occ.patient_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (filters.wardId) {
      sql += ` AND w.id = $${idx++}`;
      params.push(filters.wardId);
    }
    if (filters.status) {
      sql += ` AND b.bed_status = $${idx++}`;
      params.push(filters.status);
    }

    sql += ` ORDER BY w.ward_name ASC, r.room_number ASC, b.bed_number ASC;`;
    const res = await pool.query(sql, params);
    return res.rows;
  }
};
