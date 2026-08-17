/**
 * NurseFlow Enterprise HIS 2026 — Clinical Workforce, Credentialing, Privileging & Roster Authorization Engine (Gate 1D.6)
 * Standards: JCI Governance, Leadership & Direction (GLD), KARS KPS & Permenkes No. 755/2011 (Komite Medik & SPK/RKK)
 * Features: STR/SIP Effective Dating, Clinical Privileging (SPK/RKK), Shift & On-Call Rosters, Multi-Factor Clinical Authorization Engine
 */

export const SHIFT_TYPES = {
  PAGI: { code: 'PAGI', name: 'Shift Pagi', startTime: '07:00', endTime: '14:00', hours: 7 },
  SIANG: { code: 'SIANG', name: 'Shift Siang', startTime: '14:00', endTime: '21:00', hours: 7 },
  MALAM: { code: 'MALAM', name: 'Shift Malam', startTime: '21:00', endTime: '07:00', hours: 10 },
  ON_CALL: { code: 'ON_CALL', name: 'On-Call Dokter Spesialis', startTime: '00:00', endTime: '23:59', hours: 24 }
};

export const STAFF_CATEGORIES = {
  SPECIALIST_DOCTOR: 'SPECIALIST_DOCTOR',
  GENERAL_PRACTITIONER: 'GENERAL_PRACTITIONER',
  REGISTERED_NURSE: 'REGISTERED_NURSE',
  CLINICAL_PHARMACIST: 'CLINICAL_PHARMACIST',
  LAB_TECHNICIAN: 'LAB_TECHNICIAN',
  RADIOGRAPHER: 'RADIOGRAPHER'
};

export const PRIVILEGE_LEVELS = {
  INDEPENDENT: 'INDEPENDENT',
  UNDER_SUPERVISION: 'UNDER_SUPERVISION',
  EMERGENCY_ONLY: 'EMERGENCY_ONLY',
  PROCTORSHIP: 'PROCTORSHIP'
};

class StaffSchedulingService {
  constructor() {
    this.staffProfiles = new Map(); // StaffId -> Profile
    this.credentials = new Map(); // CredentialId -> Credential
    this.privileges = new Map(); // PrivilegeId -> Privilege
    this.rosters = new Map(); // RosterId -> Roster
    this.shiftAssignments = new Map(); // AssignmentId -> Shift
    this.onCallSchedules = new Map(); // OnCallId -> Schedule
    this.authorizationLogs = []; // Authorization Audit Trail
    this.rosterAssignments = new Map(); // Legacy key: Date_StaffId -> Assignment
  }

  /**
   * 1. Register Clinical Staff Profile
   */
  registerStaffProfile({
    id,
    tenantId = '00000000-0000-0000-0000-000000000001',
    userId = null,
    staffNumber,
    fullName,
    titlePrefix = null,
    titleSuffix = null,
    staffCategory = STAFF_CATEGORIES.SPECIALIST_DOCTOR,
    primarySpecialty,
    subSpecialty = null,
    primaryDepartmentId,
    employmentStatus = 'PERMANENT',
    isActive = true
  }) {
    const staffId = id || `STAFF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const profile = {
      id: staffId,
      tenantId,
      userId,
      staffNumber: staffNumber || `STF-${Date.now()}`,
      fullName,
      titlePrefix,
      titleSuffix,
      staffCategory,
      primarySpecialty,
      subSpecialty,
      primaryDepartmentId,
      employmentStatus,
      isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.staffProfiles.set(staffId, profile);
    return profile;
  }

  /**
   * 2. Register Staff Credential / License with Effective Dating
   */
  registerCredential({
    id,
    tenantId = '00000000-0000-0000-0000-000000000001',
    staffId,
    credentialType = 'STR',
    credentialNumber,
    issuingAuthority = 'KKI',
    issuedAt,
    validFrom,
    validUntil,
    verificationStatus = 'ACTIVE_VERIFIED',
    verifiedBy = 'Admin SDM & Kredensial',
    revokedAt = null,
    revocationReason = null
  }) {
    const staff = this.staffProfiles.get(staffId);
    if (!staff) throw new Error(`Staff profile ${staffId} tidak ditemukan.`);

    if (new Date(validUntil) < new Date(validFrom)) {
      throw new Error('INVALID_DATES: Tanggal kedaluwarsa lisensi (validUntil) tidak boleh mendahului tanggal mulai (validFrom)!');
    }

    const credId = id || `CRED-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const credential = {
      id: credId,
      tenantId,
      staffId,
      credentialType,
      credentialNumber,
      issuingAuthority,
      issuedAt: new Date(issuedAt).toISOString().split('T')[0],
      validFrom: new Date(validFrom).toISOString().split('T')[0],
      validUntil: new Date(validUntil).toISOString().split('T')[0],
      verificationStatus,
      verifiedAt: verificationStatus === 'ACTIVE_VERIFIED' ? new Date().toISOString() : null,
      verifiedBy,
      revokedAt,
      revocationReason,
      createdAt: new Date().toISOString()
    };

    this.credentials.set(credId, credential);
    return credential;
  }

  /**
   * 3. Grant Clinical Privilege (SPK / RKK - Surat Penugasan Klinis)
   */
  grantClinicalPrivilege({
    id,
    tenantId = '00000000-0000-0000-0000-000000000001',
    staffId,
    departmentId,
    procedureCode,
    procedureName,
    privilegeLevel = PRIVILEGE_LEVELS.INDEPENDENT,
    effectiveFrom,
    effectiveUntil,
    privilegeStatus = 'ACTIVE',
    approvedByKomiteMedikId = 'KOM-MED-01',
    approvedByKomiteMedikName = 'Ketua Komite Medik dr. Sp.B',
    spkDocumentNumber = 'SPK-2026-001'
  }) {
    const staff = this.staffProfiles.get(staffId);
    if (!staff) throw new Error(`Staff profile ${staffId} tidak ditemukan.`);

    if (new Date(effectiveUntil) < new Date(effectiveFrom)) {
      throw new Error('INVALID_DATES: Tanggal akhir kewenangan klinis tidak boleh mendahului tanggal mulai!');
    }

    // Safety Trigger Simulation: Wajib memiliki STR/SIP aktif pada rentang tanggal tersebut
    const effFromDate = new Date(effectiveFrom);
    const hasValidLicense = Array.from(this.credentials.values()).some(
      c => c.tenantId === tenantId &&
           c.staffId === staffId &&
           ['STR', 'SIP'].includes(c.credentialType) &&
           c.verificationStatus === 'ACTIVE_VERIFIED' &&
           !c.revokedAt &&
           effFromDate >= new Date(c.validFrom) &&
           effFromDate <= new Date(c.validUntil)
    );

    if (!hasValidLicense) {
      throw new Error('AUTHORIZATION_DENIED: Clinician does NOT have an active, verified STR/SIP covering the privilege effective date!');
    }

    const privId = id || `PRIV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const privilege = {
      id: privId,
      tenantId,
      staffId,
      departmentId,
      procedureCode,
      procedureName,
      privilegeLevel,
      effectiveFrom: new Date(effectiveFrom).toISOString().split('T')[0],
      effectiveUntil: new Date(effectiveUntil).toISOString().split('T')[0],
      privilegeStatus,
      approvedByKomiteMedikId,
      approvedByKomiteMedikName,
      spkDocumentNumber,
      grantedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    this.privileges.set(privId, privilege);
    return privilege;
  }

  /**
   * 4. Assign Shift with Overlap & Double-Booking Barrier
   */
  assignShift({
    id,
    tenantId = '00000000-0000-0000-0000-000000000001',
    rosterId = null,
    staffId,
    staffName,
    role = null,
    departmentId = 'DEPT-IRJ',
    date,
    shiftCode,
    unitId = 'UNIT-POLI-01',
    unitName = 'Poli Spesialis Penyakit Dalam'
  }) {
    const shift = SHIFT_TYPES[shiftCode];
    if (!shift) throw new Error(`Shift ${shiftCode} tidak terdaftar dalam sistem.`);

    const shiftDateStr = new Date(date).toISOString().split('T')[0];

    // Check conflict: Staff cannot have duplicate active shift on the same date & shift code
    const existingShift = Array.from(this.shiftAssignments.values()).find(
      s => s.tenantId === tenantId &&
           s.staffId === staffId &&
           s.shiftDate === shiftDateStr &&
           ['SCHEDULED', 'CHECKED_IN'].includes(s.assignmentStatus)
    );

    if (existingShift) {
      throw new Error(`Konflik Jadwal: ${staffName || staffId} sudah memiliki jadwal shift pada tanggal ${shiftDateStr}.`);
    }

    const assignmentId = id || `SHIFT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const assignment = {
      id: assignmentId,
      assignmentId,
      tenantId,
      rosterId,
      staffId,
      staffName: staffName || 'Clinician',
      role,
      departmentId,
      shiftDate: shiftDateStr,
      date: shiftDateStr,
      shiftCode,
      shift,
      startTime: shift.startTime,
      endTime: shift.endTime,
      unitId,
      unitName,
      assignmentStatus: 'SCHEDULED',
      checkInAt: null,
      checkOutAt: null,
      assignedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    this.shiftAssignments.set(assignmentId, assignment);

    // Maintain legacy lookup map
    const legacyKey = `${shiftDateStr}_${staffId}`;
    this.rosterAssignments.set(legacyKey, assignment);

    return assignment;
  }

  /**
   * 5. Register On-Call Specialist Coverage
   */
  registerOnCallSchedule({
    id,
    tenantId = '00000000-0000-0000-0000-000000000001',
    staffId,
    onCallDate,
    specialtyGroup = 'BEDAH_DIGESTIF',
    responseTimeSlaMinutes = 30
  }) {
    const onCallDateStr = new Date(onCallDate).toISOString().split('T')[0];
    const onCallId = id || `ONCALL-${Date.now()}`;
    const schedule = {
      id: onCallId,
      tenantId,
      staffId,
      onCallDate: onCallDateStr,
      specialtyGroup,
      responseTimeSlaMinutes,
      isActiveCoverage: true,
      createdAt: new Date().toISOString()
    };

    this.onCallSchedules.set(onCallId, schedule);
    return schedule;
  }

  /**
   * 6. Multi-Factor Clinical Authorization Engine
   * Evaluates whether clinician is legally, administratively, and temporally authorized to perform procedure P at unit U at target datetime T.
   */
  evaluateClinicalAuthorization({
    tenantId = '00000000-0000-0000-0000-000000000001',
    staffId,
    procedureCode,
    targetUnitId,
    evaluationTimestamp = new Date()
  }) {
    const evalDate = new Date(evaluationTimestamp);
    const evalDateStr = evalDate.toISOString().split('T')[0];

    // 1. Clinician Profile Active Check
    const staff = this.staffProfiles.get(staffId);
    if (!staff || !staff.isActive || staff.employmentStatus === 'INACTIVE') {
      return this._logAuthDecision({
        tenantId,
        staffId,
        procedureCode,
        targetUnitId,
        evaluationTimestamp,
        isAuthorized: false,
        authorizationDecision: 'DENIED_STAFF_INACTIVE',
        denialReason: 'Klinisi tidak ditemukan, tidak aktif, atau status kepegawaian nonaktif.'
      });
    }

    // 2. Tenant Isolation Check
    if (staff.tenantId !== tenantId) {
      return this._logAuthDecision({
        tenantId,
        staffId,
        procedureCode,
        targetUnitId,
        evaluationTimestamp,
        isAuthorized: false,
        authorizationDecision: 'DENIED_STAFF_INACTIVE',
        denialReason: 'Akses ditolak: Staf terdaftar pada tenant yang berbeda.'
      });
    }

    // 3. Credential (STR/SIP) Effective Dating Check
    const validCredential = Array.from(this.credentials.values()).find(
      c => c.tenantId === tenantId &&
           c.staffId === staffId &&
           ['STR', 'SIP'].includes(c.credentialType) &&
           c.verificationStatus === 'ACTIVE_VERIFIED' &&
           !c.revokedAt &&
           evalDate >= new Date(c.validFrom) &&
           evalDate <= new Date(c.validUntil)
    );

    const revokedCredential = Array.from(this.credentials.values()).find(
      c => c.tenantId === tenantId && c.staffId === staffId && c.revokedAt
    );

    if (revokedCredential) {
      return this._logAuthDecision({
        tenantId,
        staffId,
        procedureCode,
        targetUnitId,
        evaluationTimestamp,
        isAuthorized: false,
        authorizationDecision: 'DENIED_CREDENTIAL_REVOKED',
        denialReason: `Surat Tanda Registrasi / SIP klinisi telah DICABUT (Revoked at: ${revokedCredential.revokedAt}).`
      });
    }

    if (!validCredential) {
      return this._logAuthDecision({
        tenantId,
        staffId,
        procedureCode,
        targetUnitId,
        evaluationTimestamp,
        isAuthorized: false,
        authorizationDecision: 'DENIED_CREDENTIAL_EXPIRED',
        denialReason: 'Klinisi tidak memiliki STR / SIP aktif pada tanggal dan waktu tindakan.'
      });
    }

    // 4. Clinical Privilege (RKK / SPK) Scope & Effective Dating Check
    const matchingPrivilege = Array.from(this.privileges.values()).find(
      p => p.tenantId === tenantId &&
           p.staffId === staffId &&
           p.procedureCode === procedureCode &&
           p.privilegeStatus === 'ACTIVE' &&
           evalDate >= new Date(p.effectiveFrom) &&
           evalDate <= new Date(p.effectiveUntil)
    );

    if (!matchingPrivilege) {
      const expiredPrivilege = Array.from(this.privileges.values()).find(
        p => p.tenantId === tenantId && p.staffId === staffId && p.procedureCode === procedureCode && evalDate > new Date(p.effectiveUntil)
      );

      if (expiredPrivilege) {
        return this._logAuthDecision({
          tenantId,
          staffId,
          procedureCode,
          targetUnitId,
          evaluationTimestamp,
          isAuthorized: false,
          authorizationDecision: 'DENIED_PRIVILEGE_EXPIRED',
          denialReason: 'Kewenangan klinis (SPK/RKK) untuk tindakan ini telah KEDALUWARSA.'
        });
      }

      return this._logAuthDecision({
        tenantId,
        staffId,
        procedureCode,
        targetUnitId,
        evaluationTimestamp,
        isAuthorized: false,
        authorizationDecision: 'DENIED_NO_PRIVILEGE',
        denialReason: `Klinisi tidak memiliki kewenangan klinis (RKK) yang sah untuk tindakan ${procedureCode}.`
      });
    }

    // Check Department / Location Match
    if (matchingPrivilege.departmentId !== targetUnitId && matchingPrivilege.departmentId !== 'ALL_DEPARTMENTS') {
      return this._logAuthDecision({
        tenantId,
        staffId,
        procedureCode,
        targetUnitId,
        evaluationTimestamp,
        isAuthorized: false,
        authorizationDecision: 'DENIED_WRONG_UNIT',
        denialReason: `Kewenangan klinis hanya berlaku di unit ${matchingPrivilege.departmentId}, tidak sah di unit ${targetUnitId}.`
      });
    }

    // 5. Duty / Shift / On-Call Status Check
    const onDutyShift = Array.from(this.shiftAssignments.values()).find(
      s => s.tenantId === tenantId &&
           s.staffId === staffId &&
           s.shiftDate === evalDateStr &&
           ['SCHEDULED', 'CHECKED_IN'].includes(s.assignmentStatus)
    );

    const onCallCoverage = Array.from(this.onCallSchedules.values()).find(
      o => o.tenantId === tenantId &&
           o.staffId === staffId &&
           o.onCallDate === evalDateStr &&
           o.isActiveCoverage
    );

    if (!onDutyShift && !onCallCoverage) {
      return this._logAuthDecision({
        tenantId,
        staffId,
        procedureCode,
        targetUnitId,
        evaluationTimestamp,
        isAuthorized: false,
        authorizationDecision: 'DENIED_NOT_ON_DUTY',
        denialReason: 'Klinisi tidak terjadwal dinas aktif (Shift) maupun on-call jaga pada tanggal/waktu ini.'
      });
    }

    // All 5 Criteria Satisfied -> AUTHORIZED!
    return this._logAuthDecision({
      tenantId,
      staffId,
      procedureCode,
      targetUnitId,
      evaluationTimestamp,
      isAuthorized: true,
      authorizationDecision: 'AUTHORIZED',
      denialReason: null,
      metadata: {
        credentialNumber: validCredential.credentialNumber,
        privilegeLevel: matchingPrivilege.privilegeLevel,
        spkDocumentNumber: matchingPrivilege.spkDocumentNumber,
        dutyMode: onDutyShift ? `SHIFT_${onDutyShift.shiftCode}` : 'ON_CALL_COVERAGE'
      }
    });
  }

  _logAuthDecision({
    tenantId,
    staffId,
    procedureCode,
    targetUnitId,
    evaluationTimestamp,
    isAuthorized,
    authorizationDecision,
    denialReason = null,
    metadata = {}
  }) {
    const log = {
      id: `AUTH-LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      staffId,
      procedureCode,
      targetUnitId,
      evaluatedAt: new Date(evaluationTimestamp).toISOString(),
      isAuthorized,
      authorizationDecision,
      denialReason,
      evaluationMetadata: metadata
    };
    this.authorizationLogs.push(log);
    return log;
  }

  /**
   * Legacy Helper
   */
  getDepartmentRoster(departmentId, date) {
    const results = [];
    const dateStr = new Date(date).toISOString().split('T')[0];
    this.shiftAssignments.forEach((assignment) => {
      if (assignment.departmentId === departmentId && assignment.shiftDate === dateStr) {
        results.push(assignment);
      }
    });
    return results;
  }
}

export const staffSchedulingService = new StaffSchedulingService();
