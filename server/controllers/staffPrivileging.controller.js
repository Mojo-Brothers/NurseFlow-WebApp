import { staffSchedulingService } from '../services/staffScheduling.service.js';
import { structuredLoggerService } from '../services/structuredLogger.service.js';

export const staffPrivilegingController = {
  /**
   * GET /api/v1/staff-privileges/staff
   */
  async getStaffList(req, res) {
    try {
      const staffList = Array.from(staffSchedulingService.staffProfiles.values());
      return res.status(200).json({
        success: true,
        data: staffList,
        total: staffList.length
      });
    } catch (error) {
      structuredLoggerService.error('STAFF_PRIVILEGING_GET_STAFF_ERROR', { error: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/v1/staff-privileges/staff
   */
  async createStaff(req, res) {
    try {
      const profile = staffSchedulingService.registerStaffProfile(req.body);
      return res.status(201).json({
        success: true,
        data: profile,
        message: 'Staff profile successfully registered.'
      });
    } catch (error) {
      structuredLoggerService.error('STAFF_PRIVILEGING_CREATE_STAFF_ERROR', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/v1/staff-privileges/credentials
   */
  async addCredential(req, res) {
    try {
      const credential = staffSchedulingService.registerCredential({
        ...req.body,
        issuedAt: req.body.issuedAt || req.body.issuedDate || '2026-01-01',
        validFrom: req.body.validFrom || '2026-01-01',
        validUntil: req.body.validUntil || req.body.expiryDate || '2030-01-01'
      });
      return res.status(201).json({
        success: true,
        data: credential,
        message: 'Clinical credential registered.'
      });
    } catch (error) {
      structuredLoggerService.error('STAFF_PRIVILEGING_ADD_CREDENTIAL_ERROR', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/v1/staff-privileges/privileges
   */
  async grantPrivilege(req, res) {
    try {
      const privilege = staffSchedulingService.grantClinicalPrivilege({
        ...req.body,
        effectiveFrom: req.body.effectiveFrom || req.body.effectiveStartDate || '2026-01-01',
        effectiveUntil: req.body.effectiveUntil || req.body.effectiveEndDate || '2029-01-01'
      });
      return res.status(201).json({
        success: true,
        data: privilege,
        message: 'Clinical privilege (SPK/RKK) successfully granted.'
      });
    } catch (error) {
      structuredLoggerService.error('STAFF_PRIVILEGING_GRANT_PRIVILEGE_ERROR', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/v1/staff-privileges/verify
   */
  async verifyAuthorization(req, res) {
    try {
      const { staffId, procedureCode, date } = req.body;
      const verification = staffSchedulingService.evaluateClinicalAuthorization({
        staffId,
        procedureCode,
        evaluationTimestamp: date ? new Date(date).toISOString() : new Date().toISOString()
      });
      return res.status(200).json({
        success: true,
        data: verification,
        authorized: verification.isAuthorized
      });
    } catch (error) {
      structuredLoggerService.error('STAFF_PRIVILEGING_VERIFY_ERROR', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  }
};
