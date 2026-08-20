/**
 * NurseFlow Enterprise HIS 2026 — Master Perioperative & Operating Theatre Closed Loop Controller
 * Domain: Pre-Op Anesthesia Evaluation, WHO 3-Phase Safe Surgery Checklist (JCI IPSG 4),
 * Intraoperative UDI Medical Implant Traceability, PACU Modified Aldrete Recovery Scoring,
 * and Exactly-Once Surgical Charge Capture & Room Turnover.
 * Standards: Canonical JSON Response Envelope ({ success, data, meta } / { success, error, meta })
 */

import {
  perioperativeClosedLoopService,
  PerioperativeDomainError
} from '../services/perioperativeClosedLoop.service.js';

export const perioperativeClosedLoopController = {
  /**
   * 1. Create Pre-Operative Anesthesia Evaluation
   * POST /api/v1/perioperative/preop-evaluations
   */
  createPreOpEvaluation: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'DOC-ANES-01',
        username: 'dr_budi_anestesi',
        role: 'ROLE_ANESTHESIOLOGIST'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await perioperativeClosedLoopService.createPreOpAnesthesiaEvaluation(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `Evaluasi Pra-Anestesi berhasil dicatat (${result.asa_class})`,
          evaluationId: result.id,
          asaClass: result.asa_class,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof PerioperativeDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'PREOP_EVAL_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 2. Execute WHO Surgical Safety Checklist Phase
   * POST /api/v1/perioperative/who-checklist
   */
  executeWhoChecklist: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'STAFF-SURG-01',
        username: 'tim_bedah_ok1',
        role: 'ROLE_DOCTOR_DPJP'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await perioperativeClosedLoopService.executeWhoChecklistPhase(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          message: `WHO Surgical Safety Checklist fase [${req.body.phase}] berhasil dieksekusi`,
          checklistId: result.id,
          status: result.status,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof PerioperativeDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'WHO_CHECKLIST_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 3. Record Intraoperative UDI Medical Implant Traceability
   * POST /api/v1/perioperative/implants
   */
  recordImplant: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'DOC-SURG-01',
        username: 'dr_siti_bedah',
        role: 'ROLE_DOCTOR_DPJP'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await perioperativeClosedLoopService.recordImplantDeployment(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `Penanaman implan medis permanen (${result.implant_name}) berhasil dicatat dengan UDI ${result.udi_barcode}`,
          implantId: result.id,
          udiBarcode: result.udi_barcode,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof PerioperativeDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'IMPLANT_LOG_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 4. Record PACU Post-Anesthesia Recovery Assessment (Modified Aldrete Score)
   * POST /api/v1/perioperative/pacu-records
   */
  recordPacuRecovery: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'NURSE-PACU-01',
        username: 'ners_pacu',
        role: 'ROLE_NURSE'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await perioperativeClosedLoopService.recordPacuRecoveryAssessment(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `Asesmen pemulihan PACU berhasil dicatat (Skor Aldrete: ${result.total_aldrete_score}/10)`,
          recordId: result.id,
          totalAldreteScore: result.total_aldrete_score,
          readinessStatus: result.discharge_readiness_status,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof PerioperativeDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'PACU_ASSESSMENT_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 5. Finalize Surgical Closed Loop & Exactly-Once Charge Capture
   * POST /api/v1/perioperative/cases/:id/finalize
   */
  finalizeSurgery: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'DOC-SURG-01',
        username: 'dr_siti_bedah',
        role: 'ROLE_DOCTOR_DPJP'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await perioperativeClosedLoopService.finalizeSurgicalClosedLoop(
        req.params.id,
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          message: 'Tindakan operasi berhasil difinalisasi, tagihan tertagih ke billing, dan kamar bedah beralih ke status sterilisasi',
          surgicalCaseId: result.surgicalCaseId,
          totalHospitalCost: result.totalHospitalCost,
          roomStatus: result.roomStatus,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof PerioperativeDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'SURGERY_FINALIZATION_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 6. Record Surgical Cancellation or Intraoperative Abort Pathway
   * POST /api/v1/perioperative/cases/:id/abort
   */
  abortSurgery: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'DOC-DPJP-01',
        username: 'dr_siti_bedah',
        role: 'ROLE_DOCTOR_DPJP'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await perioperativeClosedLoopService.recordSurgicalAbortOrCancellation(
        req.params.id,
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          message: `Pembatalan/penghentian operasi berhasil dicatat (${result.abort_reason_category})`,
          abortId: result.id,
          abortNumber: result.abort_number,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof PerioperativeDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'SURGERY_ABORT_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 7. Trigger Intraoperative Emergency & Resuscitation Bridge
   * POST /api/v1/perioperative/cases/:id/emergency
   */
  triggerEmergency: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'DOC-ANES-01',
        username: 'dr_budi_anestesi',
        role: 'ROLE_ANESTHESIOLOGIST'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await perioperativeClosedLoopService.triggerIntraoperativeEmergency(
        req.params.id,
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `Kegawatdaruratan intraoperatif (${result.event_type}) berhasil dicatat`,
          eventId: result.id,
          eventNumber: result.event_number,
          outcome: result.outcome,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof PerioperativeDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'INTRAOP_EMERGENCY_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 8. Record Surgical Specimen Collection & Chain of Custody
   * POST /api/v1/perioperative/cases/:id/specimens
   */
  recordSpecimen: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'DOC-SURG-01',
        username: 'dr_siti_bedah',
        role: 'ROLE_DOCTOR_DPJP'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await perioperativeClosedLoopService.recordSurgicalSpecimenCollection(
        req.params.id,
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `Pengambilan spesimen bedah (${result.specimen_type}) berhasil dicatat dengan barcode ${result.specimen_container_barcode}`,
          specimenId: result.id,
          trackingNumber: result.specimen_tracking_number,
          specimenBarcode: result.specimen_container_barcode,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof PerioperativeDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'SPECIMEN_LOG_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  }
};
