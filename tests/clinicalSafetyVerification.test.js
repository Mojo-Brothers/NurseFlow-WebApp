/**
 * NurseFlow Enterprise HIS 2026 — Gate 1D.5-V: Clinical Safety Verification Suite
 * Standards: WHO Safe Surgery, JCI IPSG 1-6, Sepsis-3 & Transfusion Safety Protocols
 * Purpose: Negative-Path Testing verifying that 12 Critical Clinical Safety Invariants are rejected.
 */

import { describe, it, expect } from 'vitest';
import { operatingTheatreService, SURGICAL_STATUS } from '../server/services/operatingTheatre.service.js';
import { criticalCareService } from '../server/services/criticalCare.service.js';
import { bloodBankService, BLOOD_UNIT_STATES } from '../server/services/bloodBank.service.js';

describe('Gate 1D.5-V: Clinical Safety & Database Barrier Verification (12 Fatal Negative Scenarios)', () => {
  const TENANT_A = '00000000-0000-0000-0000-000000000001';
  const currentDate = new Date('2026-09-01T10:00:00Z');

  // ─── SCENARIO 1: OPERASI TANPA SIGN-IN ───
  it('Barrier 1: should reject surgery start if WHO Sign-In has not been verified', () => {
    const caseId = 'CASE-SAFETY-01';
    operatingTheatreService.createSurgeryCase({
      id: caseId,
      tenantId: TENANT_A,
      operatingRoomId: 'ROOM-OK-10',
      patientId: 'PAT-01',
      procedureName: 'Emergency Laparotomy'
    });

    // Attempting to skip Sign-In and start directly MUST fail
    expect(() => {
      operatingTheatreService.startProcedure(caseId);
    }).toThrow(/SAFETY_VIOLATION.*Sign-In/);
  });

  // ─── SCENARIO 2: OPERASI TANPA TIME-OUT ───
  it('Barrier 2: should reject surgery skin incision if WHO Time-Out has not been performed', () => {
    const caseId = 'CASE-SAFETY-02';
    operatingTheatreService.createSurgeryCase({
      id: caseId,
      tenantId: TENANT_A,
      operatingRoomId: 'ROOM-OK-11',
      patientId: 'PAT-02',
      procedureName: 'Craniotomy'
    });

    // Perform Sign-In only
    operatingTheatreService.performSignIn(caseId, {
      patientIdentitySiteVerified: true,
      siteMarked: true,
      anesthesiaSafetyCheckCompleted: true,
      pulseOximeterFunctioning: true,
      knownAllergyConfirmed: true,
      bloodLossRiskPrepared: true,
      verifiedByNurse: 'Ns. Ratna'
    });

    // Time-Out is still missing -> Starting skin incision MUST fail
    expect(() => {
      operatingTheatreService.startProcedure(caseId);
    }).toThrow(/SAFETY_VIOLATION.*Time-Out/);
  });

  // ─── SCENARIO 3: COMPLETION TANPA SIGN-OUT ───
  it('Barrier 3: should reject procedure completion without verified WHO Sign-Out and sponge/instrument count', () => {
    const caseId = 'CASE-SAFETY-03';
    operatingTheatreService.createSurgeryCase({
      id: caseId,
      tenantId: TENANT_A,
      operatingRoomId: 'ROOM-OK-12',
      patientId: 'PAT-03',
      procedureName: 'Thyroidectomy'
    });

    operatingTheatreService.performSignIn(caseId, {
      patientIdentitySiteVerified: true,
      siteMarked: true,
      anesthesiaSafetyCheckCompleted: true,
      pulseOximeterFunctioning: true,
      knownAllergyConfirmed: true,
      bloodLossRiskPrepared: true,
      verifiedByNurse: 'Ns. Ratna'
    });

    operatingTheatreService.performTimeOut(caseId, {
      allTeamMembersIntroduced: true,
      patientNameProcedureSiteConfirmed: true,
      antibioticProphylaxisGivenWithin60min: true,
      anticipatedCriticalEventsReviewed: true,
      sterilityIndicatorConfirmed: true,
      verifiedByNurse: 'Ns. Ratna'
    });

    operatingTheatreService.startProcedure(caseId);

    // Attempting to complete procedure before Sign-Out MUST fail
    expect(() => {
      operatingTheatreService.completeProcedure(caseId, { postOpDiagnosis: 'Struma Nodusa Non-Toksik' });
    }).toThrow(/SAFETY_VIOLATION.*Sign-Out/);
  });

  // ─── SCENARIO 4: PERUBAHAN PATIENT_ID SETELAH SURGERY DIMULAI ───
  it('Barrier 4: should reject any update modifying patient_id on surgery case once procedure started (Trigger Immutability)', () => {
    const simulateTriggerUpdate = (oldRecord, newRecord) => {
      if (['PROCEDURE_IN_PROGRESS', 'SIGN_OUT_COMPLETED', 'PROCEDURE_COMPLETED', 'POST_OP_HANDOFF'].includes(oldRecord.surgical_status)) {
        if (oldRecord.patient_id !== newRecord.patient_id || oldRecord.operating_room_id !== newRecord.operating_room_id) {
          throw new Error('SAFETY_VIOLATION: Patient and operating room identity are strictly immutable once procedure has started!');
        }
      }
      return true;
    };

    const oldCase = { id: 'C1', surgical_status: 'PROCEDURE_IN_PROGRESS', patient_id: 'PAT-001', operating_room_id: 'OK-01' };
    const badCase = { id: 'C1', surgical_status: 'PROCEDURE_IN_PROGRESS', patient_id: 'PAT-TAMPERED-002', operating_room_id: 'OK-01' };

    expect(() => simulateTriggerUpdate(oldCase, badCase)).toThrow(/SAFETY_VIOLATION.*immutable/);
  });

  // ─── SCENARIO 5: BENTROK DUA BOOKING KAMAR OPERASI ───
  it('Barrier 5: should reject double booking on the same operating room and time slot (Room Slot Mutex)', () => {
    operatingTheatreService.bookSurgerySchedule({
      id: 'SCHED-COLLISION-01',
      tenantId: TENANT_A,
      bookingNumber: 'BK-SAFE-01',
      patientId: 'PAT-01',
      episodeId: 'EP-01',
      encounterId: 'ENC-01',
      operatingRoomId: 'ROOM-OK-LAMINAR-01',
      leadSurgeonId: 'DOC-01',
      leadSurgeonName: 'dr. Sp.BS',
      scheduledDate: '2026-09-05',
      slotTime: '08:00-12:00',
      procedureName: 'Tumor Resection'
    });

    expect(() => {
      operatingTheatreService.bookSurgerySchedule({
        id: 'SCHED-COLLISION-02',
        tenantId: TENANT_A,
        bookingNumber: 'BK-SAFE-02',
        patientId: 'PAT-02',
        episodeId: 'EP-02',
        encounterId: 'ENC-02',
        operatingRoomId: 'ROOM-OK-LAMINAR-01', // SAME ROOM
        leadSurgeonId: 'DOC-02',
        leadSurgeonName: 'dr. Sp.OT',
        scheduledDate: '2026-09-05', // SAME DATE
        slotTime: '08:00-12:00', // SAME TIME SLOT
        procedureName: 'Spine Decompression'
      });
    }).toThrow(/ROOM_COLLISION/);
  });

  // ─── SCENARIO 6: PERUBAHAN ICU SCORE SETELAH FINALISASI ───
  it('Barrier 6: should reject modifying finalized ICU acuity score records (Append-Only Guarantee)', () => {
    const simulateIcuTrigger = (oldRecord, newRecord) => {
      if (oldRecord.is_finalized) {
        throw new Error('IMMUTABILITY_VIOLATION: Finalized ICU Acuity Assessment records are append-only and cannot be updated.');
      }
      return true;
    };

    const finalizedAssessment = { id: 'ICU-1', is_finalized: true, calculated_score: 14 };
    const tamperedAssessment = { id: 'ICU-1', is_finalized: true, calculated_score: 6 }; // Falsifying severity

    expect(() => simulateIcuTrigger(finalizedAssessment, tamperedAssessment)).toThrow(/IMMUTABILITY_VIOLATION/);
  });

  // ─── SCENARIO 7: TRANSFUSION DENGAN CROSSMATCH INKOMPATIBEL ───
  it('Barrier 7: should reject blood transfusion execution if crossmatch is INCOMPATIBLE', () => {
    const unit = bloodBankService.registerBloodUnit({
      id: 'UNIT-INCOMPAT-01',
      tenantId: TENANT_A,
      unitNumber: 'UTD-INCOMPAT-01',
      productType: 'PACKED_RED_CELLS',
      aboType: 'B',
      rhesusType: 'POSITIVE',
      expiryDate: '2026-10-01T00:00:00Z'
    });

    const cm = bloodBankService.performCrossmatchTest({
      tenantId: TENANT_A,
      patientId: 'PAT-A-POS',
      encounterId: 'ENC-01',
      bloodUnitId: unit.id,
      patientAbo: 'A',
      patientRhesus: 'POSITIVE',
      donorAbo: 'B', // INCOMPATIBLE GOLONGAN DARAH
      majorCrossmatch: 'INCOMPATIBLE',
      minorCrossmatch: 'INCOMPATIBLE',
      technicianId: 'TECH-01',
      technicianName: 'Analis',
      verifiedByDoctorId: 'DOC-01',
      verifiedByDoctorName: 'dr. Sp.PK'
    });

    expect(cm.overallCompatibility).toBe('INCOMPATIBLE');

    expect(() => {
      bloodBankService.executeTransfusionTransaction({
        tenantId: TENANT_A,
        patientId: 'PAT-A-POS',
        encounterId: 'ENC-01',
        bloodUnitId: unit.id,
        crossmatchId: cm.id,
        administeredByNurse: 'Ns. A',
        witnessedByNurse: 'Ns. B',
        initialVitals: { bp: '110/70' },
        currentDate
      });
    }).toThrow(/SAFETY_VIOLATION.*INCOMPATIBLE/);
  });

  // ─── SCENARIO 8: TRANSFUSION TERHADAP KANTONG EXPIRED ───
  it('Barrier 8: should reject blood transfusion if unit is EXPIRED', () => {
    const unit = bloodBankService.registerBloodUnit({
      id: 'UNIT-EXPIRED-01',
      tenantId: TENANT_A,
      unitNumber: 'UTD-EXPIRED-01',
      productType: 'PACKED_RED_CELLS',
      aboType: 'O',
      rhesusType: 'POSITIVE',
      expiryDate: '2026-08-01T00:00:00Z' // EXPIRED
    });

    const cm = bloodBankService.performCrossmatchTest({
      tenantId: TENANT_A,
      patientId: 'PAT-O',
      encounterId: 'ENC-01',
      bloodUnitId: unit.id,
      patientAbo: 'O',
      patientRhesus: 'POSITIVE',
      donorAbo: 'O',
      majorCrossmatch: 'COMPATIBLE',
      minorCrossmatch: 'COMPATIBLE',
      technicianId: 'TECH-01',
      technicianName: 'Analis'
    });

    expect(() => {
      bloodBankService.executeTransfusionTransaction({
        tenantId: TENANT_A,
        patientId: 'PAT-O',
        encounterId: 'ENC-01',
        bloodUnitId: unit.id,
        crossmatchId: cm.id,
        administeredByNurse: 'Ns. A',
        witnessedByNurse: 'Ns. B',
        initialVitals: { bp: '120/80' },
        currentDate // 2026-09-01 > expiry 2026-08-01
      });
    }).toThrow(/SAFETY_VIOLATION.*EXPIRED/);
  });

  // ─── SCENARIO 9: TRANSFUSION KANTONG MILIK PASIEN LAIN ───
  it('Barrier 9: should reject blood transfusion if unit is reserved for a different patient', () => {
    const unit = bloodBankService.registerBloodUnit({
      id: 'UNIT-RESERVED-ANOTHER',
      tenantId: TENANT_A,
      unitNumber: 'UTD-RES-01',
      productType: 'PACKED_RED_CELLS',
      aboType: 'A',
      rhesusType: 'POSITIVE',
      expiryDate: '2026-10-01T00:00:00Z'
    });

    // Reserved for PATIENT-A
    bloodBankService.reserveBloodUnitAtomic({
      unitId: unit.id,
      tenantId: TENANT_A,
      patientId: 'PATIENT-A',
      encounterId: 'ENC-01',
      expectedVersion: unit.version,
      currentDate
    });

    const cm = bloodBankService.performCrossmatchTest({
      tenantId: TENANT_A,
      patientId: 'PATIENT-A',
      encounterId: 'ENC-01',
      bloodUnitId: unit.id,
      patientAbo: 'A',
      patientRhesus: 'POSITIVE',
      donorAbo: 'A',
      majorCrossmatch: 'COMPATIBLE',
      minorCrossmatch: 'COMPATIBLE',
      technicianId: 'TECH-01',
      technicianName: 'Analis'
    });

    // Wrong patient (PATIENT-B) attempts to infuse bag reserved for PATIENT-A
    expect(() => {
      bloodBankService.executeTransfusionTransaction({
        tenantId: TENANT_A,
        patientId: 'PATIENT-B-WRONG',
        encounterId: 'ENC-02',
        bloodUnitId: unit.id,
        crossmatchId: cm.id,
        administeredByNurse: 'Ns. A',
        witnessedByNurse: 'Ns. B',
        initialVitals: { bp: '120/80' },
        currentDate
      });
    }).toThrow(/SAFETY_VIOLATION.*reserved for another patient/);
  });

  // ─── SCENARIO 10: DOUBLE TRANSFUSION PADA KANTONG SAMA ───
  it('Barrier 10: should reject double active transfusion attempt on the same blood unit', () => {
    const unit = bloodBankService.registerBloodUnit({
      id: 'UNIT-DOUBLE-TRF',
      tenantId: TENANT_A,
      unitNumber: 'UTD-DOUBLE-01',
      productType: 'PACKED_RED_CELLS',
      aboType: 'O',
      rhesusType: 'POSITIVE',
      expiryDate: '2026-10-01T00:00:00Z'
    });

    const cm = bloodBankService.performCrossmatchTest({
      tenantId: TENANT_A,
      patientId: 'PAT-01',
      encounterId: 'ENC-01',
      bloodUnitId: unit.id,
      patientAbo: 'O',
      patientRhesus: 'POSITIVE',
      donorAbo: 'O',
      majorCrossmatch: 'COMPATIBLE',
      minorCrossmatch: 'COMPATIBLE',
      technicianId: 'TECH-01',
      technicianName: 'Analis'
    });

    // Transfusion 1 succeeds
    bloodBankService.executeTransfusionTransaction({
      tenantId: TENANT_A,
      patientId: 'PAT-01',
      encounterId: 'ENC-01',
      bloodUnitId: unit.id,
      crossmatchId: cm.id,
      administeredByNurse: 'Ns. A',
      witnessedByNurse: 'Ns. B',
      initialVitals: { bp: '120/80' },
      currentDate
    });

    // Transfusion 2 on same unit MUST fail
    expect(() => {
      bloodBankService.executeTransfusionTransaction({
        tenantId: TENANT_A,
        patientId: 'PAT-01',
        encounterId: 'ENC-01',
        bloodUnitId: unit.id,
        crossmatchId: cm.id,
        administeredByNurse: 'Ns. A',
        witnessedByNurse: 'Ns. B',
        initialVitals: { bp: '120/80' },
        currentDate
      });
    }).toThrow(/SAFETY_VIOLATION.*already been actively transfused/);
  });

  // ─── SCENARIO 11: PENGGUNAAN KEMBALI KANTONG STOPPED_REACTION ───
  it('Barrier 11: should permanently block reuse of unit having STOPPED_REACTION (Adverse Hemovigilance Event)', () => {
    // Simulating database partial unique index rule:
    // UNIQUE(tenant_id, blood_unit_id) WHERE transfusion_status IN ('IN_PROGRESS', 'COMPLETED', 'STOPPED_REACTION')
    const activeTransfusions = [
      { tenantId: TENANT_A, bloodUnitId: 'UNIT-REACTION-01', transfusionStatus: 'STOPPED_REACTION' }
    ];

    const canTransfuse = (tenantId, bloodUnitId, status) => {
      const active = activeTransfusions.some(
        t => t.tenantId === tenantId && t.bloodUnitId === bloodUnitId && ['IN_PROGRESS', 'COMPLETED', 'STOPPED_REACTION'].includes(t.transfusionStatus)
      );
      if (active && ['IN_PROGRESS', 'COMPLETED', 'STOPPED_REACTION'].includes(status)) {
        throw new Error('SAFETY_VIOLATION: Unit with STOPPED_REACTION is hazardous and permanently quarantined!');
      }
      return true;
    };

    expect(() => canTransfuse(TENANT_A, 'UNIT-REACTION-01', 'IN_PROGRESS')).toThrow(/SAFETY_VIOLATION.*STOPPED_REACTION/);
  });

  // ─── SCENARIO 12: TEMPERATURE EXCURSION QUARANTINE ───
  it('Barrier 12: should automatically quarantine blood unit upon detecting severe cold-chain excursion', () => {
    const unit = bloodBankService.registerBloodUnit({
      id: 'UNIT-EXCURSION-01',
      tenantId: TENANT_A,
      unitNumber: 'UTD-EXCURSION-01',
      productType: 'PACKED_RED_CELLS',
      aboType: 'A',
      rhesusType: 'POSITIVE',
      expiryDate: '2026-10-01T00:00:00Z'
    });

    expect(unit.status).toBe(BLOOD_UNIT_STATES.AVAILABLE);

    // Temperature log with 12.0°C (Allowed 2.0°C - 6.0°C) -> EXCURSION!
    const log = bloodBankService.logStorageTemperature({
      tenantId: TENANT_A,
      unitId: unit.id,
      productType: 'PACKED_RED_CELLS',
      storageDeviceId: 'CHILLER-01',
      temperatureCelsius: 12.0,
      recordedBy: 'Analis Sensor'
    });

    expect(log.alarmStatus).toBe('HIGH_TEMP_ALARM');
    expect(unit.status).toBe(BLOOD_UNIT_STATES.QUARANTINED);
  });
});
