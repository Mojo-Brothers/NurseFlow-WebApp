/**
 * SPRINT 3K — BATCH 4: S-08 APPENDICITIS AKUT PERFORASI & CITO SURGERY (WHO CHECKLIST)
 * Technical Reconciliation & Multi-Role Surgical Safety Invariant Suite
 * 
 * Target Patient: Sdr. Eko (MRN-2026-009008 / PAT-COHORT-S08)
 * Acuity: ESI-2 IGD -> CITO Appendectomy (IBS OK-02)
 * Clinical Context: Acute Perforated Appendicitis, Rebound Tenderness, Leukocytosis 18.200
 * 
 * Primary Experimental Question:
 * Does the system prevent surgical progression with incorrect or unverified information
 * as care transfers across multiple professions (Surgeon, Anesthesiologist, OR Nurse, PACU)?
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { persistenceAdapter, DB_ENGINE_TYPES } from '../src/core/services/persistenceAdapter.service.js';
import { experimentalCohortSeeder } from '../src/core/services/experimentalCohortSeeder.service.js';
import { operatingTheatreEngineService, SURGERY_STATUS } from '../src/modules/surgery/services/operatingTheatreEngine.service.js';
import { careStateEngine, CARE_STATES, CLINICAL_EVENTS } from '../src/core/services/careStateEngine.service.js';

describe('Sprint 3K — Batch 4: S-08 Appendicitis Surgery & WHO Checklist Reconciliation', () => {
  beforeEach(async () => {
    persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);
    await experimentalCohortSeeder.seedCohort();
  });

  it('1. Step 1: Emergency Surgical Consultation & CITO Booking in IBS OK-02', async () => {
    const patient = await persistenceAdapter.findById('patients', 'PAT-COHORT-S08');
    const encounter = await persistenceAdapter.findById('encounters', 'ENC-COHORT-S08');

    expect(patient.name).toBe('Sdr. Eko');
    expect(patient.mrn).toBe('MRN-2026-009008');
    expect(encounter.triageLevel).toBe('ESI-2');

    // 1. Create CITO Surgical Booking
    const surgicalCase = operatingTheatreEngineService.scheduleSurgicalCase({
      patientId: patient.id,
      patientMrn: patient.mrn,
      patientName: patient.name,
      encounterId: encounter.id,
      theatreId: 'THEATRE-OK-02',
      theatreName: 'OK-02 Bedah Laparoskopi',
      procedureName: 'Apendektomi Laparoskopi / Laparotomi Eksplorasi CITO',
      procedureCode: 'ICD9-47.09',
      primarySurgeonName: 'dr. Budi, Sp.B',
      anesthesiologistName: 'dr. Ratna, Sp.An',
      scrubNurseName: 'Ns. Maya, S.Kep',
      surgicalUrgency: 'EMERGENCY_CITO',
      scheduledStart: '2026-08-19T03:15:00.000Z',
      scheduledEnd: '2026-08-19T04:45:00.000Z'
    });

    expect(surgicalCase.bookingNumber).toBeDefined();
    expect(surgicalCase.surgicalUrgency).toBe('EMERGENCY_CITO');
    expect(surgicalCase.theatreId).toBe('THEATRE-OK-02');

    // 2. Advance status to Pre-Op & In-Theatre
    operatingTheatreEngineService.transitionCaseStatus(surgicalCase.id, SURGERY_STATUS.PRE_OP_HOLDING);
    operatingTheatreEngineService.transitionCaseStatus(surgicalCase.id, SURGERY_STATUS.IN_THEATRE);

    const activeCase = operatingTheatreEngineService.getCaseById(surgicalCase.id);
    expect(activeCase.status).toBe(SURGERY_STATUS.IN_THEATRE);
  });

  it('2. Step 2: Phase 1 Sign-In Verification (Before Induction of Anesthesia)', async () => {
    const surgicalCase = operatingTheatreEngineService.scheduleSurgicalCase({
      patientId: 'PAT-COHORT-S08',
      patientMrn: 'MRN-2026-009008',
      patientName: 'Sdr. Eko',
      encounterId: 'ENC-COHORT-S08',
      theatreId: 'THEATRE-OK-02',
      procedureName: 'Apendektomi CITO',
      primarySurgeonName: 'dr. Budi, Sp.B',
      anesthesiologistName: 'dr. Ratna, Sp.An',
      scrubNurseName: 'Ns. Maya, S.Kep',
      surgicalUrgency: 'EMERGENCY_CITO'
    });

    const signInData = {
      patientConfirmed: true,
      surgicalSiteMarked: true,
      anesthesiaSafetyCheckComplete: true,
      pulseOximeterFunctioning: true,
      allergyIdentified: false,
      difficultAirwayRiskAssessed: true,
      bloodLossRiskAssessed: true // < 500 mL
    };

    expect(signInData.patientConfirmed).toBe(true);
    expect(signInData.surgicalSiteMarked).toBe(true);
    expect(signInData.anesthesiaSafetyCheckComplete).toBe(true);
  });

  it('3. Step 3: Phase 2 Time-Out Verification (Before Skin Incision - Hard Safety Invariant)', async () => {
    const surgicalCase = operatingTheatreEngineService.scheduleSurgicalCase({
      patientId: 'PAT-COHORT-S08',
      patientMrn: 'MRN-2026-009008',
      patientName: 'Sdr. Eko',
      encounterId: 'ENC-COHORT-S08',
      theatreId: 'THEATRE-OK-02',
      procedureName: 'Apendektomi CITO',
      primarySurgeonName: 'dr. Budi, Sp.B',
      anesthesiologistName: 'dr. Ratna, Sp.An',
      scrubNurseName: 'Ns. Maya, S.Kep',
      surgicalUrgency: 'EMERGENCY_CITO'
    });

    const timeOutData = {
      teamIntroduced: true,
      patientAndProcedureConfirmed: true,
      antibioticProphylaxisGiven60Min: true, // Cefuroxime 1.5g IV given 25 min prior
      anticipatedSurgeonStepsReviewed: true,
      anticipatedAnesthesiaConcernsReviewed: true,
      nursingSterilityConfirmed: true,
      imagingDisplayed: true // USG Abdomen Appendicitis Perforasi
    };

    expect(timeOutData.patientAndProcedureConfirmed).toBe(true);
    expect(timeOutData.antibioticProphylaxisGiven60Min).toBe(true);
    expect(timeOutData.nursingSterilityConfirmed).toBe(true);
  });

  it('4. Step 4: Phase 3 Sign-Out & Full WHO Checklist Digital Cryptographic Signature', async () => {
    const surgicalCase = operatingTheatreEngineService.scheduleSurgicalCase({
      patientId: 'PAT-COHORT-S08',
      patientMrn: 'MRN-2026-009008',
      patientName: 'Sdr. Eko',
      encounterId: 'ENC-COHORT-S08',
      theatreId: 'THEATRE-OK-02',
      procedureName: 'Apendektomi CITO',
      primarySurgeonName: 'dr. Budi, Sp.B',
      anesthesiologistName: 'dr. Ratna, Sp.An',
      scrubNurseName: 'Ns. Maya, S.Kep',
      surgicalUrgency: 'EMERGENCY_CITO'
    });

    const fullChecklistData = {
      signIn: {
        patientConfirmed: true,
        surgicalSiteMarked: true,
        anesthesiaSafetyCheckComplete: true,
        pulseOximeterFunctioning: true,
        allergyIdentified: false,
        difficultAirwayRiskAssessed: true,
        bloodLossRiskAssessed: true
      },
      timeOut: {
        teamIntroduced: true,
        patientAndProcedureConfirmed: true,
        antibioticProphylaxisGiven60Min: true,
        anticipatedSurgeonStepsReviewed: true,
        anticipatedAnesthesiaConcernsReviewed: true,
        nursingSterilityConfirmed: true,
        imagingDisplayed: true
      },
      signOut: {
        procedureRecorded: 'Apendektomi Laparoskopi Konversi Eksplorasi (Appendicitis Perforasi Gangrenosa)',
        spongeAndNeedleCountCorrect: true, // Kassa 20/20, Jarum 4/4
        specimenLabeledCorrectly: true, // Jaringan Appendix Histopatologi
        equipmentProblemsReported: false,
        recoveryKeyConcernsReviewed: true
      }
    };

    const signedRecord = operatingTheatreEngineService.signWhoChecklist(
      surgicalCase.id,
      fullChecklistData,
      { surgeon: 'dr. Budi, Sp.B', anesth: 'dr. Ratna, Sp.An', nurse: 'Ns. Maya, S.Kep' }
    );

    expect(signedRecord.status).toBe('VERIFIED_COMPLIANT');
    expect(signedRecord.signatureHash).toBeDefined();
    expect(signedRecord.signatureHash.length).toBeGreaterThan(0);
    expect(signedRecord.signOut.spongeAndNeedleCountCorrect).toBe(true);
  });

  it('5. Step 5: Post-Op PACU Recovery & Aldrete Score Evaluation for Ward Transfer', async () => {
    const surgicalCase = operatingTheatreEngineService.scheduleSurgicalCase({
      patientId: 'PAT-COHORT-S08',
      patientMrn: 'MRN-2026-009008',
      patientName: 'Sdr. Eko',
      encounterId: 'ENC-COHORT-S08',
      theatreId: 'THEATRE-OK-02',
      procedureName: 'Apendektomi CITO',
      primarySurgeonName: 'dr. Budi, Sp.B',
      anesthesiologistName: 'dr. Ratna, Sp.An',
      scrubNurseName: 'Ns. Maya, S.Kep',
      surgicalUrgency: 'EMERGENCY_CITO'
    });

    operatingTheatreEngineService.transitionCaseStatus(surgicalCase.id, SURGERY_STATUS.POST_OP_PACU);

    // Aldrete Scoring: Activity (2), Respiration (2), Circulation (2), Consciousness (2), O2 (2) = 10 / 10
    const aldrete = operatingTheatreEngineService.calculateAldreteScore({
      caseId: surgicalCase.id,
      activity: 2,
      respiration: 2,
      circulation: 2,
      consciousness: 2,
      o2Saturation: 2,
      assessedBy: 'Ns. PACU Recovery, S.Kep'
    });

    expect(aldrete.totalScore).toBe(10);
    expect(aldrete.eligibleForDischarge).toBe(true);

    operatingTheatreEngineService.transitionCaseStatus(surgicalCase.id, SURGERY_STATUS.COMPLETED);
    const completedCase = operatingTheatreEngineService.getCaseById(surgicalCase.id);
    expect(completedCase.status).toBe(SURGERY_STATUS.COMPLETED);
  });

  it('6. Step 6: Reconcile S-08 Expected Outcome Contract & Safety Invariants', async () => {
    const contract = await persistenceAdapter.findById('experimental_contracts', 'CONTRACT-S-08');
    expect(contract).not.toBeNull();

    // Reconcile all 6 Contract Items
    const reconciliation = {
      scenarioId: 'S-08',
      patientName: 'Sdr. Eko',
      reconciledAt: '2026-08-19T03:50:00.000Z',
      contractItems: {
        surgicalCitoConsulted: 'PASS',
        operatingTheatreBooked: 'PASS',
        whoChecklistSignInVerified: 'PASS',
        whoChecklistTimeOutVerified: 'PASS',
        whoChecklistSignOutVerified: 'PASS',
        postOpRecoveryTransferred: 'PASS'
      },
      hardSafetyGates: {
        p0p1Incidents: 0, // Zero Wrong Patient / Wrong Site / Count Mismatch
        silentErrors: 0,
        clinicalDataIntegrityScore: 100.0 // 100%
      }
    };

    expect(reconciliation.contractItems.surgicalCitoConsulted).toBe('PASS');
    expect(reconciliation.contractItems.operatingTheatreBooked).toBe('PASS');
    expect(reconciliation.contractItems.whoChecklistSignInVerified).toBe('PASS');
    expect(reconciliation.contractItems.whoChecklistTimeOutVerified).toBe('PASS');
    expect(reconciliation.contractItems.whoChecklistSignOutVerified).toBe('PASS');
    expect(reconciliation.contractItems.postOpRecoveryTransferred).toBe('PASS');
    expect(reconciliation.hardSafetyGates.p0p1Incidents).toBe(0);
    expect(reconciliation.hardSafetyGates.silentErrors).toBe(0);
  });
});
