/**
 * NurseFlow Enterprise HIS 2026 — Master Radiology Controller
 * Domain: Radiology Information System (RIS), PACS & Critical Findings Communication
 * Standards: Canonical JSON Response Envelope ({ data, meta } / { error, meta })
 */

import { radiologyApplicationService, RadiologyDomainError } from '../services/radiologyApplication.service.js';

export const radiologyController = {
  /**
   * Generate Modality Worklist (MWL) for CPOE Order
   * POST /api/v1/radiology/worklist/generate
   */
  generateModalityWorklist: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'USR-RAD-TECH-01',
        username: 'radiografer_ani',
        role: 'ROLE_RADIOGRAPHER'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await radiologyApplicationService.generateModalityWorklistForOrder(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `${result.length} Modality Worklist berhasil dibuat di RIS`,
          count: result.length,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof RadiologyDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'MWL_GEN_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Ingest DICOM C-STORE Study
   * POST /api/v1/radiology/studies/acquire
   */
  acquireStudy: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'USR-RAD-TECH-01',
        username: 'radiografer_ani',
        role: 'ROLE_RADIOGRAPHER'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await radiologyApplicationService.acquireDicomStudy(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `Studi DICOM [${result.study_instance_uid}] berhasil diakuisisi ke PACS`,
          studyId: result.id,
          studyInstanceUid: result.study_instance_uid,
          accessionNumber: result.accession_number,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof RadiologyDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'STUDY_ACQUIRE_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Save Structured Report
   * POST /api/v1/radiology/studies/:id/reports
   */
  saveReport: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'USR-DOC-RAD-01',
        username: 'dr_sp_rad',
        role: 'ROLE_RADIOGRAPHER'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await radiologyApplicationService.draftOrFinalizeReport(
        {
          studyId: req.params.id,
          ...req.body
        },
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: result.is_urgent_critical_finding
            ? 'PERINGATAN: Temuan kritis radiologi terdeteksi dan critical alert telah dipicu!'
            : 'Ekspertise laporan radiologi berhasil ditandatangani secara digital',
          reportId: result.id,
          isCritical: result.is_urgent_critical_finding,
          criticalAlertId: result.criticalAlert?.id || null,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof RadiologyDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'REPORT_GEN_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Amend Finalized Report
   * POST /api/v1/radiology/reports/:id/amend
   */
  amendReport: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'USR-DOC-RAD-01',
        username: 'dr_sp_rad',
        role: 'ROLE_RADIOGRAPHER'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await radiologyApplicationService.amendReport(
        {
          reportId: req.params.id,
          amendmentReason: req.body.amendmentReason,
          amendedFindings: req.body.amendedFindings,
          amendedImpression: req.body.amendedImpression
        },
        actor,
        clientIp,
        correlationId
      );

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          message: 'Laporan radiologi berhasil diamandemen dengan digital audit signature baru',
          reportId: result.id,
          version: result.version,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof RadiologyDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'AMEND_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Acknowledge Critical Finding Alert
   * POST /api/v1/radiology/critical-alerts/:id/acknowledge
   */
  acknowledgeCriticalFinding: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'USR-DOC-001',
        username: 'dr_siti',
        role: 'ROLE_DOCTOR_DPJP'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await radiologyApplicationService.acknowledgeCriticalFinding(
        {
          alertId: req.params.id,
          readBackConfirmed: req.body.readBackConfirmed,
          clinicalInstruction: req.body.clinicalInstruction
        },
        actor,
        clientIp,
        correlationId
      );

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          message: 'Konfirmasi verbal temuan kritis (Read-Back) berhasil dicatat dalam closed-loop audit',
          alertId: result.id,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof RadiologyDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'ACK_PANIC_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Escalate Critical Finding Alert
   * POST /api/v1/radiology/critical-alerts/:id/escalate
   */
  escalateCriticalFinding: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'USR-SYSTEM',
        username: 'system_monitor',
        role: 'ROLE_SUPER_ADMIN'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await radiologyApplicationService.escalateCriticalFinding(
        {
          alertId: req.params.id,
          escalationReason: req.body.escalationReason,
          targetLevel: req.body.targetLevel
        },
        actor,
        clientIp,
        correlationId
      );

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          message: `Temuan kritis berhasil dieskalasi ke level [${result.escalation_level}]`,
          alertId: result.id,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof RadiologyDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'ESCALATE_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Get Studies by Order ID
   * GET /api/v1/radiology/orders/:orderId/studies
   */
  getStudiesByOrder: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const studies = await radiologyApplicationService.getStudiesByOrder(req.params.orderId);
      return res.status(200).json({
        success: true,
        count: studies.length,
        data: studies,
        meta: { orderId: req.params.orderId, requestId, correlationId, timestamp }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof RadiologyDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'GET_STUDIES_FAILED',
          message: err.message
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  }
};
