import { describe, it, expect } from 'vitest';
import { emarEngineService } from '../server/services/eMarEngine.service.js';

describe('eMAR Engine — 5-Right BCMA & High-Alert Medication Safety', () => {
  it('should validate 5-Right Barcode matching for patient, drug, dose and route', () => {
    const verification = emarEngineService.verify5Rights({
      patientBarcode: 'MRN-2026-001001',
      targetPatientMrn: 'MRN-2026-001001',
      medicationBarcode: 'MED-MET-500',
      targetMedicationCode: 'MED-MET-500',
      scannedDose: '500 mg',
      prescribedDose: '500 mg',
      scannedRoute: 'ORAL',
      prescribedRoute: 'ORAL'
    });

    expect(verification.isValid).toBe(true);
    expect(verification.error).toBeNull();
  });

  it('should detect mismatch if patient barcode does not match prescribed order MRN', () => {
    const verification = emarEngineService.verify5Rights({
      patientBarcode: 'MRN-WRONG-999',
      targetPatientMrn: 'MRN-2026-001001',
      medicationBarcode: 'MED-MET-500',
      targetMedicationCode: 'MED-MET-500',
      scannedDose: '500 mg',
      prescribedDose: '500 mg',
      scannedRoute: 'ORAL',
      prescribedRoute: 'ORAL'
    });

    expect(verification.isValid).toBe(false);
    expect(verification.checks.rightPatient).toBe(false);
  });

  it('should enforce Dual Sign-Off for High-Alert Medication (Insulin / Heparin)', () => {
    // Attempt administration of high-alert drug without secondary nurse witness
    expect(() => {
      emarEngineService.administerMedication({
        orderId: 'ORD-HIGH-01',
        patientId: 'P-1001',
        patientMrn: 'MRN-2026-001001',
        medicationCode: 'MED-INS-GLA',
        medicationName: 'Insulin Glargine 100 IU/mL',
        dosage: '10 IU',
        route: 'SUBCUTANEOUS',
        isHighAlert: true,
        primaryNurseName: 'Ns. Indah Permata, S.Kep',
        secondaryNurseWitnessName: null
      });
    }).toThrow(/WAJIB diverifikasi ganda/);

    // Administer with valid witness nurse
    const success = emarEngineService.administerMedication({
      orderId: 'ORD-HIGH-01',
      patientId: 'P-1001',
      patientMrn: 'MRN-2026-001001',
      medicationCode: 'MED-INS-GLA',
      medicationName: 'Insulin Glargine 100 IU/mL',
      dosage: '10 IU',
      route: 'SUBCUTANEOUS',
      isHighAlert: true,
      primaryNurseName: 'Ns. Indah Permata, S.Kep',
      secondaryNurseWitnessName: 'Ns. Ratna Sari, S.Kep'
    });

    expect(success.success).toBe(true);
    expect(success.log.secondaryNurseWitnessName).toBe('Ns. Ratna Sari, S.Kep');
  });
});
