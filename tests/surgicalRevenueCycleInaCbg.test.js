import { describe, it, expect } from 'vitest';
import {
  surgicalRevenueCycleService,
  INACBG_SURGICAL_CATALOG
} from '../server/services/surgicalRevenueCycle.service.js';
import { surgicalSchedulingEngineService } from '../server/services/surgicalSchedulingEngine.service.js';

describe('Gate 1E.6E - 1E.6G: Surgical Revenue Cycle, Implant UDI Tracking, INA-CBG & BPJS V-Claim', () => {

  // 1. Permanent Medical Implant Tracking (UDI)
  it('1. should register and track permanent medical implants with unique UDI and lot numbers', () => {
    const implant = surgicalRevenueCycleService.trackPermanentImplant({
      surgicalCaseId: 'CASE-SURG-002',
      encounterId: 'ENC-2026-001',
      patientMrn: 'MRN-2026-001001',
      implantName: 'Hernia Polypropylene Mesh 15x15cm',
      udiBarcode: '(01)00884567891234(17)281231(10)LOT-7711(21)SN-44123',
      serialNumber: 'SN-44123',
      lotNumber: 'LOT-7711',
      manufacturer: 'Ethicon / Johnson & Johnson',
      expirationDate: '2028-12-31',
      anatomicalLocation: 'Regio Inguinalis Dextra',
      implantedBySurgeon: 'dr. Budi Santoso, Sp.B',
      unitCostIdr: 2800000.00
    });

    expect(implant.id).toBeDefined();
    expect(implant.udiBarcode).toContain('SN-44123');
    expect(implant.billingStatus).toBe('BILLED');

    const caseImplants = surgicalRevenueCycleService.getImplantsByCase('CASE-SURG-002');
    expect(caseImplants.length).toBeGreaterThan(0);
  });

  // 2. Itemized Surgical Cost Calculation & INA-CBG Grouper Match
  it('2. should itemize real hospital surgical charges and compute INA-CBG package tariff and margin', () => {
    const billing = surgicalRevenueCycleService.calculateSurgicalBilling('CASE-SURG-001', {
      encounterId: 'ENC-2026-003',
      patientMrn: 'MRX-2026-A1',
      operatingRoomFee: 2500000.00,
      surgeonProfessionalFee: 4500000.00,
      anesthesiaProfessionalFee: 2000000.00,
      consumablesCharge: 1200000.00,
      anestheticDrugsCharge: 850000.00,
      icd10: 'K35.8',
      icd9cm: '47.0'
    });

    // Real hospital cost = 2.5m + 4.5m + 2.0m + 1.2m + 0.85m + 4.5m (implant demo) = 15.55m
    expect(billing.totalHospitalCost).toBe(15550000.00);
    expect(billing.inacbgCode).toBe('K-1-14-I');
    expect(billing.inacbgTariff).toBe(12850000.00);
    expect(billing.hospitalMargin).toBe(12850000.00 - 15550000.00); // -2.7m
    expect(billing.claimSubmissionStatus).toBe('READY_FOR_SUBMISSION');
  });

  // 3. BPJS V-Claim 2.0 Payload Generation
  it('3. should format complete BPJS V-Claim 2.0 surgical claim request schema', () => {
    const vclaim = surgicalRevenueCycleService.generateBpjsVclaimSurgicalPayload('CASE-SURG-001');

    expect(vclaim.request.t_klaim).toBeDefined();
    expect(vclaim.request.t_klaim.noSep).toMatch(/^SEP-2026-/);
    expect(vclaim.request.t_klaim.diagnosaUtama).toBe('K35.8');
    expect(vclaim.request.t_klaim.prosedurUtama).toBe('47.0');
    expect(vclaim.request.t_klaim.kodeInacbg).toBe('K-1-14-I');
    expect(vclaim.request.t_klaim.tarifInacbg).toBe(12850000.00);
  });

  // 4. Emergency Override Protocol in Scheduling Engine
  it('4. should allow STAT_EMERGENCY surgery to preempt elective booking with emergency override flag', () => {
    // Schedule an emergency CITO case with allowEmergencyOverride
    const emergencyBooking = surgicalSchedulingEngineService.scheduleSurgery({
      operatingRoomId: 'THEATRE-OK-01',
      roomName: 'OK-01 (Bedah Umum)',
      surgicalCaseId: 'CASE-SURG-EMERGENCY-01',
      surgeryDate: '2026-08-17',
      startTime: '2026-08-17T09:00:00.000Z',
      endTime: '2026-08-17T11:00:00.000Z',
      urgency: 'STAT_EMERGENCY',
      allowEmergencyOverride: true,
      surgeonId: 'DOC-BEDAH-03',
      surgeonName: 'dr. Satria, Sp.B',
      anesthesiologistId: 'DOC-ANEST-03',
      anesthesiologistName: 'dr. Maya, Sp.An'
    });

    expect(emergencyBooking.bookingStatus).toBe('CONFIRMED_EMERGENCY_OVERRIDE');

    // Verify the preempted elective case was marked as RESCHEDULED_DUE_TO_EMERGENCY
    const allSchedules = surgicalSchedulingEngineService.getAllSchedules();
    const electiveCase = allSchedules.find(s => s.id === 'SCHED-2026-001');
    expect(electiveCase.bookingStatus).toBe('RESCHEDULED_DUE_TO_EMERGENCY');
    expect(electiveCase.preemptedByCaseId).toBe('CASE-SURG-EMERGENCY-01');
  });
});
