/**
 * NurseFlow Enterprise HIS 2026 — Human Factors Engineering (HFE) & Clinical Ergonomics Service
 * Standards: ISO 9241-11 (Usability), NASA-TLX (Task Load Index), System Usability Scale (SUS),
 * and JCI IPSG Safety Barrier Interception Metrics.
 */

export const HFE_ROLE_TYPES = {
  EMERGENCY_PHYSICIAN: 'EMERGENCY_PHYSICIAN',
  TRIAGE_NURSE: 'TRIAGE_NURSE',
  INPATIENT_NURSE: 'INPATIENT_NURSE',
  CLINICAL_PHARMACIST: 'CLINICAL_PHARMACIST',
  ADMISSION_CLERK: 'ADMISSION_CLERK'
};

export const CLINICAL_ERROR_TYPES = {
  SIMILAR_NAME_CONFUSION: 'SIMILAR_NAME_CONFUSION',
  CONTRAINDICATED_MEDICATION: 'CONTRAINDICATED_MEDICATION',
  WRONG_BARCODE_MISMATCH: 'WRONG_BARCODE_MISMATCH',
  OVERDOSE_PRESCRIBING: 'OVERDOSE_PRESCRIBING',
  UNAUTHORIZED_STEP_BYPASS: 'UNAUTHORIZED_STEP_BYPASS'
};

export class HumanFactorsErgonomicsService {
  constructor() {
    this.sessionLogs = [];
  }

  /**
   * Calculate Standardized NASA-TLX Raw Score (0 - 100)
   * Subscales: Mental Demand, Physical Demand, Temporal Demand, Performance, Effort, Frustration
   */
  calculateNasaTlx({
    mentalDemand,     // 0 - 100
    physicalDemand,   // 0 - 100
    temporalDemand,   // 0 - 100
    performance,      // 0 - 100 (Inverted in TLX: 0 = Perfect, 100 = Failure)
    effort,           // 0 - 100
    frustration       // 0 - 100
  }) {
    const rawSum = mentalDemand + physicalDemand + temporalDemand + performance + effort + frustration;
    const rawAverage = rawSum / 6;

    let cognitiveCategory = 'OPTIMAL_LOW_WORKLOAD';
    if (rawAverage > 70) cognitiveCategory = 'CRITICAL_COGNITIVE_OVERLOAD';
    else if (rawAverage > 50) cognitiveCategory = 'MODERATE_HIGH_WORKLOAD';
    else if (rawAverage > 30) cognitiveCategory = 'BALANCED_WORKLOAD';

    return {
      rawScore: parseFloat(rawAverage.toFixed(2)),
      subscales: { mentalDemand, physicalDemand, temporalDemand, performance, effort, frustration },
      cognitiveCategory,
      isAcceptable: rawAverage <= 45.0 // Enterprise HIS Target: <= 45/100
    };
  }

  /**
   * Calculate System Usability Scale (SUS) Score (0 - 100)
   * 10 Standardized Likert Questions (1 to 5)
   */
  calculateSusScore(responses) {
    if (!Array.isArray(responses) || responses.length !== 10) {
      throw new Error('SUS requires exactly 10 standardized responses (1-5 Likert scale)');
    }

    let score = 0;
    // Odd items (1, 3, 5, 7, 9): score = response - 1
    // Even items (2, 4, 6, 8, 10): score = 5 - response
    for (let i = 0; i < 10; i++) {
      const val = responses[i];
      if (i % 2 === 0) {
        score += (val - 1);
      } else {
        score += (5 - val);
      }
    }

    const susFinal = score * 2.5;
    let grade = 'F';
    if (susFinal >= 85) grade = 'A+ (Excellent)';
    else if (susFinal >= 80) grade = 'A (Good)';
    else if (susFinal >= 68) grade = 'B (Acceptable)';
    else if (susFinal >= 50) grade = 'C (Marginal)';

    return {
      susScore: parseFloat(susFinal.toFixed(1)),
      grade,
      isEnterpriseGrade: susFinal >= 80.0
    };
  }

  /**
   * Evaluate Clinical Human Safety Score (CHSS)
   * Combines Task Completion, Safety Intercepts, Error Recovery, and Cognitive Index
   */
  calculateClinicalHumanSafetyScore({
    taskCompletionRate,        // 0.0 - 1.0 (e.g. 0.98 = 98%)
    safetyInterceptionRate,    // 0.0 - 1.0 (e.g. 1.00 = 100% errors intercepted)
    uninterceptedErrorRate,    // 0.0 - 1.0 (Must be 0.00)
    averageNasaTlxScore,       // 0 - 100 (e.g. 24.5)
    navigationEfficiencyRate   // 0.0 - 1.0 (e.g. 0.95)
  }) {
    // Inverse cognitive index (lower TLX score = higher safety ergonomics)
    const cognitiveFactor = Math.max(0.1, (100 - averageNasaTlxScore) / 100);

    // Hard Penalty for any unintercepted clinical error reaching patient
    if (uninterceptedErrorRate > 0) {
      return {
        chssScore: 0.0,
        status: 'FAILED_UNINTERCEPTED_ERROR_PRESENT',
        verdict: 'SAFETY_COMPROMISED'
      };
    }

    const chss = (
      (taskCompletionRate * 0.35) +
      (safetyInterceptionRate * 0.35) +
      (cognitiveFactor * 0.15) +
      (navigationEfficiencyRate * 0.15)
    ) * 100;

    return {
      chssScore: parseFloat(chss.toFixed(1)),
      taskCompletionRate: `${(taskCompletionRate * 100).toFixed(1)}%`,
      safetyInterceptionRate: `${(safetyInterceptionRate * 100).toFixed(1)}%`,
      uninterceptedErrorRate: `${(uninterceptedErrorRate * 100).toFixed(1)}%`,
      averageNasaTlx: averageNasaTlxScore.toFixed(1),
      status: chss >= 85.0 ? 'CERTIFIED_EXCELLENT' : chss >= 75.0 ? 'ACCEPTABLE' : 'NEEDS_IMPROVEMENT',
      isCertified: chss >= 85.0
    };
  }

  /**
   * Simulate Human Error Injection Scenario
   */
  evaluateErrorInjectionTrial({
    errorType,
    injectedScenario,
    clinicianDetectedPromptly,
    systemBarrierIntercepted,
    reachedPatient
  }) {
    return {
      errorType,
      injectedScenario,
      clinicianDetectedPromptly,
      systemBarrierIntercepted,
      reachedPatient,
      isSafe: !reachedPatient && systemBarrierIntercepted
    };
  }
}

export const humanFactorsService = new HumanFactorsErgonomicsService();
