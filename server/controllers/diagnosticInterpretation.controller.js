/**
 * NurseFlow Enterprise HIS 2026 — Master Diagnostic Interpretation Controller
 * Domain: Diagnostic Result Notifications, Critical Panic Alerts (TBAK Read-Back),
 * Physician Interpretation, Longitudinal Delta Checks, and Secondary CPOE Action Execution.
 * Standards: Canonical JSON Response Envelope ({ success, data, meta } / { success, error, meta })
 */

import { diagnosticInterpretationService, DiagnosticInterpretationDomainError } from '../services/diagnosticInterpretation.service.js';

export const diagnosticInterpretationController = {
  /**
   * 1. Publish Diagnostic Result Notification
   * POST /api/v1/diagnostics/notifications
   */
  publishNotification: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'USR-LAB-01',
        username: 'lab_tech_rina',
        role: 'ROLE_LAB_TECHNICIAN'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await diagnosticInterpretationService.publishDiagnosticNotification(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `Notifikasi hasil diagnostik ${result.test_or_study_name} berhasil diterbitkan (${result.abnormality_flag})`,
          notificationId: result.id,
          priority: result.notification_priority,
          abnormalityFlag: result.abnormality_flag,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof DiagnosticInterpretationDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'NOTIFICATION_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 2. Acknowledge Diagnostic Result Notification (Closed-Loop Read-Back)
   * POST /api/v1/diagnostics/notifications/:id/acknowledge
   */
  acknowledgeNotification: async (req, res) => {
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

      const result = await diagnosticInterpretationService.acknowledgeDiagnosticNotification(
        {
          notificationId: req.params.id,
          readBackConfirmed: req.body.readBackConfirmed,
          acknowledgmentNotes: req.body.acknowledgmentNotes
        },
        actor,
        clientIp,
        correlationId
      );

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          message: 'Konfirmasi penerimaan hasil diagnostik (TBAK Read-Back) berhasil diverifikasi',
          notificationId: result.id,
          acknowledgedBy: result.acknowledged_by_name,
          readBackConfirmed: result.read_back_confirmed,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof DiagnosticInterpretationDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'ACK_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 3. Record Physician Diagnostic Interpretation
   * POST /api/v1/diagnostics/notifications/:id/interpret
   */
  recordInterpretation: async (req, res) => {
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

      const result = await diagnosticInterpretationService.recordPhysicianInterpretation(
        {
          notificationId: req.params.id,
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
          message: 'Interpretasi klinis dokter berhasil dicatat dengan tanda tangan digital SHA-256',
          interpretationId: result.id,
          impactOnCarePlan: result.impact_on_care_plan,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof DiagnosticInterpretationDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'INTERPRETATION_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 4. Execute Secondary Clinical Action
   * POST /api/v1/diagnostics/interpretations/:id/actions
   */
  executeSecondaryAction: async (req, res) => {
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

      const result = await diagnosticInterpretationService.executeSecondaryClinicalAction(
        {
          interpretationId: req.params.id,
          actionType: req.body.actionType,
          actionSummary: req.body.actionSummary,
          cpoePayload: req.body.cpoePayload
        },
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `Tindakan klinis sekunder [${result.action_type}] berhasil dieksekusi`,
          actionId: result.id,
          cpoeOrderId: result.cpoe_order_id,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof DiagnosticInterpretationDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'ACTION_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  }
};
