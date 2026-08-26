/**
 * NurseFlow Enterprise HIS 2026 — Admission, Discharge, Transfer (ADT) & Bed Management Engine
 * Standar: JCI International Patient Safety Goals (IPSG) & HL7 ADT Message Specifications (A01, A02, A03)
 * Authoritative: PostgreSQL 16 ACID Persistence Layer
 */

import { postgresPoolService } from '../db/postgresPool.js';

export const ADT_EVENT_TYPES = {
  ADMIT: 'A01_ADMIT_PATIENT',
  TRANSFER: 'A02_TRANSFER_PATIENT',
  DISCHARGE: 'A03_DISCHARGE_PATIENT',
  CANCEL_ADMIT: 'A11_CANCEL_ADMISSION'
};

class AdtEngineService {
  /**
   * 1. ADMIT PATIENT (HL7 A01) — PostgreSQL Authoritative
   */
  async admitPatient({ encounterId, patientId, patientName, targetBedId, admittingDoctorName, wardName = 'Ruang Inap Melati 3A' }) {
    const pool = postgresPoolService.getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const bedRes = await client.query('SELECT * FROM master_beds WHERE id = $1 FOR UPDATE;', [targetBedId]);
      if (bedRes.rows.length === 0) {
        throw new Error(`Bed ${targetBedId} tidak ditemukan di database master.`);
      }

      const bed = bedRes.rows[0];
      if (bed.bed_status !== 'AVAILABLE') {
        throw new Error(`Bed ${targetBedId} tidak dapat digunakan. Status saat ini: ${bed.bed_status}`);
      }

      await client.query(`
        UPDATE master_beds
        SET bed_status = 'OCCUPIED', updated_at = NOW()
        WHERE id = $1;
      `, [targetBedId]);

      await client.query(`
        INSERT INTO bed_occupancies (
          id, tenant_id, bed_id, patient_id, encounter_id, check_in_time, occupancy_status, admitting_doctor_name, created_at
        ) VALUES (
          uuid_generate_v4(), '00000000-0000-0000-0000-000000000001', $1, $2, $3, NOW(), 'ACTIVE', $4, NOW()
        );
      `, [targetBedId, patientId, encounterId, admittingDoctorName || 'ADM-OFFICER']);

      await client.query('COMMIT;');

      return {
        success: true,
        event: ADT_EVENT_TYPES.ADMIT,
        occupancy: {
          bedId: targetBedId,
          encounterId,
          patientId,
          patientName,
          wardName,
          status: 'OCCUPIED'
        },
        message: `Pasien ${patientName} berhasil di-ADMIT ke Bed ${targetBedId} (${wardName}) di PostgreSQL.`
      };
    } catch (err) {
      await client.query('ROLLBACK;');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * 2. TRANSFER PATIENT (HL7 A02) — PostgreSQL Authoritative
   */
  async transferPatient({ encounterId, fromBedId, toBedId, targetWardName = 'Ruang Inap ICU', transferReason, transferredBy }) {
    const pool = postgresPoolService.getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      // Release From Bed
      await client.query(`
        UPDATE master_beds
        SET bed_status = 'CLEANING', updated_at = NOW()
        WHERE id = $1;
      `, [fromBedId]);

      await client.query(`
        UPDATE bed_occupancies
        SET occupancy_status = 'TRANSFERRED', check_out_time = NOW()
        WHERE bed_id = $1 AND encounter_id = $2 AND occupancy_status = 'ACTIVE';
      `, [fromBedId, encounterId]);

      // Lock & Occupy Target Bed
      const targetBedRes = await client.query('SELECT * FROM master_beds WHERE id = $1 FOR UPDATE;', [toBedId]);
      if (targetBedRes.rows.length === 0 || targetBedRes.rows[0].bed_status !== 'AVAILABLE') {
        throw new Error(`Bed tujuan ${toBedId} sedang tidak tersedia.`);
      }

      await client.query(`
        UPDATE master_beds
        SET bed_status = 'OCCUPIED', updated_at = NOW()
        WHERE id = $1;
      `, [toBedId]);

      await client.query(`
        INSERT INTO bed_occupancies (
          id, tenant_id, bed_id, encounter_id, check_in_time, occupancy_status, admitting_doctor_name, created_at
        ) VALUES (
          uuid_generate_v4(), '00000000-0000-0000-0000-000000000001', $1, $2, NOW(), 'ACTIVE', $3, NOW()
        );
      `, [toBedId, encounterId, transferredBy || 'NURSE-OFFICER']);

      await client.query('COMMIT;');

      return {
        success: true,
        event: ADT_EVENT_TYPES.TRANSFER,
        fromBedId,
        toBedId,
        targetWardName,
        message: `Pasien berhasil di-TRANSFER dari ${fromBedId} ke ${toBedId} di PostgreSQL.`
      };
    } catch (err) {
      await client.query('ROLLBACK;');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * 3. DISCHARGE PATIENT (HL7 A03) — PostgreSQL Authoritative
   */
  async dischargePatient({ encounterId, dischargeType = 'PULANG_SEMBUH', dischargeDoctorName }) {
    const pool = postgresPoolService.getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const occRes = await client.query(
        'SELECT bed_id FROM bed_occupancies WHERE encounter_id = $1 AND occupancy_status = \'ACTIVE\';',
        [encounterId]
      );

      if (occRes.rows.length > 0) {
        const bedId = occRes.rows[0].bed_id;
        await client.query(`
          UPDATE master_beds
          SET bed_status = 'CLEANING', updated_at = NOW()
          WHERE id = $1;
        `, [bedId]);

        await client.query(`
          UPDATE bed_occupancies
          SET occupancy_status = 'DISCHARGED', check_out_time = NOW(), discharge_type = $1
          WHERE encounter_id = $2 AND occupancy_status = 'ACTIVE';
        `, [dischargeType, encounterId]);
      }


      await client.query('COMMIT;');

      return {
        success: true,
        event: ADT_EVENT_TYPES.DISCHARGE,
        encounterId,
        dischargeType,
        message: `Pasien berhasil di-DISCHARGE di PostgreSQL.`
      };
    } catch (err) {
      await client.query('ROLLBACK;');
      throw err;
    } finally {
      client.release();
    }
  }

  async getBedStatus(bedId) {
    const pool = postgresPoolService.getPool();
    const res = await pool.query('SELECT bed_status FROM master_beds WHERE id = $1;', [bedId]);
    return res.rows.length > 0 ? { status: res.rows[0].bed_status } : { status: 'AVAILABLE' };
  }
}

export const adtEngineService = new AdtEngineService();

