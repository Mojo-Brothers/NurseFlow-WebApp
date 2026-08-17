/**
 * NurseFlow Enterprise HIS 2026 — ICU & Critical Care Clinical Scoring Engine
 * Standar: Sepsis-3 Guidelines, SOFA (Sequential Organ Failure Assessment) & Fluid Balance
 */

export const criticalCareService = {
  /**
   * Calculate Sequential Organ Failure Assessment (SOFA) Score
   */
  calculateSofaScore: ({
    pao2Fio2Ratio = 400, // mmHg (Respiration)
    platelets = 200000,  // /uL (Coagulation)
    bilirubin = 1.0,     // mg/dL (Liver)
    meanArterialPressure = 75, // mmHg (Cardiovascular)
    onVasopressors = false,
    gcs = 15,            // (Neurological)
    creatinine = 0.9     // mg/dL (Renal)
  }) => {
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

    return {
      totalSofa,
      breakdown: { respirationScore, coagulationScore, liverScore, cardioScore, cnsScore, renalScore },
      riskCategory: totalSofa >= 12 ? 'HIGH_MORTALITY_RISK (>80%)' : totalSofa >= 7 ? 'MODERATE_ORGAN_DYSFUNCTION' : 'LOW_RISK',
      isSepsisOrganFailure: totalSofa >= 2
    };
  },

  /**
   * Calculate 24-Hour Critical Care Fluid Balance
   */
  calculateFluidBalance: ({ oralIntake = 0, ivFluids = 1500, bloodTransfusion = 0, urineOutput = 1200, drainage = 100, insensibleLoss = 500 }) => {
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
};
