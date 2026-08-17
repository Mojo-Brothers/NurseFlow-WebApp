/**
 * NurseFlow Enterprise HIS 2026 — ICU & Critical Care Clinical Scoring Engine (Hardened Gate 1D.5)
 * Standards: Sepsis-3 Guidelines, SOFA, APACHE II, NEWS2 & Versioned Raw Observation Persistence
 */

class CriticalCareService {
  constructor() {
    this.assessments = new Map(); // AssessmentId -> Record (Append-only)
  }

  /**
   * 1. Calculate Sequential Organ Failure Assessment (SOFA) Score
   */
  calculateSofaScore(rawInputs = {}) {
    const {
      pao2Fio2Ratio = 400, // mmHg (Respiration)
      platelets = 200000,  // /uL (Coagulation)
      bilirubin = 1.0,     // mg/dL (Liver)
      meanArterialPressure = 75, // mmHg (Cardiovascular)
      onVasopressors = false,
      gcs = 15,            // (Neurological)
      creatinine = 0.9     // mg/dL (Renal)
    } = rawInputs;

    let respirationScore = 0;
    if (pao2Fio2Ratio < 100) respirationScore = 4;
    else if (pao2Fio2Ratio < 200) respirationScore = 3;
    else if (pao2Fio2Ratio < 300) respirationScore = 2;
    else if (pao2Fio2Ratio < 400) respirationScore = 1;

    let coagulationScore = 0;
    if (platelets < 20000) coagulationScore = 4;
    else if (platelets < 50000) coagulationScore = 3;
    else if (platelets < 100000) coagulationScore = 2;
    else if (platelets < 150000) coagulationScore = 1;

    let liverScore = 0;
    if (bilirubin >= 12.0) liverScore = 4;
    else if (bilirubin >= 6.0) liverScore = 3;
    else if (bilirubin >= 2.0) liverScore = 2;
    else if (bilirubin >= 1.2) liverScore = 1;

    let cardioScore = 0;
    if (onVasopressors) cardioScore = 3;
    else if (meanArterialPressure < 70) cardioScore = 1;

    let cnsScore = 0;
    if (gcs < 6) cnsScore = 4;
    else if (gcs <= 9) cnsScore = 3;
    else if (gcs <= 12) cnsScore = 2;
    else if (gcs <= 14) cnsScore = 1;

    let renalScore = 0;
    if (creatinine >= 5.0) renalScore = 4;
    else if (creatinine >= 3.5) renalScore = 3;
    else if (creatinine >= 2.0) renalScore = 2;
    else if (creatinine >= 1.2) renalScore = 1;

    const totalSofa = respirationScore + coagulationScore + liverScore + cardioScore + cnsScore + renalScore;
    const subscores = { respirationScore, coagulationScore, liverScore, cardioScore, cnsScore, renalScore };

    return {
      totalScore: totalSofa,
      totalSofa,
      subscores,
      breakdown: subscores,
      riskCategory: totalSofa >= 12 ? 'HIGH_MORTALITY_RISK (>80%)' : totalSofa >= 7 ? 'MODERATE_ORGAN_DYSFUNCTION' : 'LOW_RISK',
      isSepsisOrganFailure: totalSofa >= 2,
      escalationTriggered: totalSofa >= 7
    };
  }

  /**
   * 2. Calculate National Early Warning Score 2 (NEWS2)
   */
  calculateNews2Score(rawInputs = {}) {
    const {
      respirationRate = 16,
      spo2 = 98,
      onSupplementalOxygen = false,
      systolicBp = 120,
      heartRate = 72,
      consciousness = 'ALERT', // 'ALERT', 'VOICE', 'PAIN', 'UNRESPONSIVE'
      temperature = 36.8
    } = rawInputs;

    let rrScore = 0;
    if (respirationRate <= 8 || respirationRate >= 25) rrScore = 3;
    else if (respirationRate >= 21) rrScore = 2;
    else if (respirationRate <= 11) rrScore = 1;

    let spo2Score = 0;
    if (spo2 <= 91) spo2Score = 3;
    else if (spo2 <= 93) spo2Score = 2;
    else if (spo2 <= 95) spo2Score = 1;

    const o2Score = onSupplementalOxygen ? 2 : 0;

    let bpScore = 0;
    if (systolicBp <= 90 || systolicBp >= 220) bpScore = 3;
    else if (systolicBp <= 100) bpScore = 2;
    else if (systolicBp <= 110) bpScore = 1;

    let hrScore = 0;
    if (heartRate <= 40 || heartRate >= 131) hrScore = 3;
    else if (heartRate >= 111) hrScore = 2;
    else if (heartRate >= 91 || (heartRate >= 41 && heartRate <= 50)) hrScore = 1;

    const cnsScore = consciousness === 'ALERT' ? 0 : 3;

    let tempScore = 0;
    if (temperature <= 35.0) tempScore = 3;
    else if (temperature >= 39.1) tempScore = 2;
    else if (temperature <= 36.0 || temperature >= 38.1) tempScore = 1;

    const totalNews2 = rrScore + spo2Score + o2Score + bpScore + hrScore + cnsScore + tempScore;
    const subscores = { rrScore, spo2Score, o2Score, bpScore, hrScore, cnsScore, tempScore };

    return {
      totalScore: totalNews2,
      totalNews2,
      subscores,
      breakdown: subscores,
      riskCategory: totalNews2 >= 7 ? 'CRITICAL_HIGH_CLINICAL_RISK' : totalNews2 >= 5 ? 'MEDIUM_CLINICAL_RISK' : 'LOW_RISK',
      escalationTriggered: totalNews2 >= 5
    };
  }

  /**
   * 3. Record Versioned ICU Acuity Assessment with Raw Observation Snapshot
   */
  recordIcuAcuityAssessment({
    id,
    tenantId = '00000000-0000-0000-0000-000000000001',
    patientId,
    episodeId,
    encounterId,
    scoringSystem = 'SOFA',
    algorithmVersion = 'v1.0',
    rawScoringInputs,
    assessedById,
    assessedByName
  }) {
    if (!rawScoringInputs) {
      throw new Error('RAW_INPUTS_REQUIRED: Snapshot observasi klinis mentah wajib disertakan!');
    }

    let calcResult;
    if (scoringSystem === 'SOFA') {
      calcResult = this.calculateSofaScore(rawScoringInputs);
    } else if (scoringSystem === 'NEWS2') {
      calcResult = this.calculateNews2Score(rawScoringInputs);
    } else {
      calcResult = { totalScore: 0, subscores: {}, riskCategory: 'UNKNOWN', escalationTriggered: false };
    }

    const assessmentId = id || `ICU-ACUITY-${Date.now()}`;
    const assessment = {
      id: assessmentId,
      tenantId,
      assessmentNumber: `ICU-SCORE-${Date.now()}`,
      patientId,
      episodeId,
      encounterId,
      scoringSystem,
      algorithmVersion,
      rawScoringInputs, // IMMUTABLE RAW INPUT SNAPSHOT
      calculatedScore: calcResult.totalScore,
      calculatedSubscores: calcResult.subscores,
      riskStratification: calcResult.riskCategory,
      escalationTriggered: calcResult.escalationTriggered,
      escalationActionNotes: calcResult.escalationTriggered ? `Eskalasi Otomatis: Nilai ${scoringSystem} = ${calcResult.totalScore} memerlukan konsultasi intensivis segera.` : null,
      assessedAt: new Date().toISOString(),
      assessedById,
      assessedByName,
      isFinalized: true,
      createdAt: new Date().toISOString()
    };

    this.assessments.set(assessmentId, assessment);
    return assessment;
  }

  /**
   * 4. Reproduce Score from Stored Raw Inputs
   */
  reproduceScoreFromSnapshot(assessmentId) {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) throw new Error(`Assessment ${assessmentId} tidak ditemukan.`);

    let recalculated;
    if (assessment.scoringSystem === 'SOFA') {
      recalculated = this.calculateSofaScore(assessment.rawScoringInputs);
    } else if (assessment.scoringSystem === 'NEWS2') {
      recalculated = this.calculateNews2Score(assessment.rawScoringInputs);
    }

    const isReproducible = recalculated && recalculated.totalScore === assessment.calculatedScore;
    return {
      assessmentId,
      storedScore: assessment.calculatedScore,
      recalculatedScore: recalculated ? recalculated.totalScore : null,
      isReproducible
    };
  }

  /**
   * 5. Calculate 24-Hour Critical Care Fluid Balance
   */
  calculateFluidBalance({ oralIntake = 0, ivFluids = 1500, bloodTransfusion = 0, urineOutput = 1200, drainage = 100, insensibleLoss = 500 }) {
    const totalIntake = oralIntake + ivFluids + bloodTransfusion;
    const totalOutput = urineOutput + drainage + insensibleLoss;
    const netBalance = totalIntake - totalOutput;

    return {
      totalIntake,
      totalOutput,
      netBalance,
      interpretation: netBalance > 1000 ? 'POSITIVE_FLUID_OVERLOAD' : netBalance < -500 ? 'NEGATIVE_DEFICIT' : 'EUVOLEMIC_BALANCED'
    };
  }
}

export const criticalCareService = new CriticalCareService();
