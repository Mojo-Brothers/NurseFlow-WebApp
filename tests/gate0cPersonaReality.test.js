import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { masterDataHubController } from '../server/controllers/masterDataHub.controller.js';
import { staffPrivilegingController } from '../server/controllers/staffPrivileging.controller.js';
import { clinicalNotesController } from '../server/controllers/clinicalNotes.controller.js';
import { cpoeController } from '../server/controllers/cpoe.controller.js';
import { triageController } from '../server/controllers/triage.controller.js';
import { clinicalMonitoringController } from '../server/controllers/clinicalMonitoring.controller.js';
import { patientFinancialAndRevenueCycleController } from '../server/controllers/patientFinancialAndRevenueCycle.controller.js';
import { medicationClosedLoopController } from '../server/controllers/medicationClosedLoop.controller.js';
import { laboratoryController } from '../server/controllers/laboratory.controller.js';
import { radiologyController } from '../server/controllers/radiology.controller.js';
import { bloodBankController } from '../server/controllers/bloodBank.controller.js';
import { perioperativeClosedLoopController } from '../server/controllers/perioperativeClosedLoop.controller.js';
import { clinicalCodingAndCasemixController } from '../server/controllers/clinicalCodingAndCasemix.controller.js';
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
    headers: { 'x-correlation-id': `CORR-VITEST-${Date.now()}`, ...headers },
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

describe('Gate 0C — 14 Persona Operational Reality Audit Suite', () => {
  const tenantId = '00000000-0000-0000-0000-000000000001';
  let sharedPatientId;
  let sharedEpisodeId;
  let sharedEncounterId;
  let sharedSurgicalCaseId;
  let dynamicMrn;
  let cpoePharmacyOrderId;
  let cpoeLabOrderId;

  beforeAll(async () => {
    sharedPatientId = crypto.randomUUID();
    sharedEpisodeId = crypto.randomUUID();
    sharedEncounterId = crypto.randomUUID();
    sharedSurgicalCaseId = crypto.randomUUID();
    dynamicMrn = `MRN-${Date.now().toString().slice(-6)}`;
    const dynamicNik = `317101${Date.now().toString().slice(-10)}`;

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN;');
      await client.query(`
        INSERT INTO master_patients (id, tenant_id, mrn, nik, full_name, birth_date, gender, phone_number, address_line, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'Tn. Bambang Realita Vitest', '1985-05-12', 'MALE', '081299998888', 'Jl. Salemba Raya No. 4', true, NOW(), NOW());
      `, [sharedPatientId, tenantId, dynamicMrn, dynamicNik]);

      await client.query(`
        INSERT INTO episodes_of_care (id, tenant_id, episode_number, patient_id, episode_type, status, managing_department_id, managing_department_name, lead_dpjp_id, lead_dpjp_name, start_time, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'RAWAT_INAP', 'ACTIVE', 'DEPT_DALAM', 'Departemen Penyakit Dalam', 'DOC-01', 'dr. Siti Wijaya, Sp.PD', NOW(), NOW(), NOW());
      `, [sharedEpisodeId, tenantId, `EP-${Date.now().toString().slice(-6)}`, sharedPatientId]);

      await client.query(`
        INSERT INTO encounters (id, tenant_id, encounter_number, episode_id, patient_id, encounter_type, encounter_class, status, primary_doctor_id, primary_doctor_name, service_room_id, service_room_name, start_time, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'KONSULTASI_DOKTER', 'IMP', 'IN_PROGRESS', 'DOC-01', 'dr. Siti Wijaya, Sp.PD', 'ROOM-101', 'Ruang Rawat Teratai', NOW(), NOW(), NOW());
      `, [sharedEncounterId, tenantId, `ENC-${Date.now().toString().slice(-6)}`, sharedEpisodeId, sharedPatientId]);

      await client.query(`
        INSERT INTO surgical_cases (
          id, tenant_id, booking_number, patient_id, patient_mrn, patient_name, encounter_id,
          scheduled_start, scheduled_end, procedure_code, procedure_name,
          primary_surgeon_id, primary_surgeon_name, anesthesiologist_id, anesthesiologist_name,
          scrub_nurse_name, circulating_nurse_name, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, 'Tn. Bambang Realita', $6,
          NOW(), NOW() + INTERVAL '2 hours', '36.06', 'Primary Percutaneous Coronary Intervention',
          'DOC-01', 'dr. Agung, Sp.B', 'DOC-02', 'dr. Donny, Sp.An',
          'Ns. Riri', 'Ns. Maya', 'IN_THEATRE', NOW(), NOW()
        );
      `, [sharedSurgicalCaseId, tenantId, `SURG-${Date.now().toString().slice(-6)}`, sharedPatientId, dynamicMrn, sharedEncounterId]);

      await client.query('COMMIT;');
    } catch (err) {
      await client.query('ROLLBACK;');
      throw err;
    } finally {
      client.release();
    }
  });

  it('Persona 1: ADMIN — Provisions Spatial Master Data & Clinical Staff', async () => {
    const adminUser = { userId: 'USR-ADMIN-01', role: ENTERPRISE_ROLES.ROLE_SUPER_ADMIN, tenantId };
    const { req: reqBeds, res: resBeds } = createMockReqRes({ user: adminUser, params: { entityType: 'beds' } });
    await masterDataHubController.listEntities(reqBeds, resBeds);
    expect(resBeds.getStatusCode()).toBe(200);

    const { req: reqStaff, res: resStaff } = createMockReqRes({
      user: adminUser,
      body: {
        fullName: 'dr. Andi Sutanto, Sp.JP',
        staffCategory: 'SPECIALIST_DOCTOR',
        primarySpecialty: 'Jantung dan Pembuluh Darah',
        primaryDepartmentId: 'POLI_JANTUNG'
      }
    });
    await staffPrivilegingController.createStaff(reqStaff, resStaff);
    expect(resStaff.getStatusCode()).toBe(201);
    expect(resStaff.getBody()?.success).toBe(true);
  });

  it('Persona 2: DOCTOR — Records SOAP Note & Issues CPOE Multi-Order (Rx + Lab)', async () => {
    const docUser = { userId: 'DOC-01', username: 'dr_siti', role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP, tenantId };

    // SOAP Note
    const { req: reqSoap, res: resSoap } = createMockReqRes({
      user: docUser,
      body: {
        encounterId: sharedEncounterId,
        patientId: sharedPatientId,
        subjective: 'Nyeri dada substernal menjalar ke lengan kiri.',
        objective: 'TD 140/90, HR 105x/m, EKG: STEMI Inferior',
        assessment: 'STEMI Inferior onset 2 jam',
        plan: 'Antiplatelet loading dose, CITO Lab, Ro Thorax, CITO Cath Lab'
      }
    });
    await clinicalNotesController.recordSoap(reqSoap, resSoap);
    expect(resSoap.getStatusCode()).toBe(201);
    expect(resSoap.getBody()?.success).toBe(true);

    // CPOE Rx
    const { req: rCpoeRx, res: resCpoeRx } = createMockReqRes({
      user: docUser,
      body: {
        encounterId: sharedEncounterId,
        patientId: sharedPatientId,
        orderCategory: 'PHARMACY',
        priority: 'CITO',
        clinicalIndication: 'Antiplatelet loading dose STEMI',
        items: [{ catalogCode: 'MED-ASP-80', itemName: 'Aspilet 80mg', quantity: 2 }]
      }
    });
    await cpoeController.createOrder(rCpoeRx, resCpoeRx);
    expect(resCpoeRx.getStatusCode()).toBe(201);
    cpoePharmacyOrderId = resCpoeRx.getBody()?.data?.id;
    expect(cpoePharmacyOrderId).toBeDefined();

    // CPOE Lab
    const { req: rCpoeLab, res: resCpoeLab } = createMockReqRes({
      user: docUser,
      body: {
        encounterId: sharedEncounterId,
        patientId: sharedPatientId,
        orderCategory: 'LABORATORY',
        priority: 'CITO',
        clinicalIndication: 'Cardiac enzymes evaluation',
        items: [{ catalogCode: 'LAB-TROP-I', itemName: 'Troponin I Kuantitatif', quantity: 1 }]
      }
    });
    await cpoeController.createOrder(rCpoeLab, resCpoeLab);
    expect(resCpoeLab.getStatusCode()).toBe(201);
    cpoeLabOrderId = resCpoeLab.getBody()?.data?.id;
    expect(cpoeLabOrderId).toBeDefined();
  });

  it('Persona 3: NURSE — Executes Emergency Triage & Vital Signs Monitoring', async () => {
    const nurseUser = { userId: 'NURSE-01', username: 'ns_maya', role: ENTERPRISE_ROLES.ROLE_NURSE, tenantId };
    
    // Triage
    const { req: rTriage, res: resTriage } = createMockReqRes({
      user: nurseUser,
      body: {
        encounterId: sharedEncounterId,
        patientId: sharedPatientId,
        atsLevel: 2,
        chiefComplaint: 'Nyeri dada hebat khas infark miokard',
        airwayStatus: 'PATENT',
        breathingStatus: 'TACHYPNEA',
        circulationStatus: 'TACHYCARDIA',
        disabilityStatus: 'ALERT',
        vitalsPayload: { bp: '140/90', hr: 105, rr: 22, temp: 36.8, spo2: 96 }
      }
    });
    await triageController.recordAssessment(rTriage, resTriage);
    expect(resTriage.getStatusCode()).toBe(201);

    // Vitals
    const { req: rVitals, res: resVitals } = createMockReqRes({
      user: nurseUser,
      body: {
        encounterId: sharedEncounterId,
        patientId: sharedPatientId,
        heartRateBpm: 105,
        systolicBpMmhg: 140,
        diastolicBpMmhg: 90,
        respiratoryRateBpm: 22,
        spo2Percent: 96.0,
        bodyTemperatureCelsius: 36.8,
        consciousnessAvpu: 'ALERT'
      }
    });
    await clinicalMonitoringController.recordObservation(rVitals, resVitals);
    expect(resVitals.getStatusCode()).toBe(201);
  });

  it('Persona 4: CASHIER — Collects Patient Prepayment Admission Deposit', async () => {
    const cashierUser = { userId: 'CASHIER-01', username: 'kasir_ratna', role: ENTERPRISE_ROLES.ROLE_CASHIER, tenantId };
    const { req, res } = createMockReqRes({
      user: cashierUser,
      body: {
        encounterId: sharedEncounterId,
        patientId: sharedPatientId,
        amountIdr: 2500000,
        depositType: 'ADMISSION_DEPOSIT',
        paymentMethod: 'QRIS'
      }
    });
    await patientFinancialAndRevenueCycleController.recordDeposit(req, res);
    expect(res.getStatusCode()).toBe(201);
    expect(res.getBody()?.success).toBe(true);
  });

  it('Persona 5: PHARMACIST — Conducts MMU.4 Clinical Screening & Approves e-Prescription', async () => {
    const pharmUser = { userId: 'PHARM-01', username: 'apt_hendra', role: ENTERPRISE_ROLES.ROLE_PHARMACIST, tenantId };
    const docUser = { userId: 'DOC-01', username: 'dr_siti', role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP, tenantId };

    const { req: rPrescribe, res: resPrescribe } = createMockReqRes({
      user: docUser,
      body: { orderId: cpoePharmacyOrderId }
    });
    await medicationClosedLoopController.prescribeMedication(rPrescribe, resPrescribe);
    expect(resPrescribe.getStatusCode()).toBe(201);

    const medOrders = resPrescribe.getBody()?.data || [];
    const firstMedOrderId = medOrders[0]?.id;
    expect(firstMedOrderId).toBeDefined();

    const { req: rRev, res: resRev } = createMockReqRes({
      user: pharmUser,
      params: { id: firstMedOrderId },
      body: {
        reviewDecision: 'APPROVED',
        pharmacistNotes: 'Screening klinis DPJP tervalidasi aman.'
      }
    });
    await medicationClosedLoopController.pharmacistReview(rRev, resRev);
    expect(resRev.getStatusCode()).toBe(200);
    expect(resRev.getBody()?.success).toBe(true);
  });

  it('Persona 6: LAB_ANALYST — Generates Diagnostic Specimen Accession from CPOE Order', async () => {
    const labUser = { userId: 'LAB-01', username: 'analis_budi', role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST, tenantId };
    const { req, res } = createMockReqRes({
      user: labUser,
      body: { orderId: cpoeLabOrderId }
    });
    await laboratoryController.generateSpecimens(req, res);
    expect(res.getStatusCode()).toBe(201);
    expect(res.getBody()?.success).toBe(true);
  });

  it('Persona 7: RADIOLOGIST — Authorizes Diagnostic PACS Structured Report', async () => {
    const radUser = { userId: 'RAD-01', username: 'dr_lukman_sp_rad', role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER, tenantId };
    const mockStudyId = crypto.randomUUID();

    const pool = postgresPoolService.getPool();
    const clientRad = await pool.connect();
    try {
      await clientRad.query(`
        INSERT INTO radiology_studies (
          id, tenant_id, order_id, encounter_id, patient_id, patient_mrn,
          study_instance_uid, accession_number, modality, body_part_examined,
          study_description, referring_physician, performing_technologist, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, 'CR', 'CHEST',
          'Foto Thorax AP CITO', 'dr. Siti Wijaya, Sp.PD', 'Radiografer Senior', 'ACQUIRED', NOW(), NOW()
        );
      `, [
        mockStudyId,
        tenantId,
        cpoeLabOrderId || crypto.randomUUID(),
        sharedEncounterId,
        sharedPatientId,
        dynamicMrn,
        `1.2.840.10008.5.1.4.1.1.${Date.now()}`,
        `ACC-${Date.now().toString().slice(-6)}`
      ]);
    } finally {
      clientRad.release();
    }

    const { req, res } = createMockReqRes({
      user: radUser,
      body: {
        studyId: mockStudyId,
        findings: 'Cor membesar dengan CTR 58%. Paru tampak bendungan vaskular ringan.',
        impressionConclusion: 'Kardiomegali dengan tanda awal bendungan paru (Mild Pulmonary Edema).'
      }
    });
    await radiologyController.saveReport(req, res);
    expect(res.getStatusCode()).toBe(201);
    expect(res.getBody()?.success).toBe(true);
  });

  it('Persona 8: BLOOD_BANK_OFFICER — Performs ISBT-128 Donor Unit Intake', async () => {
    const bdrsUser = { userId: 'BDRS-01', username: 'petugas_bdrs', role: 'ROLE_BLOOD_BANK_OFFICER', tenantId };
    const { req, res } = createMockReqRes({
      user: bdrsUser,
      body: {
        donor_unit_number: `DONOR-14P-${Date.now()}`,
        blood_group: 'B',
        rhesus: 'POSITIVE',
        volume_ml: 350,
        collection_date: new Date().toISOString().split('T')[0],
        screening_status: 'NON_REACTIVE'
      }
    });
    await bloodBankController.intakeDonorUnit(req, res);
    expect(res.getStatusCode()).toBe(201);
    expect(res.getBody()?.success).toBe(true);
  });

  it('Persona 9: SURGEON — Records Pre-Op Surgical Planning & Risk Evaluation', async () => {
    const surgUser = { userId: 'SURG-01', username: 'dr_agung_sp_b', role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP, tenantId };
    const { req, res } = createMockReqRes({
      user: surgUser,
      body: {
        encounterId: sharedEncounterId,
        patientId: sharedPatientId,
        asaClass: 'ASA_III',
        mallampatiScore: 2,
        npoFastingHours: 6,
        cardiopulmonaryClearance: 'CLEARED_FOR_EMERGENCY_PCI',
        anesthesiaPlan: 'LOCAL_MAC'
      }
    });
    await perioperativeClosedLoopController.createPreOpEvaluation(req, res);
    expect(res.getStatusCode()).toBe(201);
    expect(res.getBody()?.success).toBe(true);
  });

  it('Persona 10: ANESTHESIOLOGIST — Documents Pre-Anesthesia ASA IV Risk Evaluation', async () => {
    const anesthUser = { userId: 'ANES-01', username: 'dr_donny_sp_an', role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP, tenantId };
    const { req, res } = createMockReqRes({
      user: anesthUser,
      body: {
        encounterId: sharedEncounterId,
        patientId: sharedPatientId,
        asaClass: 'ASA_IV',
        mallampatiScore: 2,
        npoFastingHours: 4,
        cardiopulmonaryClearance: 'CLEARED_HIGH_RISK',
        anesthesiaPlan: 'GENERAL_ANESTHESIA'
      }
    });
    await perioperativeClosedLoopController.createPreOpEvaluation(req, res);
    expect(res.getStatusCode()).toBe(201);
    expect(res.getBody()?.success).toBe(true);
  });

  it('Persona 11: OR_NURSE — Executes WHO Surgical Safety Checklist (Sign-In Phase)', async () => {
    const orNurseUser = { userId: 'ORNURSE-01', username: 'ns_riri', role: ENTERPRISE_ROLES.ROLE_NURSE, tenantId };
    const { req, res } = createMockReqRes({
      user: orNurseUser,
      body: {
        surgicalCaseId: sharedSurgicalCaseId,
        encounterId: sharedEncounterId,
        patientId: sharedPatientId,
        phase: 'SIGN_IN',
        phaseData: {
          patientIdentityConfirmed: true,
          siteMarked: true,
          consentVerified: true,
          oximeterFunctioning: true
        }
      }
    });
    await perioperativeClosedLoopController.executeWhoChecklist(req, res);
    expect(res.getStatusCode()).toBe(200);
    expect(res.getBody()?.success).toBe(true);
  });

  it('Persona 12: ICU_NURSE — Charts NEWS2 High Deterioration Acuity Observation', async () => {
    const icuUser = { userId: 'ICU-01', username: 'ns_ratna', role: ENTERPRISE_ROLES.ROLE_NURSE, tenantId };
    const { req, res } = createMockReqRes({
      user: icuUser,
      body: {
        encounterId: sharedEncounterId,
        patientId: sharedPatientId,
        heartRateBpm: 122,
        systolicBpMmhg: 88,
        diastolicBpMmhg: 54,
        respiratoryRateBpm: 28,
        spo2Percent: 91.0,
        bodyTemperatureCelsius: 38.9,
        consciousnessAvpu: 'VOICE'
      }
    });
    await clinicalMonitoringController.recordObservation(req, res);
    expect(res.getStatusCode()).toBe(201);
    expect(res.getBody()?.success).toBe(true);
  });

  it('Persona 13: CASEMIX_CODER — Assigns ICD-10/ICD-9-CM & Triggers INA-CBG Grouping', async () => {
    const coderUser = { userId: 'CODER-01', username: 'coder_fitri', role: ENTERPRISE_ROLES.ROLE_MEDICAL_RECORD_OFFICER, tenantId };
    const { req, res } = createMockReqRes({
      user: coderUser,
      body: {
        encounterId: sharedEncounterId,
        patientId: sharedPatientId,
        principalIcd10Code: 'I21.0',
        principalIcd10Desc: 'Acute transmural myocardial infarction of anterior wall',
        secondaryDiagnoses: [{ icd10: 'I10', desc: 'Essential (primary) hypertension' }],
        procedureCodes: [{ icd9: '36.06', desc: 'Insertion of non-drug-eluting coronary artery stent(s)' }]
      }
    });
    await clinicalCodingAndCasemixController.recordCoding(req, res);
    expect(res.getStatusCode()).toBe(201);
    expect(res.getBody()?.success).toBe(true);
  });

  it('Persona 14: CLINICAL_DIRECTOR — Monitors Command Center Executive Telemetry', async () => {
    const dirUser = { userId: 'DIR-01', username: 'dr_direktur', role: ENTERPRISE_ROLES.ROLE_SUPER_ADMIN, tenantId };
    const { req, res } = createMockReqRes({ user: dirUser });
    await commandCenterController.getCapacity(req, res);
    expect(res.getStatusCode()).toBe(200);
    expect(res.getBody()?.success).toBe(true);
  });
});
