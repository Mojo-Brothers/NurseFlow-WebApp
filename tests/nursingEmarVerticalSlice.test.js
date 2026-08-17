import { describe, it, expect } from 'vitest';
import { emarEngineService } from '../server/services/eMarEngine.service.js';
import { nursingCareEngineService } from '../src/modules/nursing/services/nursingCareEngine.service.js';

describe('Gate 1E.5: Nursing Care, Fluid Balance & eMAR Vertical Slice', () => {

  // 1. eMAR 5-Rights Verification (JCI IPSG 3)
  it('1. should verify 5-Rights of medication administration and reject mismatches', () => {
    // Valid 5-Rights
    const validCheck = emarEngineService.verify5Rights({
      patientBarcode: 'MRN-2026-001001',
      targetPatientMrn: 'MRN-2026-001001',
      medicationBarcode: 'DRUG-CEFTRIAXONE',
      targetMedicationCode: 'DRUG-CEFTRIAXONE',
      scannedDose: '1 gram',
      prescribedDose: '1 gram',
      scannedRoute: 'IV',
      prescribedRoute: 'IV'
    });

    expect(validCheck.isValid).toBe(true);
    expect(validCheck.checks.rightPatient).toBe(true);
    expect(validCheck.checks.rightMedication).toBe(true);

    // Mismatched Patient Barcode (Negative Path)
    const invalidPatient = emarEngineService.verify5Rights({
      patientBarcode: 'WRONG-MRN-999',
      targetPatientMrn: 'MRN-2026-001001',
      medicationBarcode: 'DRUG-CEFTRIAXONE',
      targetMedicationCode: 'DRUG-CEFTRIAXONE',
      scannedDose: '1 gram',
      prescribedDose: '1 gram',
      scannedRoute: 'IV',
      prescribedRoute: 'IV'
    });

    expect(invalidPatient.isValid).toBe(false);
    expect(invalidPatient.error).toContain('Verifikasi 5-Benar GAGAL');
  });

  // 2. High-Alert Dual Nurse Sign-Off (JCI IPSG 3.1)
  it('2. should enforce dual nurse sign-off for high-alert medications (Insulin / KCl)', () => {
    // Standard Drug (No Witness Required)
    const standardAdmin = emarEngineService.administerMedication({
      orderId: 'ORD-TEST-01',
      patientId: 'P-1001',
      patientMrn: 'MRN-2026-001001',
      medicationCode: 'DRUG-PARACETAMOL',
      medicationName: 'Paracetamol Infus 1g',
      dosage: '1000 mg',
      route: 'IV',
      isHighAlert: false,
      primaryNurseName: 'Ns. Ratna Sari, S.Kep'
    });

    expect(standardAdmin.success).toBe(true);
    expect(standardAdmin.log.status).toBe('GIVEN');

    // High-Alert Drug without Secondary Witness must THROW (Negative Path)
    expect(() => {
      emarEngineService.administerMedication({
        orderId: 'ORD-TEST-02',
        patientId: 'P-1001',
        patientMrn: 'MRN-2026-001001',
        medicationCode: 'DRUG-INSULIN',
        medicationName: 'Novorapid 6 IU SC',
        dosage: '6 IU',
        route: 'SC',
        isHighAlert: true, // High Alert
        primaryNurseName: 'Ns. Ratna Sari, S.Kep',
        secondaryNurseWitnessName: null // Missing witness!
      });
    }).toThrow(/OBAT HIGH-ALERT/);

    // High-Alert Drug WITH Secondary Witness MUST SUCCEED
    const highAlertAdmin = emarEngineService.administerMedication({
      orderId: 'ORD-TEST-02',
      patientId: 'P-1001',
      patientMrn: 'MRN-2026-001001',
      medicationCode: 'DRUG-INSULIN',
      medicationName: 'Novorapid 6 IU SC',
      dosage: '6 IU',
      route: 'SC',
      isHighAlert: true,
      primaryNurseName: 'Ns. Ratna Sari, S.Kep',
      secondaryNurseWitnessName: 'Ns. Maya Dewi, S.Kep'
    });

    expect(highAlertAdmin.success).toBe(true);
    expect(highAlertAdmin.log.secondaryNurseWitnessName).toBe('Ns. Maya Dewi, S.Kep');
  });

  // 3. 24-Hour Fluid Balance & Temperature Corrected IWL
  it('3. should calculate fluid balance and IWL with temperature correction', () => {
    // Normal temperature (37.0 C): IWL = 15 * 60 = 900 ml
    const normalCalc = nursingCareEngineService.calculateFluidBalance({
      bodyWeightKg: 60,
      bodyTemperatureCelsius: 37.0,
      intakeItems: [
        { category: 'INFUSION', amountMl: 1500 },
        { category: 'ORAL', amountMl: 500 }
      ],
      outputItems: [
        { category: 'URINE', amountMl: 1000 },
        { category: 'STOOL', amountMl: 100 }
      ]
    });

    expect(normalCalc.totalIntakeMl).toBe(2000);
    expect(normalCalc.calculatedIwlMl).toBe(900);
    expect(normalCalc.totalOutputWithIwlMl).toBe(2000); // 1100 + 900
    expect(normalCalc.netBalanceMl).toBe(0);
    expect(normalCalc.balanceCategory).toBe('NORMAL_EUVOLEMIC');

    // Febrile patient (39.0 C, +2 C): IWL = 900 + (900 * 0.20) = 1080 ml
    const febrileCalc = nursingCareEngineService.calculateFluidBalance({
      bodyWeightKg: 60,
      bodyTemperatureCelsius: 39.0,
      intakeItems: [{ category: 'INFUSION', amountMl: 1000 }],
      outputItems: [{ category: 'URINE', amountMl: 1500 }]
    });

    expect(febrileCalc.calculatedIwlMl).toBe(1080);
    expect(febrileCalc.netBalanceMl).toBe(1000 - (1500 + 1080)); // -1580 ml
    expect(febrileCalc.balanceCategory).toBe('NEGATIVE_DEHYDRATION_RISK');
  });

  // 4. Morse Fall Scale Screening (JCI IPSG 6)
  it('4. should calculate Morse Fall Scale and activate yellow wristband protocol on score >= 45', () => {
    const highRiskAssessment = nursingCareEngineService.calculateMorseFallScale({
      historyOfFalling: true,       // 25
      secondaryDiagnosis: true,     // 15
      ambulatoryAid: 'CRUTCHES_CANE', // 15
      ivTherapyOrHeparin: true,     // 20
      gaitStatus: 'WEAK',           // 10
      mentalStatus: 'ORIENTED'      // 0
    }); // Total = 85

    expect(highRiskAssessment.totalScore).toBe(85);
    expect(highRiskAssessment.riskLevel).toBe('HIGH_RISK');
    expect(highRiskAssessment.requiresYellowWristband).toBe(true);
    expect(highRiskAssessment.recommendedInterventions.length).toBeGreaterThan(0);
  });

  // 5. Nursing Care Plan (SDKI / SIKI) & ISBAR Handover
  it('5. should record structured nursing care plan and generate ISBAR handover report', async () => {
    const carePlan = await nursingCareEngineService.recordNursingCarePlan({
      encounterId: 'ENC-TEST-NURSE-01',
      patientId: 'P-1001',
      sdkiCode: 'D.0023',
      sdkiName: 'Hipovolemia b.d Kehilangan Cairan Aktif',
      slkiGoal: 'Status cairan membaik dalam 24 jam',
      sikiInterventions: ['Manajemen Hipovolemia (I.03116)', 'Pemantauan Cairan (I.03121)']
    });

    expect(carePlan.id).toBeDefined();
    expect(carePlan.sdkiCode).toBe('D.0023');

    const isbar = nursingCareEngineService.generateIsbarReport({
      patientName: 'Ny. Siti Nurhaliza',
      mrn: 'MRN-2026-001001',
      wardName: 'Bangsal Melati',
      bedNumber: 'Melati 01',
      primaryDoctor: 'dr. Surya Johnson, Sp.PD',
      situation: 'Pasien mengeluh lemas dan mual berkurang',
      background: 'DHF Grade II rawat hari ke-2',
      assessment: 'TTV Stabil, TD 110/70, HR 84, Suhu 37.0°C',
      recommendation: 'Lanjut infus RL 2ml/kgBB/jam',
      handoverNursePrimary: 'Ns. Ratna Sari, S.Kep',
      handoverNurseSecondary: 'Ns. Maya Dewi, S.Kep'
    });

    expect(isbar.isbar.S_Situation).toContain('lemas');
    expect(isbar.isbar.I_Introduction).toContain('Bangsal Melati');
  });
});
