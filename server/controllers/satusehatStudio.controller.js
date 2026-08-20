import { satusehatFhirStudioService } from '../services/satusehatFhirStudio.service.js';
import { structuredLoggerService } from '../services/structuredLogger.service.js';

export const satusehatStudioController = {
  /**
   * GET /api/v1/satusehat/logs
   */
  async getLogs(req, res) {
    try {
      const logs = satusehatFhirStudioService.getTransmissionLogs();
      return res.status(200).json({
        success: true,
        data: logs,
        total: logs.length
      });
    } catch (error) {
      structuredLoggerService.error('SATUSEHAT_GET_LOGS_ERROR', { error: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * GET /api/v1/satusehat/token
   */
  async getToken(req, res) {
    try {
      const token = satusehatFhirStudioService.getOAuthToken();
      return res.status(200).json({
        success: true,
        data: token
      });
    } catch (error) {
      structuredLoggerService.error('SATUSEHAT_GET_TOKEN_ERROR', { error: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/v1/satusehat/validate
   */
  async validate(req, res) {
    try {
      const resource = req.body.resource || req.body.data || req.body;
      const validation = satusehatFhirStudioService.validateFhirResource(resource);
      return res.status(200).json({
        success: true,
        data: {
          ...validation,
          valid: validation.isValid
        }
      });
    } catch (error) {
      structuredLoggerService.error('SATUSEHAT_VALIDATE_ERROR', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/v1/satusehat/transmit
   */
  async transmit(req, res) {
    try {
      const bundle = req.body.bundle || req.body;
      const result = satusehatFhirStudioService.simulateTransmission(bundle);
      return res.status(200).json({
        success: true,
        data: result,
        message: 'FHIR bundle transmitted to SATUSEHAT gateway.'
      });
    } catch (error) {
      structuredLoggerService.error('SATUSEHAT_TRANSMIT_ERROR', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  }
};
