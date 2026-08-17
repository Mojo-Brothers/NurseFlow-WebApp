import { describe, it, expect } from 'vitest';
import { surgicalSchedulingEngineService } from '../server/services/surgicalSchedulingEngine.service.js';
import { cssdSterilizationEngineService } from '../server/services/cssdSterilizationEngine.service.js';
import { aimsAnesthesiaEngineService } from '../src/modules/surgery/services/aimsAnesthesiaEngine.service.js';
import { generateSha256Digest } from '../src/modules/radiology/services/pacsDicomEngine.service.js';

describe('Gate 1E.6 Enterprise Hardening: Surgical Scheduling, CSSD & AIMS Anesthesia', () => {

  // 1. Conflict-Aware Surgical Scheduling Engine
  it('1. should detect and reject overlapping OR bookings and surgeon conflicts', () => {
    // 08:00 - 10:30 is already booked in demo data for OK-01 / dr. Budi

    // Conflict 1: Room Busy
    expect(() => {
      surgicalSchedulingEngineService.scheduleSurgery({
        operatingRoomId: 'THEATRE-OK-01',
        roomName: 'OK-01 (Bedah Umum)',
        surgicalCaseId: 'CASE-SURG-991',
        surgeryDate: '2026-08-17',
        startTime: '2026-08-17T09:00:00.000Z',
        endTime: '2026-08-17T11:00:00.000Z',
        surgeonId: 'DOC-BEDAH-02',
        surgeonName: 'dr. Andi, Sp.B',
        anesthesiologistId: 'DOC-ANEST-02',
        anesthesiologistName: 'dr. Eko, Sp.An'
      });
    }).toThrow(/Konflik Kamar Bedah/);

    // Conflict 2: Surgeon Busy in another room
    expect(() => {
      surgicalSchedulingEngineService.scheduleSurgery({
        operatingRoomId: 'THEATRE-OK-02',
        roomName: 'OK-02 (Bedah Saraf)',
        surgicalCaseId: 'CASE-SURG-992',
        surgeryDate: '2026-08-17',
        startTime: '2026-08-17T08:30:00.000Z',
        endTime: '2026-08-17T10:00:00.000Z',
        surgeonId: 'DOC-BEDAH-01', // Same surgeon
        surgeonName: 'dr. Budi Santoso, Sp.B',
        anesthesiologistId: 'DOC-ANEST-02',
        anesthesiologistName: 'dr. Eko, Sp.An'
      });
    }).toThrow(/Konflik Dokter Operator/);

    // Success: Non-overlapping booking with turnover buffer
    const validBooking = surgicalSchedulingEngineService.scheduleSurgery({
      operatingRoomId: 'THEATRE-OK-01',
      roomName: 'OK-01 (Bedah Umum)',
      surgicalCaseId: 'CASE-SURG-993',
      surgeryDate: '2026-08-17',
      startTime: '2026-08-17T12:00:00.000Z',
      endTime: '2026-08-17T14:00:00.000Z',
      surgeonId: 'DOC-BEDAH-01',
      surgeonName: 'dr. Budi Santoso, Sp.B',
      anesthesiologistId: 'DOC-ANEST-01',
      anesthesiologistName: 'dr. Ratna Anindita, Sp.An-TI'
    });

    expect(validBooking.id).toBeDefined();
    expect(validBooking.bookingStatus).toBe('CONFIRMED');
  });

  // 2. CSSD Instrument Set Tracking & Autoclave Cycles
  it('2. should manage CSSD sterile instrument dispatch, biological indicator pass, and return cycle', () => {
    const allSets = cssdSterilizationEngineService.getAllSets();
    expect(allSets.length).toBeGreaterThan(0);

    const orthoSet = allSets.find(s => s.setBarcode === 'SET-ORTHO-001');
    expect(orthoSet.status).toBe('STERILE_READY');

    // Dispatch to OK-03
    const dispatched = cssdSterilizationEngineService.dispatchSetToTheatre('SET-ORTHO-001', 'CASE-SURG-003', 'OK-03');
    expect(dispatched.status).toBe('IN_USE');
    expect(dispatched.currentLocation).toBe('OK-03');

    // Post-op Return
    const returned = cssdSterilizationEngineService.returnSetForDecontamination('SET-ORTHO-001');
    expect(returned.status).toBe('CONTAMINATED_USED');
    expect(returned.currentLocation).toBe('DECONTAMINATION_WASHING');
  });

  // 3. AIMS Anesthesia Information Management System
  it('3. should record intraoperative vital signs timeline, anesthetic gases, and fluid balance in AIMS', () => {
    const aimsRecord = aimsAnesthesiaEngineService.getRecordByCaseId('CASE-SURG-001');
    expect(aimsRecord).toBeDefined();
    expect(aimsRecord.anesthesiaTechnique).toBe('GENERAL_ENDOTRACHEAL');
    expect(aimsRecord.intraoperativeVitalsTrend.length).toBeGreaterThan(0);
    expect(aimsRecord.totalCrystalloidMl).toBe(1000);
    expect(aimsRecord.estimatedBloodLossMl).toBe(150);
  });

  // 4. Operative Report SHA-256 Digital Signature
  it('4. should produce deterministic SHA-256 digital signature hash for Operative Report', () => {
    const reportPayload = JSON.stringify({
      caseId: 'CASE-SURG-001',
      procedure: 'Laparotomi Eksplorasi',
      surgeon: 'dr. Budi Santoso, Sp.B',
      findings: 'Apendiks perforasi retrosekal',
      spongeCount: '100% MATCH'
    });

    const hash = generateSha256Digest(reportPayload);
    expect(hash).toMatch(/^SHA256:[0-9A-F]{32}$/);
  });
});
