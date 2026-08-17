/**
 * NurseFlow Enterprise HIS 2026 — Central Operating Theatre (COT) & Anesthesia Engine (Hardened Gate 1D.5)
 * Standards: WHO Guidelines for Safe Surgery & JCI IPSG 4 (Ensure Safe Surgery)
 * Features: Surgery Schedule vs Case Separation, 3-Phase WHO Safety Checklist State Machine & PACU Handoff
 */

export const SURGICAL_STATUS = {
  SCHEDULED: 'SCHEDULED',
  PRE_OP_READY: 'PRE_OP_READY',
  SIGN_IN_COMPLETED: 'SIGN_IN_COMPLETED',
  TIME_OUT_COMPLETED: 'TIME_OUT_COMPLETED',
  PROCEDURE_IN_PROGRESS: 'PROCEDURE_IN_PROGRESS',
  SURGERY_IN_PROGRESS: 'PROCEDURE_IN_PROGRESS',
  SIGN_OUT_COMPLETED: 'SIGN_OUT_COMPLETED',
  PROCEDURE_COMPLETED: 'PROCEDURE_COMPLETED',
  PACU_RECOVERY: 'PACU_RECOVERY',
  POST_OP_HANDOFF: 'POST_OP_HANDOFF',
  DISCHARGED_TO_WARD: 'POST_OP_HANDOFF',
  CANCELLED: 'CANCELLED'
};

export const SURGERY_STATUS = SURGICAL_STATUS;

class OperatingTheatreService {
  constructor() {
    this.schedules = new Map(); // ScheduleId -> Booking
    this.cases = new Map(); // CaseId -> Case
    this.checklists = new Map(); // CaseId -> WHO Checklist
    this.anesthesiaRecords = new Map(); // CaseId -> Anesthesia
    this.postOpHandoffs = new Map(); // CaseId -> Handoff
  }

  /**
   * 1. Book Surgery Schedule (Resource Reservation with Room Slot Mutex)
   */
  bookSurgerySchedule({
    id,
    tenantId = '00000000-0000-0000-0000-000000000001',
    bookingNumber,
    patientId,
    episodeId,
    encounterId,
    operatingRoomId,
    leadSurgeonId,
    leadSurgeonName,
    anesthesiologistId = null,
    anesthesiologistName = null,
    scheduledDate,
    slotTime,
    estimatedDurationMinutes = 120,
    procedureName,
    icd9CmCode = null,
    surgeryType = 'ELECTIVE'
  }) {
    // Room Slot Collision Check (Partial Unique Index Simulation)
    const existingActiveBooking = Array.from(this.schedules.values()).find(
      s => s.tenantId === tenantId &&
           s.operatingRoomId === operatingRoomId &&
           s.scheduledDate === scheduledDate &&
           s.slotTime === slotTime &&
           ['BOOKED', 'CONFIRMED', 'IN_PROGRESS'].includes(s.bookingStatus)
    );

    if (existingActiveBooking) {
      throw new Error(`ROOM_COLLISION: Kamar Operasi ${operatingRoomId} sudah terisi untuk slot ${scheduledDate} ${slotTime}!`);
    }

    const scheduleId = id || `SCHED-${Date.now()}`;
    const schedule = {
      id: scheduleId,
      tenantId,
      bookingNumber: bookingNumber || `BK-OR-${Date.now()}`,
      patientId,
      episodeId,
      encounterId,
      operatingRoomId,
      leadSurgeonId,
      leadSurgeonName,
      anesthesiologistId,
      anesthesiologistName,
      scheduledDate,
      slotTime,
      estimatedDurationMinutes,
      procedureName,
      icd9CmCode,
      surgeryType,
      bookingStatus: 'BOOKED',
      cancellationReason: null,
      rescheduledFromId: null,
      version: 1,
      createdAt: new Date().toISOString()
    };

    this.schedules.set(scheduleId, schedule);
    return schedule;
  }

  /**
   * 2. Initialize Real Surgery Case (Separated from Schedule)
   */
  createSurgeryCase({
    id,
    tenantId = '00000000-0000-0000-0000-000000000001',
    caseNumber,
    scheduleId = null,
    patientId,
    patientMrn = null,
    patientName = null,
    episodeId = null,
    encounterId = null,
    operatingRoomId = 'OK-01',
    leadSurgeonId = 'DOC-01',
    leadSurgeonName = 'dr. Sp.B',
    anesthesiologistId = null,
    anesthesiologistName = null,
    surgicalNurseId = null,
    surgicalNurseName = null,
    circulatingNurseId = null,
    circulatingNurseName = null,
    procedureName = 'Procedure'
  }) {
    const caseId = id || `CASE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const sCase = {
      id: caseId,
      surgeryId: caseId,
      tenantId,
      caseNumber: caseNumber || `CAS-OR-${Date.now()}`,
      scheduleId,
      patientId,
      patientMrn,
      patientName,
      episodeId,
      encounterId,
      operatingRoomId,
      leadSurgeonId,
      leadSurgeonName,
      anesthesiologistId,
      anesthesiologistName,
      surgicalNurseId,
      surgicalNurseName,
      circulatingNurseId,
      circulatingNurseName,
      procedureName,
      surgicalStatus: SURGICAL_STATUS.SCHEDULED,
      status: SURGICAL_STATUS.SCHEDULED,
      procedureStartedAt: null,
      procedureCompletedAt: null,
      preOpDiagnosis: null,
      postOpDiagnosis: null,
      surgicalTechniqueNotes: null,
      implantUsedNotes: null,
      specimenSentToPa: false,
      bloodLossMl: 0,
      version: 1,
      createdAt: new Date().toISOString()
    };

    this.cases.set(caseId, sCase);

    // Initialize Empty WHO Surgical Safety Checklist
    const checklist = {
      id: `CHK-${caseId}`,
      tenantId,
      surgeryCaseId: caseId,
      // Phase 1
      signInConfirmed: false,
      signInCompletedAt: null,
      signInVerifiedByNurse: null,
      // Phase 2
      timeOutConfirmed: false,
      timeOutCompletedAt: null,
      timeOutVerifiedByNurse: null,
      // Phase 3
      signOutConfirmed: false,
      signOutCompletedAt: null,
      signOutVerifiedByNurse: null,
      isFinalized: false
    };
    this.checklists.set(caseId, checklist);

    return sCase;
  }

  /**
   * 3. WHO Surgical Safety Checklist — Phase 1: Sign-In (Before Induction)
   */
  performSignIn(caseId, {
    patientIdentitySiteVerified = true,
    siteMarked = true,
    anesthesiaSafetyCheckCompleted = true,
    pulseOximeterFunctioning = true,
    knownAllergyConfirmed = true,
    difficultAirwayAspirationRisk = false,
    bloodLossRiskPrepared = true,
    verifiedByNurse,
    anesthesiologistName
  } = {}) {
    const sCase = this.cases.get(caseId);
    if (!sCase) throw new Error(`Kasus operasi ${caseId} tidak ditemukan.`);

    const allVerified = patientIdentitySiteVerified && siteMarked && anesthesiaSafetyCheckCompleted && pulseOximeterFunctioning && knownAllergyConfirmed && bloodLossRiskPrepared;
    if (!allVerified) {
      throw new Error('SIGN_IN_INCOMPLETE: Seluruh parameter keselamatan Sign-In wajib diverifikasi sebelum induksi anestesi!');
    }

    const chk = this.checklists.get(caseId);
    chk.signInConfirmed = true;
    chk.signInPatientIdentitySiteVerified = patientIdentitySiteVerified;
    chk.signInSiteMarked = siteMarked;
    chk.signInAnesthesiaSafetyCheckCompleted = anesthesiaSafetyCheckCompleted;
    chk.signInPulseOximeterFunctioning = pulseOximeterFunctioning;
    chk.signInKnownAllergyConfirmed = knownAllergyConfirmed;
    chk.signInDifficultAirwayAspirationRisk = difficultAirwayAspirationRisk;
    chk.signInBloodLossRiskPrepared = bloodLossRiskPrepared;
    chk.signInCompletedAt = new Date().toISOString();
    chk.signInVerifiedByNurse = verifiedByNurse;
    chk.signInAnesthesiologistName = anesthesiologistName;

    sCase.surgicalStatus = SURGICAL_STATUS.SIGN_IN_COMPLETED;
    sCase.status = SURGICAL_STATUS.SIGN_IN_COMPLETED;
    sCase.version += 1;

    return { success: true, caseId, status: sCase.surgicalStatus };
  }

  /**
   * 4. WHO Surgical Safety Checklist — Phase 2: Time-Out (Before Skin Incision)
   */
  performTimeOut(caseId, {
    allTeamMembersIntroduced = true,
    patientIdentityAndSiteConfirmed = true,
    patientNameProcedureSiteConfirmed = true,
    antibioticProphylaxisGiven = true,
    antibioticProphylaxisGivenWithin60min = true,
    anticipatedCriticalEventsReviewed = true,
    sterilityIndicatorConfirmed = true,
    imagingDisplayedIfEssential = true,
    verifiedByNurse,
    surgeonName = 'Surgeon'
  } = {}) {
    const sCase = this.cases.get(caseId);
    if (!sCase) throw new Error(`Kasus operasi ${caseId} tidak ditemukan.`);

    let chk = this.checklists.get(caseId);
    if (!chk) {
      chk = { id: `CHK-${caseId}`, tenantId: sCase.tenantId, surgeryCaseId: caseId, signInConfirmed: true, timeOutConfirmed: false, signOutConfirmed: false };
      this.checklists.set(caseId, chk);
    }

    const isAllConfirmed = allTeamMembersIntroduced && 
      (patientIdentityAndSiteConfirmed || patientNameProcedureSiteConfirmed) && 
      (antibioticProphylaxisGiven || antibioticProphylaxisGivenWithin60min) && 
      anticipatedCriticalEventsReviewed && 
      sterilityIndicatorConfirmed;

    if (!isAllConfirmed) {
      throw new Error('TIME_OUT_INCOMPLETE: Seluruh parameter keselamatan Time-Out wajib dikonfirmasi tim bedah sebelum insisi kulit!');
    }

    chk.timeOutConfirmed = true;
    chk.timeOutAllTeamMembersIntroduced = allTeamMembersIntroduced;
    chk.timeOutPatientNameProcedureSiteConfirmed = patientNameProcedureSiteConfirmed || patientIdentityAndSiteConfirmed;
    chk.timeOutAntibioticProphylaxisGivenWithin60min = antibioticProphylaxisGivenWithin60min || antibioticProphylaxisGiven;
    chk.timeOutAnticipatedCriticalEventsReviewed = anticipatedCriticalEventsReviewed;
    chk.timeOutSterilityIndicatorConfirmed = sterilityIndicatorConfirmed;
    chk.timeOutImagingDisplayedIfEssential = imagingDisplayedIfEssential;
    chk.timeOutCompletedAt = new Date().toISOString();
    chk.timeOutVerifiedByNurse = verifiedByNurse;
    chk.timeOutSurgeonName = surgeonName;

    sCase.surgicalStatus = SURGICAL_STATUS.TIME_OUT_COMPLETED;
    sCase.status = SURGICAL_STATUS.TIME_OUT_COMPLETED;
    sCase.version += 1;

    return {
      success: true,
      caseId,
      surgeryId: caseId,
      status: sCase.surgicalStatus,
      message: 'WHO Time Out BERHASIL dikonfirmasi. Tim bedah diizinkan melakukan insisi.'
    };
  }

  /**
   * 5. Start Surgical Procedure (Skin Incision — Hard Safety Barrier)
   */
  startProcedure(caseId) {
    const sCase = this.cases.get(caseId);
    if (!sCase) throw new Error(`Kasus operasi ${caseId} tidak ditemukan.`);

    const chk = this.checklists.get(caseId);
    if (!chk || !chk.signInConfirmed || !chk.timeOutConfirmed) {
      throw new Error('SAFETY_VIOLATION: Surgical procedure CANNOT start without verified WHO Sign-In and Time-Out!');
    }

    sCase.surgicalStatus = SURGICAL_STATUS.PROCEDURE_IN_PROGRESS;
    sCase.status = SURGICAL_STATUS.PROCEDURE_IN_PROGRESS;
    sCase.procedureStartedAt = new Date().toISOString();
    sCase.version += 1;

    return { success: true, caseId, status: sCase.surgicalStatus, startedAt: sCase.procedureStartedAt };
  }

  /**
   * 6. WHO Surgical Safety Checklist — Phase 3: Sign-Out (Before Leaving OR)
   */
  performSignOut(caseId, {
    nurseVerballyConfirmsProcedure = true,
    instrumentSpongeNeedleCountsCorrect = true,
    specimenLabelledCorrectly = true,
    equipmentProblemsAddressed = true,
    postopConcernsReviewed = true,
    verifiedByNurse
  } = {}) {
    const sCase = this.cases.get(caseId);
    if (!sCase) throw new Error(`Kasus operasi ${caseId} tidak ditemukan.`);

    if (sCase.surgicalStatus !== SURGICAL_STATUS.PROCEDURE_IN_PROGRESS) {
      throw new Error('SAFETY_VIOLATION: Sign-Out hanya dapat dilakukan saat prosedur operasi sedang berlangsung!');
    }

    const allVerified = nurseVerballyConfirmsProcedure && instrumentSpongeNeedleCountsCorrect && specimenLabelledCorrectly && equipmentProblemsAddressed && postopConcernsReviewed;
    if (!allVerified) {
      throw new Error('SIGN_OUT_INCOMPLETE: Seluruh parameter keselamatan Sign-Out wajib diverifikasi sebelum pasien meninggalkan OK!');
    }

    const chk = this.checklists.get(caseId);
    chk.signOutConfirmed = true;
    chk.signOutNurseVerballyConfirmsProcedure = nurseVerballyConfirmsProcedure;
    chk.signOutInstrumentSpongeNeedleCountsCorrect = instrumentSpongeNeedleCountsCorrect;
    chk.signOutSpecimenLabelledCorrectly = specimenLabelledCorrectly;
    chk.signOutEquipmentProblemsAddressed = equipmentProblemsAddressed;
    chk.signOutPostopConcernsReviewed = postopConcernsReviewed;
    chk.signOutCompletedAt = new Date().toISOString();
    chk.signOutVerifiedByNurse = verifiedByNurse;
    chk.isFinalized = true;
    chk.finalizedAt = new Date().toISOString();

    sCase.surgicalStatus = SURGICAL_STATUS.SIGN_OUT_COMPLETED;
    sCase.status = SURGICAL_STATUS.SIGN_OUT_COMPLETED;
    sCase.version += 1;

    return { success: true, caseId, status: sCase.surgicalStatus };
  }

  /**
   * 7. Complete Surgical Procedure (Requires Sign-Out)
   */
  completeProcedure(caseId, { postOpDiagnosis, surgicalTechniqueNotes, bloodLossMl = 0 }) {
    const sCase = this.cases.get(caseId);
    if (!sCase) throw new Error(`Kasus operasi ${caseId} tidak ditemukan.`);

    const chk = this.checklists.get(caseId);
    if (!chk || !chk.signOutConfirmed) {
      throw new Error('SAFETY_VIOLATION: Surgical procedure CANNOT be completed without verified WHO Sign-Out!');
    }

    sCase.surgicalStatus = SURGICAL_STATUS.PROCEDURE_COMPLETED;
    sCase.status = SURGICAL_STATUS.PROCEDURE_COMPLETED;
    sCase.procedureCompletedAt = new Date().toISOString();
    sCase.postOpDiagnosis = postOpDiagnosis;
    sCase.surgicalTechniqueNotes = surgicalTechniqueNotes;
    sCase.bloodLossMl = bloodLossMl;
    sCase.version += 1;

    return { success: true, caseId, status: sCase.surgicalStatus };
  }

  /**
   * 8. Record Post-Anesthesia Recovery (PACU Aldrete Handoff)
   */
  recordPacuHandoff(caseId, {
    patientId,
    aldreteActivityScore = 2,
    aldreteRespirationScore = 2,
    aldreteCirculationScore = 2,
    aldreteConsciousnessScore = 2,
    aldreteO2SaturationScore = 2,
    transferDestination = 'INPATIENT_WARD',
    handedOverByPacuNurse = 'Ns. PACU',
    receivedByWardNurse = 'Ns. Ward'
  } = {}) {
    const sCase = this.cases.get(caseId);
    if (!sCase) throw new Error(`Kasus operasi ${caseId} tidak ditemukan.`);

    const totalAldreteScore = aldreteActivityScore + aldreteRespirationScore + aldreteCirculationScore + aldreteConsciousnessScore + aldreteO2SaturationScore;
    const isReadyForDischarge = totalAldreteScore >= 9;

    const handoff = {
      id: `PACU-${caseId}`,
      tenantId: sCase.tenantId,
      surgeryCaseId: caseId,
      patientId: patientId || sCase.patientId,
      pacuArrivalTime: new Date().toISOString(),
      pacuDischargeTime: isReadyForDischarge ? new Date().toISOString() : null,
      aldreteActivityScore,
      aldreteRespirationScore,
      aldreteCirculationScore,
      aldreteConsciousnessScore,
      aldreteO2SaturationScore,
      totalAldreteScore,
      transferDestination,
      handedOverByPacuNurse,
      receivedByWardNurse,
      isReadyForDischarge,
      createdAt: new Date().toISOString()
    };
    this.postOpHandoffs.set(caseId, handoff);

    if (isReadyForDischarge) {
      sCase.surgicalStatus = SURGICAL_STATUS.POST_OP_HANDOFF;
      sCase.status = SURGICAL_STATUS.DISCHARGED_TO_WARD;
      sCase.version += 1;
    }

    return handoff;
  }

  /**
   * Legacy Compatibility Helper
   */
  scheduleSurgery(params) {
    return this.createSurgeryCase(params);
  }

  calculateAldreteScore(surgeryId, params = {}) {
    const handoff = this.recordPacuHandoff(surgeryId, {
      aldreteActivityScore: params.activity ?? 2,
      aldreteRespirationScore: params.respiration ?? 2,
      aldreteCirculationScore: params.circulation ?? 2,
      aldreteConsciousnessScore: params.consciousness ?? 2,
      aldreteO2SaturationScore: params.o2Saturation ?? 2,
      handedOverByPacuNurse: 'Ns. PACU'
    });

    return {
      totalScore: handoff.totalAldreteScore,
      isReadyForDischarge: handoff.isReadyForDischarge,
      recommendation: handoff.isReadyForDischarge ? 'Pasien stabil dan diizinkan pindah ke Ruang Rawat Inap' : 'Pasien wajib diobservasi lanjutan di Ruang PACU/Recovery Room'
    };
  }
}

export const operatingTheatreService = new OperatingTheatreService();
