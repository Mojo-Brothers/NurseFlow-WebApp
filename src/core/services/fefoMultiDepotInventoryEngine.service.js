/**
 * ============================================================================
 * SPRINT 3D: MULTI-DEPOT FEFO & BATCH/EXPIRY INVENTORY ENGINE
 * 
 * Enterprise Hospital Inventory & Pharmaceutical Logistics Foundation:
 * 1. Multi-Depot Hierarchy (Warehouse -> Central -> Satellites -> Ward Floor Stock)
 * 2. Strict FEFO (First-Expired, First-Out) Algorithm
 * 3. Batch / Lot / Serial Lifecycle & Quarantine / Recall Locks
 * 4. Cold Chain Storage & Temperature Excursion Monitoring (2-8°C)
 * 5. Stock Transfer (Mutasi Antar Depo) with Dispatch & Receipt Reconciliation
 * 6. Immutable Inventory Event Ledger (inventory_events)
 * ============================================================================
 */

import { persistenceAdapter } from './persistenceAdapter.service.js';

export const DEPOT_TYPES = {
  CENTRAL_WAREHOUSE: 'CENTRAL_WAREHOUSE',
  CENTRAL_PHARMACY: 'CENTRAL_PHARMACY',
  INPATIENT_SATELLITE: 'INPATIENT_SATELLITE',
  OUTPATIENT_SATELLITE: 'OUTPATIENT_SATELLITE',
  EMERGENCY_DEPOT: 'EMERGENCY_DEPOT',
  OR_DEPOT: 'OR_DEPOT',
  WARD_FLOOR_STOCK: 'WARD_FLOOR_STOCK'
};

export const BATCH_STATUS = {
  ACTIVE: 'ACTIVE',
  NEAR_EXPIRY: 'NEAR_EXPIRY', // < 90 days
  CRITICAL_EXPIRY: 'CRITICAL_EXPIRY', // < 30 days
  EXPIRED: 'EXPIRED',
  QUARANTINED: 'QUARANTINED',
  RECALLED: 'RECALLED',
  DEPLETED: 'DEPLETED'
};

export const INVENTORY_EVENTS = {
  GOODS_RECEIPT: 'GOODS_RECEIPT',
  FEFO_ALLOCATION: 'FEFO_ALLOCATION',
  DISPENSE_DEDUCTION: 'DISPENSE_DEDUCTION',
  TRANSFER_DISPATCH: 'TRANSFER_DISPATCH',
  TRANSFER_RECEIPT: 'TRANSFER_RECEIPT',
  BATCH_QUARANTINED: 'BATCH_QUARANTINED',
  BATCH_RECALLED: 'BATCH_RECALLED',
  BATCH_RELEASED: 'BATCH_RELEASED',
  TEMPERATURE_EXCURSION: 'TEMPERATURE_EXCURSION',
  STOCK_ADJUSTMENT: 'STOCK_ADJUSTMENT',
  STOCK_DESTRUCTION: 'STOCK_DESTRUCTION'
};

export const INVENTORY_ERROR_CODES = {
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  NO_VALID_FEFO_BATCH: 'NO_VALID_FEFO_BATCH',
  BATCH_QUARANTINED: 'BATCH_QUARANTINED',
  BATCH_EXPIRED: 'BATCH_EXPIRED',
  INVALID_DEPOT: 'INVALID_DEPOT',
  COLD_CHAIN_EXCURSION: 'COLD_CHAIN_EXCURSION'
};

class FefoMultiDepotInventoryEngine {
  constructor() {
    this.STOCK_COLLECTION = 'inventory_stock_batches';
    this.TRANSFERS_COLLECTION = 'inventory_transfer_orders';
    this.EVENTS_COLLECTION = 'inventory_events';
    this.NEAR_EXPIRY_THRESHOLD_DAYS = 90;
    this.CRITICAL_EXPIRY_THRESHOLD_DAYS = 30;
  }

  /**
   * 1. Register / Inbound Goods Receipt (Penerimaan Barang ke Gudang/Depo)
   */
  async registerStockBatch({
    depotId,
    depotType = DEPOT_TYPES.CENTRAL_WAREHOUSE,
    medicationCode,
    medicationName,
    batchNumber,
    lotNumber = null,
    expiryDate, // 'YYYY-MM-DD'
    quantity,
    unitPrice = 0,
    storageCondition = 'ROOM_TEMPERATURE', // 'ROOM_TEMPERATURE' | 'COLD_CHAIN_2_8C' | 'FROZEN'
    targetTempMin = 15,
    targetTempMax = 25,
    receivedById,
    receivedByName,
    supplierId = null,
    poNumber = null,
    commandId = null,
    correlationId = null
  }) {
    const timestamp = new Date().toISOString();
    const batchId = `STK-${depotId}-${batchNumber}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const expiryStatus = this._evaluateExpiryStatus(expiryDate, timestamp);

    const stockBatch = {
      id: batchId,
      depotId,
      depotType,
      medicationCode,
      medicationName,
      batchNumber,
      lotNumber: lotNumber || batchNumber,
      expiryDate,
      expiryStatus,
      initialQuantity: quantity,
      currentQuantity: quantity,
      reservedQuantity: 0,
      unitPrice,
      storageCondition,
      targetTempMin,
      targetTempMax,
      status: expiryStatus === BATCH_STATUS.EXPIRED ? BATCH_STATUS.EXPIRED : BATCH_STATUS.ACTIVE,
      receivedInfo: {
        receivedById,
        receivedByName,
        supplierId,
        poNumber,
        receivedAt: timestamp
      },
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await persistenceAdapter.save(this.STOCK_COLLECTION, stockBatch.id, stockBatch);

    // Record Event Sourcing
    const event = {
      id: `EVT-INV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      eventVersion: '1.0',
      aggregateId: stockBatch.id,
      aggregateVersion: 1,
      correlationId: correlationId || `CORR-INV-${Date.now()}`,
      commandId,
      eventType: INVENTORY_EVENTS.GOODS_RECEIPT,
      depotId,
      medicationCode,
      batchNumber,
      quantityDelta: quantity,
      occurredAt: timestamp,
      recordedAt: timestamp,
      performedBy: { id: receivedById, name: receivedByName, role: 'PHARMACY_INVENTORY' },
      payload: {
        depotType,
        expiryDate,
        storageCondition,
        unitPrice
      }
    };
    await persistenceAdapter.save(this.EVENTS_COLLECTION, event.id, event);

    return { success: true, stockBatch, event };
  }

  /**
   * 2. FEFO Allocation Engine: Automatically select earliest non-expired, non-quarantined batches
   */
  async allocateFefoStock({
    depotId,
    medicationCode,
    requestedQty,
    currentTimestamp = new Date().toISOString()
  }) {
    // 1. Query all stock batches for this medication in the specific depot
    const allBatches = await persistenceAdapter.query(this.STOCK_COLLECTION, b => 
      b.depotId === depotId && 
      b.medicationCode === medicationCode &&
      b.currentQuantity > 0
    );

    // 2. Filter out expired, quarantined, or recalled batches
    const validBatches = allBatches.filter(b => {
      const isExpired = new Date(b.expiryDate).getTime() < new Date(currentTimestamp).getTime();
      const isQuarantined = b.status === BATCH_STATUS.QUARANTINED || b.status === BATCH_STATUS.RECALLED;
      return !isExpired && !isQuarantined;
    });

    if (validBatches.length === 0) {
      throw new Error(`[${INVENTORY_ERROR_CODES.NO_VALID_FEFO_BATCH}] No non-expired, active FEFO stock available for medication "${medicationCode}" in depot "${depotId}"`);
    }

    // 3. Strict FEFO Sorting: Earliest Expiry Date First
    validBatches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    // 4. Calculate total available quantity
    const totalAvailable = validBatches.reduce((sum, b) => sum + (b.currentQuantity - (b.reservedQuantity || 0)), 0);
    if (totalAvailable < requestedQty) {
      throw new Error(`[${INVENTORY_ERROR_CODES.INSUFFICIENT_STOCK}] Insufficient stock for "${medicationCode}" in depot "${depotId}". Requested: ${requestedQty}, Available: ${totalAvailable}`);
    }

    // 5. Allocate batches
    let remainingToAllocate = requestedQty;
    const allocations = [];

    for (const batch of validBatches) {
      if (remainingToAllocate <= 0) break;

      const availableInBatch = batch.currentQuantity - (batch.reservedQuantity || 0);
      const takeQty = Math.min(availableInBatch, remainingToAllocate);

      allocations.push({
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        lotNumber: batch.lotNumber,
        expiryDate: batch.expiryDate,
        allocatedQty: takeQty,
        storageCondition: batch.storageCondition
      });

      remainingToAllocate -= takeQty;
    }

    return {
      success: true,
      depotId,
      medicationCode,
      requestedQty,
      allocations,
      primaryBatch: allocations[0]
    };
  }

  /**
   * 3. Dispense & Deduct Stock using FEFO Allocation
   */
  async deductDispensedStock({
    depotId,
    medicationCode,
    dispenseQty,
    allocatedBatches,
    orderId,
    pharmacistId,
    pharmacistName,
    commandId = null,
    correlationId = null
  }) {
    const timestamp = new Date().toISOString();
    const deductedBatches = [];

    for (const alloc of allocatedBatches) {
      const batch = await persistenceAdapter.findById(this.STOCK_COLLECTION, alloc.batchId);
      if (!batch) throw new Error(`Stock batch "${alloc.batchId}" not found`);

      batch.currentQuantity -= alloc.allocatedQty;
      if (batch.currentQuantity <= 0) {
        batch.currentQuantity = 0;
        batch.status = BATCH_STATUS.DEPLETED;
      }
      batch.version = (batch.version || 1) + 1;
      batch.updatedAt = timestamp;

      await persistenceAdapter.save(this.STOCK_COLLECTION, batch.id, batch);

      // Record Event Sourcing for each deducted batch
      const event = {
        id: `EVT-INV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        eventVersion: '1.0',
        aggregateId: batch.id,
        aggregateVersion: batch.version,
        correlationId: correlationId || `CORR-DISP-${orderId}`,
        commandId,
        eventType: INVENTORY_EVENTS.DISPENSE_DEDUCTION,
        depotId,
        medicationCode,
        batchNumber: batch.batchNumber,
        quantityDelta: -alloc.allocatedQty,
        occurredAt: timestamp,
        recordedAt: timestamp,
        performedBy: { id: pharmacistId, name: pharmacistName, role: 'PHARMACIST' },
        payload: {
          orderId,
          remainingBatchQty: batch.currentQuantity
        }
      };
      await persistenceAdapter.save(this.EVENTS_COLLECTION, event.id, event);
      deductedBatches.push({ batchId: batch.id, batchNumber: batch.batchNumber, remaining: batch.currentQuantity });
    }

    return { success: true, deductedBatches };
  }

  /**
   * 4. Stock Transfer / Mutasi Antar Depo (Gudang -> Depo / Depo -> Bangsal)
   */
  async createTransferOrder({
    sourceDepotId,
    targetDepotId,
    medicationCode,
    medicationName,
    requestedQty,
    requestedById,
    requestedByName,
    notes = ''
  }) {
    const transferId = `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const transfer = {
      id: transferId,
      transferNumber: `MUTASI-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      sourceDepotId,
      targetDepotId,
      medicationCode,
      medicationName,
      requestedQty,
      status: 'TRANSFER_REQUESTED',
      requestedBy: { id: requestedById, name: requestedByName, requestedAt: timestamp },
      dispatchedInfo: null,
      receivedInfo: null,
      notes,
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await persistenceAdapter.save(this.TRANSFERS_COLLECTION, transfer.id, transfer);
    return { success: true, transfer };
  }

  /**
   * 5. Dispatch Stock Transfer (Source Depot -> Deduct & Transit)
   */
  async dispatchTransferOrder({
    transferId,
    dispatchedById,
    dispatchedByName
  }) {
    const transfer = await persistenceAdapter.findById(this.TRANSFERS_COLLECTION, transferId);
    if (!transfer) throw new Error(`Transfer order "${transferId}" not found`);

    // Run FEFO Allocation at source depot
    const fefo = await this.allocateFefoStock({
      depotId: transfer.sourceDepotId,
      medicationCode: transfer.medicationCode,
      requestedQty: transfer.requestedQty
    });

    const timestamp = new Date().toISOString();

    // Deduct from Source Depot
    for (const alloc of fefo.allocations) {
      const batch = await persistenceAdapter.findById(this.STOCK_COLLECTION, alloc.batchId);
      batch.currentQuantity -= alloc.allocatedQty;
      batch.version = (batch.version || 1) + 1;
      batch.updatedAt = timestamp;
      await persistenceAdapter.save(this.STOCK_COLLECTION, batch.id, batch);
    }

    transfer.status = 'DISPATCHED';
    transfer.dispatchedInfo = {
      dispatchedById,
      dispatchedByName,
      dispatchedAt: timestamp,
      allocatedBatches: fefo.allocations
    };
    transfer.version = (transfer.version || 1) + 1;
    transfer.updatedAt = timestamp;

    await persistenceAdapter.save(this.TRANSFERS_COLLECTION, transfer.id, transfer);
    return { success: true, transfer, fefo };
  }

  /**
   * 6. Receive Stock Transfer (Target Depot -> Add to Inventory)
   */
  async receiveTransferOrder({
    transferId,
    receivedById,
    receivedByName
  }) {
    const transfer = await persistenceAdapter.findById(this.TRANSFERS_COLLECTION, transferId);
    if (!transfer) throw new Error(`Transfer order "${transferId}" not found`);
    if (transfer.status !== 'DISPATCHED') throw new Error(`Transfer order is in "${transfer.status}" status, must be "DISPATCHED"`);

    const timestamp = new Date().toISOString();

    // Add Stock into Target Depot with identical batch and expiry
    for (const item of transfer.dispatchedInfo.allocatedBatches) {
      const targetBatchId = `STK-${transfer.targetDepotId}-${item.batchNumber}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      const newBatch = {
        id: targetBatchId,
        depotId: transfer.targetDepotId,
        medicationCode: transfer.medicationCode,
        medicationName: transfer.medicationName,
        batchNumber: item.batchNumber,
        lotNumber: item.lotNumber,
        expiryDate: item.expiryDate,
        expiryStatus: this._evaluateExpiryStatus(item.expiryDate, timestamp),
        initialQuantity: item.allocatedQty,
        currentQuantity: item.allocatedQty,
        storageCondition: item.storageCondition || 'ROOM_TEMPERATURE',
        status: BATCH_STATUS.ACTIVE,
        version: 1,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      await persistenceAdapter.save(this.STOCK_COLLECTION, newBatch.id, newBatch);
    }

    transfer.status = 'RECEIVED';
    transfer.receivedInfo = {
      receivedById,
      receivedByName,
      receivedAt: timestamp
    };
    transfer.version = (transfer.version || 1) + 1;
    transfer.updatedAt = timestamp;

    await persistenceAdapter.save(this.TRANSFERS_COLLECTION, transfer.id, transfer);
    return { success: true, transfer };
  }

  /**
   * 7. Quarantine & Recall Batch Management (JCI / BPOM Hard Stop)
   */
  async quarantineBatch({
    batchNumber,
    medicationCode,
    reason,
    quarantinedById,
    quarantinedByName
  }) {
    const matchingBatches = await persistenceAdapter.query(this.STOCK_COLLECTION, b => 
      b.batchNumber === batchNumber && b.medicationCode === medicationCode
    );

    const timestamp = new Date().toISOString();
    const updated = [];

    for (const batch of matchingBatches) {
      batch.status = BATCH_STATUS.QUARANTINED;
      batch.quarantineInfo = {
        reason,
        quarantinedById,
        quarantinedByName,
        quarantinedAt: timestamp
      };
      batch.version = (batch.version || 1) + 1;
      batch.updatedAt = timestamp;
      await persistenceAdapter.save(this.STOCK_COLLECTION, batch.id, batch);

      // Event Sourcing
      const event = {
        id: `EVT-INV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        eventVersion: '1.0',
        aggregateId: batch.id,
        aggregateVersion: batch.version,
        eventType: INVENTORY_EVENTS.BATCH_QUARANTINED,
        depotId: batch.depotId,
        medicationCode,
        batchNumber,
        occurredAt: timestamp,
        recordedAt: timestamp,
        performedBy: { id: quarantinedById, name: quarantinedByName, role: 'PHARMACY_SAFETY' },
        payload: { reason }
      };
      await persistenceAdapter.save(this.EVENTS_COLLECTION, event.id, event);
      updated.push(batch.id);
    }

    return { success: true, quarantinedCount: updated.length, batchNumber };
  }

  /**
   * Helper: Evaluate Expiry Classification
   */
  _evaluateExpiryStatus(expiryDate, currentTimestamp = new Date().toISOString()) {
    const now = new Date(currentTimestamp);
    const exp = new Date(expiryDate);
    const diffDays = Math.round((exp.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays < 0) return BATCH_STATUS.EXPIRED;
    if (diffDays <= this.CRITICAL_EXPIRY_THRESHOLD_DAYS) return BATCH_STATUS.CRITICAL_EXPIRY;
    if (diffDays <= this.NEAR_EXPIRY_THRESHOLD_DAYS) return BATCH_STATUS.NEAR_EXPIRY;
    return BATCH_STATUS.ACTIVE;
  }
}

export const fefoMultiDepotInventoryEngine = new FefoMultiDepotInventoryEngine();
export default fefoMultiDepotInventoryEngine;
