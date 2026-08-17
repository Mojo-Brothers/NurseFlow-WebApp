import { describe, it, expect } from 'vitest';
import { inventoryManagementService } from '../server/services/inventoryManagement.service.js';

describe('Pharmacy Procurement & Warehouse FEFO Inventory Engine', () => {
  const warehouseId = 'WH-MAIN-PHARMACY';
  const itemCode = 'MED-MET-500';

  it('should receive multiple drug batches and order them by FEFO (First-Expired, First-Out)', () => {
    // Receive batch expiring later
    inventoryManagementService.receiveStock({
      warehouseId,
      itemCode,
      itemName: 'Metformin 500mg',
      batchNumber: 'BATCH-2027',
      expiryDate: '2027-12-31',
      quantity: 100,
      unitCost: 1000
    });

    // Receive batch expiring earlier
    inventoryManagementService.receiveStock({
      warehouseId,
      itemCode,
      itemName: 'Metformin 500mg',
      batchNumber: 'BATCH-2026-EARLY',
      expiryDate: '2026-10-31',
      quantity: 50,
      unitCost: 1000
    });

    expect(inventoryManagementService.getStockLevel(warehouseId, itemCode)).toBe(150);
  });

  it('should dispense stock strictly from the earliest expiring batch first (FEFO)', () => {
    const dispenseResult = inventoryManagementService.dispenseStockFefo({
      warehouseId,
      itemCode,
      quantityNeeded: 60
    });

    expect(dispenseResult.quantityDeducted).toBe(60);
    // Should take all 50 from BATCH-2026-EARLY and 10 from BATCH-2027
    expect(dispenseResult.allocatedBatches[0].batchNumber).toBe('BATCH-2026-EARLY');
    expect(dispenseResult.allocatedBatches[0].quantityDeducted).toBe(50);
    expect(dispenseResult.allocatedBatches[1].batchNumber).toBe('BATCH-2027');
    expect(dispenseResult.allocatedBatches[1].quantityDeducted).toBe(10);
    expect(dispenseResult.remainingStock).toBe(90);
  });
});
