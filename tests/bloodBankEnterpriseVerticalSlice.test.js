import { describe, it, expect } from 'vitest';
import {
  bloodBankEnterpriseEngineService,
  BLOOD_PRODUCTS,
  REACTION_TYPES
} from '../server/services/bloodBankEnterpriseEngine.service.js';
import { bloodBankService } from '../server/services/bloodBank.service.js';

describe('Gate 1E.8: Blood Bank (BDRS) Enterprise, MTP 1:1:1, Bedside Dual Verification & Hemovigilance', () => {

  // 1. Cold Chain & Temperature Monitoring
  it('1. should register blood unit and detect cold chain temperature deviation', () => {
    const unit = bloodBankService.registerBloodUnit({
      unitNumber: 'UTD-TEST-881',
      productType: BLOOD_PRODUCTS.PACKED_RED_CELLS,
      aboType: 'A',
      rhesusType: 'POSITIVE',
      storageTemperatureCelsius: 4.0,
      expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
    });

    expect(unit.id).toBeDefined();
    expect(unit.status).toBe('AVAILABLE');

    // Cold chain excursion test (> 6.0°C)
    const logExcursion = bloodBankService.logStorageTemperature({
      unitId: unit.id,
      productType: BLOOD_PRODUCTS.PACKED_RED_CELLS,
      storageDeviceId: 'CHILLER-BDRS-01',
      temperatureCelsius: 8.5,
      recordedBy: 'Analis BDRS'
    });

    expect(logExcursion.alarmStatus).toBe('HIGH_TEMP_ALARM');
  });

  // 2. Massive Transfusion Protocol (MTP 1:1:1 Packaged Release)
  it('2. should activate Massive Transfusion Protocol releasing 1:1:1 ratio (4 PRC : 4 FFP : 4 TC)', () => {
    const mtp = bloodBankEnterpriseEngineService.activateMtp({
      encounterId: 'ENC-2026-003',
      patientMrn: 'MRX-2026-A1',
      patientName: 'Tn. Hendra (Mr. X)',
      indication: 'HEMORRHAGIC_SHOCK',
      shockIndex: 1.35,
      estimatedBloodLossMl: 2800,
      isUncrossedEmergency: false
    });

    expect(mtp.id).toBeDefined();
    expect(mtp.activationStatus).toBe('ACTIVE');
    expect(mtp.packageContents.prcUnits).toBe(4);
    expect(mtp.packageContents.ffpUnits).toBe(4);
    expect(mtp.packageContents.tcUnits).toBe(4);
    expect(mtp.packageContents.ratio).toBe('1 PRC : 1 FFP : 1 TC');
  });

  // 3. Bedside Dual Nurse Verification (JCI IPSG 1)
  it('3. should verify bedside transfusion with dual nurse checks and SHA-256 signature', () => {
    const verif = bloodBankEnterpriseEngineService.verifyBedsideTransfusion({
      unitNumber: 'UTD-998241',
      encounterId: 'ENC-2026-003',
      patientMrn: 'MRX-2026-A1',
      patientBloodGroup: 'A Rh+',
      donorUnitBloodGroup: 'A Rh+',
      crossmatchId: 'CM-2026-001',
      preVitals: { bp: '110/70', hr: 88, tempCelsius: 36.8, spo2: 99 },
      primaryNurse: { id: 'NRS-01', name: 'Ns. Ratna, S.Kep' },
      secondaryNurse: { id: 'NRS-02', name: 'Ns. Joko, S.Kep' }
    });

    expect(verif.id).toBeDefined();
    expect(verif.status).toBe('TRANSFUSING_NORMAL');
    expect(verif.dualSignatureHash).toMatch(/^SHA256:[0-9A-F]{32}$/);
    expect(verif.primaryNurseName).toBe('Ns. Ratna, S.Kep');
    expect(verif.secondaryNurseName).toBe('Ns. Joko, S.Kep');
  });

  // 4. Hemovigilance Transfusion Reaction Emergency STOP
  it('4. should execute emergency STOP and record hemovigilance investigation upon reaction', () => {
    const incident = bloodBankEnterpriseEngineService.reportTransfusionReaction({
      verificationId: 'VERIF-TEST-001',
      patientMrn: 'MRX-2026-A1',
      unitNumber: 'UTD-998241',
      reactionType: REACTION_TYPES.ACUTE_HEMOLYTIC,
      symptoms: 'Demam menggigil 39.2C, hipotensi, nyeri pinggang',
      minutesIntoTransfusion: 14,
      volumeInfusedMl: 45,
      reportedBy: 'Ns. Ratna, S.Kep'
    });

    expect(incident.id).toBeDefined();
    expect(incident.reactionType).toBe(REACTION_TYPES.ACUTE_HEMOLYTIC);
    expect(incident.ivFlushSalineAdministered).toBe(true);
    expect(incident.postTransfusionBloodSampleSent).toBe(true);
    expect(incident.postTransfusionUrineSampleSent).toBe(true);
    expect(incident.bagReturnedToBdrs).toBe(true);
  });

  // 5. BPPD Blood Processing Fee Billing
  it('5. should calculate BPPD blood processing fee and crossmatch test charges', () => {
    const bill = bloodBankEnterpriseEngineService.calculateBloodBilling({
      unitNumber: 'UTD-998241',
      productType: BLOOD_PRODUCTS.PACKED_RED_CELLS,
      patientMrn: 'MRX-2026-A1',
      encounterId: 'ENC-2026-003'
    });

    expect(bill.bppdProcessingFeeIdr).toBe(360000.00);
    expect(bill.crossmatchTestingFeeIdr).toBe(120000.00);
    expect(bill.totalChargeIdr).toBe(525000.00);
    expect(bill.billingStatus).toBe('BILLED');
  });
});
