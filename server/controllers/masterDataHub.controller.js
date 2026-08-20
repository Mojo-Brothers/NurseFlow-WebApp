import { masterDataGovernanceEngine } from '../services/masterDataGovernanceEngine.service.js';
import { structuredLoggerService } from '../services/structuredLogger.service.js';

export const masterDataHubController = {
  /**
   * GET /api/v1/master-data/:entityType
   */
  async listEntities(req, res) {
    try {
      const { entityType } = req.params;
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
    try {
      const { entityType, id } = req.params;
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
    try {
      const { entityType } = req.params;
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
    try {
      const { entityType, id } = req.params;
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
