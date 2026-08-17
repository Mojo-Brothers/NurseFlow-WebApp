import { describe, it, expect } from 'vitest';
import {
  radiologyWorkflowEngineService,
  RAD_ORDER_STATUS
} from '../server/services/radiologyWorkflowEngine.service.js';
import {
  criticalResultEscalationService,
  ESCALATION_LEVELS
} from '../server/services/criticalResultEscalation.service.js';
import { radiologyAuditService } from '../server/services/radiologyAudit.service.js';

describe('Gate 1D.9: Enterprise Clinical Workflow Integration (PACS/RIS, DICOM MWL & JCI Escalation)', () => {

  // 1. Order Creation & Initial State
  it('1. should create a CPOE radiology order in initial ORDERED state', () => {
    const order = radiologyWorkflowEngineService.createOrder({
      patientId: 'P-2001',
      patientMrn: 'MRN-2026-002001',
      patientName: 'Ny. Dewi Sartika',
      encounterId: 'ENC-2026-009',
      modality: 'CT',
      examinationCode: 'RAD-CT-ABDOMEN',
      examinationName: 'CT Scan Abdomen 3 Fase Kontras',
      priority: 'URGENT',
      clinicalIndication: 'Nyeri perut akut kuadran kanan bawah, suspek appendicitis perforasi.'
    }, { id: 'DOC-01', name: 'dr. Surya, Sp.PD', role: 'DOCTOR' });

    expect(order.id).toBeDefined();
    expect(order.orderNumber).toMatch(/^RO-/);
    expect(order.status).toBe(RAD_ORDER_STATUS.ORDERED);
    expect(order.billingStatus).toBe('PENDING');
  });

  // 2. 9-State Finite State Machine (FSM) Lifecycle
  it('2. should transition order through complete 9-state FSM lifecycle smoothly', () => {
    const order = radiologyWorkflowEngineService.createOrder({
      patientId: 'P-2002',
      patientMrn: 'MRN-2026-002002',
      patientName: 'Tn. Ahmad Dahlan',
      encounterId: 'ENC-2026-010',
      modality: 'CR',
      examinationCode: 'RAD-THORAX-PA',
      examinationName: 'Foto Thorax PA Digital',
      priority: 'ROUTINE',
      clinicalIndication: 'Medical checkup rutin.'
    });

    // 1. ORDERED -> SCHEDULED
    const s1 = radiologyWorkflowEngineService.transitionStatus(order.id, RAD_ORDER_STATUS.SCHEDULED, { id: 'ADM', name: 'Admisi', role: 'ADMIN' });
    expect(s1.status).toBe(RAD_ORDER_STATUS.SCHEDULED);

    // 2. SCHEDULED -> PATIENT_ARRIVED
    const s2 = radiologyWorkflowEngineService.transitionStatus(order.id, RAD_ORDER_STATUS.PATIENT_ARRIVED);
    expect(s2.status).toBe(RAD_ORDER_STATUS.PATIENT_ARRIVED);
    expect(s2.patientArrivedAt).toBeDefined();

    // 3. PATIENT_ARRIVED -> IN_PROGRESS
    const s3 = radiologyWorkflowEngineService.transitionStatus(order.id, RAD_ORDER_STATUS.IN_PROGRESS);
    expect(s3.status).toBe(RAD_ORDER_STATUS.IN_PROGRESS);

    // 4. IN_PROGRESS -> IMAGE_ACQUIRED
    const s4 = radiologyWorkflowEngineService.transitionStatus(order.id, RAD_ORDER_STATUS.IMAGE_ACQUIRED);
    expect(s4.status).toBe(RAD_ORDER_STATUS.IMAGE_ACQUIRED);

    // 5. IMAGE_ACQUIRED -> REPORT_PENDING
    const s5 = radiologyWorkflowEngineService.transitionStatus(order.id, RAD_ORDER_STATUS.REPORT_PENDING);
    expect(s5.status).toBe(RAD_ORDER_STATUS.REPORT_PENDING);

    // 6. REPORT_PENDING -> REPORT_FINALIZED
    const s6 = radiologyWorkflowEngineService.transitionStatus(order.id, RAD_ORDER_STATUS.REPORT_FINALIZED);
    expect(s6.status).toBe(RAD_ORDER_STATUS.REPORT_FINALIZED);

    // 7. REPORT_FINALIZED -> COMPLETED (Triggers Auto-Billing)
    const s7 = radiologyWorkflowEngineService.transitionStatus(order.id, RAD_ORDER_STATUS.COMPLETED);
    expect(s7.status).toBe(RAD_ORDER_STATUS.COMPLETED);
    expect(s7.billingStatus).toBe('BILLED');

    // 8. COMPLETED -> ARCHIVED
    const s8 = radiologyWorkflowEngineService.transitionStatus(order.id, RAD_ORDER_STATUS.ARCHIVED);
    expect(s8.status).toBe(RAD_ORDER_STATUS.ARCHIVED);
  });

  // 3. FSM Rejection of Illegal State Transitions
  it('3. should reject illegal state jumps violating the FSM contract', () => {
    const order = radiologyWorkflowEngineService.createOrder({
      patientId: 'P-2003',
      patientMrn: 'MRN-2026-002003',
      patientName: 'Tn. Gatot Subroto',
      encounterId: 'ENC-2026-011',
      modality: 'MR',
      examinationName: 'MRI Brain',
      priority: 'ROUTINE'
    });

    // Attempt direct jump from ORDERED to COMPLETED without imaging & reporting
    expect(() => {
      radiologyWorkflowEngineService.transitionStatus(order.id, RAD_ORDER_STATUS.COMPLETED);
    }).toThrow(/Transisi status tidak valid/);
  });

  // 4. DICOM Modality Worklist (MWL) Generation
  it('4. should populate DICOM Modality Worklist (MWL) with active procedure steps', () => {
    const mwl = radiologyWorkflowEngineService.getModalityWorklist();
    expect(mwl.length).toBeGreaterThan(0);
    expect(mwl[0].patientName).toBeDefined();
    expect(mwl[0].accessionNumber).toBeDefined();
    expect(mwl[0].scheduledStationAeTitle).toMatch(/_ROOM_01$/);
  });

  // 5. WHO / JCI Multi-Tier Critical Result Escalation Protocol
  it('5. should escalate critical finding through Level 1, 2, and 3 based on elapsed time', () => {
    const alertId = `ALERT-TEST-${Date.now()}`;
    criticalResultEscalationService.registerCriticalResult({
      alertId,
      patientMrn: 'MRN-2026-002001',
      patientName: 'Ny. Dewi Sartika',
      findingName: 'Aortic Dissection Stanford Type A',
      threat: 'Ruptur Aorta Letal'
    });

    // T+15 min: Escalation Level 1 (DPJP)
    const esc15 = criticalResultEscalationService.evaluateEscalation(alertId, 16);
    expect(esc15.currentEscalationLevel).toBe(1);
    expect(esc15.escalationHistory.some(h => h.level === 1)).toBe(true);

    // T+30 min: Escalation Level 2 (Head Nurse)
    const esc30 = criticalResultEscalationService.evaluateEscalation(alertId, 32);
    expect(esc30.currentEscalationLevel).toBe(2);
    expect(esc30.escalationHistory.some(h => h.level === 2)).toBe(true);

    // T+60 min: Escalation Level 3 (Medical Director)
    const esc60 = criticalResultEscalationService.evaluateEscalation(alertId, 65);
    expect(esc60.currentEscalationLevel).toBe(3);
    expect(esc60.escalationHistory.some(h => h.level === 3)).toBe(true);

    // Acknowledge alert
    const ack = criticalResultEscalationService.acknowledgeAlert(alertId, 'dr. Surya, Sp.PD', 'Read-back confirmed');
    expect(ack.isAcknowledged).toBe(true);
  });

  // 6. Immutable JCI Forensic Audit Trail
  it('6. should record immutable audit logs with correlation IDs for all imaging actions', () => {
    const entry = radiologyAuditService.recordEvent({
      patientMrn: 'MRN-2026-002001',
      eventType: 'IMAGE_VIEWED',
      actorId: 'DOC-PD-01',
      actorName: 'dr. Surya Johnson, Sp.PD',
      actorRole: 'DPJP',
      details: { viewMode: 'WW/WL Lung Preset', durationSec: 140 }
    });

    expect(entry.id).toBeDefined();
    expect(entry.correlationId).toMatch(/^CORR-RAD-/);
    expect(Object.isFrozen(entry)).toBe(true);

    const patientLogs = radiologyAuditService.getAuditTrailByMrn('MRN-2026-002001');
    expect(patientLogs.length).toBeGreaterThan(0);
  });
});
