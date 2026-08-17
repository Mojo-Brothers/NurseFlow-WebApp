/**
 * NurseFlow Enterprise HIS 2026 — Enterprise Pharmacy & Multi-Depot FEFO Engine
 * Standards: Permenkes 73/2016, JCI MMU (Medication Management & Use), SATUSEHAT FHIR R4 MedicationDispense
 */

import { eventBusService, DOMAIN_EVENTS } from '../realtime/eventBus.service.js';
import { generateSha256Digest } from '../../src/modules/radiology/services/pacsDicomEngine.service.js';

export const DEPOT_CODES = {
  GUDANG_INDUK: 'GUDANG_INDUK',
  DEPO_IGD: 'DEPO_IGD',
  DEPO_RAWAT_INAP: 'DEPO_RAWAT_INAP',
  DEPO_RAWAT_JALAN: 'DEPO_RAWAT_JALAN',
  DEPO_IBS: 'DEPO_IBS',
  DEPO_ICU: 'DEPO_ICU'
};

class EnterprisePharmacyEngineService {
  constructor() {
    this.depots = new Map();
    this.batches = new Map();
    this.dispensingOrders = new Map();
    this.controlledSubstanceLogs = new Map();
    this.initDemoPharmacyData();
  }

  initDemoPharmacyData() {
    // 1. Master Depots
    const d1 = { id: 'DEPOT-GUDANG', depotCode: DEPOT_CODES.GUDANG_INDUK, depotName: 'Gudang Farmasi Induk Logistik RS', isControlledSubstancesAuthorized: true };
    const d2 = { id: 'DEPOT-IGD', depotCode: DEPOT_CODES.DEPO_IGD, depotName: 'Satelit Farmasi IGD 24 Jam', isControlledSubstancesAuthorized: true };
    const d3 = { id: 'DEPOT-RANAP', depotCode: DEPOT_CODES.DEPO_RAWAT_INAP, depotName: 'Satelit Farmasi Rawat Inap Terpadu', isControlledSubstancesAuthorized: true };
    const d4 = { id: 'DEPOT-RAJAL', depotCode: DEPOT_CODES.DEPO_RAWAT_JALAN, depotName: 'Satelit Farmasi Rawat Jalan (Poliklinik)', isControlledSubstancesAuthorized: false };
    const d5 = { id: 'DEPOT-IBS', depotCode: DEPOT_CODES.DEPO_IBS, depotName: 'Satelit Farmasi Kamar Bedah Sentral (IBS)', isControlledSubstancesAuthorized: true };
    const d6 = { id: 'DEPOT-ICU', depotCode: DEPOT_CODES.DEPO_ICU, depotName: 'Satelit Farmasi Ruang Intensif (ICU/ICCU)', isControlledSubstancesAuthorized: true };

    this.depots.set(d1.id, d1);
    this.depots.set(d2.id, d2);
    this.depots.set(d3.id, d3);
    this.depots.set(d4.id, d4);
    this.depots.set(d5.id, d5);
    this.depots.set(d6.id, d6);

    // 2. Multi-Depot Batches with Expiry Dates (for FEFO testing)
    // Ceftriaxone 1g in Ranap Depot: Batch A (Exp: 2026-10-31), Batch B (Exp: 2027-05-31)
    const b1 = {
      id: 'BATCH-CEF-01',
      depotId: 'DEPOT-RANAP',
      depotCode: DEPOT_CODES.DEPO_RAWAT_INAP,
      medicationCode: 'MED-CEFTRIAXONE-1G',
      medicationName: 'Ceftriaxone 1g Serbuk Injeksi (Hexpharm)',
      dosageForm: 'VIAL',
      batchNumber: 'LOT-CEF-2026A',
      expiryDate: '2026-10-31', // Earlier -> Priority 1 (FEFO)
      currentStock: 40,
      reorderPoint: 15,
      unitCostIdr: 35000.00,
      sellingPriceIdr: 52000.00,
      isHighAlert: false,
      isNarcoticPsychotropic: false
    };

    const b2 = {
      id: 'BATCH-CEF-02',
      depotId: 'DEPOT-RANAP',
      depotCode: DEPOT_CODES.DEPO_RAWAT_INAP,
      medicationCode: 'MED-CEFTRIAXONE-1G',
      medicationName: 'Ceftriaxone 1g Serbuk Injeksi (Hexpharm)',
      dosageForm: 'VIAL',
      batchNumber: 'LOT-CEF-2027B',
      expiryDate: '2027-05-31', // Later -> Priority 2
      currentStock: 100,
      reorderPoint: 15,
      unitCostIdr: 35000.00,
      sellingPriceIdr: 52000.00,
      isHighAlert: false,
      isNarcoticPsychotropic: false
    };

    // Propofol & Fentanyl in Depo IBS
    const b3 = {
      id: 'BATCH-PROP-01',
      depotId: 'DEPOT-IBS',
      depotCode: DEPOT_CODES.DEPO_IBS,
      medicationCode: 'MED-PROPOFOL-1%',
      medicationName: 'Propofol MCT/LCT 1% 20ml Injeksi (Fresofol)',
      dosageForm: 'AMPULE',
      batchNumber: 'LOT-PROP-2026X',
      expiryDate: '2026-12-31',
      currentStock: 25,
      reorderPoint: 10,
      unitCostIdr: 95000.00,
      sellingPriceIdr: 140000.00,
      isHighAlert: true,
      isNarcoticPsychotropic: false
    };

    const b4 = {
      id: 'BATCH-FENT-01',
      depotId: 'DEPOT-IBS',
      depotCode: DEPOT_CODES.DEPO_IBS,
      medicationCode: 'MED-FENTANYL-0.05MG',
      medicationName: 'Fentanyl 0.05 mg/ml 2ml Injeksi (Narkotika Golongan II)',
      dosageForm: 'AMPULE',
      batchNumber: 'LOT-FENT-8891',
      expiryDate: '2027-01-31',
      currentStock: 15,
      reorderPoint: 5,
      unitCostIdr: 45000.00,
      sellingPriceIdr: 75000.00,
      isHighAlert: true,
      isNarcoticPsychotropic: true
    };

    this.batches.set(b1.id, b1);
    this.batches.set(b2.id, b2);
    this.batches.set(b3.id, b3);
    this.batches.set(b4.id, b4);
  }

  getDepots() {
    return Array.from(this.depots.values());
  }

  getAllBatches() {
    return Array.from(this.batches.values());
  }

  getBatchesByDepot(depotCode) {
    return Array.from(this.batches.values()).filter(b => b.depotCode === depotCode);
  }

  /**
   * 1. Allocate & Deduct Stock with strict FEFO (First Expired, First Out)
   */
  deductStockFefo({ depotCode, medicationCode, requestedQuantity, reason = 'CPOE_DISPENSE' }) {
    const matchingBatches = Array.from(this.batches.values())
      .filter(b => b.depotCode === depotCode && b.medicationCode === medicationCode && b.currentStock > 0)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()); // FEFO Sort

    const totalAvailable = matchingBatches.reduce((acc, b) => acc + b.currentStock, 0);
    if (totalAvailable < requestedQuantity) {
      throw new Error(`Stok obat ${medicationCode} di ${depotCode} tidak mencukupi (Tersedia: ${totalAvailable}, Diminta: ${requestedQuantity}).`);
    }

    let remainingNeeded = requestedQuantity;
    const deductedBatches = [];

    for (const batch of matchingBatches) {
      if (remainingNeeded <= 0) break;

      const deductFromThis = Math.min(batch.currentStock, remainingNeeded);
      batch.currentStock -= deductFromThis;
      remainingNeeded -= deductFromThis;

      deductedBatches.push({
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        quantityDeducted: deductFromThis,
        remainingStock: batch.currentStock
      });

      // Check Reorder Point
      if (batch.currentStock <= batch.reorderPoint) {
        eventBusService.publish(DOMAIN_EVENTS.PANIC_VALUE_TRIGGERED, {
          type: 'PHARMACY_REORDER_ALERT',
          medication: batch.medicationName,
          depot: depotCode,
          currentStock: batch.currentStock,
          reorderPoint: batch.reorderPoint
        });
      }
    }

    return {
      success: true,
      medicationCode,
      depotCode,
      totalDeducted: requestedQuantity,
      deductedBatches,
      reason
    };
  }

  /**
   * 2. Controlled Substance / Narcotic Dual Pharmacist Verification
   */
  verifyControlledSubstanceDispense({
    dispensingOrderId,
    medicationName,
    batchNumber,
    quantityDispensed,
    patientMrn,
    primaryPharmacist,
    secondaryVerifierPharmacist
  }) {
    if (!primaryPharmacist?.id || !secondaryVerifierPharmacist?.id) {
      throw new Error('Penyerahan obat Narkotika/Psikotropika WAJIB diverifikasi oleh 2 Apoteker Berizin (Dual Verification).');
    }

    if (primaryPharmacist.id === secondaryVerifierPharmacist.id) {
      throw new Error('Apoteker primer dan apoteker verifikator sekunder tidak boleh sama!');
    }

    const payload = JSON.stringify({
      dispensingOrderId,
      medicationName,
      batchNumber,
      quantityDispensed,
      patientMrn,
      p1: primaryPharmacist.id,
      p2: secondaryVerifierPharmacist.id,
      timestamp: new Date().toISOString()
    });

    const signatureHash = generateSha256Digest(payload);

    const log = {
      id: `NARC-LOG-${Date.now()}`,
      dispensingOrderId,
      medicationName,
      batchNumber,
      quantityDispensed,
      patientMrn,
      primaryPharmacistName: primaryPharmacist.name,
      secondaryVerifierPharmacistName: secondaryVerifierPharmacist.name,
      dualSignatureHash: signatureHash,
      verifiedAt: new Date().toISOString()
    };

    this.controlledSubstanceLogs.set(log.id, log);
    return log;
  }

  /**
   * 3. SATUSEHAT FHIR R4 MedicationDispense Mapper
   */
  generateSatuSehatMedicationDispense({ orderId, patientIhi, medicationSnomedCode, medicationDisplay, quantity, pharmacistId }) {
    return {
      resourceType: 'MedicationDispense',
      id: `dispense-${orderId}`,
      status: 'completed',
      category: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/medicationdispense-category',
          code: 'inpatient',
          display: 'Inpatient'
        }]
      },
      medicationCodeableConcept: {
        coding: [{
          system: 'http://kfa.kemkes.go.id/kfa-v2',
          code: medicationSnomedCode || '93000123',
          display: medicationDisplay
        }]
      },
      subject: {
        reference: `Patient/${patientIhi}`
      },
      performer: [{
        actor: {
          reference: `Practitioner/${pharmacistId}`
        }
      }],
      quantity: {
        value: quantity,
        unit: 'TAB/VIAL/AMP',
        system: 'http://unitsofmeasure.org'
      },
      whenHandedOver: new Date().toISOString()
    };
  }
}

export const enterprisePharmacyEngineService = new EnterprisePharmacyEngineService();
