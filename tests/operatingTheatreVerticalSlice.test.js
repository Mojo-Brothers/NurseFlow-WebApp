import { describe, it, expect } from 'vitest';
import {
  operatingTheatreEngineService,
  SURGERY_STATUS,
  ASA_CLASSIFICATIONS
} from '../src/modules/surgery/services/operatingTheatreEngine.service.js';

describe('Gate 1E.6: Operating Theatre (IBS), WHO Safety Checklist & PACU Recovery Slice', () => {

  // 1. Master Operating Rooms Matrix
  it('1. should retrieve operating theatre room matrix with equipment profiles', () => {
    const theatres = operatingTheatreEngineService.getTheatres();
    expect(theatres.length).toBe(4);
    expect(theatres[0].roomNumber).toBe('OK-01');
    expect(theatres[0].equipment).toContain('Laparoscopy Tower 4K');
    expect(theatres[3].theatreType).toBe('EMERGENCY_CITO');
  });

  // 2. Schedule Surgical Case
  it('2. should schedule a surgical case with assigned surgical team and ASA classification', () => {
    const newCase = operatingTheatreEngineService.scheduleSurgicalCase({
      patientId: 'P-3001',
      patientMrn: 'MRN-2026-003001',
      patientName: 'Ny. Cut Nyak Dien',
      encounterId: 'ENC-2026-099',
      theatreId: 'THEATRE-OK-01',
      theatreName: 'OK-01 (Bedah Umum)',
      scheduledStart: '2026-08-17T15:00:00Z',
      scheduledEnd: '2026-08-17T17:00:00Z',
      procedureCode: 'ICD9-47.0',
      procedureName: 'Apendektomi Laparoskopik',
      surgicalUrgency: 'ELECTIVE',
      primarySurgeonId: 'DOC-01',
      primarySurgeonName: 'dr. Budi Santoso, Sp.B',
      anesthesiologistId: 'DOC-ANEST-01',
      anesthesiologistName: 'dr. Ratna Anindita, Sp.An-TI',
      asaClass: 'ASA_II'
    });

    expect(newCase.id).toBeDefined();
    expect(newCase.bookingNumber).toMatch(/^SURG-/);
    expect(newCase.status).toBe(SURGERY_STATUS.SCHEDULED);
  });

  // 3. Surgical Lifecycle & Operating Room State Sync
  it('3. should advance surgery lifecycle and synchronize operating theatre room status', () => {
    const activeCase = operatingTheatreEngineService.getCases()[0];

    // Transition to SURGERY_IN_PROGRESS
    const inProg = operatingTheatreEngineService.transitionCaseStatus(activeCase.id, SURGERY_STATUS.SURGERY_IN_PROGRESS);
    expect(inProg.status).toBe(SURGERY_STATUS.SURGERY_IN_PROGRESS);

    // Transition to POST_OP_PACU -> Room should change to CLEANING_STERILIZATION
    const pacu = operatingTheatreEngineService.transitionCaseStatus(activeCase.id, SURGERY_STATUS.POST_OP_PACU);
    expect(pacu.status).toBe(SURGERY_STATUS.POST_OP_PACU);

    const theatre = operatingTheatreEngineService.getTheatres().find(t => t.id === activeCase.theatreId);
    expect(theatre.status).toBe('CLEANING_STERILIZATION');
  });

  // 4. WHO Surgical Safety Checklist (3 Phases JCI IPSG 4) & Cryptographic Sign-off
  it('4. should sign 3-phase WHO Surgical Safety Checklist with SHA-256 digital signature', () => {
    const activeCase = operatingTheatreEngineService.getCases()[0];

    const checklist = operatingTheatreEngineService.signWhoChecklist(activeCase.id, {
      signIn: {
        identityConfirmed: true,
        siteMarked: true,
        consentVerified: true,
        pulseOxAttached: true,
        allergyChecked: true,
        airwayAssessed: true,
        bloodLossPrepared: true
      },
      timeOut: {
        teamIntroductions: true,
        patientNameProcedureSite: true,
        surgeonCriticalSteps: true,
        anesthesiaConcerns: true,
        sterilityVerified: true,
        antibioticProphylaxis: true,
        imagingDisplayed: true
      },
      signOut: {
        procedureRecorded: true,
        instrumentSpongeCountCorrect: true,
        specimenLabeled: true,
        equipmentAddressed: true,
        recoveryPlanBriefed: true
      }
    }, {
      surgeon: 'dr. Budi Santoso, Sp.B',
      anesth: 'dr. Ratna Anindita, Sp.An-TI',
      nurse: 'Ns. Maya, S.Kep'
    });

    expect(checklist.id).toBeDefined();
    expect(checklist.status).toBe('VERIFIED_COMPLIANT');
    expect(checklist.signatureHash).toMatch(/^SHA256:[0-9A-F]{32}$/);
    expect(checklist.signIn.verifiedBy).toBe('dr. Ratna Anindita, Sp.An-TI');
    expect(checklist.timeOut.verifiedBy).toBe('dr. Budi Santoso, Sp.B');
    expect(checklist.signOut.verifiedBy).toBe('Ns. Maya, S.Kep');
  });

  // 5. Aldrete Post-Anesthesia Recovery Scoring
  it('5. should calculate Aldrete Score and determine ward discharge readiness', () => {
    const activeCase = operatingTheatreEngineService.getCases()[0];

    // High Score: 2 + 2 + 2 + 1 + 2 = 9 (Eligible)
    const scoreEligible = operatingTheatreEngineService.calculateAldreteScore({
      caseId: activeCase.id,
      activity: 2,
      respiration: 2,
      circulation: 2,
      consciousness: 1,
      o2Saturation: 2,
      assessedBy: 'Ns. PACU Recovery'
    });

    expect(scoreEligible.totalScore).toBe(9);
    expect(scoreEligible.eligibleForDischarge).toBe(true);

    // Low Score: 0 + 1 + 1 + 1 + 1 = 4 (Not Eligible)
    const scoreLow = operatingTheatreEngineService.calculateAldreteScore({
      caseId: activeCase.id,
      activity: 0,
      respiration: 1,
      circulation: 1,
      consciousness: 1,
      o2Saturation: 1,
      assessedBy: 'Ns. PACU Recovery'
    });

    expect(scoreLow.totalScore).toBe(4);
    expect(scoreLow.eligibleForDischarge).toBe(false);
  });

  // 6. ASA Classifications catalog
  it('6. should provide standard ASA physical status classification catalog', () => {
    expect(ASA_CLASSIFICATIONS.ASA_I.code).toBe('ASA_I');
    expect(ASA_CLASSIFICATIONS.ASA_E.code).toBe('ASA_E');
  });
});
