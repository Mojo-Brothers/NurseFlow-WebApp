/**
 * NurseFlow Enterprise HIS 2026 — Master Enterprise Multi-Depot Inventory Controller
 * Standards: CDOB (Good Distribution Practice), JCI MMU & Kemenkes KFA
 * Dual-Mode: Full PostgreSQL 16 ACID Persistence with Strict Anti-Negative Stock & FEFO
 */

import crypto from 'crypto';
import { postgresPoolService } from '../db/postgresPool.js';
import { inventoryManagementService } from '../services/inventoryManagement.service.js';
import { structuredLoggerService } from '../services/structuredLogger.service.js';

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const enterpriseInventoryController = {
  /**
   * GET /api/v1/inventory/stock
   */
  async getStock(req, res) {
    const warehouseId = req.query?.warehouseId || req.query?.warehouse_id;
    const itemCode = req.query?.itemCode || req.query?.item_code;

    try {
      const pool = postgresPoolService.getPool();
      const client = await pool.connect();
      try {
        let query = `
          SELECT 
            b.id as "batchId", b.warehouse_id as "warehouseId", b.medication_id as "medicationId",
            b.batch_number as "batchNumber", b.expiry_date as "expiryDate",
            b.initial_quantity as "initialQuantity", b.available_quantity as "availableQuantity",
            b.reserved_quantity as "reservedQuantity", b.unit_cost as "unitCost",
            b.unit_price as "unitPrice",
            m.item_code as "itemCode", m.item_name as "itemName",
            w.warehouse_name as "warehouseName", w.warehouse_code as "warehouseCode"
          FROM inventory_batches b
          JOIN medication_catalog m ON b.medication_id = m.id
          JOIN pharmacy_warehouses w ON b.warehouse_id = w.id
          WHERE b.available_quantity >= 0
        `;
        const params = [];
        let idx = 1;

        if (warehouseId) {
          query += ` AND (b.warehouse_id::text = $${idx} OR w.warehouse_code = $${idx})`;
          params.push(warehouseId);
          idx++;
        }
        if (itemCode) {
          query += ` AND m.item_code = $${idx}`;
          params.push(itemCode);
          idx++;
        }

        query += ` ORDER BY b.expiry_date ASC;`;
        const result = await client.query(query, params);

        return res.status(200).json({
          success: true,
          data: result.rows,
          total: result.rows.length,
          source: 'POSTGRESQL_PERSISTENT_TRUTH'
        });
      } finally {
        client.release();
      }
    } catch (error) {
      structuredLoggerService.warn('INVENTORY_PG_FETCH_FALLBACK', { error: error.message });
      const stock = inventoryManagementService.getWarehouseStock(warehouseId || 'WH-MAIN-PHARMACY', itemCode);
      return res.status(200).json({
        success: true,
        data: stock,
        total: stock.length,
        source: 'IN_MEMORY_FALLBACK'
      });
    }
  },

  /**
   * POST /api/v1/inventory/receive
   */
  async receive(req, res) {
    const tenantId = (req.user?.tenantId && isUUID(req.user.tenantId)) ? req.user.tenantId : DEFAULT_TENANT_ID;
    const warehouseInput = req.body?.warehouseId || req.body?.warehouse_id || 'WH-MAIN-PHARMACY';
    const itemInput = req.body?.itemId || req.body?.medicationId || req.body?.medication_id || req.body?.itemCode || req.body?.item_code || 'MED-GEN-01';
    const itemName = req.body?.itemName || req.body?.item_name || 'Generic Medication';
    const batchNumber = req.body?.batchNumber || req.body?.batch_number || `BAT-${Date.now()}`;
    const expiryDate = req.body?.expiryDate || req.body?.expiry_date || '2028-12-31';
    const quantity = parseInt(req.body?.quantity || req.body?.initialQuantity || req.body?.initial_quantity || 0, 10);
    const unitCost = parseFloat(req.body?.unitCost || req.body?.unit_cost || 0);
    const unitPrice = parseFloat(req.body?.unitPrice || req.body?.unit_price || 0);
    const performedBy = req.body?.performedBy || req.user?.username || req.user?.email || 'PHARMACY_STAFF';

    if (!warehouseInput || !itemInput || !batchNumber || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_FAILED',
        message: 'warehouseId, itemId, batchNumber, dan quantity (> 0) wajib disertakan.'
      });
    }

    try {
      const pool = postgresPoolService.getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

        // 1. Resolve or provision Warehouse
        let realWarehouseId;
        const whCheck = await client.query(
          'SELECT id FROM pharmacy_warehouses WHERE tenant_id = $1 AND (id::text = $2 OR warehouse_code = $2) LIMIT 1;',
          [tenantId, warehouseInput]
        );
        if (whCheck.rows.length > 0) {
          realWarehouseId = whCheck.rows[0].id;
        } else {
          realWarehouseId = isUUID(warehouseInput) ? warehouseInput : crypto.randomUUID();
          await client.query(`
            INSERT INTO pharmacy_warehouses (id, tenant_id, warehouse_code, warehouse_name, warehouse_type, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, $4, 'MAIN_WAREHOUSE', true, NOW(), NOW())
            ON CONFLICT (tenant_id, warehouse_code) DO NOTHING;
          `, [realWarehouseId, tenantId, warehouseInput, `Gudang ${warehouseInput}`]);
        }

        // 2. Resolve or provision Medication Catalog item
        let realMedicationId;
        const medCheck = await client.query(
          'SELECT id FROM medication_catalog WHERE tenant_id = $1 AND (id::text = $2 OR item_code = $2) LIMIT 1;',
          [tenantId, itemInput]
        );
        if (medCheck.rows.length > 0) {
          realMedicationId = medCheck.rows[0].id;
        } else {
          realMedicationId = isUUID(itemInput) ? itemInput : crypto.randomUUID();
          await client.query(`
            INSERT INTO medication_catalog (id, tenant_id, item_code, item_name, generic_name, dosage_form, package_unit, dispense_unit, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $4, 'TABLET', 'BOX', 'TABLET', true, NOW(), NOW())
            ON CONFLICT (tenant_id, item_code) DO NOTHING;
          `, [realMedicationId, tenantId, itemInput, itemName]);
        }

        const batchId = isUUID(req.body?.id) ? req.body.id : crypto.randomUUID();
        const movementNumber = `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // 3. Insert or update batch
        const insertBatchQuery = `
          INSERT INTO inventory_batches (
            id, tenant_id, warehouse_id, medication_id, batch_number,
            expiry_date, initial_quantity, available_quantity, reserved_quantity,
            unit_cost, unit_price, version, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $7, 0,
            $8, $9, 1, NOW(), NOW()
          )
          ON CONFLICT (warehouse_id, medication_id, batch_number)
          DO UPDATE SET
            available_quantity = inventory_batches.available_quantity + $7,
            version = inventory_batches.version + 1,
            updated_at = NOW()
          RETURNING *;
        `;

        const batchResult = await client.query(insertBatchQuery, [
          batchId, tenantId, realWarehouseId, realMedicationId, batchNumber,
          expiryDate, quantity, unitCost, unitPrice
        ]);
        const savedBatch = batchResult.rows[0];

        // 4. Insert Stock Movement
        const insertMovementQuery = `
          INSERT INTO inventory_stock_movements (
            id, tenant_id, movement_number, warehouse_id, medication_id,
            batch_id, movement_type, quantity_delta, balance_before,
            balance_after, unit_cost, performed_by_id, performed_by_name, created_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, 'PURCHASE_RECEIPT', $7, $8,
            $9, $10, 'USR-LOGISTICS-01', $11, NOW()
          ) RETURNING *;
        `;

        const balBefore = savedBatch.available_quantity - quantity;
        await client.query(insertMovementQuery, [
          crypto.randomUUID(), tenantId, movementNumber, realWarehouseId, realMedicationId,
          savedBatch.id, quantity, Math.max(0, balBefore), savedBatch.available_quantity,
          unitCost, performedBy
        ]);

        await client.query('COMMIT;');

        return res.status(201).json({
          success: true,
          data: {
            batch: savedBatch,
            availableQuantity: savedBatch.available_quantity,
            movementNumber
          },
          message: 'Inventory batch received and stock incremented in PostgreSQL.'
        });
      } catch (dbErr) {
        await client.query('ROLLBACK;');
        throw dbErr;
      } finally {
        client.release();
      }
    } catch (error) {
      structuredLoggerService.error('INVENTORY_RECEIVE_ERROR', { error: error.message });
      return res.status(400).json({
        success: false,
        error: error.code || 'RECEIVE_FAILED',
        message: error.message
      });
    }
  },

  /**
   * POST /api/v1/inventory/transfer
   */
  async transfer(req, res) {
    const tenantId = (req.user?.tenantId && isUUID(req.user.tenantId)) ? req.user.tenantId : DEFAULT_TENANT_ID;
    const sourceInput = req.body?.sourceWarehouseId || req.body?.source_warehouse_id || req.body?.sourceWarehouseCode || 'WH-MAIN-PHARMACY';
    const destInput = req.body?.destinationWarehouseId || req.body?.destination_warehouse_id || req.body?.targetWarehouseId || req.body?.target_warehouse_id || req.body?.destinationWarehouseCode || 'EMERGENCY_DEPO';
    const batchInput = req.body?.batchId || req.body?.batch_id || req.body?.batchNumber;
    const itemInput = req.body?.itemId || req.body?.itemCode || req.body?.item_code;
    const quantity = parseInt(req.body?.quantity || req.body?.transferQuantity || 0, 10);
    const performedBy = req.body?.performedBy || req.user?.username || 'LOGISTICS_STAFF';

    if (!sourceInput || !destInput || (!batchInput && !itemInput) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_FAILED',
        message: 'sourceWarehouseId, destinationWarehouseId, batchId / itemCode, dan quantity (> 0) wajib disertakan.'
      });
    }

    try {
      const pool = postgresPoolService.getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

        // 1. Resolve source warehouse
        let sourceWarehouseId;
        const srcCheck = await client.query(
          'SELECT id FROM pharmacy_warehouses WHERE (id::text = $1 OR warehouse_code = $1) LIMIT 1;',
          [sourceInput]
        );
        if (srcCheck.rows.length > 0) {
          sourceWarehouseId = srcCheck.rows[0].id;
        } else {
          sourceWarehouseId = isUUID(sourceInput) ? sourceInput : crypto.randomUUID();
          await client.query(`
            INSERT INTO pharmacy_warehouses (id, tenant_id, warehouse_code, warehouse_name, warehouse_type, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, $4, 'MAIN_WAREHOUSE', true, NOW(), NOW())
            ON CONFLICT (tenant_id, warehouse_code) DO NOTHING;
          `, [sourceWarehouseId, tenantId, sourceInput, `Gudang ${sourceInput}`]);
        }

        // 2. Resolve destination warehouse
        let destinationWarehouseId;
        const dstCheck = await client.query(
          'SELECT id FROM pharmacy_warehouses WHERE (id::text = $1 OR warehouse_code = $1) LIMIT 1;',
          [destInput]
        );
        if (dstCheck.rows.length > 0) {
          destinationWarehouseId = dstCheck.rows[0].id;
        } else {
          destinationWarehouseId = isUUID(destInput) ? destInput : crypto.randomUUID();
          await client.query(`
            INSERT INTO pharmacy_warehouses (id, tenant_id, warehouse_code, warehouse_name, warehouse_type, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, $4, 'EMERGENCY_DEPO', true, NOW(), NOW())
            ON CONFLICT (tenant_id, warehouse_code) DO NOTHING;
          `, [destinationWarehouseId, tenantId, destInput, `Gudang ${destInput}`]);
        }

        // 3. Fetch & lock source batch (Direct by batchId or FEFO by itemCode)
        let sourceRes;
        if (batchInput) {
          sourceRes = await client.query(
            'SELECT * FROM inventory_batches WHERE (id::text = $1 OR batch_number = $1) AND warehouse_id = $2 FOR UPDATE;',
            [batchInput, sourceWarehouseId]
          );

          if (sourceRes.rows.length === 0) {
            sourceRes = await client.query(
              'SELECT * FROM inventory_batches WHERE (id::text = $1 OR batch_number = $1) FOR UPDATE;',
              [batchInput]
            );
          }
        } else {
          // FEFO query by itemCode
          sourceRes = await client.query(`
            SELECT b.* FROM inventory_batches b
            JOIN medication_catalog m ON b.medication_id = m.id
            WHERE (b.warehouse_id = $1 OR b.warehouse_id IN (SELECT id FROM pharmacy_warehouses WHERE warehouse_code = $2))
              AND (m.item_code = $3 OR m.id::text = $3)
              AND b.available_quantity >= $4
            ORDER BY b.expiry_date ASC
            LIMIT 1 FOR UPDATE;
          `, [sourceWarehouseId, sourceInput, itemInput, quantity]);
        }

        if (!sourceRes || sourceRes.rows.length === 0) {
          throw new Error(`Source batch not found in specified warehouse for requested item.`);
        }

        const sourceBatch = sourceRes.rows[0];
        if (sourceBatch.available_quantity < quantity) {
          throw new Error(`INSUFFICIENT_STOCK: Available stock (${sourceBatch.available_quantity}) is less than requested transfer (${quantity}).`);
        }

        // 4. Decrement source batch
        await client.query(`
          UPDATE inventory_batches SET
            available_quantity = available_quantity - $1,
            version = version + 1,
            updated_at = NOW()
          WHERE id = $2;
        `, [quantity, sourceBatch.id]);

        // 5. Increment / Insert destination batch
        const destBatchRes = await client.query(`
          INSERT INTO inventory_batches (
            id, tenant_id, warehouse_id, medication_id, batch_number,
            expiry_date, initial_quantity, available_quantity, reserved_quantity,
            unit_cost, unit_price, version, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $7, 0,
            $8, $9, 1, NOW(), NOW()
          )
          ON CONFLICT (warehouse_id, medication_id, batch_number)
          DO UPDATE SET
            available_quantity = inventory_batches.available_quantity + $7,
            version = inventory_batches.version + 1,
            updated_at = NOW()
          RETURNING *;
        `, [
          crypto.randomUUID(), tenantId, destinationWarehouseId, sourceBatch.medication_id,
          sourceBatch.batch_number, sourceBatch.expiry_date, quantity,
          sourceBatch.unit_cost, sourceBatch.unit_price
        ]);

        // 6. Record movements
        const outMovementNum = `MOV-OUT-${Date.now()}`;
        await client.query(`
          INSERT INTO inventory_stock_movements (
            id, tenant_id, movement_number, warehouse_id, medication_id,
            batch_id, movement_type, quantity_delta, balance_before,
            balance_after, performed_by_id, performed_by_name, created_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, 'INTERNAL_TRANSFER_OUT', $7, $8,
            $9, 'USR-LOGISTICS-01', $10, NOW()
          );
        `, [
          crypto.randomUUID(), tenantId, outMovementNum, sourceWarehouseId, sourceBatch.medication_id,
          sourceBatch.id, -quantity, sourceBatch.available_quantity, sourceBatch.available_quantity - quantity,
          performedBy
        ]);

        await client.query('COMMIT;');

        return res.status(200).json({
          success: true,
          data: {
            sourceBatchId: sourceBatch.id,
            destinationBatch: destBatchRes.rows[0],
            transferredQuantity: quantity
          },
          message: 'Stock transfer completed and committed in PostgreSQL.'
        });
      } catch (dbErr) {
        await client.query('ROLLBACK;');
        throw dbErr;
      } finally {
        client.release();
      }
    } catch (error) {
      structuredLoggerService.error('INVENTORY_TRANSFER_ERROR', { error: error.message });
      return res.status(400).json({
        success: false,
        error: 'TRANSFER_FAILED',
        message: error.message
      });
    }
  },

  /**
   * GET /api/v1/inventory/movements
   */
  async getMovements(req, res) {
    try {
      const pool = postgresPoolService.getPool();
      const client = await pool.connect();
      try {
        const query = `
          SELECT * FROM inventory_stock_movements
          ORDER BY created_at DESC
          LIMIT 100;
        `;
        const result = await client.query(query);
        return res.status(200).json({
          success: true,
          data: result.rows,
          total: result.rows.length,
          source: 'POSTGRESQL_PERSISTENT_TRUTH'
        });
      } finally {
        client.release();
      }
    } catch (error) {
      structuredLoggerService.warn('INVENTORY_MOVEMENTS_FALLBACK', { error: error.message });
      const movements = inventoryManagementService.movements || [];
      return res.status(200).json({
        success: true,
        data: movements,
        total: movements.length,
        source: 'IN_MEMORY_FALLBACK'
      });
    }
  }
};
