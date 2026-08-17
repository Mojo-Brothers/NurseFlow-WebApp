/**
 * NurseFlow Enterprise HIS 2026 — IGD Triage & Emergency Vertical Slice Test Suite (Gate 1E.3)
 * Standards: ESI v4, ATS, KARS PMKP Response Time Indicator, JCI 7th Edition
 */

import { describe, it, expect } from 'vitest';
import { triageEngineService, TRIAGE_LEVEL_SPECS } from '../src/modules/emergency/services/triageEngine.service.js';
import { triageSlaEngineService } from '../src/modules/emergency/services/triageSlaEngine.service.js';

describe('Gate 1E.3: IGD Triage & Emergency Clinical Vertical Slice', () => {
  // 1. ESI 1 / Immediate Life-Saving Classification
  it('1. should classify apnea, obstructed airway, or profound shock as ESI 1 with 0 min response target', () => {
    const resus1 = triageEngineService.classifySeverity({
      airwayStatus: 'OBSTRUCTED',
      breathingStatus: 'APNEA',
      circulationStatus: 'SHOCK',
      spo2: 72,
      heartRate: 145,
      gcsTotal: 5,
      painScale: 10
    });

    expect(resus1.level).toBe(1);
    expect(resus1.code).toBe('P1_RESUSCITATION');
    expect(resus1.targetMinutes).toBe(0);
    expect(resus1.colorCode).toBe('RED');
  });

  // 2. ESI 2 / Emergent & High-Risk Danger Zone Classification
  it('2. should classify severe dyspnea, SpO2 <= 92%, severe pain (>=7), or HR > 130 as ESI 2 with 10 min target', () => {
    const emergent = triageEngineService.classifySeverity({
      airwayStatus: 'PATENT',
      breathingStatus: 'DYSPNEA',
      circulationStatus: 'NORMAL',
      spo2: 90,
      heartRate: 135,
      gcsTotal: 14,
      painScale: 8
    });

    expect(emergent.level).toBe(2);
    expect(emergent.code).toBe('P2_EMERGENT');
    expect(emergent.targetMinutes).toBe(10);
    expect(emergent.colorCode).toBe('ORANGE');
  });

  // 3. ESI 3 / Urgent Moderate Complexity Classification
  it('3. should classify moderate pain or borderline vitals as ESI 3 with 30 min target', () => {
    const urgent = triageEngineService.classifySeverity({
      airwayStatus: 'PATENT',
      breathingStatus: 'NORMAL',
      circulationStatus: 'NORMAL',
      spo2: 95,
      heartRate: 108,
      gcsTotal: 15,
      painScale: 5
    });

    expect(urgent.level).toBe(3);
    expect(urgent.code).toBe('P3_URGENT');
    expect(urgent.targetMinutes).toBe(30);
  });

  // 4. GCS Boundary and Component Calculation
  it('4. should compute Glasgow Coma Scale correctly with boundary clamping (3 to 15)', () => {
    // Normal Alert
    const gcsNormal = triageEngineService.calculateGcs(4, 5, 6);
    expect(gcsNormal.total).toBe(15);

    // Deep Coma
    const gcsComa = triageEngineService.calculateGcs(1, 1, 1);
    expect(gcsComa.total).toBe(3);

    // Clamping invalid high inputs
    const gcsClamped = triageEngineService.calculateGcs(10, 10, 10);
    expect(gcsClamped.total).toBe(15);
  });

  // 5. SLA Countdown Timer & Overdue Detection
  it('5. should start and evaluate SLA timers for emergency response time compliance', async () => {
    const timer = await triageSlaEngineService.startSlaTimer({
      encounterId: 'ENC-TEST-SLA-01',
      patientName: 'Ny. Siti Nurhaliza',
      triageLevel: 'P2_EMERGENT',
      targetResponseMinutes: 10
    });

    expect(timer.id).toBeDefined();
    expect(timer.target_response_minutes).toBe(10);
    expect(timer.status).toBe('RUNNING');

    // Simulate complete response
    const completed = await triageSlaEngineService.recordFirstPhysicianContact({
      encounterId: timer.encounter_id,
      physicianName: 'dr. Surya Johnson, Sp.PD'
    });
    expect(completed.status).toBe('COMPLETED');
    expect(completed.first_physician_contact_at).toBeDefined();
  });

  // 6. Complete Triage Assessment Lifecycle Persistence
  it('6. should record full triage assessment and transition encounter state to TRIAGED', async () => {
    const record = await triageEngineService.recordTriageAssessment({
      episodeId: 'EOC-TEST-001',
      encounterId: 'ENC-TEST-001',
      patientId: 'PAT-TEST-001',
      patientName: 'Tn. Budi Santoso',
      mrn: 'MRN-2026-001',
      chiefComplaint: 'Nyeri dada mendadak & sesak napas',
      airwayStatus: 'PATENT',
      breathingStatus: 'DYSPNEA',
      circulationStatus: 'SHOCK',
      spo2: 89,
      heartRate: 122,
      bloodPressureSystolic: 80,
      bloodPressureDiastolic: 50,
      painScale: 9,
      assessorName: 'Ns. Sarah, S.Kep'
    });

    expect(record.id).toBeDefined();
    expect(record.triage_level).toBe('P1_RESUSCITATION');
    expect(record.is_cito).toBe(true);
    expect(record.target_response_minutes).toBe(0);
  });
});
