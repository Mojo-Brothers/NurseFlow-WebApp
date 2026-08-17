import { describe, it, expect } from 'vitest';
import { clinicalWorkflowOrchestrator, WORKFLOW_STAGES } from '../server/services/clinicalWorkflowOrchestrator.service.js';

describe('Universal Clinical State Machine Workflow Orchestrator', () => {
  const encounterId = 'ENC-JOURNEY-001';

  it('should initialize a formal clinical workflow journey at ARRIVED stage', () => {
    const journey = clinicalWorkflowOrchestrator.startJourney({
      encounterId,
      patientId: 'P-1001',
      patientName: 'Ny. Siti Nurhaliza',
      departmentId: 'DEPT-IGD'
    });

    expect(journey.currentStage).toBe(WORKFLOW_STAGES.ARRIVED);
  });

  it('should transition through valid stages (ARRIVED -> TRIAGED -> CONSULTING)', () => {
    const step1 = clinicalWorkflowOrchestrator.transitionStage({
      encounterId,
      nextStage: WORKFLOW_STAGES.TRIAGED,
      actorName: 'Perawat Triase Ns. Indah'
    });
    expect(step1.currentStage).toBe(WORKFLOW_STAGES.TRIAGED);

    const step2 = clinicalWorkflowOrchestrator.transitionStage({
      encounterId,
      nextStage: WORKFLOW_STAGES.CONSULTING,
      actorName: 'dr. Siti Wijaya, Sp.PD'
    });
    expect(step2.currentStage).toBe(WORKFLOW_STAGES.CONSULTING);
  });

  it('should prohibit illegal stage skipping (e.g. ARRIVED directly to COMPLETED)', () => {
    const invalidJourneyId = 'ENC-INVALID-99';
    clinicalWorkflowOrchestrator.startJourney({
      encounterId: invalidJourneyId,
      patientId: 'P-999',
      patientName: 'Pasien Test',
      departmentId: 'DEPT-IRJ'
    });

    expect(() => {
      clinicalWorkflowOrchestrator.transitionStage({
        encounterId: invalidJourneyId,
        nextStage: WORKFLOW_STAGES.COMPLETED,
        actorName: 'Sistem'
      });
    }).toThrow(/Transisi Ilegal/);
  });
});
