import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { cpoeController } from '../server/controllers/cpoe.controller.js';
import { medicationClosedLoopController } from '../server/controllers/medicationClosedLoop.controller.js';
import { clinicalMonitoringController } from '../server/controllers/clinicalMonitoring.controller.js';
import { clinicalCodingAndCasemixController } from '../server/controllers/clinicalCodingAndCasemix.controller.js';
import { patientFinancialAndRevenueCycleController } from '../server/controllers/patientFinancialAndRevenueCycle.controller.js';
import { commandCenterController } from '../server/controllers/commandCenter.controller.js';
import { ENTERPRISE_ROLES } from '../src/shared/constants/roles.js';

function createMockReqRes({ user, body = {}, params = {}, query = {}, headers = {} } = {}) {
  let statusCode = 200;
  let responseBody = null;

  const req = {
    user,
    body,
    params,
    query,
    headers: { 'x-correlation-id': `CORR-HANDOFF-${Date.now()}`, ...headers },
    ip: '127.0.0.1'
  };

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseBody = data;
      return this;
    },
    getStatusCode: () => statusCode,
    getBody: () => responseBody
  };

  return { req, res };
}

describe('Gate 0C — Cross-Persona Clinical Handoff Lifecycle', () => {
  const tenantId = '00000000-0000-0000-0000-000000000001';
  let patientId;
  let episodeId;
  let encounterId;
  let cpoeOrderId;
  let medOrderId;

  beforeAll(async () => {
    patientId = crypto.randomUUID();
    episodeId = crypto.randomUUID();
    encounterId = crypto.randomUUID();
    const dynamicMrn = `MRN-HO-${Date.now().toString().slice(-6)}`;
    const dynamicNik = `317101${Date.now().toString().slice(-10)}`;

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN;');
      await client.query(`
        INSERT INTO master_patients (id, tenant_id, mrn, nik, full_name, birth_date, gender, phone_number, address_line, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'Tn. Handoff Terpadu', '1980-01-01', 'MALE', '081211112222', 'Jl. Salemba Tengah No. 12', true, NOW(), NOW());
      `, [patientId, tenantId, dynamicMrn, dynamicNik]);

      await client.query(`
        INSERT INTO episodes_of_care (id, tenant_id, episode_number, patient_id, episode_type, status, managing_department_id, managing_department_name, lead_dpjp_id, lead_dpjp_name, start_time, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'RAWAT_INAP', 'ACTIVE', 'DEPT_JANTUNG', 'Pusat Jantung Terpadu', 'DOC-01', 'dr. Siti Wijaya, Sp.PD', NOW(), NOW(), NOW());
      `, [episodeId, tenantId, `EP-HO-${Date.now().toString().slice(-6)}`, patientId]);

      await client.query(`
        INSERT INTO encounters (id, tenant_id, encounter_number, episode_id, patient_id, encounter_type, encounter_class, status, primary_doctor_id, primary_doctor_name, service_room_id, service_room_name, start_time, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'KONSULTASI_DOKTER', 'IMP', 'IN_PROGRESS', 'DOC-01', 'dr. Siti Wijaya, Sp.PD', 'ROOM-ICU-1', 'ICU Jantung Bed 1', NOW(), NOW(), NOW());
      `, [encounterId, tenantId, `ENC-HO-${Date.now().toString().slice(-6)}`, episodeId, patientId]);

      await client.query('COMMIT;');
    } catch (err) {
      await client.query('ROLLBACK;');
      throw err;
    } finally {
      client.release();
    }
  });

  it('Step 1: DOCTOR issues CPOE Stat Medication Order', async () => {
    const docUser = { userId: 'DOC-01', username: 'dr_siti', role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP, tenantId };
    const { req, res } = createMockReqRes({
      user: docUser,
      body: {
        encounterId,
        patientId,
        orderCategory: 'PHARMACY',
        priority: 'CITO',
        clinicalIndication: 'Emergency antiplatelet loading dose',
        items: [{ catalogCode: 'MED-ASP-80', itemName: 'Aspilet 80mg Oral', quantity: 2 }]
      }
    });

    await cpoeController.createOrder(req, res);
    expect(res.getStatusCode()).toBe(201);
    cpoeOrderId = res.getBody()?.data?.id;
    expect(cpoeOrderId).toBeDefined();
  });

  it('Step 2: PHARMACIST receives CPOE order, reviews safety, and approves e-Prescription', async () => {
    const docUser = { userId: 'DOC-01', username: 'dr_siti', role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP, tenantId };
    const pharmUser = { userId: 'PHARM-01', username: 'apt_hendra', role: ENTERPRISE_ROLES.ROLE_PHARMACIST, tenantId };

    // Doctor e-Prescription generation
    const { req: rPrescribe, res: resPrescribe } = createMockReqRes({
      user: docUser,
      body: { orderId: cpoeOrderId }
    });
    await medicationClosedLoopController.prescribeMedication(rPrescribe, resPrescribe);
    expect(resPrescribe.getStatusCode()).toBe(201);

    const medOrders = resPrescribe.getBody()?.data || [];
    medOrderId = medOrders[0]?.id;
    expect(medOrderId).toBeDefined();

    // Pharmacist MMU.4 Clinical Screening
    const { req: rReview, res: resReview } = createMockReqRes({
      user: pharmUser,
      params: { id: medOrderId },
      body: {
        reviewDecision: 'APPROVED',
        pharmacistNotes: 'Dosis aman, interaksi obat nihil.'
      }
    });
    await medicationClosedLoopController.pharmacistReview(rReview, resReview);
    expect(resReview.getStatusCode()).toBe(200);
    expect(resReview.getBody()?.data?.pharmacist_review_status).toBe('APPROVED');
  });

  it('Step 3: NURSE documents vital signs monitoring & bedside patient safety observation', async () => {
    const nurseUser = { userId: 'NURSE-01', username: 'ns_maya', role: ENTERPRISE_ROLES.ROLE_NURSE, tenantId };
    const { req, res } = createMockReqRes({
      user: nurseUser,
      body: {
        encounterId,
        patientId,
        heartRateBpm: 92,
        systolicBpMmhg: 130,
        diastolicBpMmhg: 80,
        respiratoryRateBpm: 18,
        spo2Percent: 98.0,
        bodyTemperatureCelsius: 36.6,
        consciousnessAvpu: 'ALERT'
      }
    });
    await clinicalMonitoringController.recordObservation(req, res);
    expect(res.getStatusCode()).toBe(201);
  });

  it('Step 4: CASEMIX_CODER finalizes ICD-10 primary coding & INA-CBG grouping', async () => {
    const coderUser = { userId: 'CODER-01', username: 'coder_fitri', role: ENTERPRISE_ROLES.ROLE_MEDICAL_RECORD_OFFICER, tenantId };
    const { req, res } = createMockReqRes({
      user: coderUser,
      body: {
        encounterId,
        patientId,
        principalIcd10Code: 'I21.0',
        principalIcd10Desc: 'Acute transmural myocardial infarction of anterior wall',
        secondaryDiagnoses: [{ icd10: 'I10', desc: 'Essential hypertension' }],
        procedureCodes: [{ icd9: '36.06', desc: 'Coronary artery stent' }]
      }
    });
    await clinicalCodingAndCasemixController.recordCoding(req, res);
    expect(res.getStatusCode()).toBe(201);
  });

  it('Step 5: CASHIER settles patient deposit and generates billing invoice', async () => {
    const cashierUser = { userId: 'CASHIER-01', username: 'kasir_ratna', role: ENTERPRISE_ROLES.ROLE_CASHIER, tenantId };
    const { req, res } = createMockReqRes({
      user: cashierUser,
      body: {
        encounterId,
        patientId,
        amountIdr: 5000000,
        depositType: 'ADMISSION_DEPOSIT',
        paymentMethod: 'QRIS'
      }
    });
    await patientFinancialAndRevenueCycleController.recordDeposit(req, res);
    expect(res.getStatusCode()).toBe(201);
    expect(res.getBody()?.success).toBe(true);
  });

  it('Step 6: CLINICAL_DIRECTOR observes encounter in real-time Command Center telemetry', async () => {
    const execUser = { userId: 'EXEC-01', username: 'direktur_dr_sp_ak', role: ENTERPRISE_ROLES.ROLE_SUPER_ADMIN, tenantId };
    const { req, res } = createMockReqRes({
      user: execUser
    });
    await commandCenterController.getCapacity(req, res);
    expect(res.getStatusCode()).toBe(200);
    expect(res.getBody()?.data).toBeDefined();
  });
});
