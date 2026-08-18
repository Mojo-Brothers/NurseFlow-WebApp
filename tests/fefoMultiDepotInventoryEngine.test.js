/**
 * SPRINT 3D: ENTERPRISE MULTI-DEPOT FEFO & CLINICAL LOGISTICS TEST SUITE
 * 
 * Validates:
 * 1. Multi-Depot Inbound Batch Registration & Strict FEFO Sorting
 * 2. Multi-Depot Mutasi / Transfer Flow (Request -> Dispatch -> Receive)
 * 3. Point-of-Care Barcode Batch/Lot & Expiry Reconciliation
 * 4. BPOM Batch Recall & Instant Patient Traceability Manifest
 * 5. Hospital Waste & Destruction Management (Partial Vial / Spillage)
 * 6. Return-to-Pharmacy Workflow (Ward -> Pharmacy -> Restocked)
 * 7. Cold Chain Excursion FSM & Auto-Quarantine Lock
 * 8. Controlled Substance Ledger & Invariant Verification
 * 9. HL7 FHIR R4 Medication Mapping (Request, Dispense, Administration, Master)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  fefoMultiDepotInventoryEngine, 
  DEPOT_TYPES, 
  BATCH_STATUS, 
  WASTE_REASONS,
  COLD_CHAIN_STATES
} from '../src/core/services/fefoMultiDepotInventoryEngine.service.js';
import { pointOfCareFiveRightsValidator, SENSOR_ERROR_CODES, FIVE_RIGHTS_STATUS } from '../src/core/services/pointOfCareFiveRightsValidator.service.js';
import { medicationLifecycleEngine } from '../src/core/services/medicationLifecycleEngine.service.js';
import { fhirMedicationMapperService, FHIR_RESOURCE_TYPES } from '../src/core/services/fhirMedicationMapper.service.js';
import { persistenceAdapter, DB_ENGINE_TYPES } from '../src/core/services/persistenceAdapter.service.js';
import { CARE_STATES } from '../src/core/services/careStateEngine.service.js';

describe('Sprint 3D: FEFO Multi-Depot & Clinical Logistics Platform Suite', () => {
  beforeEach(() => {
    persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);
  });

  // 1. Goods Receipt & Strict FEFO Allocation
  it('1. should strictly allocate earliest expiring batch first (FEFO Principle)', async () => {
    const depotId = 'DEPOT-CENTRAL-PHARM';

    await fefoMultiDepotInventoryEngine.registerStockBatch({
      depotId,
      depotType: DEPOT_TYPES.CENTRAL_PHARMACY,
      medicationCode: 'MED-AMOX-500',
      medicationName: 'Amoxicillin 500 mg',
      batchNumber: 'BATCH-AMX-LATER',
      expiryDate: '2028-12-31',
      quantity: 100,
      receivedById: 'PHARM-01',
      receivedByName: 'Apt. Siti'
    });

    await fefoMultiDepotInventoryEngine.registerStockBatch({
      depotId,
      depotType: DEPOT_TYPES.CENTRAL_PHARMACY,
      medicationCode: 'MED-AMOX-500',
      medicationName: 'Amoxicillin 500 mg',
      batchNumber: 'BATCH-AMX-SOONER',
      expiryDate: '2027-06-30',
      quantity: 50,
      receivedById: 'PHARM-01',
      receivedByName: 'Apt. Siti'
    });

    const fefoRes = await fefoMultiDepotInventoryEngine.allocateFefoStock({
      depotId,
      medicationCode: 'MED-AMOX-500',
      requestedQty: 30,
      currentTimestamp: '2026-08-18T08:00:00.000Z'
    });

    expect(fefoRes.success).toBe(true);
    expect(fefoRes.allocations.length).toBe(1);
    expect(fefoRes.primaryBatch.batchNumber).toBe('BATCH-AMX-SOONER');
    expect(fefoRes.primaryBatch.allocatedQty).toBe(30);
  });

  // 2. Multi-Depot Mutasi / Transfer Order Flow
  it('2. should execute complete stock transfer from Warehouse to Inpatient Satellite', async () => {
    await fefoMultiDepotInventoryEngine.registerStockBatch({
      depotId: 'DEPOT-WAREHOUSE',
      depotType: DEPOT_TYPES.CENTRAL_WAREHOUSE,
      medicationCode: 'MED-ONDANSETRON-4MG',
      medicationName: 'Ondansetron 4 mg Ampul',
      batchNumber: 'BATCH-OND-99',
      expiryDate: '2028-10-01',
      quantity: 500,
      receivedById: 'LOG-001',
      receivedByName: 'Staf Gudang'
    });

    const reqRes = await fefoMultiDepotInventoryEngine.createTransferOrder({
      sourceDepotId: 'DEPOT-WAREHOUSE',
      targetDepotId: 'DEPOT-INPATIENT',
      medicationCode: 'MED-ONDANSETRON-4MG',
      medicationName: 'Ondansetron 4 mg Ampul',
      requestedQty: 50,
      requestedById: 'PHARM-02',
      requestedByName: 'Apt. Rawat Inap'
    });

    expect(reqRes.transfer.status).toBe('TRANSFER_REQUESTED');

    const dispatchRes = await fefoMultiDepotInventoryEngine.dispatchTransferOrder({
      transferId: reqRes.transfer.id,
      dispatchedById: 'LOG-001',
      dispatchedByName: 'Staf Gudang'
    });

    expect(dispatchRes.transfer.status).toBe('DISPATCHED');

    const receiveRes = await fefoMultiDepotInventoryEngine.receiveTransferOrder({
      transferId: reqRes.transfer.id,
      receivedById: 'PHARM-02',
      receivedByName: 'Apt. Rawat Inap'
    });

    expect(receiveRes.transfer.status).toBe('RECEIVED');
  });

  // 3. Point-of-Care Lot/Batch Reconciliation
  it('3. should reject bedside administration on LOT_MISMATCH against dispensed lot', async () => {
    const enc = {
      id: 'ENC-LOT-RECON',
      patientId: 'PAT-LOT-01',
      patientName: 'Ny. Warsiti',
      mrn: 'MRN-2026-WARSITI',
      primaryState: CARE_STATES.INPATIENT_ACTIVE
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    const rxRes = await medicationLifecycleEngine.prescribeMedication({
      encounterId: 'ENC-LOT-RECON',
      patientId: 'PAT-LOT-01',
      patientName: 'Ny. Warsiti',
      mrn: 'MRN-2026-WARSITI',
      prescriberId: 'DOC-001',
      prescriberName: 'dr. Budi',
      medicationCode: 'MED-MEROPENEM-1G',
      medicationName: 'Meropenem 1g Vial',
      dose: 1,
      doseUnit: 'g',
      route: 'IV',
      frequency: 'TID'
    });

    await medicationLifecycleEngine.verifyAndDispense({
      orderId: rxRes.order.id,
      pharmacistId: 'PHARM-001',
      pharmacistName: 'Apt. Siti',
      dispensedQty: 3,
      allocatedBatchNumber: 'BATCH-DISPENSED-ORIGINAL',
      allocatedLotNumber: 'LOT-ORIG-01',
      allocatedExpiryDate: '2028-12-31'
    });

    const slot = rxRes.order.scheduleSlots[0];
    const rawGs1Mismatch = '(01)MED-MEROPENEM-1G(17)281231(10)BATCH-DIFFERENT-UNAUTHORIZED';

    const verif = await pointOfCareFiveRightsValidator.validateFiveRights({
      rawPatientBarcode: 'MRN-2026-WARSITI',
      rawMedicationBarcode: rawGs1Mismatch,
      orderId: rxRes.order.id,
      slotId: slot.slotId,
      currentTimestamp: slot.targetTimestamp
    });

    expect(verif.status).toBe(FIVE_RIGHTS_STATUS.FAIL);
    expect(verif.rights.rightDrug.code).toBe(SENSOR_ERROR_CODES.LOT_MISMATCH);
  });

  // 4. BPOM Batch Recall & Zero-Latency Patient Traceability Engine
  it('4. should freeze inventory across all depots and generate patient impact manifest upon BPOM Recall', async () => {
    // 1. Stock in Central Warehouse and Inpatient Depot
    await fefoMultiDepotInventoryEngine.registerStockBatch({
      depotId: 'DEPOT-WAREHOUSE',
      medicationCode: 'MED-RANITIDINE-50MG',
      medicationName: 'Ranitidine Injeksi 50 mg',
      batchNumber: 'LOT-BPOM-RECALL-99',
      expiryDate: '2028-05-01',
      quantity: 200,
      receivedById: 'LOG-01',
      receivedByName: 'Staf Logistik'
    });

    await fefoMultiDepotInventoryEngine.registerStockBatch({
      depotId: 'DEPOT-INPATIENT',
      medicationCode: 'MED-RANITIDINE-50MG',
      medicationName: 'Ranitidine Injeksi 50 mg',
      batchNumber: 'LOT-BPOM-RECALL-99',
      expiryDate: '2028-05-01',
      quantity: 50,
      receivedById: 'PHARM-01',
      receivedByName: 'Apt. Siti'
    });

    // 2. Simulate Patient 1 and Patient 2 who received this batch in the past
    const enc1 = { id: 'ENC-REC-01', patientId: 'PAT-RCL-01', patientName: 'Tn. Korban Recall 1', mrn: 'MRN-RCL-01', primaryState: CARE_STATES.INPATIENT_ACTIVE };
    await persistenceAdapter.save('encounters', enc1.id, enc1);

    const rxRes = await medicationLifecycleEngine.prescribeMedication({
      encounterId: 'ENC-REC-01',
      patientId: 'PAT-RCL-01',
      patientName: 'Tn. Korban Recall 1',
      mrn: 'MRN-RCL-01',
      prescriberId: 'DOC-01',
      prescriberName: 'dr. Budi',
      medicationCode: 'MED-RANITIDINE-50MG',
      medicationName: 'Ranitidine Injeksi 50 mg',
      dose: 50,
      doseUnit: 'mg',
      route: 'IV',
      frequency: 'BID'
    });

    await medicationLifecycleEngine.verifyAndDispense({
      orderId: rxRes.order.id,
      pharmacistId: 'PHARM-01',
      pharmacistName: 'Apt. Siti',
      dispensedQty: 2,
      allocatedBatchNumber: 'LOT-BPOM-RECALL-99',
      allocatedLotNumber: 'LOT-BPOM-RECALL-99',
      allocatedExpiryDate: '2028-05-01'
    });

    const slot = rxRes.order.scheduleSlots[0];
    await pointOfCareFiveRightsValidator.executeBedsideAdministration({
      rawPatientBarcode: 'MRN-RCL-01',
      rawMedicationBarcode: 'MED-RANITIDINE-50MG',
      orderId: rxRes.order.id,
      slotId: slot.slotId,
      nurseId: 'NURSE-01',
      nurseName: 'Ners Rina',
      currentTimestamp: slot.targetTimestamp
    });

    // 3. Trigger BPOM Recall for LOT-BPOM-RECALL-99
    const recallResult = await fefoMultiDepotInventoryEngine.executeBpomRecall({
      batchNumber: 'LOT-BPOM-RECALL-99',
      medicationCode: 'MED-RANITIDINE-50MG',
      recallReason: 'NDMA impurity detected exceeding safety limit',
      authority: 'BPOM_RI',
      initiatedById: 'DIR-MED-01',
      initiatedByName: 'dr. Direktur Medis'
    });

    expect(recallResult.success).toBe(true);
    expect(recallResult.recallManifest.inventorySummary.totalUnitsFrozen).toBe(250); // 200 + 50
    expect(recallResult.recallManifest.clinicalImpact.totalPatientsAffected).toBe(1);
    expect(recallResult.recallManifest.clinicalImpact.affectedPatients[0].patientName).toBe('Tn. Korban Recall 1');
    expect(recallResult.recallManifest.clinicalImpact.affectedPatients[0].mrn).toBe('MRN-RCL-01');
  });

  // 5. Hospital Waste & Destruction Management
  it('5. should record medication waste with dual witness and deduct inventory', async () => {
    const depotId = 'DEPOT-INPATIENT';

    await fefoMultiDepotInventoryEngine.registerStockBatch({
      depotId,
      medicationCode: 'MED-FENTANYL-100MCG',
      medicationName: 'Fentanyl Injeksi 100 mcg / 2 mL',
      batchNumber: 'BATCH-FNT-01',
      expiryDate: '2028-01-01',
      quantity: 20,
      receivedById: 'PHARM-01',
      receivedByName: 'Apt. Siti'
    });

    // Nurse/Pharmacist reports broken ampoule during preparation
    const wasteRes = await fefoMultiDepotInventoryEngine.recordMedicationWaste({
      depotId,
      medicationCode: 'MED-FENTANYL-100MCG',
      batchNumber: 'BATCH-FNT-01',
      wastedQty: 2,
      reason: WASTE_REASONS.BROKEN,
      dualWitnessId: 'NURSE-WITNESS',
      dualWitnessName: 'Ners Maya (Saksi)',
      recordedById: 'PHARM-01',
      recordedByName: 'Apt. Siti',
      notes: 'Ampul terjatuh saat penyiapan di ruang steril'
    });

    expect(wasteRes.success).toBe(true);
    expect(wasteRes.batch.currentQuantity).toBe(18); // 20 - 2 = 18
    expect(wasteRes.wasteEvent.eventType).toBe('WASTED');
    expect(wasteRes.wasteEvent.payload.reason).toBe(WASTE_REASONS.BROKEN);
  });

  // 6. Return-to-Pharmacy Workflow
  it('6. should process ward-to-pharmacy return and restock into inventory', async () => {
    const returnReq = await fefoMultiDepotInventoryEngine.requestMedicationReturn({
      encounterId: 'ENC-RET-01',
      patientId: 'PAT-RET-01',
      patientName: 'Ny. Pulang Cepat',
      mrn: 'MRN-RET-01',
      fromLocation: 'Bangsal Melati Bed 02',
      targetDepotId: 'DEPOT-INPATIENT',
      medicationCode: 'MED-CEFTRIAXONE-1G',
      medicationName: 'Ceftriaxone 1g Vial',
      batchNumber: 'BATCH-CFX-RESTOCK',
      returnedQty: 5,
      returnReason: 'Pasien dipulangkan sebelum jadwal dosis terakhir',
      requestedById: 'NURSE-01',
      requestedByName: 'Ners Rina'
    });

    expect(returnReq.returnRecord.status).toBe('RETURN_REQUESTED');

    // Pharmacist inspects seal and accepts return into stock
    const processRes = await fefoMultiDepotInventoryEngine.verifyAndProcessReturn({
      returnId: returnReq.returnRecord.id,
      action: 'RESTOCK',
      restockExpiryDate: '2028-12-31',
      processedById: 'PHARM-01',
      processedByName: 'Apt. Siti'
    });

    expect(processRes.returnRecord.status).toBe('RETURN_ACCEPTED');

    // Verify stock is now present in DEPOT-INPATIENT
    const stockBatches = await persistenceAdapter.query('inventory_stock_batches', b => 
      b.depotId === 'DEPOT-INPATIENT' && b.batchNumber === 'BATCH-CFX-RESTOCK'
    );
    expect(stockBatches.length).toBe(1);
    expect(stockBatches[0].currentQuantity).toBe(5);
  });

  // 7. Cold Chain Excursion FSM & Auto-Quarantine
  it('7. should auto-quarantine cold-chain stock on temperature excursion and handle resolution', async () => {
    const depotId = 'DEPOT-COLD-CHILLER';

    await fefoMultiDepotInventoryEngine.registerStockBatch({
      depotId,
      medicationCode: 'MED-INS-LANTUS',
      medicationName: 'Lantus Solostar 100 IU/mL',
      batchNumber: 'BATCH-LNT-01',
      expiryDate: '2027-10-01',
      quantity: 50,
      storageCondition: 'COLD_CHAIN_2_8C',
      targetTempMin: 2,
      targetTempMax: 8,
      receivedById: 'PHARM-01',
      receivedByName: 'Apt. Siti'
    });

    // IoT Sensor reports spike: 12.5°C
    const excursionRes = await fefoMultiDepotInventoryEngine.recordTemperatureReading({
      depotId,
      storageUnitId: 'CHILLER-ROOM-1',
      recordedTemp: 12.5,
      minTarget: 2.0,
      maxTarget: 8.0
    });

    expect(excursionRes.status).toBe(COLD_CHAIN_STATES.EXCURSION_DETECTED);

    // Verify batch is auto-quarantined
    const batch = await persistenceAdapter.findById('inventory_stock_batches', excursionRes.excursionRecord.quarantinedBatchIds[0]);
    expect(batch.status).toBe(BATCH_STATUS.QUARANTINED);

    // Pharmacist investigates and releases after stability confirmation
    const resolveRes = await fefoMultiDepotInventoryEngine.resolveColdChainExcursion({
      excursionId: excursionRes.excursionRecord.id,
      decision: 'RELEASE',
      findings: 'Deviasi suhu hanya berlangsung 8 menit saat restoking, uji visual normal',
      manufacturerConsulted: true,
      resolvedById: 'APOTEKER-PJ',
      resolvedByName: 'Apt. Kepala Instalasi'
    });

    expect(resolveRes.excursion.status).toBe(COLD_CHAIN_STATES.RELEASED);

    const releasedBatch = await persistenceAdapter.findById('inventory_stock_batches', batch.id);
    expect(releasedBatch.status).toBe(BATCH_STATUS.ACTIVE);
  });

  // 8. Controlled Substance (Narkotika/Psikotropika) Ledger (SIPNAP)
  it('8. should enforce mathematical balance invariants for controlled substance transactions', async () => {
    const transaction = await fefoMultiDepotInventoryEngine.recordControlledSubstanceTransaction({
      transactionType: 'DISPENSED',
      depotId: 'DEPOT-NARCOTICS-VAULT',
      medicationCode: 'MED-MORPHINE-10MG',
      medicationName: 'Morphine HCL 10 mg Injeksi',
      batchNumber: 'BATCH-MOR-99',
      quantityDelta: -2,
      balanceBefore: 50,
      balanceAfter: 48,
      prescriberSip: 'SIP.1982/DKI/2024',
      patientMrn: 'MRN-2026-NARC-01',
      pharmacistSik: 'SIK.APOTEKER.998',
      witnessCoSigner: 'Ners Maya',
      notes: 'Dispensing analgesia pasca-laparotomi ICU'
    });

    expect(transaction.success).toBe(true);
    expect(transaction.ledgerEntry.balanceAfter).toBe(48);

    // Math mismatch must be rejected
    await expect(
      fefoMultiDepotInventoryEngine.recordControlledSubstanceTransaction({
        transactionType: 'DISPENSED',
        depotId: 'DEPOT-NARCOTICS-VAULT',
        medicationCode: 'MED-MORPHINE-10MG',
        medicationName: 'Morphine HCL 10 mg Injeksi',
        batchNumber: 'BATCH-MOR-99',
        quantityDelta: -2,
        balanceBefore: 50,
        balanceAfter: 40 // Wrong math! 50 - 2 != 40
      })
    ).rejects.toThrow(/LEDGER_MATH_VIOLATION/);
  });

  // 9. Internal HL7 FHIR R4 Medication Mapping Layer
  it('9. should correctly map Canonical Orders, Dispenses, and Administrations to FHIR R4 Resources', () => {
    const mockOrder = {
      id: 'ORD-FHIR-01',
      orderNumber: 'RX-2026-9901',
      patientId: 'PAT-001',
      patientName: 'Tn. Fhir Test',
      encounterId: 'ENC-001',
      medicationCode: '93000101',
      medicationName: 'Ceftriaxone 1g Injeksi',
      dose: 1,
      doseUnit: 'g',
      route: 'IV',
      frequency: 'BID',
      status: 'ORDERED',
      createdAt: '2026-08-18T08:00:00.000Z'
    };

    // 1. Map to MedicationRequest
    const fhirReq = fhirMedicationMapperService.toFhirMedicationRequest(mockOrder);
    expect(fhirReq.resourceType).toBe(FHIR_RESOURCE_TYPES.MEDICATION_REQUEST);
    expect(fhirReq.status).toBe('active');
    expect(fhirReq.subject.reference).toBe('Patient/PAT-001');
    expect(fhirReq.medicationCodeableConcept.coding[0].code).toBe('93000101');

    // 2. Map to MedicationDispense
    const fhirDisp = fhirMedicationMapperService.toFhirMedicationDispense(mockOrder, {
      pharmacistId: 'PHARM-01',
      pharmacistName: 'Apt. Siti',
      dispensedQty: 2,
      dispensedAt: '2026-08-18T08:15:00.000Z'
    });
    expect(fhirDisp.resourceType).toBe(FHIR_RESOURCE_TYPES.MEDICATION_DISPENSE);
    expect(fhirDisp.status).toBe('completed');
    expect(fhirDisp.quantity.value).toBe(2);

    // 3. Map to MedicationAdministration
    const mockSlot = {
      slotId: 'SLOT-01-0800',
      scheduledTime: '08:00',
      status: 'ADMINISTERED',
      administeredAt: '2026-08-18T08:05:00.000Z',
      administeredBy: { id: 'NURSE-01', name: 'Ners Rina' }
    };
    const fhirAdmin = fhirMedicationMapperService.toFhirMedicationAdministration(mockOrder, mockSlot);
    expect(fhirAdmin.resourceType).toBe(FHIR_RESOURCE_TYPES.MEDICATION_ADMINISTRATION);
    expect(fhirAdmin.status).toBe('completed');
    expect(fhirAdmin.performer[0].actor.display).toBe('Ners Rina');

    // 4. Map Master Drug to FHIR Medication
    const mockDrug = {
      code: 'KFA-93000101',
      name: 'Ceftriaxone Sodium 1g Vial',
      dosageForm: 'VIAL'
    };
    const fhirMed = fhirMedicationMapperService.toFhirMedication(mockDrug, {
      batchNumber: 'LOT-99881',
      expiryDate: '2028-12-31'
    });
    expect(fhirMed.resourceType).toBe(FHIR_RESOURCE_TYPES.MEDICATION);
    expect(fhirMed.batch.lotNumber).toBe('LOT-99881');
    expect(fhirMed.batch.expirationDate).toBe('2028-12-31');
  });
});
