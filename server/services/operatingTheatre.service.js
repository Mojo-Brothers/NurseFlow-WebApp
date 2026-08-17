/**
 * NurseFlow Enterprise HIS 2026 — Central Operating Theatre (COT) & Anesthesia Engine
 * Standar: WHO Guidelines for Safe Surgery & JCI IPSG 4 (Ensure Safe Surgery)
 */

export const SURGERY_STATUS = {
  SCHEDULED: 'SCHEDULED',
  SIGN_IN_COMPLETED: 'SIGN_IN_COMPLETED',
  TIME_OUT_COMPLETED: 'TIME_OUT_COMPLETED',
  SURGERY_IN_PROGRESS: 'SURGERY_IN_PROGRESS',
  SIGN_OUT_COMPLETED: 'SIGN_OUT_COMPLETED',
  PACU_RECOVERY: 'PACU_RECOVERY',
  DISCHARGED_TO_WARD: 'DISCHARGED_TO_WARD'
};

class OperatingTheatreService {
  constructor() {
    this.surgicalCases = new Map();
  }

  /**
   * 1. Schedule Surgical Operation
   */
  scheduleSurgery({
    patientId,
    patientMrn,
    patientName,
    procedureName,
    operatingRoomId = 'OK-01',
    leadSurgeonName,
    anesthesiologistName,
    scheduledDateTime
  }) {
    const surgeryId = `SURG-${Date.now()}`;
    const surgicalCase = {
      surgeryId,
      patientId,
      patientMrn,
      patientName,
      procedureName,
      operatingRoomId,
      leadSurgeonName,
      anesthesiologistName,
      scheduledDateTime,
      status: SURGERY_STATUS.SCHEDULED,
      checklist: {
        signIn: null,
        timeOut: null,
        signOut: null
      },
      aldreteScore: null
    };

    this.surgicalCases.set(surgeryId, surgicalCase);
    return surgicalCase;
  }

  /**
   * 2. WHO Surgical Safety Checklist — Time Out (Before Incision)
   */
  performTimeOut(surgeryId, {
    allTeamMembersIntroduced = true,
    patientIdentityAndSiteConfirmed = true,
    antibioticProphylaxisGiven = true,
    anticipatedCriticalEventsReviewed = true,
    verifiedByNurse
  }) {
    const sCase = this.surgicalCases.get(surgeryId);
    if (!sCase) throw new Error(`Kasus operasi ${surgeryId} tidak ditemukan.`);

    const isAllConfirmed = allTeamMembersIntroduced && patientIdentityAndSiteConfirmed && antibioticProphylaxisGiven && anticipatedCriticalEventsReviewed;
    if (!isAllConfirmed) {
      throw new Error('TIME OUT DIBATALKAN: Seluruh parameter keselamatan bedah WHO wajib dikonfirmasi sebelum insisi kulit!');
    }

    sCase.checklist.timeOut = {
      confirmedAt: new Date().toISOString(),
      verifiedByNurse,
      status: 'VERIFIED_SAFE'
    };
    sCase.status = SURGERY_STATUS.TIME_OUT_COMPLETED;

    return {
      success: true,
      surgeryId,
      message: 'WHO Time Out BERHASIL dikonfirmasi. Tim bedah diizinkan melakukan insisi.'
    };
  }

  /**
   * 3. Evaluate Post-Anesthesia Recovery (Aldrete Score)
   */
  calculateAldreteScore(surgeryId, { activity = 2, respiration = 2, circulation = 2, consciousness = 2, o2Saturation = 2 }) {
    const totalScore = activity + respiration + circulation + consciousness + o2Saturation;
    const isReadyForDischarge = totalScore >= 9;

    const sCase = this.surgicalCases.get(surgeryId);
    if (sCase) {
      sCase.aldreteScore = { totalScore, isReadyForDischarge, evaluatedAt: new Date().toISOString() };
      if (isReadyForDischarge) sCase.status = SURGERY_STATUS.DISCHARGED_TO_WARD;
    }

    return {
      totalScore,
      isReadyForDischarge,
      recommendation: isReadyForDischarge ? 'Pasien stabil dan diizinkan pindah ke Ruang Rawat Inap' : 'Pasien wajib diobservasi lanjutan di Ruang PACU/Recovery Room'
    };
  }
}

export const operatingTheatreService = new OperatingTheatreService();
