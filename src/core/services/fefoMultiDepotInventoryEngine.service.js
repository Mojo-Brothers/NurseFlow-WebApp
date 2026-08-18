/**
 * ============================================================================
 * SPRINT 3D: ENTERPRISE MULTI-DEPOT FEFO, RECALL TRACEABILITY & PHARMACY LOGISTICS
 * 
 * Clinical Logistics Operating System Modules:
 * 1. Isolated Append-Only Inventory Event Store (inventory_events)
 * 2. Multi-Depot Hierarchy (Warehouse -> Central -> Satellites -> Ward Floor Stock)
 * 3. Strict FEFO (First-Expired, First-Out) Algorithm
 * 4. BPOM Batch Recall & Patient Traceability Engine (Zero-Latency Patient Impact Manifest)
 * 5. Hospital Waste & Destruction Management (Broken, Spillage, Partial Vial, Contaminated)
 * 6. Patient/Ward Return-to-Pharmacy Workflow (Return -> Verify -> Restock/Waste)
 * 7. Cold Chain Excursion FSM (NORMAL -> EXCURSION -> QUARANTINE -> INVESTIGATION -> RELEASE/DESTROY)
 * 8. Controlled Substance (Narkotika/Psikotropika) Ledger & SIPNAP Reporting
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
  DEPLETED: 'DEPLETED',
  WASTED: 'WASTED'
};

export const INVENTORY_EVENT_TYPES = {
  RECEIVED: 'RECEIVED',
  TRANSFER_REQUESTED: 'TRANSFER_REQUESTED',
  TRANSFER_APPROVED: 'TRANSFER_APPROVED',
  TRANSFER_DISPATCHED: 'TRANSFER_DISPATCHED',
  TRANSFER_RECEIVED: 'TRANSFER_RECEIVED',
  DISPENSED: 'DISPENSED',
  RETURNED: 'RETURNED',
  RESTOCKED: 'RESTOCKED',
  WASTED: 'WASTED',
  QUARANTINED: 'QUARANTINED',
  RECALLED: 'RECALLED',
  EXPIRED: 'EXPIRED',
  STOCK_OPNAME_ADJUSTED: 'STOCK_OPNAME_ADJUSTED',
  STOCK_DESTRUCTION: 'STOCK_DESTRUCTION',
  TEMPERATURE_EXCURSION: 'TEMPERATURE_EXCURSION'
};

export const WASTE_REASONS = {
  BROKEN: 'BROKEN',
  SPILLAGE: 'SPILLAGE',
  EXPIRED: 'EXPIRED',
  DAMAGED: 'DAMAGED',
  PARTIAL_VIAL: 'PARTIAL_VIAL',
  CONTAMINATED: 'CONTAMINATED'
};

export const COLD_CHAIN_STATES = {
  NORMAL: 'NORMAL',
  EXCURSION_DETECTED: 'EXCURSION_DETECTED',
  QUARANTINED: 'QUARANTINED',
  UNDER_INVESTIGATION: 'UNDER_INVESTIGATION',
  RELEASED: 'RELEASED',
  DESTROYED: 'DESTROYED'
};

export const CONTROLLED_SUBSTANCE_TYPES = {
  NARCOTIC_CLASS_2: 'NARCOTIC_CLASS_2',
  NARCOTIC_CLASS_3: 'NARCOTIC_CLASS_3',
  PSYCHOTROPIC: 'PSYCHOTROPIC',
  PRECURSOR: 'PRECURSOR'
};

class FefoMultiDepotInventoryEngine {
  constructor() {
    this.STOCK_COLLECTION = 'inventory_stock_batches';
    this.TRANSFERS_COLLECTION = 'inventory_transfer_orders';
    this.RETURNS_COLLECTION = 'inventory_returns';
    this.EXCURSIONS_COLLECTION = 'inventory_cold_chain_excursions';
    this.CONTROLLED_LEDGER_COLLECTION = 'controlled_substance_ledger_events';
    this.EVENTS_COLLECTION = 'inventory_events';
    this.NEAR_EXPIRY_THRESHOLD_DAYS = 90;
    this.CRITICAL_EXPIRY_THRESHOLD_DAYS = 30;
  }

  // --------------------------------------------------------------------------
  // 1. INBOUND GOODS RECEIPT & FEFO ALLOCATION
  // --------------------------------------------------------------------------

  async registerStockBatch({
    depotId,
    depotType = DEPOT_TYPES.CENTRAL_WAREHOUSE,
    medicationCode,
    medicationName,
    batchNumber,
    lotNumber = null,
    expiryDate,
    quantity,
    unitPrice = 0,
    storageCondition = 'ROOM_TEMPERATURE',
    targetTempMin = 15,
    targetTempMax = 25,
    isControlledSubstance = false,
    controlledCategory = null,
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
      isControlledSubstance,
      controlledCategory,
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

    // Append-Only Inventory Event Ledger
    const event = {
      id: `EVT-INV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      eventVersion: '1.0',
      aggregateId: stockBatch.id,
      aggregateVersion: 1,
      correlationId: correlationId || `CORR-INV-${Date.now()}`,
      commandId,
      eventType: INVENTORY_EVENT_TYPES.RECEIVED,
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
        unitPrice,
        isControlledSubstance
      }
    };
    await persistenceAdapter.save(this.EVENTS_COLLECTION, event.id, event);

    return { success: true, stockBatch, event };
  }

  async allocateFefoStock({
    depotId,
    medicationCode,
    requestedQty,
    currentTimestamp = new Date().toISOString()
  }) {
    const allBatches = await persistenceAdapter.query(this.STOCK_COLLECTION, b => 
      b.depotId === depotId && 
      b.medicationCode === medicationCode &&
      b.currentQuantity > 0
    );

    const validBatches = allBatches.filter(b => {
      const isExpired = new Date(b.expiryDate).getTime() < new Date(currentTimestamp).getTime();
      const isQuarantined = b.status === BATCH_STATUS.QUARANTINED || b.status === BATCH_STATUS.RECALLED;
      return !isExpired && !isQuarantined;
    });

    if (validBatches.length === 0) {
      throw new Error(`[NO_VALID_FEFO_BATCH] No non-expired, active FEFO stock available for medication "${medicationCode}" in depot "${depotId}"`);
    }

    validBatches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    const totalAvailable = validBatches.reduce((sum, b) => sum + (b.currentQuantity - (b.reservedQuantity || 0)), 0);
    if (totalAvailable < requestedQty) {
      throw new Error(`[INSUFFICIENT_STOCK] Insufficient stock for "${medicationCode}" in depot "${depotId}". Requested: ${requestedQty}, Available: ${totalAvailable}`);
    }

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

  // --------------------------------------------------------------------------
  // 2. BPOM RECALL & PATIENT TRACEABILITY ENGINE
  // --------------------------------------------------------------------------

  async executeBpomRecall({
    batchNumber,
    medicationCode,
    recallReason,
    authority = 'BPOM_RI',
    initiatedById,
    initiatedByName,
    commandId = null,
    correlationId = null
  }) {
    const timestamp = new Date().toISOString();

    // 1. Freeze & Recall all remaining inventory across ALL depots
    const matchingBatches = await persistenceAdapter.query(this.STOCK_COLLECTION, b => 
      b.batchNumber === batchNumber && b.medicationCode === medicationCode
    );

    let frozenUnitsTotal = 0;
    const affectedDepotIds = [];

    for (const batch of matchingBatches) {
      batch.status = BATCH_STATUS.RECALLED;
      batch.recallInfo = {
        authority,
        recallReason,
        initiatedById,
        initiatedByName,
        recalledAt: timestamp
      };
      batch.version = (batch.version || 1) + 1;
      batch.updatedAt = timestamp;
      frozenUnitsTotal += batch.currentQuantity;
      if (!affectedDepotIds.includes(batch.depotId)) affectedDepotIds.push(batch.depotId);

      await persistenceAdapter.save(this.STOCK_COLLECTION, batch.id, batch);

      // Append Event
      const recallEvent = {
        id: `EVT-INV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        eventVersion: '1.0',
        aggregateId: batch.id,
        aggregateVersion: batch.version,
        correlationId: correlationId || `CORR-RECALL-${batchNumber}`,
        commandId,
        eventType: INVENTORY_EVENT_TYPES.RECALLED,
        depotId: batch.depotId,
        medicationCode,
        batchNumber,
        quantityDelta: 0,
        occurredAt: timestamp,
        recordedAt: timestamp,
        performedBy: { id: initiatedById, name: initiatedByName, role: 'CHIEF_PHARMACIST' },
        payload: { authority, recallReason, frozenQuantity: batch.currentQuantity }
      };
      await persistenceAdapter.save(this.EVENTS_COLLECTION, recallEvent.id, recallEvent);
    }

    // 2. Query Medication Event Store to find EVERY patient who received this batch
    const allMedEvents = await persistenceAdapter.query('medication_events', evt => 
      evt.eventType === 'ADMINISTER_DOSE' || evt.eventType === 'MEDICATION_ADMINISTERED'
    );

    const affectedPatientsMap = new Map();

    for (const mEvt of allMedEvents) {
      // Check if event or order used this batchNumber
      const eventBatch = mEvt.payload?.batchNumber || mEvt.payload?.scannedMedicationData?.batchNumber;
      
      // Cross check order dispense info
      let orderMatch = false;
      let orderObj = null;
      if (mEvt.aggregateId || mEvt.medicationOrderId) {
        orderObj = await persistenceAdapter.findById('medication_orders', mEvt.aggregateId || mEvt.medicationOrderId);
        if (orderObj && orderObj.dispenseInfo?.batchNumber === batchNumber) {
          orderMatch = true;
        }
      }

      if (eventBatch === batchNumber || orderMatch) {
        const patientId = mEvt.patientId || mEvt.payload?.patientId || orderObj?.patientId;
        const patientName = mEvt.payload?.patientName || orderObj?.patientName || 'Pasien Teridentifikasi';
        const mrn = mEvt.payload?.mrn || orderObj?.mrn || 'MRN-TERDAMPAK';

        if (!affectedPatientsMap.has(patientId)) {
          affectedPatientsMap.set(patientId, {
            patientId,
            patientName,
            mrn,
            encounterId: mEvt.encounterId || orderObj?.encounterId,
            medicationCode,
            batchNumber,
            administrations: []
          });
        }

        affectedPatientsMap.get(patientId).administrations.push({
          eventId: mEvt.id,
          administeredAt: mEvt.occurredAt,
          administeredBy: mEvt.performedBy,
          dose: mEvt.payload?.actualDose || mEvt.payload?.dose || orderObj?.dose,
          route: mEvt.payload?.actualRoute || mEvt.payload?.route || orderObj?.route
        });
      }
    }

    const affectedPatients = Array.from(affectedPatientsMap.values());

    const recallManifest = {
      recallId: `RCL-${batchNumber}-${Date.now()}`,
      authority,
      batchNumber,
      medicationCode,
      reason: recallReason,
      recalledAt: timestamp,
      initiatedBy: { id: initiatedById, name: initiatedByName },
      inventorySummary: {
        totalDepotsAffected: affectedDepotIds.length,
        depotIds: affectedDepotIds,
        totalUnitsFrozen: frozenUnitsTotal
      },
      clinicalImpact: {
        totalPatientsAffected: affectedPatients.length,
        affectedPatients
      }
    };

    return { success: true, recallManifest };
  }

  // --------------------------------------------------------------------------
  // 3. WASTE & DESTRUCTION MANAGEMENT
  // --------------------------------------------------------------------------

  async recordMedicationWaste({
    depotId,
    medicationCode,
    batchNumber,
    wastedQty,
    reason,
    dualWitnessId = null,
    dualWitnessName = null,
    recordedById,
    recordedByName,
    notes = '',
    commandId = null,
    correlationId = null
  }) {
    if (!Object.values(WASTE_REASONS).includes(reason)) {
      throw new Error(`[INVALID_WASTE_REASON] Reason "${reason}" is not a valid hospital waste category`);
    }

    const batches = await persistenceAdapter.query(this.STOCK_COLLECTION, b => 
      b.depotId === depotId && b.batchNumber === batchNumber && b.medicationCode === medicationCode
    );

    if (batches.length === 0) {
      throw new Error(`Stock batch "${batchNumber}" for "${medicationCode}" not found in depot "${depotId}"`);
    }

    const batch = batches[0];
    if (batch.currentQuantity < wastedQty) {
      throw new Error(`[INSUFFICIENT_STOCK] Cannot waste ${wastedQty} units. Current stock is only ${batch.currentQuantity}`);
    }

    const timestamp = new Date().toISOString();
    batch.currentQuantity -= wastedQty;
    if (batch.currentQuantity === 0) batch.status = BATCH_STATUS.DEPLETED;
    batch.version = (batch.version || 1) + 1;
    batch.updatedAt = timestamp;

    await persistenceAdapter.save(this.STOCK_COLLECTION, batch.id, batch);

    // Append WASTED Event
    const event = {
      id: `EVT-INV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      eventVersion: '1.0',
      aggregateId: batch.id,
      aggregateVersion: batch.version,
      correlationId: correlationId || `CORR-WASTE-${Date.now()}`,
      commandId,
      eventType: INVENTORY_EVENT_TYPES.WASTED,
      depotId,
      medicationCode,
      batchNumber,
      quantityDelta: -wastedQty,
      occurredAt: timestamp,
      recordedAt: timestamp,
      performedBy: { id: recordedById, name: recordedByName, role: 'PHARMACIST' },
      payload: {
        reason,
        dualWitness: dualWitnessId ? { id: dualWitnessId, name: dualWitnessName } : null,
        remainingStock: batch.currentQuantity,
        notes
      }
    };
    await persistenceAdapter.save(this.EVENTS_COLLECTION, event.id, event);

    return { success: true, batch, wasteEvent: event };
  }

  // --------------------------------------------------------------------------
  // 4. RETURN-TO-PHARMACY WORKFLOW
  // --------------------------------------------------------------------------

  async requestMedicationReturn({
    encounterId,
    patientId,
    patientName,
    mrn,
    fromLocation,
    targetDepotId,
    medicationCode,
    medicationName,
    batchNumber,
    returnedQty,
    returnReason,
    requestedById,
    requestedByName
  }) {
    const returnId = `RET-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const returnRecord = {
      id: returnId,
      returnNumber: `RET-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      encounterId,
      patientId,
      patientName,
      mrn,
      fromLocation,
      targetDepotId,
      medicationCode,
      medicationName,
      batchNumber,
      returnedQty,
      returnReason,
      status: 'RETURN_REQUESTED',
      requestedBy: { id: requestedById, name: requestedByName, requestedAt: timestamp },
      verifiedInfo: null,
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await persistenceAdapter.save(this.RETURNS_COLLECTION, returnRecord.id, returnRecord);
    return { success: true, returnRecord };
  }

  async verifyAndProcessReturn({
    returnId,
    action, // 'RESTOCK' | 'WASTE'
    restockExpiryDate = null,
    wasteReason = null,
    processedById,
    processedByName
  }) {
    const returnRecord = await persistenceAdapter.findById(this.RETURNS_COLLECTION, returnId);
    if (!returnRecord) throw new Error(`Return record "${returnId}" not found`);

    const timestamp = new Date().toISOString();

    if (action === 'RESTOCK') {
      // Add Stock into Target Depot
      const targetBatchId = `STK-${returnRecord.targetDepotId}-${returnRecord.batchNumber}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const newStock = {
        id: targetBatchId,
        depotId: returnRecord.targetDepotId,
        medicationCode: returnRecord.medicationCode,
        medicationName: returnRecord.medicationName,
        batchNumber: returnRecord.batchNumber,
        lotNumber: returnRecord.batchNumber,
        expiryDate: restockExpiryDate || '2028-12-31',
        initialQuantity: returnRecord.returnedQty,
        currentQuantity: returnRecord.returnedQty,
        status: BATCH_STATUS.ACTIVE,
        version: 1,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await persistenceAdapter.save(this.STOCK_COLLECTION, newStock.id, newStock);

      // Append RESTOCKED Event
      const event = {
        id: `EVT-INV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        eventVersion: '1.0',
        aggregateId: newStock.id,
        aggregateVersion: 1,
        correlationId: `CORR-RET-${returnId}`,
        eventType: INVENTORY_EVENT_TYPES.RESTOCKED,
        depotId: returnRecord.targetDepotId,
        medicationCode: returnRecord.medicationCode,
        batchNumber: returnRecord.batchNumber,
        quantityDelta: returnRecord.returnedQty,
        occurredAt: timestamp,
        recordedAt: timestamp,
        performedBy: { id: processedById, name: processedByName, role: 'PHARMACIST' },
        payload: { returnId, returnNumber: returnRecord.returnNumber }
      };
      await persistenceAdapter.save(this.EVENTS_COLLECTION, event.id, event);

      returnRecord.status = 'RETURN_ACCEPTED';
    } else {
      returnRecord.status = 'RETURN_WASTED';
      await this.recordMedicationWaste({
        depotId: returnRecord.targetDepotId,
        medicationCode: returnRecord.medicationCode,
        batchNumber: returnRecord.batchNumber,
        wastedQty: returnRecord.returnedQty,
        reason: wasteReason || WASTE_REASONS.UNSEALED || WASTE_REASONS.CONTAMINATED,
        recordedById: processedById,
        recordedByName: processedByName,
        notes: `Wasted during return inspection: ${returnRecord.returnNumber}`
      });
    }

    returnRecord.verifiedInfo = {
      action,
      processedById,
      processedByName,
      processedAt: timestamp
    };
    returnRecord.version = (returnRecord.version || 1) + 1;
    returnRecord.updatedAt = timestamp;

    await persistenceAdapter.save(this.RETURNS_COLLECTION, returnRecord.id, returnRecord);
    return { success: true, returnRecord };
  }

  // --------------------------------------------------------------------------
  // 5. COLD CHAIN EXCURSION FSM
  // --------------------------------------------------------------------------

  async recordTemperatureReading({
    depotId,
    storageUnitId,
    recordedTemp,
    minTarget = 2.0,
    maxTarget = 8.0,
    recordedById = 'IOT_SENSOR',
    recordedByName = 'IoT Cold Chain Telemetry'
  }) {
    const timestamp = new Date().toISOString();
    const isExcursion = recordedTemp < minTarget || recordedTemp > maxTarget;

    if (!isExcursion) {
      return { success: true, status: COLD_CHAIN_STATES.NORMAL, recordedTemp };
    }

    // Excursion detected! Auto-Quarantine batches stored in this depot under COLD_CHAIN_2_8C
    const excursionId = `EXC-${storageUnitId}-${Date.now()}`;
    const coldBatches = await persistenceAdapter.query(this.STOCK_COLLECTION, b => 
      b.depotId === depotId && b.storageCondition === 'COLD_CHAIN_2_8C' && b.status === BATCH_STATUS.ACTIVE
    );

    const quarantinedBatchIds = [];
    for (const batch of coldBatches) {
      batch.status = BATCH_STATUS.QUARANTINED;
      batch.quarantineInfo = {
        reason: `Auto-Quarantined due to Cold Chain Excursion (${recordedTemp}°C vs target ${minTarget}-${maxTarget}°C)`,
        excursionId,
        quarantinedAt: timestamp
      };
      batch.version = (batch.version || 1) + 1;
      batch.updatedAt = timestamp;
      await persistenceAdapter.save(this.STOCK_COLLECTION, batch.id, batch);
      quarantinedBatchIds.push(batch.id);
    }

    const excursionRecord = {
      id: excursionId,
      depotId,
      storageUnitId,
      recordedTemp,
      minTarget,
      maxTarget,
      status: COLD_CHAIN_STATES.EXCURSION_DETECTED,
      quarantinedBatchIds,
      occurredAt: timestamp,
      investigationInfo: null
    };

    await persistenceAdapter.save(this.EXCURSIONS_COLLECTION, excursionRecord.id, excursionRecord);

    // Event Sourcing
    const event = {
      id: `EVT-INV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      eventVersion: '1.0',
      aggregateId: excursionId,
      aggregateVersion: 1,
      eventType: INVENTORY_EVENT_TYPES.TEMPERATURE_EXCURSION,
      depotId,
      occurredAt: timestamp,
      recordedAt: timestamp,
      performedBy: { id: recordedById, name: recordedByName, role: 'IOT_MONITOR' },
      payload: { storageUnitId, recordedTemp, minTarget, maxTarget, quarantinedBatchCount: quarantinedBatchIds.length }
    };
    await persistenceAdapter.save(this.EVENTS_COLLECTION, event.id, event);

    return { success: true, status: COLD_CHAIN_STATES.EXCURSION_DETECTED, excursionRecord };
  }

  async resolveColdChainExcursion({
    excursionId,
    decision, // 'RELEASE' | 'DESTROY'
    findings,
    manufacturerConsulted = true,
    resolvedById,
    resolvedByName
  }) {
    const excursion = await persistenceAdapter.findById(this.EXCURSIONS_COLLECTION, excursionId);
    if (!excursion) throw new Error(`Excursion record "${excursionId}" not found`);

    const timestamp = new Date().toISOString();

    for (const batchId of excursion.quarantinedBatchIds) {
      const batch = await persistenceAdapter.findById(this.STOCK_COLLECTION, batchId);
      if (batch) {
        if (decision === 'RELEASE') {
          batch.status = BATCH_STATUS.ACTIVE;
          batch.quarantineInfo = null;
        } else {
          batch.status = BATCH_STATUS.WASTED;
          batch.currentQuantity = 0;
        }
        batch.version = (batch.version || 1) + 1;
        batch.updatedAt = timestamp;
        await persistenceAdapter.save(this.STOCK_COLLECTION, batch.id, batch);
      }
    }

    excursion.status = decision === 'RELEASE' ? COLD_CHAIN_STATES.RELEASED : COLD_CHAIN_STATES.DESTROYED;
    excursion.investigationInfo = {
      decision,
      findings,
      manufacturerConsulted,
      resolvedById,
      resolvedByName,
      resolvedAt: timestamp
    };

    await persistenceAdapter.save(this.EXCURSIONS_COLLECTION, excursion.id, excursion);
    return { success: true, excursion };
  }

  // --------------------------------------------------------------------------
  // 6. CONTROLLED SUBSTANCE (NARKOTIKA/PSIKOTROPIKA) LEDGER (SIPNAP)
  // --------------------------------------------------------------------------

  async recordControlledSubstanceTransaction({
    transactionType, // 'RECEIVED' | 'DISPENSED' | 'ADMINISTERED' | 'RETURNED' | 'DESTROYED'
    depotId,
    medicationCode,
    medicationName,
    batchNumber,
    quantityDelta,
    balanceBefore,
    balanceAfter,
    prescriberSip = null,
    patientMrn = null,
    pharmacistSik,
    witnessCoSigner = null,
    notes = '',
    commandId = null,
    correlationId = null
  }) {
    // Mathematical Invariant Verification
    const calculatedAfter = balanceBefore + quantityDelta;
    if (calculatedAfter !== balanceAfter) {
      throw new Error(`[LEDGER_MATH_VIOLATION] Balance before (${balanceBefore}) + delta (${quantityDelta}) does not equal balance after (${balanceAfter})`);
    }

    const timestamp = new Date().toISOString();
    const ledgerEntry = {
      id: `CSL-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      eventVersion: '1.0',
      transactionType,
      depotId,
      medicationCode,
      medicationName,
      batchNumber,
      quantityDelta,
      balanceBefore,
      balanceAfter,
      compliance: {
        prescriberSip,
        patientMrn,
        pharmacistSik,
        witnessCoSigner
      },
      notes,
      occurredAt: timestamp,
      recordedAt: timestamp
    };

    await persistenceAdapter.save(this.CONTROLLED_LEDGER_COLLECTION, ledgerEntry.id, ledgerEntry);
    return { success: true, ledgerEntry };
  }

  // --------------------------------------------------------------------------
  // 7. STOCK TRANSFER WORKFLOW
  // --------------------------------------------------------------------------

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

  async dispatchTransferOrder({
    transferId,
    dispatchedById,
    dispatchedByName
  }) {
    const transfer = await persistenceAdapter.findById(this.TRANSFERS_COLLECTION, transferId);
    if (!transfer) throw new Error(`Transfer order "${transferId}" not found`);

    const fefo = await this.allocateFefoStock({
      depotId: transfer.sourceDepotId,
      medicationCode: transfer.medicationCode,
      requestedQty: transfer.requestedQty
    });

    const timestamp = new Date().toISOString();

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

  async receiveTransferOrder({
    transferId,
    receivedById,
    receivedByName
  }) {
    const transfer = await persistenceAdapter.findById(this.TRANSFERS_COLLECTION, transferId);
    if (!transfer) throw new Error(`Transfer order "${transferId}" not found`);
    if (transfer.status !== 'DISPATCHED') throw new Error(`Transfer order is in "${transfer.status}" status, must be "DISPATCHED"`);

    const timestamp = new Date().toISOString();

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

  // --------------------------------------------------------------------------
  // Helper: Evaluate Expiry Classification
  // --------------------------------------------------------------------------
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
