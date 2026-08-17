import { describe, it, expect } from 'vitest';
import {
  enterprisePharmacyEngineService,
  DEPOT_CODES
} from '../server/services/enterprisePharmacyEngine.service.js';
import { implantRecallEngineService } from '../server/services/implantRecallEngine.service.js';
import { masterInacbgTariffEngineService } from '../server/services/masterInacbgTariffEngine.service.js';
import { bpjsVclaimLifecycleEngineService, VCLAIM_STATUS } from '../server/services/bpjsVclaimLifecycleEngine.service.js';

describe('Gate 1E.7: Enterprise Pharmacy, Multi-Depot FEFO, Recall & V-Claim Lifecycle', () => {

  // 1. Multi-Depot FEFO Stock Deduction
  it('1. should deduct stock prioritizing earlier expiring batch (FEFO)', () => {
    // In demo data: Batch A expires 2026-10-31 (40 qty), Batch B expires 2027-05-31 (100 qty)
    const result = enterprisePharmacyEngineService.deductStockFefo({
      depotCode: DEPOT_CODES.DEPO_RAWAT_INAP,
      medicationCode: 'MED-CEFTRIAXONE-1G',
      requestedQuantity: 25,
      reason: 'TEST_FEFO_DISPENSE'
    });

    expect(result.success).toBe(true);
    expect(result.totalDeducted).toBe(25);
    expect(result.deductedBatches[0].batchNumber).toBe('LOT-CEF-2026A');
    expect(result.deductedBatches[0].remainingStock).toBe(15);
  });

  // 2. Insufficient Stock Guard
  it('2. should reject dispensing when stock is insufficient across all depot batches', () => {
    expect(() => {
      enterprisePharmacyEngineService.deductStockFefo({
        depotCode: DEPOT_CODES.DEPO_IBS,
        medicationCode: 'MED-PROPOFOL-1%',
        requestedQuantity: 9999,
        reason: 'OVERFLOW_TEST'
      });
    }).toThrow(/tidak mencukupi/);
  });

  // 3. Controlled Substance Dual Pharmacist Sign-Off
  it('3. should verify narcotic/high-alert medication with dual pharmacist signatures', () => {
    const narcLog = enterprisePharmacyEngineService.verifyControlledSubstanceDispense({
      dispensingOrderId: 'RX-TEST-001',
      medicationName: 'Fentanyl 0.05mg/ml Injeksi',
      batchNumber: 'LOT-FENT-8891',
      quantityDispensed: 2,
      patientMrn: 'MRN-2026-001001',
      primaryPharmacist: { id: 'APT-01', name: 'Apt. Rizky, S.Farm' },
      secondaryVerifierPharmacist: { id: 'APT-02', name: 'Apt. Sarah, S.Farm' }
    });

    expect(narcLog.id).toBeDefined();
    expect(narcLog.dualSignatureHash).toMatch(/^SHA256:[0-9A-F]{32}$/);
    expect(narcLog.primaryPharmacistName).toBe('Apt. Rizky, S.Farm');
    expect(narcLog.secondaryVerifierPharmacistName).toBe('Apt. Sarah, S.Farm');
  });

  // 4. SATUSEHAT FHIR R4 MedicationDispense Generation
  it('4. should generate valid SATUSEHAT FHIR R4 MedicationDispense resource payload', () => {
    const fhir = enterprisePharmacyEngineService.generateSatuSehatMedicationDispense({
      orderId: 'RX-100',
      patientIhi: 'P100099238',
      medicationSnomedCode: '93000123',
      medicationDisplay: 'Ceftriaxone 1g Injection',
      quantity: 2,
      pharmacistId: 'PRAC-099'
    });

    expect(fhir.resourceType).toBe('MedicationDispense');
    expect(fhir.status).toBe('completed');
    expect(fhir.medicationCodeableConcept.coding[0].system).toBe('http://kfa.kemkes.go.id/kfa-v2');
  });

  // 5. Medical Device & Implant Recall Engine
  it('5. should initiate implant recall and trace all affected patients by lot number', () => {
    const recall = implantRecallEngineService.initiateRecall({
      manufacturer: 'DePuy Synthes Medical',
      deviceModel: 'Distal Radius Locking Plate 3.5mm',
      lotNumberRecalled: 'LOT-8823',
      recallReason: 'Microfracture risk in screw threads'
    });

    expect(recall.id).toBeDefined();
    expect(recall.status).toBe('ACTIVE_INVESTIGATION');
    expect(recall.affectedPatientsCount).toBeGreaterThan(0);
    expect(recall.affectedPatients[0].patientMrn).toBe('MRX-2026-A1');

    // Notify Patients
    const notified = implantRecallEngineService.notifyAllAffectedPatients(recall.id);
    expect(notified.status).toBe('ALL_PATIENTS_NOTIFIED');
    expect(notified.affectedPatients[0].notificationStatus).toBe('NOTIFIED_SCHEDULED_REVISION');

    // Close Recall
    const closed = implantRecallEngineService.closeRecall(recall.id, 'Semua pasien telah dievaluasi ulang.');
    expect(closed.status).toBe('CLOSED');
  });

  // 6. Dynamic Versioned INA-CBG Tariff Engine
  it('6. should resolve versioned INA-CBG tariffs with hospital class multipliers', () => {
    // Class B (Multiplier 1.0)
    const tariffB = masterInacbgTariffEngineService.resolveTariff({
      inacbgCode: 'K-1-14-I',
      hospitalClass: 'B'
    });
    expect(tariffB.baseTariffIdr).toBe(12850000.00);
    expect(tariffB.adjustedTariffIdr).toBe(12850000.00);

    // Class A (Multiplier 1.15)
    const tariffA = masterInacbgTariffEngineService.resolveTariff({
      inacbgCode: 'K-1-14-I',
      hospitalClass: 'A'
    });
    expect(tariffA.adjustedTariffIdr).toBe(12850000.00 * 1.15);
  });

  // 7. BPJS V-Claim Lifecycle FSM Engine
  it('7. should transition claim status through 5-stage V-Claim FSM lifecycle', () => {
    const claim = bpjsVclaimLifecycleEngineService.transitionClaimStatus('SEP-2026-0817-001', VCLAIM_STATUS.VERIFIED, {
      amountApproved: 12850000.00,
      verifierNote: 'Klaim berkas lengkap dan sesuai INA-CBG K-1-14-I',
      updatedBy: 'Verifikator BPJS KC Jakarta'
    });

    expect(claim.currentStatus).toBe(VCLAIM_STATUS.VERIFIED);
    expect(claim.claimAmountApproved).toBe(12850000.00);
    expect(claim.history.length).toBeGreaterThan(2);

    // Transition to PAID
    const paid = bpjsVclaimLifecycleEngineService.transitionClaimStatus('SEP-2026-0817-001', VCLAIM_STATUS.PAID, {
      updatedBy: 'Bendahara Keuangan BPJS'
    });
    expect(paid.currentStatus).toBe(VCLAIM_STATUS.PAID);
  });
});
