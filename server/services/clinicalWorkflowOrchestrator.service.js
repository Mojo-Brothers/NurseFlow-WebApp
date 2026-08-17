/**
 * NurseFlow Enterprise HIS 2026 — Universal Clinical State Machine Workflow Orchestrator
 * Replaces hardcoded imperative logic with a Formal State Machine & Event-Driven Pipeline
 * Standar: JCI Patient Care Continuity & ISO 13606 EHR Architecture
 */

export const WORKFLOW_STAGES = {
  ARRIVED: 'ARRIVED',
  TRIAGED: 'TRIAGED',
  CONSULTING: 'CONSULTING',
  CPOE_ACTIVE: 'CPOE_ACTIVE',
  DISPENSING: 'DISPENSING',
  ADMINISTERING: 'ADMINISTERING',
  BILLING_PENDING: 'BILLING_PENDING',
  DISCHARGE_READY: 'DISCHARGE_READY',
  COMPLETED: 'COMPLETED'
};

export const ALLOWED_STAGE_TRANSITIONS = {
  ARRIVED: ['TRIAGED', 'CANCELLED'],
  TRIAGED: ['CONSULTING', 'CPOE_ACTIVE'],
  CONSULTING: ['CPOE_ACTIVE', 'BILLING_PENDING', 'DISCHARGE_READY'],
  CPOE_ACTIVE: ['DISPENSING', 'BILLING_PENDING'],
  DISPENSING: ['ADMINISTERING', 'BILLING_PENDING'],
  ADMINISTERING: ['DISCHARGE_READY', 'BILLING_PENDING'],
  BILLING_PENDING: ['DISCHARGE_READY', 'COMPLETED'],
  DISCHARGE_READY: ['COMPLETED'],
  COMPLETED: []
};

class ClinicalWorkflowOrchestrator {
  constructor() {
    this.activeJourneys = new Map(); // EncounterId -> Journey State
  }

  /**
   * Initialize a Formal Clinical Workflow Journey
   */
  startJourney({ encounterId, patientId, patientName, departmentId }) {
    const journey = {
      encounterId,
      patientId,
      patientName,
      departmentId,
      currentStage: WORKFLOW_STAGES.ARRIVED,
      history: [
        {
          from: null,
          to: WORKFLOW_STAGES.ARRIVED,
          transitionedAt: new Date().toISOString(),
          actor: 'PATIENT_REGISTRATION'
        }
      ]
    };

    this.activeJourneys.set(encounterId, journey);
    return journey;
  }

  /**
   * Execute State Machine Transition with Transition Guard
   */
  transitionStage({ encounterId, nextStage, actorName, payload = {} }) {
    const journey = this.activeJourneys.get(encounterId);
    if (!journey) {
      throw new Error(`Perjalanan klinis untuk encounter ${encounterId} belum diinisialisasi.`);
    }

    const currentStage = journey.currentStage;
    const allowedNext = ALLOWED_STAGE_TRANSITIONS[currentStage] || [];

    if (!allowedNext.includes(nextStage)) {
      throw new Error(`Transisi Ilegal: Tahapan '${currentStage}' TIDAK DAPAT langsung beralih ke '${nextStage}'. Tahapan yang diizinkan: [${allowedNext.join(', ')}]`);
    }

    journey.currentStage = nextStage;
    journey.history.push({
      from: currentStage,
      to: nextStage,
      transitionedAt: new Date().toISOString(),
      actor: actorName,
      payload
    });

    return {
      success: true,
      encounterId,
      previousStage: currentStage,
      currentStage: nextStage,
      historyLength: journey.history.length
    };
  }

  getJourneyStatus(encounterId) {
    return this.activeJourneys.get(encounterId);
  }
}

export const clinicalWorkflowOrchestrator = new ClinicalWorkflowOrchestrator();
