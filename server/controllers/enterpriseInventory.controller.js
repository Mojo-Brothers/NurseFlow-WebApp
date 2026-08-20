import { inventoryManagementService } from '../services/inventoryManagement.service.js';
import { structuredLoggerService } from '../services/structuredLogger.service.js';

export const enterpriseInventoryController = {
  /**
   * GET /api/v1/inventory/stock
   */
  async getStock(req, res) {
    try {
      const warehouseId = req.query.warehouseId || 'WH-MAIN-PHARMACY';
      const itemCode = req.query.itemCode;
      const stock = inventoryManagementService.getWarehouseStock(warehouseId, itemCode);
      return res.status(200).json({
        success: true,
        data: stock,
        total: stock.length
      });
    } catch (error) {
      structuredLoggerService.error('INVENTORY_GET_STOCK_ERROR', { error: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/v1/inventory/receive
   */
  async receive(req, res) {
    try {
      const payload = {
        ...req.body,
        performedBy: req.user?.name || req.body.performedBy || 'PHARMACY_STAFF'
      };
      const result = inventoryManagementService.receiveStock(payload);
      return res.status(201).json({
        success: true,
        data: {
          batch: result.batch,
          availableQuantity: result.batch.availableQuantity
        },
        message: 'Inventory batch received and stock incremented.'
      });
    } catch (error) {
      structuredLoggerService.error('INVENTORY_RECEIVE_ERROR', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/v1/inventory/transfer
   */
  async transfer(req, res) {
    try {
      const payload = {
        ...req.body,
        performedBy: req.user?.name || req.body.performedBy || 'LOGISTICS_STAFF'
      };
      const result = inventoryManagementService.transferStock(payload);
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Stock transfer completed.'
      });
    } catch (error) {
      structuredLoggerService.error('INVENTORY_TRANSFER_ERROR', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * GET /api/v1/inventory/movements
   */
  async getMovements(req, res) {
    try {
      const movements = inventoryManagementService.movements || [];
      return res.status(200).json({
        success: true,
        data: movements,
        total: movements.length
      });
    } catch (error) {
      structuredLoggerService.error('INVENTORY_GET_MOVEMENTS_ERROR', { error: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};
