/**
 * NurseFlow Enterprise HIS 2026 — Bed Management Controller
 * Domain: Inpatient Bed ADT (Assign, Transfer, Discharge) & Ward Monitoring
 * Standards: Canonical JSON Response Envelope ({ data, meta } / { error, meta })
 */

import { bedManagementApplicationService, BedDomainError } from '../services/bedManagementApplication.service.js';

export const bedManagementController = {
  /**
   * List / Monitor Beds
   * GET /api/v1/beds
   */
  getBeds: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const filters = {
        wardId: req.query.wardId,
        status: req.query.status
      };
      const beds = await bedManagementApplicationService.getBeds(filters);

      return res.status(200).json({
        success: true,
        data: beds,
        meta: {
          count: beds.length,
          filters,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'BED_FETCH_ERROR', message: err.message, details: [] },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Assign Bed (Admission ADT)
   * POST /api/v1/beds/assign
   */
  assignBed: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || { userId: 'USR-ADM-001', username: 'petugas_admisi', role: 'ROLE_REGISTRATION_CLERK' };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await bedManagementApplicationService.assignBed(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `Pasien berhasil ditempatkan pada bed '${result.bedNumber}'`,
          auditSignature: result.auditSignature,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof BedDomainError ? 400 : 500);
      const code = err.code || 'BED_ASSIGN_FAILED';
      return res.status(statusCode).json({
        success: false,
        error: { code, message: err.message, details: err.details || [] },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Transfer Patient Between Beds (Transfer ADT)
   * POST /api/v1/beds/transfer
   */
  transferBed: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || { userId: 'USR-NURSE-001', username: 'perawat_bangsal', role: 'ROLE_NURSE' };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await bedManagementApplicationService.transferBed(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          message: `Pasien berhasil dipindahkan ke bed '${result.transferredToBedNumber}'`,
          auditSignature: result.auditSignature,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof BedDomainError ? 400 : 500);
      const code = err.code || 'BED_TRANSFER_FAILED';
      return res.status(statusCode).json({
        success: false,
        error: { code, message: err.message, details: err.details || [] },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Discharge Patient from Bed (Discharge ADT)
   * POST /api/v1/beds/discharge
   */
  dischargeBed: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || { userId: 'USR-ADM-001', username: 'petugas_admisi', role: 'ROLE_REGISTRATION_CLERK' };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await bedManagementApplicationService.dischargeBed(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          message: 'Tempat tidur berhasil dikosongkan dan dialihkan ke status CLEANING',
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof BedDomainError ? 400 : 500);
      const code = err.code || 'BED_DISCHARGE_FAILED';
      return res.status(statusCode).json({
        success: false,
        error: { code, message: err.message, details: err.details || [] },
        meta: { requestId, correlationId, timestamp }
      });
    }
  }
};
