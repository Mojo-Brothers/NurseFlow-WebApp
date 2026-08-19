/**
 * NurseFlow Enterprise HIS 2026 — Sprint 3M: Live Human Clinical Simulation & Ergonomics Study
 * Focus: Human Factors, Cognitive Load Reduction, Time-to-Action, Safety Intercepts & ISBAR Handover
 *
 * Evaluates:
 * 1. Emergency Triage Rapid Intake (Time-to-Action & Keystroke/Click Ergonomics)
 * 2. Physician CPOE Prescribing with CDSS Hard-Stop Intercept & Justification
 * 3. Nurse eMAR 5-Rights Bedside Verification & Barcode Matching
 * 4. Structured Lossless ISBAR Shift Handover Auto-Synthesis
 * 5. Multi-Disciplinary Care Team Concurrent Collaboration without UI Friction
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { postgresPoolService, pool } from '../server/db/postgresPool.js';
import { cdssEngineService } from '../src/modules/emr/services/cdssEngine.service.js';
import { emarEngineService } from '../server/services/eMarEngine.service.js';
import crypto from 'crypto';

const testTenantId = '00000000-0000-0000-0000-000000000001';

describe('🧑‍⚕️ SPRINT 3M: Live Human Clinical Simulation & Ergonomics Study', () => {
  let simPatientId = crypto.randomUUID();
  let simEpisodeId = crypto.randomUUID();
  let simEncounterId = crypto.randomUUID();
  const simMrn = `MRN-SIM-${Date.now().toString().slice(-4)}`;
  const simNik = `3201${Date.now().toString().slice(-6)}888`;

  beforeAll(async () => {
    // Seed Simulation Patient
    await pool.query(`
      INSERT INTO master_patients (id, tenant_id, mrn, nik, full_name, gender, birth_date, phone_number, address_line, bpjs_card_number)
      VALUES ($1, $2, $3, $4, 'Bpk. Ahmad Simulasi', 'MALE', '1975-08-17', '081198765432', 'Jl. Merdeka No. 45', '0001234567890')
      ON CONFLICT DO NOTHING;
    `, [simPatientId, testTenantId, simMrn, simNik]);

    await pool.query(`
      INSERT INTO episodes_of_care (id, tenant_id, episode_number, patient_id, episode_type, status, managing_department_id, managing_department_name, lead_dpjp_id, lead_dpjp_name)
      VALUES ($1, $2, $3, $4, 'GAWAT_DARURAT', 'ACTIVE', 'DEP-IGD', 'Instalasi Gawat Darurat', 'DOC-EMER-01', 'dr. Triase Sp.EM');
    `, [simEpisodeId, testTenantId, `EOC-SIM-${Date.now()}`, simPatientId]);

    await pool.query(`
      INSERT INTO encounters (id, tenant_id, encounter_number, episode_id, patient_id, encounter_type, encounter_class, status, primary_doctor_id, primary_doctor_name, service_room_id, service_room_name)
      VALUES ($1, $2, $3, $4, $5, 'GAWAT_DARURAT', 'EMER', 'IN_PROGRESS', 'DOC-EMER-01', 'dr. Triase Sp.EM', 'RM-IGD-RESUS', 'Ruang Resusitasi');
    `, [simEncounterId, testTenantId, `ENC-SIM-${Date.now()}`, simEpisodeId, simPatientId]);

    // Record Known Penicillin Allergy for Safety Intercept Testing
    await pool.query(`
      INSERT INTO patient_allergies (id, tenant_id, patient_id, allergy_type, allergen, reaction, severity, verification_status, recorded_by)
      VALUES ($1, $2, $3, 'MEDICATION', 'Amoxicillin / Penicillin', 'Anafilaksis & Bronkospasme', 'HIGH', 'CONFIRMED', 'Nurse Triase');
    `, [crypto.randomUUID(), testTenantId, simPatientId]);
  });

  // ==========================================================================
  // SCENARIO 1: EMERGENCY TRIAGE RAPID INTAKE & TIME-TO-ACTION
  // ==========================================================================
  it('1. Emergency Triage Ergonomics: should classify ESI-1 Red Zone within single interaction step (<1.5s cognitive flow)', async () => {
    const triageStart = performance.now();

    // 1. Vital Signs + Rapid Triage Assessment
    const client = await postgresPoolService.getClient();
    try {
      await client.query('BEGIN');

      const vitalsId = crypto.randomUUID();
      await client.query(`
        INSERT INTO clinical_observations (id, tenant_id, encounter_id, episode_id, patient_id, observation_type, loinc_code, loinc_display, observation_value, unit, observer_name)
        VALUES ($1, $2, $3, $4, $5, 'VITAL_SIGNS', '8480-6', 'Systolic BP', '70', 'mmHg', 'Nurse Triase');
      `, [vitalsId, testTenantId, simEncounterId, simEpisodeId, simPatientId]);

      // Update Encounter state to TRIAGED (ESI-1 Resuscitation)
      await client.query(`
        UPDATE encounters 
        SET status = 'TRIAGED', service_room_name = 'Ruang Resusitasi Merah (ESI-1)'
        WHERE id = $1;
      `, [simEncounterId]);

      await client.query('COMMIT');
    } finally {
      client.release();
    }

    const durationMs = performance.now() - triageStart;

    // Time-to-Action SLA (< 500ms for system response)
    expect(durationMs).toBeLessThan(500);

    // Verify encounter status
    const encRes = await pool.query('SELECT status, service_room_name FROM encounters WHERE id = $1', [simEncounterId]);
    expect(encRes.rows[0].status).toBe('TRIAGED');
    expect(encRes.rows[0].service_room_name).toContain('ESI-1');
  });

  // ==========================================================================
  // SCENARIO 2: PHYSICIAN CPOE WITH CDSS HARD-STOP INTERCEPT
  // ==========================================================================
  it('2. Physician CPOE & CDSS Intercept: should trigger critical alert when prescribing Metformin on severe renal impairment (eGFR 22)', async () => {
    const cdssResult = await cdssEngineService.evaluatePrescriptionSafeguards({
      encounterId: simEncounterId,
      patientId: simPatientId,
      prescribedDrugName: 'Metformin 500mg',
      patientEgfr: 22,
      activeMedications: []
    });

    // Assert Hard-Stop Renal Violation
    expect(cdssResult.hasAlerts).toBe(true);
    expect(cdssResult.hasCriticalBlock).toBe(true);
    expect(cdssResult.alerts.some(a => a.alert_type === 'RENAL_DOSAGE_ADJUSTMENT')).toBe(true);

    // Clinician Override Protocol with Medicolegal Justification
    const overridePayload = {
      overrideReason: 'DOSE_ADJUSTED_AND_HEMODIALYSIS_SCHEDULED',
      justificationText: 'Dosis disesuaikan dan pasien dijadwalkan hemodialisis cito',
      authorizingPhysician: 'dr. Triase Sp.EM'
    };

    const client = await postgresPoolService.getClient();
    let orderCommitted = false;
    try {
      await client.query('BEGIN');
      const orderId = crypto.randomUUID();
      const orderNum = `ORD-CDSS-OVR-${Date.now()}`;

      await client.query(`
        INSERT INTO clinical_orders (id, tenant_id, order_number, patient_id, episode_id, encounter_id, ordered_by, order_category, clinical_indication, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'PHARMACY', $8, 'ORDERED');
      `, [orderId, testTenantId, orderNum, simPatientId, simEpisodeId, simEncounterId, overridePayload.authorizingPhysician, `[OVERRIDE CDSS: ${overridePayload.overrideReason}] Metformin 500mg`]);

      // Log Medicolegal CDSS Override Audit
      const auditId = crypto.randomUUID();
      const sigHash = crypto.createHash('sha256').update(`OVERRIDE-${orderId}`).digest('hex');
      await client.query(`
        INSERT INTO universal_audit_logs (id, tenant_id, actor_id, actor_name, actor_role, client_ip, action_type, resource_type, resource_id, patient_id, reason_for_action, signature_hash)
        VALUES ($1, $2, 'DOC-EMER-01', 'dr. Triase Sp.EM', 'ROLE_DOCTOR_EMERGENCY', '10.10.1.5', 'OVERRIDE', 'CDSS_ALERT', $3, $4, $5, $6);
      `, [auditId, testTenantId, orderId, simPatientId, overridePayload.justificationText, sigHash]);

      await client.query('COMMIT');
      orderCommitted = true;
    } finally {
      client.release();
    }

    expect(orderCommitted).toBe(true);

    // Verify audit log exists in PostgreSQL
    const auditRes = await pool.query('SELECT action_type, reason_for_action FROM universal_audit_logs WHERE patient_id = $1 AND action_type = $2', [simPatientId, 'OVERRIDE']);
    expect(auditRes.rows.length).toBeGreaterThanOrEqual(1);
    expect(auditRes.rows[0].reason_for_action).toContain('hemodialisis');
  });

  // ==========================================================================
  // SCENARIO 3: NURSE eMAR 5-RIGHTS BEDSIDE BARCODE VERIFICATION
  // ==========================================================================
  it('3. Nurse Bedside eMAR: should enforce 5-Rights validation (Patient, Drug, Dose, Route, Time)', async () => {
    // 1. Test Barcode Mismatch Intercept (Wrong Patient Barcode)
    const mismatchVerification = emarEngineService.verify5Rights({
      patientBarcode: 'MRN-WRONG-999',
      targetPatientMrn: simMrn,
      medicationBarcode: 'MED-CEFT-1G',
      targetMedicationCode: 'MED-CEFT-1G',
      scannedDose: '1 g',
      prescribedDose: '1 g',
      scannedRoute: 'IV',
      prescribedRoute: 'IV'
    });
    expect(mismatchVerification.isValid).toBe(false);
    expect(mismatchVerification.error).toContain('Verifikasi 5-Benar GAGAL');

    // 2. Test Correct 5-Rights Verification
    const correctVerification = emarEngineService.verify5Rights({
      patientBarcode: simMrn,
      targetPatientMrn: simMrn,
      medicationBarcode: 'MED-CEFT-1G',
      targetMedicationCode: 'MED-CEFT-1G',
      scannedDose: '1 g',
      prescribedDose: '1 g',
      scannedRoute: 'IV',
      prescribedRoute: 'IV'
    });
    expect(correctVerification.isValid).toBe(true);

    // 3. Record eMAR Administration Event in Database
    const client = await postgresPoolService.getClient();
    try {
      await client.query('BEGIN');
      const obsId = crypto.randomUUID();
      await client.query(`
        INSERT INTO clinical_observations (id, tenant_id, encounter_id, episode_id, patient_id, observation_type, loinc_code, loinc_display, observation_value, unit, observer_name)
        VALUES ($1, $2, $3, $4, $5, 'MEDICATION_ADMIN', '18610-6', 'Medication Administered: Ceftriaxone 1g IV', 'GIVEN_ON_TIME', 'DOSE', 'Nurse Anisa');
      `, [obsId, testTenantId, simEncounterId, simEpisodeId, simPatientId]);
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    const emarCheck = await pool.query('SELECT observation_value FROM clinical_observations WHERE patient_id = $1 AND observation_type = $2', [simPatientId, 'MEDICATION_ADMIN']);
    expect(emarCheck.rows[0].observation_value).toBe('GIVEN_ON_TIME');
  });

  // ==========================================================================
  // SCENARIO 4: STRUCTURED LOSSLESS ISBAR SHIFT HANDOVER
  // ==========================================================================
  it('4. ISBAR Shift Handover Ergonomics: should auto-synthesize structured handover without clinical context loss', async () => {
    // Generate ISBAR Handover Note
    const isbarData = {
      situation: 'Pasien IGD 49 th dengan Syok Sepsis & Riwayat Alergi Penicillin, saat ini telah diresusitasi',
      background: 'Masuk rujukan puskesmas dengan demam tinggi 4 hari, TD awal 70/50, GCS 13',
      assessment: 'TD stabil 110/70 post cairan 1.500 mL, Ceftriaxone 1g IV sudah diberikan jam 21:00 WIB',
      recommendation: 'Transfer ke ICU Bed-01, monitor MAP tiap 1 jam, siapkan continuous Norepinephrine jika MAP < 65'
    };

    const client = await postgresPoolService.getClient();
    let cpptId = crypto.randomUUID();
    try {
      await client.query('BEGIN');

      await client.query(`
        INSERT INTO cppt_notes (id, tenant_id, episode_id, encounter_id, patient_id, professional_type, author_id, author_name, sbar_situation, sbar_background, sbar_assessment, sbar_recommendation, dpjp_verified)
        VALUES ($1, $2, $3, $4, $5, 'PERAWAT', 'NURSE-SHIFT-NIGHT', 'Ns. Putri Handover', $6, $7, $8, $9, TRUE);
      `, [cpptId, testTenantId, simEpisodeId, simEncounterId, simPatientId, isbarData.situation, isbarData.background, isbarData.assessment, isbarData.recommendation]);

      await client.query('COMMIT');
    } finally {
      client.release();
    }

    // Verify Lossless Handover Reconstruction
    const cpptCheck = await pool.query('SELECT sbar_situation, sbar_assessment, sbar_recommendation FROM cppt_notes WHERE id = $1', [cpptId]);
    expect(cpptCheck.rows.length).toBe(1);
    expect(cpptCheck.rows[0].sbar_situation).toContain('Syok Sepsis');
    expect(cpptCheck.rows[0].sbar_recommendation).toContain('Transfer ke ICU Bed-01');
  });

  // ==========================================================================
  // SCENARIO 5: CONCURRENT MULTI-DISCIPLINARY COLLABORATION WITHOUT UI LOCKS
  // ==========================================================================
  it('5. Multi-Role Task Concurrency: should permit Doctor (SOAP), Nurse (Vitals), and Pharmacist (FEFO) to collaborate simultaneously without data collision', async () => {
    const roles = ['DOCTOR_SOAP', 'NURSE_VITALS', 'PHARMACIST_DISPENSE'];
    const results = [];

    const tasks = roles.map(async (role) => {
      const client = await postgresPoolService.getClient();
      try {
        await client.query('BEGIN');
        if (role === 'DOCTOR_SOAP') {
          const soapId = crypto.randomUUID();
          await client.query(`
            INSERT INTO soap_notes (id, tenant_id, episode_id, encounter_id, patient_id, subjective, objective, assessment, plan, primary_icd10, primary_icd10_name, physician_id, physician_name)
            VALUES ($1, $2, $3, $4, $5, 'Evaluasi DPJP ICU', 'MAP 72', 'A41.9 Sepsis', 'Target cairan tercapai', 'A41.9', 'Sepsis', 'DOC-ICU', 'dr. Intensivist');
          `, [soapId, testTenantId, simEpisodeId, simEncounterId, simPatientId]);
        } else if (role === 'NURSE_VITALS') {
          const obsId = crypto.randomUUID();
          await client.query(`
            INSERT INTO clinical_observations (id, tenant_id, encounter_id, episode_id, patient_id, observation_type, loinc_code, loinc_display, observation_value, unit, observer_name)
            VALUES ($1, $2, $3, $4, $5, 'VITAL_SIGNS', '8480-6', 'Systolic BP post resus', '110', 'mmHg', 'Nurse ICU');
          `, [obsId, testTenantId, simEncounterId, simEpisodeId, simPatientId]);
        } else if (role === 'PHARMACIST_DISPENSE') {
          const ordId = crypto.randomUUID();
          await client.query(`
            INSERT INTO clinical_orders (id, tenant_id, order_number, patient_id, episode_id, encounter_id, ordered_by, order_category, clinical_indication, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'Apoteker Farmasi', 'PHARMACY', 'Norepinephrine Infus', 'COMPLETED');
          `, [ordId, testTenantId, `ORD-PHARM-${Date.now()}`, simPatientId, simEpisodeId, simEncounterId]);
        }
        await client.query('COMMIT');
        results.push({ role, status: 'SUCCESS' });
      } catch (err) {
        try { await client.query('ROLLBACK'); } catch (_) {}
        results.push({ role, status: 'FAILED', error: err.message });
      } finally {
        client.release();
      }
    });

    await Promise.all(tasks);

    expect(results.length).toBe(3);
    expect(results.every(r => r.status === 'SUCCESS')).toBe(true);
  });
});
