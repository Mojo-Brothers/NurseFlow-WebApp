/**
 * Clinical Workflow UAT & Human Factor Validation Engine
 * Sprint 3J — Measuring 5 Clinical Efficiency Metrics & Validating 12 Hospital Roles
 * 
 * 5 Metrics:
 * 1. Click Count: Actions required to complete clinical transaction
 * 2. Time-on-Task: Duration from chart opening to completion
 * 3. Context Switching: Patient context consistency & isolation
 * 4. Cognitive Friction: Information availability without memory retrieval overhead
 * 5. Error Recovery: Clear actionable guidance vs cryptic HTTP/system errors
 */

export const HOSPITAL_ROLES = {
  ADMISSION_STAFF: 'ADMISSION_STAFF',
  TRIAGE_OFFICER: 'TRIAGE_OFFICER',
  EMERGENCY_NURSE: 'EMERGENCY_NURSE',
  EMERGENCY_PHYSICIAN: 'EMERGENCY_PHYSICIAN',
  INPATIENT_NURSE: 'INPATIENT_NURSE',
  ATTENDING_PHYSICIAN: 'ATTENDING_PHYSICIAN',
  CLINICAL_PHARMACIST: 'CLINICAL_PHARMACIST',
  LAB_ANALYST: 'LAB_ANALYST',
  RADIOGRAPHER_RADIOLOGIST: 'RADIOGRAPHER_RADIOLOGIST',
  SURGICAL_TEAM: 'SURGICAL_TEAM',
  BILLING_CASHIER: 'BILLING_CASHIER',
  CLINICAL_SUPERVISOR_AUDITOR: 'CLINICAL_SUPERVISOR_AUDITOR'
};

export const CLINICAL_BRANCHING_PATHWAYS = {
  IGD: {
    OUTPATIENT_DISCHARGE: 'OUTPATIENT_DISCHARGE',
    INPATIENT_ADMISSION: 'INPATIENT_ADMISSION',
    EXTERNAL_REFERRAL: 'EXTERNAL_REFERRAL',
    DEATH_DECLARATION: 'DEATH_DECLARATION',
    EMERGENCY_OBSERVATION: 'EMERGENCY_OBSERVATION'
  },
  INPATIENT: {
    BED_WARD_TRANSFER: 'BED_WARD_TRANSFER',
    CLASS_UPGRADE_DOWNGRADE: 'CLASS_UPGRADE_DOWNGRADE',
    DPJP_TRANSFER: 'DPJP_TRANSFER',
    INTERSPECIALTY_CONSULT: 'INTERSPECIALTY_CONSULT',
    SURGERY_CITO_ELECTIVE: 'SURGERY_CITO_ELECTIVE',
    ICU_STEP_UP: 'ICU_STEP_UP',
    CLINICAL_DISCHARGE: 'CLINICAL_DISCHARGE'
  }
};

export class ClinicalWorkflowUatEngine {
  constructor() {
    this.sessionLogs = [];
    this.benchmarks = {
      MAX_BEDSIDE_SCAN_CLICKS: 3,
      MAX_EMERGENCY_REG_TIME_MS: 30000,
      MAX_CONTEXT_SWITCH_COUNT: 0,
      MAX_COGNITIVE_FRICTION_SCORE: 2.0 // scale 0-10 (lower is better)
    };
  }

  /**
   * Evaluate a clinical action's efficiency & human factor metrics
   */
  evaluateWorkflowAction({
    role,
    actionName,
    patientId,
    encounterId,
    clickCount,
    durationMs,
    contextSwitches = 0,
    cognitiveFrictionScore = 0, // 0 (seamless) to 10 (high mental burden)
    errorEncountered = null,
    recoveryGuidance = null
  }) {
    if (!role || !actionName || !patientId) {
      throw new Error('[ClinicalUatEngine] role, actionName, dan patientId wajib disediakan.');
    }

    const evaluation = {
      timestamp: new Date().toISOString(),
      role,
      actionName,
      patientId,
      encounterId,
      metrics: {
        clickCount,
        durationMs,
        contextSwitches,
        cognitiveFrictionScore,
        errorEncountered,
        hasActionableRecovery: !!recoveryGuidance && typeof recoveryGuidance === 'string'
      },
      verdict: 'PASS',
      findings: []
    };

    // Rule 1: Point-of-Care Bedside Medication Administration Click Count Check
    if (actionName.includes('BEDSIDE_EMAR') && clickCount > 4) {
      evaluation.verdict = 'WORKFLOW_INEFFICIENCY';
      evaluation.findings.push(`Bedside eMAR requires ${clickCount} clicks. Should be <= 4 clicks via barcode scan.`);
    }

    // Rule 2: Zero Inadvertent Patient Context Switching
    if (contextSwitches > 0) {
      evaluation.verdict = 'CONTEXT_CONTAMINATION_RISK';
      evaluation.findings.push(`Patient context switched ${contextSwitches} times during single clinical session.`);
    }

    // Rule 3: Error Message must be actionable for healthcare staff
    if (errorEncountered) {
      const isTechnicalHttpError = typeof recoveryGuidance === 'string' && (
        recoveryGuidance.includes('HTTP') || 
        recoveryGuidance.includes('500 Internal') ||
        recoveryGuidance.includes('Bad Request') ||
        /\b(400|404|500|502|503)\s+(Error|Bad|Internal)/i.test(recoveryGuidance)
      );

      if (!recoveryGuidance || isTechnicalHttpError) {
        evaluation.verdict = 'POOR_ERROR_RECOVERY';
        evaluation.findings.push('System gave cryptic technical error without clinical guidance on how to fix.');
      }
    }

    // Rule 4: Cognitive Friction Assessment
    if (cognitiveFrictionScore > 4.0) {
      evaluation.verdict = 'HIGH_COGNITIVE_FRICTION';
      evaluation.findings.push(`Cognitive friction score is ${cognitiveFrictionScore}/10. User was forced to manually remember data that should be auto-populated.`);
    }

    this.sessionLogs.push(evaluation);
    return evaluation;
  }

  /**
   * Validate complete end-to-end journey with branch execution
   */
  validatePatientJourneyWithBranching({
    patient,
    initialCareState,
    branchType, // IGD or INPATIENT
    selectedBranch,
    executedSteps = []
  }) {
    const validBranch = branchType === 'IGD' 
      ? Object.values(CLINICAL_BRANCHING_PATHWAYS.IGD).includes(selectedBranch)
      : Object.values(CLINICAL_BRANCHING_PATHWAYS.INPATIENT).includes(selectedBranch);

    if (!validBranch) {
      return {
        isJourneyValid: false,
        reason: `Cabang klinis ${selectedBranch} tidak terdaftar pada jalur ${branchType}.`
      };
    }

    const missingCriticalSteps = [];
    if (branchType === 'IGD') {
      if (!executedSteps.includes('TRIAGE_ASSESSMENT')) missingCriticalSteps.push('TRIAGE_ASSESSMENT');
      if (!executedSteps.includes('PHYSICIAN_ASSESSMENT')) missingCriticalSteps.push('PHYSICIAN_ASSESSMENT');
      if (selectedBranch === CLINICAL_BRANCHING_PATHWAYS.IGD.INPATIENT_ADMISSION && !executedSteps.includes('BED_RESERVATION')) {
        missingCriticalSteps.push('BED_RESERVATION');
      }
      if (selectedBranch === CLINICAL_BRANCHING_PATHWAYS.IGD.OUTPATIENT_DISCHARGE && !executedSteps.includes('DISCHARGE_MEDICATION_RESUME')) {
        missingCriticalSteps.push('DISCHARGE_MEDICATION_RESUME');
      }
    }

    if (branchType === 'INPATIENT') {
      if (selectedBranch === CLINICAL_BRANCHING_PATHWAYS.INPATIENT.CLINICAL_DISCHARGE) {
        if (!executedSteps.includes('DISCHARGE_SUMMARY_SIGNED')) missingCriticalSteps.push('DISCHARGE_SUMMARY_SIGNED');
        if (!executedSteps.includes('FINAL_BILLING_CLEARED')) missingCriticalSteps.push('FINAL_BILLING_CLEARED');
        if (!executedSteps.includes('ENCOUNTER_LOCKED')) missingCriticalSteps.push('ENCOUNTER_LOCKED');
      }
      if (selectedBranch === CLINICAL_BRANCHING_PATHWAYS.INPATIENT.SURGERY_CITO_ELECTIVE) {
        if (!executedSteps.includes('WHO_SURGICAL_CHECKLIST')) missingCriticalSteps.push('WHO_SURGICAL_CHECKLIST');
        if (!executedSteps.includes('ANESTHESIA_CONSENT')) missingCriticalSteps.push('ANESTHESIA_CONSENT');
      }
    }

    return {
      isJourneyValid: missingCriticalSteps.length === 0,
      patientId: patient.id,
      patientName: patient.name,
      branchType,
      selectedBranch,
      missingCriticalSteps,
      status: missingCriticalSteps.length === 0 ? 'CLINICALLY_VERIFIED' : 'DEFECT_DETECTED'
    };
  }

  /**
   * Generate Summary of Clinical UAT Sessions
   */
  getUatSummary() {
    const totalSessions = this.sessionLogs.length;
    const passedSessions = this.sessionLogs.filter(s => s.verdict === 'PASS').length;
    const frictionDefects = this.sessionLogs.filter(s => s.verdict !== 'PASS');

    return {
      totalEvaluations: totalSessions,
      passedEvaluations: passedSessions,
      complianceRate: totalSessions > 0 ? (passedSessions / totalSessions) * 100 : 100,
      defects: frictionDefects,
      status: passedSessions === totalSessions ? 'CLINICAL_UAT_PASSED' : 'CLINICAL_DEFECTS_IDENTIFIED'
    };
  }
}

export const clinicalWorkflowUatEngine = new ClinicalWorkflowUatEngine();
