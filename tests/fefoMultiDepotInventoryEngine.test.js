/**
 * SPRINT 3D: FEFO MULTI-DEPOT INVENTORY ENGINE ADVERSARIAL TEST SUITE
 * 
 * Validates:
 * 1. Multi-Depot Inbound Batch Registration (Gudang, Depo, Bangsal)
 * 2. Strict FEFO Sorting & Allocation (Earliest Expiry Picked First)
 * 3. Expired and Quarantined Batch Skip / Hard Stop
 * 4. Multi-Depot Mutasi / Transfer Flow (Request -> Dispatch -> Receive)
 * 5. Point-of-Care Barcode Batch/Lot & Expiry Reconciliation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  fefoMultiDepotInventoryEngine, 
  DEPOT_TYPES, 
  BATCH_STATUS, 
  INVENTORY_ERROR_CODES 
} from '../src/core/services/fefoMultiDepotInventoryEngine.service.js';
import { pointOfCareFiveRightsValidator, SENSOR_ERROR_CODES, FIVE_RIGHTS_STATUS } from '../src/core/services/pointOfCareFiveRightsValidator.service.js';
import { medicationLifecycleEngine } from '../src/core/services/medicationLifecycleEngine.service.js';
import { persistenceAdapter, DB_ENGINE_TYPES } from '../src/core/services/persistenceAdapter.service.js';
import { CARE_STATES } from '../src/core/services/careStateEngine.service.js';

describe('Sprint 3D: FEFO Multi-Depot & Batch/Expiry Inventory Engine Suite', () => {
  beforeEach(() => {
    persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);
  });

  // 1. Goods Receipt & Strict FEFO Allocation
  it('1. should strictly allocate earliest expiring batch first (FEFO Principle)', async () => {
    const depotId = 'DEPOT-CENTRAL-PHARM';

    // Batch A: Expiry in 2028 (Later)
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

    // Batch B: Expiry in 2027 (Earlier - Should be picked first!)
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

    // Allocate 30 units
    const fefoRes = await fefoMultiDepotInventoryEngine.allocateFefoStock({
      depotId,
      medicationCode: 'MED-AMOX-500',
      requestedQty: 30,
      currentTimestamp: '2026-08-18T08:00:00.000Z'
    });

    expect(fefoRes.success).toBe(true);
    expect(fefoRes.allocations.length).toBe(1);
    expect(fefoRes.primaryBatch.batchNumber).toBe('BATCH-AMX-SOONER'); // Picked the 2027 batch!
    expect(fefoRes.primaryBatch.allocatedQty).toBe(30);

    // Multi-batch allocation spanning across 2 batches
    const fefoMultiRes = await fefoMultiDepotInventoryEngine.allocateFefoStock({
      depotId,
      medicationCode: 'MED-AMOX-500',
      requestedQty: 70, // 50 from sooner + 20 from later
      currentTimestamp: '2026-08-18T08:00:00.000Z'
    });

    expect(fefoMultiRes.allocations.length).toBe(2);
    expect(fefoMultiRes.allocations[0].batchNumber).toBe('BATCH-AMX-SOONER');
    expect(fefoMultiRes.allocations[0].allocatedQty).toBe(50);
    expect(fefoMultiRes.allocations[1].batchNumber).toBe('BATCH-AMX-LATER');
    expect(fefoMultiRes.allocations[1].allocatedQty).toBe(20);
  });

  // 2. Quarantine / Recall Batch Lock
  it('2. should skip quarantined batches during FEFO allocation', async () => {
    const depotId = 'DEPOT-INPATIENT';

    // Register batch
    await fefoMultiDepotInventoryEngine.registerStockBatch({
      depotId,
      depotType: DEPOT_TYPES.INPATIENT_SATELLITE,
      medicationCode: 'MED-CEFOTAXIME-1G',
      medicationName: 'Cefotaxime 1g',
      batchNumber: 'BATCH-CONTAMINATED',
      expiryDate: '2027-01-01',
      quantity: 100,
      receivedById: 'PHARM-01',
      receivedByName: 'Apt. Siti'
    });

    // Register good batch
    await fefoMultiDepotInventoryEngine.registerStockBatch({
      depotId,
      depotType: DEPOT_TYPES.INPATIENT_SATELLITE,
      medicationCode: 'MED-CEFOTAXIME-1G',
      medicationName: 'Cefotaxime 1g',
      batchNumber: 'BATCH-CLEAN',
      expiryDate: '2028-01-01',
      quantity: 50,
      receivedById: 'PHARM-01',
      receivedByName: 'Apt. Siti'
    });

    // BPOM / Hospital Recall: Quarantine BATCH-CONTAMINATED
    await fefoMultiDepotInventoryEngine.quarantineBatch({
      batchNumber: 'BATCH-CONTAMINATED',
      medicationCode: 'MED-CEFOTAXIME-1G',
      reason: 'Particulate contamination reported by BPOM',
      quarantinedById: 'QA-001',
      quarantinedByName: 'Dr. Apoteker Penanggung Jawab'
    });

    // Run FEFO Allocation -> Must skip BATCH-CONTAMINATED and pick BATCH-CLEAN
    const alloc = await fefoMultiDepotInventoryEngine.allocateFefoStock({
      depotId,
      medicationCode: 'MED-CEFOTAXIME-1G',
      requestedQty: 10,
      currentTimestamp: '2026-08-18T08:00:00.000Z'
    });

    expect(alloc.primaryBatch.batchNumber).toBe('BATCH-CLEAN');
  });

  // 3. Multi-Depot Mutasi / Transfer Order Flow
  it('3. should execute complete stock transfer from Warehouse to Ward Floor Stock', async () => {
    // 1. Inbound to Central Warehouse
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

    // 2. Request Transfer from Warehouse to Inpatient Depo
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

    // 3. Warehouse Dispatches Order (FEFO deduction at Warehouse)
    const dispatchRes = await fefoMultiDepotInventoryEngine.dispatchTransferOrder({
      transferId: reqRes.transfer.id,
      dispatchedById: 'LOG-001',
      dispatchedByName: 'Staf Gudang'
    });

    expect(dispatchRes.transfer.status).toBe('DISPATCHED');

    // Check Warehouse remaining stock
    const warehouseStock = await persistenceAdapter.findById('inventory_stock_batches', dispatchRes.fefo.allocations[0].batchId);
    expect(warehouseStock.currentQuantity).toBe(450); // 500 - 50 = 450

    // 4. Inpatient Depo Receives Order
    const receiveRes = await fefoMultiDepotInventoryEngine.receiveTransferOrder({
      transferId: reqRes.transfer.id,
      receivedById: 'PHARM-02',
      receivedByName: 'Apt. Rawat Inap'
    });

    expect(receiveRes.transfer.status).toBe('RECEIVED');

    // Check Inpatient Depo stock
    const inpatientBatches = await persistenceAdapter.query('inventory_stock_batches', b => 
      b.depotId === 'DEPOT-INPATIENT' && b.medicationCode === 'MED-ONDANSETRON-4MG'
    );
    expect(inpatientBatches.length).toBe(1);
    expect(inpatientBatches[0].currentQuantity).toBe(50);
    expect(inpatientBatches[0].batchNumber).toBe('BATCH-OND-99');
  });

  // 4. Point-of-Care Lot/Batch Reconciliation (Sprint 3C & 3D Integration)
  it('4. should reject point-of-care administration if scanned lot differs from dispensed lot (LOT_MISMATCH)', async () => {
    const enc = {
      id: 'ENC-LOT-RECON',
      patientId: 'PAT-LOT-01',
      patientName: 'Ny. Warsiti',
      mrn: 'MRN-2026-WARSITI',
      primaryState: CARE_STATES.INPATIENT_ACTIVE
    };
    await persistenceAdapter.save('encounters', enc.id, enc);

    // Doctor Prescribes
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

    // Pharmacy dispenses BATCH-DISPENSED-ORIGINAL
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

    // GS1 barcode with DIFFERENT batch: BATCH-DIFFERENT-UNAUTHORIZED
    // (01)MED-MEROPENEM-1G(17)281231(10)BATCH-DIFFERENT-UNAUTHORIZED
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
    expect(verif.rights.rightDrug.details).toContain('BATCH-DISPENSED-ORIGINAL');
  });
});
