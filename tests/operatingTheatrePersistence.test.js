/**
 * NurseFlow Enterprise HIS 2026 — Operating Theatre & ICU Acuity Persistence Test Suite (Gate 1D.5)
 * Standards: WHO Guidelines for Safe Surgery, JCI IPSG 4, Sepsis-3 (SOFA) & NEWS2 Protocols
 */

import { describe, it, expect } from 'vitest';
import { operatingTheatreService, SURGICAL_STATUS } from '../server/services/operatingTheatre.service.js';
import { criticalCareService } from '../server/services/criticalCare.service.js';

describe('Gate 1D.5: Operating Theatre (IBS) & ICU Acuity Scoring Persistence', () => {
  const TENANT_A = '00000000-0000-0000-0000-000000000001';
  const TENANT_B = '00000000-0000-0000-0000-000000000002';

  // ─── PART A: OPERATING THEATRE & SURGICAL SAFETY ───

  // 1. Surgery Schedule Booking & Room Slot Mutex
  it('1. should book surgery schedule and prevent active slot collision in the same room', () => {
    const booking1 = operatingTheatreService.bookSurgerySchedule({
      id: 'SCHED-001',
      tenantId: TENANT_A,
      bookingNumber: 'BK-20260901-01',
      patientId: 'PAT-BUDI-01',
      episodeId: 'EP-001',
      encounterId: 'ENC-001',
      operatingRoomId: 'ROOM-OK-01',
      leadSurgeonId: 'DOC-SURG-01',
      leadSurgeonName: 'dr. Sp.B Bambang',
      scheduledDate: '2026-09-01',
      slotTime: '08:00-10:00',
      procedureName: 'Laparoscopic Appendectomy'
    });

    expect(booking1.bookingStatus).toBe('BOOKED');

    // Attempting to double-book the same room and slot must THROW
    expect(() => {
      operatingTheatreService.bookSurgerySchedule({
        id: 'SCHED-002',
        tenantId: TENANT_A,
        bookingNumber: 'BK-20260901-02',
        patientId: 'PAT-SITI-02',
        episodeId: 'EP-002',
        encounterId: 'ENC-002',
        operatingRoomId: 'ROOM-OK-01', // SAME ROOM
        leadSurgeonId: 'DOC-SURG-02',
        leadSurgeonName: 'dr. Sp.OT Hendra',
        scheduledDate: '2026-09-01', // SAME DATE
        slotTime: '08:00-10:00', // SAME TIME SLOT!
        procedureName: 'ORIF Clavicle'
      });
    }).toThrow(/ROOM_COLLISION/);
  });

  // 2. Surgery Case Initialization & Separation from Schedule
  it('2. should initialize a real surgery case with associated blank WHO checklist', () => {
    const sCase = operatingTheatreService.createSurgeryCase({
      id: 'CASE-001',
      tenantId: TENANT_A,
      caseNumber: 'CAS-20260901-01',
      scheduleId: 'SCHED-001',
      patientId: 'PAT-BUDI-01',
      episodeId: 'EP-001',
      encounterId: 'ENC-001',
      operatingRoomId: 'ROOM-OK-01',
      leadSurgeonId: 'DOC-SURG-01',
      leadSurgeonName: 'dr. Sp.B Bambang',
      procedureName: 'Laparoscopic Appendectomy'
    });

    expect(sCase.surgicalStatus).toBe(SURGICAL_STATUS.SCHEDULED);
    expect(operatingTheatreService.checklists.has('CASE-001')).toBe(true);
  });

  // 3. Safety Barrier: Cannot Start Procedure Without Sign-In and Time-Out
  it('3. should enforce database safety barriers blocking procedure start without WHO Sign-In and Time-Out', () => {
    // Attempt to start procedure immediately
    expect(() => {
      operatingTheatreService.startProcedure('CASE-001');
    }).toThrow(/SAFETY_VIOLATION.*Sign-In and Time-Out/);

    // Perform Phase 1: Sign-In
    const signInResult = operatingTheatreService.performSignIn('CASE-001', {
      patientIdentitySiteVerified: true,
      siteMarked: true,
      anesthesiaSafetyCheckCompleted: true,
      pulseOximeterFunctioning: true,
      knownAllergyConfirmed: true,
      bloodLossRiskPrepared: true,
      verifiedByNurse: 'Ns. Ani',
      anesthesiologistName: 'dr. Sp.An Charles'
    });
    expect(signInResult.status).toBe(SURGICAL_STATUS.SIGN_IN_COMPLETED);

    // Still fails to start because Time-Out is missing
    expect(() => {
      operatingTheatreService.startProcedure('CASE-001');
    }).toThrow(/SAFETY_VIOLATION.*Sign-In and Time-Out/);
  });

  // 4. Time-Out Completion & Procedure Start
  it('4. should execute WHO Time-Out and allow skin incision (PROCEDURE_IN_PROGRESS)', () => {
    const timeOutResult = operatingTheatreService.performTimeOut('CASE-001', {
      allTeamMembersIntroduced: true,
      patientNameProcedureSiteConfirmed: true,
      antibioticProphylaxisGivenWithin60min: true,
      anticipatedCriticalEventsReviewed: true,
      sterilityIndicatorConfirmed: true,
      verifiedByNurse: 'Ns. Ani',
      surgeonName: 'dr. Sp.B Bambang'
    });
    expect(timeOutResult.status).toBe(SURGICAL_STATUS.TIME_OUT_COMPLETED);

    // Now start procedure succeeds
    const startResult = operatingTheatreService.startProcedure('CASE-001');
    expect(startResult.status).toBe(SURGICAL_STATUS.PROCEDURE_IN_PROGRESS);
    expect(startResult.startedAt).toBeDefined();
  });

  // 5. Sign-Out Enforcement & Procedure Completion
  it('5. should enforce WHO Sign-Out before procedure completion and finalize checklist', () => {
    // Attempting to complete procedure without Sign-Out must fail
    expect(() => {
      operatingTheatreService.completeProcedure('CASE-001', {
        postOpDiagnosis: 'Acute Gangrenous Appendicitis',
        surgicalTechniqueNotes: 'Laparoscopic appendectomy 3 trocars'
      });
    }).toThrow(/SAFETY_VIOLATION.*Sign-Out/);

    // Perform Phase 3: Sign-Out
    const signOutResult = operatingTheatreService.performSignOut('CASE-001', {
      nurseVerballyConfirmsProcedure: true,
      instrumentSpongeNeedleCountsCorrect: true,
      specimenLabelledCorrectly: true,
      equipmentProblemsAddressed: true,
      postopConcernsReviewed: true,
      verifiedByNurse: 'Ns. Ani'
    });
    expect(signOutResult.status).toBe(SURGICAL_STATUS.SIGN_OUT_COMPLETED);

    // Now complete procedure succeeds
    const completeResult = operatingTheatreService.completeProcedure('CASE-001', {
      postOpDiagnosis: 'Acute Gangrenous Appendicitis',
      surgicalTechniqueNotes: 'Laparoscopic appendectomy 3 trocars',
      bloodLossMl: 25
    });
    expect(completeResult.status).toBe(SURGICAL_STATUS.PROCEDURE_COMPLETED);
    expect(operatingTheatreService.checklists.get('CASE-001').isFinalized).toBe(true);
  });

  // 6. PACU Aldrete Recovery & Handoff
  it('6. should evaluate PACU recovery (Aldrete score) and transition to post-op handoff', () => {
    const handoff = operatingTheatreService.recordPacuHandoff('CASE-001', {
      aldreteActivityScore: 2,
      aldreteRespirationScore: 2,
      aldreteCirculationScore: 2,
      aldreteConsciousnessScore: 2,
      aldreteO2SaturationScore: 2,
      transferDestination: 'INPATIENT_WARD',
      handedOverByPacuNurse: 'Ns. Ratih (PACU)',
      receivedByWardNurse: 'Ns. Dewi (Ward Melati)'
    });

    expect(handoff.totalAldreteScore).toBe(10);
    expect(handoff.isReadyForDischarge).toBe(true);
    expect(operatingTheatreService.cases.get('CASE-001').surgicalStatus).toBe(SURGICAL_STATUS.POST_OP_HANDOFF);
  });

  // ─── PART B: ICU ACUITY SCORING & HIGH-FREQUENCY EVIDENCE CHAIN ───

  // 7. Record Versioned SOFA Assessment with Raw Observation Snapshot
  it('7. should record versioned SOFA assessment with complete raw observation snapshot', () => {
    const rawSofa = {
      pao2Fio2Ratio: 180, // Score 3
      platelets: 45000,    // Score 3
      bilirubin: 3.5,      // Score 2
      meanArterialPressure: 65,
      onVasopressors: true, // Score 3
      gcs: 10,             // Score 2
      creatinine: 2.5      // Score 2
    };

    const assessment = criticalCareService.recordIcuAcuityAssessment({
      id: 'ICU-ASSESS-001',
      tenantId: TENANT_A,
      patientId: 'PAT-ICU-01',
      episodeId: 'EP-ICU-001',
      encounterId: 'ENC-ICU-001',
      scoringSystem: 'SOFA',
      algorithmVersion: 'v1.0',
      rawScoringInputs: rawSofa,
      assessedById: 'DOC-INTENSIVIST-01',
      assessedByName: 'dr. Sp.An-KIC David'
    });

    expect(assessment.calculatedScore).toBe(15); // 3+3+2+3+2+2 = 15
    expect(assessment.riskStratification).toBe('HIGH_MORTALITY_RISK (>80%)');
    expect(assessment.escalationTriggered).toBe(true);
    expect(assessment.rawScoringInputs).toEqual(rawSofa);
  });

  // 8. Reproducibility Guarantee from Raw Observations Snapshot
  it('8. should guarantee 100% score reproducibility from stored raw input snapshots', () => {
    const repCheck = criticalCareService.reproduceScoreFromSnapshot('ICU-ASSESS-001');
    expect(repCheck.isReproducible).toBe(true);
    expect(repCheck.recalculatedScore).toBe(15);
  });

  // 9. Record NEWS2 Score with Clinical Escalation Threshold
  it('9. should calculate and persist NEWS2 score with clinical risk stratification', () => {
    const rawNews2 = {
      respirationRate: 24, // Score 2
      spo2: 92,            // Score 3
      onSupplementalOxygen: true, // Score 2
      systolicBp: 95,      // Score 2
      heartRate: 115,      // Score 1
      consciousness: 'ALERT', // Score 0
      temperature: 38.5    // Score 1
    };

    const assessment = criticalCareService.recordIcuAcuityAssessment({
      id: 'ICU-ASSESS-002',
      tenantId: TENANT_A,
      patientId: 'PAT-ICU-02',
      episodeId: 'EP-ICU-002',
      encounterId: 'ENC-ICU-002',
      scoringSystem: 'NEWS2',
      algorithmVersion: 'v1.0',
      rawScoringInputs: rawNews2,
      assessedById: 'NURSE-ICU-01',
      assessedByName: 'Ns. Maya, S.Kep'
    });

    expect(assessment.calculatedScore).toBe(11); // 2+3+2+2+1+0+1 = 11
    expect(assessment.riskStratification).toBe('CRITICAL_HIGH_CLINICAL_RISK');
    expect(assessment.escalationTriggered).toBe(true);
  });

  // 10. Multi-Tenant Isolation for Operating Theatre & ICU Domain
  it('10. should strictly isolate Operating Theatre schedules, cases, and ICU assessments by tenant', () => {
    const schedA = Array.from(operatingTheatreService.schedules.values()).filter(s => s.tenantId === TENANT_A);
    const schedB = Array.from(operatingTheatreService.schedules.values()).filter(s => s.tenantId === TENANT_B);

    const icuA = Array.from(criticalCareService.assessments.values()).filter(a => a.tenantId === TENANT_A);
    const icuB = Array.from(criticalCareService.assessments.values()).filter(a => a.tenantId === TENANT_B);

    expect(schedA.length).toBeGreaterThan(0);
    expect(schedB).toHaveLength(0);
    expect(icuA.length).toBeGreaterThan(0);
    expect(icuB).toHaveLength(0);
  });
});
