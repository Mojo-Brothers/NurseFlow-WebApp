import { executiveCommandCenterService } from '../services/executiveCommandCenter.service.js';
import { structuredLoggerService } from '../services/structuredLogger.service.js';

export const commandCenterController = {
  /**
   * GET /api/v1/command-center/capacity
   */
  async getCapacity(req, res) {
    try {
      const data = executiveCommandCenterService.getCapacityMetrics();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      structuredLoggerService.error('COMMAND_CENTER_CAPACITY_ERROR', { error: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * GET /api/v1/command-center/emergency
   */
  async getEmergency(req, res) {
    try {
      const data = executiveCommandCenterService.getEmergencyMetrics();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      structuredLoggerService.error('COMMAND_CENTER_EMERGENCY_ERROR', { error: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * GET /api/v1/command-center/financial
   */
  async getFinancial(req, res) {
    try {
      const data = executiveCommandCenterService.getFinancialMetrics();
      return res.status(200).json({
        success: true,
        data: {
          ...data,
          cleanClaimRate: data.inaCbgGroupingEfficiency || 98.2
        }
      });
    } catch (error) {
      structuredLoggerService.error('COMMAND_CENTER_FINANCIAL_ERROR', { error: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * GET /api/v1/command-center/safety
   */
  async getSafety(req, res) {
    try {
      const data = executiveCommandCenterService.getClinicalSafetyMetrics();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      structuredLoggerService.error('COMMAND_CENTER_SAFETY_ERROR', { error: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * GET /api/v1/command-center/alerts
   */
  async getAlerts(req, res) {
    try {
      const data = executiveCommandCenterService.evaluateExecutiveAlerts();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      structuredLoggerService.error('COMMAND_CENTER_ALERTS_ERROR', { error: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};
