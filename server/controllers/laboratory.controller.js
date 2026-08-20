/**
 * NurseFlow Enterprise HIS 2026 — Master Laboratory Controller
 * Domain: Laboratory Information System (LIS) & Panic Alert Communication
 * Standards: Canonical JSON Response Envelope ({ data, meta } / { error, meta })
 */

import { laboratoryApplicationService, LaboratoryDomainError } from '../services/laboratoryApplication.service.js';

export const laboratoryController = {
  /**
   * Generate Specimens for CPOE Order
   * POST /api/v1/laboratory/specimens/generate
   */
  generateSpecimens: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'USR-LAB-001',
        username: 'analis_lab',
        role: 'ROLE_LAB_ANALYST'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await laboratoryApplicationService.generateSpecimensForOrder(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `${result.length} spesimen laboratorium berhasil di-generate secara deterministik`,
          count: result.length,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof LaboratoryDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'SPECIMEN_GEN_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Collect Specimen (Phlebotomy)
   * POST /api/v1/laboratory/specimens/:id/collect
   */
  collectSpecimen: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'USR-NURSE-01',
        username: 'perawat_ani',
        role: 'ROLE_NURSE'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await laboratoryApplicationService.collectSpecimen(
        {
          specimenId: req.params.id,
          collectionSite: req.body.collectionSite,
          notes: req.body.notes,
          expectedVersion: req.body.expectedVersion || req.body.version
        },
        actor,
        clientIp,
        correlationId
      );

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          message: `Spesimen [${result.specimen_barcode}] berhasil diambil dan dicatat chain of custody-nya`,
          specimenId: result.id,
          barcode: result.specimen_barcode,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof LaboratoryDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'COLLECTION_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Receive & Accession Specimen
   * POST /api/v1/laboratory/specimens/:id/accession
   */
  accessionSpecimen: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'USR-LAB-001',
        username: 'analis_lab',
        role: 'ROLE_LAB_ANALYST'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await laboratoryApplicationService.receiveAndAccessionSpecimen(
        {
          specimenId: req.params.id,
          specimenQualityFlag: req.body.specimenQualityFlag,
          qualityNotes: req.body.qualityNotes,
          expectedVersion: req.body.expectedVersion || req.body.version
        },
        actor,
        clientIp,
        correlationId
      );

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          message: `Spesimen berhasil diterima di Lab dengan nomor accession [${result.accession_number}]`,
          accessionNumber: result.accession_number,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof LaboratoryDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'ACCESSION_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Enter Analyzer Result
   * POST /api/v1/laboratory/specimens/:id/results
   */
  enterResult: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'USR-LAB-001',
        username: 'analis_lab',
        role: 'ROLE_LAB_ANALYST'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await laboratoryApplicationService.enterAnalyzerResult(
        {
          specimenId: req.params.id,
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
          message: result.is_critical_panic
            ? 'PERINGATAN: Nilai kritis laboratorium terdeteksi dan panic alert telah dipicu!'
            : 'Hasil pemeriksaan laboratorium berhasil disimpan',
          resultId: result.id,
          isCritical: result.is_critical_panic,
          panicAlertId: result.panicAlert?.id || null,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof LaboratoryDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'ENTER_RESULT_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Verify & Release Final Result
   * POST /api/v1/laboratory/results/:id/release
   */
  verifyAndRelease: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'USR-LAB-001',
        username: 'analis_lab',
        role: 'ROLE_LAB_ANALYST'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await laboratoryApplicationService.verifyAndReleaseResult(
        {
          resultId: req.params.id,
          pathologistNotes: req.body.pathologistNotes
        },
        actor,
        clientIp,
        correlationId
      );

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          message: 'Hasil laboratorium resmi diverifikasi dan dirilis ke rekam medis & billing',
          resultId: result.id,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof LaboratoryDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'RELEASE_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Acknowledge Panic Alert
   * POST /api/v1/laboratory/panic-alerts/:id/acknowledge
   */
  acknowledgePanic: async (req, res) => {
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

      const result = await laboratoryApplicationService.acknowledgePanicAlert(
        {
          alertId: req.params.id,
          readBackConfirmed: req.body.readBackConfirmed,
          clinicianFeedback: req.body.clinicianFeedback,
          notes: req.body.notes
        },
        actor,
        clientIp,
        correlationId
      );

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          message: 'Konfirmasi nilai kritis (Read-Back) berhasil dicatat dalam closed-loop audit',
          alertId: result.id,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof LaboratoryDomainError ? 400 : 500);
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
   * Escalate Panic Alert
   * POST /api/v1/laboratory/panic-alerts/:id/escalate
   */
  escalatePanic: async (req, res) => {
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

      const result = await laboratoryApplicationService.escalatePanicAlert(
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
          message: `Nilai kritis berhasil dieskalasi ke level [${result.escalation_level}]`,
          alertId: result.id,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof LaboratoryDomainError ? 400 : 500);
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
   * Get Specimens for Order
   * GET /api/v1/laboratory/orders/:orderId/specimens
   */
  getSpecimensByOrder: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const specimens = await laboratoryApplicationService.getSpecimensByOrder(req.params.orderId);
      return res.status(200).json({
        success: true,
        count: specimens.length,
        data: specimens,
        meta: { orderId: req.params.orderId, requestId, correlationId, timestamp }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof LaboratoryDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'GET_SPECIMENS_FAILED',
          message: err.message
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  }
};
