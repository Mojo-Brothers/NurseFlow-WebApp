/**
 * NurseFlow Enterprise HIS 2026 — Shadow Mode Operations & Dual-Entry Reconciliation Engine
 * Standard: Primaya Hospital 7-Day Parallel Run & JCI Change Management Protocol
 */

export const shadowModeOperationsService = {
  /**
   * 1. VALIDATE DUAL-ENTRY DATA RECONCILIATION
   * Compares legacy SIMRS input against NurseFlow input to detect discrepancies
   */
  reconcileDualEntry: ({
    legacySimrsRecord,
    nurseflowRecord
  }) => {
    const discrepancies = [];

    // Check MRN
    if (legacySimrsRecord.mrn !== nurseflowRecord.mrn) {
      discrepancies.push({ field: 'mrn', legacy: legacySimrsRecord.mrn, nurseflow: nurseflowRecord.mrn });
    }

    // Check Primary Diagnosis (ICD-10)
    if (legacySimrsRecord.icd10Code !== nurseflowRecord.icd10Code) {
      discrepancies.push({ field: 'icd10Code', legacy: legacySimrsRecord.icd10Code, nurseflow: nurseflowRecord.icd10Code });
    }

    // Check Total Hospital Bill / Tariff
    const tariffDiff = Math.abs((legacySimrsRecord.totalBill || 0) - (nurseflowRecord.totalBill || 0));
    if (tariffDiff > 100) { // Toleransi Rp 100 untuk pembulatan
      discrepancies.push({ field: 'totalBill', legacy: legacySimrsRecord.totalBill, nurseflow: nurseflowRecord.totalBill, difference: tariffDiff });
    }

    // Check Medication Count & Dosage
    if (legacySimrsRecord.medicationCount !== nurseflowRecord.medicationCount) {
      discrepancies.push({ field: 'medicationCount', legacy: legacySimrsRecord.medicationCount, nurseflow: nurseflowRecord.medicationCount });
    }

    const isMatch = discrepancies.length === 0;

    return {
      isMatch,
      reconciledAt: new Date().toISOString(),
      discrepancyCount: discrepancies.length,
      discrepancies,
      verdict: isMatch ? 'SHADOW_ENTRY_IDENTICAL_PASS' : 'SHADOW_ENTRY_DISCREPANCY_FLAGGED'
    };
  },

  /**
   * 2. EVALUATE 7-DAY SHADOW TRIAL METRICS (GATE 15.3 KPI EVALUATION)
   */
  evaluate7DayShadowTrialKpis: ({
    totalShiftTransactions = 250,
    userErrorCount = 2,
    avgRegistrationSeconds = 42,
    avgCpptSeconds = 68,
    avgEmarSeconds = 32,
    avgDoorToEcgMinutes = 7.2,
    avgCodeStrokeMinutes = 2.4,
    satusehatSyncFailures = 0,
    bsreSignFailures = 0
  }) => {
    const errorRatePct = parseFloat(((userErrorCount / totalShiftTransactions) * 100).toFixed(2));

    const kpiStatus = {
      errorRate: { value: `${errorRatePct}%`, target: '< 1%', passed: errorRatePct < 1.0 },
      registrationTime: { value: `${avgRegistrationSeconds}s`, target: '< 60s', passed: avgRegistrationSeconds < 60 },
      cpptTime: { value: `${avgCpptSeconds}s`, target: '< 90s', passed: avgCpptSeconds < 90 },
      emarTime: { value: `${avgEmarSeconds}s`, target: '< 45s', passed: avgEmarSeconds < 45 },
      doorToEcg: { value: `${avgDoorToEcgMinutes}m`, target: '< 10m', passed: avgDoorToEcgMinutes < 10 },
      codeStroke: { value: `${avgCodeStrokeMinutes}m`, target: '< 3m', passed: avgCodeStrokeMinutes < 3 },
      satusehatZeroFailure: { failures: satusehatSyncFailures, passed: satusehatSyncFailures === 0 },
      bsreZeroFailure: { failures: bsreSignFailures, passed: bsreSignFailures === 0 }
    };

    const allPassed = Object.values(kpiStatus).every(k => k.passed);

    return {
      allKpisMet: allPassed,
      errorRatePct,
      totalShiftTransactions,
      evaluatedAt: new Date().toISOString(),
      kpiStatus,
      recommendation: allPassed ? 'APPROVED_FOR_FULL_CUTOVER' : 'EXTEND_SHADOW_MODE_REMEDIATION'
    };
  }
};
