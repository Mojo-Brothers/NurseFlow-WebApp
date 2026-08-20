/**
 * NurseFlow Enterprise HIS 2026 — Master Clinical Monitoring & Deterioration Response Controller
 * Domain: Vital Signs, Multi-Model EWS Scoring (NEWS2), ISBAR Escalation, Rapid Response / Code Blue, Closed-Loop Reassessment
 * Standards: Canonical JSON Response Envelope ({ success, data, meta } / { success, error, meta })
 */

import { clinicalMonitoringService, ClinicalMonitoringDomainError } from '../services/clinicalMonitoring.service.js';

export const clinicalMonitoringController = {
  /**
   * 1. Record Vital Sign Observation & Calculate EWS
   * POST /api/v1/monitoring/observations
   */
  recordObservation: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'USR-NURSE-01',
        username: 'nurse_siti',
        role: 'ROLE_NURSE'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await clinicalMonitoringService.recordVitalSignObservation(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `Observasi tanda vital berhasil dicatat. Skor EWS ${result.scoring_system} = ${result.calculated_score} (${result.risk_level})`,
          observationId: result.id,
          calculatedScore: result.calculated_score,
          riskLevel: result.risk_level,
          escalationRequired: result.escalation_required,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof ClinicalMonitoringDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'VITAL_SIGNS_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 2. Escalate Clinical Deterioration (ISBAR)
   * POST /api/v1/monitoring/observations/:id/escalate
   */
  escalateDeterioration: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'USR-NURSE-01',
        username: 'nurse_siti',
        role: 'ROLE_NURSE'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await clinicalMonitoringService.escalateDeterioration(
        {
          observationId: req.params.id,
          escalationLevel: req.body.escalationLevel,
          isbarPayload: req.body.isbarPayload,
          notifiedToId: req.body.notifiedToId,
          notifiedToName: req.body.notifiedToName,
          notifiedToRole: req.body.notifiedToRole,
          notificationMethod: req.body.notificationMethod
        },
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `Eskalasi perburukan klinis [${result.escalation_level}] berhasil diteruskan ke ${result.notified_to_name}`,
          escalationId: result.id,
          targetResponseWindowMinutes: result.target_response_window_minutes,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof ClinicalMonitoringDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'ESCALATION_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 3. Acknowledge Escalation (Closed-Loop Read-Back)
   * POST /api/v1/monitoring/escalations/:id/acknowledge
   */
  acknowledgeEscalation: async (req, res) => {
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

      const result = await clinicalMonitoringService.acknowledgeEscalation(
        {
          escalationId: req.params.id,
          physicianInstruction: req.body.physicianInstruction,
          readBackConfirmed: req.body.readBackConfirmed
        },
        actor,
        clientIp,
        correlationId
      );

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          message: 'Konfirmasi eskalasi dan instruksi klinis dokter (TBAK Read-Back) berhasil diverifikasi',
          escalationId: result.id,
          acknowledgedBy: result.acknowledged_by_name,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof ClinicalMonitoringDomainError ? 400 : 500);
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
   * 4. Rapid Response / Code Blue Resuscitation Event
   * POST /api/v1/monitoring/rapid-response
   */
  activateRapidResponse: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'DOC-ICU-LEAD-01',
        username: 'dr_budi',
        role: 'ROLE_ICU_SPECIALIST'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await clinicalMonitoringService.activateRapidResponseOrCodeBlue(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `Kejadian resusitasi darurat ${result.event_type} berhasil dicatat dengan tanda tangan digital SHA-256`,
          eventId: result.id,
          outcome: result.outcome,
          chargeCaptured: result.charge_captured,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof ClinicalMonitoringDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'RRT_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 5. Record Closed-Loop Reassessment
   * POST /api/v1/monitoring/observations/:id/reassess
   */
  recordReassessment: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'USR-NURSE-01',
        username: 'nurse_siti',
        role: 'ROLE_NURSE'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await clinicalMonitoringService.recordClosedLoopReassessment(
        {
          initialObservationId: req.params.id,
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
          message: `Evaluasi ulang pasca intervensi berhasil: Skor EWS ${result.pre_score} ➔ ${result.post_score} (Delta: ${result.score_delta}, Trajektori: ${result.recovery_trajectory})`,
          reassessmentId: result.id,
          preScore: result.pre_score,
          postScore: result.post_score,
          scoreDelta: result.score_delta,
          recoveryTrajectory: result.recovery_trajectory,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof ClinicalMonitoringDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'REASSESSMENT_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  }
};
