/**
 * NurseFlow Enterprise HIS 2026 — Master Care Coordination & Longitudinal Timeline Controller
 * Domain: Unified Longitudinal Timeline Reconstruction, Inter-Disciplinary Care Plan (ICP),
 * SBAR Shift Handover, and JCI Medical Discharge Resume.
 * Standards: Canonical JSON Response Envelope ({ success, data, meta } / { success, error, meta })
 */

import {
  careCoordinationAndTimelineService,
  CareCoordinationDomainError
} from '../services/careCoordinationAndTimeline.service.js';

export const careCoordinationAndTimelineController = {
  /**
   * 1. Get Unified Longitudinal Timeline (Chronological & Causal Graph)
   * GET /api/v1/coordination/encounters/:encounterId/timeline
   */
  getTimeline: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const result = await careCoordinationAndTimelineService.getUnifiedLongitudinalTimeline(
        req.params.encounterId,
        req.query
      );

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          message: `Timeline klinis longitudinal berhasil direkonstruksi (${result.totalEvents} event)`,
          encounterId: req.params.encounterId,
          totalEvents: result.totalEvents,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof CareCoordinationDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'TIMELINE_FETCH_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 2. Create or Update Inter-Disciplinary Care Plan (ICP)
   * POST /api/v1/coordination/care-plans
   */
  createOrUpdateCarePlan: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'DOC-DPJP-01',
        username: 'dr_siti',
        role: 'ROLE_DOCTOR_DPJP'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await careCoordinationAndTimelineService.createOrUpdateCarePlan(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `Rencana Asuhan Terpadu (ICP) v${result.version} berhasil disimpan`,
          carePlanId: result.id,
          carePlanNumber: result.care_plan_number,
          version: result.version,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof CareCoordinationDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'CARE_PLAN_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 3. Create SBAR Shift Handover
   * POST /api/v1/coordination/handovers
   */
  createShiftHandover: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'NURSE-OUT-01',
        username: 'ners_siti',
        role: 'ROLE_NURSE'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await careCoordinationAndTimelineService.createShiftHandover(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `Operan Jaga SBAR (${result.shift_name}) berhasil didaftarkan`,
          handoverId: result.id,
          handoverNumber: result.handover_number,
          status: result.handover_status,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof CareCoordinationDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'HANDOVER_CREATION_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 4. Acknowledge Shift Handover (Dual Sign-Off)
   * POST /api/v1/coordination/handovers/:id/acknowledge
   */
  acknowledgeShiftHandover: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'NURSE-INC-01',
        username: 'ners_dewi',
        role: 'ROLE_NURSE'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await careCoordinationAndTimelineService.acknowledgeShiftHandover(
        req.params.id,
        actor,
        clientIp,
        correlationId
      );

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          message: 'Operan Jaga SBAR berhasil diterima dan diverifikasi (Dual Sign-Off selesai)',
          handoverId: result.id,
          status: result.handover_status,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof CareCoordinationDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'HANDOVER_ACK_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 5. Create & Lock JCI Medical Discharge Resume
   * POST /api/v1/coordination/discharge-summaries
   */
  createDischargeSummary: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'DOC-DPJP-01',
        username: 'dr_siti',
        role: 'ROLE_DOCTOR_DPJP'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await careCoordinationAndTimelineService.createDischargeSummary(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: 'Resume Medis Pulang (Discharge Summary) berhasil disahkan & dikunci',
          summaryId: result.id,
          summaryNumber: result.summary_number,
          dischargeCondition: result.discharge_condition,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof CareCoordinationDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'DISCHARGE_SUMMARY_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  }
};
