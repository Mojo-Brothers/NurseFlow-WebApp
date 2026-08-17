/**
 * NurseFlow Enterprise HIS 2026 — Emergency UAT Clinical Journey Test Suite
 * Standards: Primaya Hospital Emergency SOP, AHA/ASA Stroke, AHA STEMI & ATLS 10th Ed.
 */

import { describe, it, expect } from 'vitest';
import { emergencyUatJourneyService } from '../server/services/emergencyUatJourney.service.js';

describe('Sprint 13: Emergency Department (IGD) Full-Journey UAT Simulation Suite', () => {

  // 1. Skenario 1: Acute Ischemic Stroke (Code Stroke)
  it('1. should execute full Code Stroke journey (Triage -> SOAP -> CT -> eMAR Alteplase -> ICU -> Billing -> SATUSEHAT) within SLA', () => {
    const journey = emergencyUatJourneyService.executeCodeStrokeJourney({
      patientNik: '3171015502800001',
      patientName: 'Tn. Budi Santoso',
      doctorName: 'dr. Hendra Sp.S',
      nurseName: 'Ners Ratna S.Kep'
    });

    expect(journey.scenario).toBe('CODE_STROKE_ACUTE');
    expect(journey.totalStepsExecuted).toBe(8);
    expect(journey.dataEntrySlaCompliant).toBe(true);

    // Verify critical steps
    const emarStep = journey.timeline.find(t => t.step === 'EMAR_ADMINISTRATION');
    expect(emarStep).toBeDefined();
    expect(emarStep.drugName).toContain('Alteplase');
    expect(emarStep.safetyCheck).toBe('7_RIGHTS_VERIFIED');

    const satusehatStep = journey.timeline.find(t => t.step === 'SATUSEHAT_SYNC');
    expect(satusehatStep).toBeDefined();
    expect(satusehatStep.syncStatus).toBe('HTTP_201_CREATED');
  });

  // 2. Skenario 2: Acute STEMI (Door-to-ECG < 10 Menit)
  it('2. should execute Acute STEMI journey and achieve Door-to-ECG SLA <= 10 minutes with Cathlab activation', () => {
    const stemi = emergencyUatJourneyService.executeCodeStemiJourney({
      patientNik: '3171015502800002',
      patientName: 'Tn. Haryono',
      doctorName: 'dr. Bambang Sp.JP',
      nurseName: 'Ners Ahmad S.Kep'
    });

    expect(stemi.scenario).toBe('CODE_STEMI_PRIMARY_PCI');
    expect(stemi.doorToEcgSlaPassed).toBe(true);
    expect(stemi.doorToEcgMinutes).toBeLessThanOrEqual(10.0);

    const cathlabStep = stemi.timeline.find(t => t.step === 'CATHLAB_ACTIVATION');
    expect(cathlabStep).toBeDefined();
    expect(cathlabStep.status).toBe('TRANSFERRED_TO_CATHLAB');
  });

  // 3. Skenario 3: Multiple Trauma ATLS (Red Triage -> FAST -> Blood Bank -> OR Cito -> ICU)
  it('3. should execute Multiple Trauma ATLS journey with emergency crossmatch and Cito OR activation', () => {
    const trauma = emergencyUatJourneyService.executeMultipleTraumaJourney({
      patientNik: '3171015502800003',
      patientName: 'Tn. Anton (KLL)',
      doctorName: 'dr. Reza Sp.B',
      nurseName: 'Ners Maya S.Kep'
    });

    expect(trauma.scenario).toBe('MULTIPLE_TRAUMA_ATLS_CITO_OR');
    expect(trauma.totalStepsExecuted).toBe(4);

    const bdrsStep = trauma.timeline.find(t => t.step === 'BDRS_TRANSFUSION_ORDER');
    expect(bdrsStep).toBeDefined();
    expect(bdrsStep.unitsOrdered).toBe(4);
    expect(bdrsStep.bloodType).toBe('O_RH_POSITIVE');

    const orStep = trauma.timeline.find(t => t.step === 'OPERATING_THEATRE_CITO');
    expect(orStep).toBeDefined();
    expect(orStep.status).toBe('SURGERY_IN_PROGRESS');
  });

});
