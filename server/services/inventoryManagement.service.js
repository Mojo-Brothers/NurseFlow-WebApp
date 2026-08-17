/**
 * NurseFlow Enterprise HIS 2026 — Pharmacy Multi-Warehouse & FEFO Inventory Engine (Hardened v2)
 * Standar: CDOB (Good Distribution Practice), JCI MMU & Kemenkes KFA
 * Features: Atomic Stock Decrement, Strict FEFO Expiry Filtering, Optimistic Concurrency & Idempotency
 */

class InventoryManagementService {
  constructor() {
    this.batches = new Map(); // BatchId -> Batch Entity
    this.movements = []; // Immutable Stock Movement Ledger
    this.processedIdempotencyKeys = new Map(); // IdempotencyKey -> Previous Result
  }

  /**
   * 1. Receive Stock Batch from Supplier / Purchase Order
   */
  receiveStock({
    tenantId = '00000000-0000-0000-0000-000000000001',
    warehouseId = 'WH-MAIN-PHARMACY',
    itemCode,
    itemName,
    batchNumber,
    expiryDate,
    quantity,
    unitCost = 0,
    performedBy = 'Apt. Siti, S.Farm'
  }) {
    if (quantity <= 0) {
      throw new Error('RECEIVE_STOCK_ERROR: Quantity received must be greater than zero.');
    }

    const batchId = `BATCH-${warehouseId}-${itemCode}-${batchNumber}`;
    let batch = this.batches.get(batchId);

    if (!batch) {
      batch = {
        id: batchId,
        tenantId,
        warehouseId,
        itemCode,
        itemName,
        batchNumber,
        expiryDate,
        initialQuantity: quantity,
        availableQuantity: quantity,
        unitCost,
        version: 1,
        createdAt: new Date().toISOString()
      };
      this.batches.set(batchId, batch);
    } else {
      batch.availableQuantity += quantity;
      batch.initialQuantity += quantity;
      batch.version += 1;
    }

    // Append to Immutable Stock Movement Ledger
    const movement = {
      id: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      warehouseId,
      itemCode,
      batchId,
      movementType: 'PURCHASE_RECEIPT',
      quantityDelta: quantity,
      balanceBefore: batch.availableQuantity - quantity,
      balanceAfter: batch.availableQuantity,
      unitCost,
      performedBy,
      createdAt: new Date().toISOString()
    };
    this.movements.push(movement);

    return {
      success: true,
      batch,
      movement,
      totalWarehouseStock: this.getStockLevel(warehouseId, itemCode, tenantId)
    };
  }

  /**
   * 2. Transaction-Safe FEFO Dispensing with Anti-Negative Stock & Idempotency
   */
  dispenseStockFefo({
    tenantId = '00000000-0000-0000-0000-000000000001',
    warehouseId = 'WH-MAIN-PHARMACY',
    itemCode,
    quantityNeeded,
    idempotencyKey = null,
    performedBy = 'Apt. Siti, S.Farm',
    currentDate = new Date()
  }) {
    // Idempotency Check: Return previous result if already executed
    if (idempotencyKey && this.processedIdempotencyKeys.has(idempotencyKey)) {
      return {
        ...this.processedIdempotencyKeys.get(idempotencyKey),
        isIdempotentReplay: true
      };
    }

    if (quantityNeeded <= 0) {
      throw new Error('DISPENSE_ERROR: Quantity needed must be greater than zero.');
    }

    // Step A: Find all unexpired batches in warehouse sorted strictly by FEFO (expiry_date ASC, id ASC)
    const validBatches = Array.from(this.batches.values())
      .filter(b => 
        b.tenantId === tenantId &&
        b.warehouseId === warehouseId &&
        b.itemCode === itemCode &&
        b.availableQuantity > 0 &&
        new Date(b.expiryDate) > currentDate // STRICT EXPIRED BATCH EXCLUSION
      )
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate) || a.id.localeCompare(b.id));

    const totalAvailable = validBatches.reduce((sum, b) => sum + b.availableQuantity, 0);
    if (totalAvailable < quantityNeeded) {
      throw new Error(`INSUFFICIENT_STOCK: Stok obat ${itemCode} di ${warehouseId} tidak mencukupi! Tersedia (tidak kadaluwarsa): ${totalAvailable}, Dibutuhkan: ${quantityNeeded}`);
    }

    // Step B: Atomic Execution Plan (Simulating PostgreSQL Transaction & FOR UPDATE locks)
    let remainingToDeduct = quantityNeeded;
    const allocatedBatches = [];
    const createdMovements = [];
    const originalBatchSnapshots = new Map();

    try {
      for (const batch of validBatches) {
        if (remainingToDeduct <= 0) break;

        // Take snapshot for rollback safety
        originalBatchSnapshots.set(batch.id, {
          availableQuantity: batch.availableQuantity,
          version: batch.version
        });

        const deductAmount = Math.min(batch.availableQuantity, remainingToDeduct);
        
        // Database Check Constraint Barrier Simulation
        if (batch.availableQuantity - deductAmount < 0) {
          throw new Error('CHECK_VIOLATION: available_quantity cannot be negative.');
        }

        // Apply atomic decrement & version increment
        const balanceBefore = batch.availableQuantity;
        batch.availableQuantity -= deductAmount;
        batch.version += 1;
        remainingToDeduct -= deductAmount;

        allocatedBatches.push({
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          quantityDeducted: deductAmount
        });

        // Generate Ledger Movement
        const movement = {
          id: `MOV-DISP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          tenantId,
          warehouseId,
          itemCode,
          batchId: batch.id,
          movementType: 'PRESCRIPTION_DISPENSE',
          quantityDelta: -deductAmount,
          balanceBefore,
          balanceAfter: batch.availableQuantity,
          performedBy,
          createdAt: new Date().toISOString()
        };
        createdMovements.push(movement);
      }

      // Commit Movements to Ledger
      this.movements.push(...createdMovements);

      const result = {
        success: true,
        tenantId,
        warehouseId,
        itemCode,
        quantityDeducted: quantityNeeded,
        allocatedBatches,
        remainingStock: this.getStockLevel(warehouseId, itemCode, tenantId)
      };

      if (idempotencyKey) {
        this.processedIdempotencyKeys.set(idempotencyKey, result);
      }

      return result;
    } catch (err) {
      // Transaction Rollback
      for (const [batchId, snapshot] of originalBatchSnapshots.entries()) {
        const batch = this.batches.get(batchId);
        if (batch) {
          batch.availableQuantity = snapshot.availableQuantity;
          batch.version = snapshot.version;
        }
      }
      throw err;
    }
  }

  /**
   * 3. Stock Level Aggregation
   */
  getStockLevel(warehouseId, itemCode, tenantId = '00000000-0000-0000-0000-000000000001') {
    return Array.from(this.batches.values())
      .filter(b => b.tenantId === tenantId && b.warehouseId === warehouseId && b.itemCode === itemCode)
      .reduce((sum, b) => sum + b.availableQuantity, 0);
  }

  /**
   * 4. Audit Reconciliation: Verify Batch Balance Matches Sum of Ledger Movements
   */
  reconcileBatchLedger(batchId) {
    const batch = this.batches.get(batchId);
    if (!batch) throw new Error(`Batch ${batchId} not found.`);

    const ledgerSum = this.movements
      .filter(m => m.batchId === batchId)
      .reduce((sum, m) => sum + m.quantityDelta, 0);

    const isBalanced = batch.availableQuantity === ledgerSum;
    return {
      batchId,
      currentAvailableQuantity: batch.availableQuantity,
      ledgerCalculatedBalance: ledgerSum,
      isBalanced
    };
  }
}

export const inventoryManagementService = new InventoryManagementService();
