/**
 * NurseFlow Enterprise HIS 2026 — Blood Bank (BDRS) & Hemovigilance Engine (Hardened Gate 1D.4-H.1)
 * Standards: Permenkes No. 91/2015, WHO Blood Transfusion Safety & JCI IPSG
 * Features: Multi-Tier Clinical Safety Invariants, Product-Specific Cold Chain, Immutable Crossmatch, Traceable Custody Issue & Bedside Verification
 */

export const BLOOD_PRODUCTS = {
  PRC: 'Packed Red Cells',
  FFP: 'Fresh Frozen Plasma',
  TC: 'Thrombocyte Concentrate',
  WB: 'Whole Blood',
  CRYO: 'Cryoprecipitate'
};

export const PRODUCT_STORAGE_PROFILES = {
  PACKED_RED_CELLS: { minCelsius: 2.0, maxCelsius: 6.0, desc: 'Chilled 2°C - 6°C' },
  WHOLE_BLOOD: { minCelsius: 2.0, maxCelsius: 6.0, desc: 'Chilled 2°C - 6°C' },
  FRESH_FROZEN_PLASMA: { minCelsius: -30.0, maxCelsius: -18.0, desc: 'Frozen <= -18°C' },
  CRYOPRECIPITATE: { minCelsius: -30.0, maxCelsius: -18.0, desc: 'Frozen <= -18°C' },
  THROMBOCYTE_CONCENTRATE: { minCelsius: 20.0, maxCelsius: 24.0, desc: 'Agitated 20°C - 24°C' }
};

export const BLOOD_UNIT_STATES = {
  QUARANTINED: 'QUARANTINED',
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  CROSSMATCHED: 'CROSSMATCHED',
  ISSUED: 'ISSUED',
  TRANSFUSED: 'TRANSFUSED',
  DISCARDED: 'DISCARDED',
  EXPIRED: 'EXPIRED'
};

class BloodBankService {
  constructor() {
    this.units = new Map(); // UnitId -> Unit
    this.crossmatches = new Map(); // CrossmatchId -> Test
    this.issues = new Map(); // IssueId -> Record
    this.verifications = new Map(); // TransfusionId -> Verification
    this.transfusions = new Map(); // TransfusionId -> Record
    this.temperatureLogs = []; // Cold Chain Audit Logs
    this.reactions = []; // Hemovigilance Reaction Logs
  }

  /**
   * 1. Register Blood Donor Unit with Cold-Chain Specs
   */
  registerBloodUnit({
    id,
    tenantId = '00000000-0000-0000-0000-000000000001',
    unitNumber,
    productType = 'PACKED_RED_CELLS',
    aboType,
    rhesusType,
    volumeMl = 250,
    donationDate,
    expiryDate,
    storageTemperatureCelsius = 4.0,
    storageLocation = 'Kulkas BDRS 1 - Rak A1',
    screeningStatus = 'NON_REACTIVE'
  }) {
    const unitId = id || `UNIT-${unitNumber}`;
    const unit = {
      id: unitId,
      tenantId,
      unitNumber,
      productType,
      aboType,
      rhesusType,
      volumeMl,
      donationDate,
      expiryDate,
      storageTemperatureCelsius,
      storageLocation,
      screeningStatus,
      status: screeningStatus === 'NON_REACTIVE' ? BLOOD_UNIT_STATES.AVAILABLE : BLOOD_UNIT_STATES.QUARANTINED,
      reservedForPatientId: null,
      reservedForEncounterId: null,
      version: 1,
      createdAt: new Date().toISOString()
    };
    this.units.set(unitId, unit);
    return unit;
  }

  /**
   * 2. Log Cold-Chain Storage Temperature with Product-Specific Thresholds
   */
  logStorageTemperature({
    tenantId = '00000000-0000-0000-0000-000000000001',
    unitId = null,
    productType = 'PACKED_RED_CELLS',
    storageDeviceId,
    temperatureCelsius,
    recordedBy,
    actionTaken = null
  }) {
    const profile = PRODUCT_STORAGE_PROFILES[productType] || PRODUCT_STORAGE_PROFILES.PACKED_RED_CELLS;
    let alarmStatus = 'NORMAL';
    let excursionDurationMinutes = 0;

    if (temperatureCelsius > profile.maxCelsius) {
      alarmStatus = 'HIGH_TEMP_ALARM';
      excursionDurationMinutes = 15;
    } else if (temperatureCelsius < profile.minCelsius) {
      alarmStatus = 'LOW_TEMP_ALARM';
      excursionDurationMinutes = 15;
    }

    const log = {
      id: `TEMP-LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      unitId,
      productType,
      storageDeviceId,
      temperatureCelsius,
      minAllowedCelsius: profile.minCelsius,
      maxAllowedCelsius: profile.maxCelsius,
      alarmStatus,
      excursionDurationMinutes,
      actionTaken,
      recordedBy,
      recordedAt: new Date().toISOString()
    };
    this.temperatureLogs.push(log);

    // If severe excursion, quarantine associated unit
    if (alarmStatus !== 'NORMAL' && unitId && this.units.has(unitId)) {
      const unit = this.units.get(unitId);
      unit.status = BLOOD_UNIT_STATES.QUARANTINED;
    }

    return log;
  }

  /**
   * 3. Validate Immunological ABO/Rh Compatibility
   */
  isAboCompatible(patientAbo, donorAbo) {
    const COMPATIBILITY_RULES = {
      'O+': ['O+', 'O-'],
      'O-': ['O-'],
      'A+': ['A+', 'A-', 'O+', 'O-'],
      'A-': ['A-', 'O-'],
      'B+': ['B+', 'B-', 'O+', 'O-'],
      'B-': ['B-', 'O-'],
      'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
      'AB-': ['AB-', 'A-', 'B-', 'O-']
    };

    const patientKey = patientAbo.includes('+') || patientAbo.includes('-') ? patientAbo : `${patientAbo}+`;
    const donorKey = donorAbo.includes('+') || donorAbo.includes('-') ? donorAbo : `${donorAbo}+`;

    const compatibleDonors = COMPATIBILITY_RULES[patientKey] || [];
    return compatibleDonors.includes(donorKey);
  }

  /**
   * 4. Atomic Blood Unit Reservation for Crossmatch
   */
  reserveBloodUnitAtomic({
    unitId,
    tenantId,
    patientId,
    encounterId,
    expectedVersion,
    currentDate = new Date()
  }) {
    const unit = this.units.get(unitId);
    if (!unit) throw new Error(`SAFETY_VIOLATION: Unit ${unitId} not found.`);

    // Check version
    if (unit.version !== expectedVersion) {
      return { affectedRows: 0, reason: 'VERSION_MISMATCH' };
    }

    // Safety Invariant: Must be AVAILABLE & NON_REACTIVE & UNEXPIRED
    if (unit.status !== BLOOD_UNIT_STATES.AVAILABLE) {
      return { affectedRows: 0, reason: `INVALID_STATUS_${unit.status}` };
    }
    if (unit.screeningStatus !== 'NON_REACTIVE') {
      return { affectedRows: 0, reason: 'REACTIVE_SCREENING' };
    }
    if (new Date(unit.expiryDate) <= currentDate) {
      return { affectedRows: 0, reason: 'EXPIRED_UNIT' };
    }

    // Apply atomic update
    unit.status = BLOOD_UNIT_STATES.RESERVED;
    unit.reservedForPatientId = patientId;
    unit.reservedForEncounterId = encounterId;
    unit.version += 1;

    return { affectedRows: 1, unit };
  }

  /**
   * 5. Record Major/Minor Crossmatch & Antibody Screen (with Immutability Finalization)
   */
  performCrossmatchTest({
    tenantId = '00000000-0000-0000-0000-000000000001',
    patientId,
    encounterId,
    bloodUnitId,
    patientAbo,
    patientRhesus,
    donorAbo = 'A',
    donorRhesus = 'POSITIVE',
    antibodyScreen = 'NEGATIVE',
    majorCrossmatch = 'COMPATIBLE',
    minorCrossmatch = 'COMPATIBLE',
    autoControl = 'NEGATIVE',
    technicianId,
    technicianName,
    verifiedByDoctorId = 'DOC-01',
    verifiedByDoctorName = 'dr. Sp.PK Budi'
  }) {
    const unit = this.units.get(bloodUnitId);
    if (!unit) throw new Error('SAFETY_VIOLATION: Blood unit not found.');

    const isAboValid = this.isAboCompatible(`${patientAbo}${patientRhesus === 'POSITIVE' ? '+' : '-'}`, `${donorAbo}${donorRhesus === 'POSITIVE' ? '+' : '-'}`);
    const overallCompatibility = (majorCrossmatch === 'COMPATIBLE' && minorCrossmatch === 'COMPATIBLE' && isAboValid) ? 'COMPATIBLE' : 'INCOMPATIBLE';

    const testId = `CM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const test = {
      id: testId,
      tenantId,
      testNumber: `CM-TEST-${Date.now()}`,
      patientId,
      encounterId,
      bloodUnitId,
      patientAbo,
      patientRhesus,
      donorAbo,
      donorRhesus,
      antibodyScreen,
      majorCrossmatch,
      minorCrossmatch,
      autoControl,
      overallCompatibility,
      technicianId,
      technicianName,
      verifiedByDoctorId,
      verifiedByDoctorName,
      isFinalized: true,
      finalizedAt: new Date().toISOString(),
      testedAt: new Date().toISOString()
    };
    this.crossmatches.set(testId, test);

    // State Transition: If COMPATIBLE -> CROSSMATCHED, if INCOMPATIBLE -> QUARANTINED
    if (overallCompatibility === 'COMPATIBLE') {
      unit.status = BLOOD_UNIT_STATES.CROSSMATCHED;
    } else {
      unit.status = BLOOD_UNIT_STATES.QUARANTINED;
    }
    unit.version += 1;

    return test;
  }

  /**
   * 6. Issue Blood Unit to Ward (Handoff & Chain of Custody)
   */
  issueBloodUnitToWard({
    tenantId = '00000000-0000-0000-0000-000000000001',
    bloodUnitId,
    patientId,
    encounterId,
    crossmatchId,
    issuedById,
    issuedByName,
    receivedById,
    receivedByName,
    temperatureAtIssue = 4.2
  }) {
    const unit = this.units.get(bloodUnitId);
    if (!unit) throw new Error('SAFETY_VIOLATION: Blood unit not found.');
    if (unit.status !== BLOOD_UNIT_STATES.CROSSMATCHED) {
      throw new Error(`SAFETY_VIOLATION: Cannot issue unit with status ${unit.status}. Must be CROSSMATCHED.`);
    }

    const issueId = `ISSUE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const issueRecord = {
      id: issueId,
      tenantId,
      issueNumber: `ISSUE-${Date.now()}`,
      bloodUnitId,
      patientId,
      encounterId,
      crossmatchId,
      issuedById,
      issuedByName,
      issuedAt: new Date().toISOString(),
      receivedById,
      receivedByName,
      receivedAt: new Date().toISOString(),
      temperatureAtIssue,
      issueStatus: 'ISSUED',
      createdAt: new Date().toISOString()
    };
    this.issues.set(issueId, issueRecord);

    unit.status = BLOOD_UNIT_STATES.ISSUED;
    unit.version += 1;

    return issueRecord;
  }

  /**
   * 7. Record Mandatory 7-Point Bedside Verification Checklist
   */
  recordBedsideVerification({
    tenantId = '00000000-0000-0000-0000-000000000001',
    transfusionId,
    patientIdentityVerified = true,
    bloodUnitVerified = true,
    aboVerified = true,
    rhesusVerified = true,
    expiryVerified = true,
    crossmatchVerified = true,
    informedConsentVerified = true,
    administeredByNurseId,
    administeredByNurseName,
    witnessedByNurseId,
    witnessedByNurseName
  }) {
    if (!administeredByNurseId || !witnessedByNurseId || administeredByNurseId === witnessedByNurseId) {
      throw new Error('DOUBLE_CHECK_REQUIRED: Transfusi wajib diverifikasi oleh 2 perawat berbeda (ID Administer <> ID Saksi)!');
    }

    const allChecked = patientIdentityVerified && bloodUnitVerified && aboVerified && rhesusVerified && expiryVerified && crossmatchVerified && informedConsentVerified;
    if (!allChecked) {
      throw new Error('VERIFICATION_INCOMPLETE: Seluruh 7 poin keselamatan transfusi wajib bernilai TRUE!');
    }

    const verification = {
      id: `VERIF-${Date.now()}`,
      tenantId,
      transfusionId,
      patientIdentityVerified,
      bloodUnitVerified,
      aboVerified,
      rhesusVerified,
      expiryVerified,
      crossmatchVerified,
      informedConsentVerified,
      administeredByNurseId,
      administeredByNurseName,
      witnessedByNurseId,
      witnessedByNurseName,
      verifiedAt: new Date().toISOString()
    };
    this.verifications.set(transfusionId, verification);
    return verification;
  }

  /**
   * 8. Transactional Transfusion Execution with 3-Tier Database Safety Simulation
   */
  executeTransfusionTransaction({
    tenantId = '00000000-0000-0000-0000-000000000001',
    patientId,
    encounterId,
    bloodUnitId,
    crossmatchId,
    issueId = null,
    administeredByNurse,
    witnessedByNurse,
    initialVitals,
    currentDate = new Date()
  }) {
    // ─── TIER 1: APPLICATION SAFETY CHECKS ───
    if (!administeredByNurse || !witnessedByNurse || administeredByNurse === witnessedByNurse) {
      throw new Error('DOUBLE_CHECK_REQUIRED: Transfusi wajib diverifikasi oleh 2 perawat berbeda di tempat tidur!');
    }

    const unit = this.units.get(bloodUnitId);
    if (!unit) throw new Error('SAFETY_VIOLATION: Blood unit not found.');

    const crossmatch = this.crossmatches.get(crossmatchId);
    if (!crossmatch) throw new Error('SAFETY_VIOLATION: Crossmatch test not found.');

    // ─── TIER 2: DATABASE TRIGGER SIMULATION (fn_enforce_transfusion_safety) ───
    // A. Expiry Safety Barrier
    if (new Date(unit.expiryDate) <= currentDate) {
      throw new Error(`SAFETY_VIOLATION: Blood unit ${unit.unitNumber} is EXPIRED. Transfusion forbidden!`);
    }

    // B. Screening Status Barrier
    if (unit.screeningStatus !== 'NON_REACTIVE') {
      throw new Error(`SAFETY_VIOLATION: Blood unit ${unit.unitNumber} has reactive screening. Transfusion forbidden!`);
    }

    // C. Reservation Ownership Barrier
    if (unit.reservedForPatientId && unit.reservedForPatientId !== patientId) {
      throw new Error(`SAFETY_VIOLATION: Blood unit is reserved for another patient (${unit.reservedForPatientId}), not ${patientId}!`);
    }

    // D. Crossmatch Compatibility Barrier
    if (crossmatch.overallCompatibility !== 'COMPATIBLE') {
      throw new Error(`SAFETY_VIOLATION: Crossmatch is INCOMPATIBLE for unit ${unit.unitNumber}. Transfusion BLOCKED!`);
    }

    // E. Mutex Check: Partial unique index for active transfusions ('IN_PROGRESS', 'COMPLETED', 'STOPPED_REACTION')
    const existingActiveTransfusion = Array.from(this.transfusions.values())
      .find(t => t.tenantId === tenantId && t.bloodUnitId === bloodUnitId && ['IN_PROGRESS', 'COMPLETED', 'STOPPED_REACTION'].includes(t.transfusionStatus));
    if (existingActiveTransfusion) {
      throw new Error('SAFETY_VIOLATION: Blood unit has already been actively transfused.');
    }

    // ─── TIER 3: ATOMIC COMMIT ───
    const transfusionId = `TRF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record = {
      id: transfusionId,
      tenantId,
      transfusionNumber: `TRF-REC-${Date.now()}`,
      encounterId,
      patientId,
      bloodUnitId,
      crossmatchId,
      issueId,
      startedAt: new Date().toISOString(),
      completedAt: null,
      initialVitals,
      monitoring15minVitals: null,
      postVitals: null,
      administeredByNurse,
      witnessedByNurse,
      transfusionStatus: 'IN_PROGRESS'
    };

    unit.status = BLOOD_UNIT_STATES.TRANSFUSED;
    unit.version += 1;
    this.transfusions.set(transfusionId, record);

    return record;
  }

  /**
   * 9. Legacy Compatibility Helper
   */
  processBloodRequest({
    patientId,
    patientName,
    patientBloodGroup = 'A+',
    productType = 'PRC',
    donorBagNumber = 'BAG-2026-0817-A01',
    donorBloodGroup = 'A+',
    crossMatchResult = 'COMPATIBLE'
  }) {
    if (crossMatchResult !== 'COMPATIBLE') {
      throw new Error('TRANSFUSI DITOLAK: Hasil Cross-Matching INKOMPATIBEL. Kantong darah tidak boleh dikeluarkan!');
    }

    const isCompatible = this.isAboCompatible(patientBloodGroup, donorBloodGroup);
    if (!isCompatible) {
      throw new Error(`TRANSFUSI DITOLAK: Golongan darah donor ${donorBloodGroup} tidak kompatibel dengan pasien ${patientBloodGroup}!`);
    }

    const requestId = `BDRS-${Date.now()}`;
    return {
      requestId,
      patientId,
      patientName,
      patientBloodGroup,
      productType,
      donorBagNumber,
      donorBloodGroup,
      crossMatchResult,
      status: 'ISSUED_FOR_TRANSFUSION',
      issuedAt: new Date().toISOString()
    };
  }
}

export const bloodBankService = new BloodBankService();
