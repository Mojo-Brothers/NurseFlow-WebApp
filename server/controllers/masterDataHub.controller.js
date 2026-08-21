/**
 * NurseFlow Enterprise HIS 2026 — Master Data Hub REST Controller
 * Standards: Permendagri No. 72/2019, Kemkes KFA, ICD-10/ICD-9-CM & Spatial Hierarchy
 * Dual-Mode: Full PostgreSQL 16 ACID Persistence with dynamic catalog routing
 */

import crypto from 'crypto';
import { postgresPoolService } from '../db/postgresPool.js';
import { masterDataGovernanceEngine } from '../services/masterDataGovernanceEngine.service.js';
import { structuredLoggerService } from '../services/structuredLogger.service.js';

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

const ENTITY_TABLE_MAP = {
  genders: { table: 'master_genders', idCol: 'code' },
  religions: { table: 'master_religions', idCol: 'code' },
  'marital-statuses': { table: 'master_marital_statuses', idCol: 'code' },
  countries: { table: 'master_countries', idCol: 'alpha3_code' },
  provinces: { table: 'master_provinces', idCol: 'code' },
  cities: { table: 'master_cities', idCol: 'code' },
  wards: { table: 'master_wards', idCol: 'id' },
  rooms: { table: 'master_rooms', idCol: 'id' },
  beds: { table: 'master_beds', idCol: 'id' },
  diagnoses: { table: 'master_diagnoses', idCol: 'id' },
  procedures: { table: 'master_procedures', idCol: 'id' },
  medicines: { table: 'medication_catalog', idCol: 'id' },
  tariffs: { table: 'master_tariffs', idCol: 'id' },
  'staff-categories': { table: 'master_staff_categories', idCol: 'code' },
  'credential-types': { table: 'master_credential_types', idCol: 'code' }
};

export const masterDataHubController = {
  /**
   * GET /api/v1/master-data/:entityType
   */
  async listEntities(req, res) {
    const { entityType } = req.params;
    const mapping = ENTITY_TABLE_MAP[entityType];

    try {
      if (mapping) {
        const pool = postgresPoolService.getPool();
        const client = await pool.connect();
        try {
          const query = `SELECT * FROM ${mapping.table} LIMIT 100;`;
          const result = await client.query(query);
          return res.status(200).json({
            success: true,
            entityType,
            data: result.rows,
            total: result.rows.length,
            page: 1,
            totalPages: 1,
            source: 'POSTGRESQL_PERSISTENT_TRUTH'
          });
        } finally {
          client.release();
        }
      }

      // Dynamic governance engine query
      const result = masterDataGovernanceEngine.queryEntity(entityType, req.query);
      return res.status(200).json({
        success: true,
        entityType,
        data: result.data,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages
      });
    } catch (error) {
      structuredLoggerService.error('MASTER_DATA_LIST_ERROR', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * GET /api/v1/master-data/:entityType/:id
   */
  async getEntity(req, res) {
    const { entityType, id } = req.params;
    const mapping = ENTITY_TABLE_MAP[entityType];

    try {
      if (mapping) {
        const pool = postgresPoolService.getPool();
        const client = await pool.connect();
        try {
          const query = `SELECT * FROM ${mapping.table} WHERE ${mapping.idCol} = $1 OR id::text = $1 LIMIT 1;`;
          const result = await client.query(query, [id]);
          if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: `Entity ${id} not found in ${entityType}.` });
          }
          return res.status(200).json({
            success: true,
            data: result.rows[0],
            source: 'POSTGRESQL_PERSISTENT_TRUTH'
          });
        } finally {
          client.release();
        }
      }

      const result = masterDataGovernanceEngine.queryEntity(entityType, { filterStatus: 'ALL' });
      const entity = result.data.find(item => item.id === id || item.code === id);
      if (!entity) {
        return res.status(404).json({ success: false, message: `Entity ${id} not found in ${entityType}.` });
      }
      return res.status(200).json({ success: true, data: entity });
    } catch (error) {
      structuredLoggerService.error('MASTER_DATA_GET_ERROR', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/v1/master-data/:entityType
   */
  async createEntity(req, res) {
    const { entityType } = req.params;
    const mapping = ENTITY_TABLE_MAP[entityType];

    try {
      if (mapping && entityType === 'beds') {
        const pool = postgresPoolService.getPool();
        const client = await pool.connect();
        try {
          await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');
          const bedId = req.body.id || crypto.randomUUID();
          const roomId = req.body.room_id || req.body.roomId || DEFAULT_TENANT_ID;
          const bedNumber = req.body.bed_number || req.body.bedNumber || `BED-${Date.now().toString().slice(-4)}`;
          const bedStatus = req.body.bed_status || req.body.operational_status || req.body.operationalStatus || 'AVAILABLE';
          const tariff = parseFloat(req.body.daily_tariff || req.body.dailyTariff || 500000);

          const insertQuery = `
            INSERT INTO master_beds (
              id, tenant_id, room_id, bed_number, bed_status, daily_tariff, version, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, 1, NOW(), NOW()
            ) RETURNING *;
          `;
          const result = await client.query(insertQuery, [
            bedId, DEFAULT_TENANT_ID, roomId, bedNumber, bedStatus, tariff
          ]);
          await client.query('COMMIT;');
          return res.status(201).json({
            success: true,
            data: result.rows[0],
            message: `Master bed created and persisted in PostgreSQL.`
          });
        } catch (dbErr) {
          await client.query('ROLLBACK;');
          throw dbErr;
        } finally {
          client.release();
        }
      }

      const record = masterDataGovernanceEngine.createEntity(entityType, req.body, {
        performedByUserId: req.user?.id || 'SYSTEM'
      });
      return res.status(201).json({
        success: true,
        data: record,
        message: `Master record created in ${entityType}.`
      });
    } catch (error) {
      structuredLoggerService.error('MASTER_DATA_CREATE_ERROR', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * PUT /api/v1/master-data/:entityType/:id
   */
  async updateEntity(req, res) {
    const { entityType, id } = req.params;
    const mapping = ENTITY_TABLE_MAP[entityType];

    try {
      if (mapping && entityType === 'beds') {
        const pool = postgresPoolService.getPool();
        const client = await pool.connect();
        try {
          await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');
          const updateQuery = `
            UPDATE master_beds SET
              bed_status = COALESCE($1, bed_status),
              daily_tariff = COALESCE($2, daily_tariff),
              version = version + 1,
              updated_at = NOW()
            WHERE id = $3 OR bed_number = $3
            RETURNING *;
          `;
          const result = await client.query(updateQuery, [
            req.body.bed_status || req.body.operational_status || req.body.operationalStatus,
            req.body.daily_tariff || req.body.dailyTariff,
            id
          ]);
          await client.query('COMMIT;');
          return res.status(200).json({
            success: true,
            data: result.rows[0],
            message: `Master bed updated and persisted in PostgreSQL.`
          });
        } catch (dbErr) {
          await client.query('ROLLBACK;');
          throw dbErr;
        } finally {
          client.release();
        }
      }

      const record = masterDataGovernanceEngine.updateEntity(entityType, id, req.body, {
        performedByUserId: req.user?.id || 'SYSTEM'
      });
      return res.status(200).json({
        success: true,
        data: record,
        message: `Master record updated in ${entityType}.`
      });
    } catch (error) {
      structuredLoggerService.error('MASTER_DATA_UPDATE_ERROR', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  }
};
