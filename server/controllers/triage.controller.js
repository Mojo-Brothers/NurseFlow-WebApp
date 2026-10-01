/**
 * NurseFlow Enterprise HIS 2026 — Master Triage Controller
 * Domain: Emergency Triage Assessment (ATS / ESI) & Response SLA Tracking
 * Standards: Canonical JSON Response Envelope ({ data, meta } / { error, meta })
 *
 * P0-2B WAVE 1B.1 — UoW Pilot: actor object now carries tenantId (from req.user or fallback)
 * for all service calls that require withUnitOfWork tenant gate.
 */

import { triageApplicationService, TriageDomainError } from '../services/triageApplication.service.js';

export const triageController = {
  /**
   * Record Triage Assessment
   * POST /api/v1/triage/assessments
   */
  recordAssessment: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const resolvedTenantId = req.tenantId || req.user?.tenantId;
      if (!resolvedTenantId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'TENANT_CONTEXT_REQUIRED',
            message: 'Konteks tenant wajib disertakan dalam request.'
          },
          meta: { requestId, correlationId, timestamp }
        });
      }

      const actor = {
        userId: req.user?.userId || req.user?.id || 'USR-NURSE-001',
        username: req.user?.username || req.user?.fullName || 'perawat_igd',
        role: req.user?.role || 'ROLE_NURSE',
        tenantId: resolvedTenantId
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await triageApplicationService.recordTriageAssessment(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `Triase IGD level ${result.triage.triage_level} berhasil dicatat dengan target SLA ${result.triage.target_response_minutes} menit`,
          triageId: result.triage.id,
          slaTimerId: result.slaTimer.id,
          auditSignature: result.auditSignature,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof TriageDomainError ? 400 : 500);
      const code = err.code || 'TRIAGE_ASSESSMENT_FAILED';

      return res.status(statusCode).json({
        success: false,
        error: {
          code,
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Record First Physician Contact (Stop SLA Timer)
   * POST /api/v1/triage/first-physician-contact
   */
  recordFirstPhysicianContact: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const resolvedTenantId = req.tenantId || req.user?.tenantId;
      if (!resolvedTenantId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'TENANT_CONTEXT_REQUIRED',
            message: 'Konteks tenant wajib disertakan dalam request.'
          },
          meta: { requestId, correlationId, timestamp }
        });
      }

      const actor = {
        userId: req.user?.userId || req.user?.id || 'USR-DOC-EMER-001',
        username: req.user?.username || req.user?.fullName || 'dokter_igd',
        role: req.user?.role || 'ROLE_DOCTOR_EMERGENCY',
        tenantId: resolvedTenantId
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const timer = await triageApplicationService.recordFirstPhysicianContact(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(200).json({
        success: true,
        data: timer,
        meta: {
          message: `Respon pertama dokter dicatat. Durasi: ${timer.elapsed_seconds} detik (Overdue: ${timer.is_overdue ? 'YA' : 'TIDAK'})`,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof TriageDomainError ? 400 : 500);
      const code = err.code || 'SLA_STOP_FAILED';

      return res.status(statusCode).json({
        success: false,
        error: {
          code,
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Get Triage Detail by Encounter ID
   * GET /api/v1/triage/encounter/:encounterId
   */
  getTriageByEncounterId: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const resolvedTenantId = req.tenantId || req.user?.tenantId;
      if (!resolvedTenantId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'TENANT_CONTEXT_REQUIRED',
            message: 'Konteks tenant wajib disertakan dalam request.'
          },
          meta: { requestId, correlationId, timestamp }
        });
      }

      const actor = {
        userId: req.user?.userId || req.user?.id || 'USR-READ-001',
        username: req.user?.username || req.user?.fullName || 'staff_igd',
        role: req.user?.role || 'ROLE_NURSE',
        tenantId: resolvedTenantId
      };

      // Pass actor as second param — required by UoW-wrapped read path
      const triage = await triageApplicationService.getTriageByEncounterId(req.params.encounterId, actor);
      if (!triage) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TRIAGE_NOT_FOUND',
            message: `Asesmen triase untuk encounter ${req.params.encounterId} tidak ditemukan.`,
            details: []
          },
          meta: { requestId, correlationId, timestamp }
        });
      }

      return res.status(200).json({
        success: true,
        data: triage,
        meta: { requestId, correlationId, timestamp }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof TriageDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'TRIAGE_FETCH_ERROR',
          message: err.message,
          details: []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  }
};
