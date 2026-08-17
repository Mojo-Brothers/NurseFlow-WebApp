/**
 * NurseFlow Enterprise HIS 2026 — Pharmacy Procurement & Warehouse Inventory Engine
 * Standar: Good Distribution Practice (CDOB) & FEFO (First-Expired, First-Out) Inventory
 */

class InventoryManagementService {
  constructor() {
    this.stockLedger = new Map(); // StockKey -> Batch List
  }

  /**
   * 1. Receive Stock from Supplier (Penerimaan Barang)
   */
  receiveStock({
    warehouseId = 'WH-MAIN-PHARMACY',
    itemCode,
    itemName,
    batchNumber,
    expiryDate,
    quantity,
    unitCost
  }) {
    const key = `${warehouseId}_${itemCode}`;
    if (!this.stockLedger.has(key)) {
      this.stockLedger.set(key, []);
    }

    const batch = {
      batchId: `BATCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      warehouseId,
      itemCode,
      itemName,
      batchNumber,
      expiryDate,
      quantity,
      unitCost,
      receivedAt: new Date().toISOString()
    };

    const batches = this.stockLedger.get(key);
    batches.push(batch);

    // Sort by FEFO (First-Expired, First-Out)
    batches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    return {
      success: true,
      batch,
      totalWarehouseStock: batches.reduce((sum, b) => sum + b.quantity, 0)
    };
  }

  /**
   * 2. Deduct Stock using Strict FEFO (Pengeluaran Resep)
   */
  dispenseStockFefo({ warehouseId = 'WH-MAIN-PHARMACY', itemCode, quantityNeeded }) {
    const key = `${warehouseId}_${itemCode}`;
    const batches = this.stockLedger.get(key) || [];
    const totalAvailable = batches.reduce((sum, b) => sum + b.quantity, 0);

    if (totalAvailable < quantityNeeded) {
      throw new Error(`Stok obat ${itemCode} di ${warehouseId} tidak mencukupi! Tersedia: ${totalAvailable}, Dibutuhkan: ${quantityNeeded}`);
    }

    let remainingToDeduct = quantityNeeded;
    const allocatedBatches = [];

    for (const batch of batches) {
      if (remainingToDeduct <= 0) break;

      const deductAmount = Math.min(batch.quantity, remainingToDeduct);
      batch.quantity -= deductAmount;
      remainingToDeduct -= deductAmount;

      allocatedBatches.push({
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        quantityDeducted: deductAmount
      });
    }

    // Remove empty batches
    this.stockLedger.set(key, batches.filter(b => b.quantity > 0));

    return {
      success: true,
      itemCode,
      quantityDeducted: quantityNeeded,
      allocatedBatches,
      remainingStock: totalAvailable - quantityNeeded
    };
  }

  getStockLevel(warehouseId, itemCode) {
    const key = `${warehouseId}_${itemCode}`;
    const batches = this.stockLedger.get(key) || [];
    return batches.reduce((sum, b) => sum + b.quantity, 0);
  }
}

export const inventoryManagementService = new InventoryManagementService();
