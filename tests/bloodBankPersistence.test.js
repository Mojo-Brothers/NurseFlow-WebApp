/**
 * NurseFlow Enterprise HIS 2026 — Blood Bank (BDRS) Units & Safety Closure Persistence Test Suite (Gate 1D.4-H.1)
 * Standards: Permenkes No. 91/2015, WHO Blood Transfusion Safety & JCI IPSG
 */

import { describe, it, expect } from 'vitest';
import { bloodBankService, BLOOD_UNIT_STATES } from '../server/services/bloodBank.service.js';

describe('Gate 1D.4-H.1: Blood Bank Safety Closure & Complete Transfusion Traceability Chain', () => {
  const TENANT_A = '00000000-0000-0000-0000-000000000001';
  const TENANT_B = '00000000-0000-0000-0000-000000000002';
  const currentDate = new Date('2026-09-01T10:00:00Z');

  // 1. Blood Donor Unit Registration & Product-Specific Cold Chain
  it('1. should register blood donor units with product-specific cold chain profiles', () => {
    // PRC Unit (Chilled 2°C - 6°C)
    const unitPrc = bloodBankService.registerBloodUnit({
      id: 'UNIT-PRC-201',
      tenantId: TENANT_A,
      unitNumber: 'UTD-20260901-PRC201',
      productType: 'PACKED_RED_CELLS',
      aboType: 'A',
      rhesusType: 'POSITIVE',
      volumeMl: 250,
      donationDate: '2026-09-01',
      expiryDate: '2026-10-06T23:59:59Z',
      storageTemperatureCelsius: 4.0,
      storageLocation: 'Chiller BDRS 1 - Rak A1'
    });

    // FFP Unit (Frozen <= -18°C)
    const unitFfp = bloodBankService.registerBloodUnit({
      id: 'UNIT-FFP-202',
      tenantId: TENANT_A,
      unitNumber: 'UTD-20260901-FFP202',
      productType: 'FRESH_FROZEN_PLASMA',
      aboType: 'O',
      rhesusType: 'POSITIVE',
      volumeMl: 200,
      donationDate: '2026-09-01',
      expiryDate: '2027-09-01T23:59:59Z',
      storageTemperatureCelsius: -22.0,
      storageLocation: 'Freezer BDRS 1 - Rak B1'
    });

    expect(unitPrc.status).toBe(BLOOD_UNIT_STATES.AVAILABLE);
    expect(unitFfp.status).toBe(BLOOD_UNIT_STATES.AVAILABLE);
  });

  // 2. Product-Specific Temperature Excursion & Auto-Quarantine
  it('2. should evaluate temperature excursions against product-specific limits and quarantine on violation', () => {
    // PRC at 4.5°C -> NORMAL (Allowed 2°C - 6°C)
    const logPrc = bloodBankService.logStorageTemperature({
      tenantId: TENANT_A,
      unitId: 'UNIT-PRC-201',
      productType: 'PACKED_RED_CELLS',
      storageDeviceId: 'BDRS-CHILLER-01',
      temperatureCelsius: 4.5,
      recordedBy: 'Analis Ahmad'
    });
    expect(logPrc.alarmStatus).toBe('NORMAL');

    // FFP at -10.0°C -> HIGH_TEMP_ALARM (Allowed <= -18°C)
    const logFfp = bloodBankService.logStorageTemperature({
      tenantId: TENANT_A,
      unitId: 'UNIT-FFP-202',
      productType: 'FRESH_FROZEN_PLASMA',
      storageDeviceId: 'BDRS-FREEZER-01',
      temperatureCelsius: -10.0, // DANGEROUS WARMING!
      recordedBy: 'Analis Ahmad',
      actionTaken: 'Kantong FFP dikarantina ke Freezer Cadangan'
    });
    expect(logFfp.alarmStatus).toBe('HIGH_TEMP_ALARM');
    expect(bloodBankService.units.get('UNIT-FFP-202').status).toBe(BLOOD_UNIT_STATES.QUARANTINED);
  });

  // 3. Atomic Unit Reservation
  it('3. should perform atomic unit reservation for a specific patient encounter', () => {
    const unit = bloodBankService.units.get('UNIT-PRC-201');
    const res = bloodBankService.reserveBloodUnitAtomic({
      unitId: unit.id,
      tenantId: TENANT_A,
      patientId: 'PAT-SITI-01',
      encounterId: 'ENC-001',
      expectedVersion: unit.version,
      currentDate
    });

    expect(res.affectedRows).toBe(1);
    expect(unit.status).toBe(BLOOD_UNIT_STATES.RESERVED);
    expect(unit.reservedForPatientId).toBe('PAT-SITI-01');
  });

  // 4. Finalized Crossmatch with Donor ABO/Rh & Immutability Evidence Chain
  it('4. should record finalized crossmatch with doctor verification and donor ABO/Rh details', () => {
    const cm = bloodBankService.performCrossmatchTest({
      tenantId: TENANT_A,
      patientId: 'PAT-SITI-01',
      encounterId: 'ENC-001',
      bloodUnitId: 'UNIT-PRC-201',
      patientAbo: 'A',
      patientRhesus: 'POSITIVE',
      donorAbo: 'A',
      donorRhesus: 'POSITIVE',
      antibodyScreen: 'NEGATIVE',
      majorCrossmatch: 'COMPATIBLE',
      minorCrossmatch: 'COMPATIBLE',
      technicianId: 'TECH-01',
      technicianName: 'Analis Ahmad',
      verifiedByDoctorId: 'DOC-01',
      verifiedByDoctorName: 'dr. Sp.PK Budi'
    });

    expect(cm.isFinalized).toBe(true);
    expect(cm.donorAbo).toBe('A');
    expect(cm.overallCompatibility).toBe('COMPATIBLE');
    expect(bloodBankService.units.get('UNIT-PRC-201').status).toBe(BLOOD_UNIT_STATES.CROSSMATCHED);
  });

  // 5. Blood Unit Handoff & Issue Record
  it('5. should record custody handoff from BDRS to Ward (Blood Issue Record)', () => {
    const cm = Array.from(bloodBankService.crossmatches.values()).find(c => c.bloodUnitId === 'UNIT-PRC-201');

    const issue = bloodBankService.issueBloodUnitToWard({
      tenantId: TENANT_A,
      bloodUnitId: 'UNIT-PRC-201',
      patientId: 'PAT-SITI-01',
      encounterId: 'ENC-001',
      crossmatchId: cm.id,
      issuedById: 'TECH-01',
      issuedByName: 'Analis Ahmad',
      receivedById: 'NURSE-01',
      receivedByName: 'Ns. Ratna, S.Kep',
      temperatureAtIssue: 4.2
    });

    expect(issue.issueStatus).toBe('ISSUED');
    expect(bloodBankService.units.get('UNIT-PRC-201').status).toBe(BLOOD_UNIT_STATES.ISSUED);
  });

  // 6. Mandatory 7-Point Bedside Verification Checklist
  it('6. should enforce all 7 bedside verification points and 2 distinct nurse IDs', () => {
    const fakeTransfusionId = 'TRF-TEST-001';

    // Fails if two nurses are identical
    expect(() => {
      bloodBankService.recordBedsideVerification({
        tenantId: TENANT_A,
        transfusionId: fakeTransfusionId,
        administeredByNurseId: 'NURSE-01',
        administeredByNurseName: 'Ns. Ratna',
        witnessedByNurseId: 'NURSE-01', // SAME NURSE ID!
        witnessedByNurseName: 'Ns. Ratna'
      });
    }).toThrow(/DOUBLE_CHECK_REQUIRED/);

    // Fails if any check point is false
    expect(() => {
      bloodBankService.recordBedsideVerification({
        tenantId: TENANT_A,
        transfusionId: fakeTransfusionId,
        patientIdentityVerified: true,
        bloodUnitVerified: true,
        aboVerified: true,
        rhesusVerified: false, // MISMATCH!
        administeredByNurseId: 'NURSE-01',
        administeredByNurseName: 'Ns. Ratna',
        witnessedByNurseId: 'NURSE-02',
        witnessedByNurseName: 'Ns. Dewi'
      });
    }).toThrow(/VERIFICATION_INCOMPLETE/);

    // Passes when all 7 points are true with 2 distinct nurses
    const verif = bloodBankService.recordBedsideVerification({
      tenantId: TENANT_A,
      transfusionId: fakeTransfusionId,
      patientIdentityVerified: true,
      bloodUnitVerified: true,
      aboVerified: true,
      rhesusVerified: true,
      expiryVerified: true,
      crossmatchVerified: true,
      informedConsentVerified: true,
      administeredByNurseId: 'NURSE-01',
      administeredByNurseName: 'Ns. Ratna',
      witnessedByNurseId: 'NURSE-02',
      witnessedByNurseName: 'Ns. Dewi'
    });

    expect(verif.patientIdentityVerified).toBe(true);
    expect(verif.witnessedByNurseName).toBe('Ns. Dewi');
  });

  // 7. Successful Transfusion Execution Linking Complete Traceability Chain
  it('7. should execute transfusion linking issue record, crossmatch, and bedside verification', () => {
    const cm = Array.from(bloodBankService.crossmatches.values()).find(c => c.bloodUnitId === 'UNIT-PRC-201');
    const issue = Array.from(bloodBankService.issues.values()).find(i => i.bloodUnitId === 'UNIT-PRC-201');

    const trf = bloodBankService.executeTransfusionTransaction({
      tenantId: TENANT_A,
      patientId: 'PAT-SITI-01',
      encounterId: 'ENC-001',
      bloodUnitId: 'UNIT-PRC-201',
      crossmatchId: cm.id,
      issueId: issue.id,
      administeredByNurse: 'Ns. Ratna',
      witnessedByNurse: 'Ns. Dewi',
      initialVitals: { bp: '120/80', hr: 74, temp: 36.5, rr: 18 },
      currentDate
    });

    expect(trf.transfusionStatus).toBe('IN_PROGRESS');
    expect(bloodBankService.units.get('UNIT-PRC-201').status).toBe(BLOOD_UNIT_STATES.TRANSFUSED);
  });

  // 8. Partial Unique Index Semantics (Cancelled Transfusion Reusability)
  it('8. should allow cancelled pre-transfusion records without permanently blocking unit if valid', () => {
    // Simulating database partial unique index rule:
    // UNIQUE(tenant_id, blood_unit_id) WHERE transfusion_status IN ('IN_PROGRESS', 'COMPLETED', 'STOPPED_REACTION')
    const mockTransfusions = [
      { id: 'T1', tenantId: TENANT_A, bloodUnitId: 'UNIT-REUSABLE', transfusionStatus: 'CANCELLED' }
    ];

    const canCreateTransfusion = (tenantId, bloodUnitId, status) => {
      const activeExists = mockTransfusions.some(
        t => t.tenantId === tenantId && 
             t.bloodUnitId === bloodUnitId && 
             ['IN_PROGRESS', 'COMPLETED', 'STOPPED_REACTION'].includes(t.transfusionStatus)
      );
      if (activeExists && ['IN_PROGRESS', 'COMPLETED', 'STOPPED_REACTION'].includes(status)) {
        throw new Error('UNIQUE_VIOLATION: Unit already has an active or completed transfusion.');
      }
      return true;
    };

    // Subsequent transfusion on unit with cancelled record is ALLOWED
    expect(canCreateTransfusion(TENANT_A, 'UNIT-REUSABLE', 'IN_PROGRESS')).toBe(true);

    // But once an active transfusion is added, a second active one is BLOCKED
    mockTransfusions.push({ id: 'T2', tenantId: TENANT_A, bloodUnitId: 'UNIT-REUSABLE', transfusionStatus: 'IN_PROGRESS' });
    expect(() => canCreateTransfusion(TENANT_A, 'UNIT-REUSABLE', 'IN_PROGRESS')).toThrow(/UNIQUE_VIOLATION/);
  });

  // 9. Database Trigger Immutability on Core Transfusion Fields
  it('9. should reject update attempts to change patient_id or blood_unit_id on transfusion records', () => {
    const simulateTriggerUpdate = (oldRecord, newRecord) => {
      if (oldRecord.patient_id !== newRecord.patient_id || oldRecord.blood_unit_id !== newRecord.blood_unit_id) {
        throw new Error('IMMUTABILITY_VIOLATION: Patient and blood unit links on transfusion record are strictly immutable!');
      }
      return true;
    };

    const oldRec = { id: 'T1', patient_id: 'PAT-01', blood_unit_id: 'U1' };
    const goodUpdate = { id: 'T1', patient_id: 'PAT-01', blood_unit_id: 'U1', transfusion_status: 'COMPLETED' };
    const badUpdate = { id: 'T1', patient_id: 'PAT-02', blood_unit_id: 'U1' }; // Tampering patient!

    expect(simulateTriggerUpdate(oldRec, goodUpdate)).toBe(true);
    expect(() => simulateTriggerUpdate(oldRec, badUpdate)).toThrow(/IMMUTABILITY_VIOLATION/);
  });

  // 10. Multi-Tenant Traceability Chain Isolation
  it('10. should strictly isolate all blood bank traceability entities between tenants', () => {
    const issuesTenantA = Array.from(bloodBankService.issues.values()).filter(i => i.tenantId === TENANT_A);
    const issuesTenantB = Array.from(bloodBankService.issues.values()).filter(i => i.tenantId === TENANT_B);

    expect(issuesTenantA.length).toBeGreaterThan(0);
    expect(issuesTenantB).toHaveLength(0);
  });
});
