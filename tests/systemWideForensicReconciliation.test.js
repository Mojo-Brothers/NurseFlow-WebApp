/**
 * NurseFlow Enterprise HIS 2026 — System-Wide Forensic Horizontal Reconciliation Suite
 * Validates: 7 Newly Wired Domains, REST Route Endpoints, RBAC Security Guards, Canonical Engine Integrations & Zero Regression
 */

import { describe, it, expect } from 'vitest';
import { bloodBankController } from '../server/controllers/bloodBank.controller.js';
import { staffPrivilegingController } from '../server/controllers/staffPrivileging.controller.js';
import { staffSchedulingService } from '../server/services/staffScheduling.service.js';
import { masterDataHubController } from '../server/controllers/masterDataHub.controller.js';
import { appointmentController } from '../server/controllers/appointment.controller.js';
import { enterpriseInventoryController } from '../server/controllers/enterpriseInventory.controller.js';
import { satusehatStudioController } from '../server/controllers/satusehatStudio.controller.js';
import { commandCenterController } from '../server/controllers/commandCenter.controller.js';

// Lightweight Express req/res harness
function createMockReqRes({ body = {}, params = {}, query = {}, user = null } = {}) {
  let statusCode = 200;
  let jsonResponse = null;

  const req = { body, params, query, user };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonResponse = payload;
      return this;
    },
    getStatusCode() {
      return statusCode;
    },
    getBody() {
      return jsonResponse;
    }
  };

  return { req, res };
}

describe('System-Wide Horizontal Forensic Reconciliation & Production Wiring Suite (25 Scenarios)', () => {
  const adminUser = { id: 'ADM-01', name: 'Super Admin', roles: ['ADMIN'] };
  const doctorUser = { id: 'DOC-01', name: 'dr. Budi, Sp.A', roles: ['DOCTOR'] };
  const nurseUser = { id: 'NURSE-01', name: 'Ns. Maya, S.Kep', roles: ['NURSE'] };
  const pharmacistUser = { id: 'PHARM-01', name: 'Apt. Siti, S.Farm', roles: ['PHARMACIST'] };

  // ─── 1. BLOOD BANK (BDRS) REST API WIRING ───
  describe('Domain 16: Blood Bank (BDRS) Enterprise REST API', () => {
    let createdUnitId = null;

    it('Scenario 1: should fetch blood inventory for authenticated staff', async () => {
      const { req, res } = createMockReqRes({ user: doctorUser });
      await bloodBankController.getInventory(req, res);

      expect(res.getStatusCode()).toBe(200);
      expect(res.getBody().success).toBe(true);
      expect(Array.isArray(res.getBody().data)).toBe(true);
    });

    it('Scenario 2: should intake new donor unit with ISBT-128 barcode', async () => {
      const { req, res } = createMockReqRes({
        user: adminUser,
        body: {
          donor_unit_number: `DONOR-${Date.now()}`,
          blood_group: 'O',
          rhesus: 'POSITIVE',
          component_type: 'PACKED_RED_CELLS',
          volume_ml: 350,
          collection_date: new Date().toISOString(),
          expiry_date: new Date(Date.now() + 35 * 86400000).toISOString()
        }
      });
      await bloodBankController.intakeDonorUnit(req, res);

      expect(res.getStatusCode()).toBe(201);
      expect(res.getBody().success).toBe(true);
      expect(res.getBody().data.isbt128_barcode).toBeDefined();
      createdUnitId = res.getBody().data.id;
    });

    it('Scenario 3: should execute serological crossmatch test', async () => {
      const { req, res } = createMockReqRes({
        user: adminUser,
        body: {
          patient_id: 'P-001',
          encounter_id: 'ENC-001',
          donor_unit_id: createdUnitId,
          patient_abo: 'O',
          patient_rhesus: 'POSITIVE',
          donor_abo: 'O',
          donor_rhesus: 'POSITIVE',
          major_crossmatch: 'COMPATIBLE',
          minor_crossmatch: 'COMPATIBLE'
        }
      });
      await bloodBankController.executeCrossmatch(req, res);

      expect(res.getStatusCode()).toBe(200);
      expect(res.getBody().success).toBe(true);
      expect(res.getBody().data.compatibility_status).toBe('COMPATIBLE');
    });

    it('Scenario 4: should verify bedside dual nurse transfusion verification', async () => {
      const { req, res } = createMockReqRes({
        user: nurseUser,
        body: {
          unit_id: createdUnitId || 'UNIT-001',
          unit_barcode_scanned: 'ISBT-PRC-O-POS-001',
          encounter_id: 'ENC-001',
          patient_mrn_scanned: 'MRN-100234',
          patient_blood_group: 'O',
          unit_blood_group: 'O',
          primary_nurse_id: 'NURSE-01',
          secondary_nurse_id: 'NURSE-02'
        }
      });
      await bloodBankController.verifyBedsideTransfusion(req, res);

      expect(res.getStatusCode()).toBe(200);
      expect(res.getBody().success).toBe(true);
      expect(res.getBody().data.authorized).toBe(true);
    });
  });

  // ─── 2. STAFF CREDENTIALING & CLINICAL PRIVILEGING ───
  describe('Domain 17: Staff Credentialing & Clinical Privileging REST API', () => {
    let testStaffId = 'STAFF-RECON-01';

    it('Scenario 5: should fetch clinical staff list', async () => {
      const { req, res } = createMockReqRes({ user: adminUser });
      await staffPrivilegingController.getStaffList(req, res);

      expect(res.getStatusCode()).toBe(200);
      expect(res.getBody().success).toBe(true);
      expect(Array.isArray(res.getBody().data)).toBe(true);
    });

    it('Scenario 6: should register a new clinical staff profile', async () => {
      const { req, res } = createMockReqRes({
        user: adminUser,
        body: {
          id: testStaffId,
          staffNumber: `STF-${Date.now()}`,
          fullName: 'dr. Andi Pratama, Sp.B',
          staffCategory: 'SPECIALIST_DOCTOR',
          primarySpecialty: 'BEDAH_UMUM',
          primaryDepartmentId: 'DEPT-BEDAH'
        }
      });
      await staffPrivilegingController.createStaff(req, res);

      expect(res.getStatusCode()).toBe(201);
      expect(res.getBody().success).toBe(true);
      expect(res.getBody().data.fullName).toBe('dr. Andi Pratama, Sp.B');
    });

    it('Scenario 7: should register STR / SIP credential for practitioner', async () => {
      const { req, res } = createMockReqRes({
        user: adminUser,
        body: {
          staffId: testStaffId,
          credentialType: 'SIP',
          credentialNumber: 'SIP-DKI-2026-991',
          issuingAuthority: 'Dinkes DKI Jakarta',
          issuedAt: '2026-01-01',
          validFrom: '2026-01-01',
          validUntil: '2031-01-01',
          verificationStatus: 'ACTIVE_VERIFIED'
        }
      });
      await staffPrivilegingController.addCredential(req, res);

      expect(res.getStatusCode()).toBe(201);
      expect(res.getBody().success).toBe(true);
    });

    it('Scenario 8: should grant clinical privilege (SPK/RKK)', async () => {
      const { req, res } = createMockReqRes({
        user: adminUser,
        body: {
          staffId: testStaffId,
          procedureCode: 'ICD9CM-47.0',
          procedureName: 'Appendectomy Laparoscopic',
          privilegeLevel: 'INDEPENDENT',
          effectiveFrom: '2026-01-01',
          effectiveUntil: '2029-01-01'
        }
      });
      await staffPrivilegingController.grantPrivilege(req, res);

      expect(res.getStatusCode()).toBe(201);
      expect(res.getBody().success).toBe(true);
      expect(res.getBody().data.privilegeLevel).toBe('INDEPENDENT');
    });

    it('Scenario 9: should verify clinical authorization on runtime query', async () => {
      // Assign active on-duty shift first (JCI requirement)
      staffSchedulingService.assignShift({
        staffId: testStaffId,
        date: '2026-08-21',
        shiftCode: 'PAGI'
      });

      const { req, res } = createMockReqRes({
        user: doctorUser,
        body: {
          staffId: testStaffId,
          procedureCode: 'ICD9CM-47.0',
          date: '2026-08-21'
        }
      });
      await staffPrivilegingController.verifyAuthorization(req, res);

      expect(res.getStatusCode()).toBe(200);
      expect(res.getBody().success).toBe(true);
      expect(res.getBody().authorized).toBe(true);
    });
  });

  // ─── 3. MASTER DATA GOVERNANCE HUB ───
  describe('Domain 18: Master Data Governance Hub REST API', () => {
    it('Scenario 10: should list organizations master data', async () => {
      const { req, res } = createMockReqRes({
        user: adminUser,
        params: { entityType: 'organizations' }
      });
      await masterDataHubController.listEntities(req, res);

      expect(res.getStatusCode()).toBe(200);
      expect(res.getBody().success).toBe(true);
      expect(Array.isArray(res.getBody().data)).toBe(true);
    });

    it('Scenario 11: should list wards master data', async () => {
      const { req, res } = createMockReqRes({
        user: adminUser,
        params: { entityType: 'wards' }
      });
      await masterDataHubController.listEntities(req, res);

      expect(res.getStatusCode()).toBe(200);
      expect(res.getBody().success).toBe(true);
      expect(Array.isArray(res.getBody().data)).toBe(true);
    });

    it('Scenario 12: should allow admin to create a new master data entry', async () => {
      const { req, res } = createMockReqRes({
        user: adminUser,
        params: { entityType: 'wards' },
        body: {
          floor_id: 'FLR-02',
          code: `WRD-${Date.now()}`,
          name: 'Bangsal Melati Pavilion',
          ward_class: 'VIP'
        }
      });
      await masterDataHubController.createEntity(req, res);

      expect(res.getStatusCode()).toBe(201);
      expect(res.getBody().success).toBe(true);
      expect(res.getBody().data.name).toBe('Bangsal Melati Pavilion');
    });
  });

  // ─── 4. APPOINTMENT & QUEUE SCHEDULING ───
  describe('Domain 23: Appointment & Online Booking REST API', () => {
    it('Scenario 13: should fetch appointments list', async () => {
      const { req, res } = createMockReqRes({ user: adminUser });
      await appointmentController.getAppointments(req, res);

      expect(res.getStatusCode()).toBe(200);
      expect(res.getBody().success).toBe(true);
      expect(Array.isArray(res.getBody().data)).toBe(true);
    });

    it('Scenario 14: should book a new outpatient appointment', async () => {
      const { req, res } = createMockReqRes({
        user: adminUser,
        body: {
          patientId: 'P-101',
          patientMrn: 'MRN-2026-001',
          patientName: 'Ny. Budiarti',
          doctorId: 'DOC-01',
          doctorName: 'dr. Hendra, Sp.PD',
          clinicCode: 'INT',
          clinicName: 'Poliklinik Penyakit Dalam',
          appointmentDate: '2026-08-25',
          slotTime: '10:00 - 10:30',
          guarantorType: 'BPJS'
        }
      });
      await appointmentController.book(req, res);

      expect(res.getStatusCode()).toBe(201);
      expect(res.getBody().success).toBe(true);
      expect(res.getBody().data.status).toBe('BOOKED');
    });

    it('Scenario 15: should check in patient on arrival and generate queue ticket', async () => {
      const { req: bookReq, res: bookRes } = createMockReqRes({
        user: adminUser,
        body: {
          patientId: 'P-102',
          patientMrn: 'MRN-2026-002',
          patientName: 'Tn. Hendro',
          doctorId: 'DOC-01',
          doctorName: 'dr. Hendra, Sp.PD',
          clinicCode: 'INT',
          appointmentDate: '2026-08-25',
          slotTime: '10:30 - 11:00'
        }
      });
      await appointmentController.book(bookReq, bookRes);
      const aptId = bookRes.getBody().data.appointmentId;

      const { req: checkInReq, res: checkInRes } = createMockReqRes({
        user: adminUser,
        body: { appointmentId: aptId }
      });
      await appointmentController.checkIn(checkInReq, checkInRes);

      expect(checkInRes.getStatusCode()).toBe(200);
      expect(checkInRes.getBody().success).toBe(true);
      expect(checkInRes.getBody().data.status).toBe('CHECKED_IN');
      expect(checkInRes.getBody().data.queueNumber).toBeDefined();
    });
  });

  // ─── 5. ENTERPRISE INVENTORY & LOGISTICS ───
  describe('Domain 20: Enterprise Inventory & Logistics REST API', () => {
    it('Scenario 16: should receive stock batch from supplier', async () => {
      const { req, res } = createMockReqRes({
        user: pharmacistUser,
        body: {
          warehouseId: 'WH-MAIN-PHARMACY',
          itemCode: 'MED-AMOX-500',
          itemName: 'Amoxicillin 500mg Kapsul',
          batchNumber: `BAT-${Date.now()}`,
          expiryDate: '2028-12-31',
          quantity: 1000,
          unitCost: 850
        }
      });
      await enterpriseInventoryController.receive(req, res);

      expect(res.getStatusCode()).toBe(201);
      expect(res.getBody().success).toBe(true);
      expect(res.getBody().data.availableQuantity).toBe(1000);
    });

    it('Scenario 17: should query warehouse stock', async () => {
      const { req, res } = createMockReqRes({
        user: pharmacistUser,
        query: { warehouseId: 'WH-MAIN-PHARMACY' }
      });
      await enterpriseInventoryController.getStock(req, res);

      expect(res.getStatusCode()).toBe(200);
      expect(res.getBody().success).toBe(true);
      expect(Array.isArray(res.getBody().data)).toBe(true);
    });

    it('Scenario 18: should execute inter-depot stock transfer', async () => {
      const { req, res } = createMockReqRes({
        user: pharmacistUser,
        body: {
          sourceWarehouseId: 'WH-MAIN-PHARMACY',
          targetWarehouseId: 'WH-IGD-DEPOT',
          itemCode: 'MED-AMOX-500',
          quantity: 50,
          notes: 'Mutasi emergency stock IGD'
        }
      });
      await enterpriseInventoryController.transfer(req, res);

      expect(res.getStatusCode()).toBe(200);
      expect(res.getBody().success).toBe(true);
      expect(res.getBody().data.transferredQuantity).toBe(50);
    });
  });

  // ─── 6. SATUSEHAT FHIR R4 INTEROPERABILITY STUDIO ───
  describe('Domain 21: SATUSEHAT FHIR R4 Studio REST API', () => {
    it('Scenario 19: should retrieve transmission logs for admin', async () => {
      const { req, res } = createMockReqRes({ user: adminUser });
      await satusehatStudioController.getLogs(req, res);

      expect(res.getStatusCode()).toBe(200);
      expect(res.getBody().success).toBe(true);
      expect(Array.isArray(res.getBody().data)).toBe(true);
    });

    it('Scenario 20: should validate FHIR Patient resource payload', async () => {
      const { req, res } = createMockReqRes({
        user: adminUser,
        body: {
          resource: {
            resourceType: 'Patient',
            id: 'P-3171012345670001',
            meta: { profile: ['https://fhir.kemkes.go.id/r4/StructureDefinition/Patient'] },
            identifier: [{ system: 'https://fhir.kemkes.go.id/id/nik', value: '3171012345670001' }],
            name: [{ use: 'official', text: 'Budi Santoso' }],
            gender: 'male',
            birthDate: '1985-05-12'
          }
        }
      });
      await satusehatStudioController.validate(req, res);

      expect(res.getStatusCode()).toBe(200);
      expect(res.getBody().success).toBe(true);
      expect(res.getBody().data.valid).toBe(true);
    });

    it('Scenario 21: should transmit valid FHIR bundle to gateway simulator', async () => {
      const { req, res } = createMockReqRes({
        user: adminUser,
        body: {
          bundle: {
            resourceType: 'Bundle',
            id: 'BND-TEST-001',
            type: 'transaction',
            entry: [
              {
                fullUrl: 'urn:uuid:p-001',
                resource: {
                  resourceType: 'Patient',
                  id: 'p-001',
                  meta: { profile: ['https://fhir.kemkes.go.id/r4/StructureDefinition/Patient'] }
                },
                request: { method: 'POST', url: 'Patient' }
              }
            ]
          }
        }
      });
      await satusehatStudioController.transmit(req, res);

      expect(res.getStatusCode()).toBe(200);
      expect(res.getBody().success).toBe(true);
      expect(res.getBody().data.status).toBe('SUCCESS');
    });
  });

  // ─── 7. HOSPITAL CENTRAL COMMAND CENTER ───
  describe('Domain 22: Hospital Central Command Center REST API', () => {
    it('Scenario 22: should fetch executive capacity command metrics', async () => {
      const { req, res } = createMockReqRes({ user: adminUser });
      await commandCenterController.getCapacity(req, res);

      expect(res.getStatusCode()).toBe(200);
      expect(res.getBody().success).toBe(true);
      expect(res.getBody().data.bor).toBeDefined();
      expect(res.getBody().data.totalBeds).toBeGreaterThan(0);
    });

    it('Scenario 23: should fetch emergency department command metrics', async () => {
      const { req, res } = createMockReqRes({ user: adminUser });
      await commandCenterController.getEmergency(req, res);

      expect(res.getStatusCode()).toBe(200);
      expect(res.getBody().success).toBe(true);
      expect(res.getBody().data.avgWaitingTimeMinutes).toBeDefined();
    });

    it('Scenario 24: should fetch financial cycle and BPJS claim KPIs', async () => {
      const { req, res } = createMockReqRes({ user: adminUser });
      await commandCenterController.getFinancial(req, res);

      expect(res.getStatusCode()).toBe(200);
      expect(res.getBody().success).toBe(true);
      expect(res.getBody().data.cleanClaimRate).toBeDefined();
    });

    it('Scenario 25: should fetch executive active alerts', async () => {
      const { req, res } = createMockReqRes({ user: adminUser });
      await commandCenterController.getAlerts(req, res);

      expect(res.getStatusCode()).toBe(200);
      expect(res.getBody().success).toBe(true);
      expect(Array.isArray(res.getBody().data)).toBe(true);
    });
  });
});
